UPDATE "Wallet"
SET "currency" = 'CNY'
WHERE "currency" = 'USD';

UPDATE "WalletTransaction"
SET "currency" = 'CNY'
WHERE "currency" = 'USD';

UPDATE "WithdrawalRequest"
SET "currency" = 'CNY'
WHERE "currency" = 'USD';

UPDATE "Campaign"
SET "currency" = 'CNY'
WHERE "currency" = 'USD';

UPDATE "Invoice"
SET "currency" = 'CNY'
WHERE "currency" = 'USD';

UPDATE "BrandLedgerTransaction"
SET "currency" = 'CNY'
WHERE "currency" = 'USD';

UPDATE "BrandRefundRequest"
SET "currency" = 'CNY'
WHERE "currency" = 'USD';
