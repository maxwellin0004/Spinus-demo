ALTER TABLE "PaymentProviderConfig" ADD COLUMN "visibleToBrand" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PaymentProviderConfig" ADD COLUMN "maintenanceMessage" TEXT;
ALTER TABLE "PaymentProviderConfig" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 100;
