export type Branch = {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt?: string;
  _count?: { orders: number; members: number };
};

export type BranchSelection = string | "all";
