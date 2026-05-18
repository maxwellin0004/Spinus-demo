import { BrandLedgerTxStatus, BrandLedgerTxType, CampaignStatus, InvoiceStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyPaymentAdmins } from "@/lib/payment-notifications";
import { assertCampaignTransition } from "@/lib/state-machines";

function invoiceNumber(invoiceId: string) {
  return `INV-${new Date().getFullYear()}-${invoiceId.slice(-6).toUpperCase()}`;
}

export function evaluateProviderInvoicePayment({
  invoiceStatus,
  invoiceAmount,
  providerAmount,
  brandBalance,
  campaign,
}: {
  invoiceStatus: InvoiceStatus;
  invoiceAmount: number | string | { toString(): string };
  providerAmount: number | string | { toString(): string };
  brandBalance: number | string | { toString(): string };
  campaign?: {
    status: CampaignStatus;
    escrowAmount: number | string | { toString(): string };
    escrowFrozenAmount: number | string | { toString(): string };
  } | null;
}) {
  if (invoiceStatus === InvoiceStatus.PAID) return { ok: true as const, alreadyPaid: true };

  const expected = Number(invoiceAmount).toFixed(2);
  const actual = Number(providerAmount).toFixed(2);
  if (expected !== actual) {
    return { ok: false as const, reason: "amount_mismatch" as const, expected, actual };
  }

  const afterPaymentBalance = Number(brandBalance) + Number(invoiceAmount);
  const requiredEscrow =
    campaign && campaign.status === CampaignStatus.AWAITING_PAYMENT
      ? Math.max(0, Number(campaign.escrowAmount) - Number(campaign.escrowFrozenAmount))
      : 0;
  const shouldFreezeEscrow = Boolean(campaign && requiredEscrow > 0 && afterPaymentBalance >= requiredEscrow);

  return {
    ok: true as const,
    alreadyPaid: false,
    expected,
    actual,
    afterPaymentBalance,
    requiredEscrow,
    shouldFreezeEscrow,
    nextCampaignStatus: shouldFreezeEscrow ? CampaignStatus.PENDING_REVIEW : campaign?.status,
  };
}

export async function confirmInvoicePaidByProvider({
  invoiceId,
  paymentReference,
  provider,
  providerTradeNo,
  totalAmount,
  rawNotify,
}: {
  invoiceId: string;
  paymentReference: string;
  provider: "Alipay" | "WeChat Pay";
  providerTradeNo: string;
  totalAmount: string;
  rawNotify: Prisma.InputJsonValue;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, paymentReference },
    include: { brand: { include: { responsibleAdmin: true, user: true } }, campaign: true },
  });
  if (!invoice) return { ok: false as const, reason: "invoice_not_found" };
  const evaluation = evaluateProviderInvoicePayment({
    invoiceStatus: invoice.status,
    invoiceAmount: invoice.amount,
    providerAmount: totalAmount,
    brandBalance: invoice.brand.budgetBalance,
    campaign: invoice.campaign,
  });
  if (evaluation.ok && evaluation.alreadyPaid) return { ok: true as const, alreadyPaid: true };

  if (!evaluation.ok) {
    const expected = evaluation.expected;
    const actual = evaluation.actual;
    await prisma.riskFlag.create({
      data: {
        entityType: "invoice",
        entityId: invoice.id,
        level: "HIGH",
        reason: `${provider} amount mismatch: expected ${evaluation.expected}, got ${evaluation.actual}, trade ${providerTradeNo}`,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorRole: UserRole.BRAND,
        action: `${provider.toLowerCase().replaceAll(" ", "_")}.invoice_amount_mismatch`,
        entityType: "invoice",
        entityId: invoice.id,
        afterJson: { expected: evaluation.expected, actual: evaluation.actual, paymentReference, providerTradeNo, rawNotify },
      },
    });
    await prisma.$transaction(async (tx) => {
      await notifyPaymentAdmins(tx, {
        brandId: invoice.brandId,
        title: "支付金额不一致",
        body: `${provider} 回调金额异常：应收 ${expected}，实收 ${actual}，订单 ${paymentReference}。`,
        href: "/admin/payments",
      });
    });
    return { ok: false as const, reason: "amount_mismatch" };
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.invoice.findUnique({
      where: { id: invoice.id },
      include: { brand: true, campaign: true },
    });
    if (!current || current.status === InvoiceStatus.PAID) return;

    const nextInvoiceNumber = current.invoiceNumber || invoiceNumber(current.id);
    await tx.invoice.update({
      where: { id: current.id },
      data: {
        status: InvoiceStatus.PAID,
        invoiceNumber: nextInvoiceNumber,
        paidAt: new Date(),
        paymentMethod: provider,
        paymentReference,
        note: current.note || `${provider} trade ${providerTradeNo}`,
      },
    });

    const beforeBalance = Number(current.brand.budgetBalance);
    const afterPaymentBalance = beforeBalance + Number(current.amount);
    await tx.brandProfile.update({
      where: { id: current.brandId },
      data: { budgetBalance: { increment: current.amount } },
    });
    await tx.brandLedgerTransaction.updateMany({
      where: {
        brandId: current.brandId,
        campaignId: current.campaignId,
        type: BrandLedgerTxType.PAYMENT,
        status: BrandLedgerTxStatus.PENDING,
      },
      data: { status: BrandLedgerTxStatus.CONFIRMED, note: `Payment confirmed by ${provider} notify.` },
    });
    await tx.brandLedgerTransaction.create({
      data: {
        brandId: current.brandId,
        campaignId: current.campaignId,
        type: BrandLedgerTxType.PAYMENT,
        amount: current.amount,
        currency: current.currency,
        status: BrandLedgerTxStatus.CONFIRMED,
        beforeBalance,
        afterBalance: afterPaymentBalance,
        relatedInvoiceId: current.id,
        note: `${provider} payment confirmed. trade_no=${providerTradeNo}`,
      },
    });

    if (current.campaign && current.campaign.status === CampaignStatus.AWAITING_PAYMENT) {
      const requiredEscrow = Math.max(0, Number(current.campaign.escrowAmount) - Number(current.campaign.escrowFrozenAmount));
      if (requiredEscrow > 0 && afterPaymentBalance >= requiredEscrow) {
        assertCampaignTransition(current.campaign.status, CampaignStatus.PENDING_REVIEW);
        await tx.brandProfile.update({
          where: { id: current.brandId },
          data: {
            budgetBalance: { decrement: requiredEscrow },
            frozenEscrowBalance: { increment: requiredEscrow },
          },
        });
        await tx.campaign.update({
          where: { id: current.campaign.id },
          data: {
            status: CampaignStatus.PENDING_REVIEW,
            escrowFrozenAmount: { increment: requiredEscrow },
          },
        });
        await tx.brandLedgerTransaction.create({
          data: {
            brandId: current.brandId,
            campaignId: current.campaign.id,
            type: BrandLedgerTxType.ESCROW_FREEZE,
            amount: requiredEscrow,
            currency: current.currency,
            status: BrandLedgerTxStatus.CONFIRMED,
            beforeBalance: afterPaymentBalance,
            afterBalance: afterPaymentBalance - requiredEscrow,
            relatedInvoiceId: current.id,
            note: `Campaign escrow frozen after ${provider} payment confirmation.`,
          },
        });
      }
    }

    await tx.notification.create({
      data: {
        userId: current.brand.userId,
        title: `${provider} 付款已确认`,
        body: `${current.currency} ${Number(current.amount).toFixed(2)} 已入账。`,
        href: "/brand/billing",
      },
    });
    if (invoice.brand.responsibleAdmin?.userId) {
      await tx.notification.create({
        data: {
          userId: invoice.brand.responsibleAdmin.userId,
          title: `${provider} 付款自动入账`,
          body: `${invoice.brand.brandName} 的付款单已由支付回调确认。`,
          href: "/admin/payments",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorRole: UserRole.BRAND,
        action: `${provider.toLowerCase().replaceAll(" ", "_")}.invoice_paid`,
        entityType: "invoice",
        entityId: current.id,
        beforeJson: { status: current.status, budgetBalance: String(current.brand.budgetBalance) },
        afterJson: { status: InvoiceStatus.PAID, paymentReference, providerTradeNo, rawNotify },
      },
    });
  });

  return { ok: true as const, alreadyPaid: false };
}
