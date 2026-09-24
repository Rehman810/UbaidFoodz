import { MenuItem, MenuItemOption } from "./types";

export function menuItemPrice(item: MenuItem) {
  const groups = item.optionGroups ?? [];
  if (groups.length > 0 && groups[0].options.length > 0) {
    const prices = groups[0].options.map((o) => optionPrice(o));
    return Math.min(...prices);
  }
  return Number(item.effectivePrice ?? item.discountPrice ?? item.price);
}

export function optionPrice(opt: MenuItemOption) {
  return Number(opt.discountPrice ?? opt.price);
}

export function menuItemHasDiscount(item: MenuItem) {
  if (item.optionGroups?.length) {
    return item.optionGroups.some((g) =>
      g.options.some((o) => o.discountPrice != null && Number(o.discountPrice) < Number(o.price))
    );
  }
  return item.discountPrice != null && Number(item.discountPrice) < Number(item.price);
}

export function itemHasConfigurableOptions(item: MenuItem) {
  return (item.optionGroups?.length ?? 0) > 0 || (item.addons?.length ?? 0) > 0;
}

export function menuItemStrikePrice(item: MenuItem): number | null {
  const groups = item.optionGroups ?? [];
  if (groups.length) {
    const discounted = groups.flatMap((g) =>
      g.options.filter(
        (o) => o.discountPrice != null && Number(o.discountPrice) < Number(o.price)
      )
    );
    if (discounted.length) {
      return Math.min(...discounted.map((o) => Number(o.price)));
    }
  }
  if (item.discountPrice != null && Number(item.discountPrice) < Number(item.price)) {
    return Number(item.price);
  }
  return null;
}

export function menuItemDiscountPercent(item: MenuItem) {
  const strike = menuItemStrikePrice(item);
  if (!strike) return null;
  const sale = menuItemPrice(item);
  if (sale >= strike) return null;
  return Math.round((1 - sale / strike) * 100);
}

/** First option in each group — used for quick-add from the + button. */
export function buildQuickAddConfig(item: MenuItem) {
  const groups = item.optionGroups ?? [];
  const optionIds: string[] = [];
  const optionNames: string[] = [];

  if (groups.length) {
    let price = 0;
    for (const g of groups) {
      const opt = g.options[0];
      if (!opt) continue;
      optionIds.push(opt.id);
      optionNames.push(opt.name);
      price += optionPrice(opt);
    }
    return {
      price,
      optionIds,
      optionsLabel: optionNames.length ? `${item.name} (${optionNames.join(", ")})` : item.name,
    };
  }

  return {
    price: menuItemPrice(item),
    optionIds: [] as string[],
    optionsLabel: item.name,
  };
}
