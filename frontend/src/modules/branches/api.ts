import { api } from "@/lib/api";
import { Branch } from "./types";

export async function fetchStaffBranches() {
  return api<{ branches: Branch[]; defaultBranchId: string }>("/branches");
}

export async function fetchAdminBranches() {
  return api<{ branches: Branch[] }>("/admin/branches");
}

export async function createBranch(payload: {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  isDefault?: boolean;
  sortOrder?: number;
}) {
  return api<{ branch: Branch }>("/admin/branches", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateBranch(
  id: string,
  payload: Partial<{
    name: string;
    code: string;
    address: string;
    phone: string;
    isActive: boolean;
    isDefault: boolean;
    sortOrder: number;
  }>
) {
  return api<{ branch: Branch }>(`/admin/branches/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}
