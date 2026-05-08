/*
  Warnings:

  - The `status` column on the `Dispute` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DraftReviewStatus" AS ENUM ('NOT_REQUIRED', 'NOT_SUBMITTED', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('PENDING_PUBLICATION', 'LINK_SUBMITTED', 'ACCEPTED', 'REJECTED', 'RESUBMITTED', 'DISPUTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('NOT_ESCROWED', 'ESCROWED', 'PAYABLE', 'PAID_TO_WALLET', 'REFUNDED', 'PARTIALLY_SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BrandLedgerTxType" AS ENUM ('PAYMENT', 'ESCROW_FREEZE', 'ESCROW_RELEASE', 'KOL_SETTLEMENT', 'REFUND', 'ADJUSTMENT', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "BrandLedgerTxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BrandRefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'NEEDS_INFO', 'DECIDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeDecision" AS ENUM ('FULL_SETTLEMENT', 'FULL_REFUND', 'PARTIAL_SETTLEMENT', 'ALLOW_RESUBMISSION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CampaignStatus" ADD VALUE 'AWAITING_PAYMENT';
ALTER TYPE "CampaignStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DraftStatus" ADD VALUE 'REVISION_REQUESTED';
ALTER TYPE "DraftStatus" ADD VALUE 'APPROVED';
ALTER TYPE "DraftStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "BrandProfile" ADD COLUMN     "frozenEscrowBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "acceptanceSlaDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CNY',
ADD COLUMN     "escrowAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "escrowFrozenAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "escrowReleasedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "highValueReviewThreshold" DECIMAL(12,2) NOT NULL DEFAULT 50,
ADD COLUMN     "platformFeeRate" DECIMAL(6,4) NOT NULL DEFAULT 0,
ADD COLUMN     "requiresDraftReview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "resubmissionGraceDays" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "revisionLimit" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "CampaignTask" ADD COLUMN     "draftDeadline" TIMESTAMP(3),
ADD COLUMN     "minimumFollowers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "platformRequirement" TEXT,
ADD COLUMN     "publishDeadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ContentDraft" ADD COLUMN     "disclosurePosition" TEXT,
ADD COLUMN     "previewAttachmentUrl" TEXT,
ADD COLUMN     "reviewStatus" "DraftReviewStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
ADD COLUMN     "revisionReason" TEXT,
ADD COLUMN     "revisionRound" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "decidedById" TEXT,
ADD COLUMN     "decision" "DisputeDecision",
ADD COLUMN     "kolResponse" TEXT,
ADD COLUMN     "merchantNote" TEXT,
ADD COLUMN     "merchantReasonCategory" TEXT,
ADD COLUMN     "partialSettlementAmount" DECIMAL(12,2),
DROP COLUMN "status",
ADD COLUMN     "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "currency" SET DEFAULT 'CNY';

-- AlterTable
ALTER TABLE "Proof" ADD COLUMN     "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'LINK_SUBMITTED',
ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "resubmissionCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN     "submittedAvgViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "submittedFollowers" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "disputedAt" TIMESTAMP(3),
ADD COLUMN     "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'PENDING_PUBLICATION',
ADD COLUMN     "settlementAmount" DECIMAL(12,2),
ADD COLUMN     "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'ESCROWED';

-- AlterTable
ALTER TABLE "TaskApplication" ADD COLUMN     "acceptedRequirementSnapshot" JSONB,
ADD COLUMN     "selectedSocialAccountId" TEXT;

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "currency" SET DEFAULT 'CNY';

-- AlterTable
ALTER TABLE "WalletTransaction" ALTER COLUMN "currency" SET DEFAULT 'CNY';

-- AlterTable
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "currency" SET DEFAULT 'CNY';

-- CreateTable
CREATE TABLE "BrandLedgerTransaction" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "campaignId" TEXT,
    "type" "BrandLedgerTxType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "status" "BrandLedgerTxStatus" NOT NULL DEFAULT 'PENDING',
    "beforeBalance" DECIMAL(12,2),
    "afterBalance" DECIMAL(12,2),
    "relatedInvoiceId" TEXT,
    "relatedRefundId" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandLedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandRefundRequest" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "status" "BrandRefundStatus" NOT NULL DEFAULT 'PENDING',
    "payoutMethod" TEXT,
    "payoutDetails" JSONB,
    "adminNote" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandRefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "acceptanceSlaDays" INTEGER NOT NULL DEFAULT 3,
    "highValueReviewThreshold" DECIMAL(12,2) NOT NULL DEFAULT 50,
    "resubmissionGraceDays" INTEGER NOT NULL DEFAULT 2,
    "minimumWithdrawalAmount" DECIMAL(12,2) NOT NULL DEFAULT 20,
    "kolPreviewMaxMb" INTEGER NOT NULL DEFAULT 50,
    "platformFeeRate" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "platformContactEmail" TEXT NOT NULL DEFAULT 'support@example.com',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskApplication" ADD CONSTRAINT "TaskApplication_selectedSocialAccountId_fkey" FOREIGN KEY ("selectedSocialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandLedgerTransaction" ADD CONSTRAINT "BrandLedgerTransaction_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandLedgerTransaction" ADD CONSTRAINT "BrandLedgerTransaction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRefundRequest" ADD CONSTRAINT "BrandRefundRequest_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandRefundRequest" ADD CONSTRAINT "BrandRefundRequest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
