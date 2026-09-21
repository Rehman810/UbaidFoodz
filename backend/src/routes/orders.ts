import { Router } from "express";
import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateInvoicePdf } from "../lib/invoice";

export const ordersRouter = Router();

const include = {
  items: true,
  rider: { select: { id: true, name: true, phone: true } },
  invoice: true,
};

async function nextOrderNumber() {
  const last = await prisma.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const n = last ? parseInt(last.orderNumber.replace(/\D/g, ""), 10) || 1000 : 1000;
  return `UF-${n + 1}`;
}

ordersRouter.post("/", requireAuth, requireRole(Role.CUSTOMER, Role.ADMIN), async (req, res) => {
  const { items, deals, deliveryAddress, notes, customerName, customerPhone } = req.body as {
    items?: { menuItemId: string; quantity: number }[];
    deals?: { dealId: string; quantity: number }[];
    deliveryAddress?: string;
    notes?: string;
    customerName?: string;
    customerPhone?: string;
  };
  const cartItems = items ?? [];
  const cartDeals = deals ?? [];
  if ((!cartItems.length && !cartDeals.length) || !deliveryAddress || !customerName || !customerPhone) {
    return res.status(400).json({ error: "Cart, name, phone and address are required." });
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: cartItems.map((i) => i.menuItemId) } },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const lines: {
    menuItemId: string;
    quantity: number;
    priceAtOrder: number;
    nameAtOrder: string;
  }[] = [];
  let total = 0;

  for (const row of cartItems) {
    const menu = byId.get(row.menuItemId);
    if (!menu || !menu.isAvailable) {
      return res.status(400).json({ error: `Item unavailable: ${row.menuItemId}` });
    }
    const qty = Math.max(1, Number(row.quantity) || 1);
    const price = Number(menu.price);
    total += price * qty;
    lines.push({
      menuItemId: menu.id,
      quantity: qty,
      priceAtOrder: price,
      nameAtOrder: menu.name,
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
    total += dealPrice;

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
      });
    }
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: await nextOrderNumber(),
      customerId: req.user!.id,
      total,
      deliveryAddress,
      notes,
      customerName,
      customerPhone,
      items: { create: lines },
    },
    include,
  });
  res.status(201).json(order);
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

ordersRouter.get("/:id", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { ...include, customer: { select: { id: true, name: true, email: true } } },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  const u = req.user!;
  const allowed =
    u.role === Role.ADMIN ||
    order.customerId === u.id ||
    order.riderId === u.id;
  if (!allowed) return res.status(403).json({ error: "Forbidden" });
  res.json(order);
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
