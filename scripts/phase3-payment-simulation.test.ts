import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";
import {
  ApplicationStatus,
  CampaignStatus,
  DraftStatus,
  InvoiceStatus,
  ProofStatus,
  PublicationStatus,
  SettlementStatus,
  SubmissionStatus,
} from "@prisma/client";
import { verifyAlipaySignature, decimalAmount } from "../src/lib/alipay";
import { amountFen, decryptWechatResource, verifyWechatNotificationSignature } from "../src/lib/wechat-pay";
import { evaluateProviderInvoicePayment } from "../src/lib/invoice-payments";
import { evaluateAcceptedSubmissionSettlement } from "../src/lib/settlement-rules";
import {
  assertApplicationTransition,
  assertCampaignTransition,
  assertDraftTransition,
  assertProofTransition,
  assertPublicationTransition,
  assertSettlementTransition,
  assertSubmissionTransition,
} from "../src/lib/state-machines";

function alipayCanonicalize(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([key, value]) => key !== "sign" && key !== "sign_type" && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function encryptWechatResource({
  apiV3Key,
  associatedData,
  nonceValue,
  plaintext,
}: {
  apiV3Key: string;
  associatedData?: string;
  nonceValue: string;
  plaintext: string;
}) {
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(apiV3Key, "utf8"), Buffer.from(nonceValue, "utf8"));
  if (associatedData) cipher.setAAD(Buffer.from(associatedData, "utf8"));
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([encrypted, cipher.getAuthTag()]).toString("base64");
}

test("payment amount helpers keep provider formats stable", () => {
  assert.equal(decimalAmount(88), "88.00");
  assert.equal(decimalAmount("88.8"), "88.80");
  assert.equal(amountFen("88.80"), 8880);
  assert.equal(amountFen(0.01), 1);
});

test("simulated provider callback confirms exact amount and freezes campaign escrow", () => {
  const result = evaluateProviderInvoicePayment({
    invoiceStatus: InvoiceStatus.OPEN,
    invoiceAmount: "300.00",
    providerAmount: "300",
    brandBalance: "0",
    campaign: {
      status: CampaignStatus.AWAITING_PAYMENT,
      escrowAmount: "300.00",
      escrowFrozenAmount: "0",
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.alreadyPaid, false);
  assert.equal(result.afterPaymentBalance, 300);
  assert.equal(result.requiredEscrow, 300);
  assert.equal(result.shouldFreezeEscrow, true);
  assert.equal(result.nextCampaignStatus, CampaignStatus.PENDING_REVIEW);
});

test("simulated provider callback rejects amount mismatch before ledger changes", () => {
  const result = evaluateProviderInvoicePayment({
    invoiceStatus: InvoiceStatus.OPEN,
    invoiceAmount: "300.00",
    providerAmount: "299.99",
    brandBalance: "0",
    campaign: {
      status: CampaignStatus.AWAITING_PAYMENT,
      escrowAmount: "300.00",
      escrowFrozenAmount: "0",
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "amount_mismatch");
  assert.equal(result.expected, "300.00");
  assert.equal(result.actual, "299.99");
});

test("simulated duplicate provider callback is idempotent", () => {
  const result = evaluateProviderInvoicePayment({
    invoiceStatus: InvoiceStatus.PAID,
    invoiceAmount: "300.00",
    providerAmount: "300.00",
    brandBalance: "0",
    campaign: {
      status: CampaignStatus.PENDING_REVIEW,
      escrowAmount: "300.00",
      escrowFrozenAmount: "300.00",
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.alreadyPaid, true);
});

test("Alipay RSA2 notify signature verification works with generated keys", () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const params: Record<string, string> = {
    app_id: "test-app",
    out_trade_no: "ALIPAY-test-invoice",
    trade_no: "2026051600001",
    total_amount: "300.00",
    trade_status: "TRADE_SUCCESS",
    sign_type: "RSA2",
  };
  const payload = alipayCanonicalize(params);
  params.sign = crypto.createSign("RSA-SHA256").update(payload, "utf8").sign(privateKey, "base64");

  assert.equal(verifyAlipaySignature(params, publicKey.export({ type: "spki", format: "pem" }).toString()), true);
  assert.equal(verifyAlipaySignature({ ...params, total_amount: "299.99" }, publicKey.export({ type: "spki", format: "pem" }).toString()), false);
});

test("WeChat Pay notification signature and AES-GCM resource decryption work locally", () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const timestamp = "1778889600";
  const nonceValue = "nonce-for-test";
  const body = JSON.stringify({ id: "notify-1", event_type: "TRANSACTION.SUCCESS" });
  const message = `${timestamp}\n${nonceValue}\n${body}\n`;
  const signature = crypto.createSign("RSA-SHA256").update(message, "utf8").sign(privateKey, "base64");

  assert.equal(
    verifyWechatNotificationSignature({
      timestamp,
      nonceValue,
      body,
      signature,
      platformPublicKey: publicKey.export({ type: "spki", format: "pem" }).toString(),
    }),
    true,
  );

  const apiV3Key = "12345678901234567890123456789012";
  const resourceNonce = "123456789012";
  const associatedData = "transaction";
  const plaintext = JSON.stringify({ out_trade_no: "WECHAT-test-invoice", amount: { payer_total: 30000 } });
  const ciphertext = encryptWechatResource({ apiV3Key, associatedData, nonceValue: resourceNonce, plaintext });

  assert.equal(decryptWechatResource({ apiV3Key, associatedData, nonceValue: resourceNonce, ciphertext }), plaintext);
});

test("state machines block illegal commercial workflow jumps", () => {
  assert.doesNotThrow(() => assertCampaignTransition(CampaignStatus.AWAITING_PAYMENT, CampaignStatus.PENDING_REVIEW));
  assert.throws(() => assertCampaignTransition(CampaignStatus.DRAFT, CampaignStatus.ACTIVE), /Invalid Campaign/);

  assert.doesNotThrow(() => assertApplicationTransition(ApplicationStatus.APPLIED, ApplicationStatus.APPROVED));
  assert.throws(() => assertApplicationTransition(ApplicationStatus.REJECTED, ApplicationStatus.APPROVED), /Invalid Application/);

  assert.doesNotThrow(() => assertDraftTransition(DraftStatus.SUBMITTED, DraftStatus.APPROVED));
  assert.throws(() => assertDraftTransition(DraftStatus.REJECTED, DraftStatus.SUBMITTED), /Invalid Draft/);

  assert.doesNotThrow(() => assertSubmissionTransition(SubmissionStatus.APPROVED, SubmissionStatus.PROOF_SUBMITTED));
  assert.throws(() => assertSubmissionTransition(SubmissionStatus.SUBMITTED, SubmissionStatus.SETTLED), /Invalid Submission/);

  assert.doesNotThrow(() => assertProofTransition(ProofStatus.PENDING, ProofStatus.VERIFIED));
  assert.throws(() => assertProofTransition(ProofStatus.REJECTED, ProofStatus.VERIFIED), /Invalid Proof/);

  assert.doesNotThrow(() => assertPublicationTransition(PublicationStatus.LINK_SUBMITTED, PublicationStatus.ACCEPTED));
  assert.throws(() => assertPublicationTransition(PublicationStatus.PENDING_PUBLICATION, PublicationStatus.ACCEPTED), /Invalid Publication/);

  assert.doesNotThrow(() => assertSettlementTransition(SettlementStatus.PAYABLE, SettlementStatus.PAID_TO_WALLET));
  assert.throws(() => assertSettlementTransition(SettlementStatus.PAID_TO_WALLET, SettlementStatus.REFUNDED), /Invalid Settlement/);
});

test("simulated brand-to-creator delivery flow settles wallet and escrow consistently", () => {
  const payment = evaluateProviderInvoicePayment({
    invoiceStatus: InvoiceStatus.OPEN,
    invoiceAmount: "330.00",
    providerAmount: "330.00",
    brandBalance: "0",
    campaign: {
      status: CampaignStatus.AWAITING_PAYMENT,
      escrowAmount: "330.00",
      escrowFrozenAmount: "0",
    },
  });

  assert.equal(payment.ok, true);
  assert.equal(payment.shouldFreezeEscrow, true);

  assert.doesNotThrow(() => assertCampaignTransition(CampaignStatus.AWAITING_PAYMENT, CampaignStatus.PENDING_REVIEW));
  assert.doesNotThrow(() => assertCampaignTransition(CampaignStatus.PENDING_REVIEW, CampaignStatus.ACTIVE));
  assert.doesNotThrow(() => assertApplicationTransition(ApplicationStatus.APPLIED, ApplicationStatus.APPROVED));
  assert.doesNotThrow(() => assertSubmissionTransition(SubmissionStatus.SUBMITTED, SubmissionStatus.APPROVED));
  assert.doesNotThrow(() => assertSubmissionTransition(SubmissionStatus.APPROVED, SubmissionStatus.PROOF_SUBMITTED));
  assert.doesNotThrow(() => assertProofTransition(ProofStatus.PENDING, ProofStatus.VERIFIED));
  assert.doesNotThrow(() => assertSubmissionTransition(SubmissionStatus.PROOF_SUBMITTED, SubmissionStatus.VERIFIED));
  assert.doesNotThrow(() => assertSettlementTransition(SettlementStatus.ESCROWED, SettlementStatus.PAYABLE));

  const settlement = evaluateAcceptedSubmissionSettlement({
    rewardAmount: "300.00",
    platformFeeRate: "0.10",
    escrowFrozenAmount: "330.00",
  });

  assert.equal(settlement.ok, true);
  assert.equal(settlement.amount, 300);
  assert.equal(settlement.platformFee, 30);
  assert.equal(settlement.releaseTarget, 330);
  assert.equal(settlement.releasedFromEscrow, 330);
  assert.equal(settlement.platformFeeRecognized, 30);
  assert.equal(330 - settlement.releasedFromEscrow, 0);

  assert.doesNotThrow(() => assertSubmissionTransition(SubmissionStatus.VERIFIED, SubmissionStatus.SETTLED));
  assert.doesNotThrow(() => assertSettlementTransition(SettlementStatus.PAYABLE, SettlementStatus.PAID_TO_WALLET));
});

test("simulated partial dispute settlement releases reward and refunds remainder", () => {
  assert.doesNotThrow(() => assertPublicationTransition(PublicationStatus.DISPUTED, PublicationStatus.ACCEPTED));
  assert.doesNotThrow(() => assertSettlementTransition(SettlementStatus.ESCROWED, SettlementStatus.PARTIALLY_SETTLED));

  const settlement = evaluateAcceptedSubmissionSettlement({
    rewardAmount: "120.00",
    platformFeeRate: "0.10",
    escrowFrozenAmount: "330.00",
  });
  const originalEscrow = 330;
  const refundToBrand = originalEscrow - settlement.releasedFromEscrow;

  assert.equal(settlement.ok, true);
  assert.equal(settlement.amount, 120);
  assert.equal(settlement.platformFee, 12);
  assert.equal(settlement.releasedFromEscrow, 132);
  assert.equal(settlement.platformFeeRecognized, 12);
  assert.equal(refundToBrand, 198);
});

test("settlement simulation prevents invalid or repeated wallet payout paths", () => {
  const invalid = evaluateAcceptedSubmissionSettlement({
    rewardAmount: "0",
    platformFeeRate: "0.10",
    escrowFrozenAmount: "330.00",
  });

  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, "invalid_reward_amount");
  assert.throws(() => assertSubmissionTransition(SubmissionStatus.SETTLED, SubmissionStatus.VERIFIED), /Invalid Submission/);
  assert.throws(() => assertSettlementTransition(SettlementStatus.PAID_TO_WALLET, SettlementStatus.PAYABLE), /Invalid Settlement/);
});
