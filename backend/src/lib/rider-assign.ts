import { FulfillmentType, OrderStatus, Role } from "@prisma/client";
import { prisma } from "./prisma";

export function deliveryNeedsRider(fulfillmentType: FulfillmentType) {
  return fulfillmentType === FulfillmentType.DELIVERY;
}

/** Pick the rider with the fewest active (out for delivery) orders. */
export async function pickLeastBusyRider(): Promise<string | null> {
  const riders = await prisma.user.findMany({
    where: { role: Role.RIDER },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!riders.length) return null;

  const counts = await prisma.order.groupBy({
    by: ["riderId"],
    where: {
      riderId: { in: riders.map((r) => r.id) },
      status: OrderStatus.OUT_FOR_DELIVERY,
    },
    _count: { riderId: true },
  });

  const countMap = new Map(
    counts.filter((c) => c.riderId).map((c) => [c.riderId as string, c._count.riderId])
  );

  let bestId = riders[0].id;
  let minCount = countMap.get(bestId) ?? 0;
  for (const rider of riders) {
    const active = countMap.get(rider.id) ?? 0;
    if (active < minCount) {
      minCount = active;
      bestId = rider.id;
    }
  }
  return bestId;
}
