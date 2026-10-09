import { api } from "@/lib/api";

export type StorefrontBranch = {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isDefault: boolean;
};

export function branchPickupLabel(branch: Pick<StorefrontBranch, "name" | "address">) {
  const addr = branch.address.trim();
  return addr ? `${branch.name} — ${addr}` : branch.name;
}

export async function fetchPublicBranches() {
  return api<{ branches: StorefrontBranch[]; defaultBranchId: string }>("/branches/public");
}
