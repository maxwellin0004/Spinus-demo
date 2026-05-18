import { revalidatePath } from "next/cache";
import { decryptWechatResource, requireWechatPayConfig, verifyWechatNotificationSignature } from "@/lib/wechat-pay";
import { confirmInvoicePaidByProvider } from "@/lib/invoice-payments";
import { beginPaymentProviderEvent, completePaymentProviderEvent, paymentEventKey } from "@/lib/payment-events";
import { prisma } from "@/lib/prisma";

type WechatNotifyBody = {
  event_type?: string;
  resource?: {
    associated_data?: string;
    nonce?: string;
    ciphertext?: string;
  };
};

type WechatTransaction = {
  out_trade_no?: string;
  transaction_id?: string;
  trade_state?: string;
  amount?: {
    total?: number;
    payer_total?: number;
    currency?: string;
    payer_currency?: string;
  };
};

export async function POST(request: Request) {
  let config;
  try {
    config = await requireWechatPayConfig();
  } catch {
    return Response.json({ code: "FAIL", message: "WeChat Pay is not configured" }, { status: 200 });
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get("wechatpay-timestamp") || "";
  const nonce = request.headers.get("wechatpay-nonce") || "";
  const signature = request.headers.get("wechatpay-signature") || "";
  const event = await beginPaymentProviderEvent({
    provider: "wechat_pay",
    eventType: "payment_notify",
    eventKey: paymentEventKey("notify", timestamp, nonce, signature.slice(0, 32)),
    requestJson: { headers: { timestamp, nonce, signature }, body: rawBody },
  });
  if (event.duplicate && event.event.status === "SUCCESS") {
    return Response.json({ code: "SUCCESS", message: "OK" });
  }
  if (!timestamp || !nonce || !signature || !verifyWechatNotificationSignature({ timestamp, nonceValue: nonce, body: rawBody, signature, platformPublicKey: config.platformPublicKey })) {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", errorMessage: "invalid_signature" });
    return Response.json({ code: "FAIL", message: "Invalid signature" }, { status: 200 });
  }

  let body: WechatNotifyBody;
  try {
    body = JSON.parse(rawBody) as WechatNotifyBody;
  } catch {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", errorMessage: "invalid_json" });
    return Response.json({ code: "FAIL", message: "Invalid JSON" }, { status: 200 });
  }
  if (body.event_type !== "TRANSACTION.SUCCESS") {
    await completePaymentProviderEvent({ id: event.event.id, status: "IGNORED", responseJson: { eventType: body.event_type } });
    return Response.json({ code: "SUCCESS", message: "OK" });
  }
  if (!body.resource?.nonce || !body.resource.ciphertext) {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", errorMessage: "missing_resource" });
    return Response.json({ code: "FAIL", message: "Missing resource" }, { status: 200 });
  }

  let transaction: WechatTransaction;
  try {
    const plaintext = decryptWechatResource({
      apiV3Key: config.apiV3Key,
      associatedData: body.resource.associated_data,
      nonceValue: body.resource.nonce,
      ciphertext: body.resource.ciphertext,
    });
    transaction = JSON.parse(plaintext) as WechatTransaction;
  } catch {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", errorMessage: "decrypt_failed" });
    return Response.json({ code: "FAIL", message: "Decrypt failed" }, { status: 200 });
  }

  const outTradeNo = transaction.out_trade_no;
  const tradeNo = transaction.transaction_id;
  const totalFen = transaction.amount?.payer_total ?? transaction.amount?.total;
  if (transaction.trade_state !== "SUCCESS" || !outTradeNo?.startsWith("WECHAT-") || !tradeNo || totalFen == null) {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", responseJson: { transaction }, errorMessage: "invalid_transaction" });
    return Response.json({ code: "FAIL", message: "Invalid transaction" }, { status: 200 });
  }

  const invoiceId = outTradeNo.slice("WECHAT-".length);
  await prisma.paymentProviderEvent.update({
    where: { id: event.event.id },
    data: { entityType: "invoice", entityId: invoiceId },
  });
  const result = await confirmInvoicePaidByProvider({
    invoiceId,
    paymentReference: outTradeNo,
    provider: "WeChat Pay",
    providerTradeNo: tradeNo,
    totalAmount: (totalFen / 100).toFixed(2),
    rawNotify: { body, transaction },
  });
  if (!result.ok) {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", responseJson: { result, transaction }, errorMessage: result.reason });
    return Response.json({ code: "FAIL", message: result.reason }, { status: 200 });
  }
  await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: { result, transaction } });

  revalidatePath("/brand/billing");
  revalidatePath("/admin/payments");
  return Response.json({ code: "SUCCESS", message: "OK" });
}
