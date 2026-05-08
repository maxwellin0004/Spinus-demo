import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireRole(UserRole.ADMIN);
  const [brandLedgers, walletTransactions, withdrawals, refunds, invoices] = await Promise.all([
    prisma.brandLedgerTransaction.findMany({
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.walletTransaction.findMany({
      include: { creator: true, relatedSubmission: { include: { campaign: true } }, withdrawalRequest: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawalRequest.findMany({
      include: { creator: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brandRefundRequest.findMany({
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows = [
    ["source", "entity_id", "party_type", "party_name", "campaign", "type", "amount", "currency", "status", "before_balance", "after_balance", "payment_reference", "note", "created_at"],
    ...brandLedgers.map((ledger) => [
      "brand_ledger",
      ledger.id,
      "brand",
      ledger.brand.brandName,
      ledger.campaign?.title ?? "",
      ledger.type,
      ledger.amount,
      ledger.currency,
      ledger.status,
      ledger.beforeBalance,
      ledger.afterBalance,
      "",
      ledger.note ?? "",
      ledger.createdAt.toISOString(),
    ]),
    ...walletTransactions.map((tx) => [
      "wallet_transaction",
      tx.id,
      "kol",
      tx.creator.displayName,
      tx.relatedSubmission?.campaign.title ?? "",
      tx.type,
      tx.amount,
      tx.currency,
      tx.status,
      "",
      "",
      "",
      tx.note ?? "",
      tx.createdAt.toISOString(),
    ]),
    ...withdrawals.map((request) => [
      "withdrawal_request",
      request.id,
      "kol",
      request.creator.displayName,
      "",
      request.payoutMethod,
      request.amount,
      request.currency,
      request.status,
      "",
      "",
      "",
      request.adminNote ?? "",
      request.createdAt.toISOString(),
    ]),
    ...refunds.map((request) => [
      "brand_refund",
      request.id,
      "brand",
      request.brand.brandName,
      request.campaign?.title ?? "",
      request.payoutMethod ?? "",
      request.amount,
      request.currency,
      request.status,
      "",
      "",
      "",
      request.adminNote ?? "",
      request.createdAt.toISOString(),
    ]),
    ...invoices.map((invoice) => [
      "invoice",
      invoice.id,
      "brand",
      invoice.brand.brandName,
      invoice.campaign?.title ?? "",
      invoice.invoiceNumber ?? "",
      invoice.amount,
      invoice.currency,
      invoice.status,
      "",
      "",
      invoice.paymentReference ?? "",
      invoice.note ?? "",
      invoice.createdAt.toISOString(),
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="finance-ledger.csv"`,
    },
  });
}
