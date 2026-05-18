CREATE TABLE "PaymentProviderEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestJson" JSONB,
    "responseJson" JSONB,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProviderEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentProviderEvent_provider_eventKey_key" ON "PaymentProviderEvent"("provider", "eventKey");
CREATE INDEX "PaymentProviderEvent_provider_eventType_status_idx" ON "PaymentProviderEvent"("provider", "eventType", "status");
CREATE INDEX "PaymentProviderEvent_entityType_entityId_idx" ON "PaymentProviderEvent"("entityType", "entityId");
CREATE INDEX "PaymentProviderEvent_createdAt_idx" ON "PaymentProviderEvent"("createdAt");
