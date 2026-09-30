import { api } from "./api";
import { AdminRider } from "./admin-types";

export async function fetchRidersPage(opts?: { limit?: number; offset?: number; search?: string }) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  const qs = params.toString();
  return api<{
    riders: AdminRider[];
    total: number;
    limit: number;
    offset: number;
    stats: { total: number; onRoad: number; activeDrops: number; delivered: number; available: number };
  }>(`/admin/riders${qs ? `?${qs}` : ""}`);
}
