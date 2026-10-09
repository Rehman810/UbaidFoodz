-- Reservation status: manager reject
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Branch dine-in settings
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi';
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "graceMin" INTEGER NOT NULL DEFAULT 15;

-- Rename reservation guest/time columns
ALTER TABLE "Reservation" RENAME COLUMN "customerName" TO "guestName";
ALTER TABLE "Reservation" RENAME COLUMN "customerPhone" TO "guestPhone";
ALTER TABLE "Reservation" RENAME COLUMN "reservedAt" TO "startsAt";

ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "emailMissingLegacy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "confirmedById" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "noShowAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "confirmationToken" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "followUpSentAt" TIMESTAMP(3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Reservation' AND column_name = 'customerEmail'
  ) THEN
    ALTER TABLE "Reservation" RENAME COLUMN "customerEmail" TO "guestEmail";
  END IF;
END $$;

UPDATE "Reservation" SET "guestEmail" = 'legacy-missing@invalid.local'
WHERE "guestEmail" IS NULL OR TRIM("guestEmail") = '';

UPDATE "Reservation" SET "emailMissingLegacy" = true
WHERE "guestEmail" = 'legacy-missing@invalid.local';

ALTER TABLE "Reservation" ALTER COLUMN "guestEmail" SET NOT NULL;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

UPDATE "Reservation" SET "confirmationToken" = gen_random_uuid()::text
WHERE "confirmationToken" IS NULL;

ALTER TABLE "Reservation" ALTER COLUMN "confirmationToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_confirmationToken_key" ON "Reservation"("confirmationToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_idempotencyKey_key" ON "Reservation"("idempotencyKey");

DROP INDEX IF EXISTS "Reservation_branchId_reservedAt_idx";
CREATE INDEX "Reservation_branchId_startsAt_idx" ON "Reservation"("branchId", "startsAt");
CREATE INDEX "Reservation_branchId_status_startsAt_idx" ON "Reservation"("branchId", "status", "startsAt");

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_confirmedById_fkey"
  FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_branchId_createdAt_idx" ON "AuditLog"("branchId", "createdAt");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "EmailLog_reservationId_type_idx" ON "EmailLog"("reservationId", "type");
CREATE INDEX "EmailLog_status_createdAt_idx" ON "EmailLog"("status", "createdAt");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One open session per table
CREATE UNIQUE INDEX IF NOT EXISTS "TableSession_one_open_per_table" ON "TableSession"("tableId") WHERE "closedAt" IS NULL;
