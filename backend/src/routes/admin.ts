import { Router } from "express";
import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminRouter = Router();

const orderInclude = {
  items: true,
  rider: { select: { id: true, name: true, phone: true } },
  invoice: true,
  customer: { select: { id: true, name: true, email: true } },
};

function dayStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

adminRouter.get("/stats", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const start = dayStart();

  const [
    todayOrders,
    todayRevenueAgg,
    pending,
    preparing,
    out,
    deliveredToday,
    cancelledToday,
    menuCount,
    customerCount,
    totalOrders,
    totalRevenueAgg,
    riders,
    allOrderItems,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: start }, status: { not: OrderStatus.CANCELLED } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: start }, status: { not: OrderStatus.CANCELLED } },
    }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({ where: { status: OrderStatus.PREPARING } }),
    prisma.order.count({ where: { status: OrderStatus.OUT_FOR_DELIVERY } }),
    prisma.order.count({ where: { createdAt: { gte: start }, status: OrderStatus.DELIVERED } }),
    prisma.order.count({ where: { createdAt: { gte: start }, status: OrderStatus.CANCELLED } }),
    prisma.menuItem.count(),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.order.count({ where: { status: { not: OrderStatus.CANCELLED } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: OrderStatus.CANCELLED } },
    }),
    prisma.user.findMany({
      where: { role: Role.RIDER },
      select: { id: true, name: true, phone: true },
    }),
    prisma.orderItem.findMany({
      select: { nameAtOrder: true, quantity: true, priceAtOrder: true, menuItem: { select: { category: true } } },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),
  ]);

  const todayRevenue = Number(todayRevenueAgg._sum.total || 0);
  const totalRevenue = Number(totalRevenueAgg._sum.total || 0);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const from = dayStart();
    from.setDate(from.getDate() - i);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    const [count, sum] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: from, lt: to }, status: { not: OrderStatus.CANCELLED } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: from, lt: to }, status: { not: OrderStatus.CANCELLED } },
      }),
    ]);
    days.push({
      date: from.toISOString().slice(0, 10),
      label: from.toLocaleDateString("en-PK", { weekday: "short" }),
      orders: count,
      revenue: Number(sum._sum.total || 0),
    });
  }

  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
  const catMap = new Map<string, { revenue: number; orders: number }>();
  for (const row of allOrderItems) {
    const rev = Number(row.priceAtOrder) * row.quantity;
    const cur = itemMap.get(row.nameAtOrder) || { name: row.nameAtOrder, qty: 0, revenue: 0 };
    cur.qty += row.quantity;
    cur.revenue += rev;
    itemMap.set(row.nameAtOrder, cur);
    const cat = row.menuItem?.category || "Other";
    const c = catMap.get(cat) || { revenue: 0, orders: 0 };
    c.revenue += rev;
    c.orders += row.quantity;
    catMap.set(cat, c);
  }

  const topItems = [...itemMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);
  const categoryBreakdown = [...catMap.entries()].map(([category, v]) => ({ category, ...v }));

  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const statusBreakdown = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count.status])
  ) as Record<string, number>;

  const ridersWithStats = await Promise.all(
    riders.map(async (r) => {
      const [active, completedToday] = await Promise.all([
        prisma.order.count({
          where: { riderId: r.id, status: OrderStatus.OUT_FOR_DELIVERY },
        }),
        prisma.order.count({
          where: { riderId: r.id, status: OrderStatus.DELIVERED, createdAt: { gte: start } },
        }),
      ]);
      return { ...r, activeDeliveries: active, completedToday };
    })
  );

  res.json({
    todayOrders,
    todayRevenue,
    avgOrderValue: todayOrders ? Math.round(todayRevenue / todayOrders) : 0,
    pending,
    preparing,
    outForDelivery: out,
    deliveredToday,
    cancelledToday,
    menuCount,
    customerCount,
    totalOrders,
    totalRevenue,
    riders: ridersWithStats,
    chart: days,
    topItems,
    categoryBreakdown,
    statusBreakdown,
    recentOrders,
  });
});

adminRouter.get("/customers", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      orders: {
        select: { id: true, total: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      orderCount: c.orders.length,
      totalSpent: c.orders
        .filter((o) => o.status !== OrderStatus.CANCELLED)
        .reduce((s, o) => s + Number(o.total), 0),
      lastOrder: c.orders[0] || null,
    }))
  );
});

adminRouter.get("/riders", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const riders = await prisma.user.findMany({
    where: { role: Role.RIDER },
    select: { id: true, name: true, email: true, phone: true },
  });

  const result = await Promise.all(
    riders.map(async (r) => {
      const [active, delivered, total] = await Promise.all([
        prisma.order.findMany({
          where: { riderId: r.id, status: OrderStatus.OUT_FOR_DELIVERY },
          include: { items: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({ where: { riderId: r.id, status: OrderStatus.DELIVERED } }),
        prisma.order.count({ where: { riderId: r.id } }),
      ]);
      return { ...r, activeOrders: active, deliveredCount: delivered, totalAssigned: total };
    })
  );

  res.json(result);
});
