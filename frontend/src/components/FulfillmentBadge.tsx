import { Bike, Store, UtensilsCrossed } from "lucide-react";
import { FulfillmentType } from "@/lib/types";

export function fulfillmentLabel(type?: FulfillmentType | null) {
  if (type === "PICKUP") return "Takeaway";
  if (type === "DINE_IN") return "Dine-in";
  return "Delivery";
}

export function FulfillmentBadge({
  type,
  size = "sm",
}: {
  type?: FulfillmentType | null;
  size?: "sm" | "md";
}) {
  const iconSize = size === "md" ? 12 : 10;
  const styles =
    type === "PICKUP"
      ? "bg-stone-100 text-stone-700 ring-stone-200"
      : type === "DINE_IN"
        ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
        : "bg-brand-50 text-brand-800 ring-brand-100";
  const Icon = type === "PICKUP" ? Store : type === "DINE_IN" ? UtensilsCrossed : Bike;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${styles} ${
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      <Icon size={iconSize} />
      {fulfillmentLabel(type)}
    </span>
  );
}
