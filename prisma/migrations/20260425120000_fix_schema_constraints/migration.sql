-- AlterTable: Change Collection.date to PostgreSQL DATE type
ALTER TABLE "Collection" ALTER COLUMN "date" TYPE DATE USING "date"::DATE;

-- CreateIndex: @@unique([name, placeId]) on Vendor
CREATE UNIQUE INDEX "Vendor_name_placeId_key" ON "Vendor"("name", "placeId");

-- CreateIndex: @@unique([collectionId, vendorId, productId]) on CollectionItem
CREATE UNIQUE INDEX "CollectionItem_collectionId_vendorId_productId_key" ON "CollectionItem"("collectionId", "vendorId", "productId");

-- CreateIndex: @@unique([name, organizationId]) on Salesperson
CREATE UNIQUE INDEX "Salesperson_name_organizationId_key" ON "Salesperson"("name", "organizationId");
