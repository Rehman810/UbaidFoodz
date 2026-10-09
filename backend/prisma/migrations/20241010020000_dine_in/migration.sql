-- Waiter role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'WAITER';

-- Dine-in enums
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'NEEDS_CLEANING');
CREATE TYPE "TableSessionStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW', 'COMPLETED');

CREATE TABLE "DiningTable" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "zone" TEXT NOT NULL DEFAULT '',
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiningTable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tableId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "partySize" INTEGER NOT NULL DEFAULT 2,
    "reservedAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 90,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TableSession" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "waiterId" TEXT,
    "guestName" TEXT NOT NULL DEFAULT 'Walk-in',
    "partySize" INTEGER NOT NULL DEFAULT 2,
    "status" "TableSessionStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "reservationId" TEXT,
    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiningTable_branchId_label_key" ON "DiningTable"("branchId", "label");
CREATE INDEX "DiningTable_branchId_status_idx" ON "DiningTable"("branchId", "status");
CREATE INDEX "Reservation_branchId_reservedAt_idx" ON "Reservation"("branchId", "reservedAt");
CREATE INDEX "Reservation_branchId_status_idx" ON "Reservation"("branchId", "status");
CREATE UNIQUE INDEX "TableSession_reservationId_key" ON "TableSession"("reservationId");
CREATE INDEX "TableSession_branchId_status_idx" ON "TableSession"("branchId", "status");
CREATE INDEX "TableSession_tableId_status_idx" ON "TableSession"("tableId", "status");

ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DiningTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DiningTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD COLUMN "diningTableId" TEXT;
ALTER TABLE "Order" ADD COLUMN "tableSessionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "waiterId" TEXT;

ALTER TABLE "Order" ADD CONSTRAINT "Order_diningTableId_fkey" FOREIGN KEY ("diningTableId") REFERENCES "DiningTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
