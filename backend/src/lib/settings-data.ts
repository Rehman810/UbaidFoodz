import { prisma } from "./prisma";
import { isStoreOpen, storeHoursLabel } from "./store-settings";

export async function getStoreSettings() {
  return prisma.storeSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function getPublicStorePayload() {
  const settings = await getStoreSettings();
  const banners = await prisma.promoBanner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  const open = isStoreOpen(settings);
  return {
    settings,
    banners,
    isOpen: open,
    hoursLabel: storeHoursLabel(settings),
    closedMessage: settings.closedMessage,
  };
}
