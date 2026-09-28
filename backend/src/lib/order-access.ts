import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AuthUser } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "ubaid-fast-foodz-demo-secret";

type OrderAccess = {
  id?: string;
  customerId: string | null;
  riderId: string | null;
  guestAccessToken: string | null;
};

export function signOrderViewToken(orderId: string) {
  return jwt.sign({ oid: orderId, typ: "order-view" }, JWT_SECRET, { expiresIn: "7d" });
}

function verifyOrderViewToken(token: string, orderId: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { oid?: string; typ?: string };
    return payload.typ === "order-view" && payload.oid === orderId;
  } catch {
    return false;
  }
}

export function canAccessOrder(order: OrderAccess, user?: AuthUser, token?: string | null) {
  if (user?.role === Role.ADMIN || user?.role === Role.CHEF || user?.role === Role.CASHIER) {
    return true;
  }
  if (user && order.customerId && order.customerId === user.id) return true;
  if (user && order.riderId && order.riderId === user.id) return true;
  if (token && order.id && verifyOrderViewToken(token, order.id)) return true;
  if (token && order.guestAccessToken && token === order.guestAccessToken) return true;
  return false;
}

export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function phonesMatch(stored: string, input: string) {
  const a = phoneDigits(stored);
  const b = phoneDigits(input);
  if (a.length < 10 || b.length < 10) return false;
  return a.slice(-10) === b.slice(-10);
}

export function stripGuestToken<T extends { guestAccessToken?: string | null }>(order: T) {
  const { guestAccessToken: _guestAccessToken, ...rest } = order;
  return rest;
}
