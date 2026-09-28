-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpires" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN "googlePlaceId" TEXT NOT NULL DEFAULT '';
