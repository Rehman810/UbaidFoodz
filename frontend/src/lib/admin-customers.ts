import { api } from "./api";
import { AdminCustomer } from "./admin-types";
import { FulfillmentType, OrderStatus } from "./types";

export type CustomerSort = "spent" | "orders" | "name" | "recent";

export type CustomersPageResponse = {
  customers: AdminCustomer[];
  total: number;
  limit: number;
  offset: number;
  stats: {
    count: number;
    totalRevenue: number;
    totalOrders: number;
    avgSpend: number;
    repeatRate: number;
    topSpenderId?: string;
  };
};

export type CustomerOrderRow = {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  fulfillmentType: FulfillmentType;
};

export async function fetchCustomersPage(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: CustomerSort;
}) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  if (opts?.sort) params.set("sort", opts.sort);
  const qs = params.toString();
  return api<CustomersPageResponse>(`/admin/customers${qs ? `?${qs}` : ""}`);
}

export async function fetchCustomerOrders(customerId: string, opts?: { limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  const qs = params.toString();
  return api<{ orders: CustomerOrderRow[]; total: number; limit: number; offset: number }>(
    `/admin/customers/${encodeURIComponent(customerId)}/orders${qs ? `?${qs}` : ""}`
  );
}
