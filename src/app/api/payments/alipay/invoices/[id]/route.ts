import { redirect } from "next/navigation";
import { InvoiceStatus, UserRole } from "@prisma/client";
import { buildAlipayPagePayUrl, decimalAmount } from "@/lib/alipay";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: { brand: true, campaign: true },
  });

  if (!invoice || invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.VOID || invoice.status === InvoiceStatus.REJECTED) {
    redirect("/brand/billing?error=This invoice cannot be paid.");
  }
  if (invoice.currency !== "CNY") {
    redirect("/brand/billing?error=Alipay currently only supports CNY invoices.");
  }
  const provider = await prisma.paymentProviderConfig.findUnique({ where: { provider: "alipay" } });
  if (provider && (!provider.enabled || !provider.visibleToBrand)) {
    redirect(`/brand/billing?error=${encodeURIComponent(provider.maintenanceMessage || "支付宝通道维护中，请使用其他付款方式。")}`);
  }
  if (provider && (!provider.privateKeyConfigured || !provider.publicKeyConfigured)) {
    redirect("/brand/billing?error=Alipay is not fully configured.");
  }

  const outTradeNo = invoice.paymentReference?.startsWith("ALIPAY-") ? invoice.paymentReference : `ALIPAY-${invoice.id}`;
  try {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: invoice.status === InvoiceStatus.REQUESTED ? InvoiceStatus.OPEN : invoice.status,
        paymentMethod: "Alipay",
        paymentReference: outTradeNo,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "alipay.invoice_payment_started",
        entityType: "invoice",
        entityId: invoice.id,
        afterJson: { outTradeNo, amount: decimalAmount(invoice.amount), currency: invoice.currency },
      },
    });
  } catch {
    redirect("/brand/billing?error=Unable to start Alipay payment for this invoice.");
  }

  let paymentUrl: string;
  try {
    paymentUrl = await buildAlipayPagePayUrl({
      outTradeNo,
      totalAmount: decimalAmount(invoice.amount),
      subject: invoice.campaign?.title ? `Tanglin Campaign - ${invoice.campaign.title}` : `Tanglin Balance - ${invoice.brand.brandName}`,
      body: invoice.note ?? undefined,
    });
  } catch (error) {
    redirect(`/brand/billing?error=${encodeURIComponent(error instanceof Error ? error.message : "Alipay is not configured.")}`);
  }

  redirect(paymentUrl);
}
