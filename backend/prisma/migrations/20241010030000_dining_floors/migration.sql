-- Seat types & dining floors
CREATE TYPE "SeatType" AS ENUM ('TABLE', 'TAKHT', 'BOOTH', 'HIGH_TOP', 'OUTDOOR');

CREATE TABLE "DiningFloor" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiningFloor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiningFloor_branchId_name_key" ON "DiningFloor"("branchId", "name");
CREATE INDEX "DiningFloor_branchId_sortOrder_idx" ON "DiningFloor"("branchId", "sortOrder");

ALTER TABLE "DiningFloor" ADD CONSTRAINT "DiningFloor_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiningTable" ADD COLUMN "floorId" TEXT;
ALTER TABLE "DiningTable" ADD COLUMN "seatType" "SeatType" NOT NULL DEFAULT 'TABLE';

CREATE INDEX "DiningTable_floorId_idx" ON "DiningTable"("floorId");

ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "DiningFloor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Backfill floors from existing zone labels per branch
INSERT INTO "DiningFloor" ("id", "branchId", "name", "sortOrder")
SELECT
  gen_random_uuid()::text,
  g."branchId",
  g."zoneName",
  (ROW_NUMBER() OVER (PARTITION BY g."branchId" ORDER BY g."zoneName") - 1)::int
FROM (
  SELECT DISTINCT
    t."branchId",
    COALESCE(NULLIF(TRIM(t."zone"), ''), 'Main floor') AS "zoneName"
  FROM "DiningTable" t
) g;

UPDATE "DiningTable" t
SET "floorId" = f."id"
FROM "DiningFloor" f
WHERE f."branchId" = t."branchId"
  AND f."name" = COALESCE(NULLIF(TRIM(t."zone"), ''), 'Main floor');
