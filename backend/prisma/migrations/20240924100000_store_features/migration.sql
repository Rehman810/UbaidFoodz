-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "discountPrice" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "MenuItemSize" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MenuItemSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemAddon" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MenuItemAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "phone" TEXT NOT NULL DEFAULT '0321-5556677',
    "whatsapp" TEXT NOT NULL DEFAULT '923215556677',
    "address" TEXT NOT NULL DEFAULT 'Boat Basin, Clifton Block 5, Karachi',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "minimumOrder" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "freeDeliveryAbove" DECIMAL(10,2),
    "deliveryEstimateMin" INTEGER NOT NULL DEFAULT 45,
    "pickupEstimateMin" INTEGER NOT NULL DEFAULT 20,
    "openHour" INTEGER NOT NULL DEFAULT 19,
    "openMinute" INTEGER NOT NULL DEFAULT 0,
    "closeHour" INTEGER NOT NULL DEFAULT 2,
    "closeMinute" INTEGER NOT NULL DEFAULT 30,
    "closedMessage" TEXT NOT NULL DEFAULT 'Sorry, we are closed right now. We open daily at 7:00 PM.',
    "forceClosed" BOOLEAN NOT NULL DEFAULT false,
    "facebookUrl" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "tiktokUrl" TEXT NOT NULL DEFAULT '',
    "youtubeUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoBanner_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "optionsLabel" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemSize_menuItemId_name_key" ON "MenuItemSize"("menuItemId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemAddon_menuItemId_name_key" ON "MenuItemAddon"("menuItemId", "name");

-- AddForeignKey
ALTER TABLE "MenuItemSize" ADD CONSTRAINT "MenuItemSize_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemAddon" ADD CONSTRAINT "MenuItemAddon_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default store settings
INSERT INTO "StoreSettings" ("id") VALUES ('default') ON CONFLICT DO NOTHING;
