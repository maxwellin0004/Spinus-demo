CREATE TYPE "InvoiceStatus" AS ENUM ('REQUESTED', 'OPEN', 'PAYMENT_SUBMITTED', 'PAID', 'REJECTED', 'VOID');

ALTER TABLE "Invoice"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "InvoiceStatus" USING "status"::"InvoiceStatus",
  ALTER COLUMN "status" SET DEFAULT 'OPEN';
