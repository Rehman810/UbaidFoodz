-- CreateTable
CREATE TABLE "OrderBlock" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "OrderBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderBlock_email_idx" ON "OrderBlock"("email");

-- CreateIndex
CREATE INDEX "OrderBlock_phone_idx" ON "OrderBlock"("phone");
