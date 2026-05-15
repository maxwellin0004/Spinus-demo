ALTER TABLE "CreatorProfile" ADD COLUMN "shareCode" TEXT;

UPDATE "CreatorProfile"
SET "shareCode" = UPPER(SUBSTRING(MD5("id" || CLOCK_TIMESTAMP()::text || RANDOM()::text), 1, 10))
WHERE "shareCode" IS NULL;

ALTER TABLE "CreatorProfile" ALTER COLUMN "shareCode" SET NOT NULL;

CREATE UNIQUE INDEX "CreatorProfile_shareCode_key" ON "CreatorProfile"("shareCode");

CREATE TABLE "CreatorReferralAttribution" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "creatorProfileId" TEXT NOT NULL,
  "codeSnapshot" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreatorReferralAttribution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorReferralAttribution_userId_key" ON "CreatorReferralAttribution"("userId");
CREATE INDEX "CreatorReferralAttribution_creatorProfileId_createdAt_idx" ON "CreatorReferralAttribution"("creatorProfileId", "createdAt");
CREATE INDEX "CreatorReferralAttribution_codeSnapshot_idx" ON "CreatorReferralAttribution"("codeSnapshot");

ALTER TABLE "CreatorReferralAttribution"
ADD CONSTRAINT "CreatorReferralAttribution_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreatorReferralAttribution"
ADD CONSTRAINT "CreatorReferralAttribution_creatorProfileId_fkey"
FOREIGN KEY ("creatorProfileId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
