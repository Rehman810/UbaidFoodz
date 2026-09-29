-- Map the old single pipeline onto fulfillment-specific statuses.
-- Delivery keeps out-for-delivery / delivered. Pickup and dine-in no longer share those.

CREATE TYPE "OrderStatus_new" AS ENUM (
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COLLECTED',
  'SERVED',
  'CANCELLED'
);

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE "status"::text
    WHEN 'AWAITING_CONFIRMATION' THEN 'PENDING_CONFIRMATION'
    WHEN 'PENDING' THEN 'CONFIRMED'
    WHEN 'PREPARING' THEN 'PREPARING'
    WHEN 'OUT_FOR_DELIVERY' THEN
      CASE "fulfillmentType"::text
        WHEN 'DELIVERY' THEN 'OUT_FOR_DELIVERY'
        ELSE 'READY'
      END
    WHEN 'DELIVERED' THEN
      CASE "fulfillmentType"::text
        WHEN 'PICKUP' THEN 'COLLECTED'
        WHEN 'DINE_IN' THEN 'SERVED'
        ELSE 'DELIVERED'
      END
    WHEN 'CANCELLED' THEN 'CANCELLED'
    ELSE 'PENDING_CONFIRMATION'
  END::"OrderStatus_new"
);

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_CONFIRMATION';

DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

CREATE TABLE "OrderEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "actorId" TEXT,
  "actorRole" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
