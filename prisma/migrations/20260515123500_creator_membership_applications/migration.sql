CREATE TYPE "CreatorMembershipApplicationStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "CreatorMembershipApplication" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "tier" "CreatorMembershipTier" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CNY',
  "status" "CreatorMembershipApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "paymentReference" TEXT,
  "paymentProofUrl" TEXT,
  "creatorNote" TEXT,
  "adminNote" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreatorMembershipApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreatorMembershipApplication_creatorId_createdAt_idx" ON "CreatorMembershipApplication"("creatorId", "createdAt");
CREATE INDEX "CreatorMembershipApplication_status_createdAt_idx" ON "CreatorMembershipApplication"("status", "createdAt");

ALTER TABLE "CreatorMembershipApplication"
ADD CONSTRAINT "CreatorMembershipApplication_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreatorMembershipApplication"
ADD CONSTRAINT "CreatorMembershipApplication_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
