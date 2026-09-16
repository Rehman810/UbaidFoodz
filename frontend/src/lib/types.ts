export type Role = "CUSTOMER" | "ADMIN" | "RIDER";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string | number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  quantity: number;
  priceAtOrder: string | number;
  nameAtOrder: string;
};

export type OrderStatus = "PENDING" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  riderId?: string | null;
  status: OrderStatus;
  total: string | number;
  deliveryAddress: string;
  notes?: string | null;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  items: OrderItem[];
  rider?: { id: string; name: string; phone?: string | null } | null;
  invoice?: { id: string; invoiceNumber: string } | null;
};

export const CATEGORIES = ["Starters", "Main Course", "Beverages", "Desserts"] as const;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
