import { Router } from "express";
import { Role } from "@prisma/client";
import { defaultsForCategory, enrichCategory } from "../lib/category-meta";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  res.json(categories.map(enrichCategory));
});

categoriesRouter.post("/", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Category name is required." });

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return res.status(409).json({ error: "Category already exists." });

  const defaults = defaultsForCategory(name);
  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: {
      name,
      tagline: String(req.body.tagline || defaults.tagline).trim(),
      imageUrl: String(req.body.imageUrl || defaults.imageUrl).trim(),
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
  res.status(201).json(enrichCategory(category));
});

categoriesRouter.put("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) return res.status(404).json({ error: "Category not found." });

  const name = req.body.name !== undefined ? String(req.body.name).trim() : undefined;
  const tagline = req.body.tagline !== undefined ? String(req.body.tagline).trim() : undefined;
  const imageUrl = req.body.imageUrl !== undefined ? String(req.body.imageUrl).trim() : undefined;

  if (name !== undefined && !name) {
    return res.status(400).json({ error: "Category name is required." });
  }

  if (name && name !== category.name) {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) return res.status(409).json({ error: "Category name already exists." });
    await prisma.menuItem.updateMany({
      where: { category: category.name },
      data: { category: name },
    });
  }

  const updated = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(tagline !== undefined ? { tagline } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });
  res.json(enrichCategory(updated));
});

categoriesRouter.delete("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) return res.status(404).json({ error: "Category not found." });

  const inUse = await prisma.menuItem.count({ where: { category: category.name } });
  if (inUse > 0) {
    return res.status(400).json({ error: `Cannot delete — ${inUse} dish(es) use this category.` });
  }

  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
