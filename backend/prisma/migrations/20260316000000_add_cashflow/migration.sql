-- CreateTable
CREATE TABLE "CashFlow" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "cash" BIGINT NOT NULL DEFAULT 0,
    "investment" BIGINT NOT NULL DEFAULT 0,
    "inventory" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashFlow_year_month_key" ON "CashFlow"("year", "month");
