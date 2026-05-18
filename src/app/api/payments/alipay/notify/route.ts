import { revalidatePath } from "next/cache";
import { requireAlipayConfig, verifyAlipaySignature } from "@/lib/alipay";
import { confirmInvoicePaidByProvider } from "@/lib/invoice-payments";
import { beginPaymentProviderEvent, completePaymentProviderEvent, paymentEventKey } from "@/lib/payment-events";

export async function POST(request: Request) {
  let config;
  try {
    config = await requireAlipayConfig();
  } catch {
    return new Response("fail", { status: 200 });
  }

  const formData = await request.formData();
  const params = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
  const outTradeNo = params.out_trade_no;
  const invoiceId = outTradeNo?.startsWith("ALIPAY-") ? outTradeNo.slice("ALIPAY-".length) : undefined;
  const event = await beginPaymentProviderEvent({
    provider: "alipay",
    eventType: "payment_notify",
    eventKey: paymentEventKey("notify", params.notify_id, params.trade_no, outTradeNo, params.trade_status),
    entityType: invoiceId ? "invoice" : undefined,
    entityId: invoiceId,
    requestJson: params,
  });
  if (event.duplicate && event.event.status === "SUCCESS") {
    return new Response("success", { status: 200 });
  }
  if (!verifyAlipaySignature(params, config.alipayPublicKey)) {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", errorMessage: "invalid_signature" });
    return new Response("fail", { status: 200 });
  }
  if (params.app_id !== config.appId) {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", errorMessage: "app_id_mismatch" });
    return new Response("fail", { status: 200 });
  }
  if (params.trade_status !== "TRADE_SUCCESS" && params.trade_status !== "TRADE_FINISHED") {
    await completePaymentProviderEvent({ id: event.event.id, status: "IGNORED", responseJson: { tradeStatus: params.trade_status } });
    return new Response("success", { status: 200 });
  }

  const tradeNo = params.trade_no;
  const totalAmount = params.total_amount;
  if (!outTradeNo?.startsWith("ALIPAY-") || !invoiceId || !tradeNo || !totalAmount) {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", errorMessage: "invalid_payment_payload" });
    return new Response("fail", { status: 200 });
  }

  const result = await confirmInvoicePaidByProvider({
    invoiceId,
    paymentReference: outTradeNo,
    provider: "Alipay",
    providerTradeNo: tradeNo,
    totalAmount,
    rawNotify: params,
  });
  if (!result.ok) {
    await completePaymentProviderEvent({ id: event.event.id, status: "FAILED", responseJson: { result }, errorMessage: result.reason });
    return new Response("fail", { status: 200 });
  }
  await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: { result } });

  revalidatePath("/brand/billing");
  revalidatePath("/admin/payments");
  return new Response("success", { status: 200 });
}
