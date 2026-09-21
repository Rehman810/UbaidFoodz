import { Category } from "./types";

export const CATEGORY_DEFAULTS: Record<string, { tagline: string; imageUrl: string }> = {
  Starters: {
    tagline: "Crispy beginnings",
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=80",
  },
  "Main Course": {
    tagline: "The main event",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  },
  Beverages: {
    tagline: "Ice-cold sips",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
  },
  Desserts: {
    tagline: "Sweet finish",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80",
  },
};

export const DEFAULT_CATEGORY_BANNER =
  CATEGORY_DEFAULTS["Main Course"].imageUrl;

export function enrichCategory(cat: Category): Category {
  const defaults = CATEGORY_DEFAULTS[cat.name];
  if (!defaults) return cat;
  return {
    ...cat,
    tagline: cat.tagline?.trim() || defaults.tagline,
    imageUrl: cat.imageUrl?.trim() || defaults.imageUrl,
  };
}

export function enrichCategories(cats: Category[]): Category[] {
  return cats.map(enrichCategory);
}
