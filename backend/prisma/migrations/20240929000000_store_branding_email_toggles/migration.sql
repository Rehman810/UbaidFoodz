-- Store branding + staff email notification toggles
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "storeName" TEXT NOT NULL DEFAULT 'Your Restaurant';
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "storeTagline" TEXT NOT NULL DEFAULT 'Order in minutes';
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "emailNotifyChef" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "emailNotifyCashier" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "emailNotifyRider" BOOLEAN NOT NULL DEFAULT true;
