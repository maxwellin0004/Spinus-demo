import { requireAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireAdminPermission("payment.view");
  const [invoices, refunds] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        OR: [
          { paymentReference: { startsWith: "ALIPAY-" } },
          { paymentReference: { startsWith: "WECHAT-" } },
        ],
      },
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brandRefundRequest.findMany({
      where: { providerRefundId: { not: null } },
      include: { brand: true, campaign: true, relatedInvoice: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const refundIds = refunds.map((refund) => refund.id);
  const events = await prisma.paymentProviderEvent.findMany({
    where: {
      OR: [
        invoiceIds.length ? { entityType: "invoice", entityId: { in: invoiceIds } } : undefined,
        refundIds.length ? { entityType: "brand_refund_request", entityId: { in: refundIds } } : undefined,
      ].filter(Boolean) as Array<{ entityType: string; entityId: { in: string[] } }>,
    },
    orderBy: { createdAt: "desc" },
  });
  const eventSummary = new Map<string, { total: number; success: number; failed: number; latest: string }>();
  for (const event of events) {
    const key = `${event.entityType}:${event.entityId}`;
    const current = eventSummary.get(key) ?? { total: 0, success: 0, failed: 0, latest: "" };
    current.total += 1;
    if (event.status === "SUCCESS") current.success += 1;
    if (event.status === "FAILED") current.failed += 1;
    if (!current.latest) current.latest = event.createdAt.toISOString();
    eventSummary.set(key, current);
  }

  const rows = [
    [
      "record_type",
      "brand",
      "campaign",
      "invoice_id",
      "invoice_number",
      "payment_provider",
      "payment_reference",
      "provider_refund_id",
      "amount",
      "currency",
      "business_status",
      "provider_refund_status",
      "event_total",
      "event_success",
      "event_failed",
      "latest_event_at",
      "paid_at",
      "refunded_at",
      "created_at",
    ],
    ...invoices.map((invoice) => {
      const summary = eventSummary.get(`invoice:${invoice.id}`);
      return [
        "invoice",
        invoice.brand.brandName,
        invoice.campaign?.title ?? "",
        invoice.id,
        invoice.invoiceNumber ?? "",
        invoice.paymentMethod ?? "",
        invoice.paymentReference ?? "",
        "",
        invoice.amount,
        invoice.currency,
        invoice.status,
        "",
        summary?.total ?? 0,
        summary?.success ?? 0,
        summary?.failed ?? 0,
        summary?.latest ?? "",
        invoice.paidAt?.toISOString() ?? "",
        "",
        invoice.createdAt.toISOString(),
      ];
    }),
    ...refunds.map((refund) => {
      const summary = eventSummary.get(`brand_refund_request:${refund.id}`);
      return [
        "refund",
        refund.brand.brandName,
        refund.campaign?.title ?? refund.relatedInvoice?.campaignId ?? "",
        refund.relatedInvoiceId ?? "",
        refund.relatedInvoice?.invoiceNumber ?? "",
        refund.provider ?? "",
        refund.relatedInvoice?.paymentReference ?? "",
        refund.providerRefundId ?? "",
        refund.amount,
        refund.currency,
        refund.status,
        refund.providerRefundStatus ?? "",
        summary?.total ?? 0,
        summary?.success ?? 0,
        summary?.failed ?? 0,
        summary?.latest ?? "",
        refund.relatedInvoice?.paidAt?.toISOString() ?? "",
        refund.refundedAt?.toISOString() ?? "",
        refund.createdAt.toISOString(),
      ];
    }),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="payment-reconciliation.csv"`,
    },
  });
}
