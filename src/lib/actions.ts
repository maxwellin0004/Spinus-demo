"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  AdminDataScope,
  AdminLevel,
  ApplicationStatus,
  BrandLedgerTxStatus,
  BrandLedgerTxType,
  BrandRefundStatus,
  BrandRequestStatus,
  CampaignStatus,
  ComplianceRuleType,
  CrawlerJobStatus,
  CrawlerJobType,
  CrawlerPlatform,
  CrawlerSnapshotStatus,
  CrawlerTargetType,
  CreatorLevel,
  CreatorMembershipApplicationStatus,
  CreatorMembershipTier,
  DisputeDecision,
  DisputeStatus,
  DraftReviewStatus,
  DraftStatus,
  InvoiceStatus,
  PublicationStatus,
  ProofStatus,
  ReviewDecision,
  ReviewStatus,
  RiskLevel,
  SocialVerificationStatus,
  SettlementStatus,
  SubmissionStatus,
  SupportTicketPriority,
  SupportTicketStatus,
  TaskStatus,
  UserRole,
  UserStatus,
  WalletTxStatus,
  WalletTxType,
  WithdrawalStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { checkSensitiveText } from "@/lib/compliance";
import { createSession, hashPassword, requireRole, verifyPassword, roleHome } from "@/lib/auth";
import { csv, text } from "@/lib/format";
import { hasCreatorLevel } from "@/lib/levels";
import { saveUploadedFile } from "@/lib/storage";
import { ADMIN_PERMISSIONS, hasAdminPermission, isFounder, requireAdminPermission } from "@/lib/admin";
import { createCrawlerJob, toCrawlerPlatform } from "@/lib/crawler";
import { collectConfiguredKeywords } from "@/lib/insights/collector";
import {
  DEFAULT_INSIGHT_AI_CASE_ANALYSIS_PROMPT,
  DEFAULT_INSIGHT_AI_BASE_URL,
  DEFAULT_INSIGHT_AI_CASE_GRAPHIC_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_CASE_VIDEO_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_GRAPHIC_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_GRAPHIC_TABLE_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_MODEL,
  DEFAULT_INSIGHT_AI_LEGACY_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_TOPIC_DECK_PROMPT,
  DEFAULT_INSIGHT_AI_VIDEO_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_VIDEO_TABLE_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_IMAGE_AI_MODEL,
} from "@/lib/insights/ai-prompts";
import { invalidateInsightReadCaches, scheduleInsightPrewarm } from "@/lib/insights/cache-maintenance";
import { refreshCreatorTrendDailySnapshots } from "@/lib/insights/creator-daily-snapshots";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTION_SLUGS } from "@/lib/insights/directions";
import { regenerateCreatorTrendAiRecommendations } from "@/lib/insights/creator-trend-detail";
import { recommendedCollectionSettings, seedDefaultInsightKeywords } from "@/lib/insights/keywords";
import { rebuildTrendSnapshotsFromContents } from "@/lib/insights/snapshots";
import { generateTopicCoverImage } from "@/lib/insights/topic-cover-images";
import { TIKHUB_ENDPOINTS } from "@/lib/tikhub/endpoints";
import {
  applyAdminLevelInviteRules,
  applyInviteCodeChange,
  ensureStaffInviteCode,
  findActiveInvitation,
  generateUniqueInviteCode,
  inviteValidationMessage,
  isValidInviteCode,
  normalizeInviteCode,
} from "@/lib/invitations";
import { generateUniqueCreatorShareCode, normalizeCreatorShareCode } from "@/lib/creator-marketing";
import { membershipPriceAmount } from "@/lib/creator-memberships";
import { encryptSecret } from "@/lib/secret-crypto";
import { decimalAmount, queryAlipayRefund, queryAlipayTrade, refundAlipayTrade } from "@/lib/alipay";
import { amountFen, queryWechatRefund, queryWechatTrade, refundWechatTrade } from "@/lib/wechat-pay";
import { confirmInvoicePaidByProvider } from "@/lib/invoice-payments";
import { beginPaymentProviderEvent, completePaymentProviderEvent, paymentEventKey } from "@/lib/payment-events";
import { notifyBrand, notifyPaymentAdmins } from "@/lib/payment-notifications";
import { dispatchExternalNotification } from "@/lib/external-notifications";
import { evaluateAcceptedSubmissionSettlement } from "@/lib/settlement-rules";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  LOGIN_FAILURE_LIMIT,
  LOGIN_FAILURE_WINDOW_MINUTES,
  normalizedSecurityEmail,
  securityEntityForEmail,
  securityHash,
} from "@/lib/account-security";
import {
  assertApplicationTransition,
  assertCampaignTransition,
  assertDraftReviewTransition,
  assertDraftTransition,
  assertProofTransition,
  assertPublicationTransition,
  assertSettlementTransition,
  assertSubmissionTransition,
} from "@/lib/state-machines";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

const supportTicketSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(40),
  priority: z.enum(SupportTicketPriority),
  brandId: z.string().optional(),
  creatorId: z.string().optional(),
  campaignId: z.string().optional(),
  proofId: z.string().optional(),
  disputeId: z.string().optional(),
  assignedToId: z.string().optional(),
  body: z.string().trim().min(3).max(2000),
  internalNote: z.string().trim().max(2000).optional(),
});

const supportTicketUpdateSchema = z.object({
  status: z.enum(SupportTicketStatus),
  priority: z.enum(SupportTicketPriority),
  assignedToId: z.string().optional(),
  note: z.string().trim().max(2000).optional(),
  internalNote: z.string().trim().max(2000).optional(),
});

const customerSupportTicketSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(40),
  priority: z.enum(SupportTicketPriority),
  campaignId: z.string().trim().optional(),
  proofId: z.string().trim().optional(),
  body: z.string().trim().min(5).max(2000),
});

const PAYMENT_PROOF_MAX_BYTES = 8 * 1024 * 1024;

const insightKeywordConfigSchema = z.object({
  keyword: z.string().trim().min(1).max(80),
  keywordType: z.string().trim().min(1).max(40),
  platform: z.string().trim().min(1).max(40),
  endpoint: z.enum(Object.keys(TIKHUB_ENDPOINTS) as [keyof typeof TIKHUB_ENDPOINTS, ...(keyof typeof TIKHUB_ENDPOINTS)[]]),
  priority: z.coerce.number().int().min(1).max(9999),
  perRunLimit: z.coerce.number().int().min(1).max(50),
  collectIntervalHours: z.coerce.number().int().min(1).max(720),
  active: z.boolean(),
});

const insightDirectionSchema = z.object({
  insightDirection: z.enum(INSIGHT_DIRECTION_SLUGS),
});

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function insightKeywordConfigForm(formData: FormData) {
  return insightKeywordConfigSchema.parse({
    keyword: formData.get("keyword"),
    keywordType: formData.get("keywordType"),
    platform: formData.get("platform"),
    endpoint: formData.get("endpoint"),
    priority: formData.get("priority"),
    perRunLimit: formData.get("perRunLimit"),
    collectIntervalHours: formData.get("collectIntervalHours"),
    active: formData.get("active") === "on",
  });
}

function isUniqueConstraintError(error: unknown, fields: string[]) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
  return fields.every((field) => target.includes(field));
}

async function requestIpAddress() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || null;
}

async function assertLoginNotRateLimited(email: string) {
  const since = new Date(Date.now() - LOGIN_FAILURE_WINDOW_MINUTES * 60 * 1000);
  const recentFailures = await prisma.auditLog.count({
    where: {
      action: "auth.login_failed",
      entityType: "auth_login",
      entityId: securityEntityForEmail(email),
      createdAt: { gte: since },
    },
  });
  if (recentFailures >= LOGIN_FAILURE_LIMIT) {
    redirect(`/auth/login?error=${encodeURIComponent(`登录失败次数过多，请 ${LOGIN_FAILURE_WINDOW_MINUTES} 分钟后再试。`)}`);
  }
}

async function recordLoginFailure(email: string, reason: string) {
  await prisma.auditLog.create({
    data: {
      action: "auth.login_failed",
      entityType: "auth_login",
      entityId: securityEntityForEmail(email),
      ipAddress: await requestIpAddress(),
      afterJson: { reason },
    },
  });
}

async function creditAcceptedSubmissionEarning({
  tx,
  actorUserId,
  actorRole,
  submissionId,
  campaignId,
  creatorId,
  creatorUserId,
  rewardAmount,
  note,
}: {
  tx: Prisma.TransactionClient;
  actorUserId?: string;
  actorRole?: UserRole;
  submissionId: string;
  campaignId: string;
  creatorId: string;
  creatorUserId: string;
  rewardAmount: number | string | { toString(): string };
  note: string;
}) {
  const amount = roundMoney(Number(rewardAmount));
  if (amount <= 0) return;

  const existingFinalEarning = await tx.walletTransaction.findFirst({
    where: {
      relatedSubmissionId: submissionId,
      type: WalletTxType.EARNING,
      status: { in: [WalletTxStatus.APPROVED, WalletTxStatus.PAID] },
    },
  });
  if (existingFinalEarning) return;

  const campaign = await tx.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: true },
  });
  if (!campaign) return;

  const wallet = await tx.wallet.upsert({
    where: { creatorId },
    update: {},
    create: { creatorId, currency: campaign.currency || "CNY" },
  });
  const currentSubmission = await tx.submission.findUnique({
    where: { id: submissionId },
    select: { status: true, settlementStatus: true },
  });
  if (!currentSubmission) return;
  assertSubmissionTransition(currentSubmission.status, SubmissionStatus.SETTLED);
  assertSettlementTransition(currentSubmission.settlementStatus, SettlementStatus.PAID_TO_WALLET);

  const pendingEarning = await tx.walletTransaction.findFirst({
    where: {
      relatedSubmissionId: submissionId,
      type: WalletTxType.EARNING,
      status: WalletTxStatus.PENDING,
    },
  });

  if (pendingEarning) {
    await tx.walletTransaction.update({
      where: { id: pendingEarning.id },
      data: {
        amount,
        currency: wallet.currency,
        status: WalletTxStatus.APPROVED,
        note,
      },
    });
  } else {
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        creatorId,
        type: WalletTxType.EARNING,
        amount,
        currency: wallet.currency,
        status: WalletTxStatus.APPROVED,
        relatedSubmissionId: submissionId,
        isDemo: campaign.isDemo,
        note,
      },
    });
  }

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: { increment: amount },
      cumulativeIncome: { increment: amount },
    },
  });
  await tx.creatorProfile.update({
    where: { id: creatorId },
    data: {
      cumulativeIncome: { increment: amount },
      completedTasks: { increment: 1 },
    },
  });
  await tx.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.SETTLED,
      settlementStatus: SettlementStatus.PAID_TO_WALLET,
      settlementAmount: amount,
      acceptedAt: new Date(),
    },
  });

  const settlement = evaluateAcceptedSubmissionSettlement({
    rewardAmount: amount,
    platformFeeRate: campaign.platformFeeRate,
    escrowFrozenAmount: campaign.escrowFrozenAmount,
  });
  const releasedFromEscrow = settlement.releasedFromEscrow;
  const platformFeeRecognized = settlement.platformFeeRecognized;

  if (releasedFromEscrow > 0) {
    await tx.brandProfile.update({
      where: { id: campaign.brandId },
      data: { frozenEscrowBalance: { decrement: releasedFromEscrow } },
    });
    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        escrowFrozenAmount: { decrement: releasedFromEscrow },
        escrowReleasedAmount: { increment: releasedFromEscrow },
      },
    });
    await tx.brandLedgerTransaction.create({
      data: {
        brandId: campaign.brandId,
        campaignId,
        type: BrandLedgerTxType.KOL_SETTLEMENT,
        amount,
        currency: campaign.currency,
        status: BrandLedgerTxStatus.CONFIRMED,
        beforeBalance: campaign.brand.budgetBalance,
        afterBalance: campaign.brand.budgetBalance,
        createdById: actorUserId,
        note: "Creator reward released from escrow after proof acceptance.",
      },
    });
    if (platformFeeRecognized > 0) {
      await tx.brandLedgerTransaction.create({
        data: {
          brandId: campaign.brandId,
          campaignId,
          type: BrandLedgerTxType.PLATFORM_FEE,
          amount: platformFeeRecognized,
          currency: campaign.currency,
          status: BrandLedgerTxStatus.CONFIRMED,
          beforeBalance: campaign.brand.budgetBalance,
          afterBalance: campaign.brand.budgetBalance,
          createdById: actorUserId,
          note: "Platform service fee recognized with accepted creator delivery.",
        },
      });
    }
  }

  await tx.notification.create({
    data: {
      userId: creatorUserId,
      title: "任务收益已入账",
      body: `${wallet.currency} ${amount} 已进入可提现余额。`,
      href: "/creator/wallet",
    },
  });
  await tx.auditLog.create({
    data: {
      actorUserId,
      actorRole,
      action: "wallet.earning_credited",
      entityType: "submission",
      entityId: submissionId,
      afterJson: {
        amount,
        currency: wallet.currency,
        campaignId,
        releasedFromEscrow,
        platformFeeRecognized,
      },
    },
  });
}

async function returnCampaignUnusedEscrow({
  tx,
  actorUserId,
  campaignId,
  note,
}: {
  tx: Prisma.TransactionClient;
  actorUserId?: string;
  campaignId: string;
  note: string;
}) {
  const campaign = await tx.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: true },
  });
  if (!campaign) return 0;
  const refundable = Number(campaign.escrowFrozenAmount);
  if (refundable <= 0) return 0;

  await tx.brandProfile.update({
    where: { id: campaign.brandId },
    data: {
      budgetBalance: { increment: refundable },
      frozenEscrowBalance: { decrement: refundable },
    },
  });
  await tx.campaign.update({
    where: { id: campaignId },
    data: {
      escrowFrozenAmount: { decrement: refundable },
      escrowReleasedAmount: { increment: refundable },
    },
  });
  await tx.brandLedgerTransaction.create({
    data: {
      brandId: campaign.brandId,
      campaignId,
      type: BrandLedgerTxType.REFUND,
      amount: refundable,
      currency: campaign.currency,
      status: BrandLedgerTxStatus.CONFIRMED,
      beforeBalance: campaign.brand.budgetBalance,
      afterBalance: Number(campaign.brand.budgetBalance) + refundable,
      createdById: actorUserId,
      note,
    },
  });
  return refundable;
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: normalizedSecurityEmail(text(formData.get("email"))),
    password: text(formData.get("password")),
  });
  if (!parsed.success) redirect(`/auth/login?error=${encodeURIComponent("请填写有效邮箱和密码。")}`);

  await assertLoginNotRateLimited(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    await recordLoginFailure(parsed.data.email, user ? "bad_password" : "unknown_email");
    redirect(`/auth/login?error=${encodeURIComponent("邮箱或密码错误。")}`);
  }
  if (user.status === UserStatus.FROZEN) {
    await recordLoginFailure(parsed.data.email, "frozen_user");
    redirect(`/auth/login?error=${encodeURIComponent("账号已被冻结，请联系平台。")}`);
  }

  await createSession(user);
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.login_succeeded",
      entityType: "user",
      entityId: user.id,
      ipAddress: await requestIpAddress(),
    },
  });
  redirect(roleHome(user.role));
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: normalizedSecurityEmail(text(formData.get("email"))),
  });
  if (!parsed.success) redirect(`/auth/forgot-password?error=${encodeURIComponent("请填写有效邮箱。")}`);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  let devPath: string | null = null;
  if (user && user.status !== UserStatus.FROZEN) {
    const reset = await createPasswordResetToken(prisma, user.id);
    devPath = reset.path;
    await prisma.auditLog.create({
      data: {
        action: "auth.password_reset_requested",
        entityType: "user",
        entityId: user.id,
        ipAddress: await requestIpAddress(),
        afterJson: {
          expiresAt: reset.expiresAt.toISOString(),
          delivery: process.env.PASSWORD_RESET_DEV_LINKS === "true" ? "dev_link" : "pending_email_provider",
          ...(process.env.PASSWORD_RESET_DEV_LINKS === "true" ? { resetPath: reset.path } : {}),
        },
      },
    });
  }

  const params = new URLSearchParams({ sent: "1" });
  if (process.env.PASSWORD_RESET_DEV_LINKS === "true" && devPath) params.set("devResetPath", devPath);
  redirect(`/auth/forgot-password?${params.toString()}`);
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: text(formData.get("token")),
    password: text(formData.get("password")),
    confirmPassword: text(formData.get("confirmPassword")),
  });
  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) {
    redirect(`/auth/reset-password?error=${encodeURIComponent("请填写一致的新密码，至少 8 位。")}`);
  }

  const tokenHash = securityHash(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    redirect(`/auth/reset-password?error=${encodeURIComponent("重置链接无效或已过期，请重新申请。")}`);
  }
  if (resetToken.user.status === UserStatus.FROZEN) {
    redirect(`/auth/reset-password?error=${encodeURIComponent("账号已被冻结，请联系平台。")}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        passwordChangedAt: new Date(),
      },
    });
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: resetToken.userId,
        actorRole: resetToken.user.role,
        action: "auth.password_reset_completed",
        entityType: "user",
        entityId: resetToken.userId,
        ipAddress: await requestIpAddress(),
      },
    });
  });

  redirect(`/auth/login?error=${encodeURIComponent("密码已更新，请使用新密码登录。")}`);
}

export async function verifyEmailAction(formData: FormData) {
  const token = text(formData.get("token"));
  if (token.length < 20) redirect(`/auth/verify-email?error=${encodeURIComponent("验证链接无效。")}`);

  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: securityHash(token) },
    include: { user: true },
  });
  if (!verification || verification.usedAt || verification.expiresAt < new Date()) {
    redirect(`/auth/verify-email?error=${encodeURIComponent("验证链接无效或已过期。")}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: verification.user.emailVerifiedAt ?? new Date() },
    });
    await tx.emailVerificationToken.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: verification.userId,
        actorRole: verification.user.role,
        action: "auth.email_verified",
        entityType: "user",
        entityId: verification.userId,
      },
    });
  });

  redirect(`/auth/login?error=${encodeURIComponent("邮箱已验证，请登录。")}`);
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["BRAND", "CREATOR"]),
  name: z.string().min(2),
  country: z.string().min(2),
  industry: z.string().optional(),
  inviteCode: z.string().optional(),
  refCode: z.string().optional(),
});

export async function registerAction(formData: FormData) {
  const role = text(formData.get("role"));
  const name = text(formData.get("name"));
  const country = text(formData.get("country"));
  const industry = text(formData.get("industry"));
  const email = text(formData.get("email")).toLowerCase();
  const password = text(formData.get("password"));
  const inviteCode = normalizeInviteCode(text(formData.get("inviteCode")));
  const refCode = normalizeCreatorShareCode(text(formData.get("refCode")));
  const inviteLocked = text(formData.get("inviteLocked")) === "1";
  const registerErrorPath = (message: string) =>
    `/auth/register?${new URLSearchParams({
      error: message,
      ...(inviteLocked && inviteCode ? { invite: inviteCode } : {}),
      ...(refCode ? { ref: refCode } : {}),
      ...(role === "CREATOR" ? { role } : {}),
    }).toString()}`;
  if (!["BRAND", "CREATOR"].includes(role)) redirect(`/auth/register?error=${encodeURIComponent("请选择注册角色。")}`);
  if (name.length < 2) redirect(`/auth/register?error=${encodeURIComponent("请填写工作台/显示名称，至少 2 个字符。")}`);
  if (country.length < 2) redirect(`/auth/register?error=${encodeURIComponent("请填写国家或地区。")}`);
  if (role === "BRAND" && industry.length < 2) redirect(`/auth/register?error=${encodeURIComponent("品牌方需要填写行业。")}`);
  if (password.length < 8) redirect(`/auth/register?error=${encodeURIComponent("密码至少需要 8 位。")}`);
  if (inviteCode && !isValidInviteCode(inviteCode)) redirect(registerErrorPath(inviteValidationMessage()));
  const parsed = registerSchema.safeParse({
    email,
    password,
    role,
    name,
    country,
    industry,
    inviteCode,
    refCode,
  });
  if (!parsed.success) redirect(`/auth/register?error=${encodeURIComponent("请检查邮箱格式和必填字段。")}`);

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) redirect(`/auth/register?error=${encodeURIComponent("该邮箱已经注册，请直接登录。")}`);

  const invitation = parsed.data.inviteCode ? await findActiveInvitation(parsed.data.inviteCode, prisma) : null;
  const creatorReferralSource = parsed.data.refCode
    ? await prisma.creatorProfile.findUnique({
        where: { shareCode: parsed.data.refCode },
        include: { user: true },
      })
    : null;
  if (parsed.data.inviteCode && (!invitation || !invitation.active)) {
    redirect(registerErrorPath("邀请码无效或已停用，请检查后重试；没有邀请码可移除 URL 中的 invite 参数后继续注册。"));
  }
  if (parsed.data.refCode && !creatorReferralSource) {
    redirect(registerErrorPath("分享链接已失效，请返回分享海报重新扫码或联系分享人。"));
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        passwordChangedAt: new Date(),
        role: parsed.data.role as UserRole,
        status: UserStatus.ACTIVE,
        brandProfile:
          parsed.data.role === "BRAND"
            ? {
                create: {
                  brandName: parsed.data.name,
                  companyName: parsed.data.name,
                  contactName: parsed.data.name,
                  email: parsed.data.email,
                  industry: parsed.data.industry || "General",
                  country: parsed.data.country,
                  description: "New brand profile pending review.",
                  reviewStatus: ReviewStatus.PENDING,
                  responsibleAdminId: invitation?.adminProfileId,
                },
              }
            : undefined,
        creatorProfile:
          parsed.data.role === "CREATOR"
            ? {
                create: {
                  displayName: parsed.data.name,
                  email: parsed.data.email,
                  shareCode: await generateUniqueCreatorShareCode(tx),
                  country: parsed.data.country,
                  languages: ["中文"],
                  categories: [],
                  contentTypes: [],
                  reviewStatus: ReviewStatus.PENDING,
                  responsibleAdminId: invitation?.adminProfileId,
                  wallet: { create: { currency: "CNY" } },
                },
              }
            : undefined,
      },
    });

    if (invitation) {
      await tx.invitationAttribution.create({
        data: {
          userId: created.id,
          invitationCodeId: invitation.id,
          codeSnapshot: invitation.code,
          invitedByAdminId: invitation.adminProfileId,
        },
      });
      await tx.notification.create({
        data: {
          userId: invitation.adminProfile.userId,
          title: parsed.data.role === "BRAND" ? "新品牌方通过你的邀请码注册" : "新创作者通过你的邀请码注册",
          body: `${parsed.data.name} (${parsed.data.email}) 使用邀请码 ${invitation.code} 完成注册。`,
          href: "/admin/invitations",
        },
      });
    }
    if (creatorReferralSource) {
      await tx.creatorReferralAttribution.create({
        data: {
          userId: created.id,
          creatorProfileId: creatorReferralSource.id,
          codeSnapshot: creatorReferralSource.shareCode,
        },
      });
      await tx.notification.create({
        data: {
          userId: creatorReferralSource.userId,
          title: "有新创作者通过你的分享注册",
          body: `${parsed.data.name} (${parsed.data.email}) 通过你的专属分享海报完成注册。`,
          href: "/creator/share",
        },
      });
    }
    return created;
  });

  await audit({
    action: "auth.register",
    entityType: "user",
    entityId: user.id,
    afterJson: { role: user.role, email: user.email, inviteCode: invitation?.code, creatorRefCode: creatorReferralSource?.shareCode },
  });
  const verification = await createEmailVerificationToken(prisma, user.id);
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.email_verification_requested",
      entityType: "user",
      entityId: user.id,
      afterJson: {
        expiresAt: verification.expiresAt.toISOString(),
        delivery: process.env.EMAIL_VERIFICATION_DEV_LINKS === "true" ? "dev_link" : "pending_email_provider",
        ...(process.env.EMAIL_VERIFICATION_DEV_LINKS === "true" ? { verifyPath: verification.path } : {}),
      },
    },
  });
  await createSession(user);
  redirect(roleHome(user.role));
}

export async function updateBrandStatusAction(brandId: string, formData: FormData) {
  await requireAdminPermission("account.freeze");
  const status = text(formData.get("reviewStatus")) as ReviewStatus;
  const internalNote = text(formData.get("internalNote"));
  const responsibleAdminId = text(formData.get("responsibleAdminId")) || null;
  const before = await prisma.brandProfile.findUnique({ where: { id: brandId } });
  if (!before) redirect("/admin/brands");

  await prisma.$transaction(async (tx) => {
    await tx.brandProfile.update({
      where: { id: brandId },
      data: {
        reviewStatus: status,
        internalNote,
        responsibleAdmin: responsibleAdminId ? { connect: { id: responsibleAdminId } } : { disconnect: true },
        user: { update: { status: status === ReviewStatus.FROZEN ? UserStatus.FROZEN : UserStatus.ACTIVE } },
      },
    });
    await tx.auditLog.create({
      data: {
        action: "brand.status_changed",
        entityType: "brand",
        entityId: brandId,
        beforeJson: { reviewStatus: before.reviewStatus },
        afterJson: { reviewStatus: status, internalNote, responsibleAdminId },
      },
    });
  });
  revalidatePath("/admin/brands");
}

const brandProfileSchema = z.object({
  brandName: z.string().min(2),
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  telegram: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().min(2),
  country: z.string().min(2),
  logoUrl: z.string().optional(),
  description: z.string().min(10),
});

export async function updateBrandProfileAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const before = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: { responsibleAdmin: true },
  });
  if (!before) redirect("/brand/profile");

  const logoFile = formData.get("logoFile");
  const uploadedLogo = logoFile instanceof File && logoFile.size > 0 ? await saveUploadedFile(logoFile, `brands/${before.id}`) : null;
  const parsed = brandProfileSchema.safeParse({
    brandName: text(formData.get("brandName")),
    companyName: text(formData.get("companyName")),
    contactName: text(formData.get("contactName")),
    email: text(formData.get("email")).toLowerCase(),
    telegram: text(formData.get("telegram")),
    whatsapp: text(formData.get("whatsapp")),
    website: text(formData.get("website")),
    industry: text(formData.get("industry")),
    country: text(formData.get("country")),
    logoUrl: uploadedLogo || text(formData.get("logoUrl")),
    description: text(formData.get("description")),
  });
  if (!parsed.success) redirect("/brand/profile?error=请检查品牌资料必填项");

  await prisma.$transaction(async (tx) => {
    await tx.brandProfile.update({
      where: { id: before.id },
      data: {
        ...parsed.data,
        telegram: parsed.data.telegram || null,
        whatsapp: parsed.data.whatsapp || null,
        website: parsed.data.website || null,
        logoUrl: parsed.data.logoUrl || null,
        reviewStatus: ReviewStatus.PENDING,
      },
    });
    if (before.responsibleAdmin?.userId) {
      await tx.notification.create({
        data: {
          userId: before.responsibleAdmin.userId,
          title: "品牌资料重新提交审核",
          body: `${parsed.data.brandName} 更新了品牌资料，请复核。`,
          href: `/admin/brands/${before.id}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "brand.profile_resubmitted",
        entityType: "brand",
        entityId: before.id,
        beforeJson: { reviewStatus: before.reviewStatus, brandName: before.brandName },
        afterJson: { reviewStatus: ReviewStatus.PENDING, brandName: parsed.data.brandName },
      },
    });
  });
  redirect("/brand/profile?updated=1");
}

export async function updateBrandInsightDirectionAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const parsed = insightDirectionSchema.safeParse({
    insightDirection: text(formData.get("insightDirection")),
  });
  if (!parsed.success) redirect("/brand/profile?error=请选择有效的洞察方向");

  const brand = await prisma.brandProfile.update({
    where: { userId: session.userId },
    data: { insightDirection: parsed.data.insightDirection },
  });

  await audit({
    action: "brand.insight_direction_updated",
    entityType: "brand",
    entityId: brand.id,
    afterJson: { insightDirection: parsed.data.insightDirection },
  });
  revalidatePath("/brand/profile");
  revalidatePath("/brand/insights");
  redirect("/brand/profile?directionUpdated=1");
}

const brandRequestSchema = z.object({
  title: z.string().min(3),
  objective: z.string().min(2),
  description: z.string().min(10),
  budget: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  expectedLaunchDate: z.string().optional(),
});

export async function submitBrandRequirementAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: { responsibleAdmin: true, user: true },
  });
  if (!brand) redirect("/brand/requests");
  if (brand.reviewStatus === ReviewStatus.FROZEN || brand.user.status === UserStatus.FROZEN) redirect("/403");

  const parsed = brandRequestSchema.safeParse({
    title: text(formData.get("title")),
    objective: text(formData.get("objective")),
    description: text(formData.get("description")),
    budget: text(formData.get("budget")),
    expectedLaunchDate: text(formData.get("expectedLaunchDate")),
  });
  if (!parsed.success) redirect("/brand/requests?error=请填写完整需求");

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.brandRequest.create({
      data: {
        brandId: brand.id,
        responsibleAdminId: brand.responsibleAdminId,
        title: parsed.data.title,
        objective: parsed.data.objective,
        description: parsed.data.description,
        budget: parsed.data.budget,
        expectedLaunchDate: parsed.data.expectedLaunchDate ? new Date(parsed.data.expectedLaunchDate) : null,
        status: BrandRequestStatus.SUBMITTED,
      },
    });
    await tx.brandMessage.create({
      data: {
        brandId: brand.id,
        requestId: created.id,
        authorUserId: session.userId,
        authorRole: session.role,
        body: parsed.data.description,
      },
    });
    if (brand.responsibleAdmin?.userId) {
      await tx.notification.create({
        data: {
          userId: brand.responsibleAdmin.userId,
          title: "品牌提交了新需求",
          body: `${brand.brandName}：${created.title}`,
          href: `/admin/brands/${brand.id}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "brand_request.submitted",
        entityType: "brand_request",
        entityId: created.id,
        afterJson: { title: created.title, status: created.status, budget: parsed.data.budget },
      },
    });
    return created;
  });

  redirect(`/brand/requests/${request.id}`);
}

export async function addBrandMessageAction(targetType: "brand" | "request" | "campaign", targetId: string, formData: FormData) {
  const session = await requireRole([UserRole.ADMIN, UserRole.BRAND]);
  const body = text(formData.get("body"));
  if (body.length < 2) redirect(session.role === UserRole.ADMIN ? "/admin/brands" : "/brand/requests");
  const messageCategory = text(formData.get("messageCategory")) || "普通留言";
  const relatedType = text(formData.get("relatedType"));
  const relatedLabel = text(formData.get("relatedLabel"));
  const structuredBody = [`[${messageCategory}]`, relatedLabel ? `关联：${relatedLabel}` : "", relatedType && !relatedLabel ? `关联类型：${relatedType}` : "", "", body]
    .filter((item, index) => item || index === 3)
    .join("\n");

  if (session.role === UserRole.ADMIN) {
    await requireAdminPermission("account.create");
  }

  let brandId = "";
  let requestId: string | undefined;
  let campaignId: string | undefined;
  let redirectTo = session.role === UserRole.ADMIN ? "/admin/brands" : "/brand/requests";

  if (targetType === "brand") {
    const brand = session.role === UserRole.BRAND
      ? await prisma.brandProfile.findFirst({ where: { id: targetId, userId: session.userId } })
      : await prisma.brandProfile.findUnique({ where: { id: targetId } });
    if (!brand) redirect("/403");
    brandId = brand.id;
    redirectTo = session.role === UserRole.ADMIN ? `/admin/brands/${brand.id}` : "/brand/requests";
  }

  if (targetType === "request") {
    const request = await prisma.brandRequest.findUnique({ where: { id: targetId }, include: { brand: true } });
    if (!request) redirect("/403");
    if (session.role === UserRole.BRAND && request.brand.userId !== session.userId) redirect("/403");
    brandId = request.brandId;
    requestId = request.id;
    redirectTo = session.role === UserRole.ADMIN ? `/admin/brands/${request.brandId}` : `/brand/requests/${request.id}`;
  }

  if (targetType === "campaign") {
    const campaign = await prisma.campaign.findUnique({ where: { id: targetId }, include: { brand: true } });
    if (!campaign) redirect("/403");
    if (session.role === UserRole.BRAND && campaign.brand.userId !== session.userId) redirect("/403");
    brandId = campaign.brandId;
    campaignId = campaign.id;
    redirectTo = session.role === UserRole.ADMIN ? `/admin/campaigns/${campaign.id}` : `/brand/campaigns/${campaign.id}`;
  }

  await prisma.$transaction(async (tx) => {
    const message = await tx.brandMessage.create({
      data: {
        brandId,
        requestId,
        campaignId,
        authorUserId: session.userId,
        authorRole: session.role,
        body: structuredBody,
        visibleToBrand: session.role === UserRole.BRAND ? true : formData.get("visibleToBrand") !== "off",
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "brand_message.created",
        entityType: "brand_message",
        entityId: message.id,
        afterJson: { targetType, targetId, messageCategory, relatedType, relatedLabel },
      },
    });
  });
  redirect(redirectTo);
}

export async function updateBrandRequestStatusAction(requestId: string, formData: FormData) {
  const session = await requireAdminPermission("campaign.manage");
  const status = text(formData.get("status")) as BrandRequestStatus;
  const before = await prisma.brandRequest.findUnique({ where: { id: requestId } });
  if (!before) redirect("/admin/brands");
  await prisma.$transaction(async (tx) => {
    await tx.brandRequest.update({ where: { id: requestId }, data: { status } });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "brand_request.status_changed",
        entityType: "brand_request",
        entityId: requestId,
        beforeJson: { status: before.status },
        afterJson: { status },
      },
    });
  });
  revalidatePath(`/admin/brands/${before.brandId}`);
}

export async function updateCreatorAction(creatorId: string, formData: FormData) {
  await requireAdminPermission("account.freeze");
  const reviewStatus = text(formData.get("reviewStatus")) as ReviewStatus;
  const level = text(formData.get("level")) as CreatorLevel;
  const membershipTier = text(formData.get("membershipTier")) as CreatorMembershipTier;
  const riskLevel = text(formData.get("riskLevel")) as RiskLevel;
  const responsibleAdminId = text(formData.get("responsibleAdminId")) || null;
  const violationDelta = Number(text(formData.get("violationDelta")) || 0);
  const membershipStartedAt = text(formData.get("membershipStartedAt"));
  const membershipEndsAt = text(formData.get("membershipEndsAt"));
  const membershipNote = text(formData.get("membershipNote"));
  const before = await prisma.creatorProfile.findUnique({ where: { id: creatorId }, include: { user: true } });
  if (!before) redirect("/admin/creators");

  const newViolationCount = Math.max(0, before.violationCount + violationDelta);
  const derivedRisk = newViolationCount >= 3 ? RiskLevel.HIGH : riskLevel;
  const nextMembershipTier = Object.values(CreatorMembershipTier).includes(membershipTier) ? membershipTier : before.membershipTier;
  const nextMembershipStartedAt = nextMembershipTier === CreatorMembershipTier.NONE ? null : membershipStartedAt ? new Date(membershipStartedAt) : null;
  const nextMembershipEndsAt = nextMembershipTier === CreatorMembershipTier.NONE ? null : membershipEndsAt ? new Date(membershipEndsAt) : null;
  const nextMembershipNote = membershipNote || null;
  const membershipChanged =
    before.membershipTier !== nextMembershipTier ||
    String(before.membershipStartedAt ?? "") !== String(nextMembershipStartedAt ?? "") ||
    String(before.membershipEndsAt ?? "") !== String(nextMembershipEndsAt ?? "") ||
    String(before.membershipNote ?? "") !== String(nextMembershipNote ?? "");

  await prisma.$transaction(async (tx) => {
    await tx.creatorProfile.update({
      where: { id: creatorId },
      data: {
        reviewStatus,
        level,
        membershipTier: nextMembershipTier,
        membershipStartedAt: nextMembershipStartedAt,
        membershipEndsAt: nextMembershipEndsAt,
        membershipNote: nextMembershipNote,
        riskLevel: derivedRisk,
        responsibleAdmin: responsibleAdminId ? { connect: { id: responsibleAdminId } } : { disconnect: true },
        violationCount: newViolationCount,
        user: { update: { status: reviewStatus === ReviewStatus.FROZEN ? UserStatus.FROZEN : UserStatus.ACTIVE } },
      },
    });
    if (violationDelta > 0) {
      await tx.riskFlag.create({
        data: {
          entityType: "creator",
          entityId: creatorId,
          level: derivedRisk,
          reason: `Admin added ${violationDelta} violation(s).`,
        },
      });
    }
    if (membershipChanged) {
      await tx.notification.create({
        data: {
          userId: before.userId,
          title: nextMembershipTier === CreatorMembershipTier.NONE ? "会员状态已更新" : `会员已调整为 ${nextMembershipTier}`,
          body:
            nextMembershipTier === CreatorMembershipTier.NONE
              ? "你的会员状态已被更新为未开通。"
              : `你的会员状态已更新，当前档位：${nextMembershipTier}${nextMembershipEndsAt ? `，到期时间：${nextMembershipEndsAt.toLocaleDateString("zh-CN")}` : ""}。`,
          href: "/creator/membership",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        action: "creator.updated",
        entityType: "creator",
        entityId: creatorId,
        beforeJson: {
          reviewStatus: before.reviewStatus,
          level: before.level,
          membershipTier: before.membershipTier,
          membershipStartedAt: before.membershipStartedAt,
          membershipEndsAt: before.membershipEndsAt,
          riskLevel: before.riskLevel,
        },
        afterJson: {
          reviewStatus,
          level,
          membershipTier: nextMembershipTier,
          membershipStartedAt: nextMembershipStartedAt,
          membershipEndsAt: nextMembershipEndsAt,
          riskLevel: derivedRisk,
          violationCount: newViolationCount,
          responsibleAdminId,
        },
      },
    });
  });
  revalidatePath("/admin/creators");
  revalidatePath(`/admin/creators/${creatorId}`);
  revalidatePath("/creator");
  revalidatePath("/creator/share");
  revalidatePath("/creator/membership");
}

export async function submitCreatorMembershipApplicationAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: { responsibleAdmin: { include: { user: true } } },
  });
  if (!creator) redirect("/creator/membership/checkout");

  const tierValue = text(formData.get("tier"));
  if (tierValue !== CreatorMembershipTier.GROWTH && tierValue !== CreatorMembershipTier.PRO) {
    redirect("/creator/membership/checkout?error=请选择正确的会员档位");
  }
  const tier = tierValue;

  const paymentReference = text(formData.get("paymentReference"));
  const creatorNote = text(formData.get("creatorNote"));
  const proof = formData.get("paymentProof");
  const proofFile = proof instanceof File && proof.size > 0 ? proof : null;
  if (!paymentReference || !proofFile) {
    redirect(`/creator/membership/checkout?tier=${tier === CreatorMembershipTier.PRO ? "pro" : "growth"}&error=请填写付款单号并上传付款凭证`);
  }
  if (proofFile.size > PAYMENT_PROOF_MAX_BYTES) {
    redirect(`/creator/membership/checkout?tier=${tier === CreatorMembershipTier.PRO ? "pro" : "growth"}&error=付款凭证不能超过 8MB`);
  }

  const existing = await prisma.creatorMembershipApplication.findFirst({
    where: {
      creatorId: creator.id,
      status: CreatorMembershipApplicationStatus.SUBMITTED,
    },
  });
  if (existing) {
    redirect("/creator/membership/checkout?error=当前已有待审核的会员申请，请等待平台处理");
  }

  const uploadedProof = await saveUploadedFile(proofFile, `creator-memberships/${creator.id}`);

  await prisma.$transaction(async (tx) => {
    const application = await tx.creatorMembershipApplication.create({
      data: {
        creatorId: creator.id,
        tier,
        amount: membershipPriceAmount(tier),
        paymentReference,
        paymentProofUrl: uploadedProof,
        creatorNote: creatorNote || null,
      },
    });

    if (creator.responsibleAdmin?.userId) {
      await tx.notification.create({
        data: {
          userId: creator.responsibleAdmin.userId,
          title: "有新的会员开通申请待审核",
          body: `${creator.displayName} 提交了 ${tier} 会员申请，金额 ¥${membershipPriceAmount(tier)}。`,
          href: "/admin/membership-applications",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "creator_membership_application.submitted",
        entityType: "creator_membership_application",
        entityId: application.id,
        afterJson: { tier, amount: membershipPriceAmount(tier), paymentReference },
      },
    });
  });

  revalidatePath("/creator/membership/checkout");
  revalidatePath("/creator/membership");
  revalidatePath("/admin/membership-applications");
  redirect("/creator/membership/checkout?submitted=1");
}

export async function updateCreatorMembershipApplicationAction(applicationId: string, formData: FormData) {
  const session = await requireAdminPermission("payment.confirm");
  const action = text(formData.get("action"));
  const adminNote = text(formData.get("adminNote"));
  const membershipStartedAt = text(formData.get("membershipStartedAt"));
  const membershipEndsAt = text(formData.get("membershipEndsAt"));

  const application = await prisma.creatorMembershipApplication.findUnique({
    where: { id: applicationId },
    include: { creator: { include: { user: true } } },
  });
  if (!application) redirect("/admin/membership-applications");
  if (application.status !== CreatorMembershipApplicationStatus.SUBMITTED) redirect("/admin/membership-applications");

  const nextStatus =
    action === "approve"
      ? CreatorMembershipApplicationStatus.APPROVED
      : action === "reject"
        ? CreatorMembershipApplicationStatus.REJECTED
        : action === "cancel"
          ? CreatorMembershipApplicationStatus.CANCELLED
          : null;
  if (!nextStatus) redirect("/admin/membership-applications?error=无效操作");
  if ((nextStatus === CreatorMembershipApplicationStatus.REJECTED || nextStatus === CreatorMembershipApplicationStatus.CANCELLED) && adminNote.length < 3) {
    redirect("/admin/membership-applications?error=拒绝或取消时请填写处理备注");
  }

  const startedAt = membershipStartedAt ? new Date(membershipStartedAt) : new Date();
  const endsAt = membershipEndsAt ? new Date(membershipEndsAt) : new Date(new Date(startedAt).setFullYear(new Date(startedAt).getFullYear() + 1));

  await prisma.$transaction(async (tx) => {
    await tx.creatorMembershipApplication.update({
      where: { id: application.id },
      data: {
        status: nextStatus,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
        reviewedById: session.userId,
      },
    });

    if (nextStatus === CreatorMembershipApplicationStatus.APPROVED) {
      await tx.creatorProfile.update({
        where: { id: application.creatorId },
        data: {
          membershipTier: application.tier,
          membershipStartedAt: startedAt,
          membershipEndsAt: endsAt,
          membershipNote: adminNote || application.creatorNote || null,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: application.creator.userId,
        title:
          nextStatus === CreatorMembershipApplicationStatus.APPROVED
            ? "会员申请已通过"
            : nextStatus === CreatorMembershipApplicationStatus.REJECTED
              ? "会员申请未通过"
              : "会员申请已取消",
        body:
          nextStatus === CreatorMembershipApplicationStatus.APPROVED
            ? `你的 ${application.tier} 会员申请已通过，当前有效期至 ${endsAt.toLocaleDateString("zh-CN")} 。`
            : adminNote || "请联系平台获取更多信息。",
        href: "/creator/membership",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: `creator_membership_application.${action}`,
        entityType: "creator_membership_application",
        entityId: application.id,
        beforeJson: { status: application.status, tier: application.tier },
        afterJson: { status: nextStatus, adminNote, membershipStartedAt: startedAt, membershipEndsAt: endsAt },
      },
    });
  });

  revalidatePath("/admin/membership-applications");
  revalidatePath(`/admin/creators/${application.creatorId}`);
  revalidatePath("/creator");
  revalidatePath("/creator/membership");
  revalidatePath("/creator/membership/checkout");
}

const adminAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  level: z.enum(["FOUNDER", "STAFF"]),
  dataScope: z.enum(["ALL", "ASSIGNED", "TEAM"]),
  teamName: z.string().optional(),
  wechat: z.string().optional(),
});

export async function createAdminStaffAction(formData: FormData) {
  const context = await requireAdminPermission("staff.manage");
  if (!isFounder(context.profile)) redirect("/403");
  const parsed = adminAccountSchema.safeParse({
    email: text(formData.get("email")).toLowerCase(),
    password: text(formData.get("password")),
    displayName: text(formData.get("displayName")),
    level: text(formData.get("level")) || AdminLevel.STAFF,
    dataScope: text(formData.get("dataScope")) || AdminDataScope.ASSIGNED,
    teamName: text(formData.get("teamName")),
    wechat: text(formData.get("wechat")),
  });
  if (!parsed.success) redirect("/admin/staff?error=Invalid%20staff%20form");

  const permissions = formData.getAll("permissions").map(String).filter((permission) => ADMIN_PERMISSIONS.includes(permission as never));
  const inviteCodeInput = normalizeInviteCode(text(formData.get("inviteCode")));
  const inviteActive = formData.get("inviteActive") === "on";
  const inviteNote = text(formData.get("inviteNote"));

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: parsed.data.email,
          passwordHash: await hashPassword(parsed.data.password),
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          adminProfile: {
            create: {
              displayName: parsed.data.displayName,
              level: parsed.data.level,
              permissions: parsed.data.level === AdminLevel.FOUNDER ? [...ADMIN_PERMISSIONS] : permissions,
              dataScope: parsed.data.dataScope,
              teamName: parsed.data.teamName || null,
              wechat: parsed.data.wechat || null,
              createdById: context.userId,
            },
          },
        },
        include: { adminProfile: true },
      });
      if (created.adminProfile && parsed.data.level === AdminLevel.STAFF) {
        await applyInviteCodeChange({
          db: tx,
          adminProfileId: created.adminProfile.id,
          code: inviteCodeInput || (await generateUniqueInviteCode(tx)),
          active: inviteActive,
          note: inviteNote,
          createdById: context.userId,
        });
      }
      return created;
    });
  } catch (error) {
    if (error instanceof Error) redirect(`/admin/staff?error=${encodeURIComponent(error.message)}`);
    throw error;
  }

  await audit({
    action: "admin_staff.created",
    entityType: "admin_user",
    entityId: user.id,
    afterJson: { email: user.email, level: parsed.data.level, permissions },
  });
  revalidatePath("/admin/staff");
}

export async function updateAdminStaffAction(adminProfileId: string, formData: FormData) {
  const context = await requireAdminPermission("staff.manage");
  if (!isFounder(context.profile)) redirect("/403");
  const before = await prisma.adminProfile.findUnique({ where: { id: adminProfileId }, include: { user: true } });
  if (!before) redirect("/admin/staff");

  const level = text(formData.get("level")) as AdminLevel;
  const dataScope = text(formData.get("dataScope")) as AdminDataScope;
  const status = text(formData.get("status")) as UserStatus;
  const password = text(formData.get("password"));
  const sensitiveConfirmation = text(formData.get("sensitiveConfirmation"));
  const permissions = formData.getAll("permissions").map(String).filter((permission) => ADMIN_PERMISSIONS.includes(permission as never));
  const inviteCodeInput = normalizeInviteCode(text(formData.get("inviteCode")));
  const inviteActive = formData.get("inviteActive") === "on";
  const inviteNote = text(formData.get("inviteNote"));
  const sensitiveChange =
    password.length >= 8 ||
    status === UserStatus.FROZEN ||
    level !== before.level ||
    dataScope !== before.dataScope ||
    permissions.sort().join("|") !== before.permissions.sort().join("|");
  if (sensitiveChange && sensitiveConfirmation !== "CONFIRM") {
    redirect(`/admin/staff?error=${encodeURIComponent("敏感账号操作需要在确认框输入 CONFIRM。")}`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.adminProfile.update({
        where: { id: adminProfileId },
        data: {
          displayName: text(formData.get("displayName")) || before.displayName,
          level,
          dataScope,
          teamName: text(formData.get("teamName")) || null,
          wechat: text(formData.get("wechat")) || null,
          permissions: level === AdminLevel.FOUNDER ? [...ADMIN_PERMISSIONS] : permissions,
        },
      });
      await tx.user.update({
        where: { id: before.userId },
        data: {
          status: status || before.user.status,
          passwordHash: password.length >= 8 ? await hashPassword(password) : undefined,
          passwordChangedAt: password.length >= 8 ? new Date() : undefined,
        },
      });
      if (inviteCodeInput) {
        await applyInviteCodeChange({
          db: tx,
          adminProfileId,
          code: inviteCodeInput,
          active: inviteActive,
          note: inviteNote,
          createdById: context.userId,
        });
      } else if (before.level === AdminLevel.FOUNDER && level === AdminLevel.STAFF) {
        await ensureStaffInviteCode({ db: tx, adminProfileId, createdById: context.userId });
      }
      await applyAdminLevelInviteRules({
        db: tx,
        adminProfileId,
        previousLevel: before.level,
        nextLevel: level,
        createdById: context.userId,
      });
      await tx.auditLog.create({
        data: {
          actorUserId: context.userId,
          actorRole: context.role,
          action: password.length >= 8 ? "admin_staff.updated_and_password_reset" : "admin_staff.updated",
          entityType: "admin_user",
          entityId: before.userId,
          beforeJson: { status: before.user.status, level: before.level, dataScope: before.dataScope, permissions: before.permissions },
          afterJson: { status, level, dataScope, permissions, wechat: text(formData.get("wechat")), inviteCode: inviteCodeInput || null, inviteActive },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error) redirect(`/admin/staff?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  revalidatePath("/admin/staff");
  revalidatePath("/admin/invitations");
}

const adminCreatedBrandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  brandName: z.string().min(2),
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  industry: z.string().min(2),
  country: z.string().min(2),
});

export async function createBrandAccountAction(formData: FormData) {
  const context = await requireAdminPermission("account.create");
  const parsed = adminCreatedBrandSchema.safeParse({
    email: text(formData.get("email")).toLowerCase(),
    password: text(formData.get("password")),
    brandName: text(formData.get("brandName")),
    companyName: text(formData.get("companyName")),
    contactName: text(formData.get("contactName")),
    industry: text(formData.get("industry")),
    country: text(formData.get("country")),
  });
  if (!parsed.success) redirect("/admin/accounts?error=Invalid%20brand%20form");

  const responsibleAdminId = text(formData.get("responsibleAdminId")) || context.profile.id;
  const selectedAdmin = await prisma.adminProfile.findUnique({ where: { id: responsibleAdminId } });
  if (!selectedAdmin) redirect("/admin/accounts?error=Admin%20owner%20not%20found");
  if (!isFounder(context.profile) && selectedAdmin.id !== context.profile.id && selectedAdmin.teamName !== context.profile.teamName) redirect("/403");
  const isDemo = hasAdminPermission(context.profile, "demo.manage") && formData.get("isDemo") === "on";

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: UserRole.BRAND,
      status: UserStatus.ACTIVE,
      brandProfile: {
        create: {
          brandName: parsed.data.brandName,
          companyName: parsed.data.companyName,
          contactName: parsed.data.contactName,
          email: parsed.data.email,
          industry: parsed.data.industry,
          country: parsed.data.country,
          description: text(formData.get("description")) || "由平台方创建的品牌账号。",
          reviewStatus: ReviewStatus.APPROVED,
          responsibleAdminId,
          isDemo,
        },
      },
    },
  });
  await audit({
    action: "brand_account.created_by_admin",
    entityType: "brand",
    entityId: user.id,
    afterJson: { email: user.email, responsibleAdminId, isDemo },
  });
  redirect("/admin/accounts");
}

const adminCreatedCreatorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  country: z.string().min(2),
});

export async function createCreatorAccountAction(formData: FormData) {
  const context = await requireAdminPermission("account.create");
  const parsed = adminCreatedCreatorSchema.safeParse({
    email: text(formData.get("email")).toLowerCase(),
    password: text(formData.get("password")),
    displayName: text(formData.get("displayName")),
    country: text(formData.get("country")),
  });
  if (!parsed.success) redirect("/admin/accounts?error=Invalid%20creator%20form");

  const responsibleAdminId = text(formData.get("responsibleAdminId")) || context.profile.id;
  const selectedAdmin = await prisma.adminProfile.findUnique({ where: { id: responsibleAdminId } });
  if (!selectedAdmin) redirect("/admin/accounts?error=Admin%20owner%20not%20found");
  if (!isFounder(context.profile) && selectedAdmin.id !== context.profile.id && selectedAdmin.teamName !== context.profile.teamName) redirect("/403");
  const isDemo = hasAdminPermission(context.profile, "demo.manage") && formData.get("isDemo") === "on";

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: UserRole.CREATOR,
      status: UserStatus.ACTIVE,
      creatorProfile: {
        create: {
          displayName: parsed.data.displayName,
          email: parsed.data.email,
          shareCode: await generateUniqueCreatorShareCode(prisma),
          country: parsed.data.country,
          languages: csv(formData.get("languages")),
          categories: csv(formData.get("categories")),
          contentTypes: csv(formData.get("contentTypes")),
          reviewStatus: ReviewStatus.APPROVED,
          level: (text(formData.get("level")) as CreatorLevel) || CreatorLevel.NEW,
          responsibleAdminId,
          isDemo,
          wallet: { create: { currency: text(formData.get("currency")) || "CNY" } },
        },
      },
    },
  });
  await audit({
    action: "creator_account.created_by_admin",
    entityType: "creator",
    entityId: user.id,
    afterJson: { email: user.email, responsibleAdminId, isDemo },
  });
  redirect("/admin/accounts");
}

export async function generateDemoDataAction() {
  const context = await requireAdminPermission("demo.manage");
  if (!isFounder(context.profile)) redirect("/403");
  const suffix = Date.now().toString().slice(-6);
  const passwordHash = await hashPassword("password123");

  const result = await prisma.$transaction(async (tx) => {
    const brandUser = await tx.user.create({
      data: {
        email: `demo-brand-${suffix}@test.com`,
        passwordHash,
        role: UserRole.BRAND,
        status: UserStatus.ACTIVE,
        brandProfile: {
          create: {
            brandName: `演示品牌 ${suffix}`,
            companyName: `演示品牌有限公司 ${suffix}`,
            contactName: "Demo Brand Owner",
            email: `demo-brand-${suffix}@test.com`,
            industry: "AI 工具",
            country: "新加坡",
            description: "内部演示品牌，不计入真实运营统计。",
            reviewStatus: ReviewStatus.APPROVED,
            responsibleAdminId: context.profile.id,
            isDemo: true,
          },
        },
      },
      include: { brandProfile: true },
    });
    const creatorUser = await tx.user.create({
      data: {
        email: `demo-creator-${suffix}@test.com`,
        passwordHash,
        role: UserRole.CREATOR,
        status: UserStatus.ACTIVE,
        creatorProfile: {
          create: {
            displayName: `演示创作者 ${suffix}`,
            email: `demo-creator-${suffix}@test.com`,
            shareCode: await generateUniqueCreatorShareCode(tx),
            country: "新加坡",
            languages: ["中文", "英文"],
            categories: ["AI", "SaaS"],
            contentTypes: ["短视频"],
            reviewStatus: ReviewStatus.APPROVED,
            level: CreatorLevel.PRO,
            responsibleAdminId: context.profile.id,
            isDemo: true,
            wallet: { create: { currency: "CNY" } },
            socialAccounts: {
              create: {
                platform: "TikTok",
                accountName: `demo_creator_${suffix}`,
                accountUrl: "https://tiktok.com/@demo",
                followers: 52000,
                avgViews: 18000,
                contentType: "短视频",
                country: "新加坡",
                language: "中文",
                verified: true,
                verificationStatus: SocialVerificationStatus.VERIFIED,
                verifiedAt: new Date(),
              },
            },
          },
        },
      },
      include: { creatorProfile: { include: { wallet: true } } },
    });
    const campaign = await tx.campaign.create({
      data: {
        brandId: brandUser.brandProfile!.id,
        title: `演示推广活动 ${suffix}`,
        productName: "演示 AI 工具",
        industry: "AI 工具",
        description: "内部演示 Campaign，不计入真实运营统计。",
        objective: "娉ㄥ唽",
        targetPlatforms: ["TikTok", "YouTube Shorts"],
        targetCountries: ["新加坡", "美国"],
        targetLanguages: ["中文", "英文"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        totalBudget: 12000,
        creatorBudget: 7800,
        platformFee: 4200,
        baseReward: 260,
        brief: "展示演示 AI 工具如何帮助团队跑通创作者投放流程，避免夸大承诺。",
        mustInclude: ["AI 工具", "人工审核", "数据回传"],
        mustNotInclude: ["保证收益", "零风险收入"],
        hashtags: ["#AIWorkflow", "#CreatorCampaign"],
        cta: "预约演示。",
        disclosureRequired: true,
        status: CampaignStatus.ACTIVE,
        slotsTotal: 8,
        isDemo: true,
      },
    });
    const task = await tx.campaignTask.create({
      data: {
        campaignId: campaign.id,
        title: "演示短视频任务",
        platform: "TikTok",
        contentType: "短视频",
        rewardAmount: 260,
        slotsTotal: 5,
        slotsTaken: 1,
        creatorLevelRequired: CreatorLevel.NEW,
        deadline: campaign.endDate,
      },
    });
    const application = await tx.taskApplication.create({
      data: { taskId: task.id, creatorId: creatorUser.creatorProfile!.id, status: ApplicationStatus.APPROVED, approvedAt: new Date() },
    });
    const draft = await tx.contentDraft.create({
      data: {
        applicationId: application.id,
        creatorId: creatorUser.creatorProfile!.id,
        campaignId: campaign.id,
        platform: "TikTok",
        title: "演示 AI 工具如何跑通创作者投放",
        script: "用一个真实工作流展示：品牌发布需求、平台审核、创作者生成内容、回传 Proof、进入结算。",
        caption: "这是一条内部演示内容，用来展示平台完整闭环。",
        hashtags: ["#AIWorkflow", "#CreatorCampaign"],
        coverText: "创作者投放闭环演示",
        riskCheckResult: { blocked: false, hits: [] },
        status: DraftStatus.SUBMITTED,
      },
    });
    const submission = await tx.submission.create({
      data: {
        applicationId: application.id,
        draftId: draft.id,
        creatorId: creatorUser.creatorProfile!.id,
        campaignId: campaign.id,
        status: SubmissionStatus.VERIFIED,
        approvedAt: new Date(),
      },
    });
    const proof = await tx.proof.create({
      data: {
        submissionId: submission.id,
        creatorId: creatorUser.creatorProfile!.id,
        campaignId: campaign.id,
        platform: "TikTok",
        postUrl: "https://tiktok.com/@demo/video/demo",
        normalizedPostUrl: normalizePostUrlForDedupe("https://tiktok.com/@demo/video/demo"),
        publishedAt: new Date(),
        views: 48600,
        likes: 3200,
        comments: 260,
        shares: 540,
        saves: 390,
        clicks: 720,
        conversions: 86,
        verificationStatus: ProofStatus.VERIFIED,
        adminNote: "内部演示数据。",
      },
    });
    await tx.metricsSnapshot.create({
      data: {
        proofId: proof.id,
        campaignId: campaign.id,
        views: proof.views,
        likes: proof.likes,
        comments: proof.comments,
        shares: proof.shares,
        saves: proof.saves,
        clicks: proof.clicks,
        conversions: proof.conversions,
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: creatorUser.creatorProfile!.wallet!.id,
        creatorId: creatorUser.creatorProfile!.id,
        type: WalletTxType.EARNING,
        amount: 260,
        currency: "CNY",
        status: WalletTxStatus.APPROVED,
        relatedSubmissionId: submission.id,
        isDemo: true,
        note: "内部演示收益，不计入真实财务统计。",
      },
    });
    return { brandId: brandUser.brandProfile!.id, creatorId: creatorUser.creatorProfile!.id, campaignId: campaign.id };
  });

  await audit({ action: "demo_data.generated", entityType: "demo_batch", entityId: result.campaignId, afterJson: result });
  redirect("/admin/demo");
}

const campaignSchema = z.object({
  title: z.string().min(3),
  productName: z.string().min(1),
  landingUrl: z.string().optional(),
  industry: z.string().min(2),
  objective: z.string().min(1),
  targetPlatforms: z.array(z.string()).default([]),
  targetCountries: z.array(z.string()).min(1),
  targetLanguages: z.array(z.string()).min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalBudget: z.coerce.number().positive(),
  creatorBudget: z.coerce.number().positive(),
  platformFee: z.coerce.number().min(0),
  baseReward: z.coerce.number().positive(),
  brief: z.string().min(20),
  mustInclude: z.array(z.string()),
  mustNotInclude: z.array(z.string()),
  visualRequirements: z.array(z.string()),
  hashtags: z.array(z.string()),
  cta: z.string().min(3),
  slotsTotal: z.coerce.number().int().positive(),
  escrowAmount: z.coerce.number().positive(),
  requiresDraftReview: z.boolean(),
  acceptanceSlaDays: z.coerce.number().int().positive(),
  highValueReviewThreshold: z.coerce.number().positive(),
  resubmissionGraceDays: z.coerce.number().int().min(0),
});

const campaignTaskInputSchema = z.object({
  platform: z.string().min(1),
  contentType: z.string().min(1),
  slotsTotal: z.coerce.number().int().positive(),
  rewardAmount: z.coerce.number().positive(),
  minimumFollowers: z.coerce.number().int().min(0),
  draftDeadline: z.string().optional(),
  publishDeadline: z.string().min(1),
  platformRequirement: z.string().optional(),
});

function parseCampaignTaskInputs(formData: FormData) {
  const platforms = formData.getAll("taskPlatform").map((value) => text(value));
  const contentTypes = formData.getAll("taskContentType").map((value) => text(value));
  const slots = formData.getAll("taskSlotsTotal").map((value) => text(value));
  const rewards = formData.getAll("taskRewardAmount").map((value) => text(value));
  const followers = formData.getAll("taskMinimumFollowers").map((value) => text(value));
  const draftDeadlines = formData.getAll("taskDraftDeadline").map((value) => text(value));
  const publishDeadlines = formData.getAll("taskPublishDeadline").map((value) => text(value));
  const requirements = formData.getAll("taskPlatformRequirement").map((value) => text(value));

  return platforms
    .map((platform, index) =>
      campaignTaskInputSchema.parse({
        platform,
        contentType: contentTypes[index],
        slotsTotal: slots[index],
        rewardAmount: rewards[index],
        minimumFollowers: followers[index] || 0,
        draftDeadline: draftDeadlines[index],
        publishDeadline: publishDeadlines[index],
        platformRequirement: requirements[index],
      }),
    )
    .filter((task) => task.platform);
}

export async function createCampaignAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const [brand, settings] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { userId: session.userId }, include: { user: true } }),
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
  ]);
  if (!brand) redirect("/brand/profile");
  if (brand.reviewStatus === ReviewStatus.FROZEN || brand.user.status === UserStatus.FROZEN) redirect("/403");

  const parsed = campaignSchema.safeParse({
    title: text(formData.get("title")),
    productName: text(formData.get("productName")),
    landingUrl: text(formData.get("landingUrl")),
    industry: text(formData.get("industry")),
    objective: text(formData.get("objective")),
    targetPlatforms: csv(formData.get("targetPlatforms")),
    targetCountries: csv(formData.get("targetCountries")),
    targetLanguages: csv(formData.get("targetLanguages")),
    startDate: text(formData.get("startDate")),
    endDate: text(formData.get("endDate")),
    totalBudget: text(formData.get("totalBudget")),
    creatorBudget: text(formData.get("creatorBudget")),
    platformFee: text(formData.get("platformFee")),
    baseReward: text(formData.get("baseReward")),
    brief: text(formData.get("brief")),
    mustInclude: csv(formData.get("mustInclude")),
    mustNotInclude: csv(formData.get("mustNotInclude")),
    visualRequirements: csv(formData.get("visualRequirements")),
    hashtags: csv(formData.get("hashtags")),
    cta: text(formData.get("cta")),
    slotsTotal: text(formData.get("slotsTotal")),
    escrowAmount: text(formData.get("escrowAmount")),
    requiresDraftReview: formData.get("requiresDraftReview") === "on",
    acceptanceSlaDays: text(formData.get("acceptanceSlaDays")) || 3,
    highValueReviewThreshold: text(formData.get("highValueReviewThreshold")) || 50,
    resubmissionGraceDays: text(formData.get("resubmissionGraceDays")) || 2,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".") || "表单";
    redirect(`/brand/campaigns/new?error=${encodeURIComponent(`${field} 校验失败：${issue?.message ?? "请检查必填项"}`)}`);
  }

  let taskInputs: ReturnType<typeof parseCampaignTaskInputs>;
  try {
    taskInputs = parseCampaignTaskInputs(formData);
  } catch {
    redirect(`/brand/campaigns/new?error=${encodeURIComponent("平台任务配置不完整，请检查平台、人数、奖励和发布截止时间。")}`);
  }
  if (!taskInputs.length) redirect(`/brand/campaigns/new?error=${encodeURIComponent("至少需要配置一个平台任务。")}`);

  const calculatedEscrow = taskInputs.reduce((sum, task) => sum + task.slotsTotal * task.rewardAmount, 0);
  const platformFeeRate = Number(settings.platformFeeRate);
  const platformFeeAmount = Math.round(calculatedEscrow * platformFeeRate * 100) / 100;
  const totalCampaignBudget = calculatedEscrow + platformFeeAmount;
  if (calculatedEscrow <= 0) redirect(`/brand/campaigns/new?error=${encodeURIComponent("托管金额必须大于 0。")}`);

  const intent = text(formData.get("intent"));
  const shouldSubmit = intent === "submit";
  const hasEnoughBalance = Number(brand.budgetBalance) >= totalCampaignBudget;
  const campaignStatus = !shouldSubmit ? CampaignStatus.DRAFT : hasEnoughBalance ? CampaignStatus.PENDING_REVIEW : CampaignStatus.AWAITING_PAYMENT;
  const paymentReference = text(formData.get("paymentReference"));
  const paymentProof = formData.get("paymentProof");
  const paymentProofFile = paymentProof instanceof File && paymentProof.size > 0 ? paymentProof : null;
  if (shouldSubmit && !hasEnoughBalance && (!paymentReference || !paymentProofFile)) {
    redirect(`/brand/campaigns/new?error=${encodeURIComponent("按单付款需要上传付款截图并填写交易订单号。")}`);
  }
  if (shouldSubmit && !hasEnoughBalance && paymentReference) {
    const duplicatePayment = await prisma.invoice.findUnique({
      where: { paymentReference },
      select: { id: true, brandId: true },
    });
    if (duplicatePayment) {
      await recordDuplicatePaymentReferenceAttempt({
        actorUserId: session.userId,
        actorRole: session.role,
        duplicateInvoiceId: duplicatePayment.id,
        duplicateBrandId: duplicatePayment.brandId,
        attemptedInvoiceId: null,
        paymentReference,
      });
      redirect(`/brand/campaigns/new?error=${encodeURIComponent("该交易订单号已经提交过，请确认付款凭证或更换订单号。")}`);
    }
  }
  if (paymentProofFile && paymentProofFile.size > PAYMENT_PROOF_MAX_BYTES) {
    redirect(`/brand/campaigns/new?error=${encodeURIComponent("付款截图不能超过 8MB，请压缩后重新上传。")}`);
  }
  const uploadedPaymentProof = paymentProofFile ? await saveUploadedFile(paymentProofFile, "campaign-payment-proofs") : null;

  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.campaign.create({
      data: {
        ...parsed.data,
        totalBudget: totalCampaignBudget,
        creatorBudget: calculatedEscrow,
        platformFee: platformFeeAmount,
        platformFeeRate,
        escrowAmount: totalCampaignBudget,
        escrowFrozenAmount: shouldSubmit && hasEnoughBalance ? totalCampaignBudget : 0,
        escrowReleasedAmount: 0,
        currency: "CNY",
        baseReward: taskInputs[0]?.rewardAmount ?? parsed.data.baseReward,
        targetPlatforms: [...new Set(taskInputs.map((task) => task.platform))],
        targetCountries: parsed.data.targetCountries,
        targetLanguages: parsed.data.targetLanguages,
        brandId: brand.id,
        isDemo: brand.isDemo,
        description: parsed.data.brief.slice(0, 240),
        targetAudience: text(formData.get("targetAudience")),
        disclosureRequired: true,
        requiresDraftReview: parsed.data.requiresDraftReview,
        revisionLimit: 2,
        acceptanceSlaDays: parsed.data.acceptanceSlaDays,
        highValueReviewThreshold: settings.highValueReviewThreshold,
        resubmissionGraceDays: parsed.data.resubmissionGraceDays,
        maxPerCreator: 1,
        allowUnverifiedSocialAccounts: formData.get("allowUnverifiedSocialAccounts") === "on",
        status: campaignStatus,
        bonusRules: { v1: "fixed_reward_only" },
        tasks: {
          create: taskInputs.map((task) => ({
            title: `${task.platform} ${task.contentType}`,
            platform: task.platform,
            contentType: task.contentType,
            platformRequirement: task.platformRequirement || null,
            minimumFollowers: task.minimumFollowers,
            rewardAmount: task.rewardAmount,
            slotsTotal: task.slotsTotal,
            creatorLevelRequired: CreatorLevel.NEW,
            deadline: new Date(task.publishDeadline),
            draftDeadline: task.draftDeadline ? new Date(task.draftDeadline) : null,
            publishDeadline: new Date(task.publishDeadline),
            status: TaskStatus.ACTIVE,
          })),
        },
      },
    });

    if (shouldSubmit && hasEnoughBalance) {
      await tx.brandProfile.update({
        where: { id: brand.id },
        data: {
          budgetBalance: { decrement: totalCampaignBudget },
          frozenEscrowBalance: { increment: totalCampaignBudget },
        },
      });
      await tx.brandLedgerTransaction.create({
        data: {
          brandId: brand.id,
          campaignId: created.id,
          type: BrandLedgerTxType.ESCROW_FREEZE,
          amount: totalCampaignBudget,
          currency: "CNY",
          status: BrandLedgerTxStatus.CONFIRMED,
          beforeBalance: brand.budgetBalance,
          afterBalance: Number(brand.budgetBalance) - totalCampaignBudget,
          createdById: session.userId,
          note: "Campaign submitted with sufficient merchant balance; reward budget and estimated platform fee frozen automatically.",
        },
      });
    }

    if (shouldSubmit && !hasEnoughBalance) {
      const shortId = created.id.slice(-8).toUpperCase();
      await tx.invoice.create({
        data: {
          brandId: brand.id,
          campaignId: created.id,
          invoiceNumber: `PAY-${shortId}`,
          amount: Math.max(0, totalCampaignBudget - Number(brand.budgetBalance)),
          currency: "CNY",
          status: uploadedPaymentProof ? InvoiceStatus.PAYMENT_SUBMITTED : InvoiceStatus.OPEN,
          paymentMethod: "人工转账",
          paymentProofUrl: uploadedPaymentProof,
          paymentReference,
          note: "V1 campaign escrow payment order. Admin confirmation required before activation.",
          isDemo: brand.isDemo,
        },
      });
      await tx.brandLedgerTransaction.create({
        data: {
          brandId: brand.id,
          campaignId: created.id,
          type: BrandLedgerTxType.PAYMENT,
          amount: Math.max(0, totalCampaignBudget - Number(brand.budgetBalance)),
          currency: "CNY",
          status: BrandLedgerTxStatus.PENDING,
          beforeBalance: brand.budgetBalance,
          afterBalance: brand.budgetBalance,
          createdById: session.userId,
          note: paymentReference ? `Campaign payment submitted by merchant. Reference: ${paymentReference}` : "Campaign awaiting merchant payment proof.",
        },
      });
    }

    return created;
  }).catch(async (error: unknown) => {
    if (isUniqueConstraintError(error, ["paymentReference"])) {
      const duplicatePayment = await prisma.invoice.findUnique({
        where: { paymentReference },
        select: { id: true, brandId: true },
      });
      if (duplicatePayment) {
        await recordDuplicatePaymentReferenceAttempt({
          actorUserId: session.userId,
          actorRole: session.role,
          duplicateInvoiceId: duplicatePayment.id,
          duplicateBrandId: duplicatePayment.brandId,
          attemptedInvoiceId: null,
          paymentReference,
        });
      }
      redirect(`/brand/campaigns/new?error=${encodeURIComponent("该交易订单号已经提交过，请确认付款凭证或更换订单号。")}`);
    }
    throw error;
  });

  const files = formData.getAll("assetFiles").filter((file): file is File => file instanceof File && file.size > 0);
  const manualAssetUrl = text(formData.get("assetUrl"));
  const saved = await Promise.all(files.map((file) => saveUploadedFile(file, `campaigns/${campaign.id}`)));
  const assetData = saved
    .filter(Boolean)
    .map((url, index) => ({ campaignId: campaign.id, kind: "upload", name: files[index]?.name ?? "asset", url: String(url) }));
  if (manualAssetUrl) {
    assetData.push({ campaignId: campaign.id, kind: "link", name: "External asset", url: manualAssetUrl });
  }
  if (assetData.length) await prisma.campaignAsset.createMany({ data: assetData });

  await audit({
    action: shouldSubmit ? "campaign.submitted" : "campaign.draft_created",
    entityType: "campaign",
    entityId: campaign.id,
    afterJson: {
      status: campaign.status,
      title: campaign.title,
      escrowAmount: totalCampaignBudget,
      creatorBudget: calculatedEscrow,
      platformFeeAmount,
      platformFeeRate,
      tasks: taskInputs.length,
    },
  });
  redirect(`/brand/campaigns/${campaign.id}`);
}

export async function submitExistingCampaignAction(campaignId: string) {
  const session = await requireRole(UserRole.BRAND);
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { brand: true } });
  if (!campaign || campaign.brand.userId !== session.userId) redirect("/403");
  if (campaign.status !== CampaignStatus.DRAFT) redirect(`/brand/campaigns/${campaignId}`);
  const requiredEscrow = Math.max(0, Number(campaign.escrowAmount) - Number(campaign.escrowFrozenAmount));
  const hasEnoughBalance = Number(campaign.brand.budgetBalance) >= requiredEscrow;
  const nextCampaignStatus = hasEnoughBalance ? CampaignStatus.PENDING_REVIEW : CampaignStatus.AWAITING_PAYMENT;
  try {
    assertCampaignTransition(campaign.status, nextCampaignStatus);
  } catch (error) {
    redirect(`/brand/campaigns/${campaignId}?error=${encodeURIComponent(error instanceof Error ? error.message : "Campaign 状态不允许提交")}`);
  }
  await prisma.$transaction(async (tx) => {
    if (hasEnoughBalance) {
      if (requiredEscrow > 0) {
        await tx.brandProfile.update({
          where: { id: campaign.brandId },
          data: {
            budgetBalance: { decrement: requiredEscrow },
            frozenEscrowBalance: { increment: requiredEscrow },
          },
        });
        await tx.brandLedgerTransaction.create({
          data: {
            brandId: campaign.brandId,
            campaignId,
            type: BrandLedgerTxType.ESCROW_FREEZE,
            amount: requiredEscrow,
            currency: campaign.currency,
            status: BrandLedgerTxStatus.CONFIRMED,
            beforeBalance: campaign.brand.budgetBalance,
            afterBalance: Number(campaign.brand.budgetBalance) - requiredEscrow,
            createdById: session.userId,
            note: "Draft campaign submitted; escrow frozen from merchant balance.",
          },
        });
      }
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status: nextCampaignStatus,
          escrowFrozenAmount: { increment: requiredEscrow },
        },
      });
    } else {
      await tx.campaign.update({
        where: { id: campaignId },
        data: { status: nextCampaignStatus },
      });
      await tx.invoice.create({
        data: {
          brandId: campaign.brandId,
          campaignId,
          invoiceNumber: `PAY-${campaign.id.slice(-8).toUpperCase()}`,
          amount: Math.max(0, requiredEscrow - Number(campaign.brand.budgetBalance)),
          currency: campaign.currency,
          status: InvoiceStatus.OPEN,
          note: "Campaign escrow payment order generated from draft submission.",
          isDemo: campaign.isDemo,
        },
      });
      await tx.brandLedgerTransaction.create({
        data: {
          brandId: campaign.brandId,
          campaignId,
          type: BrandLedgerTxType.PAYMENT,
          amount: Math.max(0, requiredEscrow - Number(campaign.brand.budgetBalance)),
          currency: campaign.currency,
          status: BrandLedgerTxStatus.PENDING,
          beforeBalance: campaign.brand.budgetBalance,
          afterBalance: campaign.brand.budgetBalance,
          createdById: session.userId,
          note: "Draft campaign submitted with insufficient balance; awaiting payment.",
        },
      });
    }
  });
  await audit({
    action: "campaign.submitted",
    entityType: "campaign",
    entityId: campaignId,
    beforeJson: { status: CampaignStatus.DRAFT },
    afterJson: { status: nextCampaignStatus, requiredEscrow },
  });
  redirect(`/brand/campaigns/${campaignId}`);
}

const brandInvoiceSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(3),
  note: z.string().optional(),
  campaignId: z.string().optional(),
});

const brandRefundSchema = z.object({
  amount: z.coerce.number().positive(),
  payoutMethod: z.string().min(1),
  payoutDetails: z.string().min(3),
  relatedInvoiceId: z.string().optional(),
});

function providerFromPaymentReference(paymentReference?: string | null) {
  if (paymentReference?.startsWith("ALIPAY-")) return "alipay";
  if (paymentReference?.startsWith("WECHAT-")) return "wechat_pay";
  return null;
}

async function markBrandRefundPaid({
  refundId,
  actorUserId,
  actorRole,
  adminNote,
  provider,
  providerRefundStatus,
  providerRefundRaw,
}: {
  refundId: string;
  actorUserId: string;
  actorRole: UserRole;
  adminNote: string;
  provider?: string;
  providerRefundStatus?: string;
  providerRefundRaw?: Prisma.InputJsonValue;
}) {
  const request = await prisma.brandRefundRequest.findUnique({ where: { id: refundId }, include: { brand: true } });
  if (!request) redirect("/admin/payments");
  if (request.status === BrandRefundStatus.PAID) return;
  if (Number(request.amount) > Number(request.brand.budgetBalance)) redirect("/admin/payments?error=退款金额超过品牌当前可用余额。");

  await prisma.$transaction(async (tx) => {
    await tx.brandRefundRequest.update({
      where: { id: refundId },
      data: {
        status: BrandRefundStatus.PAID,
        adminNote,
        provider: provider ?? request.provider,
        providerRefundStatus: providerRefundStatus ?? request.providerRefundStatus,
        providerRefundRaw,
        refundedAt: new Date(),
      },
    });
    await tx.brandProfile.update({
      where: { id: request.brandId },
      data: { budgetBalance: { decrement: request.amount } },
    });
    await tx.brandLedgerTransaction.updateMany({
      where: { relatedRefundId: refundId, type: BrandLedgerTxType.REFUND },
      data: { status: BrandLedgerTxStatus.CONFIRMED, note: adminNote || "Merchant refund paid." },
    });
    await notifyBrand(tx, {
      brandId: request.brandId,
      title: "退款已完成",
      body: `${request.currency} ${Number(request.amount).toFixed(2)} 已完成退款处理。`,
      href: "/brand/billing?tab=refunds",
    });
    await notifyPaymentAdmins(tx, {
      brandId: request.brandId,
      title: "品牌退款已完成",
      body: `${request.brand.brandName} 的退款 ${request.currency} ${Number(request.amount).toFixed(2)} 已完成。`,
      href: "/admin/payments",
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        actorRole,
        action: "brand_refund.paid",
        entityType: "brand_refund_request",
        entityId: refundId,
        beforeJson: { status: request.status, budgetBalance: String(request.brand.budgetBalance) },
        afterJson: { adminNote, provider, providerRefundStatus },
      },
    });
  });
}

export async function requestBrandInvoiceAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: { campaigns: true, responsibleAdmin: true },
  });
  if (!brand) redirect("/brand/billing");
  const parsed = brandInvoiceSchema.safeParse({
    amount: text(formData.get("amount")),
    currency: text(formData.get("currency")) || "CNY",
    note: text(formData.get("note")),
    campaignId: text(formData.get("campaignId")),
  });
  if (!parsed.success) redirect("/brand/billing?error=请填写正确的开票金额");
  const campaignId = parsed.data.campaignId || null;
  if (campaignId && !brand.campaigns.some((campaign) => campaign.id === campaignId)) redirect("/403");

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        brandId: brand.id,
        campaignId,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        status: InvoiceStatus.REQUESTED,
        note: parsed.data.note || "品牌方提交预算/发票申请。",
        isDemo: brand.isDemo,
      },
    });
    if (brand.responsibleAdmin?.userId) {
      await tx.notification.create({
        data: {
          userId: brand.responsibleAdmin.userId,
          title: "品牌提交了发票/预算申请",
          body: `${brand.brandName} 申请 ${parsed.data.currency} ${parsed.data.amount}`,
          href: "/admin/payments",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "brand_invoice.requested",
        entityType: "invoice",
        entityId: created.id,
        afterJson: { amount: parsed.data.amount, currency: parsed.data.currency, campaignId },
      },
    });
    return created;
  });
  redirect(`/brand/billing?invoice=${invoice.id}`);
}

export async function submitInvoicePaymentAction(invoiceId: string, formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, brand: { userId: session.userId } }, include: { brand: true } });
  if (!invoice || invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.VOID) redirect("/brand/billing");

  const proof = formData.get("paymentProof");
  const proofFile = proof instanceof File && proof.size > 0 ? proof : null;
  if (proofFile && proofFile.size > PAYMENT_PROOF_MAX_BYTES) redirect("/brand/billing?error=付款截图不能超过 8MB，请压缩后重新上传");
  const method = text(formData.get("paymentMethod")) || "Bank transfer";
  const paymentReference = text(formData.get("paymentReference"));
  const submittedPaymentProofUrl = text(formData.get("paymentProofUrl"));
  if (!paymentReference || (!proofFile && !submittedPaymentProofUrl)) redirect("/brand/billing?error=请上传付款截图并填写交易订单号");
  const duplicatePayment = await prisma.invoice.findUnique({
    where: { paymentReference },
    select: { id: true, brandId: true },
  });
  if (duplicatePayment && duplicatePayment.id !== invoice.id) {
    await recordDuplicatePaymentReferenceAttempt({
      actorUserId: session.userId,
      actorRole: session.role,
      duplicateInvoiceId: duplicatePayment.id,
      duplicateBrandId: duplicatePayment.brandId,
      attemptedInvoiceId: invoice.id,
      paymentReference,
    });
    redirect("/brand/billing?error=该交易订单号已经提交过，请确认付款凭证或更换订单号");
  }
  const uploadedProof = proofFile ? await saveUploadedFile(proofFile, `invoices/${invoice.id}`) : null;
  const paymentProofUrl = uploadedProof || submittedPaymentProofUrl;

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.PAYMENT_SUBMITTED,
        paymentMethod: method,
        paymentProofUrl: paymentProofUrl || null,
        paymentReference,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "brand_invoice.payment_submitted",
        entityType: "invoice",
        entityId: invoice.id,
        beforeJson: { status: invoice.status },
        afterJson: { status: InvoiceStatus.PAYMENT_SUBMITTED, paymentMethod: method, paymentReference },
      },
    });
    await notifyPaymentAdmins(tx, {
      brandId: invoice.brandId,
      title: "品牌提交了付款凭证",
      body: `${invoice.brand.brandName} 提交了 ${invoice.currency} ${Number(invoice.amount).toFixed(2)} 的付款凭证。`,
      href: "/admin/payments",
    });
  }).catch(async (error: unknown) => {
    if (isUniqueConstraintError(error, ["paymentReference"])) {
      const duplicatePayment = await prisma.invoice.findUnique({
        where: { paymentReference },
        select: { id: true, brandId: true },
      });
      if (duplicatePayment && duplicatePayment.id !== invoice.id) {
        await recordDuplicatePaymentReferenceAttempt({
          actorUserId: session.userId,
          actorRole: session.role,
          duplicateInvoiceId: duplicatePayment.id,
          duplicateBrandId: duplicatePayment.brandId,
          attemptedInvoiceId: invoice.id,
          paymentReference,
        });
      }
      redirect("/brand/billing?error=该交易订单号已经提交过，请确认付款凭证或更换订单号");
    }
    throw error;
  });
  redirect("/brand/billing?payment=1");
}

export async function updateInvoiceStatusAction(invoiceId: string, formData: FormData) {
  const session = await requireAdminPermission("payment.confirm");
  const action = text(formData.get("action"));
  const note = text(formData.get("note"));
  const returnTo = text(formData.get("returnTo"));
  const fallbackPath = returnTo.startsWith("/admin/") ? returnTo : "/admin/payments";
  const redirectWithError = (message: string): never => redirect(`${fallbackPath}?error=${encodeURIComponent(message)}`);
  const confirmed = text(formData.get("confirmAction")) === "yes";
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { brand: true, campaign: true } });
  if (!invoice) redirect(fallbackPath);

  const invoiceNumber = invoice.invoiceNumber || `INV-${new Date().getFullYear()}-${invoice.id.slice(-6).toUpperCase()}`;
  const statusMap: Record<string, InvoiceStatus> = {
    issue: InvoiceStatus.OPEN,
    paid: InvoiceStatus.PAID,
    reject: InvoiceStatus.REJECTED,
    void: InvoiceStatus.VOID,
  };
  const nextStatus = statusMap[action];
  if (!nextStatus) redirect(fallbackPath);
  if (!confirmed) redirectWithError("资金操作必须先勾选确认。");
  if ((action === "reject" || action === "void") && note.length < 3) redirectWithError("拒绝或作废付款单必须填写备注。");

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: nextStatus,
        invoiceNumber,
        note: note || invoice.note,
      paidAt: nextStatus === InvoiceStatus.PAID ? new Date() : invoice.paidAt,
      },
    });
    if (nextStatus === InvoiceStatus.PAID && invoice.status !== InvoiceStatus.PAID) {
      const beforeBalance = Number(invoice.brand.budgetBalance);
      const afterPaymentBalance = beforeBalance + Number(invoice.amount);
      await tx.brandProfile.update({
        where: { id: invoice.brandId },
        data: { budgetBalance: { increment: invoice.amount } },
      });
      await tx.brandLedgerTransaction.updateMany({
        where: {
          brandId: invoice.brandId,
          campaignId: invoice.campaignId,
          type: BrandLedgerTxType.PAYMENT,
          status: BrandLedgerTxStatus.PENDING,
        },
        data: { status: BrandLedgerTxStatus.CONFIRMED, note: "Payment confirmed by Admin." },
      });
      await tx.brandLedgerTransaction.create({
        data: {
          brandId: invoice.brandId,
          campaignId: invoice.campaignId,
          type: BrandLedgerTxType.PAYMENT,
          amount: invoice.amount,
          currency: invoice.currency,
          status: BrandLedgerTxStatus.CONFIRMED,
          beforeBalance,
          afterBalance: afterPaymentBalance,
          relatedInvoiceId: invoice.id,
          createdById: session.userId,
          note: "Invoice payment confirmed and credited to merchant balance.",
        },
      });

      if (invoice.campaign && invoice.campaign.status === CampaignStatus.AWAITING_PAYMENT) {
        const requiredEscrow = Math.max(0, Number(invoice.campaign.escrowAmount) - Number(invoice.campaign.escrowFrozenAmount));
        if (requiredEscrow > 0 && afterPaymentBalance >= requiredEscrow) {
          assertCampaignTransition(invoice.campaign.status, CampaignStatus.PENDING_REVIEW);
          await tx.brandProfile.update({
            where: { id: invoice.brandId },
            data: {
              budgetBalance: { decrement: requiredEscrow },
              frozenEscrowBalance: { increment: requiredEscrow },
            },
          });
          await tx.campaign.update({
            where: { id: invoice.campaign.id },
            data: {
              status: CampaignStatus.PENDING_REVIEW,
              escrowFrozenAmount: { increment: requiredEscrow },
            },
          });
          await tx.brandLedgerTransaction.create({
            data: {
              brandId: invoice.brandId,
              campaignId: invoice.campaign.id,
              type: BrandLedgerTxType.ESCROW_FREEZE,
              amount: requiredEscrow,
              currency: invoice.currency,
              status: BrandLedgerTxStatus.CONFIRMED,
              beforeBalance: afterPaymentBalance,
              afterBalance: afterPaymentBalance - requiredEscrow,
              relatedInvoiceId: invoice.id,
              createdById: session.userId,
              note: "Campaign escrow frozen after payment confirmation; campaign activated.",
            },
          });
        }
      }
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: `brand_invoice.${action}`,
        entityType: "invoice",
        entityId: invoice.id,
        beforeJson: { status: invoice.status, budgetBalance: String(invoice.brand.budgetBalance) },
        afterJson: { status: nextStatus, invoiceNumber, note },
      },
    });
    if (nextStatus === InvoiceStatus.PAID) {
      await notifyBrand(tx, {
        brandId: invoice.brandId,
        title: "付款已确认入账",
        body: `${invoice.currency} ${Number(invoice.amount).toFixed(2)} 已确认入账。`,
        href: "/brand/billing?tab=invoices",
      });
    }
    if (nextStatus === InvoiceStatus.REJECTED || nextStatus === InvoiceStatus.VOID) {
      await notifyBrand(tx, {
        brandId: invoice.brandId,
        title: nextStatus === InvoiceStatus.REJECTED ? "付款单已被拒绝" : "付款单已作废",
        body: note || "请查看账单详情并按平台要求重新处理。",
        href: "/brand/billing?tab=invoices",
      });
    }
  });
  revalidatePath("/admin/payments");
  revalidatePath(`/brand/billing`);
  if (invoice.campaignId) revalidatePath(`/admin/campaigns/${invoice.campaignId}`);
  revalidatePath("/admin/campaigns");
  redirect(fallbackPath);
}

export async function refreshInvoicePaymentStatusAction(invoiceId: string, formData: FormData) {
  const session = await requireRole([UserRole.ADMIN, UserRole.BRAND]);
  if (session.role === UserRole.ADMIN) {
    await requireAdminPermission("payment.view");
  }
  const returnTo = text(formData.get("returnTo"));
  const fallbackPath =
    returnTo.startsWith("/admin/") || returnTo.startsWith("/brand/")
      ? returnTo
      : session.role === UserRole.ADMIN
        ? "/admin/payments"
        : "/brand/billing?tab=invoices";
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      ...(session.role === UserRole.BRAND ? { brand: { userId: session.userId } } : {}),
    },
    include: { brand: true },
  });
  if (!invoice) redirect(fallbackPath);
  if (!invoice.paymentReference) redirect(`${fallbackPath}?error=${encodeURIComponent("该付款单没有渠道订单号，无法查询。")}`);
  if (invoice.status === InvoiceStatus.PAID) redirect(fallbackPath);

  try {
    if (invoice.paymentReference.startsWith("ALIPAY-")) {
      const event = await beginPaymentProviderEvent({
        provider: "alipay",
        eventType: "payment_query",
        eventKey: paymentEventKey("query", invoice.paymentReference, Date.now()),
        entityType: "invoice",
        entityId: invoice.id,
        requestJson: { paymentReference: invoice.paymentReference },
      });
      const result = await queryAlipayTrade(invoice.paymentReference);
      const paid = result.tradeStatus === "TRADE_SUCCESS" || result.tradeStatus === "TRADE_FINISHED";
      if (paid && result.tradeNo && result.totalAmount) {
        await confirmInvoicePaidByProvider({
          invoiceId: invoice.id,
          paymentReference: invoice.paymentReference,
          provider: "Alipay",
          providerTradeNo: result.tradeNo,
          totalAmount: result.totalAmount,
          rawNotify: result.raw as Prisma.InputJsonValue,
        });
      }
      await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: result.raw as Prisma.InputJsonValue });
      await audit({
        action: "alipay.invoice_status_queried",
        entityType: "invoice",
        entityId: invoice.id,
        afterJson: { tradeStatus: result.tradeStatus, tradeNo: result.tradeNo, paid },
      });
    } else if (invoice.paymentReference.startsWith("WECHAT-")) {
      const event = await beginPaymentProviderEvent({
        provider: "wechat_pay",
        eventType: "payment_query",
        eventKey: paymentEventKey("query", invoice.paymentReference, Date.now()),
        entityType: "invoice",
        entityId: invoice.id,
        requestJson: { paymentReference: invoice.paymentReference },
      });
      const result = await queryWechatTrade(invoice.paymentReference);
      const paid = result.tradeState === "SUCCESS";
      if (paid && result.transactionId && result.totalAmount) {
        await confirmInvoicePaidByProvider({
          invoiceId: invoice.id,
          paymentReference: invoice.paymentReference,
          provider: "WeChat Pay",
          providerTradeNo: result.transactionId,
          totalAmount: result.totalAmount,
          rawNotify: result.raw as Prisma.InputJsonValue,
        });
      }
      await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: result.raw as Prisma.InputJsonValue });
      await audit({
        action: "wechat_pay.invoice_status_queried",
        entityType: "invoice",
        entityId: invoice.id,
        afterJson: { tradeState: result.tradeState, transactionId: result.transactionId, paid },
      });
    } else {
      redirect(`${fallbackPath}?error=${encodeURIComponent("该付款单不是支付宝或微信支付订单。")}`);
    }
  } catch (error) {
    const provider = invoice.paymentReference.startsWith("ALIPAY-") ? "alipay" : invoice.paymentReference.startsWith("WECHAT-") ? "wechat_pay" : "unknown";
    const failureEvent = await beginPaymentProviderEvent({
      provider,
      eventType: "payment_query",
      eventKey: paymentEventKey("query_failed", invoice.paymentReference, Date.now()),
      entityType: "invoice",
      entityId: invoice.id,
      requestJson: { paymentReference: invoice.paymentReference },
    });
    await completePaymentProviderEvent({
      id: failureEvent.event.id,
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "unknown_error",
    });
    await prisma.$transaction(async (tx) => {
      await notifyPaymentAdmins(tx, {
        brandId: invoice.brandId,
        title: "支付查单失败",
        body: `${invoice.paymentReference} 查单失败：${error instanceof Error ? error.message : "unknown_error"}`,
        href: "/admin/payments",
      });
    });
    await audit({
      action: "invoice.payment_status_query_failed",
      entityType: "invoice",
      entityId: invoice.id,
      afterJson: { paymentReference: invoice.paymentReference, error: error instanceof Error ? error.message : "unknown_error" },
    });
    redirect(`${fallbackPath}?error=${encodeURIComponent(error instanceof Error ? error.message : "支付状态查询失败")}`);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/brand/billing");
  redirect(fallbackPath);
}

export async function resolvePaymentProviderEventAction(eventId: string, formData: FormData) {
  const session = await requireAdminPermission("payment.view");
  const returnTo = text(formData.get("returnTo"));
  const note = text(formData.get("note")) || "Admin marked this payment provider event as reviewed.";
  const fallbackPath = returnTo.startsWith("/admin/") ? returnTo : "/admin/payments";
  const event = await prisma.paymentProviderEvent.findUnique({ where: { id: eventId } });
  if (!event) redirect(fallbackPath);
  if (event.status !== "FAILED" && event.status !== "PENDING") redirect(fallbackPath);

  await prisma.$transaction(async (tx) => {
    await tx.paymentProviderEvent.update({
      where: { id: event.id },
      data: {
        status: "IGNORED",
        errorMessage: event.errorMessage ? `${event.errorMessage}\nReviewed: ${note}` : `Reviewed: ${note}`,
        processedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "payment_provider_event.reviewed",
        entityType: "payment_provider_event",
        entityId: event.id,
        beforeJson: { status: event.status, errorMessage: event.errorMessage },
        afterJson: { status: "IGNORED", note },
      },
    });
  });

  revalidatePath("/admin/payments");
  redirect(fallbackPath);
}

export async function requestBrandRefundAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const brand = await prisma.brandProfile.findUnique({ where: { userId: session.userId } });
  if (!brand) redirect("/brand/billing");
  const parsed = brandRefundSchema.safeParse({
    amount: text(formData.get("amount")),
    payoutMethod: text(formData.get("payoutMethod")),
    payoutDetails: text(formData.get("payoutDetails")),
    relatedInvoiceId: text(formData.get("relatedInvoiceId")),
  });
  if (!parsed.success) redirect("/brand/billing?error=Invalid%20refund%20request");
  if (parsed.data.amount > Number(brand.budgetBalance)) redirect("/brand/billing?error=Refund%20amount%20exceeds%20available%20balance");

  const relatedInvoice = parsed.data.relatedInvoiceId
    ? await prisma.invoice.findFirst({
        where: { id: parsed.data.relatedInvoiceId, brandId: brand.id, status: InvoiceStatus.PAID },
        include: { refundRequests: { where: { status: { not: BrandRefundStatus.REJECTED } } } },
      })
    : null;
  if (parsed.data.relatedInvoiceId && !relatedInvoice) redirect("/brand/billing?error=请选择已支付的原付款单");
  const provider = providerFromPaymentReference(relatedInvoice?.paymentReference);
  if (relatedInvoice && !provider) redirect("/brand/billing?error=该付款单不是支付宝或微信支付订单，无法原渠道退款");
  if (relatedInvoice) {
    const pendingRefunded = relatedInvoice.refundRequests.reduce((sum, item) => sum + Number(item.amount), 0);
    if (pendingRefunded + parsed.data.amount > Number(relatedInvoice.amount)) {
      redirect("/brand/billing?error=退款金额超过原付款单剩余可退金额");
    }
  }

  await prisma.$transaction(async (tx) => {
    const request = await tx.brandRefundRequest.create({
      data: {
        brandId: brand.id,
        relatedInvoiceId: relatedInvoice?.id,
        amount: parsed.data.amount,
        currency: "CNY",
        payoutMethod: parsed.data.payoutMethod,
        payoutDetails: { value: parsed.data.payoutDetails },
        provider,
        isDemo: brand.isDemo,
      },
    });
    await tx.brandLedgerTransaction.create({
      data: {
        brandId: brand.id,
        type: BrandLedgerTxType.REFUND,
        amount: parsed.data.amount,
        currency: "CNY",
        status: BrandLedgerTxStatus.PENDING,
        beforeBalance: brand.budgetBalance,
        afterBalance: brand.budgetBalance,
        relatedRefundId: request.id,
        createdById: session.userId,
        note: "Merchant requested manual balance refund.",
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "brand_refund.requested",
        entityType: "brand_refund_request",
        entityId: request.id,
        afterJson: { amount: parsed.data.amount, currency: "CNY" },
      },
    });
    await notifyPaymentAdmins(tx, {
      brandId: brand.id,
      title: "品牌提交了退款申请",
      body: `${brand.brandName} 申请退款 CNY ${Number(parsed.data.amount).toFixed(2)}。`,
      href: "/admin/payments",
    });
  });
  redirect("/brand/billing?refund=1");
}

export async function updateBrandRefundAction(refundId: string, formData: FormData) {
  const session = await requireAdminPermission("payment.view");
  const action = text(formData.get("action"));
  const adminNote = text(formData.get("adminNote"));
  const confirmed = text(formData.get("confirmAction")) === "yes";
  const request = await prisma.brandRefundRequest.findUnique({ where: { id: refundId }, include: { brand: true, relatedInvoice: true } });
  if (!request) redirect("/admin/payments");
  if (request.status === BrandRefundStatus.PAID || request.status === BrandRefundStatus.REJECTED) redirect("/admin/payments");
  if (!confirmed) redirect("/admin/payments?error=资金操作必须先勾选确认。");
  if ((action === "paid" || action === "reject" || action === "channel_refund") && adminNote.length < 3) redirect("/admin/payments?error=退款打款或拒绝必须填写处理备注。");
  if ((action === "approve" || action === "reject") && !hasAdminPermission(session.profile, "payment.refund.review")) redirect("/403");
  if ((action === "paid" || action === "channel_refund" || action === "query_refund") && !hasAdminPermission(session.profile, "payment.refund.execute")) redirect("/403");

  if (action === "channel_refund") {
    if (!request.relatedInvoice?.paymentReference) redirect("/admin/payments?error=该退款申请没有关联可退款的原付款单。");
    const provider = providerFromPaymentReference(request.relatedInvoice.paymentReference);
    if (!provider) redirect("/admin/payments?error=该原付款单不是支付宝或微信支付订单。");
    if (Number(request.amount) > Number(request.brand.budgetBalance)) redirect("/admin/payments?error=退款金额超过品牌当前可用余额。");
    const providerRefundId = request.providerRefundId || `RF-${request.id}`;
    await prisma.brandRefundRequest.update({
      where: { id: refundId },
      data: {
        status: BrandRefundStatus.APPROVED,
        provider,
        providerRefundId,
        providerRefundStatus: request.providerRefundStatus || "PROCESSING",
        adminNote,
      },
    });
    const event = await beginPaymentProviderEvent({
      provider,
      eventType: "refund_request",
      eventKey: paymentEventKey("refund", providerRefundId),
      entityType: "brand_refund_request",
      entityId: refundId,
      requestJson: {
        providerRefundId,
        outTradeNo: request.relatedInvoice.paymentReference,
        amount: String(request.amount),
        originalAmount: String(request.relatedInvoice.amount),
      },
    });
    if (event.duplicate && event.event.status === "SUCCESS") {
      revalidatePath("/admin/payments");
      revalidatePath("/brand/billing");
      return;
    }
    try {
      if (provider === "alipay") {
        const result = await refundAlipayTrade({
          outTradeNo: request.relatedInvoice.paymentReference,
          outRequestNo: providerRefundId,
          refundAmount: decimalAmount(request.amount),
          refundReason: adminNote,
        });
        await markBrandRefundPaid({
          refundId,
          actorUserId: session.userId,
          actorRole: session.role,
          adminNote,
          provider,
          providerRefundStatus: result.refundStatus || "SUCCESS",
          providerRefundRaw: result.raw as Prisma.InputJsonValue,
        });
        await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: result.raw as Prisma.InputJsonValue });
      } else {
        const result = await refundWechatTrade({
          outTradeNo: request.relatedInvoice.paymentReference,
          outRefundNo: providerRefundId,
          amountFen: amountFen(request.amount),
          originalAmountFen: amountFen(request.relatedInvoice.amount),
          reason: adminNote,
        });
        if (result.status === "SUCCESS") {
          await markBrandRefundPaid({
            refundId,
            actorUserId: session.userId,
            actorRole: session.role,
            adminNote,
            provider,
            providerRefundStatus: result.status,
            providerRefundRaw: result.raw as Prisma.InputJsonValue,
          });
          await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: result.raw as Prisma.InputJsonValue });
        } else {
          await prisma.brandRefundRequest.update({
            where: { id: refundId },
            data: { providerRefundStatus: result.status || "PROCESSING", providerRefundRaw: result.raw as Prisma.InputJsonValue },
          });
          await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: result.raw as Prisma.InputJsonValue });
        }
      }
      await audit({
        action: `${provider}.refund_requested`,
        entityType: "brand_refund_request",
        entityId: refundId,
        afterJson: { providerRefundId, amount: String(request.amount) },
      });
    } catch (error) {
      await prisma.brandRefundRequest.update({
        where: { id: refundId },
        data: { providerRefundStatus: "FAILED" },
      });
      await prisma.$transaction(async (tx) => {
        await notifyBrand(tx, {
          brandId: request.brandId,
          title: "退款处理失败",
          body: `${request.currency} ${Number(request.amount).toFixed(2)} 退款处理失败，平台将继续复核。`,
          href: "/brand/billing?tab=refunds",
        });
        await notifyPaymentAdmins(tx, {
          brandId: request.brandId,
          title: "渠道退款失败",
          body: `${request.brand.brandName} 的退款 ${providerRefundId} 失败：${error instanceof Error ? error.message : "unknown_error"}`,
          href: "/admin/payments",
        });
      });
      await completePaymentProviderEvent({
        id: event.event.id,
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "unknown_error",
      });
      await audit({
        action: `${provider}.refund_failed`,
        entityType: "brand_refund_request",
        entityId: refundId,
        afterJson: { providerRefundId, error: error instanceof Error ? error.message : "unknown_error" },
      });
      redirect(`/admin/payments?error=${encodeURIComponent(error instanceof Error ? error.message : "渠道退款失败")}`);
    }
    revalidatePath("/admin/payments");
    revalidatePath("/brand/billing");
    return;
  }

  if (action === "query_refund") {
    if (!request.provider || !request.providerRefundId || !request.relatedInvoice?.paymentReference) redirect("/admin/payments?error=该退款申请没有渠道退款单号。");
    const event = await beginPaymentProviderEvent({
      provider: request.provider,
      eventType: "refund_query",
      eventKey: paymentEventKey("refund_query", request.providerRefundId, Date.now()),
      entityType: "brand_refund_request",
      entityId: refundId,
      requestJson: { providerRefundId: request.providerRefundId, paymentReference: request.relatedInvoice.paymentReference },
    });
    try {
      if (request.provider === "alipay") {
        const result = await queryAlipayRefund(request.relatedInvoice.paymentReference, request.providerRefundId);
        await markBrandRefundPaid({
          refundId,
          actorUserId: session.userId,
          actorRole: session.role,
          adminNote: adminNote || request.adminNote || "Alipay refund status confirmed.",
          provider: request.provider,
          providerRefundStatus: result.refundStatus || "SUCCESS",
          providerRefundRaw: result.raw as Prisma.InputJsonValue,
        });
        await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: result.raw as Prisma.InputJsonValue });
      } else if (request.provider === "wechat_pay") {
        const result = await queryWechatRefund(request.providerRefundId);
        if (result.status === "SUCCESS") {
          await markBrandRefundPaid({
            refundId,
            actorUserId: session.userId,
            actorRole: session.role,
            adminNote: adminNote || request.adminNote || "WeChat Pay refund status confirmed.",
            provider: request.provider,
            providerRefundStatus: result.status,
            providerRefundRaw: result.raw as Prisma.InputJsonValue,
          });
        } else {
          await prisma.brandRefundRequest.update({
            where: { id: refundId },
            data: { providerRefundStatus: result.status || "PROCESSING", providerRefundRaw: result.raw as Prisma.InputJsonValue },
          });
        }
        await completePaymentProviderEvent({ id: event.event.id, status: "SUCCESS", responseJson: result.raw as Prisma.InputJsonValue });
      }
      await audit({
        action: `${request.provider}.refund_status_queried`,
        entityType: "brand_refund_request",
        entityId: refundId,
        afterJson: { providerRefundId: request.providerRefundId },
      });
    } catch (error) {
      await completePaymentProviderEvent({
        id: event.event.id,
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "unknown_error",
      });
      await prisma.$transaction(async (tx) => {
        await notifyPaymentAdmins(tx, {
          brandId: request.brandId,
          title: "退款状态查询失败",
          body: `${request.providerRefundId} 查询失败：${error instanceof Error ? error.message : "unknown_error"}`,
          href: "/admin/payments",
        });
      });
      await audit({
        action: "brand_refund.provider_query_failed",
        entityType: "brand_refund_request",
        entityId: refundId,
        afterJson: { provider: request.provider, providerRefundId: request.providerRefundId, error: error instanceof Error ? error.message : "unknown_error" },
      });
      redirect(`/admin/payments?error=${encodeURIComponent(error instanceof Error ? error.message : "退款状态查询失败")}`);
    }
    revalidatePath("/admin/payments");
    revalidatePath("/brand/billing");
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (action === "approve") {
      await tx.brandRefundRequest.update({
        where: { id: refundId },
        data: { status: BrandRefundStatus.APPROVED, adminNote },
      });
      await notifyBrand(tx, {
        brandId: request.brandId,
        title: "退款申请已通过",
        body: `${request.currency} ${Number(request.amount).toFixed(2)} 退款申请已通过，等待平台处理。`,
        href: "/brand/billing?tab=refunds",
      });
    }
    if (action === "paid") {
      if (Number(request.amount) > Number(request.brand.budgetBalance)) redirect("/admin/payments?error=退款金额超过品牌当前可用余额。");
    }
    if (action === "reject") {
      await tx.brandRefundRequest.update({
        where: { id: refundId },
        data: { status: BrandRefundStatus.REJECTED, adminNote },
      });
      await tx.brandLedgerTransaction.updateMany({
        where: { relatedRefundId: refundId, type: BrandLedgerTxType.REFUND },
        data: { status: BrandLedgerTxStatus.REJECTED, note: adminNote || "Merchant refund rejected." },
      });
      await notifyBrand(tx, {
        brandId: request.brandId,
        title: "退款申请已被拒绝",
        body: adminNote || "退款申请未通过，请查看账单详情。",
        href: "/brand/billing?tab=refunds",
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: `brand_refund.${action}`,
        entityType: "brand_refund_request",
        entityId: refundId,
        beforeJson: { status: request.status, budgetBalance: String(request.brand.budgetBalance) },
        afterJson: { action, adminNote },
      },
    });
  });
  if (action === "paid") {
    await markBrandRefundPaid({
      refundId,
      actorUserId: session.userId,
      actorRole: session.role,
      adminNote,
      providerRefundStatus: request.providerRefundStatus ?? undefined,
    });
  }
  revalidatePath("/admin/payments");
  revalidatePath("/brand/billing");
}

export async function adminCampaignAction(campaignId: string, formData: FormData) {
  const session = await requireAdminPermission("campaign.manage");
  const action = text(formData.get("action"));
  const reviewNote = text(formData.get("reviewNote"));
  const before = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: true,
      tasks: { include: { applications: true } },
      submissions: true,
    },
  });
  if (!before) redirect("/admin/campaigns");
  if ((action === "reject" || action === "cancel") && reviewNote.length < 3) {
    redirect(`/admin/campaigns/${campaignId}?error=${encodeURIComponent("拒绝或取消 Campaign 必须填写原因。")}`);
  }
  const fundingReady = Number(before.escrowFrozenAmount) >= Number(before.escrowAmount);
  if (action === "approve" && !fundingReady) {
    redirect(`/admin/campaigns/${campaignId}?error=${encodeURIComponent("请先确认资金到账并完成托管，再审核通过推广内容。")}`);
  }
  if (action === "approve" && before.status !== CampaignStatus.PENDING_REVIEW) {
    redirect(`/admin/campaigns/${campaignId}?error=${encodeURIComponent("只有资金已确认且待审核的 Campaign 可以通过内容审核。")}`);
  }

  const statusMap: Record<string, CampaignStatus> = {
    approve: CampaignStatus.ACTIVE,
    reject: CampaignStatus.REJECTED,
    pause: CampaignStatus.PAUSED,
    resume: CampaignStatus.ACTIVE,
    complete: CampaignStatus.COMPLETED,
    cancel: CampaignStatus.CANCELLED,
    archive: CampaignStatus.ARCHIVED,
  };
  const nextStatus = statusMap[action];
  if (!nextStatus) redirect(`/admin/campaigns/${campaignId}`);
  try {
    assertCampaignTransition(before.status, nextStatus);
  } catch (error) {
    redirect(`/admin/campaigns/${campaignId}?error=${encodeURIComponent(error instanceof Error ? error.message : "Campaign 状态不允许这样流转。")}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({ where: { id: campaignId }, data: { status: nextStatus, reviewNote } });
    if (action === "pause") {
      await tx.campaignTask.updateMany({ where: { campaignId }, data: { status: TaskStatus.PAUSED } });
    }
    if (action === "resume") {
      await tx.campaignTask.updateMany({ where: { campaignId }, data: { status: TaskStatus.ACTIVE } });
    }
    if (action === "complete") {
      await tx.campaignTask.updateMany({ where: { campaignId }, data: { status: TaskStatus.CLOSED } });
    }
    if (action === "cancel") {
      await tx.campaignTask.updateMany({ where: { campaignId }, data: { status: TaskStatus.CLOSED } });
      await tx.taskApplication.updateMany({
        where: {
          task: { campaignId },
          status: ApplicationStatus.APPLIED,
        },
        data: { status: ApplicationStatus.CANCELLED },
      });
    }
    if (action === "complete" || action === "cancel" || action === "archive") {
      await returnCampaignUnusedEscrow({
        tx,
        actorUserId: session.userId,
        campaignId,
        note: `Campaign ${action}; unused escrow returned to merchant available balance.`,
      });
    }
    await tx.auditLog.create({
      data: {
        action: "campaign.status_changed",
        entityType: "campaign",
        entityId: campaignId,
        actorUserId: session.userId,
        actorRole: session.role,
        beforeJson: { status: before.status, escrowFrozenAmount: String(before.escrowFrozenAmount) },
        afterJson: { status: nextStatus, reviewNote },
      },
    });
  });
  revalidatePath("/admin/campaigns");
}

export async function createCampaignTaskAction(campaignId: string, formData: FormData) {
  await requireAdminPermission("campaign.manage");
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) redirect("/admin/campaigns");
  await prisma.campaignTask.create({
    data: {
      campaignId,
      title: text(formData.get("title")),
      platform: text(formData.get("platform")),
      contentType: text(formData.get("contentType")),
      rewardAmount: Number(text(formData.get("rewardAmount")) || campaign.baseReward),
      slotsTotal: Number(text(formData.get("slotsTotal")) || 1),
      creatorLevelRequired: text(formData.get("creatorLevelRequired")) as CreatorLevel,
      deadline: new Date(text(formData.get("deadline")) || campaign.endDate),
      status: TaskStatus.ACTIVE,
    },
  });
  await audit({ action: "campaign_task.created", entityType: "campaign", entityId: campaignId });
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function applyTaskAction(taskId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const selectedSocialAccountId = text(formData.get("selectedSocialAccountId"));
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: { user: true, socialAccounts: true },
  });
  const task = await prisma.campaignTask.findUnique({
    where: { id: taskId },
    include: { campaign: { include: { brand: true } } },
  });
  if (!creator || !task) redirect("/creator/marketplace");
  if (creator.user.status === UserStatus.FROZEN || creator.reviewStatus === ReviewStatus.FROZEN) redirect("/403");
  if (!creator.displayName || !creator.country || creator.socialAccounts.length === 0) {
    redirect(`/creator/tasks/${taskId}?error=Complete%20profile%20and%20add%20a%20social%20account%20first`);
  }
  const selectedAccount = creator.socialAccounts.find((account) => account.id === selectedSocialAccountId);
  if (!selectedAccount) {
    redirect(`/creator/tasks/${taskId}?error=${encodeURIComponent("请选择用于发布的社媒账号")}`);
  }
  if (!task.campaign.allowUnverifiedSocialAccounts && selectedAccount.verificationStatus !== SocialVerificationStatus.VERIFIED) {
    redirect(`/creator/tasks/${taskId}?error=${encodeURIComponent("默认只有已验证社媒账号可以申请任务")}`);
  }
  if (selectedAccount.platform !== task.platform) {
    redirect(`/creator/tasks/${taskId}?error=${encodeURIComponent("请选择与任务平台一致的已验证账号")}`);
  }
  if (selectedAccount.followers < task.minimumFollowers) {
    redirect(`/creator/tasks/${taskId}?error=${encodeURIComponent("该账号粉丝数未达到任务最低要求")}`);
  }
  if (!hasCreatorLevel(creator.level, task.creatorLevelRequired)) {
    redirect(`/creator/tasks/${taskId}?error=Creator%20level%20does%20not%20match`);
  }
  if (task.campaign.isDemo || task.campaign.status !== CampaignStatus.ACTIVE || task.status !== TaskStatus.ACTIVE) {
    redirect(`/creator/tasks/${taskId}?error=Task%20is%20not%20open`);
  }
  if (task.slotsTaken >= task.slotsTotal) redirect(`/creator/tasks/${taskId}?error=Task%20is%20full`);

  const existing = await prisma.taskApplication.findUnique({
    where: { taskId_creatorId: { taskId, creatorId: creator.id } },
  });
  if (existing) redirect(`/creator/my-tasks/${existing.id}`);
  const existingCampaignApplication = await prisma.taskApplication.findFirst({
    where: {
      creatorId: creator.id,
      task: { campaignId: task.campaignId },
      status: { in: [ApplicationStatus.APPLIED, ApplicationStatus.APPROVED] },
    },
  });
  if (existingCampaignApplication) {
    redirect(`/creator/tasks/${taskId}?error=${encodeURIComponent("V1 默认同一 Campaign 每个 KOL 只能申请一个任务")}`);
  }

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.taskApplication.create({
      data: {
        taskId,
        creatorId: creator.id,
        selectedSocialAccountId: selectedAccount.id,
        status: ApplicationStatus.APPLIED,
        applicationNote: text(formData.get("applicationNote")) || "创作者已确认任务规则，等待品牌或平台审核。",
        acceptedRequirementSnapshot: {
          campaignId: task.campaignId,
          taskId: task.id,
          platform: task.platform,
          contentType: task.contentType,
          rewardAmount: String(task.rewardAmount),
          minimumFollowers: task.minimumFollowers,
          publishDeadline: task.publishDeadline?.toISOString() ?? task.deadline.toISOString(),
          selectedSocialAccountId: selectedAccount.id,
          selectedSocialAccountUrl: selectedAccount.accountUrl,
        },
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "task.applied",
        entityType: "task",
        entityId: taskId,
        afterJson: { applicationId: app.id, selectedSocialAccountId: selectedAccount.id },
      },
    });
    await tx.notification.create({
      data: {
        userId: task.campaign.brand.userId,
        title: "有新的 KOL 申请待审核",
        body: `${creator.displayName} 申请了 ${task.title}，请尽快处理。`,
        href: `/brand/campaigns/${task.campaignId}?tab=applications`,
      },
    });
    return app;
  });
  await dispatchExternalNotification({
    userId: task.campaign.brand.userId,
    role: "BRAND",
    event: "task_application.submitted",
    channel: "workflow",
    title: "有新的 KOL 申请待审核",
    body: `${creator.displayName} 申请了 ${task.title}。`,
    href: `/brand/campaigns/${task.campaignId}?tab=applications`,
  });
  redirect(`/creator/my-tasks/${application.id}?applied=1`);
}

export async function reviewTaskApplicationAction(applicationId: string, formData: FormData) {
  const session = await requireRole([UserRole.ADMIN, UserRole.BRAND]);
  if (session.role === UserRole.ADMIN) {
    await requireAdminPermission("campaign.manage");
  }
  const decision = text(formData.get("decision")) as ApplicationStatus;
  const note = text(formData.get("note"));
  const allowedDecisions: ApplicationStatus[] = [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.CANCELLED];
  if (!allowedDecisions.includes(decision)) {
    redirect(session.role === UserRole.ADMIN ? "/admin/campaigns" : "/brand/campaigns");
  }

  const application = await prisma.taskApplication.findUnique({
    where: { id: applicationId },
    include: {
      creator: { include: { user: true } },
      task: { include: { campaign: { include: { brand: true } } } },
    },
  });
  if (!application) redirect(session.role === UserRole.ADMIN ? "/admin/campaigns" : "/brand/campaigns");
  if (session.role === UserRole.BRAND && application.task.campaign.brand.userId !== session.userId) redirect("/403");
  if (decision === ApplicationStatus.APPROVED && application.status !== ApplicationStatus.APPROVED && application.task.slotsTaken >= application.task.slotsTotal) {
    redirect(session.role === UserRole.ADMIN ? `/admin/campaigns/${application.task.campaignId}?error=Task%20slots%20full` : `/brand/campaigns/${application.task.campaignId}?error=Task%20slots%20full`);
  }
  assertApplicationTransition(application.status, decision);

  await prisma.$transaction(async (tx) => {
    await tx.taskApplication.update({
      where: { id: applicationId },
      data: {
        status: decision,
        approvedAt: decision === ApplicationStatus.APPROVED ? application.approvedAt ?? new Date() : null,
        applicationNote: note || application.applicationNote,
      },
    });
    if (decision === ApplicationStatus.APPROVED && application.status !== ApplicationStatus.APPROVED) {
      await tx.campaignTask.update({ where: { id: application.taskId }, data: { slotsTaken: { increment: 1 } } });
    }
    if (decision !== ApplicationStatus.APPROVED && application.status === ApplicationStatus.APPROVED) {
      await tx.campaignTask.update({ where: { id: application.taskId }, data: { slotsTaken: { decrement: 1 } } });
    }
    await tx.notification.create({
      data: {
        userId: application.creator.userId,
        title: `任务申请结果：${decision}`,
        body: note || `你的 ${application.task.title} 申请已更新。`,
        href: `/creator/my-tasks/${applicationId}`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "task_application.reviewed",
        entityType: "task_application",
        entityId: applicationId,
        beforeJson: { status: application.status },
        afterJson: { status: decision, note },
      },
    });
  });
  await dispatchExternalNotification({
    userId: application.creator.userId,
    role: "CREATOR",
    event: "task_application.reviewed",
    channel: "workflow",
    title: `任务申请结果：${decision}`,
    body: note || `你的 ${application.task.title} 申请已更新。`,
    href: `/creator/my-tasks/${applicationId}`,
  });
  revalidatePath(`/admin/campaigns/${application.task.campaignId}`);
  revalidatePath(`/brand/campaigns/${application.task.campaignId}`);
}

export async function batchReviewTaskApplicationsAction(campaignId: string, formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const decision = text(formData.get("decision")) as ApplicationStatus;
  const note = text(formData.get("note")) || (decision === ApplicationStatus.APPROVED ? "商家批量通过申请。" : "商家批量拒绝申请。");
  const applicationIds = formData.getAll("applicationIds").map((value) => text(value)).filter(Boolean);
  if (!applicationIds.length) redirect(`/brand/campaigns/${campaignId}?error=${encodeURIComponent("请先勾选需要处理的申请")}`);
  if (decision !== ApplicationStatus.APPROVED && decision !== ApplicationStatus.REJECTED) {
    redirect(`/brand/campaigns/${campaignId}?error=${encodeURIComponent("批量审核决策无效")}`);
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, brand: { userId: session.userId } },
    include: {
      tasks: {
        include: {
          applications: {
            where: { id: { in: applicationIds } },
            include: { creator: { include: { user: true } } },
          },
        },
      },
    },
  });
  if (!campaign) redirect("/brand/campaigns");

  const applications = campaign.tasks.flatMap((task) => task.applications.map((application) => ({ ...application, task })));
  const actionable = applications.filter((application) => application.status === ApplicationStatus.APPLIED);
  if (!actionable.length) redirect(`/brand/campaigns/${campaignId}?error=${encodeURIComponent("选中的申请没有可处理项")}`);

  if (decision === ApplicationStatus.APPROVED) {
    for (const task of campaign.tasks) {
      const approvals = actionable.filter((application) => application.taskId === task.id).length;
      const remaining = task.slotsTotal - task.slotsTaken;
      if (approvals > remaining) {
        redirect(`/brand/campaigns/${campaignId}?error=${encodeURIComponent(`${task.title} 剩余名额不足，无法批量通过`)}`);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const application of actionable) {
      assertApplicationTransition(application.status, decision);
      await tx.taskApplication.update({
        where: { id: application.id },
        data: {
          status: decision,
          approvedAt: decision === ApplicationStatus.APPROVED ? new Date() : null,
          applicationNote: note,
        },
      });
      await tx.notification.create({
        data: {
          userId: application.creator.userId,
          title: `任务申请结果：${decision}`,
          body: note,
          href: `/creator/my-tasks/${application.id}`,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          actorRole: session.role,
          action: "task_application.batch_reviewed",
          entityType: "task_application",
          entityId: application.id,
          beforeJson: { status: application.status },
          afterJson: { status: decision, note, campaignId },
        },
      });
    }
    if (decision === ApplicationStatus.APPROVED) {
      const counts = new Map<string, number>();
      for (const application of actionable) counts.set(application.taskId, (counts.get(application.taskId) ?? 0) + 1);
      for (const [taskId, count] of counts) {
        await tx.campaignTask.update({ where: { id: taskId }, data: { slotsTaken: { increment: count } } });
      }
    }
  });
  await Promise.all(
    actionable.map((application) =>
      dispatchExternalNotification({
        userId: application.creator.userId,
        role: "CREATOR",
        event: "task_application.batch_reviewed",
        channel: "workflow",
        title: `任务申请结果：${decision}`,
        body: note,
        href: `/creator/my-tasks/${application.id}`,
      }),
    ),
  );

  revalidatePath(`/brand/campaigns/${campaignId}`);
  redirect(`/brand/campaigns/${campaignId}?batch=${actionable.length}`);
}

async function getOwnedApplication(applicationId: string, userId: string) {
  return prisma.taskApplication.findFirst({
    where: { id: applicationId, creator: { userId } },
    include: {
      creator: { include: { user: true } },
      task: { include: { campaign: true } },
      drafts: { orderBy: { createdAt: "desc" }, take: 1 },
      submissions: { orderBy: { createdAt: "desc" }, take: 1, include: { draft: true, proofs: true, reviews: { orderBy: { createdAt: "desc" } } } },
    },
  });
}

function draftRedirect(applicationId: string, message: string) {
  redirect(`/creator/content-studio/${applicationId}?error=${encodeURIComponent(message)}`);
}

export async function saveDraftAction(applicationId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const [application, settings] = await Promise.all([
    getOwnedApplication(applicationId, session.userId),
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
  ]);
  if (!application || application.status !== ApplicationStatus.APPROVED) redirect("/creator/my-tasks");
  const previewFile = formData.get("previewAttachment");
  if (previewFile instanceof File && previewFile.size > settings.kolPreviewMaxMb * 1024 * 1024) {
    draftRedirect(applicationId, `预览附件不能超过 ${settings.kolPreviewMaxMb}MB。`);
  }
  const previewAttachmentUrl = previewFile instanceof File && previewFile.size > 0
    ? await saveUploadedFile(previewFile, "draft-previews")
    : text(formData.get("previewAttachmentUrl")) || null;
  const risk = await checkSensitiveText([
    text(formData.get("title")),
    text(formData.get("script")),
    text(formData.get("caption")),
    text(formData.get("coverText")),
    text(formData.get("disclosurePosition")),
  ]);
  const draft = await prisma.contentDraft.create({
    data: {
      applicationId,
      creatorId: application.creatorId,
      campaignId: application.task.campaignId,
      platform: application.task.platform,
      title: text(formData.get("title")),
      script: text(formData.get("script")),
      caption: text(formData.get("caption")),
      hashtags: csv(formData.get("hashtags")),
      coverText: text(formData.get("coverText")),
      disclosurePosition: text(formData.get("disclosurePosition")) || null,
      previewAttachmentUrl,
      aiGeneratedRaw: { provider: text(formData.get("provider")) || "manual" },
      creatorEditedText: text(formData.get("script")),
      riskCheckResult: risk,
      status: risk.blocked ? DraftStatus.BLOCKED : DraftStatus.DRAFT,
      reviewStatus: application.task.campaign.requiresDraftReview ? DraftReviewStatus.NOT_SUBMITTED : DraftReviewStatus.NOT_REQUIRED,
    },
  });
  await audit({ action: "content_draft.saved", entityType: "content_draft", entityId: draft.id, afterJson: { risk } });
  redirect(`/creator/content-studio/${applicationId}?saved=1`);
}

export async function submitContentAction(applicationId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const [application, settings] = await Promise.all([
    getOwnedApplication(applicationId, session.userId),
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
  ]);
  if (!application || application.status !== ApplicationStatus.APPROVED) redirect("/creator/my-tasks");

  const latestSubmission = application.submissions[0];
  if (latestSubmission?.status === SubmissionStatus.SUBMITTED) draftRedirect(applicationId, "上一版草稿仍在审核中，请等待商家处理。");
  if (latestSubmission?.status === SubmissionStatus.APPROVED) draftRedirect(applicationId, "草稿已通过，可以进入发布阶段。");
  if (latestSubmission?.status === SubmissionStatus.REJECTED) draftRedirect(applicationId, "草稿已被拒绝，该任务需要平台或商家进一步处理。");

  const revisionRound = latestSubmission?.status === SubmissionStatus.REVISION_REQUESTED ? latestSubmission.draft.revisionRound + 1 : 0;
  if (revisionRound > application.task.campaign.revisionLimit) draftRedirect(applicationId, `已达到最多 ${application.task.campaign.revisionLimit} 轮修改限制。`);

  const disclosurePosition = text(formData.get("disclosurePosition"));
  if (application.task.campaign.disclosureRequired && disclosurePosition.length < 2) {
    draftRedirect(applicationId, "请填写广告披露出现的位置和方式。");
  }

  const previewFile = formData.get("previewAttachment");
  if (previewFile instanceof File && previewFile.size > settings.kolPreviewMaxMb * 1024 * 1024) {
    draftRedirect(applicationId, `预览附件不能超过 ${settings.kolPreviewMaxMb}MB。`);
  }
  const previewAttachmentUrl = previewFile instanceof File && previewFile.size > 0
    ? await saveUploadedFile(previewFile, "draft-previews")
    : text(formData.get("previewAttachmentUrl")) || null;

  const risk = await checkSensitiveText([
    text(formData.get("title")),
    text(formData.get("script")),
    text(formData.get("caption")),
    text(formData.get("coverText")),
    disclosurePosition,
  ]);
  if (risk.blocked) {
    const draft = await prisma.contentDraft.create({
      data: {
        applicationId,
        creatorId: application.creatorId,
        campaignId: application.task.campaignId,
        platform: application.task.platform,
        title: text(formData.get("title")),
        script: text(formData.get("script")),
        caption: text(formData.get("caption")),
        hashtags: csv(formData.get("hashtags")),
        coverText: text(formData.get("coverText")),
        disclosurePosition: disclosurePosition || null,
        previewAttachmentUrl,
        revisionRound,
        riskCheckResult: risk,
        status: DraftStatus.BLOCKED,
        reviewStatus: DraftReviewStatus.REJECTED,
      },
    });
    await audit({ action: "content_draft.blocked", entityType: "content_draft", entityId: draft.id, afterJson: { risk } });
    draftRedirect(applicationId, `命中敏感词：${risk.hits.join(", ")}`);
  }

  const submission = await prisma.$transaction(async (tx) => {
    const requiresReview = application.task.campaign.requiresDraftReview;
    const draft = await tx.contentDraft.create({
      data: {
        applicationId,
        creatorId: application.creatorId,
        campaignId: application.task.campaignId,
        platform: application.task.platform,
        title: text(formData.get("title")),
        script: text(formData.get("script")),
        caption: text(formData.get("caption")),
        hashtags: csv(formData.get("hashtags")),
        coverText: text(formData.get("coverText")),
        disclosurePosition: disclosurePosition || null,
        previewAttachmentUrl,
        revisionRound,
        revisionReason: latestSubmission?.revisionNote ?? null,
        aiGeneratedRaw: { provider: text(formData.get("provider")) || "manual" },
        creatorEditedText: text(formData.get("script")),
        riskCheckResult: risk,
        status: requiresReview ? DraftStatus.SUBMITTED : DraftStatus.APPROVED,
        reviewStatus: requiresReview ? DraftReviewStatus.SUBMITTED : DraftReviewStatus.NOT_REQUIRED,
      },
    });
    const sub = await tx.submission.create({
      data: {
        applicationId,
        draftId: draft.id,
        creatorId: application.creatorId,
        campaignId: application.task.campaignId,
        status: requiresReview ? SubmissionStatus.SUBMITTED : SubmissionStatus.APPROVED,
        publicationStatus: PublicationStatus.PENDING_PUBLICATION,
        approvedAt: requiresReview ? null : new Date(),
      },
    });
    const brand = await tx.brandProfile.findUnique({ where: { id: application.task.campaign.brandId } });
    if (brand) {
      await tx.notification.create({
        data: {
          userId: brand.userId,
          title: requiresReview ? "新内容草稿待审核" : "KOL 已提交免审草稿",
          body: requiresReview
            ? `${application.creator.displayName} 提交了 ${application.task.title} 的内容草稿。`
            : `${application.creator.displayName} 提交了 ${application.task.title} 的内容草稿，当前 Campaign 不需要审稿，已进入发布阶段。`,
          href: `/brand/campaigns/${application.task.campaignId}/submissions`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "submission.created",
        entityType: "submission",
        entityId: sub.id,
        afterJson: { status: sub.status, revisionRound, requiresReview },
      },
    });
    return sub;
  });
  revalidatePath(`/brand/campaigns/${application.task.campaignId}/submissions`);
  revalidatePath(`/creator/my-tasks/${applicationId}`);
  const notifyBrandTarget = await prisma.brandProfile.findUnique({
    where: { id: application.task.campaign.brandId },
    select: { userId: true },
  });
  if (notifyBrandTarget) {
    await dispatchExternalNotification({
      userId: notifyBrandTarget.userId,
      role: "BRAND",
      event: "submission.created",
      channel: "workflow",
      title: application.task.campaign.requiresDraftReview ? "新内容草稿待审核" : "KOL 已提交免审草稿",
      body: `${application.creator.displayName} 提交了 ${application.task.title} 的内容。`,
      href: `/brand/campaigns/${application.task.campaignId}/submissions`,
    });
  }
  redirect(`/creator/my-tasks/${applicationId}?submitted=${submission.id}`);
}
export async function reviewSubmissionAction(submissionId: string, formData: FormData) {
  const session = await requireRole([UserRole.ADMIN, UserRole.BRAND]);
  const decision = text(formData.get("decision")) as ReviewDecision;
  const comment = text(formData.get("comment"));
  const riskPoints = csv(formData.get("riskPoints"));
  if (comment.length < 2) {
    redirect(session.role === UserRole.ADMIN ? `/admin/submissions?error=${encodeURIComponent("请填写审核说明")}` : `/brand?error=${encodeURIComponent("请填写审核说明")}`);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      campaign: { include: { brand: true } },
      creator: { include: { user: true } },
      draft: true,
      application: true,
    },
  });
  if (!submission) redirect("/admin/submissions");
  if (session.role === UserRole.BRAND && submission.campaign.brand.userId !== session.userId) redirect("/403");
  if (submission.status !== SubmissionStatus.SUBMITTED) {
    redirect(session.role === UserRole.ADMIN ? "/admin/submissions" : `/brand/campaigns/${submission.campaignId}/submissions`);
  }
  if (decision === ReviewDecision.REVISION_REQUESTED && submission.draft.revisionRound >= submission.campaign.revisionLimit) {
    redirect(`/brand/campaigns/${submission.campaignId}/submissions?error=${encodeURIComponent("已达到最多修改轮次，请通过或拒绝该草稿。")}`);
  }

  const next =
    decision === ReviewDecision.APPROVED
      ? SubmissionStatus.APPROVED
      : decision === ReviewDecision.REVISION_REQUESTED
        ? SubmissionStatus.REVISION_REQUESTED
        : SubmissionStatus.REJECTED;
  const nextDraftStatus =
    decision === ReviewDecision.APPROVED
      ? DraftStatus.APPROVED
      : decision === ReviewDecision.REVISION_REQUESTED
        ? DraftStatus.REVISION_REQUESTED
        : DraftStatus.REJECTED;
  const nextDraftReviewStatus =
    decision === ReviewDecision.APPROVED
      ? DraftReviewStatus.APPROVED
      : decision === ReviewDecision.REVISION_REQUESTED
        ? DraftReviewStatus.REVISION_REQUESTED
        : DraftReviewStatus.REJECTED;
  assertSubmissionTransition(submission.status, next);
  assertDraftTransition(submission.draft.status, nextDraftStatus);
  assertDraftReviewTransition(submission.draft.reviewStatus, nextDraftReviewStatus);

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: next,
        approvedAt: next === SubmissionStatus.APPROVED ? new Date() : undefined,
        rejectedAt: next === SubmissionStatus.REJECTED ? new Date() : undefined,
        revisionNote: comment,
      },
    });
    await tx.contentDraft.update({
      where: { id: submission.draftId },
      data: {
        status: nextDraftStatus,
        reviewStatus: nextDraftReviewStatus,
        revisionReason: decision === ReviewDecision.REVISION_REQUESTED ? comment : submission.draft.revisionReason,
      },
    });
    await tx.submissionReview.create({
      data: {
        submissionId,
        reviewerId: session.userId,
        reviewerRole: session.role,
        decision,
        comment,
        riskPoints,
      },
    });
    await tx.notification.create({
      data: {
        userId: submission.creator.userId,
        title: `内容草稿审核结果：${next}`,
        body: comment,
        href: `/creator/my-tasks/${submission.applicationId}`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "submission.reviewed",
        entityType: "submission",
        entityId: submissionId,
        beforeJson: { status: submission.status, draftStatus: submission.draft.status },
        afterJson: { status: next, draftStatus: nextDraftStatus, comment, riskPoints },
      },
    });
  });

  revalidatePath(session.role === UserRole.ADMIN ? "/admin/submissions" : `/brand/campaigns/${submission.campaignId}/submissions`);
  revalidatePath(`/creator/my-tasks/${submission.applicationId}`);
  revalidatePath(`/creator/content-studio/${submission.applicationId}`);
  await dispatchExternalNotification({
    userId: submission.creator.userId,
    role: "CREATOR",
    event: "submission.reviewed",
    channel: "workflow",
    title: `内容草稿审核结果：${next}`,
    body: comment,
    href: `/creator/my-tasks/${submission.applicationId}`,
  });
}

const platformPostDomains: Record<string, string[]> = {
  小红书: ["xiaohongshu.com", "xhslink.com"],
  抖音: ["douyin.com", "iesdouyin.com"],
  视频号: ["weixin.qq.com", "channels.weixin.qq.com"],
  B站: ["bilibili.com", "b23.tv"],
  微博: ["weibo.com", "weibo.cn"],
};

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function hostMatches(host: string, domains: string[]) {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function parseHttpUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function isValidPlatformPostUrl(platform: string, rawUrl: string) {
  const url = parseHttpUrl(rawUrl);
  if (!url) return false;
  const allowedDomains = platformPostDomains[platform];
  if (!allowedDomains) return true;
  return hostMatches(normalizeHostname(url.hostname), allowedDomains);
}

const ignoredUrlParams = new Set([
  "from",
  "share_from_user_hidden",
  "share_id",
  "share_sign",
  "share_source",
  "timestamp",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

function normalizePostUrlForDedupe(rawUrl: string) {
  const url = parseHttpUrl(rawUrl);
  if (!url) return rawUrl.trim().toLowerCase();

  url.protocol = "https:";
  url.hostname = normalizeHostname(url.hostname);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.startsWith("utm_") || ignoredUrlParams.has(normalizedKey)) {
      url.searchParams.delete(key);
    }
  }

  const sortedParams = [...url.searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const keyOrder = leftKey.localeCompare(rightKey);
    return keyOrder || leftValue.localeCompare(rightValue);
  });
  url.search = "";
  for (const [key, value] of sortedParams) {
    url.searchParams.append(key, value);
  }

  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString().replace(/\/$/, "").toLowerCase();
}

async function resolvePlatformPostUrl(platform: string, rawUrl: string) {
  const initialUrl = parseHttpUrl(rawUrl);
  const allowedDomains = platformPostDomains[platform] ?? [];
  if (!initialUrl) {
    return {
      ok: false,
      rawUrl,
      normalizedUrl: null,
      resolvedUrl: null,
      rawHost: null,
      resolvedHost: null,
      platform,
      method: "parse",
      error: "URL 格式无效",
    };
  }

  const rawHost = normalizeHostname(initialUrl.hostname);
  const rawHostMatched = allowedDomains.length === 0 || hostMatches(rawHost, allowedDomains);
  if (!rawHostMatched) {
    return {
      ok: false,
      rawUrl,
      normalizedUrl: initialUrl.toString(),
      resolvedUrl: null,
      rawHost,
      resolvedHost: null,
      platform,
      allowedDomains,
      method: "domain",
      error: "提交链接域名与任务平台不匹配",
    };
  }

  let resolvedUrl = initialUrl.toString();
  let resolvedHost = rawHost;
  let method = "domain";
  let reachable = false;
  let status: number | null = null;
  let error: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response = await fetch(initialUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(initialUrl, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
    }
    clearTimeout(timeout);
    status = response.status;
    resolvedUrl = response.url || initialUrl.toString();
    const resolved = parseHttpUrl(resolvedUrl);
    resolvedHost = resolved ? normalizeHostname(resolved.hostname) : rawHost;
    reachable = response.ok || (response.status >= 300 && response.status < 500);
    method = "fetch";
  } catch (fetchError) {
    error = fetchError instanceof Error ? fetchError.message : "无法自动访问链接";
  }

  const resolvedHostMatched = allowedDomains.length === 0 || hostMatches(resolvedHost, allowedDomains);

  return {
    ok: rawHostMatched && resolvedHostMatched,
    rawUrl,
    normalizedUrl: initialUrl.toString(),
    resolvedUrl,
    rawHost,
    resolvedHost,
    platform,
    allowedDomains,
    method,
    reachable,
    status,
    error,
  };
}

function creatorProofRedirect(applicationId: string, message: string) {
  redirect(`/creator/my-tasks/${applicationId}?error=${encodeURIComponent(message)}`);
}

async function recordDuplicateProofAttempt({
  actorUserId,
  actorRole,
  duplicateProofId,
  duplicateCampaignId,
  duplicateCreatorId,
  attemptedSubmissionId,
  submittedUrl,
  normalizedPostUrl,
  platform,
}: {
  actorUserId: string;
  actorRole: UserRole;
  duplicateProofId: string;
  duplicateCampaignId: string;
  duplicateCreatorId: string;
  attemptedSubmissionId: string;
  submittedUrl: string;
  normalizedPostUrl: string;
  platform: string;
}) {
  await prisma.$transaction(async (tx) => {
    const recentDuplicateLog = await tx.auditLog.findFirst({
      where: {
        actorUserId,
        action: "proof.duplicate_blocked",
        entityType: "proof",
        entityId: duplicateProofId,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (!recentDuplicateLog) {
      await tx.riskFlag.create({
        data: {
          entityType: "proof",
          entityId: duplicateProofId,
          level: RiskLevel.MEDIUM,
          reason: `重复作品链接提交被拦截：${platform} / ${normalizedPostUrl}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId,
        actorRole,
        action: "proof.duplicate_blocked",
        entityType: "proof",
        entityId: duplicateProofId,
        afterJson: {
          submittedUrl,
          normalizedPostUrl,
          platform,
          duplicateProofId,
          duplicateCampaignId,
          duplicateCreatorId,
          attemptedSubmissionId,
        },
      },
    });
  });
}

async function recordDuplicatePaymentReferenceAttempt({
  actorUserId,
  actorRole,
  duplicateInvoiceId,
  duplicateBrandId,
  attemptedInvoiceId,
  paymentReference,
}: {
  actorUserId: string;
  actorRole: UserRole;
  duplicateInvoiceId: string;
  duplicateBrandId: string;
  attemptedInvoiceId?: string | null;
  paymentReference: string;
}) {
  await prisma.$transaction(async (tx) => {
    const recentDuplicateLog = await tx.auditLog.findFirst({
      where: {
        actorUserId,
        action: "invoice.payment_reference_duplicate_blocked",
        entityType: "invoice",
        entityId: duplicateInvoiceId,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (!recentDuplicateLog) {
      await tx.riskFlag.create({
        data: {
          entityType: "invoice",
          entityId: duplicateInvoiceId,
          level: RiskLevel.HIGH,
          reason: `重复交易订单号提交被拦截：${paymentReference}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId,
        actorRole,
        action: "invoice.payment_reference_duplicate_blocked",
        entityType: "invoice",
        entityId: duplicateInvoiceId,
        afterJson: {
          paymentReference,
          duplicateInvoiceId,
          duplicateBrandId,
          attemptedInvoiceId: attemptedInvoiceId ?? null,
        },
      },
    });
  });
}

export async function submitProofAction(submissionId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, creator: { userId: session.userId } },
    include: { campaign: { include: { brand: true } }, creator: true, proofs: true, application: { include: { task: true } } },
  });
  if (!submission) redirect("/creator/my-tasks");
  if (submission.status !== SubmissionStatus.APPROVED) creatorProofRedirect(submission.applicationId, "当前任务还不能提交发布链接。");

  const now = new Date();
  const publishDeadline = submission.application.task.publishDeadline ?? submission.application.task.deadline;
  if (now.getTime() > publishDeadline.getTime()) creatorProofRedirect(submission.applicationId, "发布截止时间已过，请等待商家或平台处理。");

  const postUrl = text(formData.get("postUrl"));
  const urlCheck = await resolvePlatformPostUrl(submission.application.task.platform, postUrl);
  if (!urlCheck.ok || !isValidPlatformPostUrl(submission.application.task.platform, postUrl)) {
    creatorProofRedirect(submission.applicationId, "发布链接格式或平台域名不符合任务要求。");
  }
  const normalizedPostUrl = normalizePostUrlForDedupe(urlCheck.resolvedUrl ?? urlCheck.normalizedUrl ?? postUrl);
  const duplicateProof = await prisma.proof.findFirst({
    where: {
      platform: submission.application.task.platform,
      normalizedPostUrl,
    },
    select: { id: true, campaignId: true, creatorId: true },
  });
  if (duplicateProof) {
    await recordDuplicateProofAttempt({
      actorUserId: session.userId,
      actorRole: session.role,
      duplicateProofId: duplicateProof.id,
      duplicateCampaignId: duplicateProof.campaignId,
      duplicateCreatorId: duplicateProof.creatorId,
      attemptedSubmissionId: submissionId,
      submittedUrl: postUrl,
      normalizedPostUrl,
      platform: submission.application.task.platform,
    });
    creatorProofRedirect(submission.applicationId, "该作品链接已经提交过，请更换未使用过的发布链接。");
  }

  if (!submission.campaign.allowMultiPlatformProof) {
    const activeProof = submission.proofs.find((proof) => proof.verificationStatus !== ProofStatus.REJECTED);
    if (activeProof) creatorProofRedirect(submission.applicationId, "已有发布链接正在等待验收或已通过。");
  }
  const previousRejectedCount = submission.proofs.filter((proof) => proof.verificationStatus === ProofStatus.REJECTED).length;
  const nextPublicationStatus = previousRejectedCount > 0 ? PublicationStatus.RESUBMITTED : PublicationStatus.LINK_SUBMITTED;
  assertSubmissionTransition(submission.status, SubmissionStatus.PROOF_SUBMITTED);
  assertPublicationTransition(submission.publicationStatus, nextPublicationStatus);

  const proof = await prisma.$transaction(async (tx) => {
    const created = await tx.proof.create({
      data: {
        submissionId,
        creatorId: submission.creatorId,
        campaignId: submission.campaignId,
        platform: submission.application.task.platform,
        postUrl,
        resolvedPostUrl: urlCheck.resolvedUrl,
        normalizedPostUrl,
        urlCheckResult: urlCheck,
        publishedAt: new Date(text(formData.get("publishedAt")) || Date.now()),
        verificationStatus: ProofStatus.PENDING,
        publicationStatus: nextPublicationStatus,
        resubmissionCount: previousRejectedCount,
      },
    });
    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.PROOF_SUBMITTED,
        publicationStatus: nextPublicationStatus,
      },
    });
    await tx.notification.create({
      data: {
        userId: submission.campaign.brand.userId,
        title: "KOL 已提交发布链接",
        body: `${submission.creator.displayName} 已提交 ${submission.application.task.title} 的发布链接，请在 SLA 内验收。`,
        href: `/brand/campaigns/${submission.campaignId}/proofs`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "proof.link_submitted",
        entityType: "proof",
        entityId: created.id,
        afterJson: { postUrl: created.postUrl, resolvedPostUrl: created.resolvedPostUrl, urlCheck, publicationStatus: created.publicationStatus, resubmissionCount: created.resubmissionCount },
      },
    });
    return created;
  }).catch(async (error: unknown) => {
    if (isUniqueConstraintError(error, ["platform", "normalizedPostUrl"])) {
      const duplicateProof = await prisma.proof.findFirst({
        where: {
          platform: submission.application.task.platform,
          normalizedPostUrl,
        },
        select: { id: true, campaignId: true, creatorId: true },
      });
      if (duplicateProof) {
        await recordDuplicateProofAttempt({
          actorUserId: session.userId,
          actorRole: session.role,
          duplicateProofId: duplicateProof.id,
          duplicateCampaignId: duplicateProof.campaignId,
          duplicateCreatorId: duplicateProof.creatorId,
          attemptedSubmissionId: submissionId,
          submittedUrl: postUrl,
          normalizedPostUrl,
          platform: submission.application.task.platform,
        });
      }
      creatorProofRedirect(submission.applicationId, "该作品链接已经提交过，请更换未使用过的发布链接。");
    }
    throw error;
  });
  const crawlerPlatform = toCrawlerPlatform(proof.platform);
  if (crawlerPlatform) {
    await createCrawlerJob({
      type: CrawlerJobType.FETCH_POST_METRICS,
      platform: crawlerPlatform,
      targetType: CrawlerTargetType.PROOF,
      targetId: proof.id,
      targetUrl: proof.resolvedPostUrl ?? proof.postUrl,
      proofId: proof.id,
      createdByUserId: session.userId,
    });
  }
  revalidatePath(`/brand/campaigns/${submission.campaignId}/proofs`);
  revalidatePath(`/creator/my-tasks/${submission.applicationId}`);
  revalidatePath("/admin/crawler");
  await dispatchExternalNotification({
    userId: submission.campaign.brand.userId,
    role: "BRAND",
    event: "proof.link_submitted",
    channel: "workflow",
    title: "KOL 已提交发布链接",
    body: `${submission.creator.displayName} 已提交 ${submission.application.task.title} 的发布链接，请在 SLA 内验收。`,
    href: `/brand/campaigns/${submission.campaignId}/proofs`,
  });
  redirect(`/creator/my-tasks/${submission.applicationId}?proof=${proof.id}`);
}

export async function reviewPublicationProofAction(proofId: string, formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const decision = text(formData.get("decision"));
  const rejectionReason = text(formData.get("rejectionReason"));
  const rejectionNote = text(formData.get("rejectionNote"));
  const proof = await prisma.proof.findFirst({
    where: { id: proofId, campaign: { brand: { userId: session.userId } } },
    include: {
      campaign: { include: { brand: true } },
      creator: { include: { user: true, wallet: true } },
      submission: { include: { application: { include: { task: true } } } },
    },
  });
  if (!proof) redirect("/brand/campaigns");
  if (proof.verificationStatus !== ProofStatus.PENDING) redirect(`/brand/campaigns/${proof.campaignId}/proofs`);

  if (decision === "reject" && (rejectionReason.length < 2 || rejectionNote.length < 5)) {
    redirect(`/brand/campaigns/${proof.campaignId}/proofs?error=${encodeURIComponent("拒绝验收必须选择结构化原因，并填写文字说明。")}`);
  }

  if (decision === "accept") {
    assertProofTransition(proof.verificationStatus, ProofStatus.VERIFIED);
    assertSubmissionTransition(proof.submission.status, SubmissionStatus.VERIFIED);
    assertPublicationTransition(proof.publicationStatus, PublicationStatus.ACCEPTED);
    assertPublicationTransition(proof.submission.publicationStatus, PublicationStatus.ACCEPTED);
    assertSettlementTransition(proof.submission.settlementStatus, SettlementStatus.PAYABLE);
    await prisma.$transaction(async (tx) => {
      await tx.proof.update({
        where: { id: proofId },
        data: {
          verificationStatus: ProofStatus.VERIFIED,
          publicationStatus: PublicationStatus.ACCEPTED,
          rejectionReason: null,
          rejectionNote: null,
        },
      });
      await tx.submission.update({
        where: { id: proof.submissionId },
        data: {
          status: SubmissionStatus.VERIFIED,
          publicationStatus: PublicationStatus.ACCEPTED,
          settlementStatus: SettlementStatus.PAYABLE,
          settlementAmount: proof.submission.application.task.rewardAmount,
          acceptedAt: new Date(),
        },
      });
      await creditAcceptedSubmissionEarning({
        tx,
        actorUserId: session.userId,
        actorRole: session.role,
        submissionId: proof.submissionId,
        campaignId: proof.campaignId,
        creatorId: proof.creatorId,
        creatorUserId: proof.creator.userId,
        rewardAmount: proof.submission.application.task.rewardAmount,
        note: "商家验收通过后直接入账。",
      });
      await tx.notification.create({
        data: {
          userId: proof.creator.userId,
          title: "发布链接已通过验收",
          body: `${proof.submission.application.task.title} 已验收通过，收益已进入可提现余额。`,
          href: `/creator/my-tasks/${proof.submission.applicationId}`,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          actorRole: session.role,
          action: "proof.brand_accepted",
          entityType: "proof",
          entityId: proofId,
          beforeJson: { verificationStatus: proof.verificationStatus, publicationStatus: proof.publicationStatus },
          afterJson: { verificationStatus: ProofStatus.VERIFIED, publicationStatus: PublicationStatus.ACCEPTED },
        },
      });
    });
  } else {
    assertProofTransition(proof.verificationStatus, ProofStatus.REJECTED);
    assertSubmissionTransition(proof.submission.status, SubmissionStatus.APPROVED);
    assertPublicationTransition(proof.publicationStatus, PublicationStatus.REJECTED);
    assertPublicationTransition(proof.submission.publicationStatus, PublicationStatus.REJECTED);
    await prisma.$transaction(async (tx) => {
      await tx.proof.update({
        where: { id: proofId },
        data: {
          verificationStatus: ProofStatus.REJECTED,
          publicationStatus: PublicationStatus.REJECTED,
          rejectionReason,
          rejectionNote,
        },
      });
      await tx.submission.update({
        where: { id: proof.submissionId },
        data: {
          status: SubmissionStatus.APPROVED,
          publicationStatus: PublicationStatus.REJECTED,
          revisionNote: `${rejectionReason}: ${rejectionNote}`,
        },
      });
      await tx.notification.create({
        data: {
          userId: proof.creator.userId,
          title: "发布链接未通过验收",
          body: `${rejectionReason}: ${rejectionNote}`,
          href: `/creator/my-tasks/${proof.submission.applicationId}`,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          actorRole: session.role,
          action: "proof.brand_rejected",
          entityType: "proof",
          entityId: proofId,
          beforeJson: { verificationStatus: proof.verificationStatus, publicationStatus: proof.publicationStatus },
          afterJson: { verificationStatus: ProofStatus.REJECTED, publicationStatus: PublicationStatus.REJECTED, rejectionReason, rejectionNote },
        },
      });
    });
  }

  revalidatePath(`/brand/campaigns/${proof.campaignId}/proofs`);
  revalidatePath(`/creator/my-tasks/${proof.submission.applicationId}`);
  await dispatchExternalNotification({
    userId: proof.creator.userId,
    role: "CREATOR",
    event: decision === "accept" ? "proof.accepted" : "proof.rejected",
    channel: "workflow",
    title: decision === "accept" ? "发布链接已通过验收" : "发布链接未通过验收",
    body: decision === "accept" ? `${proof.submission.application.task.title} 已验收通过，收益已进入可提现余额。` : `${rejectionReason}: ${rejectionNote}`,
    href: `/creator/my-tasks/${proof.submission.applicationId}`,
  });
}

export async function runSlaAutomationAction() {
  const session = await requireAdminPermission("proof.review");
  const now = new Date();
  const pendingProofs = await prisma.proof.findMany({
    where: {
      verificationStatus: ProofStatus.PENDING,
      publicationStatus: { in: [PublicationStatus.LINK_SUBMITTED, PublicationStatus.RESUBMITTED] },
    },
    include: {
      campaign: { include: { brand: true } },
      creator: { include: { user: true, wallet: true } },
      submission: {
        include: {
          application: { include: { task: true } },
          disputes: true,
        },
      },
    },
  });

  let accepted = 0;
  let escalated = 0;

  for (const proof of pendingProofs) {
    const dueAt = new Date(proof.createdAt);
    dueAt.setDate(dueAt.getDate() + proof.campaign.acceptanceSlaDays);
    if (dueAt > now) continue;

    const rewardAmount = Number(proof.submission.application.task.rewardAmount);
    const threshold = Number(proof.campaign.highValueReviewThreshold);

    if (rewardAmount <= threshold) {
      assertProofTransition(proof.verificationStatus, ProofStatus.VERIFIED);
      assertSubmissionTransition(proof.submission.status, SubmissionStatus.VERIFIED);
      assertPublicationTransition(proof.publicationStatus, PublicationStatus.ACCEPTED);
      assertPublicationTransition(proof.submission.publicationStatus, PublicationStatus.ACCEPTED);
      assertSettlementTransition(proof.submission.settlementStatus, SettlementStatus.PAYABLE);
      await prisma.$transaction(async (tx) => {
        await tx.proof.update({
          where: { id: proof.id },
          data: {
            verificationStatus: ProofStatus.VERIFIED,
            publicationStatus: PublicationStatus.ACCEPTED,
            adminNote: "商家验收 SLA 已超时，低金额任务由系统自动通过。",
          },
        });
        await tx.submission.update({
          where: { id: proof.submissionId },
          data: {
            status: SubmissionStatus.VERIFIED,
            publicationStatus: PublicationStatus.ACCEPTED,
            settlementStatus: SettlementStatus.PAYABLE,
            settlementAmount: proof.submission.application.task.rewardAmount,
            acceptedAt: now,
          },
        });
        await creditAcceptedSubmissionEarning({
          tx,
          actorUserId: session.userId,
          actorRole: session.role,
          submissionId: proof.submissionId,
          campaignId: proof.campaignId,
          creatorId: proof.creatorId,
          creatorUserId: proof.creator.userId,
          rewardAmount: proof.submission.application.task.rewardAmount,
          note: "商家验收 SLA 超时，低金额任务自动通过后直接入账。",
        });
        await tx.notification.createMany({
          data: [
            {
              userId: proof.campaign.brand.userId,
              title: "发布验收已按 SLA 自动处理",
              body: `${proof.creator.displayName} 的发布链接因超时未验收，系统已按低金额规则自动通过。`,
              href: `/brand/campaigns/${proof.campaignId}/proofs`,
            },
          ],
        });
        await tx.auditLog.create({
          data: {
            actorUserId: session.userId,
            actorRole: session.role,
            action: "proof.sla_auto_accepted",
            entityType: "proof",
            entityId: proof.id,
            beforeJson: { verificationStatus: proof.verificationStatus, publicationStatus: proof.publicationStatus },
            afterJson: { verificationStatus: ProofStatus.VERIFIED, publicationStatus: PublicationStatus.ACCEPTED },
          },
        });
      });
      accepted += 1;
    } else {
      const activeDispute = proof.submission.disputes.find((dispute) => dispute.status === DisputeStatus.OPEN || dispute.status === DisputeStatus.NEEDS_INFO);
      assertPublicationTransition(proof.publicationStatus, PublicationStatus.DISPUTED);
      assertPublicationTransition(proof.submission.publicationStatus, PublicationStatus.DISPUTED);
      await prisma.$transaction(async (tx) => {
        await tx.proof.update({
          where: { id: proof.id },
          data: {
            publicationStatus: PublicationStatus.DISPUTED,
            adminNote: "商家验收 SLA 已超时，高金额任务进入平台复核。",
          },
        });
        await tx.submission.update({
          where: { id: proof.submissionId },
          data: {
            publicationStatus: PublicationStatus.DISPUTED,
            disputedAt: now,
          },
        });
        const dispute =
          activeDispute ??
          (await tx.dispute.create({
            data: {
              submissionId: proof.submissionId,
              campaignId: proof.campaignId,
              creatorId: proof.creatorId,
              brandId: proof.campaign.brandId,
              status: DisputeStatus.OPEN,
              reason: "商家验收 SLA 超时，高金额任务自动进入平台复核。",
              merchantReasonCategory: "SLA_TIMEOUT",
              merchantNote: "系统自动创建，等待 Admin 根据平台内记录处理。",
            },
          }));
        await tx.notification.createMany({
          data: [
            {
              userId: proof.creator.userId,
              title: "发布验收进入平台复核",
              body: `${proof.submission.application.task.title} 因商家验收超时且金额较高，已进入平台处理。`,
              href: `/creator/my-tasks/${proof.submission.applicationId}`,
            },
            {
              userId: proof.campaign.brand.userId,
              title: "发布验收已进入平台复核",
              body: `${proof.creator.displayName} 的发布链接因 SLA 超时进入平台处理。`,
              href: `/brand/campaigns/${proof.campaignId}/proofs`,
            },
          ],
        });
        await tx.auditLog.create({
          data: {
            actorUserId: session.userId,
            actorRole: session.role,
            action: "proof.sla_escalated",
            entityType: "proof",
            entityId: proof.id,
            beforeJson: { verificationStatus: proof.verificationStatus, publicationStatus: proof.publicationStatus },
            afterJson: { publicationStatus: PublicationStatus.DISPUTED, disputeId: dispute.id },
          },
        });
      });
      escalated += 1;
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/disputes");
  revalidatePath("/admin/payments");
  redirect(`/admin/settings?sla=${accepted}-${escalated}`);
}

export async function createDisputeFromProofAction(proofId: string, formData: FormData) {
  const session = await requireAdminPermission("proof.review");
  const reason = text(formData.get("reason"));
  const proof = await prisma.proof.findUnique({
    where: { id: proofId },
    include: {
      campaign: { include: { brand: true } },
      creator: true,
      submission: { include: { disputes: true } },
    },
  });
  if (!proof) redirect("/admin/disputes");
  if (reason.length < 5) redirect(`/admin/disputes?error=${encodeURIComponent("请填写争议原因")}`);
  const activeDispute = proof.submission.disputes.find((dispute) => dispute.status === DisputeStatus.OPEN || dispute.status === DisputeStatus.NEEDS_INFO);
  if (activeDispute) redirect(`/admin/disputes?dispute=${activeDispute.id}`);
  assertPublicationTransition(proof.publicationStatus, PublicationStatus.DISPUTED);
  assertPublicationTransition(proof.submission.publicationStatus, PublicationStatus.DISPUTED);

  const dispute = await prisma.$transaction(async (tx) => {
    const created = await tx.dispute.create({
      data: {
        submissionId: proof.submissionId,
        campaignId: proof.campaignId,
        creatorId: proof.creatorId,
        brandId: proof.campaign.brandId,
        status: DisputeStatus.OPEN,
        reason,
        merchantReasonCategory: proof.rejectionReason,
        merchantNote: proof.rejectionNote,
      },
    });
    await tx.submission.update({
      where: { id: proof.submissionId },
      data: { publicationStatus: PublicationStatus.DISPUTED, disputedAt: new Date() },
    });
    await tx.proof.update({
      where: { id: proofId },
      data: { publicationStatus: PublicationStatus.DISPUTED },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "dispute.created",
        entityType: "dispute",
        entityId: created.id,
        afterJson: { proofId, submissionId: proof.submissionId, reason },
      },
    });
    return created;
  });

  revalidatePath("/admin/disputes");
  revalidatePath(`/creator/my-tasks/${proof.submission.applicationId}`);
  redirect(`/admin/disputes?dispute=${dispute.id}`);
}

export async function decideDisputeAction(disputeId: string, formData: FormData) {
  const session = await requireAdminPermission("payment.refund.execute");
  const decision = text(formData.get("decision")) as DisputeDecision;
  const resolution = text(formData.get("resolution"));
  const partialSettlementAmount = Number(text(formData.get("partialSettlementAmount")) || 0);
  if (resolution.length < 5) redirect(`/admin/disputes?error=${encodeURIComponent("请填写裁决说明")}`);

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      submission: {
        include: {
          campaign: { include: { brand: true } },
          creator: { include: { user: true, wallet: true } },
          application: { include: { task: true } },
          proofs: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!dispute?.submission) redirect("/admin/disputes");
  if (dispute.status === DisputeStatus.DECIDED || dispute.status === DisputeStatus.CLOSED) redirect("/admin/disputes");

  const submission = dispute.submission;
  const rewardAmount = Number(submission.application.task.rewardAmount);
  const settlementAmount =
    decision === DisputeDecision.FULL_SETTLEMENT
      ? rewardAmount
      : decision === DisputeDecision.PARTIAL_SETTLEMENT
        ? partialSettlementAmount
        : 0;
  if (decision === DisputeDecision.PARTIAL_SETTLEMENT && (settlementAmount <= 0 || settlementAmount >= rewardAmount)) {
    redirect(`/admin/disputes?error=${encodeURIComponent("部分结算金额必须大于 0 且小于任务奖励")}`);
  }
  const refundAmount = Math.max(0, rewardAmount - settlementAmount);
  if (decision === DisputeDecision.FULL_SETTLEMENT || decision === DisputeDecision.PARTIAL_SETTLEMENT) {
    assertSubmissionTransition(submission.status, SubmissionStatus.VERIFIED);
    assertPublicationTransition(submission.publicationStatus, PublicationStatus.ACCEPTED);
    assertSettlementTransition(
      submission.settlementStatus,
      decision === DisputeDecision.PARTIAL_SETTLEMENT ? SettlementStatus.PARTIALLY_SETTLED : SettlementStatus.PAYABLE,
    );
  }
  if (decision === DisputeDecision.FULL_REFUND) {
    assertSubmissionTransition(submission.status, SubmissionStatus.REJECTED);
    assertPublicationTransition(submission.publicationStatus, PublicationStatus.REJECTED);
    assertSettlementTransition(submission.settlementStatus, SettlementStatus.REFUNDED);
  }
  if (decision === DisputeDecision.ALLOW_RESUBMISSION) {
    assertSubmissionTransition(submission.status, SubmissionStatus.APPROVED);
    assertPublicationTransition(submission.publicationStatus, PublicationStatus.REJECTED);
  }

  await prisma.$transaction(async (tx) => {
    if (decision === DisputeDecision.FULL_SETTLEMENT || decision === DisputeDecision.PARTIAL_SETTLEMENT) {
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.VERIFIED,
          publicationStatus: PublicationStatus.ACCEPTED,
          settlementStatus: decision === DisputeDecision.PARTIAL_SETTLEMENT ? SettlementStatus.PARTIALLY_SETTLED : SettlementStatus.PAYABLE,
          settlementAmount,
          acceptedAt: new Date(),
        },
      });
      await creditAcceptedSubmissionEarning({
        tx,
        actorUserId: session.userId,
        actorRole: session.role,
        submissionId: submission.id,
        campaignId: submission.campaignId,
        creatorId: submission.creatorId,
        creatorUserId: submission.creator.userId,
        rewardAmount: settlementAmount,
        note: `争议裁决后直接入账：${decision}`,
      });
    }

    if ((decision === DisputeDecision.FULL_REFUND || decision === DisputeDecision.PARTIAL_SETTLEMENT) && refundAmount > 0) {
      const beforeBalance = Number(submission.campaign.brand.budgetBalance);
      await tx.brandProfile.update({
        where: { id: submission.campaign.brandId },
        data: {
          budgetBalance: { increment: refundAmount },
          frozenEscrowBalance: { decrement: refundAmount },
        },
      });
      await tx.campaign.update({
        where: { id: submission.campaignId },
        data: { escrowFrozenAmount: { decrement: refundAmount } },
      });
      await tx.brandLedgerTransaction.create({
        data: {
          brandId: submission.campaign.brandId,
          campaignId: submission.campaignId,
          type: BrandLedgerTxType.REFUND,
          amount: refundAmount,
          currency: submission.campaign.currency,
          status: BrandLedgerTxStatus.CONFIRMED,
          beforeBalance,
          afterBalance: beforeBalance + refundAmount,
          createdById: session.userId,
          note: `争议裁决退回商家余额：${decision}`,
        },
      });
      if (decision === DisputeDecision.FULL_REFUND) {
        await tx.submission.update({
          where: { id: submission.id },
          data: {
            status: SubmissionStatus.REJECTED,
            publicationStatus: PublicationStatus.REJECTED,
            settlementStatus: SettlementStatus.REFUNDED,
            settlementAmount: 0,
            rejectedAt: new Date(),
          },
        });
      }
    }

    if (decision === DisputeDecision.ALLOW_RESUBMISSION) {
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.APPROVED,
          publicationStatus: PublicationStatus.REJECTED,
          revisionNote: resolution,
        },
      });
    }

    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.DECIDED,
        decision,
        partialSettlementAmount: decision === DisputeDecision.PARTIAL_SETTLEMENT ? settlementAmount : null,
        resolution,
        decidedById: session.userId,
        decidedAt: new Date(),
      },
    });
    await tx.notification.create({
      data: {
        userId: submission.creator.userId,
        title: "任务争议已裁决",
        body: resolution,
        href: `/creator/my-tasks/${submission.applicationId}`,
      },
    });
    await tx.notification.create({
      data: {
        userId: submission.campaign.brand.userId,
        title: "任务争议已裁决",
        body: resolution,
        href: `/brand/campaigns/${submission.campaignId}/proofs`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "dispute.decided",
        entityType: "dispute",
        entityId: disputeId,
        beforeJson: { status: dispute.status },
        afterJson: { decision, settlementAmount, refundAmount, resolution },
      },
    });
  });

  revalidatePath("/admin/disputes");
  revalidatePath("/admin/payments");
  revalidatePath(`/creator/my-tasks/${submission.applicationId}`);
  revalidatePath(`/brand/campaigns/${submission.campaignId}/proofs`);
}

export async function verifyProofAction(proofId: string, formData: FormData) {
  const session = await requireAdminPermission("proof.review");
  const action = text(formData.get("action"));
  const note = text(formData.get("adminNote"));
  const proof = await prisma.proof.findUnique({
    where: { id: proofId },
    include: {
      campaign: true,
      submission: { include: { application: { include: { task: true } }, creator: { include: { wallet: true, user: true } } } },
    },
  });
  if (!proof) redirect("/admin/proofs");

  if (action === "verify") {
    assertProofTransition(proof.verificationStatus, ProofStatus.VERIFIED);
    assertSubmissionTransition(proof.submission.status, SubmissionStatus.VERIFIED);
    assertPublicationTransition(proof.publicationStatus, PublicationStatus.ACCEPTED);
    assertPublicationTransition(proof.submission.publicationStatus, PublicationStatus.ACCEPTED);
    assertSettlementTransition(proof.submission.settlementStatus, SettlementStatus.PAYABLE);
    await prisma.$transaction(async (tx) => {
      await tx.proof.update({
        where: { id: proofId },
        data: { verificationStatus: ProofStatus.VERIFIED, publicationStatus: PublicationStatus.ACCEPTED, adminNote: note },
      });
      await tx.submission.update({
        where: { id: proof.submissionId },
        data: {
          status: SubmissionStatus.VERIFIED,
          publicationStatus: PublicationStatus.ACCEPTED,
          settlementStatus: SettlementStatus.PAYABLE,
          settlementAmount: proof.submission.application.task.rewardAmount,
          acceptedAt: new Date(),
        },
      });
      await tx.metricsSnapshot.create({
        data: {
          proofId,
          campaignId: proof.campaignId,
          views: proof.views,
          likes: proof.likes,
          comments: proof.comments,
          shares: proof.shares,
          saves: proof.saves,
          clicks: proof.clicks,
          conversions: proof.conversions,
        },
      });
      await creditAcceptedSubmissionEarning({
        tx,
        actorUserId: session.userId,
        actorRole: session.role,
        submissionId: proof.submissionId,
        campaignId: proof.campaignId,
        creatorId: proof.creatorId,
        creatorUserId: proof.submission.creator.userId,
        rewardAmount: proof.submission.application.task.rewardAmount,
        note: "平台验证 proof 后直接入账。",
      });
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          actorRole: session.role,
          action: "proof.verified",
          entityType: "proof",
          entityId: proofId,
          beforeJson: { verificationStatus: proof.verificationStatus },
          afterJson: { verificationStatus: ProofStatus.VERIFIED },
        },
      });
    });
  } else {
    assertProofTransition(proof.verificationStatus, ProofStatus.REJECTED);
    assertSubmissionTransition(proof.submission.status, SubmissionStatus.APPROVED);
    assertPublicationTransition(proof.publicationStatus, PublicationStatus.REJECTED);
    assertPublicationTransition(proof.submission.publicationStatus, PublicationStatus.REJECTED);
    await prisma.$transaction(async (tx) => {
      await tx.proof.update({
        where: { id: proofId },
        data: { verificationStatus: ProofStatus.REJECTED, publicationStatus: PublicationStatus.REJECTED, adminNote: note },
      });
      await tx.submission.update({
        where: { id: proof.submissionId },
        data: { status: SubmissionStatus.APPROVED, publicationStatus: PublicationStatus.REJECTED },
      });
      await tx.notification.create({
        data: {
          userId: proof.submission.creator.userId,
          title: "Proof 被拒绝",
          body: note || "请补充正确链接或截图后重新提交。",
          href: `/creator/my-tasks/${proof.submission.applicationId}`,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          actorRole: session.role,
          action: "proof.rejected",
          entityType: "proof",
          entityId: proofId,
          beforeJson: { verificationStatus: proof.verificationStatus },
          afterJson: { verificationStatus: ProofStatus.REJECTED, note },
        },
      });
    });
  }
  revalidatePath("/admin/proofs");
}

const manualPostMetricSnapshotSchema = z.object({
  viewCount: z.coerce.number().int().min(0).optional(),
  likeCount: z.coerce.number().int().min(0).optional(),
  favoriteCount: z.coerce.number().int().min(0).optional(),
  commentCount: z.coerce.number().int().min(0).optional(),
  shareCount: z.coerce.number().int().min(0).optional(),
  authorName: z.string().trim().max(120).optional(),
  canonicalUrl: z.string().trim().url().optional().or(z.literal("")),
  evidenceNote: z.string().trim().min(5).max(1000),
});

export async function createManualPostMetricSnapshotAction(proofId: string, formData: FormData) {
  const session = await requireAdminPermission("proof.review");
  const parsed = manualPostMetricSnapshotSchema.safeParse({
    viewCount: text(formData.get("viewCount")) || undefined,
    likeCount: text(formData.get("likeCount")) || undefined,
    favoriteCount: text(formData.get("favoriteCount")) || undefined,
    commentCount: text(formData.get("commentCount")) || undefined,
    shareCount: text(formData.get("shareCount")) || undefined,
    authorName: text(formData.get("authorName")) || undefined,
    canonicalUrl: text(formData.get("canonicalUrl")),
    evidenceNote: text(formData.get("evidenceNote")),
  });
  if (!parsed.success) redirect(`/admin/proofs?error=${encodeURIComponent("请填写有效的人工补录数据和证据说明。")}`);

  const proof = await prisma.proof.findUnique({ where: { id: proofId }, include: { submission: true } });
  if (!proof) redirect("/admin/proofs");

  const snapshot = await prisma.postMetricSnapshot.create({
    data: {
      proofId,
      platform: toCrawlerPlatform(proof.platform) ?? CrawlerPlatform.XIAOHONGSHU,
      status: CrawlerSnapshotStatus.SUCCESS,
      dataConfidence: "MEDIUM",
      viewCount: parsed.data.viewCount ?? null,
      likeCount: parsed.data.likeCount ?? null,
      favoriteCount: parsed.data.favoriteCount ?? null,
      commentCount: parsed.data.commentCount ?? null,
      shareCount: parsed.data.shareCount ?? null,
      authorName: parsed.data.authorName || null,
      canonicalUrl: parsed.data.canonicalUrl || proof.resolvedPostUrl || proof.postUrl,
      fetchedAt: new Date(),
      rawProvider: "manual_admin",
      rawEvidence: {
        source: "manual_admin",
        note: parsed.data.evidenceNote,
        enteredByUserId: session.userId,
        enteredAt: new Date().toISOString(),
      },
      parserVersion: "manual-v1",
    },
  });

  await audit({
    action: "proof.metrics_manual_snapshot_created",
    entityType: "proof",
    entityId: proofId,
    afterJson: {
      snapshotId: snapshot.id,
      dataConfidence: snapshot.dataConfidence,
      viewCount: snapshot.viewCount,
      likeCount: snapshot.likeCount,
      favoriteCount: snapshot.favoriteCount,
      commentCount: snapshot.commentCount,
      shareCount: snapshot.shareCount,
      evidenceNote: parsed.data.evidenceNote,
    },
  });
  revalidatePath("/admin/proofs");
  revalidatePath(`/brand/campaigns/${proof.campaignId}/proofs`);
  revalidatePath(`/creator/my-tasks/${proof.submission.applicationId}`);
}

export async function requestWithdrawalAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const [creator, settings] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId: session.userId }, include: { wallet: true } }),
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
  ]);
  if (!creator?.wallet) redirect("/creator/wallet");
  const amount = Number(text(formData.get("amount")) || 0);
  const minimumWithdrawalAmount = Number(settings.minimumWithdrawalAmount);
  if (amount < minimumWithdrawalAmount) redirect(`/creator/wallet?error=${encodeURIComponent(`最低提现金额为 ￥${minimumWithdrawalAmount}`)}`);
  if (amount > Number(creator.wallet.availableBalance)) redirect(`/creator/wallet?error=${encodeURIComponent("可提现余额不足")}`);
  const method = text(formData.get("payoutMethod")) || "银行卡";
  const details = text(formData.get("payoutDetails"));
  if (details.length < 4) redirect(`/creator/wallet?error=${encodeURIComponent("请填写收款信息")}`);

  await prisma.$transaction(async (tx) => {
    const request = await tx.withdrawalRequest.create({
      data: {
        walletId: creator.wallet!.id,
        creatorId: creator.id,
        amount,
        currency: creator.wallet!.currency,
        payoutMethod: method,
        payoutDetails: { value: details },
        isDemo: creator.isDemo,
      },
    });
    await tx.wallet.update({
      where: { id: creator.wallet!.id },
      data: {
        availableBalance: { decrement: amount },
        frozenBalance: { increment: amount },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: creator.wallet!.id,
        creatorId: creator.id,
        type: WalletTxType.WITHDRAWAL,
        amount,
        currency: creator.wallet!.currency,
        status: WalletTxStatus.PENDING,
        relatedWithdrawalId: request.id,
        isDemo: creator.isDemo,
        note: "提现申请已提交，余额已冻结。",
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "withdrawal.requested",
        entityType: "withdrawal_request",
        entityId: request.id,
        afterJson: { amount },
      },
    });
  });
  redirect("/creator/wallet?requested=1");
}

export async function updateWithdrawalAction(withdrawalId: string, formData: FormData) {
  const session = await requireAdminPermission("payment.confirm");
  const action = text(formData.get("action"));
  const note = text(formData.get("adminNote"));
  const confirmed = text(formData.get("confirmAction")) === "yes";
  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: { wallet: true, transactions: true },
  });
  if (!request) redirect("/admin/payments");
  if (!confirmed) redirect("/admin/payments?error=资金操作必须先勾选确认。");
  if ((action === "paid" || action === "reject") && note.length < 3) redirect("/admin/payments?error=提现打款或拒绝必须填写处理备注。");

  await prisma.$transaction(async (tx) => {
    if (action === "approve") {
      await tx.withdrawalRequest.update({ where: { id: withdrawalId }, data: { status: WithdrawalStatus.APPROVED, adminNote: note } });
    }
    if (action === "paid") {
      await tx.withdrawalRequest.update({ where: { id: withdrawalId }, data: { status: WithdrawalStatus.PAID, adminNote: note } });
      await tx.wallet.update({
        where: { id: request.walletId },
        data: {
          frozenBalance: { decrement: request.amount },
          cumulativeWithdrawn: { increment: request.amount },
        },
      });
      await tx.walletTransaction.updateMany({
        where: { relatedWithdrawalId: withdrawalId, type: WalletTxType.WITHDRAWAL },
        data: { status: WalletTxStatus.PAID, note },
      });
    }
    if (action === "reject") {
      await tx.withdrawalRequest.update({ where: { id: withdrawalId }, data: { status: WithdrawalStatus.REJECTED, adminNote: note } });
      await tx.wallet.update({
        where: { id: request.walletId },
        data: {
          availableBalance: { increment: request.amount },
          frozenBalance: { decrement: request.amount },
        },
      });
      await tx.walletTransaction.updateMany({
        where: { relatedWithdrawalId: withdrawalId, type: WalletTxType.WITHDRAWAL },
        data: { status: WalletTxStatus.REJECTED, note },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: `withdrawal.${action}`,
        entityType: "withdrawal_request",
        entityId: withdrawalId,
        beforeJson: { status: request.status },
        afterJson: { action, note },
      },
    });
  });
  revalidatePath("/admin/payments");
}

export async function addComplianceRuleAction(formData: FormData) {
  const session = await requireAdminPermission("compliance.manage");
  const rule = await prisma.complianceRule.create({
    data: {
      type: text(formData.get("type")) as ComplianceRuleType,
      keyword: text(formData.get("keyword")),
      severity: text(formData.get("severity")) as RiskLevel,
      description: text(formData.get("description")),
      createdById: session.userId,
      active: true,
    },
  });
  await audit({ action: "compliance_rule.created", entityType: "compliance_rule", entityId: rule.id });
  revalidatePath("/admin/compliance");
}

const platformSettingsSchema = z.object({
  acceptanceSlaDays: z.coerce.number().int().min(1).max(30),
  highValueReviewThreshold: z.coerce.number().min(1),
  resubmissionGraceDays: z.coerce.number().int().min(0).max(14),
  minimumWithdrawalAmount: z.coerce.number().min(1),
  kolPreviewMaxMb: z.coerce.number().int().min(1).max(200),
  platformFeeRatePercent: z.coerce.number().min(0).max(30),
  platformContactEmail: z.string().email(),
  riskIndustryKeywords: z.array(z.string()).default([]),
  riskIndustryPrompt: z.string().min(10),
  creatorTrendRefreshEnabled: z.boolean(),
  creatorTrendRefreshHourUtc: z.coerce.number().int().min(0).max(23),
  creatorTrendRefreshDirections: z.array(z.enum(INSIGHT_DIRECTION_SLUGS)).min(1),
  creatorTrendRefreshBatchCount: z.coerce.number().int().min(1).max(8),
  insightConfiguredCollectionBatchLimit: z.coerce.number().int().min(1).max(100),
  insightZeroResultCooldownHours: z.coerce.number().int().min(1).max(72),
  insightCommentTargetCount: z.coerce.number().int().min(0).max(10),
  insightCommentPerContentLimit: z.coerce.number().int().min(0).max(50),
  insightDefaultHotKeywordPerRunLimit: z.coerce.number().int().min(1).max(50),
  insightDefaultStandardPerRunLimit: z.coerce.number().int().min(1).max(50),
  insightDefaultHotKeywordIntervalHours: z.coerce.number().int().min(1).max(168),
  insightDefaultStandardIntervalHours: z.coerce.number().int().min(1).max(720),
  crawlerProofRefreshCooldownMinutes: z.coerce.number().int().min(1).max(1440),
  crawlerBrandHourlyRefreshLimit: z.coerce.number().int().min(1).max(1000),
  crawlerSocialRefreshCooldownMinutes: z.coerce.number().int().min(1).max(1440),
  crawlerMaxAttempts: z.coerce.number().int().min(1).max(10),
  insightAiEnabled: z.boolean(),
  insightAiBaseUrl: z.string().trim().url().optional().or(z.literal("")),
  insightAiApiKey: z.string().trim().max(500).optional().or(z.literal("")),
  insightAiModel: z.string().trim().min(2).max(120),
  insightImageAiBaseUrl: z.string().trim().url().optional().or(z.literal("")),
  insightImageAiApiKey: z.string().trim().max(500).optional().or(z.literal("")),
  insightImageAiModel: z.string().trim().min(2).max(120),
  insightAiSystemPrompt: z.string().min(20).max(12000),
  insightAiScriptSystemPrompt: z.string().max(6000),
  insightAiGraphicScriptSystemPrompt: z.string().min(20).max(20000),
  insightAiVideoScriptSystemPrompt: z.string().min(20).max(22000),
  insightAiCaseAnalysisSystemPrompt: z.string().min(20).max(20000),
  insightAiCaseGraphicScriptSystemPrompt: z.string().min(20).max(20000),
  insightAiCaseVideoScriptSystemPrompt: z.string().min(20).max(22000),
});

export async function updatePlatformSettingsAction(formData: FormData) {
  await requireAdminPermission("compliance.manage");
  const before = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });
  const parsed = platformSettingsSchema.safeParse({
    acceptanceSlaDays: text(formData.get("acceptanceSlaDays")),
    highValueReviewThreshold: text(formData.get("highValueReviewThreshold")),
    resubmissionGraceDays: text(formData.get("resubmissionGraceDays")),
    minimumWithdrawalAmount: text(formData.get("minimumWithdrawalAmount")),
    kolPreviewMaxMb: text(formData.get("kolPreviewMaxMb")),
    platformFeeRatePercent: text(formData.get("platformFeeRatePercent")),
    platformContactEmail: text(formData.get("platformContactEmail")),
    riskIndustryKeywords: csv(formData.get("riskIndustryKeywords")),
    riskIndustryPrompt: text(formData.get("riskIndustryPrompt")),
    creatorTrendRefreshEnabled: formData.get("creatorTrendRefreshEnabled") === "on",
    creatorTrendRefreshHourUtc: text(formData.get("creatorTrendRefreshHourUtc")),
    creatorTrendRefreshDirections: formData.getAll("creatorTrendRefreshDirections").map((value) => text(value)),
    creatorTrendRefreshBatchCount: text(formData.get("creatorTrendRefreshBatchCount")),
    insightConfiguredCollectionBatchLimit: text(formData.get("insightConfiguredCollectionBatchLimit")),
    insightZeroResultCooldownHours: text(formData.get("insightZeroResultCooldownHours")),
    insightCommentTargetCount: text(formData.get("insightCommentTargetCount")),
    insightCommentPerContentLimit: text(formData.get("insightCommentPerContentLimit")),
    insightDefaultHotKeywordPerRunLimit: text(formData.get("insightDefaultHotKeywordPerRunLimit")),
    insightDefaultStandardPerRunLimit: text(formData.get("insightDefaultStandardPerRunLimit")),
    insightDefaultHotKeywordIntervalHours: text(formData.get("insightDefaultHotKeywordIntervalHours")),
    insightDefaultStandardIntervalHours: text(formData.get("insightDefaultStandardIntervalHours")),
    crawlerProofRefreshCooldownMinutes: text(formData.get("crawlerProofRefreshCooldownMinutes")),
    crawlerBrandHourlyRefreshLimit: text(formData.get("crawlerBrandHourlyRefreshLimit")),
    crawlerSocialRefreshCooldownMinutes: text(formData.get("crawlerSocialRefreshCooldownMinutes")),
    crawlerMaxAttempts: text(formData.get("crawlerMaxAttempts")),
    insightAiEnabled: formData.get("insightAiEnabled") === "on",
    insightAiBaseUrl: text(formData.get("insightAiBaseUrl")) || DEFAULT_INSIGHT_AI_BASE_URL,
    insightAiApiKey: text(formData.get("insightAiApiKey")),
    insightAiModel: text(formData.get("insightAiModel")) || DEFAULT_INSIGHT_AI_MODEL,
    insightImageAiBaseUrl: text(formData.get("insightImageAiBaseUrl")),
    insightImageAiApiKey: text(formData.get("insightImageAiApiKey")),
    insightImageAiModel: text(formData.get("insightImageAiModel")) || DEFAULT_INSIGHT_IMAGE_AI_MODEL,
    insightAiSystemPrompt: text(formData.get("insightAiSystemPrompt")) || DEFAULT_INSIGHT_AI_TOPIC_DECK_PROMPT,
    insightAiScriptSystemPrompt: text(formData.get("insightAiScriptSystemPrompt")) || DEFAULT_INSIGHT_AI_LEGACY_SCRIPT_PROMPT,
    insightAiGraphicScriptSystemPrompt: text(formData.get("insightAiGraphicScriptSystemPrompt")) || DEFAULT_INSIGHT_AI_GRAPHIC_TABLE_SCRIPT_PROMPT || DEFAULT_INSIGHT_AI_GRAPHIC_SCRIPT_PROMPT,
    insightAiVideoScriptSystemPrompt: text(formData.get("insightAiVideoScriptSystemPrompt")) || DEFAULT_INSIGHT_AI_VIDEO_TABLE_SCRIPT_PROMPT || DEFAULT_INSIGHT_AI_VIDEO_SCRIPT_PROMPT,
    insightAiCaseAnalysisSystemPrompt: text(formData.get("insightAiCaseAnalysisSystemPrompt")) || DEFAULT_INSIGHT_AI_CASE_ANALYSIS_PROMPT,
    insightAiCaseGraphicScriptSystemPrompt: text(formData.get("insightAiCaseGraphicScriptSystemPrompt")) || DEFAULT_INSIGHT_AI_CASE_GRAPHIC_SCRIPT_PROMPT,
    insightAiCaseVideoScriptSystemPrompt: text(formData.get("insightAiCaseVideoScriptSystemPrompt")) || DEFAULT_INSIGHT_AI_CASE_VIDEO_SCRIPT_PROMPT,
  });
  if (!parsed.success) redirect(`/admin/settings?error=${encodeURIComponent("配置项校验失败")}`);

  const settings = await prisma.platformSettings.update({
    where: { id: "platform" },
    data: {
      acceptanceSlaDays: parsed.data.acceptanceSlaDays,
      highValueReviewThreshold: parsed.data.highValueReviewThreshold,
      resubmissionGraceDays: parsed.data.resubmissionGraceDays,
      minimumWithdrawalAmount: parsed.data.minimumWithdrawalAmount,
      kolPreviewMaxMb: parsed.data.kolPreviewMaxMb,
      platformFeeRate: parsed.data.platformFeeRatePercent / 100,
      platformContactEmail: parsed.data.platformContactEmail,
      riskIndustryKeywords: parsed.data.riskIndustryKeywords,
      riskIndustryPrompt: parsed.data.riskIndustryPrompt,
      creatorTrendRefreshEnabled: parsed.data.creatorTrendRefreshEnabled,
      creatorTrendRefreshHourUtc: parsed.data.creatorTrendRefreshHourUtc,
      creatorTrendRefreshDirections: parsed.data.creatorTrendRefreshDirections,
      creatorTrendRefreshBatchCount: parsed.data.creatorTrendRefreshBatchCount,
      insightConfiguredCollectionBatchLimit: parsed.data.insightConfiguredCollectionBatchLimit,
      insightZeroResultCooldownHours: parsed.data.insightZeroResultCooldownHours,
      insightCommentTargetCount: parsed.data.insightCommentTargetCount,
      insightCommentPerContentLimit: parsed.data.insightCommentPerContentLimit,
      insightDefaultHotKeywordPerRunLimit: parsed.data.insightDefaultHotKeywordPerRunLimit,
      insightDefaultStandardPerRunLimit: parsed.data.insightDefaultStandardPerRunLimit,
      insightDefaultHotKeywordIntervalHours: parsed.data.insightDefaultHotKeywordIntervalHours,
      insightDefaultStandardIntervalHours: parsed.data.insightDefaultStandardIntervalHours,
      crawlerProofRefreshCooldownMinutes: parsed.data.crawlerProofRefreshCooldownMinutes,
      crawlerBrandHourlyRefreshLimit: parsed.data.crawlerBrandHourlyRefreshLimit,
      crawlerSocialRefreshCooldownMinutes: parsed.data.crawlerSocialRefreshCooldownMinutes,
      crawlerMaxAttempts: parsed.data.crawlerMaxAttempts,
      insightAiEnabled: parsed.data.insightAiEnabled,
      insightAiBaseUrl: parsed.data.insightAiBaseUrl || null,
      ...(parsed.data.insightAiApiKey ? { insightAiApiKey: parsed.data.insightAiApiKey } : {}),
      insightAiModel: parsed.data.insightAiModel,
      insightImageAiBaseUrl: parsed.data.insightImageAiBaseUrl || null,
      ...(parsed.data.insightImageAiApiKey ? { insightImageAiApiKey: parsed.data.insightImageAiApiKey } : {}),
      insightImageAiModel: parsed.data.insightImageAiModel,
      insightAiSystemPrompt: parsed.data.insightAiSystemPrompt,
      insightAiScriptSystemPrompt: parsed.data.insightAiScriptSystemPrompt,
      insightAiGraphicScriptSystemPrompt: parsed.data.insightAiGraphicScriptSystemPrompt,
      insightAiVideoScriptSystemPrompt: parsed.data.insightAiVideoScriptSystemPrompt,
      insightAiCaseAnalysisSystemPrompt: parsed.data.insightAiCaseAnalysisSystemPrompt,
      insightAiCaseGraphicScriptSystemPrompt: parsed.data.insightAiCaseGraphicScriptSystemPrompt,
      insightAiCaseVideoScriptSystemPrompt: parsed.data.insightAiCaseVideoScriptSystemPrompt,
    },
  });
  await audit({
    action: "platform_settings.updated",
    entityType: "platform_settings",
    entityId: settings.id,
    beforeJson: {
      acceptanceSlaDays: before.acceptanceSlaDays,
      highValueReviewThreshold: String(before.highValueReviewThreshold),
      resubmissionGraceDays: before.resubmissionGraceDays,
      minimumWithdrawalAmount: String(before.minimumWithdrawalAmount),
      kolPreviewMaxMb: before.kolPreviewMaxMb,
      platformFeeRate: String(before.platformFeeRate),
      platformContactEmail: before.platformContactEmail,
      riskIndustryKeywords: before.riskIndustryKeywords,
      riskIndustryPrompt: before.riskIndustryPrompt,
      creatorTrendRefreshEnabled: before.creatorTrendRefreshEnabled,
      creatorTrendRefreshHourUtc: before.creatorTrendRefreshHourUtc,
      creatorTrendRefreshDirections: before.creatorTrendRefreshDirections,
      creatorTrendRefreshBatchCount: before.creatorTrendRefreshBatchCount,
      insightConfiguredCollectionBatchLimit: before.insightConfiguredCollectionBatchLimit,
      insightZeroResultCooldownHours: before.insightZeroResultCooldownHours,
      insightCommentTargetCount: before.insightCommentTargetCount,
      insightCommentPerContentLimit: before.insightCommentPerContentLimit,
      insightDefaultHotKeywordPerRunLimit: before.insightDefaultHotKeywordPerRunLimit,
      insightDefaultStandardPerRunLimit: before.insightDefaultStandardPerRunLimit,
      insightDefaultHotKeywordIntervalHours: before.insightDefaultHotKeywordIntervalHours,
      insightDefaultStandardIntervalHours: before.insightDefaultStandardIntervalHours,
      crawlerProofRefreshCooldownMinutes: before.crawlerProofRefreshCooldownMinutes,
      crawlerBrandHourlyRefreshLimit: before.crawlerBrandHourlyRefreshLimit,
      crawlerSocialRefreshCooldownMinutes: before.crawlerSocialRefreshCooldownMinutes,
      crawlerMaxAttempts: before.crawlerMaxAttempts,
      insightAiEnabled: before.insightAiEnabled,
      insightAiBaseUrl: before.insightAiBaseUrl ? "configured" : "missing",
      insightAiApiKey: before.insightAiApiKey ? "configured" : "missing",
      insightAiModel: before.insightAiModel,
      insightImageAiBaseUrl: before.insightImageAiBaseUrl ? "configured" : "fallback-to-text-ai",
      insightImageAiApiKey: before.insightImageAiApiKey ? "configured" : "fallback-to-text-ai",
      insightImageAiModel: before.insightImageAiModel,
      insightAiSystemPrompt: before.insightAiSystemPrompt,
      insightAiScriptSystemPrompt: before.insightAiScriptSystemPrompt,
      insightAiGraphicScriptSystemPrompt: before.insightAiGraphicScriptSystemPrompt,
      insightAiVideoScriptSystemPrompt: before.insightAiVideoScriptSystemPrompt,
      insightAiCaseAnalysisSystemPrompt: before.insightAiCaseAnalysisSystemPrompt,
      insightAiCaseGraphicScriptSystemPrompt: before.insightAiCaseGraphicScriptSystemPrompt,
      insightAiCaseVideoScriptSystemPrompt: before.insightAiCaseVideoScriptSystemPrompt,
    },
    afterJson: {
      acceptanceSlaDays: settings.acceptanceSlaDays,
      highValueReviewThreshold: String(settings.highValueReviewThreshold),
      resubmissionGraceDays: settings.resubmissionGraceDays,
      minimumWithdrawalAmount: String(settings.minimumWithdrawalAmount),
      kolPreviewMaxMb: settings.kolPreviewMaxMb,
      platformFeeRate: String(settings.platformFeeRate),
      platformContactEmail: settings.platformContactEmail,
      riskIndustryKeywords: settings.riskIndustryKeywords,
      riskIndustryPrompt: settings.riskIndustryPrompt,
      creatorTrendRefreshEnabled: settings.creatorTrendRefreshEnabled,
      creatorTrendRefreshHourUtc: settings.creatorTrendRefreshHourUtc,
      creatorTrendRefreshDirections: settings.creatorTrendRefreshDirections,
      creatorTrendRefreshBatchCount: settings.creatorTrendRefreshBatchCount,
      insightConfiguredCollectionBatchLimit: settings.insightConfiguredCollectionBatchLimit,
      insightZeroResultCooldownHours: settings.insightZeroResultCooldownHours,
      insightCommentTargetCount: settings.insightCommentTargetCount,
      insightCommentPerContentLimit: settings.insightCommentPerContentLimit,
      insightDefaultHotKeywordPerRunLimit: settings.insightDefaultHotKeywordPerRunLimit,
      insightDefaultStandardPerRunLimit: settings.insightDefaultStandardPerRunLimit,
      insightDefaultHotKeywordIntervalHours: settings.insightDefaultHotKeywordIntervalHours,
      insightDefaultStandardIntervalHours: settings.insightDefaultStandardIntervalHours,
      crawlerProofRefreshCooldownMinutes: settings.crawlerProofRefreshCooldownMinutes,
      crawlerBrandHourlyRefreshLimit: settings.crawlerBrandHourlyRefreshLimit,
      crawlerSocialRefreshCooldownMinutes: settings.crawlerSocialRefreshCooldownMinutes,
      crawlerMaxAttempts: settings.crawlerMaxAttempts,
      insightAiEnabled: settings.insightAiEnabled,
      insightAiBaseUrl: settings.insightAiBaseUrl ? "configured" : "missing",
      insightAiApiKey: settings.insightAiApiKey ? "configured" : "missing",
      insightAiModel: settings.insightAiModel,
      insightImageAiBaseUrl: settings.insightImageAiBaseUrl ? "configured" : "fallback-to-text-ai",
      insightImageAiApiKey: settings.insightImageAiApiKey ? "configured" : "fallback-to-text-ai",
      insightImageAiModel: settings.insightImageAiModel,
      insightAiSystemPrompt: settings.insightAiSystemPrompt,
      insightAiScriptSystemPrompt: settings.insightAiScriptSystemPrompt,
      insightAiGraphicScriptSystemPrompt: settings.insightAiGraphicScriptSystemPrompt,
      insightAiVideoScriptSystemPrompt: settings.insightAiVideoScriptSystemPrompt,
      insightAiCaseAnalysisSystemPrompt: settings.insightAiCaseAnalysisSystemPrompt,
      insightAiCaseGraphicScriptSystemPrompt: settings.insightAiCaseGraphicScriptSystemPrompt,
      insightAiCaseVideoScriptSystemPrompt: settings.insightAiCaseVideoScriptSystemPrompt,
    },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/brand/campaigns/new");
}

const alipayPaymentConfigSchema = z.object({
  enabled: z.boolean(),
  visibleToBrand: z.boolean(),
  environment: z.enum(["sandbox", "production"]),
  displayName: z.string().trim().min(2).max(40),
  maintenanceMessage: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(1).max(999),
  appId: z.string().trim().min(1).max(80),
  gatewayUrl: z.string().trim().url(),
  notifyUrl: z.string().trim().url(),
  returnUrl: z.string().trim().url().optional().or(z.literal("")),
  appPrivateKey: z.string().trim().optional(),
  alipayPublicKey: z.string().trim().optional(),
});

export async function updateAlipayPaymentConfigAction(formData: FormData) {
  const context = await requireAdminPermission("payment.config.manage");

  const before = await prisma.paymentProviderConfig.findUnique({ where: { provider: "alipay" } });
  const parsed = alipayPaymentConfigSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    visibleToBrand: formData.get("visibleToBrand") === "on",
    environment: text(formData.get("environment")) || "sandbox",
    displayName: text(formData.get("displayName")) || "Alipay",
    maintenanceMessage: text(formData.get("maintenanceMessage")),
    sortOrder: text(formData.get("sortOrder")) || "100",
    appId: text(formData.get("appId")),
    gatewayUrl: text(formData.get("gatewayUrl")),
    notifyUrl: text(formData.get("notifyUrl")),
    returnUrl: text(formData.get("returnUrl")),
    appPrivateKey: text(formData.get("appPrivateKey")),
    alipayPublicKey: text(formData.get("alipayPublicKey")),
  });
  if (!parsed.success) redirect(`/admin/settings?error=${encodeURIComponent("支付宝配置校验失败，请检查 App ID、网关和回调 URL。")}`);

  if (!before?.encryptedPrivateKey && !parsed.data.appPrivateKey) {
    redirect(`/admin/settings?error=${encodeURIComponent("首次配置支付宝必须填写应用私钥。")}`);
  }
  if (!before?.encryptedPublicKey && !parsed.data.alipayPublicKey) {
    redirect(`/admin/settings?error=${encodeURIComponent("首次配置支付宝必须填写支付宝公钥。")}`);
  }

  const encryptedPrivateKey = parsed.data.appPrivateKey ? encryptSecret(parsed.data.appPrivateKey) : before?.encryptedPrivateKey;
  const encryptedPublicKey = parsed.data.alipayPublicKey ? encryptSecret(parsed.data.alipayPublicKey) : before?.encryptedPublicKey;

  const saved = await prisma.paymentProviderConfig.upsert({
    where: { provider: "alipay" },
    update: {
      enabled: parsed.data.enabled,
      visibleToBrand: parsed.data.visibleToBrand,
      environment: parsed.data.environment,
      displayName: parsed.data.displayName,
      maintenanceMessage: parsed.data.maintenanceMessage || null,
      sortOrder: parsed.data.sortOrder,
      appId: parsed.data.appId,
      gatewayUrl: parsed.data.gatewayUrl,
      notifyUrl: parsed.data.notifyUrl,
      returnUrl: parsed.data.returnUrl || null,
      encryptedPrivateKey,
      encryptedPublicKey,
      privateKeyConfigured: Boolean(encryptedPrivateKey),
      publicKeyConfigured: Boolean(encryptedPublicKey),
      lastUpdatedById: context.userId,
    },
    create: {
      provider: "alipay",
      enabled: parsed.data.enabled,
      visibleToBrand: parsed.data.visibleToBrand,
      environment: parsed.data.environment,
      displayName: parsed.data.displayName,
      maintenanceMessage: parsed.data.maintenanceMessage || null,
      sortOrder: parsed.data.sortOrder,
      appId: parsed.data.appId,
      gatewayUrl: parsed.data.gatewayUrl,
      notifyUrl: parsed.data.notifyUrl,
      returnUrl: parsed.data.returnUrl || null,
      encryptedPrivateKey,
      encryptedPublicKey,
      privateKeyConfigured: Boolean(encryptedPrivateKey),
      publicKeyConfigured: Boolean(encryptedPublicKey),
      lastUpdatedById: context.userId,
    },
  });

  await audit({
    action: "payment_provider.alipay_updated",
    entityType: "payment_provider_config",
    entityId: saved.id,
    beforeJson: before
      ? {
          enabled: before.enabled,
          visibleToBrand: before.visibleToBrand,
          environment: before.environment,
          appId: before.appId,
          sortOrder: before.sortOrder,
          gatewayUrl: before.gatewayUrl,
          notifyUrl: before.notifyUrl,
          returnUrl: before.returnUrl,
          privateKeyConfigured: before.privateKeyConfigured,
          publicKeyConfigured: before.publicKeyConfigured,
        }
      : undefined,
    afterJson: {
      enabled: saved.enabled,
      visibleToBrand: saved.visibleToBrand,
      environment: saved.environment,
      appId: saved.appId,
      sortOrder: saved.sortOrder,
      gatewayUrl: saved.gatewayUrl,
      notifyUrl: saved.notifyUrl,
      returnUrl: saved.returnUrl,
      privateKeyConfigured: saved.privateKeyConfigured,
      publicKeyConfigured: saved.publicKeyConfigured,
      privateKeyChanged: Boolean(parsed.data.appPrivateKey),
      publicKeyChanged: Boolean(parsed.data.alipayPublicKey),
    },
  });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?payment=1");
}

const wechatPaymentConfigSchema = z.object({
  enabled: z.boolean(),
  visibleToBrand: z.boolean(),
  environment: z.enum(["sandbox", "production"]),
  displayName: z.string().trim().min(2).max(40),
  maintenanceMessage: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(1).max(999),
  appId: z.string().trim().min(1).max(80),
  merchantId: z.string().trim().min(1).max(80),
  certificateSerialNo: z.string().trim().min(1).max(128),
  gatewayUrl: z.string().trim().url(),
  notifyUrl: z.string().trim().url(),
  merchantPrivateKey: z.string().trim().optional(),
  platformPublicKey: z.string().trim().optional(),
  apiV3Key: z.string().trim().optional(),
});

export async function updateWechatPaymentConfigAction(formData: FormData) {
  const context = await requireAdminPermission("payment.config.manage");

  const before = await prisma.paymentProviderConfig.findUnique({ where: { provider: "wechat_pay" } });
  const parsed = wechatPaymentConfigSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    visibleToBrand: formData.get("visibleToBrand") === "on",
    environment: text(formData.get("environment")) || "production",
    displayName: text(formData.get("displayName")) || "WeChat Pay",
    maintenanceMessage: text(formData.get("maintenanceMessage")),
    sortOrder: text(formData.get("sortOrder")) || "110",
    appId: text(formData.get("appId")),
    merchantId: text(formData.get("merchantId")),
    certificateSerialNo: text(formData.get("certificateSerialNo")),
    gatewayUrl: text(formData.get("gatewayUrl")),
    notifyUrl: text(formData.get("notifyUrl")),
    merchantPrivateKey: text(formData.get("merchantPrivateKey")),
    platformPublicKey: text(formData.get("platformPublicKey")),
    apiV3Key: text(formData.get("apiV3Key")),
  });
  if (!parsed.success) redirect(`/admin/settings?error=${encodeURIComponent("微信支付配置校验失败，请检查 App ID、商户号、证书序列号、网关和通知 URL。")}`);
  if (!before?.encryptedPrivateKey && !parsed.data.merchantPrivateKey) {
    redirect(`/admin/settings?error=${encodeURIComponent("首次配置微信支付必须填写商户 API 私钥。")}`);
  }
  if (!before?.encryptedApiV3Key && !parsed.data.apiV3Key) {
    redirect(`/admin/settings?error=${encodeURIComponent("首次配置微信支付必须填写 APIv3 密钥。")}`);
  }
  if (!before?.encryptedPublicKey && !parsed.data.platformPublicKey) {
    redirect(`/admin/settings?error=${encodeURIComponent("首次配置微信支付必须填写微信支付平台公钥或证书公钥。")}`);
  }

  const encryptedPrivateKey = parsed.data.merchantPrivateKey ? encryptSecret(parsed.data.merchantPrivateKey) : before?.encryptedPrivateKey;
  const encryptedPublicKey = parsed.data.platformPublicKey ? encryptSecret(parsed.data.platformPublicKey) : before?.encryptedPublicKey;
  const encryptedApiV3Key = parsed.data.apiV3Key ? encryptSecret(parsed.data.apiV3Key) : before?.encryptedApiV3Key;
  const saved = await prisma.paymentProviderConfig.upsert({
    where: { provider: "wechat_pay" },
    update: {
      enabled: parsed.data.enabled,
      visibleToBrand: parsed.data.visibleToBrand,
      environment: parsed.data.environment,
      displayName: parsed.data.displayName,
      maintenanceMessage: parsed.data.maintenanceMessage || null,
      sortOrder: parsed.data.sortOrder,
      appId: parsed.data.appId,
      merchantId: parsed.data.merchantId,
      certificateSerialNo: parsed.data.certificateSerialNo,
      gatewayUrl: parsed.data.gatewayUrl,
      notifyUrl: parsed.data.notifyUrl,
      returnUrl: null,
      encryptedPrivateKey,
      encryptedPublicKey,
      encryptedApiV3Key,
      privateKeyConfigured: Boolean(encryptedPrivateKey),
      publicKeyConfigured: Boolean(encryptedPublicKey),
      apiV3KeyConfigured: Boolean(encryptedApiV3Key),
      lastUpdatedById: context.userId,
    },
    create: {
      provider: "wechat_pay",
      enabled: parsed.data.enabled,
      visibleToBrand: parsed.data.visibleToBrand,
      environment: parsed.data.environment,
      displayName: parsed.data.displayName,
      maintenanceMessage: parsed.data.maintenanceMessage || null,
      sortOrder: parsed.data.sortOrder,
      appId: parsed.data.appId,
      merchantId: parsed.data.merchantId,
      certificateSerialNo: parsed.data.certificateSerialNo,
      gatewayUrl: parsed.data.gatewayUrl,
      notifyUrl: parsed.data.notifyUrl,
      encryptedPrivateKey,
      encryptedPublicKey,
      encryptedApiV3Key,
      privateKeyConfigured: Boolean(encryptedPrivateKey),
      publicKeyConfigured: Boolean(encryptedPublicKey),
      apiV3KeyConfigured: Boolean(encryptedApiV3Key),
      lastUpdatedById: context.userId,
    },
  });

  await audit({
    action: "payment_provider.wechat_pay_updated",
    entityType: "payment_provider_config",
    entityId: saved.id,
    beforeJson: before
      ? {
          enabled: before.enabled,
          visibleToBrand: before.visibleToBrand,
          environment: before.environment,
          appId: before.appId,
          sortOrder: before.sortOrder,
          merchantId: before.merchantId,
          certificateSerialNo: before.certificateSerialNo,
          gatewayUrl: before.gatewayUrl,
          notifyUrl: before.notifyUrl,
          privateKeyConfigured: before.privateKeyConfigured,
          publicKeyConfigured: before.publicKeyConfigured,
          apiV3KeyConfigured: before.apiV3KeyConfigured,
        }
      : undefined,
    afterJson: {
      enabled: saved.enabled,
      visibleToBrand: saved.visibleToBrand,
      environment: saved.environment,
      appId: saved.appId,
      sortOrder: saved.sortOrder,
      merchantId: saved.merchantId,
      certificateSerialNo: saved.certificateSerialNo,
      gatewayUrl: saved.gatewayUrl,
      notifyUrl: saved.notifyUrl,
      privateKeyConfigured: saved.privateKeyConfigured,
      publicKeyConfigured: saved.publicKeyConfigured,
      apiV3KeyConfigured: saved.apiV3KeyConfigured,
      privateKeyChanged: Boolean(parsed.data.merchantPrivateKey),
      platformPublicKeyChanged: Boolean(parsed.data.platformPublicKey),
      apiV3KeyChanged: Boolean(parsed.data.apiV3Key),
    },
  });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?payment=1");
}

export async function applyInsightCollectionDefaultsAction() {
  await requireAdminPermission("compliance.manage");
  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });

  const configs = await prisma.insightKeywordConfig.findMany();
  let updatedCount = 0;
  for (const config of configs) {
    const recommended = recommendedCollectionSettings(config.keywordType, settings);
    await prisma.insightKeywordConfig.update({
      where: { id: config.id },
      data: {
        perRunLimit: recommended.perRunLimit,
        collectIntervalHours: recommended.collectIntervalHours,
      },
    });
    updatedCount += 1;
  }

  await audit({
    action: "insights.keyword_defaults_applied",
    entityType: "insight_keyword_config",
    entityId: "configured",
    afterJson: {
      updatedCount,
      hotKeywordPerRunLimit: settings.insightDefaultHotKeywordPerRunLimit,
      standardPerRunLimit: settings.insightDefaultStandardPerRunLimit,
      hotKeywordIntervalHours: settings.insightDefaultHotKeywordIntervalHours,
      standardIntervalHours: settings.insightDefaultStandardIntervalHours,
    },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/insights");
  redirect(`/admin/settings?insightDefaults=${updatedCount}`);
}

export async function runCreatorTrendRefreshAction() {
  await requireAdminPermission("compliance.manage");
  let snapshots = 0;
  try {
    const result = await refreshCreatorTrendDailySnapshots({ force: true });
    snapshots = result.snapshots;
    if (!result.skipped) {
      await invalidateInsightReadCaches();
      scheduleInsightPrewarm({
        directions: result.directions,
        platforms: ["all", "xiaohongshu", "douyin"],
        maxDirections: 3,
      });
    }
    await audit({
      action: "creator_trends.daily_refresh_forced",
      entityType: "platform_settings",
      entityId: "platform",
      afterJson: result,
    });
    revalidatePath("/admin/settings");
    revalidatePath("/creator/trends");
  } catch (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error instanceof Error ? error.message : "达人洞察刷新失败")}`);
  }
  redirect(`/admin/settings?trendRefresh=${snapshots}`);
}

export async function collectAndRefreshCreatorTrendsAction(formData: FormData) {
  await requireAdminPermission("compliance.manage");
  const limit = Math.min(50, Math.max(1, Number.parseInt(text(formData.get("limit")) || "10", 10)));
  let collected = 0;
  let snapshots = 0;
  try {
    const collection = await collectConfiguredKeywords(limit);
    const rebuilt = await rebuildTrendSnapshotsFromContents();
    const refresh = await refreshCreatorTrendDailySnapshots({ force: true });
    await invalidateInsightReadCaches();
    scheduleInsightPrewarm({
      directions: refresh.directions,
      platforms: ["all", "xiaohongshu", "douyin"],
      maxDirections: 3,
    });
    collected = collection.resultCount;
    snapshots = refresh.snapshots;
    await audit({
      action: "creator_trends.collect_and_refresh",
      entityType: "platform_settings",
      entityId: "platform",
      afterJson: {
        limit,
        collected: collection.resultCount,
        collectedKeywords: collection.keywordCount,
        rebuiltTrendSnapshots: rebuilt.resultCount,
        creatorTrendSnapshots: refresh.snapshots,
        directions: refresh.directions,
      },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/insights");
    revalidatePath("/creator/trends");
  } catch (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error instanceof Error ? error.message : "采集并刷新达人洞察失败")}`);
  }
  redirect(`/admin/settings?trendCollect=${collected}&trendRefresh=${snapshots}`);
}

export async function updateCreatorProfileAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const payoutWalletAddress = text(formData.get("payoutWalletAddress")) || null;
  const returnTo = text(formData.get("returnTo"));
  await prisma.creatorProfile.update({
    where: { userId: session.userId },
    data: {
      displayName: text(formData.get("displayName")),
      country: text(formData.get("country")),
      languages: csv(formData.get("languages")),
      categories: csv(formData.get("categories")),
      contentTypes: csv(formData.get("contentTypes")),
      bio: text(formData.get("bio")),
      wallet: {
        upsert: {
          update: {
            payoutWalletAddress,
          },
          create: {
            currency: "CNY",
            payoutWalletAddress,
          },
        },
      },
    },
  });
  await audit({ action: "creator.profile_updated", entityType: "creator", entityId: session.userId });
  revalidatePath("/creator/profile");
  if (returnTo.startsWith("/creator/profile")) redirect(returnTo);
}

export async function updateCreatorInsightDirectionAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const parsed = insightDirectionSchema.safeParse({
    insightDirection: text(formData.get("insightDirection")),
  });
  if (!parsed.success) redirect("/creator/profile?tab=preferences&error=请选择有效的创作方向");

  const creator = await prisma.creatorProfile.update({
    where: { userId: session.userId },
    data: { insightDirection: parsed.data.insightDirection },
  });

  await audit({
    action: "creator.insight_direction_updated",
    entityType: "creator",
    entityId: creator.id,
    afterJson: { insightDirection: parsed.data.insightDirection },
  });
  revalidatePath("/creator/profile");
  revalidatePath("/creator/trends");
  redirect("/creator/profile?tab=preferences&directionUpdated=1");
}

export async function addSocialAccountAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId } });
  if (!creator) redirect("/creator/profile");
  const followers = Number(text(formData.get("followers")) || 0);
  const avgViews = Number(text(formData.get("avgViews")) || 0);
  const platform = text(formData.get("platform"));
  const accountUrl = text(formData.get("accountUrl"));
  const account = await prisma.socialAccount.create({
    data: {
      creatorId: creator.id,
      platform,
      accountName: text(formData.get("accountName")),
      accountUrl,
      followers,
      avgViews,
      submittedFollowers: followers,
      submittedAvgViews: avgViews,
      contentType: text(formData.get("contentType")),
      country: text(formData.get("country")),
      language: text(formData.get("language")),
      verified: false,
      verificationStatus: SocialVerificationStatus.PENDING,
      verificationNote: "等待平台审核账号链接和基础数据。",
    },
  });
  const crawlerPlatform = toCrawlerPlatform(platform);
  if (crawlerPlatform) {
    await createCrawlerJob({
      type: CrawlerJobType.FETCH_SOCIAL_ACCOUNT,
      platform: crawlerPlatform,
      targetType: CrawlerTargetType.SOCIAL_ACCOUNT,
      targetId: account.id,
      targetUrl: accountUrl,
      socialAccountId: account.id,
      createdByUserId: session.userId,
    });
  }
  await audit({ action: "creator.social_account_added", entityType: "creator", entityId: creator.id });
  revalidatePath("/creator/profile");
  revalidatePath("/admin/social-accounts");
  revalidatePath("/admin/crawler");
}

export async function updateSocialAccountAction(socialAccountId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId } });
  if (!creator) redirect("/creator/profile");
  const account = await prisma.socialAccount.findFirst({
    where: { id: socialAccountId, creatorId: creator.id },
  });
  if (!account) redirect("/creator/profile?tab=social");

  const followers = Number(text(formData.get("followers")) || 0);
  const avgViews = Number(text(formData.get("avgViews")) || 0);
  const platform = text(formData.get("platform"));
  const accountUrl = text(formData.get("accountUrl"));
  const updated = await prisma.socialAccount.update({
    where: { id: socialAccountId },
    data: {
      platform,
      accountName: text(formData.get("accountName")),
      accountUrl,
      followers,
      avgViews,
      submittedFollowers: followers,
      submittedAvgViews: avgViews,
      contentType: text(formData.get("contentType")),
      country: text(formData.get("country")),
      language: text(formData.get("language")),
      verified: false,
      verificationStatus: SocialVerificationStatus.PENDING,
      verificationNote: "账号资料已修改，等待平台重新审核。",
      verifiedAt: null,
    },
  });
  const crawlerPlatform = toCrawlerPlatform(platform);
  if (crawlerPlatform) {
    await createCrawlerJob({
      type: CrawlerJobType.FETCH_SOCIAL_ACCOUNT,
      platform: crawlerPlatform,
      targetType: CrawlerTargetType.SOCIAL_ACCOUNT,
      targetId: updated.id,
      targetUrl: accountUrl,
      socialAccountId: updated.id,
      createdByUserId: session.userId,
    });
  }
  await audit({
    action: "creator.social_account_updated",
    entityType: "social_account",
    entityId: socialAccountId,
    beforeJson: { platform: account.platform, accountName: account.accountName, accountUrl: account.accountUrl, verificationStatus: account.verificationStatus },
    afterJson: { platform, accountName: updated.accountName, accountUrl, verificationStatus: SocialVerificationStatus.PENDING },
  });
  revalidatePath("/creator/profile");
  revalidatePath("/admin/social-accounts");
  revalidatePath("/admin/crawler");
  redirect("/creator/profile?tab=social");
}

export async function deleteSocialAccountAction(socialAccountId: string) {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId } });
  if (!creator) redirect("/creator/profile");
  const account = await prisma.socialAccount.findFirst({
    where: { id: socialAccountId, creatorId: creator.id },
    include: { selectedApplications: { select: { id: true, status: true } } },
  });
  if (!account) redirect("/creator/profile?tab=social");
  const activeBindings = account.selectedApplications.filter((application) => application.status === ApplicationStatus.APPLIED || application.status === ApplicationStatus.APPROVED);
  if (activeBindings.length) {
    redirect(`/creator/profile?tab=social&error=${encodeURIComponent("该社媒账号已绑定进行中的任务申请，不能删除。")}`);
  }

  await prisma.socialAccount.delete({ where: { id: socialAccountId } });
  await audit({
    action: "creator.social_account_deleted",
    entityType: "social_account",
    entityId: socialAccountId,
    beforeJson: { platform: account.platform, accountName: account.accountName, accountUrl: account.accountUrl, verificationStatus: account.verificationStatus },
  });
  revalidatePath("/creator/profile");
  revalidatePath("/admin/social-accounts");
  revalidatePath("/admin/crawler");
  redirect("/creator/profile?tab=social");
}

export async function updateSocialAccountVerificationAction(socialAccountId: string, formData: FormData) {
  const session = await requireAdminPermission("account.freeze");
  const status = text(formData.get("verificationStatus")) as SocialVerificationStatus;
  const note = text(formData.get("verificationNote"));
  const account = await prisma.socialAccount.findUnique({ where: { id: socialAccountId }, include: { creator: { include: { user: true } } } });
  if (!account) redirect("/admin/creators");
  await prisma.$transaction(async (tx) => {
    await tx.socialAccount.update({
      where: { id: socialAccountId },
      data: {
        verificationStatus: status,
        verificationNote: note || null,
        verified: status === SocialVerificationStatus.VERIFIED,
        verifiedAt: status === SocialVerificationStatus.VERIFIED ? new Date() : null,
      },
    });
    await tx.notification.create({
      data: {
        userId: account.creator.userId,
        title: `社媒账号审核结果：${status}`,
        body: note || `${account.platform} 账号状态已更新。`,
        href: "/creator/profile",
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "creator.social_account_verified",
        entityType: "social_account",
        entityId: socialAccountId,
        beforeJson: { verificationStatus: account.verificationStatus, verified: account.verified },
        afterJson: { verificationStatus: status, note },
      },
    });
  });
  revalidatePath(`/admin/creators/${account.creatorId}`);
  revalidatePath("/admin/social-accounts");
  revalidatePath("/creator/profile");
}

export async function retryCrawlerJobAction(jobId: string) {
  await requireAdminPermission("account.freeze");
  const job = await prisma.crawlerJob.findUnique({ where: { id: jobId } });
  if (!job) redirect("/admin/crawler");
  if (job.status !== CrawlerJobStatus.FAILED && job.status !== CrawlerJobStatus.CANCELLED) {
    redirect("/admin/crawler");
  }

  const created = await prisma.crawlerJob.create({
    data: {
      type: job.type,
      platform: job.platform,
      targetType: job.targetType,
      targetId: job.targetId,
      targetUrl: job.targetUrl,
      socialAccountId: job.socialAccountId,
      proofId: job.proofId,
      createdByUserId: job.createdByUserId,
    },
  });

  await audit({
    action: "crawler.job_retried",
    entityType: "crawler_job",
    entityId: job.id,
    afterJson: { newJobId: created.id, type: created.type, platform: created.platform },
  });
  revalidatePath("/admin/crawler");
}

export async function refreshSocialAccountMetricsAction(socialAccountId: string) {
  const session = await requireAdminPermission("account.freeze");
  const account = await prisma.socialAccount.findUnique({ where: { id: socialAccountId } });
  if (!account) redirect("/admin/social-accounts");

  const platform = toCrawlerPlatform(account.platform);
  if (!platform) redirect(`/admin/social-accounts?error=${encodeURIComponent("该平台暂不支持自动抓取。")}`);
  const settings = await prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } });
  const cooldownSince = new Date(Date.now() - settings.crawlerSocialRefreshCooldownMinutes * 60 * 1000);
  const recentSameAccount = await prisma.crawlerJob.count({
    where: {
      socialAccountId: account.id,
      type: { in: [CrawlerJobType.FETCH_SOCIAL_ACCOUNT, CrawlerJobType.REFRESH_SOCIAL_ACCOUNT] },
      status: { in: [CrawlerJobStatus.PENDING, CrawlerJobStatus.PROCESSING, CrawlerJobStatus.SUCCESS] },
      createdAt: { gte: cooldownSince },
    },
  });
  if (recentSameAccount > 0) {
    redirect(`/admin/social-accounts?error=${encodeURIComponent(`同一个账号 ${settings.crawlerSocialRefreshCooldownMinutes} 分钟内不能重复刷新。`)}`);
  }

  const job = await createCrawlerJob({
    type: CrawlerJobType.REFRESH_SOCIAL_ACCOUNT,
    platform,
    targetType: CrawlerTargetType.SOCIAL_ACCOUNT,
    targetId: account.id,
    targetUrl: account.accountUrl,
    socialAccountId: account.id,
    createdByUserId: session.userId,
  });

  await audit({
    action: "crawler.social_account_refresh_requested",
    entityType: "social_account",
    entityId: account.id,
    afterJson: { crawlerJobId: job.id, platform },
  });
  revalidatePath("/admin/social-accounts");
  revalidatePath("/admin/crawler");
}

export async function refreshProofMetricsAction(proofId: string) {
  const session = await requireRole([UserRole.ADMIN, UserRole.BRAND]);
  if (session.role === UserRole.ADMIN) {
    await requireAdminPermission("account.freeze");
  }

  const proof = await prisma.proof.findFirst({
    where: {
      id: proofId,
      ...(session.role === UserRole.BRAND ? { campaign: { brand: { userId: session.userId } } } : {}),
    },
    include: { campaign: { include: { brand: true } } },
  });
  if (!proof) redirect(session.role === UserRole.ADMIN ? "/admin/crawler" : "/brand/campaigns");

  const platform = toCrawlerPlatform(proof.platform);
  const backTo = session.role === UserRole.BRAND ? `/brand/campaigns/${proof.campaignId}/proofs` : "/admin/crawler";
  if (!platform) redirect(`${backTo}?error=${encodeURIComponent("该平台暂不支持自动抓取。")}`);

  const now = new Date();
  const settings = await prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } });
  if (session.role === UserRole.BRAND) {
    const proofCooldownAgo = new Date(now.getTime() - settings.crawlerProofRefreshCooldownMinutes * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const [recentSameProof, hourlyBrandRefreshes] = await Promise.all([
      prisma.crawlerJob.count({
        where: {
          proofId: proof.id,
          type: { in: [CrawlerJobType.FETCH_POST_METRICS, CrawlerJobType.REFRESH_POST_METRICS] },
          createdAt: { gte: proofCooldownAgo },
        },
      }),
      prisma.crawlerJob.count({
        where: {
          createdByUserId: session.userId,
          type: CrawlerJobType.REFRESH_POST_METRICS,
          createdAt: { gte: oneHourAgo },
        },
      }),
    ]);

    if (recentSameProof > 0) {
      redirect(`${backTo}?error=${encodeURIComponent(`同一个作品链接 ${settings.crawlerProofRefreshCooldownMinutes} 分钟内不能重复刷新。`)}`);
    }
    if (hourlyBrandRefreshes >= settings.crawlerBrandHourlyRefreshLimit) {
      redirect(`${backTo}?error=${encodeURIComponent(`当前商家账号每小时最多刷新 ${settings.crawlerBrandHourlyRefreshLimit} 次作品数据。`)}`);
    }
  }

  const job = await createCrawlerJob({
    type: CrawlerJobType.REFRESH_POST_METRICS,
    platform,
    targetType: CrawlerTargetType.PROOF,
    targetId: proof.id,
    targetUrl: proof.resolvedPostUrl ?? proof.postUrl,
    proofId: proof.id,
    createdByUserId: session.userId,
  });

  await audit({
    action: "crawler.proof_metrics_refresh_requested",
    entityType: "proof",
    entityId: proof.id,
    afterJson: { crawlerJobId: job.id, platform },
  });
  revalidatePath(backTo);
  revalidatePath("/admin/crawler");
}

export async function createInsightKeywordConfigAction(formData: FormData) {
  await requireAdminPermission("compliance.manage");
  const data = insightKeywordConfigForm(formData);

  await prisma.insightKeywordConfig.upsert({
    where: {
      platform_keyword_keywordType: {
        platform: data.platform,
        keyword: data.keyword,
        keywordType: data.keywordType,
      },
    },
    update: {
      endpoint: data.endpoint,
      active: data.active,
      priority: data.priority,
      perRunLimit: data.perRunLimit,
      collectIntervalHours: data.collectIntervalHours,
    },
    create: data,
  });

  await audit({
    action: "insights.keyword_config_saved",
    entityType: "insight_keyword_config",
    entityId: `${data.platform}:${data.keyword}:${data.keywordType}`,
    afterJson: data,
  });
  revalidatePath("/admin/insights");
}

export async function updateInsightKeywordConfigAction(configId: string, formData: FormData) {
  await requireAdminPermission("compliance.manage");
  const existing = await prisma.insightKeywordConfig.findUnique({ where: { id: configId } });
  if (!existing) redirect("/admin/insights");
  const intent = text(formData.get("intent"));

  if (intent === "toggle") {
    const updated = await prisma.insightKeywordConfig.update({
      where: { id: configId },
      data: { active: !existing.active },
    });
    await audit({
      action: "insights.keyword_config_toggled",
      entityType: "insight_keyword_config",
      entityId: configId,
      beforeJson: { active: existing.active },
      afterJson: { active: updated.active },
    });
    revalidatePath("/admin/insights");
    return;
  }

  const data = insightKeywordConfigForm(formData);
  const updated = await prisma.insightKeywordConfig.update({
    where: { id: configId },
    data,
  });
  await audit({
    action: "insights.keyword_config_updated",
    entityType: "insight_keyword_config",
    entityId: configId,
    beforeJson: {
      keyword: existing.keyword,
      keywordType: existing.keywordType,
      platform: existing.platform,
      endpoint: existing.endpoint,
      active: existing.active,
      priority: existing.priority,
      perRunLimit: existing.perRunLimit,
      collectIntervalHours: existing.collectIntervalHours,
    },
    afterJson: {
      keyword: updated.keyword,
      keywordType: updated.keywordType,
      platform: updated.platform,
      endpoint: updated.endpoint,
      active: updated.active,
      priority: updated.priority,
      perRunLimit: updated.perRunLimit,
      collectIntervalHours: updated.collectIntervalHours,
    },
  });
  revalidatePath("/admin/insights");
}

export async function seedInsightKeywordsAction() {
  await requireAdminPermission("compliance.manage");
  const result = await seedDefaultInsightKeywords();
  await audit({
    action: "insights.keyword_config_seeded",
    entityType: "insight_keyword_config",
    entityId: "default",
    afterJson: result,
  });
  revalidatePath("/admin/insights");
}

export async function collectConfiguredInsightKeywordsAction(formData: FormData) {
  await requireAdminPermission("compliance.manage");
  const limit = Math.max(1, Math.min(Number(text(formData.get("limit")) || 5), 100));
  const result = await collectConfiguredKeywords(limit);
  await invalidateInsightReadCaches();
  scheduleInsightPrewarm({
    platforms: ["all", "xiaohongshu", "douyin"],
    maxDirections: 2,
  });
  await audit({
    action: "insights.configured_keywords_collected",
    entityType: "insight_keyword_config",
    entityId: "configured",
    afterJson: result,
  });
  revalidatePath("/admin/insights");
  revalidatePath("/creator/trends");
  revalidatePath("/brand/insights");
}

export async function regenerateTopicCoverImageAction(imageId: string) {
  await requireAdminPermission("compliance.manage");
  const existing = await prisma.creatorTrendTopicImage.findUnique({ where: { id: imageId } });
  if (!existing) redirect("/admin/insights");

  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
    select: {
      insightAiEnabled: true,
      insightAiBaseUrl: true,
      insightAiApiKey: true,
      insightImageAiBaseUrl: true,
      insightImageAiApiKey: true,
      insightImageAiModel: true,
    },
  });

  const result = await generateTopicCoverImage(settings, {
    sourceContentId: existing.sourceContentId,
    sourceTitle: existing.sourceTitle,
    platform: existing.platform,
    prompt: existing.prompt,
    negativePrompt: existing.negativePrompt,
    fallbackImageUrl: null,
  });

  await audit({
    action: "insights.topic_cover_regenerated",
    entityType: "creator_trend_topic_image",
    entityId: imageId,
    beforeJson: {
      status: existing.status,
      imageUrl: existing.imageUrl,
      errorMessage: existing.errorMessage,
    },
    afterJson: result,
  });
  revalidatePath("/admin/insights");
  revalidatePath("/creator/trends");
}

function normalizeCreatorTrendAiPlatform(value: string): "all" | "xiaohongshu" | "douyin" | "weibo" | "bilibili" {
  if (value === "xiaohongshu" || value === "douyin" || value === "weibo" || value === "bilibili") return value;
  return "all";
}

export async function retryCreatorTrendAiTopicDeckAction(formData: FormData) {
  await requireAdminPermission("compliance.manage");
  const rawDirection = text(formData.get("direction"));
  const direction = INSIGHT_DIRECTION_SLUGS.includes(rawDirection as (typeof INSIGHT_DIRECTION_SLUGS)[number]) ? rawDirection : DEFAULT_INSIGHT_DIRECTION;
  const platform = normalizeCreatorTrendAiPlatform(text(formData.get("platform")));
  const keyword = text(formData.get("keyword")).slice(0, 120);

  const result = await regenerateCreatorTrendAiRecommendations({ direction, platform, keyword });
  await invalidateInsightReadCaches();
  await audit({
    action: "insights.ai_topic_deck_retry",
    entityType: "creator_trend_ai_topic_deck",
    entityId: `${direction}:${platform}:${keyword || "all"}`,
    afterJson: {
      direction,
      platform,
      keyword,
      recommendationStatus: result.recommendationStatus ?? "RULE_FALLBACK",
      recommendationSource: result.recommendationSource,
      recommendationCacheSource: result.recommendationCacheSource ?? null,
      recommendationNeedsRefresh: result.recommendationNeedsRefresh ?? false,
    },
  });
  revalidatePath("/admin/insights");
  revalidatePath("/creator/trends");
}

function normalizeInsightMonitorType(value: string) {
  if (value === "competitor") return "competitor";
  if (value === "negative") return "negative";
  return "keyword";
}

function normalizeInsightMonitorPlatform(value: string) {
  if (value === "xiaohongshu" || value === "douyin" || value === "weibo" || value === "bilibili") return value;
  return "xiaohongshu";
}

function insightMonitorEndpoint(platform: string) {
  if (platform === "douyin") return "douyinSearchVideos";
  if (platform === "weibo") return "weiboHotSearch";
  if (platform === "bilibili") return "bilibiliSearchVideos";
  return "xiaohongshuSearchNotes";
}

export async function createBrandInsightMonitorAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true, brandName: true },
  });
  if (!brand) redirect("/brand/insights/alerts?error=missing-brand");

  const keyword = text(formData.get("keyword")).trim();
  if (keyword.length < 2) redirect("/brand/insights/alerts?error=keyword");

  const monitorType = normalizeInsightMonitorType(text(formData.get("monitorType")));
  const platform = normalizeInsightMonitorPlatform(text(formData.get("platform")));
  const interval = Math.max(1, Math.min(Number(text(formData.get("collectIntervalHours")) || 6), 168));
  const keywordType = `brand:${brand.id}:${monitorType}`;

  await prisma.insightKeywordConfig.upsert({
    where: {
      platform_keyword_keywordType: {
        platform,
        keyword,
        keywordType,
      },
    },
    update: {
      active: true,
      collectIntervalHours: interval,
      perRunLimit: 10,
      priority: monitorType === "negative" ? 20 : 40,
      endpoint: insightMonitorEndpoint(platform),
    },
    create: {
      keyword,
      keywordType,
      platform,
      endpoint: insightMonitorEndpoint(platform),
      active: true,
      priority: monitorType === "negative" ? 20 : 40,
      perRunLimit: 10,
      collectIntervalHours: interval,
    },
  });

  await audit({
    action: "brand.insight_monitor_saved",
    entityType: "insight_keyword_config",
    entityId: `${brand.id}:${platform}:${keyword}:${monitorType}`,
    afterJson: { brandId: brand.id, brandName: brand.brandName, keyword, monitorType, platform, interval },
  });
  revalidatePath("/brand/insights/alerts");
  revalidatePath("/brand/insights");
  redirect("/brand/insights/alerts?saved=1");
}

export async function updateBrandInsightMonitorAction(configId: string, formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const brand = await prisma.brandProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!brand) redirect("/brand/insights/alerts?error=missing-brand");

  const existing = await prisma.insightKeywordConfig.findFirst({
    where: { id: configId, keywordType: { startsWith: `brand:${brand.id}:` } },
  });
  if (!existing) redirect("/brand/insights/alerts?error=not-found");

  const intent = text(formData.get("intent"));
  if (intent === "delete") {
    await prisma.insightKeywordConfig.delete({ where: { id: configId } });
    await audit({
      action: "brand.insight_monitor_deleted",
      entityType: "insight_keyword_config",
      entityId: configId,
      beforeJson: { keyword: existing.keyword, keywordType: existing.keywordType, platform: existing.platform },
    });
  } else {
    await prisma.insightKeywordConfig.update({
      where: { id: configId },
      data: { active: !existing.active },
    });
    await audit({
      action: "brand.insight_monitor_toggled",
      entityType: "insight_keyword_config",
      entityId: configId,
      beforeJson: { active: existing.active },
      afterJson: { active: !existing.active },
    });
  }

  revalidatePath("/brand/insights/alerts");
  revalidatePath("/brand/insights");
}

function normalizeSavedTrendStatus(value: string) {
  if (value === "PLANNED" || value === "PUBLISHED" || value === "DROPPED") return value;
  return "SAVED";
}

export async function saveCreatorTrendAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!creator) redirect("/creator/trends?error=missing-creator");

  const title = text(formData.get("title")).trim();
  if (title.length < 2) redirect("/creator/trends?error=trend-title");

  const platform = text(formData.get("platform")).trim() || null;
  const topic = text(formData.get("topic")).trim() || null;
  const reason = text(formData.get("reason")).trim() || null;
  const sourceContentId = text(formData.get("sourceContentId")).trim() || null;
  const sourceUrl = text(formData.get("sourceUrl")).trim() || null;

  await prisma.creatorSavedTrend.upsert({
    where: {
      creatorId_title_platform: {
        creatorId: creator.id,
        title,
        platform: platform ?? "",
      },
    },
    update: {
      topic,
      reason,
      sourceContentId,
      sourceUrl,
      status: "SAVED",
    },
    create: {
      creatorId: creator.id,
      title,
      topic,
      platform: platform ?? "",
      reason,
      sourceContentId,
      sourceUrl,
      status: "SAVED",
    },
  });

  await audit({
    action: "creator.trend_saved",
    entityType: "creator_saved_trend",
    entityId: `${creator.id}:${title}:${platform ?? ""}`,
    afterJson: { title, platform, topic, sourceContentId },
  });
  revalidatePath("/creator/trends");
}

export async function updateCreatorSavedTrendAction(savedTrendId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!creator) redirect("/creator/trends?error=missing-creator");

  const existing = await prisma.creatorSavedTrend.findFirst({ where: { id: savedTrendId, creatorId: creator.id } });
  if (!existing) redirect("/creator/trends?error=trend-not-found");

  const intent = text(formData.get("intent"));
  if (intent === "delete") {
    await prisma.creatorSavedTrend.delete({ where: { id: savedTrendId } });
    await audit({
      action: "creator.saved_trend_deleted",
      entityType: "creator_saved_trend",
      entityId: savedTrendId,
      beforeJson: { title: existing.title, status: existing.status },
    });
  } else {
    const status = normalizeSavedTrendStatus(text(formData.get("status")) || intent);
    await prisma.creatorSavedTrend.update({ where: { id: savedTrendId }, data: { status } });
    await audit({
      action: "creator.saved_trend_status_updated",
      entityType: "creator_saved_trend",
      entityId: savedTrendId,
      beforeJson: { status: existing.status },
      afterJson: { status },
    });
  }

  revalidatePath("/creator/trends");
}

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireRole([UserRole.ADMIN, UserRole.BRAND, UserRole.CREATOR]);
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.userId },
    data: { unread: false },
  });
  revalidatePath("/");
}

export async function createSupportTicketAction(formData: FormData) {
  const context = await requireAdminPermission("support.manage");
  const parsed = supportTicketSchema.safeParse({
    title: text(formData.get("title")),
    category: text(formData.get("category")),
    priority: text(formData.get("priority")) || SupportTicketPriority.NORMAL,
    brandId: text(formData.get("brandId")) || undefined,
    creatorId: text(formData.get("creatorId")) || undefined,
    campaignId: text(formData.get("campaignId")) || undefined,
    proofId: text(formData.get("proofId")) || undefined,
    disputeId: text(formData.get("disputeId")) || undefined,
    assignedToId: text(formData.get("assignedToId")) || undefined,
    body: text(formData.get("body")),
    internalNote: text(formData.get("internalNote")),
  });
  if (!parsed.success) redirect(`/admin/support?error=${encodeURIComponent("请填写有效的工单标题、类型、优先级和说明。")}`);

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.supportTicket.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        priority: parsed.data.priority,
        brandId: parsed.data.brandId || null,
        creatorId: parsed.data.creatorId || null,
        campaignId: parsed.data.campaignId || null,
        proofId: parsed.data.proofId || null,
        disputeId: parsed.data.disputeId || null,
        openedByUserId: context.userId,
        assignedToId: parsed.data.assignedToId || context.userId,
        lastMessageAt: new Date(),
        internalNote: parsed.data.internalNote || null,
      },
    });
    await tx.supportTicketNote.create({
      data: {
        ticketId: created.id,
        authorUserId: context.userId,
        authorRole: context.role,
        body: parsed.data.body,
        internal: true,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: context.userId,
        actorRole: context.role,
        action: "support_ticket.created",
        entityType: "support_ticket",
        entityId: created.id,
        afterJson: {
          title: created.title,
          category: created.category,
          priority: created.priority,
          brandId: created.brandId,
          creatorId: created.creatorId,
          assignedToId: created.assignedToId,
        },
      },
    });
    return created;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/support");
  redirect(`/admin/support?ticket=${ticket.id}`);
}

export async function updateSupportTicketAction(ticketId: string, formData: FormData) {
  const context = await requireAdminPermission("support.manage");
  const before = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!before) redirect("/admin/support");
  const visibleToCustomer = formData.get("visibleToCustomer") === "on";
  const parsed = supportTicketUpdateSchema.safeParse({
    status: text(formData.get("status")) || before.status,
    priority: text(formData.get("priority")) || before.priority,
    assignedToId: text(formData.get("assignedToId")) || undefined,
    note: text(formData.get("note")),
    internalNote: text(formData.get("internalNote")),
  });
  if (!parsed.success) redirect(`/admin/support?ticket=${ticketId}&error=${encodeURIComponent("工单更新内容无效。")}`);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: parsed.data.status,
        priority: parsed.data.priority,
        assignedToId: parsed.data.assignedToId || null,
        internalNote: parsed.data.internalNote || null,
        lastMessageAt: parsed.data.note ? now : before.lastMessageAt,
        resolvedAt: parsed.data.status === SupportTicketStatus.RESOLVED && before.status !== SupportTicketStatus.RESOLVED ? now : before.resolvedAt,
        closedAt: parsed.data.status === SupportTicketStatus.CLOSED && before.status !== SupportTicketStatus.CLOSED ? now : before.closedAt,
      },
    });
    if (parsed.data.note) {
      await tx.supportTicketNote.create({
        data: {
          ticketId,
          authorUserId: context.userId,
          authorRole: context.role,
          body: parsed.data.note,
          internal: !visibleToCustomer,
        },
      });
    }
    if (parsed.data.note && visibleToCustomer && before.openedByUserId) {
      await tx.notification.create({
        data: {
          userId: before.openedByUserId,
          title: "客服工单有新回复",
          body: parsed.data.note.slice(0, 120),
          href: before.brandId ? `/brand/support?ticket=${ticketId}` : `/creator/support?ticket=${ticketId}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: context.userId,
        actorRole: context.role,
        action: "support_ticket.updated",
        entityType: "support_ticket",
        entityId: ticketId,
        beforeJson: {
          status: before.status,
          priority: before.priority,
          assignedToId: before.assignedToId,
        },
        afterJson: {
          status: parsed.data.status,
          priority: parsed.data.priority,
          assignedToId: parsed.data.assignedToId || null,
          noteAdded: Boolean(parsed.data.note),
          visibleToCustomer,
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/support");
}

export async function createCustomerSupportTicketAction(formData: FormData) {
  const session = await requireRole([UserRole.BRAND, UserRole.CREATOR]);
  const roleRoot = session.role === UserRole.BRAND ? "/brand" : "/creator";
  const parsed = customerSupportTicketSchema.safeParse({
    title: text(formData.get("title")),
    category: text(formData.get("category")) || "general",
    priority: text(formData.get("priority")) || SupportTicketPriority.NORMAL,
    campaignId: text(formData.get("campaignId")) || undefined,
    proofId: text(formData.get("proofId")) || undefined,
    body: text(formData.get("body")),
  });
  if (!parsed.success) redirect(`${roleRoot}/support?error=${encodeURIComponent("请填写工单标题、类型和至少 5 个字的问题说明。")}`);

  const [brand, creator] = await Promise.all([
    session.role === UserRole.BRAND ? prisma.brandProfile.findUnique({ where: { userId: session.userId }, include: { responsibleAdmin: true } }) : null,
    session.role === UserRole.CREATOR ? prisma.creatorProfile.findUnique({ where: { userId: session.userId }, include: { responsibleAdmin: true } }) : null,
  ]);
  if (session.role === UserRole.BRAND && !brand) redirect("/brand/profile");
  if (session.role === UserRole.CREATOR && !creator) redirect("/creator/profile");

  const assignedToId = brand?.responsibleAdmin?.userId ?? creator?.responsibleAdmin?.userId ?? null;
  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.supportTicket.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        priority: parsed.data.priority,
        brandId: brand?.id ?? null,
        creatorId: creator?.id ?? null,
        campaignId: parsed.data.campaignId || null,
        proofId: parsed.data.proofId || null,
        openedByUserId: session.userId,
        assignedToId,
        lastMessageAt: new Date(),
      },
    });
    await tx.supportTicketNote.create({
      data: {
        ticketId: created.id,
        authorUserId: session.userId,
        authorRole: session.role,
        body: parsed.data.body,
        internal: false,
      },
    });
    if (assignedToId) {
      await tx.notification.create({
        data: {
          userId: assignedToId,
          title: "新的客服工单",
          body: `${session.role === UserRole.BRAND ? brand?.brandName : creator?.displayName}：${created.title}`,
          href: `/admin/support?ticket=${created.id}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "support_ticket.customer_created",
        entityType: "support_ticket",
        entityId: created.id,
        afterJson: { category: created.category, priority: created.priority, brandId: created.brandId, creatorId: created.creatorId },
      },
    });
    return created;
  });

  revalidatePath(`${roleRoot}/support`);
  revalidatePath("/admin/support");
  redirect(`${roleRoot}/support?ticket=${ticket.id}`);
}

export async function addCustomerSupportTicketNoteAction(ticketId: string, formData: FormData) {
  const session = await requireRole([UserRole.BRAND, UserRole.CREATOR]);
  const roleRoot = session.role === UserRole.BRAND ? "/brand" : "/creator";
  const body = text(formData.get("body"));
  if (body.length < 2) redirect(`${roleRoot}/support?ticket=${ticketId}&error=${encodeURIComponent("请填写回复内容。")}`);

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      openedByUserId: session.userId,
      status: { notIn: [SupportTicketStatus.CLOSED, SupportTicketStatus.RESOLVED] },
    },
  });
  if (!ticket) redirect(`${roleRoot}/support?error=${encodeURIComponent("工单不存在或已关闭。")}`);

  await prisma.$transaction(async (tx) => {
    await tx.supportTicketNote.create({
      data: {
        ticketId,
        authorUserId: session.userId,
        authorRole: session.role,
        body,
        internal: false,
      },
    });
    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: ticket.status === SupportTicketStatus.WAITING_CUSTOMER ? SupportTicketStatus.IN_PROGRESS : ticket.status,
        lastMessageAt: new Date(),
      },
    });
    if (ticket.assignedToId) {
      await tx.notification.create({
        data: {
          userId: ticket.assignedToId,
          title: "客户补充了工单信息",
          body: body.slice(0, 120),
          href: `/admin/support?ticket=${ticketId}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "support_ticket.customer_replied",
        entityType: "support_ticket",
        entityId: ticketId,
      },
    });
  });

  revalidatePath(`${roleRoot}/support`);
  revalidatePath("/admin/support");
  redirect(`${roleRoot}/support?ticket=${ticketId}`);
}
