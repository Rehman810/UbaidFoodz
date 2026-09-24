"use client";

import { Clock } from "lucide-react";
import { useStoreOpen } from "@/lib/use-store-open";

export function ClosedBanner() {
  const { loading, isOpen, closedMessage, hoursLabel } = useStoreOpen();
  if (loading || isOpen) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-100 px-4 py-3 text-center text-sm font-medium text-amber-950">
      <Clock className="mr-1 inline-block" size={15} />
      {closedMessage}
      <span className="mx-2 text-amber-700">·</span>
      <span className="font-semibold text-amber-900">Hours: {hoursLabel}</span>
    </div>
  );
}
