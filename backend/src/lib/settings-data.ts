import { prisma } from "./prisma";
import { DEFAULT_RESTAURANT_ID, getRestaurantId } from "./restaurant-context";
import { isStoreOpen, storeHoursLabel } from "./store-settings";

const MIN_ORDERS_FOR_LIVE_STATS = 10;

export async function getStoreSettings() {
  const restaurantId = getRestaurantId();
  const existing = await prisma.storeSettings.findFirst({ where: { restaurantId } });
  if (existing) return existing;
  return prisma.storeSettings.create({
    data: {
      id: restaurantId === DEFAULT_RESTAURANT_ID ? "default" : restaurantId,
      restaurantId,
    },
  });
}

export async function getPublicStorePayload() {
  const settings = await getStoreSettings();
  const [banners, areaCount, testimonials, orderCount] = await Promise.all([
    prisma.promoBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.deliveryArea.count({ where: { isDelivering: true } }),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
  ]);
  const avgRating = testimonials.length
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
    : null;
  const showLiveStats = Boolean(settings.showLiveStats) && orderCount >= MIN_ORDERS_FOR_LIVE_STATS;
  const open = isStoreOpen(settings);
  return {
    settings,
    banners,
    testimonials,
    areaCount,
    highlights:
      showLiveStats || testimonials.length > 0
        ? {
            show: true,
            rating: avgRating,
            orderCount: showLiveStats ? orderCount : null,
            areaCount,
          }
        : { show: false, rating: null, orderCount: null, areaCount },
    isOpen: open,
    hoursLabel: storeHoursLabel(settings),
    closedMessage: settings.closedMessage,
  };
}
