"use client";

import { MenuItem } from "@/lib/types";
import { MenuItemCard } from "./MenuItemCard";

export function MenuCard({ item }: { item: MenuItem }) {
  return <MenuItemCard item={item} />;
}
