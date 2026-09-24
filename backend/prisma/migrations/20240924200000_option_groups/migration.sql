-- CreateTable
CREATE TABLE "MenuItemOptionGroup" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MenuItemOptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemOption" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discountPrice" DECIMAL(10,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MenuItemOption_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "instructions" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemOptionGroup_menuItemId_name_key" ON "MenuItemOptionGroup"("menuItemId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemOption_groupId_name_key" ON "MenuItemOption"("groupId", "name");

-- AddForeignKey
ALTER TABLE "MenuItemOptionGroup" ADD CONSTRAINT "MenuItemOptionGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemOption" ADD CONSTRAINT "MenuItemOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MenuItemOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
