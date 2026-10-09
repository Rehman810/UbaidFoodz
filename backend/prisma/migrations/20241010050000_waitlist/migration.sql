-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'CALLED', 'SEATED', 'CANCELLED', 'LEFT');

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "queueDate" TEXT NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestPhone" TEXT,
    "partySize" INTEGER NOT NULL DEFAULT 2,
    "preferredSeatType" "SeatType",
    "preferredTableId" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "seatedAt" TIMESTAMP(3),
    "tableSessionId" TEXT,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_tableSessionId_key" ON "WaitlistEntry"("tableSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_branchId_queueDate_queueNumber_key" ON "WaitlistEntry"("branchId", "queueDate", "queueNumber");

-- CreateIndex
CREATE INDEX "WaitlistEntry_branchId_status_createdAt_idx" ON "WaitlistEntry"("branchId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_preferredTableId_fkey" FOREIGN KEY ("preferredTableId") REFERENCES "DiningTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
