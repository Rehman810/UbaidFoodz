import { Router } from "express";
import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendOrderDeliveredEmail } from "../lib/email";
import { generateInvoicePdf } from "../lib/invoice";
import { emitOrderChange } from "../lib/realtime";

export const riderRouter = Router();

const include = {
  items: true,
  invoice: true,
};

riderRouter.get("/orders", requireAuth, requireRole(Role.RIDER), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      riderId: req.user!.id,
      status: {
        in: [OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
      },
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
  if (action === "PICKED_UP" && order.status !== OrderStatus.PREPARING) {
    return res.status(400).json({ error: "Order is not ready for pickup." });
  }
  if (action === "DELIVERED" && order.status !== OrderStatus.OUT_FOR_DELIVERY) {
    return res.status(400).json({ error: "Mark the order picked up before delivering." });
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
    const withItems = await prisma.order.findUnique({ where: { id: updated.id }, include });
    if (withItems) void sendOrderDeliveredEmail(withItems);
  }
  const fresh = await prisma.order.findUnique({ where: { id: updated.id }, include });
  emitOrderChange("order:updated", updated);
  res.json(fresh);
});
