import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getPublicStorePayload, getStoreSettings } from "../lib/settings-data";
import { requireAuth, requireRole } from "../middleware/auth";

export const settingsRouter = Router();

settingsRouter.get("/public", async (_req, res) => {
  res.json(await getPublicStorePayload());
});

settingsRouter.get("/", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const settings = await getStoreSettings();
  const banners = await prisma.promoBanner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  res.json({ settings, banners });
});

settingsRouter.patch("/", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const num = (v: unknown) => (v === undefined || v === "" ? undefined : Number(v));

  const settings = await prisma.storeSettings.update({
    where: { id: "default" },
    data: {
      ...(body.phone !== undefined ? { phone: String(body.phone) } : {}),
      ...(body.whatsapp !== undefined ? { whatsapp: String(body.whatsapp) } : {}),
      ...(body.address !== undefined ? { address: String(body.address) } : {}),
      ...(body.latitude !== undefined ? { latitude: num(body.latitude) } : {}),
      ...(body.longitude !== undefined ? { longitude: num(body.longitude) } : {}),
      ...(body.minimumOrder !== undefined ? { minimumOrder: num(body.minimumOrder) ?? 0 } : {}),
      ...(body.freeDeliveryAbove !== undefined
        ? { freeDeliveryAbove: body.freeDeliveryAbove === null ? null : num(body.freeDeliveryAbove) }
        : {}),
      ...(body.deliveryEstimateMin !== undefined
        ? { deliveryEstimateMin: Number(body.deliveryEstimateMin) || 45 }
        : {}),
      ...(body.pickupEstimateMin !== undefined
        ? { pickupEstimateMin: Number(body.pickupEstimateMin) || 20 }
        : {}),
      ...(body.openHour !== undefined ? { openHour: Number(body.openHour) } : {}),
      ...(body.openMinute !== undefined ? { openMinute: Number(body.openMinute) } : {}),
      ...(body.closeHour !== undefined ? { closeHour: Number(body.closeHour) } : {}),
      ...(body.closeMinute !== undefined ? { closeMinute: Number(body.closeMinute) } : {}),
      ...(body.closedMessage !== undefined ? { closedMessage: String(body.closedMessage) } : {}),
      ...(body.forceClosed !== undefined ? { forceClosed: Boolean(body.forceClosed) } : {}),
      ...(body.autoConfirmOrders !== undefined
        ? { autoConfirmOrders: Boolean(body.autoConfirmOrders) }
        : {}),
      ...(body.autoAssignRiders !== undefined
        ? { autoAssignRiders: Boolean(body.autoAssignRiders) }
        : {}),
      ...(body.facebookUrl !== undefined ? { facebookUrl: String(body.facebookUrl) } : {}),
      ...(body.instagramUrl !== undefined ? { instagramUrl: String(body.instagramUrl) } : {}),
      ...(body.tiktokUrl !== undefined ? { tiktokUrl: String(body.tiktokUrl) } : {}),
      ...(body.youtubeUrl !== undefined ? { youtubeUrl: String(body.youtubeUrl) } : {}),
    },
  });
  res.json(settings);
});

settingsRouter.post("/banners", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const { title, imageUrl, linkUrl, sortOrder, isActive } = req.body as {
    title?: string;
    imageUrl?: string;
    linkUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  };
  if (!imageUrl) return res.status(400).json({ error: "Banner image is required." });
  const max = await prisma.promoBanner.aggregate({ _max: { sortOrder: true } });
  const banner = await prisma.promoBanner.create({
    data: {
      title: title || "",
      imageUrl,
      linkUrl: linkUrl || "",
      sortOrder: sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      isActive: isActive ?? true,
    },
  });
  res.status(201).json(banner);
});

settingsRouter.patch("/banners/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  const existing = await prisma.promoBanner.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Banner not found." });
  const body = req.body as Record<string, unknown>;
  const banner = await prisma.promoBanner.update({
    where: { id: req.params.id },
    data: {
      ...(body.title !== undefined ? { title: String(body.title) } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: String(body.imageUrl) } : {}),
      ...(body.linkUrl !== undefined ? { linkUrl: String(body.linkUrl) } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
    },
  });
  res.json(banner);
});

settingsRouter.delete("/banners/:id", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  try {
    await prisma.promoBanner.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Banner not found." });
  }
});
