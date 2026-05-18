ALTER TABLE "PaymentProviderConfig" ADD COLUMN "merchantId" TEXT;
ALTER TABLE "PaymentProviderConfig" ADD COLUMN "certificateSerialNo" TEXT;
ALTER TABLE "PaymentProviderConfig" ADD COLUMN "encryptedApiV3Key" TEXT;
ALTER TABLE "PaymentProviderConfig" ADD COLUMN "apiV3KeyConfigured" BOOLEAN NOT NULL DEFAULT false;
