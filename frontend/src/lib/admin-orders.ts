import { api } from "./api";
import { Order, OrderStatus } from "./types";

type OrdersListResponse = {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchAdminOrders(opts?: {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.status) params.set("status", opts.status);
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  const qs = params.toString();
  const res = await api<OrdersListResponse>(`/orders${qs ? `?${qs}` : ""}`);
  return res.orders;
}
