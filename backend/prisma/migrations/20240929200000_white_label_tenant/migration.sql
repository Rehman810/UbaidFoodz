-- White-label tenant: one restaurant row, every business table scoped by restaurantId.

CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "hostname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Restaurant_hostname_key" ON "Restaurant"("hostname");

INSERT INTO "Restaurant" ("id", "createdAt")
VALUES ('11111111-1111-4111-8111-111111111111', CURRENT_TIMESTAMP);

ALTER TABLE "StoreSettings" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
ALTER TABLE "StoreSettings" ADD COLUMN "logoUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "faviconUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "primaryColor" TEXT NOT NULL DEFAULT '#ea580c';
ALTER TABLE "StoreSettings" ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#c2410c';
ALTER TABLE "StoreSettings" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi';
ALTER TABLE "StoreSettings" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'PKR';
ALTER TABLE "StoreSettings" ADD COLUMN "currencySymbol" TEXT NOT NULL DEFAULT 'Rs';
ALTER TABLE "StoreSettings" ADD COLUMN "footerText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "poweredByText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "poweredByUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreSettings" ADD COLUMN "showPoweredBy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreSettings" ADD COLUMN "showLiveStats" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "StoreSettings" ALTER COLUMN "storeName" SET DEFAULT '';
ALTER TABLE "StoreSettings" ALTER COLUMN "phone" SET DEFAULT '';
ALTER TABLE "StoreSettings" ALTER COLUMN "whatsapp" SET DEFAULT '';
ALTER TABLE "StoreSettings" ALTER COLUMN "address" SET DEFAULT '';

CREATE UNIQUE INDEX "StoreSettings_restaurantId_key" ON "StoreSettings"("restaurantId");
ALTER TABLE "StoreSettings" ADD CONSTRAINT "StoreSettings_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
CREATE INDEX "User_restaurantId_idx" ON "User"("restaurantId");
ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Category" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
CREATE INDEX "Category_restaurantId_idx" ON "Category"("restaurantId");
ALTER TABLE "Category" ADD CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MenuItem" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
CREATE INDEX "MenuItem_restaurantId_idx" ON "MenuItem"("restaurantId");
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PromoBanner" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
CREATE INDEX "PromoBanner_restaurantId_idx" ON "PromoBanner"("restaurantId");
ALTER TABLE "PromoBanner" ADD CONSTRAINT "PromoBanner_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Deal" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
CREATE INDEX "Deal_restaurantId_idx" ON "Deal"("restaurantId");
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DeliveryArea" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
CREATE INDEX "DeliveryArea_restaurantId_idx" ON "DeliveryArea"("restaurantId");
ALTER TABLE "DeliveryArea" ADD CONSTRAINT "DeliveryArea_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
CREATE INDEX "Order_restaurantId_idx" ON "Order"("restaurantId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderBlock" ADD COLUMN "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111';
CREATE INDEX "OrderBlock_restaurantId_idx" ON "OrderBlock"("restaurantId");
ALTER TABLE "OrderBlock" ADD CONSTRAINT "OrderBlock_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111',
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL,
    "rating" INT NOT NULL DEFAULT 5,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Testimonial_restaurantId_isPublished_idx" ON "Testimonial"("restaurantId", "isPublished");
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
