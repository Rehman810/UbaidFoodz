import { Router } from "express";
import bcrypt from "bcryptjs";
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

function dayEnd(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

type AnalyticsPeriod = "today" | "week" | "month" | "year";

function parsePeriod(raw: unknown): AnalyticsPeriod {
  if (raw === "week" || raw === "month" || raw === "year") return raw;
  return "today";
}

function periodRange(period: AnalyticsPeriod) {
  const now = new Date();
  const end = dayEnd(now);
  const start = dayStart(now);

  if (period === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
  } else if (period === "month") {
    start.setDate(1);
  } else if (period === "year") {
    start.setMonth(0, 1);
  }

  return { start, end, period };
}

async function buildChart(period: AnalyticsPeriod, start: Date, end: Date) {
  const notCancelled = { status: { not: OrderStatus.CANCELLED } };

  if (period === "today") {
    const buckets = [];
    for (let h = 0; h < 24; h += 2) {
      const from = new Date(start);
      from.setHours(h, 0, 0, 0);
      const to = new Date(start);
      to.setHours(h + 2, 0, 0, 0);
      const [count, sum] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: from, lt: to }, ...notCancelled } }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: from, lt: to }, ...notCancelled },
        }),
      ]);
      const label =
        h === 0
          ? "12am"
          : h < 12
            ? `${h}am`
            : h === 12
              ? "12pm"
              : `${h - 12}pm`;
      buckets.push({
        date: from.toISOString(),
        label,
        orders: count,
        revenue: Number(sum._sum.total || 0),
      });
    }
    return buckets;
  }

  if (period === "week") {
    const buckets = [];
    const weekStart = dayStart(start);
    for (let i = 0; i < 7; i++) {
      const from = new Date(weekStart);
      from.setDate(weekStart.getDate() + i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      const [count, sum] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: from, lt: to }, ...notCancelled } }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: from, lt: to }, ...notCancelled },
        }),
      ]);
      buckets.push({
        date: from.toISOString().slice(0, 10),
        label: from.toLocaleDateString("en-PK", { weekday: "short" }),
        orders: count,
        revenue: Number(sum._sum.total || 0),
      });
    }
    return buckets;
  }

  if (period === "month") {
    const buckets = [];
    const monthStart = dayStart(start);
    const lastDay = end.getDate();
    for (let d = 1; d <= lastDay; d++) {
      const from = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      const [count, sum] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: from, lt: to }, ...notCancelled } }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: from, lt: to }, ...notCancelled },
        }),
      ]);
      buckets.push({
        date: from.toISOString().slice(0, 10),
        label: String(d),
        orders: count,
        revenue: Number(sum._sum.total || 0),
      });
    }
    return buckets;
  }

  const buckets = [];
  const year = start.getFullYear();
  for (let m = 0; m <= end.getMonth(); m++) {
    const from = new Date(year, m, 1);
    const to = new Date(year, m + 1, 1);
    const [count, sum] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: from, lt: to }, ...notCancelled } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: from, lt: to }, ...notCancelled },
      }),
    ]);
    buckets.push({
      date: from.toISOString().slice(0, 10),
      label: from.toLocaleDateString("en-PK", { month: "short" }),
      orders: count,
      revenue: Number(sum._sum.total || 0),
    });
  }
  return buckets;
}

adminRouter.get("/stats", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const start = dayStart();
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);

  const [
    todayOrders,
    todayRevenueAgg,
    monthRevenueAgg,
    monthOrders,
    awaitingConfirmation,
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
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart }, status: { not: OrderStatus.CANCELLED } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: monthStart }, status: { not: OrderStatus.CANCELLED } },
    }),
    prisma.order.count({ where: { status: OrderStatus.AWAITING_CONFIRMATION } }),
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
  const monthRevenue = Number(monthRevenueAgg._sum.total || 0);
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
    monthOrders,
    monthRevenue,
    avgOrderValue: todayOrders ? Math.round(todayRevenue / todayOrders) : 0,
    monthAvgOrderValue: monthOrders ? Math.round(monthRevenue / monthOrders) : 0,
    awaitingConfirmation,
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

adminRouter.get("/analytics", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const period = parsePeriod(req.query.period);
  const { start, end } = periodRange(period);
  const rangeWhere = { createdAt: { gte: start, lte: end } };
  const orderWhere = { ...rangeWhere, status: { not: OrderStatus.CANCELLED } };

  const [orders, revenueAgg, delivered, orderItems, statusCounts, customersInPeriod] = await Promise.all([
    prisma.order.count({ where: orderWhere }),
    prisma.order.aggregate({ _sum: { total: true }, where: orderWhere }),
    prisma.order.count({ where: { ...rangeWhere, status: OrderStatus.DELIVERED } }),
    prisma.orderItem.findMany({
      where: { order: orderWhere },
      select: {
        nameAtOrder: true,
        quantity: true,
        priceAtOrder: true,
        menuItem: { select: { category: true } },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: rangeWhere,
      _count: { status: true },
    }),
    prisma.order.findMany({
      where: orderWhere,
      select: { customerId: true },
      distinct: ["customerId"],
    }),
  ]);

  const revenue = Number(revenueAgg._sum.total || 0);
  const chart = await buildChart(period, start, end);

  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
  const catMap = new Map<string, { revenue: number; orders: number }>();
  for (const row of orderItems) {
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

  const periodLabels: Record<AnalyticsPeriod, string> = {
    today: "Today",
    week: "This week",
    month: "This month",
    year: "This year",
  };

  res.json({
    period,
    periodLabel: periodLabels[period],
    range: {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    },
    revenue,
    orders,
    avgOrderValue: orders ? Math.round(revenue / orders) : 0,
    delivered,
    customers: customersInPeriod.length,
    chart,
    topItems: [...itemMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 8),
    categoryBreakdown: [...catMap.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    statusBreakdown: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])),
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
        select: { id: true, total: true, status: true, createdAt: true, fulfillmentType: true },
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

adminRouter.post("/riders", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { name, email, phone, password } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return res.status(409).json({ error: "An account with this email already exists." });

  const plainPassword = password?.trim() || "demo123";
  if (plainPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const rider = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      passwordHash: await bcrypt.hash(plainPassword, 10),
      role: Role.RIDER,
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  res.status(201).json({
    ...rider,
    activeOrders: [],
    deliveredCount: 0,
    totalAssigned: 0,
  });
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
