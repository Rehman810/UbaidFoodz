import { Bike, Store } from "lucide-react";
import { FulfillmentType } from "@/lib/types";

export function fulfillmentLabel(type?: FulfillmentType | null) {
  return type === "PICKUP" ? "Takeaway" : "Delivery";
}

export function FulfillmentBadge({
  type,
  size = "sm",
}: {
  type?: FulfillmentType | null;
  size?: "sm" | "md";
}) {
  const takeaway = type === "PICKUP";
  const iconSize = size === "md" ? 12 : 10;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${
        takeaway
          ? "bg-stone-100 text-stone-700 ring-stone-200"
          : "bg-brand-50 text-brand-800 ring-brand-100"
      } ${size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]"}`}
    >
      {takeaway ? <Store size={iconSize} /> : <Bike size={iconSize} />}
      {fulfillmentLabel(type)}
    </span>
  );
}
