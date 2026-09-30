export const PRESET_DEAL_CATEGORIES = [
  "Summer deals",
  "Winter deals",
  "Ramadan specials",
  "Weekend combos",
  "Family packs",
  "Student deals",
] as const;

export function normalizeDealCategory(value: string | null | undefined) {
  const trimmed = (value || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const preset = PRESET_DEAL_CATEGORIES.find((name) => name.toLowerCase() === trimmed.toLowerCase());
  return preset ?? trimmed;
}

export function dealCategoryLabel(value: string | null | undefined) {
  const normalized = normalizeDealCategory(value);
  return normalized || "Special offers";
}

export function mergeDealCategoryOptions(existing: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of [...PRESET_DEAL_CATEGORIES, ...existing.map(normalizeDealCategory)]) {
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function groupDealsByCategory<T extends { category: string }>(deals: T[]) {
  const groups = new Map<string, T[]>();
  for (const deal of deals) {
    const label = dealCategoryLabel(deal.category);
    const key = label.toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(deal);
    groups.set(key, list);
  }

  const presetOrder = [...PRESET_DEAL_CATEGORIES, "Special offers"].map((name) => name.toLowerCase());
  const keys = [...groups.keys()];
  keys.sort((a, b) => {
    const ai = presetOrder.indexOf(a);
    const bi = presetOrder.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });

  return keys.map((key) => ({
    label: dealCategoryLabel(key === "special offers" ? "" : groups.get(key)![0].category),
    deals: groups.get(key)!,
  }));
}
