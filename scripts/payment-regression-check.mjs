import fs from "node:fs";
import path from "node:path";
import { InvoiceStatus, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadDotenv();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function loadDotenv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function money(value) {
  return Number(value ?? 0);
}

function serialize(record) {
  if (record == null) return record;
  if (record instanceof Date) return record.toISOString();
  if (Array.isArray(record)) return record.map(serialize);
  if (typeof record === "object") {
    if (typeof record.toNumber === "function") return record.toString();
    return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, serialize(value)]));
  }
  return record;
}

function providerFromReference(reference) {
  if (reference?.startsWith("ALIPAY-")) return "alipay";
  if (reference?.startsWith("WECHAT-")) return "wechat_pay";
  return null;
}

async function main() {
  const failures = [];
  const warnings = [];

  try {
    await prisma.paymentProviderEvent.count();
  } catch (error) {
    if (error?.code === "P2021" || error?.code === "P2022") {
      console.error(
        JSON.stringify(
          {
            ok: false,
            code: "DATABASE_MIGRATION_REQUIRED",
            message: "Payment regression checks require the latest payment migrations. Run prisma migrate deploy/dev before this check.",
            checkedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const paidInvoices = await prisma.invoice.findMany({
    where: { status: InvoiceStatus.PAID, isDemo: false },
    include: {
      brand: true,
    },
    orderBy: { paidAt: "desc" },
    take: 1000,
  });
  const paidInvoiceIds = paidInvoices.map((invoice) => invoice.id);
  const invoiceLedgers = paidInvoiceIds.length
    ? await prisma.brandLedgerTransaction.findMany({
        where: { relatedInvoiceId: { in: paidInvoiceIds } },
      })
    : [];
  const invoiceLedgersByInvoiceId = new Map();
  for (const ledger of invoiceLedgers) {
    invoiceLedgersByInvoiceId.set(ledger.relatedInvoiceId, [...(invoiceLedgersByInvoiceId.get(ledger.relatedInvoiceId) ?? []), ledger]);
  }

  const paidInvoicesMissingReference = paidInvoices.filter((invoice) => !invoice.paymentReference);
  if (paidInvoicesMissingReference.length) {
    warnings.push({
      code: "PAID_INVOICE_MISSING_PAYMENT_REFERENCE",
      count: paidInvoicesMissingReference.length,
      samples: paidInvoicesMissingReference.slice(0, 20).map((invoice) => serialize({
        id: invoice.id,
        brand: invoice.brand.brandName,
        amount: invoice.amount,
        paidAt: invoice.paidAt,
      })),
    });
  }

  const paidInvoicesMissingLedger = paidInvoices.filter((invoice) => {
    const confirmedPaymentLedgers = (invoiceLedgersByInvoiceId.get(invoice.id) ?? []).filter((ledger) => ledger.type === "PAYMENT" && ledger.status === "CONFIRMED");
    const totalLedgerAmount = confirmedPaymentLedgers.reduce((sum, ledger) => sum + money(ledger.amount), 0);
    return Math.abs(totalLedgerAmount - money(invoice.amount)) >= 0.01;
  });
  if (paidInvoicesMissingLedger.length) {
    failures.push({
      code: "PAID_INVOICE_LEDGER_AMOUNT_MISMATCH",
      count: paidInvoicesMissingLedger.length,
      samples: paidInvoicesMissingLedger.slice(0, 20).map((invoice) => serialize({
        id: invoice.id,
        brand: invoice.brand.brandName,
        amount: invoice.amount,
        ledgerPaymentTotal: (invoiceLedgersByInvoiceId.get(invoice.id) ?? [])
          .filter((ledger) => ledger.type === "PAYMENT" && ledger.status === "CONFIRMED")
          .reduce((sum, ledger) => sum + money(ledger.amount), 0),
        paymentReference: invoice.paymentReference,
      })),
    });
  }

  const channelInvoicesWithoutEvents = paidInvoices.filter((invoice) => providerFromReference(invoice.paymentReference));
  const channelInvoiceIds = channelInvoicesWithoutEvents.map((invoice) => invoice.id);
  const channelPaymentEvents = channelInvoiceIds.length
    ? await prisma.paymentProviderEvent.findMany({
        where: {
          entityType: "invoice",
          entityId: { in: channelInvoiceIds },
          eventType: { in: ["payment_notify", "payment_query"] },
          status: "SUCCESS",
        },
        select: { entityId: true },
      })
    : [];
  const channelPaymentEventInvoiceIds = new Set(channelPaymentEvents.map((event) => event.entityId));
  const missingChannelEvents = channelInvoicesWithoutEvents.filter((invoice) => !channelPaymentEventInvoiceIds.has(invoice.id));
  if (missingChannelEvents.length) {
    warnings.push({
      code: "CHANNEL_PAID_INVOICE_WITHOUT_SUCCESS_EVENT",
      count: missingChannelEvents.length,
      samples: missingChannelEvents.slice(0, 20).map((invoice) => serialize({
        id: invoice.id,
        brand: invoice.brand.brandName,
        paymentReference: invoice.paymentReference,
        paidAt: invoice.paidAt,
      })),
    });
  }

  const nonRejectedRefunds = await prisma.brandRefundRequest.findMany({
    where: { status: { not: "REJECTED" }, isDemo: false },
    include: {
      brand: true,
      relatedInvoice: true,
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  const refundIds = nonRejectedRefunds.map((refund) => refund.id);
  const refundLedgers = refundIds.length
    ? await prisma.brandLedgerTransaction.findMany({
        where: { relatedRefundId: { in: refundIds } },
      })
    : [];
  const refundLedgersByRefundId = new Map();
  for (const ledger of refundLedgers) {
    refundLedgersByRefundId.set(ledger.relatedRefundId, [...(refundLedgersByRefundId.get(ledger.relatedRefundId) ?? []), ledger]);
  }

  const overRefundedInvoices = Array.from(
    nonRejectedRefunds
      .filter((refund) => refund.relatedInvoice)
      .reduce((map, refund) => {
        const current = map.get(refund.relatedInvoiceId) ?? {
          invoice: refund.relatedInvoice,
          totalRefund: 0,
          refunds: [],
        };
        current.totalRefund += money(refund.amount);
        current.refunds.push(refund.id);
        map.set(refund.relatedInvoiceId, current);
        return map;
      }, new Map())
      .values(),
  ).filter((item) => item.invoice && item.totalRefund - money(item.invoice.amount) >= 0.01);
  if (overRefundedInvoices.length) {
    failures.push({
      code: "INVOICE_OVER_REFUNDED",
      count: overRefundedInvoices.length,
      samples: overRefundedInvoices.slice(0, 20).map((item) => serialize({
        invoiceId: item.invoice.id,
        paymentReference: item.invoice.paymentReference,
        invoiceAmount: item.invoice.amount,
        totalRefund: item.totalRefund,
        refunds: item.refunds,
      })),
    });
  }

  const paidRefundsWithLedgerMismatch = nonRejectedRefunds.filter((refund) => {
    if (refund.status !== "PAID") return false;
    const confirmedRefundLedgers = (refundLedgersByRefundId.get(refund.id) ?? []).filter((ledger) => ledger.type === "REFUND" && ledger.status === "CONFIRMED");
    const totalLedgerAmount = confirmedRefundLedgers.reduce((sum, ledger) => sum + money(ledger.amount), 0);
    return Math.abs(totalLedgerAmount - money(refund.amount)) >= 0.01;
  });
  if (paidRefundsWithLedgerMismatch.length) {
    failures.push({
      code: "PAID_REFUND_LEDGER_AMOUNT_MISMATCH",
      count: paidRefundsWithLedgerMismatch.length,
      samples: paidRefundsWithLedgerMismatch.slice(0, 20).map((refund) => serialize({
        id: refund.id,
        brand: refund.brand.brandName,
        amount: refund.amount,
        ledgerRefundTotal: (refundLedgersByRefundId.get(refund.id) ?? [])
          .filter((ledger) => ledger.type === "REFUND" && ledger.status === "CONFIRMED")
          .reduce((sum, ledger) => sum + money(ledger.amount), 0),
        provider: refund.provider,
        providerRefundId: refund.providerRefundId,
      })),
    });
  }

  const providerRefundsMissingReference = nonRejectedRefunds.filter((refund) => refund.provider && !refund.providerRefundId && refund.status !== "PENDING");
  if (providerRefundsMissingReference.length) {
    warnings.push({
      code: "PROVIDER_REFUND_MISSING_REFUND_ID",
      count: providerRefundsMissingReference.length,
      samples: providerRefundsMissingReference.slice(0, 20).map((refund) => serialize({
        id: refund.id,
        brand: refund.brand.brandName,
        provider: refund.provider,
        status: refund.status,
      })),
    });
  }

  const staleFailedEvents = await prisma.paymentProviderEvent.findMany({
    where: {
      status: "FAILED",
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  if (staleFailedEvents.length) {
    warnings.push({
      code: "STALE_FAILED_PAYMENT_PROVIDER_EVENTS",
      count: staleFailedEvents.length,
      samples: staleFailedEvents.slice(0, 20).map((event) => serialize({
        id: event.id,
        provider: event.provider,
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        errorMessage: event.errorMessage,
        createdAt: event.createdAt,
      })),
    });
  }

  const summary = {
    ok: failures.length === 0,
    checkedAt: new Date().toISOString(),
    failures,
    warnings,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (failures.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
