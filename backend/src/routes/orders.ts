import { Router } from "express";
import crypto from "crypto";
import { FulfillmentType, OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { canAccessOrder, stripGuestToken } from "../lib/order-access";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth";
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
    fulfillmentType,
    deliveryAreaId,
  } = req.body as {
    items?: {
      menuItemId: string;
      quantity: number;
      sizeId?: string;
      addonIds?: string[];
    }[];
    deals?: { dealId: string; quantity: number }[];
    deliveryAddress?: string;
    notes?: string;
    customerName?: string;
    customerPhone?: string;
    fulfillmentType?: FulfillmentType;
    deliveryAreaId?: string;
  };
  const cartItems = items ?? [];
  const cartDeals = deals ?? [];
  const phone = normalizePhone(String(customerPhone || ""));
  const trimmedName = String(customerName || "").trim();
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
    include: { sizes: true, addons: true },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const lines: {
    menuItemId: string;
    quantity: number;
    priceAtOrder: number;
    nameAtOrder: string;
    optionsLabel: string;
  }[] = [];
  let subtotal = 0;

  for (const row of cartItems) {
    const menu = byId.get(row.menuItemId);
    if (!menu || !menu.isAvailable) {
      return res.status(400).json({ error: `Item unavailable: ${row.menuItemId}` });
    }
    const qty = Math.max(1, Number(row.quantity) || 1);
    let unitPrice = effectiveItemPrice(menu);
    const labels: string[] = [];

    if (row.sizeId) {
      const size = menu.sizes.find((s) => s.id === row.sizeId);
      if (!size) return res.status(400).json({ error: "Invalid size selected." });
      unitPrice = Number(size.price);
      labels.push(size.name);
    }

    const addonIds = row.addonIds ?? [];
    for (const addonId of addonIds) {
      const addon = menu.addons.find((a) => a.id === addonId);
      if (!addon) return res.status(400).json({ error: "Invalid add-on selected." });
      unitPrice += Number(addon.price);
      labels.push(addon.name);
    }

    subtotal += unitPrice * qty;
    lines.push({
      menuItemId: menu.id,
      quantity: qty,
      priceAtOrder: unitPrice,
      nameAtOrder: menu.name,
      optionsLabel: labels.join(", "),
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
      items: { create: lines },
    },
    include,
  });

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

ordersRouter.patch("/:id/status", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const status = req.body.status as OrderStatus;
  if (!Object.values(OrderStatus).includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include,
  });
  if (status === OrderStatus.DELIVERED) {
    await generateInvoicePdf(order.id);
  }
  const fresh = await prisma.order.findUnique({ where: { id: order.id }, include });
  res.json(fresh);
});

ordersRouter.patch("/:id/assign", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { riderId } = req.body as { riderId?: string };
  if (!riderId) return res.status(400).json({ error: "riderId required" });
  const rider = await prisma.user.findFirst({ where: { id: riderId, role: Role.RIDER } });
  if (!rider) return res.status(400).json({ error: "Rider not found" });
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { riderId, status: OrderStatus.OUT_FOR_DELIVERY },
    include,
  });
  res.json(order);
});
