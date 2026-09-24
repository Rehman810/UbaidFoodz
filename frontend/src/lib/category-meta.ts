import { Category } from "./types";

export const CATEGORY_DEFAULTS: Record<string, { tagline: string; imageUrl: string }> = {
  Starters: {
    tagline: "Crispy beginnings",
    imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  "Burgers & Sandwiches": {
    tagline: "Stacked & loaded",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  "Pizza & Pasta": {
    tagline: "Oven-fresh classics",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  "Biryani & Rice": {
    tagline: "Dum-cooked comfort",
    imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  "BBQ & Broast": {
    tagline: "Charcoal & crunch",
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  "Karahi & Curries": {
    tagline: "Sizzling handis",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  Sides: {
    tagline: "Perfect add-ons",
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  Beverages: {
    tagline: "Ice-cold sips",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  Desserts: {
    tagline: "Sweet finish",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&h=600&q=85",
  },
  // Legacy category names from older seeds
  "Main Course": {
    tagline: "The main event",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&h=600&q=85",
  },
};

export const DEFAULT_CATEGORY_BANNER = CATEGORY_DEFAULTS["Burgers & Sandwiches"].imageUrl;

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
