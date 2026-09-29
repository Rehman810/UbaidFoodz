import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { getRestaurantId, isTenantModel, runWithRestaurant } from "./restaurant-context";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const basePrisma = new PrismaClient();

const LIST_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

function delegate(model: string) {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (basePrisma as unknown as Record<string, { findFirst: (args: object) => Promise<{ id: string } | null> }>)[key];
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!isTenantModel(model)) return query(args);
        const restaurantId = getRestaurantId();
        const next = args as {
          where?: object;
          data?: Record<string, unknown> | Record<string, unknown>[];
          create?: Record<string, unknown>;
        };

        if (operation === "create" && next.data && !Array.isArray(next.data)) {
          next.data = { restaurantId, ...next.data };
        } else if (operation === "createMany" && Array.isArray(next.data)) {
          next.data = next.data.map((row) => ({ restaurantId, ...row }));
        } else if (operation === "upsert" && next.create) {
          next.create = { restaurantId, ...next.create };
        } else if (LIST_OPS.has(operation)) {
          next.where = { AND: [next.where || {}, { restaurantId }] };
        }

        if (operation === "update" || operation === "delete") {
          const existing = await delegate(model).findFirst({
            where: { AND: [(args as { where?: object }).where || {}, { restaurantId }] },
            select: { id: true },
          });
          if (!existing) {
            const err = new Error("Record not found") as Error & { code?: string };
            err.code = "P2025";
            throw err;
          }
        }

        const row = await query(args);
        if (
          (operation === "findUnique" || operation === "findUniqueOrThrow") &&
          row &&
          typeof row === "object" &&
          "restaurantId" in row &&
          (row as { restaurantId?: string }).restaurantId !== restaurantId
        ) {
          if (operation === "findUniqueOrThrow") {
            const err = new Error("Record not found") as Error & { code?: string };
            err.code = "P2025";
            throw err;
          }
          return null;
        }
        return row;
      },
    },
  },
});

export { runWithRestaurant };

const hostCache = new Map<string, string>();

export async function resolveRestaurantId(hostname?: string | null) {
  const fromEnv = process.env.RESTAURANT_ID;
  if (fromEnv) return fromEnv;
  const host = hostname?.split(":")[0]?.toLowerCase();
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    const cached = hostCache.get(host);
    if (cached) return cached;
    const row = await basePrisma.restaurant.findFirst({ where: { hostname: host }, select: { id: true } });
    if (row) {
      hostCache.set(host, row.id);
      return row.id;
    }
  }
  return getRestaurantId();
}
