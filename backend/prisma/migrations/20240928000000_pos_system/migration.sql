-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('ONLINE', 'POS');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- AlterEnum
ALTER TYPE "FulfillmentType" ADD VALUE 'DINE_IN';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderSource" "OrderSource" NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod";
ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'PAID';
ALTER TABLE "Order" ADD COLUMN "tableNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
