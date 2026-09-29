-- Weekly hours, tax, payment toggles, receipt fields, and order charge lines.
ALTER TABLE "StoreSettings" ADD COLUMN "weeklySchedule" JSONB;
ALTER TABLE "StoreSettings" ADD COLUMN "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "StoreSettings" ADD COLUMN "taxLabel" TEXT NOT NULL DEFAULT 'Tax';
ALTER TABLE "StoreSettings" ADD COLUMN "taxIncluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreSettings" ADD COLUMN "serviceChargePercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "StoreSettings" ADD COLUMN "serviceChargeLabel" TEXT NOT NULL DEFAULT 'Service charge';
ALTER TABLE "StoreSettings" ADD COLUMN "serviceIncluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreSettings" ADD COLUMN "acceptCash" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "acceptCard" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "taxNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "receiptFooter" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "confirmSlaMinutes" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "StoreSettings" ADD COLUMN "deliverySlaMinutes" INTEGER NOT NULL DEFAULT 45;

ALTER TABLE "StoreSettings" ALTER COLUMN "closedMessage" SET DEFAULT '';

ALTER TABLE "Order" ADD COLUMN "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "serviceAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
