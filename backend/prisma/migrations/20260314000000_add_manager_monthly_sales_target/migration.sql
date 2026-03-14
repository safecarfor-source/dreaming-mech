-- CreateTable
CREATE TABLE "ManagerMonthlySalesTarget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "lyTotal" BIGINT NOT NULL,
    "lyDays" INTEGER NOT NULL,
    "tysSales" BIGINT NOT NULL,
    "tyElapsed" INTEGER NOT NULL,
    "tyRemain" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagerMonthlySalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManagerMonthlySalesTarget_year_month_key" ON "ManagerMonthlySalesTarget"("year", "month");
