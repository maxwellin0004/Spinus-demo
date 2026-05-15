CREATE TYPE "CreatorMembershipTier" AS ENUM ('NONE', 'GROWTH', 'PRO');

ALTER TABLE "CreatorProfile"
ADD COLUMN "membershipTier" "CreatorMembershipTier" NOT NULL DEFAULT 'NONE',
ADD COLUMN "membershipStartedAt" TIMESTAMP(3),
ADD COLUMN "membershipEndsAt" TIMESTAMP(3),
ADD COLUMN "membershipNote" TEXT;
