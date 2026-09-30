import { api } from "./api";
import { Order, OrderStatus } from "./types";

type OrdersListResponse = {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
  statusCounts?: Record<string, number>;
  filteredTotal?: number;
};

export async function fetchAdminOrders(opts?: {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
  search?: string;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.status) params.set("status", opts.status);
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  const qs = params.toString();
  return api<OrdersListResponse>(`/orders${qs ? `?${qs}` : ""}`);
}
