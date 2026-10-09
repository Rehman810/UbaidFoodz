const KEY = "uff-admin-branch";

export function readBranchSelection(): string | "all" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v || null;
}

export function writeBranchSelection(id: string | "all") {
  localStorage.setItem(KEY, id);
}

export function branchRequestHeader(): string | undefined {
  const v = readBranchSelection();
  if (!v) return undefined;
  return v;
}
