import { prisma } from "./prisma";
import { phoneDigits } from "./order-access";

export function normalizeBlockEmail(email: unknown) {
  const value = String(email || "").trim().toLowerCase();
  if (!value || !value.includes("@")) return null;
  return value;
}

/** Store last 10 digits for consistent matching. */
export function normalizeBlockPhone(phone: unknown) {
  const digits = phoneDigits(String(phone || ""));
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

export async function findOrderBlock(email: string | null, phone: string) {
  const emailKey = email ? normalizeBlockEmail(email) : null;
  const phoneKey = normalizeBlockPhone(phone);
  if (!emailKey && !phoneKey) return null;

  const or: { email?: string; phone?: string }[] = [];
  if (emailKey) or.push({ email: emailKey });
  if (phoneKey) or.push({ phone: phoneKey });
  if (!or.length) return null;

  return prisma.orderBlock.findFirst({ where: { OR: or } });
}
