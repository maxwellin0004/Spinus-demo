import crypto from "node:crypto";
import { decryptSecret } from "@/lib/secret-crypto";
import { prisma } from "@/lib/prisma";

type WechatPayConfig = {
  appId: string;
  merchantId: string;
  certificateSerialNo: string;
  gatewayUrl: string;
  privateKey: string;
  platformPublicKey: string;
  apiV3Key: string;
  notifyUrl: string;
};

type NativeOrderInput = {
  outTradeNo: string;
  amountFen: number;
  description: string;
};

type WechatTradeQueryResult = {
  outTradeNo: string;
  transactionId?: string;
  tradeState?: string;
  totalAmount?: string;
  raw: unknown;
};

type WechatRefundInput = {
  outTradeNo: string;
  outRefundNo: string;
  amountFen: number;
  originalAmountFen: number;
  reason?: string;
};

type WechatRefundResult = {
  outTradeNo?: string;
  outRefundNo: string;
  refundId?: string;
  status?: string;
  refundAmount?: string;
  raw: unknown;
};

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function normalizePrivateKey(value: string) {
  const normalized = value.replace(/\\n/g, "\n").trim();
  if (normalized.includes("-----BEGIN")) return normalized;
  const lines = normalized.match(/.{1,64}/g)?.join("\n") ?? normalized;
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

function envConfig(): WechatPayConfig | null {
  const appId = env("WECHAT_PAY_APP_ID");
  const merchantId = env("WECHAT_PAY_MERCHANT_ID");
  const certificateSerialNo = env("WECHAT_PAY_CERT_SERIAL_NO");
  const privateKey = env("WECHAT_PAY_MERCHANT_PRIVATE_KEY");
  const platformPublicKey = env("WECHAT_PAY_PLATFORM_PUBLIC_KEY");
  const apiV3Key = env("WECHAT_PAY_API_V3_KEY");
  const notifyUrl = env("WECHAT_PAY_NOTIFY_URL");
  if (!appId || !merchantId || !certificateSerialNo || !privateKey || !platformPublicKey || !apiV3Key || !notifyUrl) return null;
  return {
    appId,
    merchantId,
    certificateSerialNo,
    gatewayUrl: env("WECHAT_PAY_GATEWAY_URL") || "https://api.mch.weixin.qq.com",
    privateKey: normalizePrivateKey(privateKey),
    platformPublicKey: normalizePublicKey(platformPublicKey),
    apiV3Key,
    notifyUrl,
  };
}

function normalizePublicKey(value: string) {
  const normalized = value.replace(/\\n/g, "\n").trim();
  if (normalized.includes("-----BEGIN")) return normalized;
  const lines = normalized.match(/.{1,64}/g)?.join("\n") ?? normalized;
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

export async function getWechatPayConfig(): Promise<WechatPayConfig | null> {
  const stored = await prisma.paymentProviderConfig.findUnique({ where: { provider: "wechat_pay" } });
  if (
    stored?.enabled &&
    stored.appId &&
    stored.merchantId &&
    stored.certificateSerialNo &&
    stored.gatewayUrl &&
    stored.notifyUrl &&
    stored.encryptedPrivateKey &&
    stored.encryptedPublicKey &&
    stored.encryptedApiV3Key
  ) {
    return {
      appId: stored.appId,
      merchantId: stored.merchantId,
      certificateSerialNo: stored.certificateSerialNo,
      gatewayUrl: stored.gatewayUrl,
      privateKey: normalizePrivateKey(decryptSecret(stored.encryptedPrivateKey)),
      platformPublicKey: normalizePublicKey(decryptSecret(stored.encryptedPublicKey)),
      apiV3Key: decryptSecret(stored.encryptedApiV3Key),
      notifyUrl: stored.notifyUrl,
    };
  }
  return envConfig();
}

export async function requireWechatPayConfig() {
  const config = await getWechatPayConfig();
  if (!config) {
    throw new Error("WeChat Pay is not configured.");
  }
  return config;
}

function nonce() {
  return crypto.randomBytes(16).toString("hex");
}

function signMessage(message: string, privateKey: string) {
  return crypto.createSign("RSA-SHA256").update(message, "utf8").sign(privateKey, "base64");
}

function authorization({
  method,
  url,
  body,
  config,
}: {
  method: string;
  url: URL;
  body: string;
  config: WechatPayConfig;
}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = nonce();
  const path = `${url.pathname}${url.search}`;
  const message = `${method}\n${path}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const signature = signMessage(message, config.privateKey);
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.merchantId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${config.certificateSerialNo}"`;
}

export async function createWechatNativeOrder(input: NativeOrderInput) {
  const config = await requireWechatPayConfig();
  const url = new URL("/v3/pay/transactions/native", config.gatewayUrl);
  const body = JSON.stringify({
    appid: config.appId,
    mchid: config.merchantId,
    description: input.description.slice(0, 127),
    out_trade_no: input.outTradeNo,
    notify_url: config.notifyUrl,
    amount: {
      total: input.amountFen,
      currency: "CNY",
    },
  });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization({ method: "POST", url, body, config }),
    },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as { code_url?: string; message?: string; code?: string };
  if (!response.ok || !payload.code_url) {
    throw new Error(payload.message || payload.code || `WeChat Pay native order failed: ${response.status}`);
  }
  return payload.code_url;
}

export async function queryWechatTrade(outTradeNo: string): Promise<WechatTradeQueryResult> {
  const config = await requireWechatPayConfig();
  const url = new URL(`/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}`, config.gatewayUrl);
  url.searchParams.set("mchid", config.merchantId);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: authorization({ method: "GET", url, body: "", config }),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    out_trade_no?: string;
    transaction_id?: string;
    trade_state?: string;
    amount?: { payer_total?: number; total?: number };
    message?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || payload.code || `WeChat Pay trade query failed: ${response.status}`);
  }
  const totalFen = payload.amount?.payer_total ?? payload.amount?.total;
  return {
    outTradeNo: payload.out_trade_no || outTradeNo,
    transactionId: payload.transaction_id,
    tradeState: payload.trade_state,
    totalAmount: totalFen == null ? undefined : (totalFen / 100).toFixed(2),
    raw: payload,
  };
}

export async function refundWechatTrade(input: WechatRefundInput): Promise<WechatRefundResult> {
  const config = await requireWechatPayConfig();
  const url = new URL("/v3/refund/domestic/refunds", config.gatewayUrl);
  const body = JSON.stringify({
    out_trade_no: input.outTradeNo,
    out_refund_no: input.outRefundNo,
    ...(input.reason ? { reason: input.reason.slice(0, 80) } : {}),
    amount: {
      refund: input.amountFen,
      total: input.originalAmountFen,
      currency: "CNY",
    },
  });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization({ method: "POST", url, body, config }),
    },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    out_trade_no?: string;
    out_refund_no?: string;
    refund_id?: string;
    status?: string;
    amount?: { refund?: number };
    message?: string;
    code?: string;
  };
  if (!response.ok || !payload.out_refund_no) {
    throw new Error(payload.message || payload.code || `WeChat Pay refund failed: ${response.status}`);
  }
  return {
    outTradeNo: payload.out_trade_no || input.outTradeNo,
    outRefundNo: payload.out_refund_no || input.outRefundNo,
    refundId: payload.refund_id,
    status: payload.status,
    refundAmount: payload.amount?.refund == null ? undefined : (payload.amount.refund / 100).toFixed(2),
    raw: payload,
  };
}

export async function queryWechatRefund(outRefundNo: string): Promise<WechatRefundResult> {
  const config = await requireWechatPayConfig();
  const url = new URL(`/v3/refund/domestic/refunds/${encodeURIComponent(outRefundNo)}`, config.gatewayUrl);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: authorization({ method: "GET", url, body: "", config }),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    out_trade_no?: string;
    out_refund_no?: string;
    refund_id?: string;
    status?: string;
    amount?: { refund?: number };
    message?: string;
    code?: string;
  };
  if (!response.ok || !payload.out_refund_no) {
    throw new Error(payload.message || payload.code || `WeChat Pay refund query failed: ${response.status}`);
  }
  return {
    outTradeNo: payload.out_trade_no,
    outRefundNo: payload.out_refund_no || outRefundNo,
    refundId: payload.refund_id,
    status: payload.status,
    refundAmount: payload.amount?.refund == null ? undefined : (payload.amount.refund / 100).toFixed(2),
    raw: payload,
  };
}

export function decryptWechatResource({
  apiV3Key,
  associatedData,
  nonceValue,
  ciphertext,
}: {
  apiV3Key: string;
  associatedData?: string;
  nonceValue: string;
  ciphertext: string;
}) {
  const encrypted = Buffer.from(ciphertext, "base64");
  const authTag = encrypted.subarray(encrypted.length - 16);
  const data = encrypted.subarray(0, encrypted.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(apiV3Key, "utf8"), Buffer.from(nonceValue, "utf8"));
  if (associatedData) decipher.setAAD(Buffer.from(associatedData, "utf8"));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function verifyWechatNotificationSignature({
  timestamp,
  nonceValue,
  body,
  signature,
  platformPublicKey,
}: {
  timestamp: string;
  nonceValue: string;
  body: string;
  signature: string;
  platformPublicKey: string;
}) {
  const message = `${timestamp}\n${nonceValue}\n${body}\n`;
  return crypto.createVerify("RSA-SHA256").update(message, "utf8").verify(platformPublicKey, signature, "base64");
}

export function amountFen(value: number | string | { toString(): string }) {
  return Math.round(Number(value) * 100);
}
