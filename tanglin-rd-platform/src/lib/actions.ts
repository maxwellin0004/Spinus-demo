"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  AdminDataScope,
  AdminLevel,
  ApplicationStatus,
  BrandRequestStatus,
  CampaignStatus,
  ComplianceRuleType,
  CreatorLevel,
  DraftStatus,
  ProofStatus,
  ReviewDecision,
  ReviewStatus,
  RiskLevel,
  SocialVerificationStatus,
  SubmissionStatus,
  TaskStatus,
  UserRole,
  UserStatus,
  WalletTxStatus,
  WalletTxType,
  WithdrawalStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { checkSensitiveText } from "@/lib/compliance";
import { createSession, hashPassword, requireRole, verifyPassword, roleHome } from "@/lib/auth";
import { csv, text } from "@/lib/format";
import { hasCreatorLevel } from "@/lib/levels";
import { saveUploadedFile } from "@/lib/storage";
import { ADMIN_PERMISSIONS, hasAdminPermission, isFounder, requireAdminPermission } from "@/lib/admin";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: text(formData.get("email")).toLowerCase(),
    password: text(formData.get("password")),
  });
  if (!parsed.success) redirect("/auth/login?error=Invalid%20login%20form");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    redirect("/auth/login?error=Invalid%20email%20or%20password");
  }
  if (user.status === UserStatus.FROZEN) redirect("/auth/login?error=Account%20is%20frozen");

  await createSession(user);
  redirect(roleHome(user.role));
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["BRAND", "CREATOR"]),
  name: z.string().min(2),
  country: z.string().min(2),
  industry: z.string().optional(),
});

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: text(formData.get("email")).toLowerCase(),
    password: text(formData.get("password")),
    role: text(formData.get("role")),
    name: text(formData.get("name")),
    country: text(formData.get("country")),
    industry: text(formData.get("industry")),
  });
  if (!parsed.success) redirect("/auth/register?error=Please%20check%20required%20fields");

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) redirect("/auth/register?error=Email%20already%20exists");

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
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
              },
            }
          : undefined,
      creatorProfile:
        parsed.data.role === "CREATOR"
          ? {
              create: {
                displayName: parsed.data.name,
                email: parsed.data.email,
                country: parsed.data.country,
                languages: ["English"],
                categories: [],
                contentTypes: [],
                reviewStatus: ReviewStatus.PENDING,
                wallet: { create: { currency: "USD" } },
              },
            }
          : undefined,
    },
  });

  await audit({
    action: "auth.register",
    entityType: "user",
    entityId: user.id,
    afterJson: { role: user.role, email: user.email },
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
        body,
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
        afterJson: { targetType, targetId },
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
  const riskLevel = text(formData.get("riskLevel")) as RiskLevel;
  const responsibleAdminId = text(formData.get("responsibleAdminId")) || null;
  const violationDelta = Number(text(formData.get("violationDelta")) || 0);
  const before = await prisma.creatorProfile.findUnique({ where: { id: creatorId }, include: { user: true } });
  if (!before) redirect("/admin/creators");

  const newViolationCount = Math.max(0, before.violationCount + violationDelta);
  const derivedRisk = newViolationCount >= 3 ? RiskLevel.HIGH : riskLevel;

  await prisma.$transaction(async (tx) => {
    await tx.creatorProfile.update({
      where: { id: creatorId },
      data: {
        reviewStatus,
        level,
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
    await tx.auditLog.create({
      data: {
        action: "creator.updated",
        entityType: "creator",
        entityId: creatorId,
        beforeJson: { reviewStatus: before.reviewStatus, level: before.level, riskLevel: before.riskLevel },
        afterJson: { reviewStatus, level, riskLevel: derivedRisk, violationCount: newViolationCount, responsibleAdminId },
      },
    });
  });
  revalidatePath("/admin/creators");
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
  const user = await prisma.user.create({
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
  });

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
  const permissions = formData.getAll("permissions").map(String).filter((permission) => ADMIN_PERMISSIONS.includes(permission as never));

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
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: context.userId,
        actorRole: context.role,
        action: password.length >= 8 ? "admin_staff.updated_and_password_reset" : "admin_staff.updated",
        entityType: "admin_user",
        entityId: before.userId,
        beforeJson: { status: before.user.status, level: before.level, dataScope: before.dataScope, permissions: before.permissions },
        afterJson: { status, level, dataScope, permissions, wechat: text(formData.get("wechat")) },
      },
    });
  });
  revalidatePath("/admin/staff");
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
          country: parsed.data.country,
          languages: csv(formData.get("languages")),
          categories: csv(formData.get("categories")),
          contentTypes: csv(formData.get("contentTypes")),
          reviewStatus: ReviewStatus.APPROVED,
          level: (text(formData.get("level")) as CreatorLevel) || CreatorLevel.NEW,
          responsibleAdminId,
          isDemo,
          wallet: { create: { currency: text(formData.get("currency")) || "USD" } },
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
            country: "新加坡",
            languages: ["中文", "英语"],
            categories: ["AI", "SaaS"],
            contentTypes: ["短视频"],
            reviewStatus: ReviewStatus.APPROVED,
            level: CreatorLevel.PRO,
            responsibleAdminId: context.profile.id,
            isDemo: true,
            wallet: { create: { currency: "USD" } },
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
        objective: "注册",
        targetPlatforms: ["TikTok", "YouTube Shorts"],
        targetCountries: ["新加坡", "美国"],
        targetLanguages: ["中文", "英语"],
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        totalBudget: 12000,
        creatorBudget: 7800,
        platformFee: 4200,
        baseReward: 260,
        brief: "展示演示 AI 工具如何帮助团队把创作者投放流程跑通，避免夸大承诺。",
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
        currency: "USD",
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
  productName: z.string().optional(),
  landingUrl: z.string().optional(),
  industry: z.string().min(2),
  objective: z.string().min(1),
  targetPlatforms: z.array(z.string()).min(1),
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
});

export async function createCampaignAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const brand = await prisma.brandProfile.findUnique({ where: { userId: session.userId }, include: { user: true } });
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
  });
  if (!parsed.success) redirect("/brand/campaigns/new?error=Validation%20failed");

  const intent = text(formData.get("intent"));
  const campaign = await prisma.campaign.create({
    data: {
      ...parsed.data,
      brandId: brand.id,
      isDemo: brand.isDemo,
      description: parsed.data.brief.slice(0, 240),
      targetAudience: text(formData.get("targetAudience")),
      disclosureRequired: formData.get("disclosureRequired") === "on",
      maxPerCreator: Number(text(formData.get("maxPerCreator")) || 1),
      status: intent === "submit" ? CampaignStatus.PENDING_REVIEW : CampaignStatus.DRAFT,
      bonusRules: {
        views: text(formData.get("viewsBonus")),
        clicks: text(formData.get("clicksBonus")),
        conversions: text(formData.get("conversionBonus")),
      },
    },
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
    action: intent === "submit" ? "campaign.submitted" : "campaign.draft_created",
    entityType: "campaign",
    entityId: campaign.id,
    afterJson: { status: campaign.status, title: campaign.title },
  });
  redirect(`/brand/campaigns/${campaign.id}`);
}

export async function submitExistingCampaignAction(campaignId: string) {
  const session = await requireRole(UserRole.BRAND);
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { brand: true } });
  if (!campaign || campaign.brand.userId !== session.userId) redirect("/403");
  if (campaign.status !== CampaignStatus.DRAFT) redirect(`/brand/campaigns/${campaignId}`);
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: CampaignStatus.PENDING_REVIEW } });
  await audit({
    action: "campaign.submitted",
    entityType: "campaign",
    entityId: campaignId,
    beforeJson: { status: CampaignStatus.DRAFT },
    afterJson: { status: CampaignStatus.PENDING_REVIEW },
  });
  redirect(`/brand/campaigns/${campaignId}`);
}

const brandInvoiceSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(3),
  note: z.string().optional(),
  campaignId: z.string().optional(),
});

export async function requestBrandInvoiceAction(formData: FormData) {
  const session = await requireRole(UserRole.BRAND);
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: { campaigns: true, responsibleAdmin: true },
  });
  if (!brand) redirect("/brand/billing");
  const parsed = brandInvoiceSchema.safeParse({
    amount: text(formData.get("amount")),
    currency: text(formData.get("currency")) || "USD",
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
        status: "REQUESTED",
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
  if (!invoice || invoice.status === "PAID" || invoice.status === "VOID") redirect("/brand/billing");

  const proof = formData.get("paymentProof");
  const uploadedProof = proof instanceof File && proof.size > 0 ? await saveUploadedFile(proof, `invoices/${invoice.id}`) : null;
  const method = text(formData.get("paymentMethod")) || "Bank transfer";
  const paymentProofUrl = uploadedProof || text(formData.get("paymentProofUrl"));

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAYMENT_SUBMITTED",
        paymentMethod: method,
        paymentProofUrl: paymentProofUrl || null,
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
        afterJson: { status: "PAYMENT_SUBMITTED", paymentMethod: method },
      },
    });
  });
  redirect("/brand/billing?payment=1");
}

export async function updateInvoiceStatusAction(invoiceId: string, formData: FormData) {
  const session = await requireAdminPermission("payment.manage");
  const action = text(formData.get("action"));
  const note = text(formData.get("note"));
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { brand: true } });
  if (!invoice) redirect("/admin/payments");

  const invoiceNumber = invoice.invoiceNumber || `INV-${new Date().getFullYear()}-${invoice.id.slice(-6).toUpperCase()}`;
  const statusMap: Record<string, string> = {
    issue: "OPEN",
    paid: "PAID",
    reject: "REJECTED",
    void: "VOID",
  };
  const nextStatus = statusMap[action];
  if (!nextStatus) redirect("/admin/payments");

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: nextStatus,
        invoiceNumber,
        note: note || invoice.note,
        paidAt: nextStatus === "PAID" ? new Date() : invoice.paidAt,
      },
    });
    if (nextStatus === "PAID" && invoice.status !== "PAID") {
      await tx.brandProfile.update({
        where: { id: invoice.brandId },
        data: { budgetBalance: { increment: invoice.amount } },
      });
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
  });
  revalidatePath("/admin/payments");
  revalidatePath(`/brand/billing`);
}

export async function adminCampaignAction(campaignId: string, formData: FormData) {
  await requireAdminPermission("campaign.manage");
  const action = text(formData.get("action"));
  const reviewNote = text(formData.get("reviewNote"));
  const before = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!before) redirect("/admin/campaigns");
  if (action === "reject" && reviewNote.length < 3) redirect(`/admin/campaigns/${campaignId}?error=Reject%20reason%20required`);

  const statusMap: Record<string, CampaignStatus> = {
    approve: CampaignStatus.ACTIVE,
    reject: CampaignStatus.REJECTED,
    pause: CampaignStatus.PAUSED,
    resume: CampaignStatus.ACTIVE,
    complete: CampaignStatus.COMPLETED,
    archive: CampaignStatus.ARCHIVED,
  };
  const nextStatus = statusMap[action];
  if (!nextStatus) redirect(`/admin/campaigns/${campaignId}`);

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({ where: { id: campaignId }, data: { status: nextStatus, reviewNote } });
    await tx.auditLog.create({
      data: {
        action: "campaign.status_changed",
        entityType: "campaign",
        entityId: campaignId,
        beforeJson: { status: before.status },
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
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: { user: true, socialAccounts: true },
  });
  const task = await prisma.campaignTask.findUnique({
    where: { id: taskId },
    include: { campaign: true },
  });
  if (!creator || !task) redirect("/creator/marketplace");
  if (creator.user.status === UserStatus.FROZEN || creator.reviewStatus === ReviewStatus.FROZEN) redirect("/403");
  if (!creator.displayName || !creator.country || creator.socialAccounts.length === 0) {
    redirect(`/creator/tasks/${taskId}?error=Complete%20profile%20and%20add%20a%20social%20account%20first`);
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

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.taskApplication.create({
      data: {
        taskId,
        creatorId: creator.id,
        status: ApplicationStatus.APPLIED,
        applicationNote: text(formData.get("applicationNote")) || "创作者已确认任务规则，等待品牌或平台审核。",
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "task.applied",
        entityType: "task",
        entityId: taskId,
        afterJson: { applicationId: app.id },
      },
    });
    return app;
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
  revalidatePath(`/admin/campaigns/${application.task.campaignId}`);
  revalidatePath(`/brand/campaigns/${application.task.campaignId}`);
}

async function getOwnedApplication(applicationId: string, userId: string) {
  return prisma.taskApplication.findFirst({
    where: { id: applicationId, creator: { userId } },
    include: {
      creator: { include: { user: true } },
      task: { include: { campaign: true } },
      drafts: { orderBy: { createdAt: "desc" }, take: 1 },
      submissions: { orderBy: { createdAt: "desc" }, take: 1, include: { proofs: true, reviews: { orderBy: { createdAt: "desc" } } } },
    },
  });
}

export async function saveDraftAction(applicationId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const application = await getOwnedApplication(applicationId, session.userId);
  if (!application || application.status !== ApplicationStatus.APPROVED) redirect("/creator/my-tasks");
  const risk = await checkSensitiveText([
    text(formData.get("title")),
    text(formData.get("script")),
    text(formData.get("caption")),
    text(formData.get("coverText")),
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
      aiGeneratedRaw: { provider: text(formData.get("provider")) || "manual" },
      creatorEditedText: text(formData.get("script")),
      riskCheckResult: risk,
      status: risk.blocked ? DraftStatus.BLOCKED : DraftStatus.DRAFT,
    },
  });
  await audit({ action: "content_draft.saved", entityType: "content_draft", entityId: draft.id, afterJson: { risk } });
  redirect(`/creator/content-studio/${applicationId}?saved=1`);
}

export async function submitContentAction(applicationId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const application = await getOwnedApplication(applicationId, session.userId);
  if (!application || application.status !== ApplicationStatus.APPROVED) redirect("/creator/my-tasks");
  const risk = await checkSensitiveText([
    text(formData.get("title")),
    text(formData.get("script")),
    text(formData.get("caption")),
    text(formData.get("coverText")),
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
        riskCheckResult: risk,
        status: DraftStatus.BLOCKED,
      },
    });
    await audit({ action: "content_draft.blocked", entityType: "content_draft", entityId: draft.id, afterJson: { risk } });
    redirect(`/creator/content-studio/${applicationId}?error=${encodeURIComponent(`Sensitive words: ${risk.hits.join(", ")}`)}`);
  }

  const submission = await prisma.$transaction(async (tx) => {
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
        aiGeneratedRaw: { provider: text(formData.get("provider")) || "manual" },
        creatorEditedText: text(formData.get("script")),
        riskCheckResult: risk,
        status: DraftStatus.SUBMITTED,
      },
    });
    const sub = await tx.submission.create({
      data: {
        applicationId,
        draftId: draft.id,
        creatorId: application.creatorId,
        campaignId: application.task.campaignId,
        status: SubmissionStatus.SUBMITTED,
      },
    });
    await tx.notification.create({
      data: {
        userId: application.task.campaign.brandId
          ? (await tx.brandProfile.findUnique({ where: { id: application.task.campaign.brandId } }))!.userId
          : session.userId,
        title: "新内容待审核",
        body: `${application.creator.displayName} 提交了 ${application.task.title} 内容。`,
        href: `/brand/campaigns/${application.task.campaignId}/submissions`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "submission.created",
        entityType: "submission",
        entityId: sub.id,
        afterJson: { status: sub.status },
      },
    });
    return sub;
  });
  redirect(`/creator/my-tasks/${applicationId}?submitted=${submission.id}`);
}

export async function reviewSubmissionAction(submissionId: string, formData: FormData) {
  const session = await requireRole([UserRole.ADMIN, UserRole.BRAND]);
  const decision = text(formData.get("decision")) as ReviewDecision;
  const comment = text(formData.get("comment"));
  if (comment.length < 2) redirect(session.role === UserRole.ADMIN ? `/admin/submissions?error=Review%20comment%20required` : `/brand?error=Review%20comment%20required`);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { campaign: { include: { brand: true } }, creator: { include: { user: true } } },
  });
  if (!submission) redirect("/admin/submissions");
  if (session.role === UserRole.BRAND && submission.campaign.brand.userId !== session.userId) redirect("/403");

  const next =
    decision === ReviewDecision.APPROVED
      ? SubmissionStatus.APPROVED
      : decision === ReviewDecision.REVISION_REQUESTED
        ? SubmissionStatus.REVISION_REQUESTED
        : SubmissionStatus.REJECTED;

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
    await tx.submissionReview.create({
      data: {
        submissionId,
        reviewerId: session.userId,
        reviewerRole: session.role,
        decision,
        comment,
        riskPoints: csv(formData.get("riskPoints")),
      },
    });
    await tx.notification.create({
      data: {
        userId: submission.creator.userId,
        title: `内容审核结果：${next}`,
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
        beforeJson: { status: submission.status },
        afterJson: { status: next, comment },
      },
    });
  });

  revalidatePath(session.role === UserRole.ADMIN ? "/admin/submissions" : `/brand/campaigns/${submission.campaignId}/submissions`);
}

export async function submitProofAction(submissionId: string, formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, creator: { userId: session.userId } },
    include: { campaign: true, creator: true, proofs: true, application: { include: { task: true } } },
  });
  if (!submission || submission.status !== SubmissionStatus.APPROVED) redirect("/creator/my-tasks");
  if (!submission.campaign.allowMultiPlatformProof) {
    const activeProof = submission.proofs.find((proof) => proof.verificationStatus !== ProofStatus.REJECTED);
    if (activeProof) redirect(`/creator/my-tasks/${submission.applicationId}?error=Proof%20already%20submitted`);
  }

  const screenshot = formData.get("screenshot");
  const screenshotUrl = screenshot instanceof File ? await saveUploadedFile(screenshot, `proofs/${submission.id}`) : null;

  const proof = await prisma.$transaction(async (tx) => {
    const created = await tx.proof.create({
      data: {
        submissionId,
        creatorId: submission.creatorId,
        campaignId: submission.campaignId,
        platform: submission.application.task.platform,
        postUrl: text(formData.get("postUrl")),
        screenshotUrl: screenshotUrl || text(formData.get("screenshotUrl")) || null,
        publishedAt: new Date(text(formData.get("publishedAt")) || Date.now()),
        views: Number(text(formData.get("views")) || 0),
        likes: Number(text(formData.get("likes")) || 0),
        comments: Number(text(formData.get("comments")) || 0),
        shares: Number(text(formData.get("shares")) || 0),
        saves: Number(text(formData.get("saves")) || 0),
        clicks: Number(text(formData.get("clicks")) || 0),
        conversions: Number(text(formData.get("conversions")) || 0),
        verificationStatus: ProofStatus.PENDING,
      },
    });
    await tx.submission.update({ where: { id: submissionId }, data: { status: SubmissionStatus.PROOF_SUBMITTED } });
    await tx.notification.create({
      data: {
        userId: session.userId,
        title: "Proof 已提交",
        body: "Admin 验证通过后会进入结算。",
        href: `/creator/my-tasks/${submission.applicationId}`,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "proof.submitted",
        entityType: "proof",
        entityId: created.id,
        afterJson: { postUrl: created.postUrl },
      },
    });
    return created;
  });
  redirect(`/creator/my-tasks/${submission.applicationId}?proof=${proof.id}`);
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
    await prisma.$transaction(async (tx) => {
      await tx.proof.update({ where: { id: proofId }, data: { verificationStatus: ProofStatus.VERIFIED, adminNote: note } });
      await tx.submission.update({ where: { id: proof.submissionId }, data: { status: SubmissionStatus.VERIFIED } });
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
      const wallet = proof.submission.creator.wallet;
      if (wallet) {
        const exists = await tx.walletTransaction.findFirst({
          where: {
            relatedSubmissionId: proof.submissionId,
            type: WalletTxType.EARNING,
            status: { in: [WalletTxStatus.PENDING, WalletTxStatus.APPROVED, WalletTxStatus.PAID] },
          },
        });
        if (!exists) {
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              creatorId: proof.creatorId,
              type: WalletTxType.EARNING,
              amount: proof.submission.application.task.rewardAmount,
              currency: wallet.currency,
              status: WalletTxStatus.PENDING,
              relatedSubmissionId: proof.submissionId,
              isDemo: proof.campaign.isDemo,
              note: "Auto-generated after proof verification.",
            },
          });
        }
      }
      await tx.notification.create({
        data: {
          userId: proof.submission.creator.userId,
          title: "Proof 已验证",
          body: "任务已进入待结算。",
          href: `/creator/my-tasks/${proof.submission.applicationId}`,
        },
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
    await prisma.$transaction(async (tx) => {
      await tx.proof.update({ where: { id: proofId }, data: { verificationStatus: ProofStatus.REJECTED, adminNote: note } });
      await tx.submission.update({ where: { id: proof.submissionId }, data: { status: SubmissionStatus.APPROVED } });
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

export async function approveEarningAction(transactionId: string) {
  const session = await requireAdminPermission("payment.manage");
  const txRecord = await prisma.walletTransaction.findUnique({
    where: { id: transactionId },
    include: { wallet: true },
  });
  if (!txRecord || txRecord.type !== WalletTxType.EARNING || txRecord.status !== WalletTxStatus.PENDING) {
    redirect("/admin/payments");
  }
  await prisma.$transaction(async (tx) => {
    await tx.walletTransaction.update({ where: { id: transactionId }, data: { status: WalletTxStatus.APPROVED } });
    await tx.wallet.update({
      where: { id: txRecord.walletId },
      data: {
        availableBalance: { increment: txRecord.amount },
        cumulativeIncome: { increment: txRecord.amount },
      },
    });
    await tx.creatorProfile.update({
      where: { id: txRecord.creatorId },
      data: { cumulativeIncome: { increment: txRecord.amount }, completedTasks: { increment: 1 } },
    });
    if (txRecord.relatedSubmissionId) {
      await tx.submission.update({ where: { id: txRecord.relatedSubmissionId }, data: { status: SubmissionStatus.SETTLED } });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: session.userId,
        actorRole: session.role,
        action: "wallet.earning_approved",
        entityType: "wallet_transaction",
        entityId: transactionId,
        afterJson: { amount: String(txRecord.amount) },
      },
    });
  });
  revalidatePath("/admin/payments");
}

export async function requestWithdrawalAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId }, include: { wallet: true } });
  if (!creator?.wallet) redirect("/creator/wallet");
  const amount = Number(text(formData.get("amount")) || 0);
  if (amount <= 0 || amount > Number(creator.wallet.availableBalance)) redirect("/creator/wallet?error=Invalid%20withdrawal%20amount");
  const method = text(formData.get("payoutMethod")) || "USDT";
  const details = text(formData.get("payoutDetails"));

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
        note: "Withdrawal requested and balance frozen.",
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
  const session = await requireAdminPermission("payment.manage");
  const action = text(formData.get("action"));
  const note = text(formData.get("adminNote"));
  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: { wallet: true, transactions: true },
  });
  if (!request) redirect("/admin/payments");

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

export async function updateCreatorProfileAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
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
        update: {
          payoutWalletAddress: text(formData.get("payoutWalletAddress")) || null,
        },
      },
    },
  });
  await audit({ action: "creator.profile_updated", entityType: "creator", entityId: session.userId });
  revalidatePath("/creator/profile");
}

export async function addSocialAccountAction(formData: FormData) {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId } });
  if (!creator) redirect("/creator/profile");
  await prisma.socialAccount.create({
    data: {
      creatorId: creator.id,
      platform: text(formData.get("platform")),
      accountName: text(formData.get("accountName")),
      accountUrl: text(formData.get("accountUrl")),
      followers: Number(text(formData.get("followers")) || 0),
      avgViews: Number(text(formData.get("avgViews")) || 0),
      contentType: text(formData.get("contentType")),
      country: text(formData.get("country")),
      language: text(formData.get("language")),
      verified: false,
      verificationStatus: SocialVerificationStatus.PENDING,
      verificationNote: "等待平台审核账号链接和基础数据。",
    },
  });
  await audit({ action: "creator.social_account_added", entityType: "creator", entityId: creator.id });
  revalidatePath("/creator/profile");
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
}

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireRole([UserRole.ADMIN, UserRole.BRAND, UserRole.CREATOR]);
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.userId },
    data: { unread: false },
  });
  revalidatePath("/");
}
