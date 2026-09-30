import { api } from "./api";
import { Category, Deal, MenuItem } from "./types";

type PageMeta = { total: number; limit: number; offset: number };

export async function fetchMenuPage(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
}) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  if (opts?.category && opts.category !== "All") params.set("category", opts.category);
  const qs = params.toString();
  return api<PageMeta & { items: MenuItem[] }>(`/menu${qs ? `?${qs}` : ""}`);
}

export async function fetchAllMenuItems() {
  return (await fetchMenuPage({ limit: 500 })).items;
}

export async function fetchDealsPage(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
  activeOnly?: boolean;
  category?: string;
}) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  if (opts?.activeOnly) params.set("active", "true");
  if (opts?.category) params.set("category", opts.category);
  const qs = params.toString();
  return api<PageMeta & { deals: Deal[] }>(`/deals${qs ? `?${qs}` : ""}`);
}

export async function fetchAllDeals(activeOnly = false) {
  return (await fetchDealsPage({ limit: 500, activeOnly })).deals;
}

export async function fetchCategoriesPage(opts?: { limit?: number; offset?: number; search?: string }) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  const qs = params.toString();
  return api<PageMeta & { categories: Category[] }>(`/categories${qs ? `?${qs}` : ""}`);
}

export async function fetchAllCategories() {
  return (await fetchCategoriesPage({ limit: 500 })).categories;
}
