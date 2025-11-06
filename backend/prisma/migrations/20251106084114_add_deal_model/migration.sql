-- CreateTable
CREATE TABLE "Deal" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "merchantName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[],
    "imageUrl" TEXT NOT NULL,
    "oldPrice" DECIMAL(10,2),
    "newPrice" DECIMAL(10,2),
    "discountPct" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deepLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deal_isActive_expiresAt_idx" ON "Deal"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "Deal_city_idx" ON "Deal"("city");

-- CreateIndex
CREATE INDEX "Deal_category_idx" ON "Deal"("category");
