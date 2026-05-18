import Link from "next/link";
import {
  BrandLedgerTxStatus,
  BrandLedgerTxType,
  BrandRefundStatus,
  CampaignStatus,
  InvoiceStatus,
  ProofStatus,
  ReviewStatus,
  SocialVerificationStatus,
  SubmissionStatus,
  SupportTicketStatus,
  WalletTxStatus,
  WalletTxType,
  WithdrawalStatus,
} from "@prisma/client";
import { DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { getAdminContext } from "@/lib/admin";
import { money, number, percent, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function campaignTone(status: CampaignStatus) {
  if (status === CampaignStatus.ACTIVE) return "info" as const;
  if (status === CampaignStatus.COMPLETED) return "success" as const;
  if (status === CampaignStatus.REJECTED || status === CampaignStatus.CANCELLED) return "danger" as const;
  if (status === CampaignStatus.PAUSED || status === CampaignStatus.ARCHIVED || status === CampaignStatus.DRAFT) return "neutral" as const;
  return "warning" as const;
}

function submissionTone(status: SubmissionStatus) {
  if (status === SubmissionStatus.APPROVED || status === SubmissionStatus.VERIFIED || status === SubmissionStatus.SETTLED) return "success" as const;
  if (status === SubmissionStatus.REJECTED) return "danger" as const;
  if (status === SubmissionStatus.PROOF_SUBMITTED || status === SubmissionStatus.PUBLISHED || status === SubmissionStatus.SUBMITTED) return "info" as const;
  return "warning" as const;
}

function walletTxTone(status: string) {
  if (status === "APPROVED" || status === "PAID" || status === "CONFIRMED") return "success" as const;
  if (status === "REJECTED" || status === "FAILED" || status === "VOID") return "danger" as const;
  if (status === "PENDING" || status === "REQUESTED") return "warning" as const;
  return "neutral" as const;
}

export default async function AdminDashboard() {
  await getAdminContext();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    totalBrands,
    activeBrands,
    totalCreators,
    activeCreators,
    activeCampaigns,
    pendingCampaigns,
    pendingSubmissions,
    pendingProofs,
    pendingSocialAccounts,
    pendingCreatorReviews,
    pendingMemberships,
    pendingInvoices,
    pendingWithdrawals,
    pendingRefunds,
    pendingDisputes,
    pendingTickets,
    frozenEscrow,
    recognizedPlatformFees,
    todayIncome,
    todayRefunds,
    todayWithdrawals,
    failedProviderEvents,
    monthCampaigns,
    recentCampaigns,
    recentSubmissions,
    recentPayments,
  ] = await Promise.all([
    prisma.brandProfile.count({ where: { isDemo: false } }),
    prisma.brandProfile.count({ where: { reviewStatus: ReviewStatus.APPROVED, isDemo: false } }),
    prisma.creatorProfile.count({ where: { isDemo: false } }),
    prisma.creatorProfile.count({ where: { reviewStatus: ReviewStatus.APPROVED, isDemo: false } }),
    prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE, isDemo: false } }),
    prisma.campaign.count({ where: { status: CampaignStatus.PENDING_REVIEW, isDemo: false } }),
    prisma.submission.count({ where: { status: SubmissionStatus.SUBMITTED, campaign: { isDemo: false } } }),
    prisma.proof.count({ where: { verificationStatus: ProofStatus.PENDING, campaign: { isDemo: false } } }),
    prisma.socialAccount.count({ where: { verificationStatus: SocialVerificationStatus.PENDING, creator: { isDemo: false } } }),
    prisma.creatorProfile.count({ where: { reviewStatus: ReviewStatus.PENDING, isDemo: false } }),
    prisma.creatorMembershipApplication.count({ where: { status: "SUBMITTED", creator: { isDemo: false } } }),
    prisma.invoice.count({ where: { status: { in: [InvoiceStatus.OPEN, InvoiceStatus.PAYMENT_SUBMITTED, InvoiceStatus.REQUESTED] }, isDemo: false } }),
    prisma.withdrawalRequest.count({ where: { status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED] }, isDemo: false } }),
    prisma.brandRefundRequest.count({ where: { status: { in: [BrandRefundStatus.PENDING, BrandRefundStatus.APPROVED] }, isDemo: false } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "NEEDS_INFO"] }, campaign: { isDemo: false } } }),
    prisma.supportTicket.count({ where: { status: { in: [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS] } } }),
    prisma.brandProfile.aggregate({ where: { isDemo: false }, _sum: { frozenEscrowBalance: true } }),
    prisma.brandLedgerTransaction.aggregate({
      where: { type: BrandLedgerTxType.PLATFORM_FEE, status: BrandLedgerTxStatus.CONFIRMED, brand: { isDemo: false } },
      _sum: { amount: true },
    }),
    prisma.brandLedgerTransaction.aggregate({
      where: { type: BrandLedgerTxType.PAYMENT, status: BrandLedgerTxStatus.CONFIRMED, brand: { isDemo: false }, createdAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.brandRefundRequest.aggregate({
      where: { status: BrandRefundStatus.PAID, isDemo: false, refundedAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: WalletTxType.WITHDRAWAL, status: WalletTxStatus.PAID, isDemo: false, createdAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.paymentProviderEvent.count({ where: { status: "FAILED", createdAt: { gte: todayStart } } }),
    prisma.campaign.findMany({
      where: { isDemo: false, createdAt: { gte: monthStart } },
      select: { totalBudget: true, creatorBudget: true, platformFee: true },
    }),
    prisma.campaign.findMany({ where: { isDemo: false }, orderBy: { createdAt: "desc" }, take: 5, include: { brand: true } }),
    prisma.submission.findMany({ where: { campaign: { isDemo: false } }, orderBy: { createdAt: "desc" }, take: 5, include: { campaign: true, creator: true } }),
    prisma.walletTransaction.findMany({ where: { isDemo: false }, orderBy: { createdAt: "desc" }, take: 5, include: { creator: true } }),
  ]);

  const gmv = monthCampaigns.reduce((sum, campaign) => sum + Number(campaign.totalBudget), 0);
  const estimatedPlatformRevenue = monthCampaigns.reduce((sum, campaign) => sum + Number(campaign.platformFee), 0);
  const platformRevenue = Number(recognizedPlatformFees._sum.amount ?? 0);
  const creatorSpend = monthCampaigns.reduce((sum, campaign) => sum + Number(campaign.creatorBudget), 0);
  const margin = gmv ? (estimatedPlatformRevenue / gmv) * 100 : 0;

  const todos = [
    { title: "待确认付款", count: pendingInvoices, href: "/admin/payments", tone: "stone" as const, detail: "品牌付款、付款凭证和待开票请求需要财务处理。" },
    { title: "待提现/退款", count: pendingWithdrawals + pendingRefunds, href: "/admin/payments", tone: "stone" as const, detail: "创作者提现和品牌退款等待审核或打款。" },
    { title: "待审核 KOL", count: pendingCreatorReviews, href: "/admin/creators?status=PENDING", tone: "amber" as const, detail: "新创作者资料、风险等级和负责人需要确认。" },
    { title: "待审核社媒账号", count: pendingSocialAccounts, href: "/admin/social-accounts?status=PENDING", tone: "amber" as const, detail: "KOL 社媒账号真实性和数据需要确认。" },
    { title: "待处理争议", count: pendingDisputes, href: "/admin/disputes?status=OPEN", tone: "lime" as const, detail: "补充证据、裁决方案和资金动作需要运营跟进。" },
    { title: "异常支付", count: failedProviderEvents, href: "/admin/payments", tone: "amber" as const, detail: "今日支付/退款渠道事件失败，需要人工复查。" },
    { title: "客服工单", count: pendingTickets, href: "/admin/support", tone: "cyan" as const, detail: "品牌、创作者和内部问题需要客服跟进。" },
    { title: "会员待审核", count: pendingMemberships, href: "/admin/membership-applications", tone: "cyan" as const, detail: "创作者会员开通申请需要确认。" },
    { title: "Campaign 待审核", count: pendingCampaigns, href: "/admin/campaigns?status=PENDING_REVIEW", tone: "amber" as const, detail: "新 Campaign 的预算、规则和任务配置需要确认。" },
    { title: "发布待验收", count: pendingProofs, href: "/admin/proofs?status=PENDING", tone: "lime" as const, detail: "Proof 链接和抓取指标需要验收确认。" },
    { title: "内容待审核", count: pendingSubmissions, href: "/admin/submissions", tone: "cyan" as const, detail: "创作者草稿和履约内容等待流转。" },
  ];

  const operatingCards = [
    { label: "进行中推广", value: activeCampaigns, href: "/admin/campaigns?status=ACTIVE" },
    { label: "本月 GMV", value: money(gmv), href: "/admin/reports" },
    { label: "已确认平台收入", value: money(platformRevenue), href: "/admin/reports" },
    { label: "创作者支出预算", value: money(creatorSpend), href: "/admin/reports" },
    { label: "平均毛利率", value: percent(margin), href: "/admin/reports" },
    { label: "冻结托管余额", value: money(frozenEscrow._sum.frozenEscrowBalance), href: "/admin/payments" },
  ];

  const financeDailyCards = [
    { label: "今日入账", value: money(todayIncome._sum.amount ?? 0), href: "/admin/payments" },
    { label: "今日退款", value: money(todayRefunds._sum.amount ?? 0), href: "/admin/payments" },
    { label: "今日提现", value: money(todayWithdrawals._sum.amount ?? 0), href: "/admin/payments" },
    { label: "未结算托管金额", value: money(frozenEscrow._sum.frozenEscrowBalance), href: "/admin/payments" },
    { label: "异常订单数", value: failedProviderEvents, href: "/admin/payments" },
  ];

  const capacityCards = [
    { label: "品牌总数", value: totalBrands, href: "/admin/brands" },
    { label: "活跃品牌", value: activeBrands, href: "/admin/brands?status=APPROVED" },
    { label: "创作者总数", value: totalCreators, href: "/admin/creators" },
    { label: "活跃创作者", value: activeCreators, href: "/admin/creators?status=APPROVED" },
  ];

  return (
    <div className="grid gap-7">
      <PageHeader eyebrow="Admin" title="今日运营工作台" />

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-stone-950">待办中心</h2>
            <p className="mt-1 text-sm text-stone-500">按资金、交付、审核和客服风险集中处理。</p>
          </div>
          <StatusBadge>{todos.reduce((sum, item) => sum + item.count, 0)} 待办</StatusBadge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {todos.map((item) => <TodoCard key={item.title} {...item} />)}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-stone-950">财务日报</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {financeDailyCards.map((card) => <MetricCard compact key={card.label} label={card.label} value={card.value} href={card.href} />)}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-stone-950">经营快照</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {operatingCards.map((card) => <MetricCard compact key={card.label} label={card.label} value={card.value} href={card.href} />)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capacityCards.map((card) => <MetricCard compact key={card.label} label={card.label} value={card.value} href={card.href} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-semibold text-stone-950">最近推广活动</h2>
          <DataTable
            headers={["Campaign", "Brand", "Status", "Budget", "Created"]}
            rows={recentCampaigns.map((campaign) => [
              <Link className="font-semibold text-stone-950" href={`/admin/campaigns/${campaign.id}`} key={campaign.id}>{campaign.title}</Link>,
              campaign.brand.brandName,
              <StatusBadge key="s" tone={campaignTone(campaign.status)}>{campaign.status}</StatusBadge>,
              money(campaign.totalBudget),
              shortDate(campaign.createdAt),
            ])}
          />
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold text-stone-950">最近内容提交</h2>
          <DataTable
            headers={["Creator", "Campaign", "Status", "Submitted"]}
            rows={recentSubmissions.map((submission) => [
              submission.creator.displayName,
              submission.campaign.title,
              <StatusBadge key="s" tone={submissionTone(submission.status)}>{submission.status}</StatusBadge>,
              shortDate(submission.createdAt),
            ])}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-stone-950">最近结算记录</h2>
        <DataTable
          headers={["Creator", "Type", "Amount", "Status", "Created"]}
          rows={recentPayments.map((tx) => [
            tx.creator.displayName,
            tx.type,
            money(tx.amount, tx.currency),
            <StatusBadge key="s" tone={walletTxTone(tx.status)}>{tx.status}</StatusBadge>,
            shortDate(tx.createdAt),
          ])}
        />
      </section>
    </div>
  );
}

function TodoCard({
  title,
  count,
  href,
  detail,
  tone,
}: {
  title: string;
  count: number;
  href: string;
  detail: string;
  tone: "amber" | "cyan" | "lime" | "stone";
}) {
  const toneClass = {
    amber: "border-amber-200 bg-amber-50/80",
    cyan: "border-cyan-200 bg-cyan-50/70",
    lime: "border-lime-200 bg-lime-50/70",
    stone: "border-stone-200 bg-white/86",
  }[tone];

  return (
    <Link className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`} href={href}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-stone-950">{title}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{detail}</p>
        </div>
        <span className="grid h-12 min-w-12 place-items-center rounded-xl bg-stone-950 px-3 text-xl font-black text-white">{number(count)}</span>
      </div>
      <p className="mt-4 text-sm font-black text-stone-950">进入处理</p>
    </Link>
  );
}
