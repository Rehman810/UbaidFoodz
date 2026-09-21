import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const deliveryAreasRouter = Router();

/** Public: areas admin has enabled for delivery */
deliveryAreasRouter.get("/", async (req, res) => {
  const activeOnly = req.query.active !== "false";
  const areas = await prisma.deliveryArea.findMany({
    where: activeOnly ? { isDelivering: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  res.json(areas);
});

/** Admin: all areas with delivery settings */
deliveryAreasRouter.get("/all", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const areas = await prisma.deliveryArea.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  res.json(areas);
});

deliveryAreasRouter.post("/", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Area name is required." });

  const existing = await prisma.deliveryArea.findUnique({ where: { name } });
  if (existing) return res.status(409).json({ error: "An area with this name already exists." });

  const deliveryCharge =
    req.body.deliveryCharge !== undefined ? Number(req.body.deliveryCharge) : 150;
  if (Number.isNaN(deliveryCharge) || deliveryCharge < 0) {
    return res.status(400).json({ error: "Delivery charge must be zero or greater." });
  }

  const maxOrder = await prisma.deliveryArea.aggregate({ _max: { sortOrder: true } });
  const area = await prisma.deliveryArea.create({
    data: {
      name,
      deliveryCharge,
      isDelivering: Boolean(req.body.isDelivering),
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
  res.status(201).json(area);
});

deliveryAreasRouter.patch("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const area = await prisma.deliveryArea.findUnique({ where: { id: req.params.id } });
  if (!area) return res.status(404).json({ error: "Area not found." });

  const isDelivering =
    req.body.isDelivering !== undefined ? Boolean(req.body.isDelivering) : undefined;
  const deliveryCharge =
    req.body.deliveryCharge !== undefined ? Number(req.body.deliveryCharge) : undefined;

  if (deliveryCharge !== undefined && (Number.isNaN(deliveryCharge) || deliveryCharge < 0)) {
    return res.status(400).json({ error: "Delivery charge must be zero or greater." });
  }

  const updated = await prisma.deliveryArea.update({
    where: { id: req.params.id },
    data: {
      ...(isDelivering !== undefined ? { isDelivering } : {}),
      ...(deliveryCharge !== undefined ? { deliveryCharge } : {}),
    },
  });
  res.json(updated);
});
