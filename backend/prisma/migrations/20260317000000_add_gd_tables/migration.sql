-- CreateTable
CREATE TABLE "GdCustomer" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ceo" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "address" TEXT,
    "bizNumber" TEXT,
    "bizType" TEXT,
    "bizCategory" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GdCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdVehicle" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "plateNumber" TEXT,
    "ownerName" TEXT,
    "rep" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "carModel" TEXT,
    "carModel2" TEXT,
    "color" TEXT,
    "displacement" TEXT,
    "modelYear" TEXT,
    "purchaseDate" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GdVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdProduct" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "altName" TEXT,
    "unit" TEXT,
    "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellPrice1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellPrice2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellPrice3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellPrice4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellPrice5" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GdProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdSaleDetail" (
    "id" SERIAL NOT NULL,
    "fno" TEXT NOT NULL,
    "saleDate" TEXT NOT NULL,
    "saleType" TEXT,
    "customerCode" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GdSaleDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdRepair" (
    "id" SERIAL NOT NULL,
    "fno" TEXT,
    "vehicleCode" TEXT NOT NULL,
    "repairDate" TEXT,
    "productCode" TEXT,
    "productName" TEXT,
    "unit" TEXT,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mileage" DOUBLE PRECISION,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GdRepair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdSyncLog" (
    "id" SERIAL NOT NULL,
    "syncType" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GdSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GdCustomer_code_key" ON "GdCustomer"("code");
CREATE INDEX "GdCustomer_name_idx" ON "GdCustomer"("name");
CREATE INDEX "GdCustomer_bizNumber_idx" ON "GdCustomer"("bizNumber");
CREATE INDEX "GdCustomer_phone_idx" ON "GdCustomer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "GdVehicle_code_key" ON "GdVehicle"("code");
CREATE INDEX "GdVehicle_plateNumber_idx" ON "GdVehicle"("plateNumber");
CREATE INDEX "GdVehicle_ownerName_idx" ON "GdVehicle"("ownerName");
CREATE INDEX "GdVehicle_phone_idx" ON "GdVehicle"("phone");
CREATE INDEX "GdVehicle_carModel_idx" ON "GdVehicle"("carModel");

-- CreateIndex
CREATE UNIQUE INDEX "GdProduct_code_key" ON "GdProduct"("code");
CREATE INDEX "GdProduct_name_idx" ON "GdProduct"("name");
CREATE INDEX "GdProduct_code_idx" ON "GdProduct"("code");

-- CreateIndex
CREATE INDEX "GdSaleDetail_saleDate_idx" ON "GdSaleDetail"("saleDate");
CREATE INDEX "GdSaleDetail_customerCode_idx" ON "GdSaleDetail"("customerCode");
CREATE INDEX "GdSaleDetail_productCode_idx" ON "GdSaleDetail"("productCode");
CREATE INDEX "GdSaleDetail_customerCode_saleDate_idx" ON "GdSaleDetail"("customerCode", "saleDate");
CREATE INDEX "GdSaleDetail_fno_idx" ON "GdSaleDetail"("fno");

-- CreateIndex
CREATE INDEX "GdRepair_vehicleCode_idx" ON "GdRepair"("vehicleCode");
CREATE INDEX "GdRepair_repairDate_idx" ON "GdRepair"("repairDate");
CREATE INDEX "GdRepair_vehicleCode_repairDate_idx" ON "GdRepair"("vehicleCode", "repairDate");

-- AddForeignKey
ALTER TABLE "GdSaleDetail" ADD CONSTRAINT "GdSaleDetail_customerCode_fkey" FOREIGN KEY ("customerCode") REFERENCES "GdCustomer"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GdSaleDetail" ADD CONSTRAINT "GdSaleDetail_productCode_fkey" FOREIGN KEY ("productCode") REFERENCES "GdProduct"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GdRepair" ADD CONSTRAINT "GdRepair_vehicleCode_fkey" FOREIGN KEY ("vehicleCode") REFERENCES "GdVehicle"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
