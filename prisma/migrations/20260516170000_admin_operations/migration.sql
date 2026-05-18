CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
  "brandId" TEXT,
  "creatorId" TEXT,
  "campaignId" TEXT,
  "proofId" TEXT,
  "disputeId" TEXT,
  "openedByUserId" TEXT,
  "assignedToId" TEXT,
  "lastMessageAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "internalNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicketNote" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorUserId" TEXT,
  "authorRole" "UserRole",
  "body" TEXT NOT NULL,
  "internal" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicketNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");
CREATE INDEX "SupportTicket_brandId_createdAt_idx" ON "SupportTicket"("brandId", "createdAt");
CREATE INDEX "SupportTicket_creatorId_createdAt_idx" ON "SupportTicket"("creatorId", "createdAt");
CREATE INDEX "SupportTicket_assignedToId_status_idx" ON "SupportTicket"("assignedToId", "status");
CREATE INDEX "SupportTicket_campaignId_idx" ON "SupportTicket"("campaignId");
CREATE INDEX "SupportTicket_proofId_idx" ON "SupportTicket"("proofId");
CREATE INDEX "SupportTicket_disputeId_idx" ON "SupportTicket"("disputeId");
CREATE INDEX "SupportTicketNote_ticketId_createdAt_idx" ON "SupportTicketNote"("ticketId", "createdAt");

ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportTicketNote"
ADD CONSTRAINT "SupportTicketNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportTicketNote"
ADD CONSTRAINT "SupportTicketNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
