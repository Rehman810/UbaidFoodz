"use client";

import { Clock } from "lucide-react";
import { useStore } from "@/lib/store";

export function ClosedBanner() {
  const store = useStore();
  if (!store || store.isOpen) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950">
      <Clock className="mr-1 inline-block" size={14} />
      {store.closedMessage}
      <span className="mx-2 text-amber-700">·</span>
      <span className="text-amber-800">Hours: {store.hoursLabel}</span>
    </div>
  );
}
