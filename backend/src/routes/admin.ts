import { Router } from "express";
import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminRouter = Router();

adminRouter.get("/stats", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [todayOrders, todayRevenueAgg, pending, preparing, out, riders, menuCount] =
    await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: start }, status: { not: OrderStatus.CANCELLED } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: start },
          status: { not: OrderStatus.CANCELLED },
        },
      }),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.PREPARING } }),
      prisma.order.count({ where: { status: OrderStatus.OUT_FOR_DELIVERY } }),
      prisma.user.findMany({
        where: { role: Role.RIDER },
        select: { id: true, name: true, phone: true },
      }),
      prisma.menuItem.count(),
    ]);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - i);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    const [count, sum] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: from, lt: to },
          status: { not: OrderStatus.CANCELLED },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: from, lt: to },
          status: { not: OrderStatus.CANCELLED },
        },
      }),
    ]);
    days.push({
      date: from.toISOString().slice(0, 10),
      label: from.toLocaleDateString("en-PK", { weekday: "short" }),
      orders: count,
      revenue: Number(sum._sum.total || 0),
    });
  }

  res.json({
    todayOrders,
    todayRevenue: Number(todayRevenueAgg._sum.total || 0),
    pending,
    preparing,
    outForDelivery: out,
    menuCount,
    riders,
    chart: days,
  });
});
