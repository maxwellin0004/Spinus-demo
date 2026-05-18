ALTER TABLE "BrandRefundRequest" ADD COLUMN "relatedInvoiceId" TEXT;
ALTER TABLE "BrandRefundRequest" ADD COLUMN "provider" TEXT;
ALTER TABLE "BrandRefundRequest" ADD COLUMN "providerRefundId" TEXT;
ALTER TABLE "BrandRefundRequest" ADD COLUMN "providerRefundStatus" TEXT;
ALTER TABLE "BrandRefundRequest" ADD COLUMN "providerRefundRaw" JSONB;
ALTER TABLE "BrandRefundRequest" ADD COLUMN "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "BrandRefundRequest_providerRefundId_key" ON "BrandRefundRequest"("providerRefundId");
CREATE INDEX "BrandRefundRequest_relatedInvoiceId_idx" ON "BrandRefundRequest"("relatedInvoiceId");
CREATE INDEX "BrandRefundRequest_provider_providerRefundStatus_idx" ON "BrandRefundRequest"("provider", "providerRefundStatus");

ALTER TABLE "BrandRefundRequest" ADD CONSTRAINT "BrandRefundRequest_relatedInvoiceId_fkey" FOREIGN KEY ("relatedInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
