const KEY_PREFIX = "uff_guest_order_";

export function saveGuestOrderToken(orderId: string, token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${KEY_PREFIX}${orderId}`, token);
}

export function getGuestOrderToken(orderId: string) {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(`${KEY_PREFIX}${orderId}`);
}

export function orderApiPath(orderId: string, token?: string | null) {
  if (!token) return `/orders/${orderId}`;
  return `/orders/${orderId}?token=${encodeURIComponent(token)}`;
}

export function invoiceApiPath(orderId: string, token?: string | null) {
  if (!token) return `/invoices/${orderId}/download`;
  return `/invoices/${orderId}/download?token=${encodeURIComponent(token)}`;
}
