import { Order, OrderStatus } from "./types";

export type Rider = {
  id: string;
  name: string;
  phone?: string | null;
  activeDeliveries?: number;
  completedToday?: number;
};

export type AdminStats = {
  todayOrders: number;
  todayRevenue: number;
  avgOrderValue: number;
  pending: number;
  preparing: number;
  outForDelivery: number;
  deliveredToday: number;
  cancelledToday: number;
  menuCount: number;
  customerCount: number;
  totalOrders: number;
  totalRevenue: number;
  riders: Rider[];
  chart: { date: string; label: string; orders: number; revenue: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
  categoryBreakdown: { category: string; revenue: number; orders: number }[];
  statusBreakdown: Partial<Record<OrderStatus, number>>;
  recentOrders: Order[];
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: { id: string; total: string | number; status: OrderStatus; createdAt: string } | null;
};

export type AdminRider = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  activeOrders: Order[];
  deliveredCount: number;
  totalAssigned: number;
};
