export const PRESET_DEAL_CATEGORIES = [
  "Summer deals",
  "Winter deals",
  "Ramadan specials",
  "Weekend combos",
  "Family packs",
  "Student deals",
] as const;

export function normalizeDealCategory(value: string | null | undefined) {
  return (value || "").trim();
}

export function dealCategoryLabel(value: string | null | undefined) {
  const normalized = normalizeDealCategory(value);
  return normalized || "Special offers";
}

export function mergeDealCategoryOptions(existing: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of [...PRESET_DEAL_CATEGORIES, ...existing.map(normalizeDealCategory)]) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

export function groupDealsByCategory<T extends { category: string }>(deals: T[]) {
  const groups = new Map<string, T[]>();
  for (const deal of deals) {
    const label = dealCategoryLabel(deal.category);
    const list = groups.get(label) ?? [];
    list.push(deal);
    groups.set(label, list);
  }

  const presetOrder = [...PRESET_DEAL_CATEGORIES, "Special offers"];
  const labels = [...groups.keys()];
  labels.sort((a, b) => {
    const ai = presetOrder.indexOf(a as (typeof presetOrder)[number]);
    const bi = presetOrder.indexOf(b as (typeof presetOrder)[number]);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });

  return labels.map((label) => ({ label, deals: groups.get(label)! }));
}
