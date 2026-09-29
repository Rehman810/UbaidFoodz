"use client";

import { useStore } from "@/lib/store";
import { storeDisplayName } from "@/lib/branding";

type Props = {
  className?: string;
  fallback?: string;
};

export function StoreName({ className, fallback }: Props) {
  const store = useStore();
  return <span className={className}>{storeDisplayName(store?.settings) || fallback}</span>;
}
