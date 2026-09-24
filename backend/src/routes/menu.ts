import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { effectiveItemPrice } from "../lib/store-settings";
import { requireAuth, requireRole } from "../middleware/auth";

export const menuRouter = Router();

const menuInclude = {
  optionGroups: {
    orderBy: { sortOrder: "asc" as const },
    include: { options: { orderBy: { sortOrder: "asc" as const } } },
  },
  sizes: { orderBy: { sortOrder: "asc" as const } },
  addons: { orderBy: { sortOrder: "asc" as const } },
};

type OptionRow = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  sortOrder: number;
};

type GroupRow = {
  id: string;
  name: string;
  required: boolean;
  sortOrder: number;
  options: OptionRow[];
};

function serializeOptionGroups(item: {
  optionGroups?: {
    id: string;
    name: string;
    required: boolean;
    sortOrder: number;
    options: { id: string; name: string; price: { toString(): string }; discountPrice?: { toString(): string } | null; sortOrder: number }[];
  }[];
  sizes?: { id: string; name: string; price: { toString(): string }; sortOrder: number }[];
}): GroupRow[] {
  if (item.optionGroups?.length) {
    return item.optionGroups.map((g) => ({
      id: g.id,
      name: g.name,
      required: g.required,
      sortOrder: g.sortOrder,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        price: Number(o.price),
        discountPrice: o.discountPrice != null ? Number(o.discountPrice) : null,
        sortOrder: o.sortOrder,
      })),
    }));
  }
  if (item.sizes?.length) {
    return [
      {
        id: "legacy-sizes",
        name: "Choose an option",
        required: true,
        sortOrder: 1,
        options: item.sizes.map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price),
          discountPrice: null,
          sortOrder: s.sortOrder,
        })),
      },
    ];
  }
  return [];
}

function serializeMenuItem(item: {
  price: { toString(): string };
  discountPrice?: { toString(): string } | null;
  addons?: { id: string; name: string; price: { toString(): string }; sortOrder: number }[];
  [key: string]: unknown;
}) {
  const effective = effectiveItemPrice(item);
  const optionGroups = serializeOptionGroups(item as Parameters<typeof serializeOptionGroups>[0]);
  return {
    ...item,
    price: Number(item.price),
    discountPrice: item.discountPrice != null ? Number(item.discountPrice) : null,
    effectivePrice: effective,
    optionGroups,
    addons:
      (item.addons as { id: string; name: string; price: { toString(): string }; sortOrder: number }[])?.map(
        (a) => ({ ...a, price: Number(a.price) })
      ) ?? [],
    sizes: undefined,
  };
}

menuRouter.get("/", async (_req, res) => {
  const items = await prisma.menuItem.findMany({
    include: menuInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(items.map(serializeMenuItem));
});

menuRouter.get("/:id", async (req, res) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: req.params.id },
    include: menuInclude,
  });
  if (!item) return res.status(404).json({ error: "Item not found" });
  res.json(serializeMenuItem(item));
});

type OptionGroupInput = {
  name: string;
  required?: boolean;
  options?: { name: string; price: number; discountPrice?: number | string | null }[];
};

async function syncOptionGroups(menuItemId: string, groups?: OptionGroupInput[]) {
  if (!groups) return;
  await prisma.menuItemOptionGroup.deleteMany({ where: { menuItemId } });
  await prisma.menuItemSize.deleteMany({ where: { menuItemId } });
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (!g.name?.trim()) continue;
    const group = await prisma.menuItemOptionGroup.create({
      data: {
        menuItemId,
        name: g.name.trim(),
        required: g.required ?? true,
        sortOrder: gi + 1,
      },
    });
    for (let oi = 0; oi < (g.options ?? []).length; oi++) {
      const o = g.options![oi];
      if (!o.name?.trim()) continue;
      await prisma.menuItemOption.create({
        data: {
          groupId: group.id,
          name: o.name.trim(),
          price: Number(o.price) || 0,
          discountPrice:
            o.discountPrice != null && String(o.discountPrice) !== ""
              ? Number(o.discountPrice)
              : null,
          sortOrder: oi + 1,
        },
      });
    }
  }
}

async function syncAddons(menuItemId: string, addons?: { name: string; price: number }[]) {
  if (!addons) return;
  await prisma.menuItemAddon.deleteMany({ where: { menuItemId } });
  for (let i = 0; i < addons.length; i++) {
    const row = addons[i];
    if (!row.name?.trim()) continue;
    await prisma.menuItemAddon.create({
      data: { menuItemId, name: row.name.trim(), price: Number(row.price) || 0, sortOrder: i + 1 },
    });
  }
}

menuRouter.post("/", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { name, description, price, discountPrice, category, imageUrl, isAvailable, optionGroups, addons } =
    req.body;
  if (!name || price == null || !category) {
    return res.status(400).json({ error: "Name, price and category are required." });
  }
  const item = await prisma.menuItem.create({
    data: {
      name,
      description: description || "",
      price: Number(price),
      discountPrice:
        discountPrice != null && discountPrice !== "" ? Number(discountPrice) : null,
      category,
      imageUrl:
        imageUrl ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: isAvailable ?? true,
    },
  });
  await syncOptionGroups(item.id, optionGroups);
  await syncAddons(item.id, addons);
  const full = await prisma.menuItem.findUnique({ where: { id: item.id }, include: menuInclude });
  res.status(201).json(serializeMenuItem(full!));
});

menuRouter.put("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { name, description, price, discountPrice, category, imageUrl, isAvailable, optionGroups, addons, sizes } =
    req.body;
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        ...(name != null && { name }),
        ...(description != null && { description }),
        ...(price != null && { price: Number(price) }),
        ...(discountPrice !== undefined && {
          discountPrice:
            discountPrice === null || discountPrice === ""
              ? null
              : Number(discountPrice),
        }),
        ...(category != null && { category }),
        ...(imageUrl != null && { imageUrl }),
        ...(isAvailable != null && { isAvailable }),
      },
    });
    if (optionGroups !== undefined) {
      await syncOptionGroups(item.id, optionGroups);
    } else if (sizes !== undefined) {
      await syncOptionGroups(item.id, [
        { name: "Choose an option", required: true, options: sizes },
      ]);
    }
    if (addons !== undefined) await syncAddons(item.id, addons);
    const full = await prisma.menuItem.findUnique({ where: { id: item.id }, include: menuInclude });
    res.json(serializeMenuItem(full!));
  } catch {
    res.status(404).json({ error: "Item not found" });
  }
});

menuRouter.delete("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Item not found" });
  }
});
