-- AlterTable
ALTER TABLE "Order" ADD COLUMN "customerIp" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerLatitude" DECIMAL(10,7);
ALTER TABLE "Order" ADD COLUMN "customerLongitude" DECIMAL(10,7);
ALTER TABLE "Order" ADD COLUMN "customerLocationAccuracy" DECIMAL(10,2);
