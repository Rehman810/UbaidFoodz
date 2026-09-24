import { api } from "./api";
import { CartLine, resolveMenuItemId } from "./cart";
import { Deal, MenuItem } from "./types";

export function buildOrderPayload(items: CartLine[]) {
  const orderItems = items
    .filter((i) => !i.kind || i.kind === "item")
    .map((line) => {
      const menuItemId = resolveMenuItemId(line);
      if (!menuItemId) return null;
      return {
        menuItemId,
        quantity: line.quantity,
        optionIds: line.optionIds,
        addonIds: line.addonIds,
        instructions: line.instructions,
      };
    })
    .filter(Boolean);

  const orderDeals = items
    .filter((i) => i.kind === "deal" && i.dealId)
    .map((i) => ({ dealId: i.dealId!, quantity: i.quantity }));

  return { items: orderItems, deals: orderDeals };
}

export async function pruneStaleCartLines(
  items: CartLine[],
  remove: (id: string) => void
): Promise<number> {
  if (!items.length) return 0;

  const [menu, deals] = await Promise.all([
    api<MenuItem[]>("/menu"),
    api<Deal[]>("/deals"),
  ]);

  const availableMenu = new Set(menu.filter((m) => m.isAvailable).map((m) => m.id));
  const activeDeals = new Set(deals.filter((d) => d.isActive).map((d) => d.id));

  let removed = 0;
  for (const line of items) {
    if (line.kind === "deal") {
      if (!line.dealId || !activeDeals.has(line.dealId)) {
        remove(line.id);
        removed += 1;
      }
      continue;
    }
    const menuItemId = resolveMenuItemId(line);
    if (!menuItemId || !availableMenu.has(menuItemId)) {
      remove(line.id);
      removed += 1;
    }
  }

  return removed;
}

export function friendlyOrderError(message: string) {
  if (message.includes("Item unavailable")) {
    return "Some items in your bag are no longer available. They were removed — please review your bag and try again.";
  }
  if (message.includes("Deal unavailable")) {
    return "A combo deal in your bag is no longer available. Please remove it and try again.";
  }
  return message;
}
