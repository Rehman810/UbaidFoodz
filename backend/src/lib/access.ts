export type AppRole = "ADMIN" | "CASHIER" | "CHEF" | "RIDER" | "CUSTOMER" | "ANONYMOUS";

export type AccessAction =
  | "dashboard"
  | "analytics"
  | "kitchen"
  | "pos"
  | "orders.read"
  | "orders.status"
  | "orders.assign"
  | "customers.read"
  | "customers.block"
  | "menu.write"
  | "areas.write"
  | "staff"
  | "settings"
  | "rider.own";

const MATRIX: Record<AccessAction, AppRole[]> = {
  dashboard: ["ADMIN"],
  analytics: ["ADMIN"],
  kitchen: ["ADMIN", "CHEF", "CASHIER"],
  pos: ["ADMIN", "CASHIER"],
  "orders.read": ["ADMIN", "CHEF", "CASHIER"],
  "orders.status": ["ADMIN", "CHEF", "CASHIER"],
  "orders.assign": ["ADMIN"],
  "customers.read": ["ADMIN", "CASHIER"],
  "customers.block": ["ADMIN"],
  "menu.write": ["ADMIN"],
  "areas.write": ["ADMIN"],
  staff: ["ADMIN"],
  settings: ["ADMIN"],
  "rider.own": ["RIDER"],
};

export function canAccess(role: AppRole, action: AccessAction) {
  return MATRIX[action].includes(role);
}

export const ACCESS_MATRIX = MATRIX;
