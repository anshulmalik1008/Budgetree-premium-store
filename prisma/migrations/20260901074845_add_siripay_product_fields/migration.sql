-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "hsnCode" TEXT,
ADD COLUMN     "mrp" DECIMAL(10,2),
ADD COLUMN     "primaryCategoryId" INTEGER,
ADD COLUMN     "subCategoryId" INTEGER,
ADD COLUMN     "subCategoryName" TEXT;

-- CreateIndex
CREATE INDEX "Product_externalId_idx" ON "Product"("externalId");

-- CreateIndex
CREATE INDEX "Product_externalSource_idx" ON "Product"("externalSource");
