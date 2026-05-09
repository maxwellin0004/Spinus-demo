ALTER TABLE "Proof" ADD COLUMN "normalizedPostUrl" TEXT;

UPDATE "Proof"
SET "normalizedPostUrl" = lower(regexp_replace(split_part(coalesce("resolvedPostUrl", "postUrl"), '#', 1), '/+$', ''));

WITH ranked_proofs AS (
  SELECT
    "id",
    row_number() OVER (PARTITION BY "platform", "normalizedPostUrl" ORDER BY "createdAt", "id") AS duplicate_rank
  FROM "Proof"
)
UPDATE "Proof"
SET "normalizedPostUrl" = "Proof"."normalizedPostUrl" || '#legacy-' || "Proof"."id"
FROM ranked_proofs
WHERE "Proof"."id" = ranked_proofs."id"
  AND ranked_proofs.duplicate_rank > 1;

ALTER TABLE "Proof" ALTER COLUMN "normalizedPostUrl" SET NOT NULL;

WITH ranked_invoices AS (
  SELECT
    "id",
    row_number() OVER (PARTITION BY "paymentReference" ORDER BY "createdAt", "id") AS duplicate_rank
  FROM "Invoice"
  WHERE "paymentReference" IS NOT NULL
)
UPDATE "Invoice"
SET "paymentReference" = "Invoice"."paymentReference" || '#legacy-' || "Invoice"."id"
FROM ranked_invoices
WHERE "Invoice"."id" = ranked_invoices."id"
  AND ranked_invoices.duplicate_rank > 1;

CREATE UNIQUE INDEX "Proof_platform_normalizedPostUrl_key" ON "Proof"("platform", "normalizedPostUrl");

CREATE UNIQUE INDEX "Invoice_paymentReference_key" ON "Invoice"("paymentReference");
