export type Role = "CUSTOMER" | "ADMIN" | "RIDER";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
};

export type MenuItemOption = {
  id: string;
  name: string;
  price: string | number;
  discountPrice?: string | number | null;
  sortOrder: number;
};

export type MenuItemOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  sortOrder: number;
  options: MenuItemOption[];
};

export type MenuItemAddon = {
  id: string;
  name: string;
  price: string | number;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string | number;
  discountPrice?: string | number | null;
  effectivePrice?: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  optionGroups?: MenuItemOptionGroup[];
  addons?: MenuItemAddon[];
  createdAt?: string;
  updatedAt?: string;
};

export type StoreSettings = {
  id: string;
  phone: string;
  whatsapp: string;
  address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  minimumOrder: string | number;
  freeDeliveryAbove?: string | number | null;
  deliveryEstimateMin: number;
  pickupEstimateMin: number;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  closedMessage: string;
  forceClosed: boolean;
  autoConfirmOrders: boolean;
  autoAssignRiders: boolean;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
};

export type PromoBanner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type PublicStore = {
  settings: StoreSettings;
  banners: PromoBanner[];
  isOpen: boolean;
  hoursLabel: string;
  closedMessage: string;
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
  optionsLabel?: string;
  instructions?: string;
};

export type FulfillmentType = "DELIVERY" | "PICKUP";

export type DeliveryArea = {
  id: string;
  name: string;
  deliveryCharge: string | number;
  isDelivering: boolean;
  sortOrder: number;
};

export type OrderStatus =
  | "AWAITING_CONFIRMATION"
  | "PENDING"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type Order = {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  guestAccessToken?: string;
  riderId?: string | null;
  status: OrderStatus;
  fulfillmentType?: FulfillmentType;
  deliveryAreaId?: string | null;
  deliveryArea?: { id: string; name: string; deliveryCharge?: string | number } | null;
  subtotal?: string | number;
  deliveryCharge?: string | number;
  total: string | number;
  deliveryAddress: string;
  notes?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  createdAt: string;
  items: OrderItem[];
  rider?: { id: string; name: string; phone?: string | null } | null;
  invoice?: { id: string; invoiceNumber: string } | null;
};

export const CATEGORIES = [
  "Starters",
  "Burgers & Sandwiches",
  "Pizza & Pasta",
  "Biryani & Rice",
  "BBQ & Broast",
  "Karahi & Curries",
  "Sides",
  "Beverages",
  "Desserts",
] as const;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  AWAITING_CONFIRMATION: "Awaiting call",
  PENDING: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const STATUS_FLOW: OrderStatus[] = [
  "AWAITING_CONFIRMATION",
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
