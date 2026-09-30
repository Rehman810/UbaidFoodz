import { FulfillmentType, OrderStatus, Role } from "@prisma/client";
import { normalizeBlockEmail, normalizeBlockPhone } from "./blocklist";
import { prisma } from "./prisma";

export function customerContactKey(phone: string, email: string | null | undefined) {
  const phoneKey = normalizeBlockPhone(phone);
  if (phoneKey) return `phone:${phoneKey}`;
  const emailKey = normalizeBlockEmail(email);
  if (emailKey) return `email:${emailKey}`;
  return null;
}

export type CustomerDirectoryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  isGuest: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrder: {
    id: string;
    total: number;
    status: OrderStatus;
    createdAt: Date;
    fulfillmentType: FulfillmentType;
  } | null;
};

type GuestAgg = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
  lastOrder: CustomerDirectoryRow["lastOrder"];
};

export type CustomerSort = "spent" | "orders" | "name" | "recent";

export async function buildCustomerDirectory(): Promise<CustomerDirectoryRow[]> {
  const [users, orderCounts, orderSpent, guestOrders] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { customerId: { not: null } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { customerId: { not: null }, status: { not: OrderStatus.CANCELLED } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { customerId: null },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        fulfillmentType: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const countByUser = new Map(
    orderCounts.filter((row) => row.customerId).map((row) => [row.customerId!, row._count._all])
  );
  const spentByUser = new Map(
    orderSpent.filter((row) => row.customerId).map((row) => [row.customerId!, Number(row._sum.total ?? 0)])
  );

  const customerIds = users.map((u) => u.id);
  const lastOrders = customerIds.length
    ? await prisma.order.findMany({
        where: { customerId: { in: customerIds } },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          fulfillmentType: true,
          customerId: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const lastByUser = new Map<string, (typeof lastOrders)[0]>();
  for (const order of lastOrders) {
    if (order.customerId && !lastByUser.has(order.customerId)) lastByUser.set(order.customerId, order);
  }

  const registered: CustomerDirectoryRow[] = users.map((user) => {
    const last = lastByUser.get(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      isGuest: false,
      orderCount: countByUser.get(user.id) ?? 0,
      totalSpent: spentByUser.get(user.id) ?? 0,
      lastOrder: last
        ? {
            id: last.id,
            total: Number(last.total),
            status: last.status,
            createdAt: last.createdAt,
            fulfillmentType: last.fulfillmentType,
          }
        : null,
    };
  });

  const guestByKey = new Map<string, GuestAgg>();
  for (const order of guestOrders) {
    const key = customerContactKey(order.customerPhone, order.customerEmail);
    if (!key) continue;

    let guest = guestByKey.get(key);
    if (!guest) {
      guest = {
        id: `guest:${key}`,
        name: order.customerName,
        email: order.customerEmail || "",
        phone: order.customerPhone,
        createdAt: order.createdAt,
        orderCount: 0,
        totalSpent: 0,
        lastOrder: null,
      };
      guestByKey.set(key, guest);
    }

    guest.orderCount += 1;
    if (order.status !== OrderStatus.CANCELLED) guest.totalSpent += Number(order.total);
    if (!guest.lastOrder || order.createdAt > guest.lastOrder.createdAt) {
      guest.lastOrder = {
        id: order.id,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
        fulfillmentType: order.fulfillmentType,
      };
    }
    if (order.createdAt > guest.createdAt) {
      guest.createdAt = order.createdAt;
      guest.name = order.customerName;
      if (order.customerEmail) guest.email = order.customerEmail;
    }
  }

  const guests = [...guestByKey.values()].map((guest) => ({
    id: guest.id,
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    createdAt: guest.createdAt,
    isGuest: true,
    orderCount: guest.orderCount,
    totalSpent: guest.totalSpent,
    lastOrder: guest.lastOrder,
  }));

  return [...registered, ...guests].filter((c) => c.orderCount > 0 || !c.isGuest);
}

export function filterCustomers(
  customers: CustomerDirectoryRow[],
  search: string,
  sort: CustomerSort
) {
  let list = [...customers];
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }

  list.sort((a, b) => {
    if (sort === "spent") return b.totalSpent - a.totalSpent;
    if (sort === "orders") return b.orderCount - a.orderCount;
    if (sort === "name") return a.name.localeCompare(b.name);
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return list;
}

export function paginateCustomers(customers: CustomerDirectoryRow[], limit: number, offset: number) {
  const total = customers.length;
  const page = customers.slice(offset, offset + limit);
  return { customers: page, total, limit, offset };
}

export function customerDirectoryStats(customers: CustomerDirectoryRow[]) {
  const withOrders = customers.filter((c) => c.orderCount > 0);
  const totalRevenue = withOrders.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = withOrders.reduce((sum, c) => sum + c.orderCount, 0);
  const repeat = withOrders.filter((c) => c.orderCount > 1).length;
  const topSpender = [...withOrders].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  return {
    count: customers.length,
    totalRevenue,
    totalOrders,
    avgSpend: withOrders.length ? totalRevenue / withOrders.length : 0,
    repeatRate: withOrders.length ? Math.round((repeat / withOrders.length) * 100) : 0,
    topSpenderId: topSpender?.id,
  };
}

export async function listCustomerOrders(customerId: string, limit: number, offset: number) {
  if (customerId.startsWith("guest:")) {
    const contactKey = customerId.slice("guest:".length);
    const guestOrders = await prisma.order.findMany({
      where: { customerId: null },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        fulfillmentType: true,
        customerPhone: true,
        customerEmail: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const filtered = guestOrders.filter(
      (order) => customerContactKey(order.customerPhone, order.customerEmail) === contactKey
    );
    return {
      orders: filtered.slice(offset, offset + limit).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
        fulfillmentType: order.fulfillmentType,
      })),
      total: filtered.length,
      limit,
      offset,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: customerId },
    select: { id: true, email: true, phone: true },
  });
  if (!user) return null;

  const phoneKey = normalizeBlockPhone(user.phone);
  const emailKey = normalizeBlockEmail(user.email);
  const where = {
    OR: [
      { customerId: user.id },
      ...(phoneKey ? [{ customerId: null as null, customerPhone: { contains: phoneKey.slice(-10) } }] : []),
      ...(emailKey ? [{ customerId: null as null, customerEmail: { equals: emailKey, mode: "insensitive" as const } }] : []),
    ],
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        fulfillmentType: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((order) => ({
      ...order,
      total: Number(order.total),
    })),
    total,
    limit,
    offset,
  };
}
