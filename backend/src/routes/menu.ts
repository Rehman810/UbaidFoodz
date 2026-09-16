import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const menuRouter = Router();

menuRouter.get("/", async (_req, res) => {
  const items = await prisma.menuItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  res.json(items);
});

menuRouter.get("/:id", async (req, res) => {
  const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: "Item not found" });
  res.json(item);
});

menuRouter.post("/", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { name, description, price, category, imageUrl, isAvailable } = req.body;
  if (!name || price == null || !category) {
    return res.status(400).json({ error: "Name, price and category are required." });
  }
  const item = await prisma.menuItem.create({
    data: {
      name,
      description: description || "",
      price: Number(price),
      category,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: isAvailable ?? true,
    },
  });
  res.status(201).json(item);
});

menuRouter.put("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { name, description, price, category, imageUrl, isAvailable } = req.body;
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        ...(name != null && { name }),
        ...(description != null && { description }),
        ...(price != null && { price: Number(price) }),
        ...(category != null && { category }),
        ...(imageUrl != null && { imageUrl }),
        ...(isAvailable != null && { isAvailable }),
      },
    });
    res.json(item);
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
