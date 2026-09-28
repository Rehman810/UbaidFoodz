import { OrderStatus } from "@prisma/client";

const FLOW: OrderStatus[] = [
  OrderStatus.AWAITING_CONFIRMATION,
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export function canTransitionStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  if (to === OrderStatus.CANCELLED) {
    return from === OrderStatus.AWAITING_CONFIRMATION || from === OrderStatus.PENDING;
  }
  const fromIdx = FLOW.indexOf(from);
  const toIdx = FLOW.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx === fromIdx + 1;
}

export function chefNextStatus(current: OrderStatus): OrderStatus | null {
  if (current === OrderStatus.PENDING) return OrderStatus.PREPARING;
  if (current === OrderStatus.PREPARING) return OrderStatus.OUT_FOR_DELIVERY;
  if (current === OrderStatus.OUT_FOR_DELIVERY) return OrderStatus.DELIVERED;
  return null;
}

export function forwardStatusOptions(current: OrderStatus): OrderStatus[] {
  const idx = FLOW.indexOf(current);
  if (idx < 0) return [];
  const forward = FLOW.slice(idx);
  const opts = [...forward];
  if (current === OrderStatus.AWAITING_CONFIRMATION || current === OrderStatus.PENDING) {
    opts.push(OrderStatus.CANCELLED);
  }
  return opts;
}
