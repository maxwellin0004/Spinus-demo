-- CreateEnum
CREATE TYPE "BrandRequestStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'ACCEPTED', 'CONVERTED', 'CLOSED');

-- AlterTable
ALTER TABLE "AdminProfile" ADD COLUMN "wechat" TEXT;

-- AlterTable
ALTER TABLE "BrandProfile" ADD COLUMN "budgetBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Invoice"
ADD COLUMN "invoiceNumber" TEXT,
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "paymentProofUrl" TEXT;

-- CreateTable
CREATE TABLE "BrandRequest" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "responsibleAdminId" TEXT,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" DECIMAL(12,2),
    "expectedLaunchDate" TIMESTAMP(3),
    "status" "BrandRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "convertedCampaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandMessage" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "requestId" TEXT,
    "campaignId" TEXT,
    "authorUserId" TEXT,
    "authorRole" "UserRole" NOT NULL,
    "body" TEXT NOT NULL,
    "visibleToBrand" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRequest" ADD CONSTRAINT "BrandRequest_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRequest" ADD CONSTRAINT "BrandRequest_responsibleAdminId_fkey" FOREIGN KEY ("responsibleAdminId") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMessage" ADD CONSTRAINT "BrandMessage_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMessage" ADD CONSTRAINT "BrandMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BrandRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMessage" ADD CONSTRAINT "BrandMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandMessage" ADD CONSTRAINT "BrandMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed existing local founder contact.
UPDATE "AdminProfile"
SET "wechat" = 'xiaohuangque_ops'
WHERE "wechat" IS NULL AND "level" = 'FOUNDER';
