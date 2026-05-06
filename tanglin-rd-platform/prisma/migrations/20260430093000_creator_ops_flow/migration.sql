-- CreateEnum
CREATE TYPE "SocialVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "SocialAccount"
ADD COLUMN "verificationStatus" "SocialVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "verificationNote" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- Backfill existing verified boolean into the new status field.
UPDATE "SocialAccount"
SET "verificationStatus" = CASE WHEN "verified" = true THEN 'VERIFIED'::"SocialVerificationStatus" ELSE 'PENDING'::"SocialVerificationStatus" END,
    "verifiedAt" = CASE WHEN "verified" = true THEN CURRENT_TIMESTAMP ELSE NULL END;
