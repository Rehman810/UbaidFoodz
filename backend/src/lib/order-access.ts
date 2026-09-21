import { Role } from "@prisma/client";
import { AuthUser } from "../middleware/auth";

type OrderAccess = {
  customerId: string | null;
  riderId: string | null;
  guestAccessToken: string | null;
};

export function canAccessOrder(order: OrderAccess, user?: AuthUser, token?: string | null) {
  if (user?.role === Role.ADMIN) return true;
  if (user && order.customerId && order.customerId === user.id) return true;
  if (user && order.riderId && order.riderId === user.id) return true;
  if (token && order.guestAccessToken && token === order.guestAccessToken) return true;
  return false;
}

export function stripGuestToken<T extends { guestAccessToken?: string | null }>(order: T) {
  const { guestAccessToken: _guestAccessToken, ...rest } = order;
  return rest;
}
