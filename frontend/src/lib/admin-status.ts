import { OrderStatus } from "./types";

export const STATUS_THEME: Record<
  OrderStatus,
  { border: string; stripe: string; bg: string; text: string; dot: string; ring: string }
> = {
  PENDING_CONFIRMATION: {
    border: "border-orange-200 dark:border-orange-800/60",
    stripe: "bg-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/45",
    text: "text-orange-900 dark:text-orange-200",
    dot: "bg-orange-500",
    ring: "ring-orange-200/60 dark:ring-orange-800/40",
  },
  CONFIRMED: {
    border: "border-amber-200 dark:border-amber-800/60",
    stripe: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/45",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
    ring: "ring-amber-200/60 dark:ring-amber-800/40",
  },
  READY: {
    border: "border-teal-200 dark:border-teal-800/60",
    stripe: "bg-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/45",
    text: "text-teal-800 dark:text-teal-200",
    dot: "bg-teal-500",
    ring: "ring-teal-200/60 dark:ring-teal-800/40",
  },
  PREPARING: {
    border: "border-blue-200 dark:border-blue-800/60",
    stripe: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/45",
    text: "text-blue-800 dark:text-blue-200",
    dot: "bg-blue-500",
    ring: "ring-blue-200/60 dark:ring-blue-800/40",
  },
  OUT_FOR_DELIVERY: {
    border: "border-violet-200 dark:border-violet-800/60",
    stripe: "bg-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/45",
    text: "text-violet-800 dark:text-violet-200",
    dot: "bg-violet-500",
    ring: "ring-violet-200/60 dark:ring-violet-800/40",
  },
  COLLECTED: {
    border: "border-emerald-200 dark:border-emerald-800/60",
    stripe: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/45",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200/60 dark:ring-emerald-800/40",
  },
  SERVED: {
    border: "border-emerald-200 dark:border-emerald-800/60",
    stripe: "bg-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/45",
    text: "text-emerald-900 dark:text-emerald-200",
    dot: "bg-emerald-600",
    ring: "ring-emerald-200/60 dark:ring-emerald-800/40",
  },
  DELIVERED: {
    border: "border-emerald-200 dark:border-emerald-800/60",
    stripe: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/45",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200/60 dark:ring-emerald-800/40",
  },
  CANCELLED: {
    border: "border-stone-200 dark:border-stone-600",
    stripe: "bg-stone-400",
    bg: "bg-stone-50 dark:bg-stone-800/80",
    text: "text-stone-600 dark:text-stone-300",
    dot: "bg-stone-400",
    ring: "ring-stone-200/60 dark:ring-stone-600/50",
  },
};
