-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL DEFAULT '11111111-1111-4111-8111-111111111111',
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BranchMember" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BranchMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "branchId" TEXT;

CREATE UNIQUE INDEX "Branch_restaurantId_code_key" ON "Branch"("restaurantId", "code");
CREATE INDEX "Branch_restaurantId_isActive_idx" ON "Branch"("restaurantId", "isActive");
CREATE UNIQUE INDEX "BranchMember_branchId_userId_key" ON "BranchMember"("branchId", "userId");
CREATE INDEX "BranchMember_userId_idx" ON "BranchMember"("userId");
CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

ALTER TABLE "Branch" ADD CONSTRAINT "Branch_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BranchMember" ADD CONSTRAINT "BranchMember_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BranchMember" ADD CONSTRAINT "BranchMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
