import { Router } from "express";
import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateInvoicePdf } from "../lib/invoice";

export const riderRouter = Router();

const include = {
  items: true,
  invoice: true,
};

riderRouter.get("/orders", requireAuth, requireRole(Role.RIDER), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      riderId: req.user!.id,
      status: { in: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED] },
    },
    include,
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

riderRouter.patch("/orders/:id/status", requireAuth, requireRole(Role.RIDER), async (req, res) => {
  const action = req.body.action as "PICKED_UP" | "DELIVERED";
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.riderId !== req.user!.id) {
    return res.status(404).json({ error: "Order not assigned to you." });
  }
  let status: OrderStatus = order.status;
  if (action === "PICKED_UP") status = OrderStatus.OUT_FOR_DELIVERY;
  if (action === "DELIVERED") status = OrderStatus.DELIVERED;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status },
    include,
  });
  if (status === OrderStatus.DELIVERED) {
    await generateInvoicePdf(updated.id);
  }
  const fresh = await prisma.order.findUnique({ where: { id: updated.id }, include });
  res.json(fresh);
});
