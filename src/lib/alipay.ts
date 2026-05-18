import crypto from "node:crypto";
import { decryptSecret } from "@/lib/secret-crypto";
import { prisma } from "@/lib/prisma";

type AlipayConfig = {
  appId: string;
  gatewayUrl: string;
  privateKey: string;
  alipayPublicKey: string;
  notifyUrl: string;
  returnUrl?: string;
};

type PagePayInput = {
  outTradeNo: string;
  totalAmount: string;
  subject: string;
  body?: string;
  returnUrl?: string;
};

type AlipayTradeQueryResult = {
  outTradeNo: string;
  tradeNo?: string;
  tradeStatus?: string;
  totalAmount?: string;
  raw: unknown;
};

type AlipayRefundInput = {
  outTradeNo: string;
  outRequestNo: string;
  refundAmount: string;
  refundReason?: string;
};

type AlipayRefundResult = {
  outTradeNo: string;
  tradeNo?: string;
  outRequestNo: string;
  refundAmount?: string;
  refundStatus?: string;
  raw: unknown;
};

const SIGN_TYPE = "RSA2";

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function normalizePem(value: string, label: "PRIVATE KEY" | "PUBLIC KEY") {
  const normalized = value.replace(/\\n/g, "\n").trim();
  if (normalized.includes("-----BEGIN")) return normalized;
  const lines = normalized.match(/.{1,64}/g)?.join("\n") ?? normalized;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

function getEnvAlipayConfig(): AlipayConfig | null {
  const appId = env("ALIPAY_APP_ID");
  const privateKey = env("ALIPAY_APP_PRIVATE_KEY");
  const alipayPublicKey = env("ALIPAY_PUBLIC_KEY");
  const notifyUrl = env("ALIPAY_NOTIFY_URL");
  if (!appId || !privateKey || !alipayPublicKey || !notifyUrl) return null;

  return {
    appId,
    gatewayUrl: env("ALIPAY_GATEWAY_URL") || "https://openapi.alipay.com/gateway.do",
    privateKey: normalizePem(privateKey, "PRIVATE KEY"),
    alipayPublicKey: normalizePem(alipayPublicKey, "PUBLIC KEY"),
    notifyUrl,
    returnUrl: env("ALIPAY_RETURN_URL") || undefined,
  };
}

export async function getAlipayConfig(): Promise<AlipayConfig | null> {
  const stored = await prisma.paymentProviderConfig.findUnique({ where: { provider: "alipay" } });
  if (stored?.enabled && stored.appId && stored.gatewayUrl && stored.notifyUrl && stored.encryptedPrivateKey && stored.encryptedPublicKey) {
    return {
      appId: stored.appId,
      gatewayUrl: stored.gatewayUrl,
      privateKey: normalizePem(decryptSecret(stored.encryptedPrivateKey), "PRIVATE KEY"),
      alipayPublicKey: normalizePem(decryptSecret(stored.encryptedPublicKey), "PUBLIC KEY"),
      notifyUrl: stored.notifyUrl,
      returnUrl: stored.returnUrl ?? undefined,
    };
  }
  return getEnvAlipayConfig();
}

export async function requireAlipayConfig() {
  const config = await getAlipayConfig();
  if (!config) {
    throw new Error("Alipay is not configured. Set ALIPAY_APP_ID, ALIPAY_APP_PRIVATE_KEY, ALIPAY_PUBLIC_KEY, and ALIPAY_NOTIFY_URL.");
  }
  return config;
}

function timestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    " ",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

function canonicalize(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([key, value]) => key !== "sign" && key !== "sign_type" && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function sign(params: Record<string, string>, privateKey: string) {
  return crypto.createSign("RSA-SHA256").update(canonicalize(params), "utf8").sign(privateKey, "base64");
}

export function verifyAlipaySignature(params: Record<string, string>, publicKey: string) {
  const signature = params.sign;
  if (!signature) return false;
  return crypto.createVerify("RSA-SHA256").update(canonicalize(params), "utf8").verify(publicKey, signature, "base64");
}

export async function buildAlipayPagePayUrl(input: PagePayInput) {
  const config = await requireAlipayConfig();
  const params: Record<string, string> = {
    app_id: config.appId,
    method: "alipay.trade.page.pay",
    charset: "utf-8",
    sign_type: SIGN_TYPE,
    timestamp: timestamp(),
    version: "1.0",
    notify_url: config.notifyUrl,
    biz_content: JSON.stringify({
      out_trade_no: input.outTradeNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      total_amount: input.totalAmount,
      subject: input.subject.slice(0, 256),
      ...(input.body ? { body: input.body.slice(0, 128) } : {}),
    }),
  };
  const returnUrl = input.returnUrl || config.returnUrl;
  if (returnUrl) params.return_url = returnUrl;

  params.sign = sign(params, config.privateKey);
  const query = new URLSearchParams(params);
  return `${config.gatewayUrl}?${query.toString()}`;
}

function commonParams(config: AlipayConfig, method: string, bizContent: Record<string, unknown>) {
  return {
    app_id: config.appId,
    method,
    charset: "utf-8",
    sign_type: SIGN_TYPE,
    timestamp: timestamp(),
    version: "1.0",
    format: "json",
    biz_content: JSON.stringify(bizContent),
  };
}

export async function queryAlipayTrade(outTradeNo: string): Promise<AlipayTradeQueryResult> {
  const config = await requireAlipayConfig();
  const params: Record<string, string> = commonParams(config, "alipay.trade.query", { out_trade_no: outTradeNo });
  params.sign = sign(params, config.privateKey);
  const response = await fetch(config.gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(params),
  });
  const payload = await response.json();
  const result = payload?.alipay_trade_query_response;
  if (!response.ok || !result || result.code !== "10000") {
    throw new Error(result?.sub_msg || result?.msg || `Alipay trade query failed: ${response.status}`);
  }
  return {
    outTradeNo: result.out_trade_no || outTradeNo,
    tradeNo: result.trade_no,
    tradeStatus: result.trade_status,
    totalAmount: result.total_amount,
    raw: payload,
  };
}

export async function refundAlipayTrade(input: AlipayRefundInput): Promise<AlipayRefundResult> {
  const config = await requireAlipayConfig();
  const params: Record<string, string> = commonParams(config, "alipay.trade.refund", {
    out_trade_no: input.outTradeNo,
    refund_amount: input.refundAmount,
    out_request_no: input.outRequestNo,
    ...(input.refundReason ? { refund_reason: input.refundReason.slice(0, 256) } : {}),
  });
  params.sign = sign(params, config.privateKey);
  const response = await fetch(config.gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(params),
  });
  const payload = await response.json();
  const result = payload?.alipay_trade_refund_response;
  if (!response.ok || !result || result.code !== "10000") {
    throw new Error(result?.sub_msg || result?.msg || `Alipay refund failed: ${response.status}`);
  }
  return {
    outTradeNo: result.out_trade_no || input.outTradeNo,
    tradeNo: result.trade_no,
    outRequestNo: input.outRequestNo,
    refundAmount: result.refund_fee || input.refundAmount,
    refundStatus: "SUCCESS",
    raw: payload,
  };
}

export async function queryAlipayRefund(outTradeNo: string, outRequestNo: string): Promise<AlipayRefundResult> {
  const config = await requireAlipayConfig();
  const params: Record<string, string> = commonParams(config, "alipay.trade.fastpay.refund.query", {
    out_trade_no: outTradeNo,
    out_request_no: outRequestNo,
  });
  params.sign = sign(params, config.privateKey);
  const response = await fetch(config.gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(params),
  });
  const payload = await response.json();
  const result = payload?.alipay_trade_fastpay_refund_query_response;
  if (!response.ok || !result || result.code !== "10000") {
    throw new Error(result?.sub_msg || result?.msg || `Alipay refund query failed: ${response.status}`);
  }
  return {
    outTradeNo: result.out_trade_no || outTradeNo,
    tradeNo: result.trade_no,
    outRequestNo,
    refundAmount: result.refund_amount,
    refundStatus: result.refund_status || "SUCCESS",
    raw: payload,
  };
}

export function decimalAmount(value: number | string | { toString(): string }) {
  return Number(value).toFixed(2);
}
