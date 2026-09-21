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
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  tagline?: string;
  imageUrl?: string;
  sortOrder: number;
  createdAt: string;
};

export type DealItem = {
  id: string;
  menuItemId: string;
  quantity: number;
  menuItem: Pick<MenuItem, "id" | "name" | "price" | "imageUrl" | "category">;
};

export type Deal = {
  id: string;
  title: string;
  description: string;
  dealPrice: string | number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  items: DealItem[];
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

/** Kanban / pipeline: orders may only advance, never move back. */
export function canMoveForward(from: OrderStatus, to: OrderStatus): boolean {
  const fromIdx = STATUS_FLOW.indexOf(from);
  const toIdx = STATUS_FLOW.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx > fromIdx;
}

export function isBackwardMove(from: OrderStatus, to: OrderStatus): boolean {
  const fromIdx = STATUS_FLOW.indexOf(from);
  const toIdx = STATUS_FLOW.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx < fromIdx;
}

export function forwardStatusOptions(current: OrderStatus) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0) return STATUS_FLOW;
  return STATUS_FLOW.slice(idx);
}
