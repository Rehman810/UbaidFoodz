import { OrderStatus } from "./types";

export const STATUS_THEME: Record<
  OrderStatus,
  { border: string; stripe: string; bg: string; text: string; dot: string; ring: string }
> = {
  AWAITING_CONFIRMATION: {
    border: "border-orange-200",
    stripe: "bg-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-900",
    dot: "bg-orange-500",
    ring: "ring-orange-200/60",
  },
  PENDING: {
    border: "border-amber-200",
    stripe: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-amber-500",
    ring: "ring-amber-200/60",
  },
  PREPARING: {
    border: "border-blue-200",
    stripe: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-800",
    dot: "bg-blue-500",
    ring: "ring-blue-200/60",
  },
  OUT_FOR_DELIVERY: {
    border: "border-violet-200",
    stripe: "bg-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-800",
    dot: "bg-violet-500",
    ring: "ring-violet-200/60",
  },
  DELIVERED: {
    border: "border-emerald-200",
    stripe: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200/60",
  },
  CANCELLED: {
    border: "border-stone-200",
    stripe: "bg-stone-400",
    bg: "bg-stone-50",
    text: "text-stone-600",
    dot: "bg-stone-400",
    ring: "ring-stone-200/60",
  },
};
