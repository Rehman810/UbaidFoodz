import { api } from "./api";
import { StaffRow } from "@/components/admin/StaffTable";

export async function fetchStaffPage(opts?: { limit?: number; offset?: number; search?: string }) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  const qs = params.toString();
  return api<{
    staff: StaffRow[];
    total: number;
    limit: number;
    offset: number;
    stats: { total: number; chefs: number; riders: number; active: number };
  }>(`/admin/staff${qs ? `?${qs}` : ""}`);
}
