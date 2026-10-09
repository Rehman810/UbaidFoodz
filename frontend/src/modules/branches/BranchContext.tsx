"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchStaffBranches } from "./api";
import { readBranchSelection, writeBranchSelection } from "./branch-storage";
import type { Branch, BranchSelection } from "./types";

type BranchContextValue = {
  branches: Branch[];
  selection: BranchSelection;
  setSelection: (id: BranchSelection) => void;
  activeBranch: Branch | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selection, setSelectionState] = useState<BranchSelection>("all");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || user.role === "CUSTOMER") {
      setBranches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchStaffBranches();
      setBranches(data.branches);
      const stored = readBranchSelection();
      const canAll = user.role === "ADMIN";
      if (stored === "all" && canAll) {
        setSelectionState("all");
      } else if (stored && data.branches.some((b) => b.id === stored)) {
        setSelectionState(stored);
      } else if (data.branches.length === 1) {
        setSelectionState(data.branches[0].id);
        writeBranchSelection(data.branches[0].id);
      } else if (canAll) {
        setSelectionState(stored === "all" ? "all" : data.defaultBranchId);
        writeBranchSelection(stored === "all" ? "all" : data.defaultBranchId);
      } else {
        const pick = data.branches[0]?.id || data.defaultBranchId;
        setSelectionState(pick);
        writeBranchSelection(pick);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setSelection = useCallback(
    (id: BranchSelection) => {
      if (id === "all" && user?.role !== "ADMIN") return;
      setSelectionState(id);
      writeBranchSelection(id);
      window.dispatchEvent(new Event("branch-change"));
    },
    [user?.role]
  );

  const activeBranch = useMemo(() => {
    if (selection === "all") return null;
    return branches.find((b) => b.id === selection) ?? null;
  }, [branches, selection]);

  const value = useMemo(
    () => ({ branches, selection, setSelection, activeBranch, loading, refresh }),
    [branches, selection, setSelection, activeBranch, loading, refresh]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
