-- CreateTable
CREATE TABLE "InvitationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "adminProfileId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdById" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationAttribution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitationCodeId" TEXT NOT NULL,
    "codeSnapshot" TEXT NOT NULL,
    "invitedByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitationCode_code_key" ON "InvitationCode"("code");

-- CreateIndex
CREATE INDEX "InvitationCode_adminProfileId_active_idx" ON "InvitationCode"("adminProfileId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationAttribution_userId_key" ON "InvitationAttribution"("userId");

-- CreateIndex
CREATE INDEX "InvitationAttribution_invitedByAdminId_createdAt_idx" ON "InvitationAttribution"("invitedByAdminId", "createdAt");

-- CreateIndex
CREATE INDEX "InvitationAttribution_codeSnapshot_idx" ON "InvitationAttribution"("codeSnapshot");

-- AddForeignKey
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_adminProfileId_fkey" FOREIGN KEY ("adminProfileId") REFERENCES "AdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationAttribution" ADD CONSTRAINT "InvitationAttribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationAttribution" ADD CONSTRAINT "InvitationAttribution_invitationCodeId_fkey" FOREIGN KEY ("invitationCodeId") REFERENCES "InvitationCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationAttribution" ADD CONSTRAINT "InvitationAttribution_invitedByAdminId_fkey" FOREIGN KEY ("invitedByAdminId") REFERENCES "AdminProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
