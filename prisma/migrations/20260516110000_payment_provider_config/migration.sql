CREATE TABLE "PaymentProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "displayName" TEXT NOT NULL DEFAULT 'Alipay',
    "appId" TEXT,
    "gatewayUrl" TEXT,
    "notifyUrl" TEXT,
    "returnUrl" TEXT,
    "encryptedPrivateKey" TEXT,
    "encryptedPublicKey" TEXT,
    "privateKeyConfigured" BOOLEAN NOT NULL DEFAULT false,
    "publicKeyConfigured" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProviderConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentProviderConfig_provider_key" ON "PaymentProviderConfig"("provider");
CREATE INDEX "PaymentProviderConfig_enabled_provider_idx" ON "PaymentProviderConfig"("enabled", "provider");
