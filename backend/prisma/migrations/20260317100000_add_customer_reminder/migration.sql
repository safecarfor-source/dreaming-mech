-- CreateTable
CREATE TABLE "CustomerReminder" (
    "id" SERIAL NOT NULL,
    "vehicleCode" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerReminder_vehicleCode_idx" ON "CustomerReminder"("vehicleCode");

-- CreateIndex
CREATE INDEX "CustomerReminder_status_idx" ON "CustomerReminder"("status");

-- CreateIndex
CREATE INDEX "CustomerReminder_dueDate_idx" ON "CustomerReminder"("dueDate");

-- CreateIndex
CREATE INDEX "CustomerReminder_reminderType_idx" ON "CustomerReminder"("reminderType");

-- AddForeignKey
ALTER TABLE "CustomerReminder" ADD CONSTRAINT "CustomerReminder_vehicleCode_fkey" FOREIGN KEY ("vehicleCode") REFERENCES "GdVehicle"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
