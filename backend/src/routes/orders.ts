import { Router } from "express";
import crypto from "crypto";
import { FulfillmentType, OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { canAccessOrder, phonesMatch, stripGuestToken } from "../lib/order-access";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth";
import {
  sendOrderConfirmedEmail,
  sendOrderDeliveredEmail,
  sendOrderPlacedEmail,
} from "../lib/email";
import { generateInvoicePdf } from "../lib/invoice";
import { getStoreSettings } from "../lib/settings-data";
import { effectiveItemPrice, isStoreOpen } from "../lib/store-settings";

export const ordersRouter = Router();

const include = {
  items: true,
  rider: { select: { id: true, name: true, phone: true } },
  invoice: true,
  deliveryArea: { select: { id: true, name: true, deliveryCharge: true } },
};

async function nextOrderNumber() {
  const last = await prisma.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const n = last ? parseInt(last.orderNumber.replace(/\D/g, ""), 10) || 1000 : 1000;
  return `UF-${n + 1}`;
}

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "").trim();
  return cleaned.length >= 10 ? cleaned : "";
}

function normalizeEmail(email: unknown) {
  const value = String(email || "").trim().toLowerCase();
  if (!value || !value.includes("@")) return null;
  return value;
}

ordersRouter.post("/", optionalAuth, async (req, res) => {
  const storeSettings = await getStoreSettings();
  if (!isStoreOpen(storeSettings)) {
    return res.status(400).json({ error: storeSettings.closedMessage });
  }

  const pickupAddress = `Ubaid Fast Foodz — ${storeSettings.address}`;

  const {
    items,
    deals,
    deliveryAddress,
    notes,
    customerName,
    customerPhone,
    customerEmail,
    fulfillmentType,
    deliveryAreaId,
  } = req.body as {
    items?: {
      menuItemId: string;
      quantity: number;
      sizeId?: string;
      optionIds?: string[];
      addonIds?: string[];
      instructions?: string;
    }[];
    deals?: { dealId: string; quantity: number }[];
    deliveryAddress?: string;
    notes?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    fulfillmentType?: FulfillmentType;
    deliveryAreaId?: string;
  };
  const cartItems = items ?? [];
  const cartDeals = deals ?? [];
  const phone = normalizePhone(String(customerPhone || ""));
  const email = normalizeEmail(customerEmail);
  const trimmedName = String(customerName || "").trim();
  const initialStatus = storeSettings.autoConfirmOrders
    ? OrderStatus.PENDING
    : OrderStatus.AWAITING_CONFIRMATION;
  const mode: FulfillmentType =
    fulfillmentType === FulfillmentType.PICKUP ? FulfillmentType.PICKUP : FulfillmentType.DELIVERY;
  const trimmedAddress =
    mode === FulfillmentType.PICKUP ? pickupAddress : String(deliveryAddress || "").trim();

  if ((!cartItems.length && !cartDeals.length) || !trimmedName || !phone) {
    return res.status(400).json({ error: "Cart, name and phone are required." });
  }
  if (mode === FulfillmentType.DELIVERY && !trimmedAddress) {
    return res.status(400).json({ error: "Delivery address is required." });
  }
  if (mode === FulfillmentType.DELIVERY && !deliveryAreaId) {
    return res.status(400).json({ error: "Please select a delivery area." });
  }

  let deliveryCharge = 0;
  let areaId: string | null = null;
  if (mode === FulfillmentType.DELIVERY) {
    const area = await prisma.deliveryArea.findUnique({ where: { id: deliveryAreaId } });
    if (!area || !area.isDelivering) {
      return res.status(400).json({ error: "Selected area is not available for delivery." });
    }
    deliveryCharge = Number(area.deliveryCharge);
    areaId = area.id;
  }

  const user = req.user;
  const isRegisteredCustomer = user?.role === Role.CUSTOMER || user?.role === Role.ADMIN;
  const guestAccessToken = isRegisteredCustomer ? null : crypto.randomBytes(32).toString("base64url");

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: cartItems.map((i) => i.menuItemId) } },
    include: {
      sizes: true,
      addons: true,
      optionGroups: { include: { options: true } },
    },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const lines: {
    menuItemId: string;
    quantity: number;
    priceAtOrder: number;
    nameAtOrder: string;
    optionsLabel: string;
    instructions: string;
  }[] = [];
  let subtotal = 0;

  for (const row of cartItems) {
    const menu = byId.get(row.menuItemId);
    if (!menu || !menu.isAvailable) {
      return res.status(400).json({ error: `Item unavailable: ${row.menuItemId}` });
    }
    const qty = Math.max(1, Number(row.quantity) || 1);
    const labels: string[] = [];
    const allOptions = [
      ...menu.optionGroups.flatMap((g) => g.options),
      ...menu.sizes.map((s) => ({ ...s, discountPrice: null as null })),
    ];
    const optionIds = row.optionIds?.length
      ? row.optionIds
      : row.sizeId
        ? [row.sizeId]
        : [];

    const hasGroups = menu.optionGroups.length > 0 || menu.sizes.length > 0;
    let unitPrice = effectiveItemPrice(menu);

    if (hasGroups && optionIds.length) {
      unitPrice = 0;
      for (const optId of optionIds) {
        const opt = allOptions.find((o) => o.id === optId);
        if (!opt) return res.status(400).json({ error: "Invalid option selected." });
        const optPrice =
          opt.discountPrice != null ? Number(opt.discountPrice) : Number(opt.price);
        unitPrice += optPrice;
        labels.push(opt.name);
      }
    } else if (hasGroups) {
      const required = menu.optionGroups.filter((g) => g.required);
      if (required.length > 0) {
        return res.status(400).json({ error: `Please select options for ${menu.name}.` });
      }
    }

    const addonIds = row.addonIds ?? [];
    for (const addonId of addonIds) {
      const addon = menu.addons.find((a) => a.id === addonId);
      if (!addon) return res.status(400).json({ error: "Invalid add-on selected." });
      unitPrice += Number(addon.price);
      labels.push(addon.name);
    }

    const instructions = String(row.instructions || "").trim().slice(0, 500);

    subtotal += unitPrice * qty;
    lines.push({
      menuItemId: menu.id,
      quantity: qty,
      priceAtOrder: unitPrice,
      nameAtOrder: menu.name,
      optionsLabel: labels.join(", "),
      instructions,
    });
  }

  for (const row of cartDeals) {
    const deal = await prisma.deal.findUnique({
      where: { id: row.dealId },
      include: {
        items: { include: { menuItem: true } },
      },
    });
    if (!deal || !deal.isActive) {
      return res.status(400).json({ error: "Deal unavailable." });
    }
    const dealQty = Math.max(1, Number(row.quantity) || 1);
    const dealPrice = Number(deal.dealPrice) * dealQty;
    subtotal += dealPrice;

    const regular = deal.items.reduce(
      (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
      0
    );

    for (const item of deal.items) {
      if (!item.menuItem.isAvailable) {
        return res.status(400).json({ error: `${item.menuItem.name} in this deal is unavailable.` });
      }
      const share =
        regular > 0
          ? (Number(item.menuItem.price) * item.quantity) / regular
          : 1 / deal.items.length;
      const lineTotal = dealPrice * share;
      const lineQty = item.quantity * dealQty;
      lines.push({
        menuItemId: item.menuItemId,
        quantity: lineQty,
        priceAtOrder: lineTotal / lineQty,
        nameAtOrder: `${deal.title} · ${item.menuItem.name}`,
        optionsLabel: "",
        instructions: "",
      });
    }
  }

  const minimumOrder = Number(storeSettings.minimumOrder);
  if (subtotal < minimumOrder) {
    return res.status(400).json({
      error: `Minimum order is Rs ${minimumOrder.toLocaleString("en-PK")}. Add more items to continue.`,
    });
  }

  if (
    mode === FulfillmentType.DELIVERY &&
    storeSettings.freeDeliveryAbove != null &&
    subtotal >= Number(storeSettings.freeDeliveryAbove)
  ) {
    deliveryCharge = 0;
  }

  const grandTotal = subtotal + deliveryCharge;

  const order = await prisma.order.create({
    data: {
      orderNumber: await nextOrderNumber(),
      customerId: isRegisteredCustomer ? user!.id : null,
      guestAccessToken,
      fulfillmentType: mode,
      deliveryAreaId: areaId,
      subtotal,
      deliveryCharge,
      total: grandTotal,
      deliveryAddress: trimmedAddress,
      notes: notes ? String(notes).trim() : null,
      customerName: trimmedName,
      customerPhone: phone,
      customerEmail: email,
      status: initialStatus,
      items: { create: lines },
    },
    include,
  });

  void sendOrderPlacedEmail(order, storeSettings.autoConfirmOrders);

  const safeOrder = stripGuestToken(order);
  if (guestAccessToken) {
    return res.status(201).json({ ...safeOrder, guestAccessToken });
  }
  res.status(201).json(safeOrder);
});

ordersRouter.get("/mine", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.user!.id },
    include,
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

ordersRouter.get("/", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { ...include, customer: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

ordersRouter.post("/track", async (req, res) => {
  const { orderNumber, phone } = req.body as { orderNumber?: string; phone?: string };
  const num = String(orderNumber || "").trim().toUpperCase();
  const phoneInput = String(phone || "").trim();
  if (!num || !phoneInput) {
    return res.status(400).json({ error: "Order number and phone are required." });
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber: num },
    include,
  });
  if (!order) {
    return res.status(404).json({ error: "No order found with that number." });
  }
  if (!phonesMatch(order.customerPhone, phoneInput)) {
    return res.status(403).json({ error: "Phone number does not match this order." });
  }

  const payload = stripGuestToken(order);
  if (order.guestAccessToken) {
    return res.json({ ...payload, guestAccessToken: order.guestAccessToken });
  }
  res.json(payload);
});

ordersRouter.get("/:id", optionalAuth, async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : null;
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { ...include, customer: { select: { id: true, name: true, email: true } } },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (!canAccessOrder(order, req.user, token)) {
    return res.status(403).json({ error: "You do not have access to this order." });
  }
  res.json(stripGuestToken(order));
});

ordersRouter.patch("/:id/confirm", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const existing = await prisma.order.findUnique({ where: { id: req.params.id }, include });
  if (!existing) return res.status(404).json({ error: "Order not found." });
  if (existing.status !== OrderStatus.AWAITING_CONFIRMATION) {
    return res.status(400).json({ error: "Only unconfirmed orders can be confirmed." });
  }
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: OrderStatus.PENDING },
    include,
  });
  void sendOrderConfirmedEmail(order);
  res.json(order);
});

ordersRouter.patch("/:id/status", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const status = req.body.status as OrderStatus;
  if (!Object.values(OrderStatus).includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Order not found." });

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include,
  });

  if (
    existing.status === OrderStatus.AWAITING_CONFIRMATION &&
    status === OrderStatus.PENDING
  ) {
    void sendOrderConfirmedEmail(order);
  }
  if (status === OrderStatus.DELIVERED) {
    await generateInvoicePdf(order.id);
    void sendOrderDeliveredEmail(order);
  }

  const fresh = await prisma.order.findUnique({ where: { id: order.id }, include });
  res.json(fresh);
});

ordersRouter.patch("/:id/assign", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { riderId } = req.body as { riderId?: string };
  if (!riderId) return res.status(400).json({ error: "riderId required" });
  const rider = await prisma.user.findFirst({ where: { id: riderId, role: Role.RIDER } });
  if (!rider) return res.status(400).json({ error: "Rider not found" });
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Order not found." });
  if (existing.status === OrderStatus.AWAITING_CONFIRMATION) {
    return res.status(400).json({ error: "Confirm the order before assigning a rider." });
  }
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { riderId, status: OrderStatus.OUT_FOR_DELIVERY },
    include,
  });
  res.json(order);
});
