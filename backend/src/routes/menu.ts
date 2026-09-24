import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { effectiveItemPrice } from "../lib/store-settings";
import { requireAuth, requireRole } from "../middleware/auth";

export const menuRouter = Router();

const menuInclude = {
  sizes: { orderBy: { sortOrder: "asc" as const } },
  addons: { orderBy: { sortOrder: "asc" as const } },
};

function serializeMenuItem(item: {
  price: { toString(): string };
  discountPrice?: { toString(): string } | null;
  sizes?: { id: string; name: string; price: { toString(): string }; sortOrder: number }[];
  addons?: { id: string; name: string; price: { toString(): string }; sortOrder: number }[];
  [key: string]: unknown;
}) {
  const effective = effectiveItemPrice(item);
  return {
    ...item,
    price: Number(item.price),
    discountPrice: item.discountPrice != null ? Number(item.discountPrice) : null,
    effectivePrice: effective,
    sizes: item.sizes?.map((s) => ({ ...s, price: Number(s.price) })) ?? [],
    addons: item.addons?.map((a) => ({ ...a, price: Number(a.price) })) ?? [],
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

async function syncSizes(menuItemId: string, sizes?: { name: string; price: number }[]) {
  if (!sizes) return;
  await prisma.menuItemSize.deleteMany({ where: { menuItemId } });
  for (let i = 0; i < sizes.length; i++) {
    const row = sizes[i];
    if (!row.name?.trim()) continue;
    await prisma.menuItemSize.create({
      data: { menuItemId, name: row.name.trim(), price: Number(row.price) || 0, sortOrder: i + 1 },
    });
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
  const { name, description, price, discountPrice, category, imageUrl, isAvailable, sizes, addons } =
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
  await syncSizes(item.id, sizes);
  await syncAddons(item.id, addons);
  const full = await prisma.menuItem.findUnique({ where: { id: item.id }, include: menuInclude });
  res.status(201).json(serializeMenuItem(full!));
});

menuRouter.put("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { name, description, price, discountPrice, category, imageUrl, isAvailable, sizes, addons } =
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
    if (sizes !== undefined) await syncSizes(item.id, sizes);
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
