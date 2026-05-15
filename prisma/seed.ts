import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AdminDataScope,
  AdminLevel,
  ApplicationStatus,
  CampaignStatus,
  CreatorLevel,
  DraftStatus,
  PrismaClient,
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
  ComplianceRuleType,
} from "@prisma/client";

const adminPermissions = [
  "staff.manage",
  "account.create",
  "account.freeze",
  "account.reset_password",
  "campaign.manage",
  "content.review",
  "proof.review",
  "payment.manage",
  "compliance.manage",
  "reports.view",
  "audit.view",
  "demo.manage",
];

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function passwordHash() {
  return bcrypt.hash("password123", 10);
}

async function main() {
  await prisma.$transaction([
    prisma.brandLedgerTransaction.deleteMany(),
    prisma.brandRefundRequest.deleteMany(),
    prisma.walletTransaction.deleteMany(),
    prisma.withdrawalRequest.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.metricsSnapshot.deleteMany(),
    prisma.proof.deleteMany(),
    prisma.submissionReview.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.contentDraft.deleteMany(),
    prisma.taskApplication.deleteMany(),
    prisma.brandMessage.deleteMany(),
    prisma.brandRequest.deleteMany(),
    prisma.campaignTask.deleteMany(),
    prisma.campaignAsset.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.socialAccount.deleteMany(),
    prisma.brandProfile.deleteMany(),
    prisma.creatorProfile.deleteMany(),
    prisma.invitationAttribution.deleteMany(),
    prisma.invitationCode.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.complianceRule.deleteMany(),
    prisma.riskFlag.deleteMany(),
    prisma.dispute.deleteMany(),
    prisma.platformSettings.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const hash = await passwordHash();

  await prisma.platformSettings.create({
    data: {
      id: "platform",
      acceptanceSlaDays: 3,
      highValueReviewThreshold: 50,
      resubmissionGraceDays: 2,
      minimumWithdrawalAmount: 20,
      kolPreviewMaxMb: 50,
      platformFeeRate: 0,
      platformContactEmail: "support@tanglin.local",
      riskIndustryKeywords: ["金融", "医疗", "医美", "保健", "投资", "教育", "减肥", "母婴"],
      riskIndustryPrompt: "该行业容易涉及效果承诺、资质证明或监管要求。请确认 brief 不包含夸大承诺，并准备必要资质。",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      passwordHash: hash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          displayName: "平台创始人",
          level: AdminLevel.FOUNDER,
          permissions: adminPermissions,
          dataScope: AdminDataScope.ALL,
          teamName: "创始人办公室",
          wechat: "xiaohuangque_ops",
        },
      },
    },
  });
  const adminProfile = await prisma.adminProfile.findUniqueOrThrow({ where: { userId: admin.id } });

  await prisma.user.create({
    data: {
      email: "bd@test.com",
      passwordHash: hash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          displayName: "BD Sarah",
          level: AdminLevel.STAFF,
          permissions: ["account.create", "reports.view"],
          dataScope: AdminDataScope.ASSIGNED,
          teamName: "商务运营组",
          wechat: "bd_sarah",
          createdById: admin.id,
          invitationCodes: {
            create: {
              code: "BD2026",
              active: true,
              createdById: admin.id,
            },
          },
        },
      },
    },
  });

  const brandUser = await prisma.user.create({
    data: {
      email: "brand@test.com",
      passwordHash: hash,
      role: UserRole.BRAND,
      status: UserStatus.ACTIVE,
      brandProfile: {
        create: {
          brandName: "小黄雀实验室",
          companyName: "小黄雀实验室有限公司",
          contactName: "Mira Chen",
          email: "brand@test.com",
          telegram: "@tanglinlabs",
          whatsapp: "+65 8888 0000",
          website: "https://tanglin.example",
          industry: "AI 工具",
          country: "新加坡",
          logoUrl: "/file.svg",
          description: "通过创作者内容推动 AI 产品增长的团队。",
          reviewStatus: ReviewStatus.APPROVED,
          riskLevel: RiskLevel.LOW,
          responsibleAdminId: adminProfile.id,
        },
      },
    },
    include: { brandProfile: true },
  });

  const brandUser2 = await prisma.user.create({
    data: {
      email: "brand2@test.com",
      passwordHash: hash,
      role: UserRole.BRAND,
      status: UserStatus.ACTIVE,
      brandProfile: {
        create: {
          brandName: "北星钱包",
          companyName: "北星金融科技有限公司",
          contactName: "Jon Rivera",
          email: "brand2@test.com",
          website: "https://northstar.example",
          industry: "金融科技",
          country: "美国",
          description: "面向全球自由职业者的钱包产品。",
          reviewStatus: ReviewStatus.PENDING,
          riskLevel: RiskLevel.MEDIUM,
          responsibleAdminId: adminProfile.id,
        },
      },
    },
    include: { brandProfile: true },
  });

  const creators = await Promise.all(
    [
      ["creator@test.com", "雀仔增长", "新加坡", CreatorLevel.VERIFIED, 92],
      ["creator2@test.com", "Maya 短视频", "美国", CreatorLevel.PRO, 88],
      ["creator3@test.com", "Ken 加密中文", "中国香港", CreatorLevel.VERIFIED, 76],
      ["creator4@test.com", "Rina 评测", "日本", CreatorLevel.NEW, 64],
      ["creator5@test.com", "Leo B2B", "英国", CreatorLevel.ELITE, 95],
    ].map(([email, displayName, country, level, completionRate], index) =>
      prisma.user.create({
        data: {
          email: String(email),
          passwordHash: hash,
          role: UserRole.CREATOR,
          status: UserStatus.ACTIVE,
          creatorProfile: {
            create: {
              displayName: String(displayName),
              email: String(email),
              shareCode: `KOC${String(index + 1).padStart(5, "0")}`,
              country: String(country),
              languages: ["英语", "中文"],
              categories: ["AI", "SaaS", "金融科技"],
              contentTypes: ["短视频", "口播"],
              bio: "专注于实用产品讲解和转化型内容的创作者。",
              level: level as CreatorLevel,
              reviewStatus: ReviewStatus.APPROVED,
              riskLevel: RiskLevel.LOW,
              responsibleAdminId: adminProfile.id,
              completionRate: Number(completionRate),
              cumulativeIncome: Number(completionRate) * 12,
              completedTasks: Math.floor(Number(completionRate) / 10),
              socialAccounts: {
                create: [
                  {
                    platform: "TikTok",
                    accountName: String(displayName).replaceAll(" ", "").toLowerCase(),
                    accountUrl: "https://tiktok.com/@creator",
                    followers: 32000 + Number(completionRate) * 100,
                    avgViews: 8000 + Number(completionRate) * 60,
                    contentType: "短视频",
                    country: String(country),
                    language: "英语",
                    verified: true,
                    verificationStatus: SocialVerificationStatus.VERIFIED,
                    verifiedAt: new Date(),
                  },
                ],
              },
              wallet: {
                create: {
                  availableBalance: Number(completionRate),
                  cumulativeIncome: Number(completionRate) * 12,
                  currency: "CNY",
                },
              },
            },
          },
        },
        include: { creatorProfile: { include: { wallet: true } } },
      }),
    ),
  );

  const creator = creators[0].creatorProfile!;
  const creator2 = creators[1].creatorProfile!;
  const brand = brandUser.brandProfile!;
  const brand2 = brandUser2.brandProfile!;

  const campaign1 = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      title: "AI 研究助手创作者发布",
      productName: "小黄雀研究助手",
      landingUrl: "https://tanglin.example/copilot",
      industry: "AI 工具",
      description: "面向 AI 研究助手的创作者发布活动。",
      objective: "注册",
      targetPlatforms: ["TikTok", "YouTube Shorts", "Instagram Reels"],
      targetCountries: ["新加坡", "美国", "英国"],
      targetLanguages: ["英语", "中文"],
      targetAudience: "创业者、分析师和 AI 深度用户。",
      startDate: new Date("2026-05-01T00:00:00Z"),
      endDate: new Date("2026-06-01T00:00:00Z"),
      totalBudget: 15000,
      creatorBudget: 10500,
      platformFee: 4500,
      baseReward: 180,
      bonusRules: { views: "每额外 1 万次已验证播放奖励 CNY 20", clicks: "每个已验证点击奖励 CNY 1" },
      brief: "说明小黄雀研究助手如何把分散资料快速整理成可核验的发布简报。表达要务实，不承诺收益或效果。",
      mustInclude: ["AI 研究助手", "来源可追溯简报", "发布前人工确认"],
      mustNotInclude: ["保证收益", "官方合作虚假声明", "零风险收入"],
      visualRequirements: ["展示后台", "展示研究流程前后对比"],
      hashtags: ["#AICreator", "#Productivity", "#FounderTools"],
      cta: "领取免费发布简报模板。",
      disclosureRequired: true,
      status: CampaignStatus.ACTIVE,
      slotsTotal: 8,
      maxPerCreator: 1,
      assets: {
        create: [
          { kind: "标志", name: "小黄雀标志", url: "/file.svg" },
          { kind: "简报", name: "创作者一页简报", url: "/sample-assets/tanglin-brief.pdf" },
        ],
      },
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      title: "B2B 演示周推广",
      productName: "小黄雀演示套件",
      landingUrl: "https://tanglin.example/demo",
      industry: "AI 工具",
      description: "通过创作者内容提升产品团队的演示预约意向。",
      objective: "留资",
      targetPlatforms: ["LinkedIn", "YouTube Shorts"],
      targetCountries: ["美国", "英国"],
      targetLanguages: ["英语"],
      targetAudience: "B2B 产品负责人和增长负责人。",
      startDate: new Date("2026-05-10T00:00:00Z"),
      endDate: new Date("2026-06-10T00:00:00Z"),
      totalBudget: 9000,
      creatorBudget: 6200,
      platformFee: 2800,
      baseReward: 240,
      brief: "制作一条教育型短视频，说明团队如何减少手动推广规划工作。",
      mustInclude: ["工作流", "演示预约", "团队使用场景"],
      mustNotInclude: ["保证线索", "虚假案例"],
      hashtags: ["#B2BMarketing", "#AIWorkflow"],
      cta: "预约产品演示。",
      disclosureRequired: true,
      status: CampaignStatus.PENDING_REVIEW,
      slotsTotal: 5,
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      brandId: brand2.id,
      title: "自由职业钱包认知推广",
      productName: "北星钱包",
      landingUrl: "https://northstar.example",
      industry: "金融科技",
      description: "面向自由职业者收款场景的认知推广。",
      objective: "下载",
      targetPlatforms: ["TikTok", "X", "Reddit"],
      targetCountries: ["美国", "中国香港"],
      targetLanguages: ["英语", "中文"],
      targetAudience: "自由职业者和数字游民。",
      startDate: new Date("2026-04-15T00:00:00Z"),
      endDate: new Date("2026-05-20T00:00:00Z"),
      totalBudget: 12000,
      creatorBudget: 8000,
      platformFee: 4000,
      baseReward: 160,
      brief: "分享实用的自由职业者收款流程，必须包含商业披露，避免投资建议表达。",
      mustInclude: ["自由职业收款", "费用对比", "人工确认"],
      mustNotInclude: ["投资建议", "保证省钱", "替代银行"],
      hashtags: ["#FreelancerLife", "#Payments"],
      cta: "下载并对比费用。",
      disclosureRequired: true,
      status: CampaignStatus.ACTIVE,
      slotsTotal: 6,
    },
  });

  const taskInputs = [
    [campaign1.id, "TikTok 创始人视角", "TikTok", "短视频", 180, 4, CreatorLevel.VERIFIED],
    [campaign1.id, "YouTube Shorts 教程短视频", "YouTube Shorts", "短视频", 220, 2, CreatorLevel.VERIFIED],
    [campaign1.id, "Instagram 工作流短视频", "Instagram Reels", "短视频", 180, 2, CreatorLevel.NEW],
    [campaign1.id, "TikTok 创始人案例", "TikTok", "口播", 260, 1, CreatorLevel.PRO],
    [campaign2.id, "LinkedIn 产品演示", "LinkedIn", "短视频", 240, 3, CreatorLevel.PRO],
    [campaign2.id, "YouTube 演示剪辑", "YouTube Shorts", "短视频", 220, 2, CreatorLevel.VERIFIED],
    [campaign3.id, "TikTok 自由职业流程", "TikTok", "短视频", 160, 3, CreatorLevel.NEW],
    [campaign3.id, "X 长帖拆解", "X", "长帖", 120, 2, CreatorLevel.NEW],
    [campaign3.id, "Reddit 教育帖", "Reddit", "图文帖", 140, 1, CreatorLevel.VERIFIED],
    [campaign3.id, "TikTok 收款误区澄清", "TikTok", "短视频", 210, 1, CreatorLevel.PRO],
  ] as const;

  const tasks = await Promise.all(
    taskInputs.map(([campaignId, title, platform, contentType, rewardAmount, slotsTotal, creatorLevelRequired]) =>
      prisma.campaignTask.create({
        data: {
          campaignId,
          title,
          platform,
          contentType,
          rewardAmount,
          slotsTotal,
          creatorLevelRequired,
          deadline: new Date("2026-05-25T00:00:00Z"),
          status: TaskStatus.ACTIVE,
        },
      }),
    ),
  );

  const approvedApp = await prisma.taskApplication.create({
    data: {
      taskId: tasks[0].id,
      creatorId: creator.id,
      status: ApplicationStatus.APPROVED,
      approvedAt: new Date(),
      applicationNote: "种子数据：已通过申请，可进入内容工作台。",
    },
  });
  await prisma.campaignTask.update({ where: { id: tasks[0].id }, data: { slotsTaken: 1 } });

  const draft = await prisma.contentDraft.create({
    data: {
      applicationId: approvedApp.id,
      creatorId: creator.id,
      campaignId: campaign1.id,
      platform: "TikTok",
      title: "这个 AI 把混乱发布资料整理成正式简报",
      script: "开场：你的发布简报不应该从空白页开始。展示混乱的资料文件夹，再展示小黄雀研究助手生成带来源的提纲，最后提醒观众发布前必须人工确认。",
      caption: "给创始人的实用 AI 工作流：把混乱资料整理成更清晰的发布简报。",
      hashtags: ["#AICreator", "#FounderTools"],
      coverText: "从混乱资料到发布简报",
      aiGeneratedRaw: { provider: "mock", mode: "教程教学型" },
      creatorEditedText: "已按创作者直接教学风格调整。",
      riskCheckResult: { blocked: false, hits: [] },
      status: DraftStatus.SUBMITTED,
    },
  });

  const submission = await prisma.submission.create({
    data: {
      applicationId: approvedApp.id,
      draftId: draft.id,
      creatorId: creator.id,
      campaignId: campaign1.id,
      status: SubmissionStatus.APPROVED,
      approvedAt: new Date(),
      reviews: {
        create: {
          reviewerId: brandUser.id,
          reviewerRole: UserRole.BRAND,
          decision: ReviewDecision.APPROVED,
          comment: "已通过。披露清楚，没有高风险承诺。",
        },
      },
    },
  });

  const proof = await prisma.proof.create({
    data: {
      submissionId: submission.id,
      creatorId: creator.id,
      campaignId: campaign1.id,
      platform: "TikTok",
      postUrl: "https://tiktok.com/@creator/video/seed",
      normalizedPostUrl: "https://tiktok.com/@creator/video/seed",
      screenshotUrl: "/sample-assets/proof.png",
      publishedAt: new Date("2026-04-25T10:30:00Z"),
      views: 28400,
      likes: 2140,
      comments: 188,
      shares: 420,
      saves: 310,
      clicks: 360,
      conversions: 41,
      verificationStatus: ProofStatus.VERIFIED,
      adminNote: "种子数据：指标已验证。",
    },
  });

  await prisma.metricsSnapshot.create({
    data: {
      proofId: proof.id,
      campaignId: campaign1.id,
      views: 28400,
      likes: 2140,
      comments: 188,
      shares: 420,
      saves: 310,
      clicks: 360,
      conversions: 41,
    },
  });

  const pendingReviewApp = await prisma.taskApplication.create({
    data: {
      taskId: tasks[1].id,
      creatorId: creator2.id,
      status: ApplicationStatus.APPROVED,
      approvedAt: new Date(),
    },
  });
  await prisma.campaignTask.update({ where: { id: tasks[1].id }, data: { slotsTaken: 1 } });

  const pendingDraft = await prisma.contentDraft.create({
    data: {
      applicationId: pendingReviewApp.id,
      creatorId: creator2.id,
      campaignId: campaign1.id,
      platform: "YouTube Shorts",
      title: "别再手动重写发布简报",
      script: "展示产品团队如何把访谈笔记整理成可用的推广简报。保持工作流教学表达，不承诺收入或转化提升。",
      caption: "AI 可以帮助团队梳理混乱的发布思路。",
      hashtags: ["#AIWorkflow", "#ProductLaunch"],
      coverText: "告别混乱简报",
      status: DraftStatus.SUBMITTED,
      riskCheckResult: { blocked: false, hits: [] },
    },
  });

  await prisma.submission.create({
    data: {
      applicationId: pendingReviewApp.id,
      draftId: pendingDraft.id,
      creatorId: creator2.id,
      campaignId: campaign1.id,
      status: SubmissionStatus.SUBMITTED,
    },
  });

  const wallet = creator.wallet!;
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      creatorId: creator.id,
      type: WalletTxType.EARNING,
      amount: 180,
      currency: "CNY",
      status: WalletTxStatus.APPROVED,
      relatedSubmissionId: submission.id,
      note: "种子数据：收益已确认。",
    },
  });

  await prisma.withdrawalRequest.create({
    data: {
      walletId: wallet.id,
      creatorId: creator.id,
      amount: 50,
      currency: "CNY",
      payoutMethod: "人工转账",
      payoutDetails: { account: "seed-payout-account" },
      status: WithdrawalStatus.PENDING,
    },
  });

  await prisma.complianceRule.createMany({
    data: [
      {
        type: ComplianceRuleType.SENSITIVE_WORD,
        keyword: "保证 ROI",
        severity: RiskLevel.HIGH,
        description: "禁止承诺财务收益或推广效果。",
        createdById: admin.id,
      },
      {
        type: ComplianceRuleType.SENSITIVE_WORD,
        keyword: "零风险收入",
        severity: RiskLevel.HIGH,
        description: "收益类表达需要严格证明，第一版默认拦截。",
        createdById: admin.id,
      },
      {
        type: ComplianceRuleType.PROHIBITED_EXPRESSION,
        keyword: "OpenAI 官方合作伙伴",
        severity: RiskLevel.HIGH,
        description: "除非品牌提供证明，否则禁止声称官方合作关系。",
        createdById: admin.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: "待审核 Campaign",
        body: "B2B 演示周推广正在等待审核。",
        href: `/admin/campaigns/${campaign2.id}`,
      },
      {
        userId: brandUser.id,
        title: "新内容待审核",
        body: "Maya 短视频提交了 YouTube Shorts 草稿。",
        href: `/brand/campaigns/${campaign1.id}/submissions`,
      },
      {
        userId: creators[0].id,
        title: "内容已通过",
        body: "AI 研究助手创作者发布的 TikTok 内容已通过审核。",
        href: `/creator/my-tasks/${approvedApp.id}`,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      actorRole: UserRole.ADMIN,
      action: "seed.initialized",
      entityType: "system",
      entityId: "seed",
      afterJson: { users: 8, campaigns: 3, tasks: 10 },
    },
  });

  console.log("种子数据已生成：");
  console.log("admin@test.com / password123");
  console.log("brand@test.com / password123");
  console.log("creator@test.com / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
