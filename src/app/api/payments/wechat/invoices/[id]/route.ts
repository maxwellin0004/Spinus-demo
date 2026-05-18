import QRCode from "qrcode";
import { InvoiceStatus, UserRole } from "@prisma/client";
import { amountFen, createWechatNativeOrder } from "@/lib/wechat-pay";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: { brand: true, campaign: true },
  });
  if (!invoice || invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.VOID || invoice.status === InvoiceStatus.REJECTED) {
    return html("<p>This invoice cannot be paid.</p>", 400);
  }
  if (invoice.currency !== "CNY") {
    return html("<p>WeChat Pay currently only supports CNY invoices.</p>", 400);
  }
  const provider = await prisma.paymentProviderConfig.findUnique({ where: { provider: "wechat_pay" } });
  if (provider && (!provider.enabled || !provider.visibleToBrand)) {
    return html(`<p>${provider.maintenanceMessage || "微信支付通道维护中，请使用其他付款方式。"}</p><p><a href="/brand/billing">Back to billing</a></p>`, 503);
  }
  if (provider && (!provider.privateKeyConfigured || !provider.publicKeyConfigured || !provider.apiV3KeyConfigured)) {
    return html('<p>WeChat Pay is not fully configured.</p><p><a href="/brand/billing">Back to billing</a></p>', 503);
  }

  const outTradeNo = invoice.paymentReference?.startsWith("WECHAT-") ? invoice.paymentReference : `WECHAT-${invoice.id}`;
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: invoice.status === InvoiceStatus.REQUESTED ? InvoiceStatus.OPEN : invoice.status,
      paymentMethod: "WeChat Pay",
      paymentReference: outTradeNo,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.userId,
      actorRole: session.role,
      action: "wechat_pay.invoice_payment_started",
      entityType: "invoice",
      entityId: invoice.id,
      afterJson: { outTradeNo, amountFen: amountFen(invoice.amount), currency: invoice.currency },
    },
  });

  let codeUrl: string;
  try {
    codeUrl = await createWechatNativeOrder({
      outTradeNo,
      amountFen: amountFen(invoice.amount),
      description: invoice.campaign?.title ? `Tanglin ${invoice.campaign.title}` : `Tanglin ${invoice.brand.brandName}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WeChat Pay is not configured.";
    return html(`<p>${message}</p><p><a href="/brand/billing">Back to billing</a></p>`, 500);
  }

  const qr = await QRCode.toDataURL(codeUrl, { margin: 1, width: 260 });
  return html(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WeChat Pay</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fffaf0; font-family: Arial, "Microsoft YaHei", sans-serif; color: #17211c; }
      main { width: min(92vw, 420px); border: 1px solid rgba(64,59,53,.16); border-radius: 18px; background: white; padding: 28px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,.06); }
      img { width: 260px; height: 260px; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 8px 0; color: #57534e; }
      a { display: inline-block; margin-top: 18px; color: #17211c; font-weight: 800; }
    </style>
  </head>
  <body>
    <main>
      <h1>微信扫码付款</h1>
      <p>${invoice.currency} ${Number(invoice.amount).toFixed(2)}</p>
      <img src="${qr}" alt="WeChat Pay QR code" />
      <p>付款成功后系统会通过微信支付回调自动入账。</p>
      <a href="/brand/billing?tab=invoices">返回账单</a>
    </main>
  </body>
</html>`);
}
