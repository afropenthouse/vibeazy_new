-- CreateTable
CREATE TABLE "UserDealSubmission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
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
    "deepLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dealId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDealSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDealSubmission_status_idx" ON "UserDealSubmission"("status");

-- CreateIndex
CREATE INDEX "UserDealSubmission_userId_idx" ON "UserDealSubmission"("userId");

-- AddForeignKey
ALTER TABLE "UserDealSubmission" ADD CONSTRAINT "UserDealSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
