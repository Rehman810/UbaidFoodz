import { MenuItem } from "./types";

export function menuItemPrice(item: MenuItem) {
  return Number(item.effectivePrice ?? item.discountPrice ?? item.price);
}

export function menuItemHasDiscount(item: MenuItem) {
  return item.discountPrice != null && Number(item.discountPrice) < Number(item.price);
}

export function itemNeedsOptions(item: MenuItem) {
  return (item.sizes?.length ?? 0) > 0 || (item.addons?.length ?? 0) > 0;
}
