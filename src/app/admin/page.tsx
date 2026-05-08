import Link from "next/link";
import { BrandLedgerTxStatus, BrandLedgerTxType, CampaignStatus, ProofStatus, SocialVerificationStatus, SubmissionStatus, WithdrawalStatus } from "@prisma/client";
import { DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { money, number, percent, shortDate } from "@/lib/format";
import { getAdminContext } from "@/lib/admin";

export default async function AdminDashboard() {
  await getAdminContext();
  const [
    totalBrands,
    activeBrands,
    totalCreators,
    activeCreators,
    activeCampaigns,
    pendingCampaigns,
    pendingSubmissions,
    pendingProofs,
    frozenEscrow,
    recognizedPlatformFees,
    pendingSocialAccounts,
    pendingInvoices,
    pendingWithdrawals,
    monthCampaigns,
    recentCampaigns,
    recentSubmissions,
    recentPayments,
  ] = await Promise.all([
    prisma.brandProfile.count({ where: { isDemo: false } }),
    prisma.brandProfile.count({ where: { reviewStatus: "APPROVED", isDemo: false } }),
    prisma.creatorProfile.count({ where: { isDemo: false } }),
    prisma.creatorProfile.count({ where: { reviewStatus: "APPROVED", isDemo: false } }),
    prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE, isDemo: false } }),
    prisma.campaign.count({ where: { status: CampaignStatus.PENDING_REVIEW, isDemo: false } }),
    prisma.submission.count({ where: { status: SubmissionStatus.SUBMITTED, campaign: { isDemo: false } } }),
    prisma.proof.count({ where: { verificationStatus: ProofStatus.PENDING, campaign: { isDemo: false } } }),
    prisma.brandProfile.aggregate({ where: { isDemo: false }, _sum: { frozenEscrowBalance: true } }),
    prisma.brandLedgerTransaction.aggregate({
      where: { type: BrandLedgerTxType.PLATFORM_FEE, status: BrandLedgerTxStatus.CONFIRMED, brand: { isDemo: false } },
      _sum: { amount: true },
    }),
    prisma.socialAccount.count({ where: { verificationStatus: SocialVerificationStatus.PENDING, creator: { isDemo: false } } }),
    prisma.invoice.count({ where: { status: { in: ["OPEN", "PAYMENT_SUBMITTED"] }, isDemo: false } }),
    prisma.withdrawalRequest.count({ where: { status: WithdrawalStatus.PENDING, isDemo: false } }),
    prisma.campaign.findMany({
      where: { isDemo: false, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
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
    { title: "推广待审核", count: pendingCampaigns, href: "/admin/campaigns", tone: "amber" as const, detail: "新 Campaign 需要确认预算、规则和任务配置。" },
    { title: "内容待审核", count: pendingSubmissions, href: "/admin/submissions", tone: "cyan" as const, detail: "创作者草稿等待平台或商家审核流转。" },
    { title: "发布链接待验收", count: pendingProofs, href: "/admin/proofs", tone: "lime" as const, detail: "Proof 链接和抓取指标需要验收确认。" },
    { title: "付款待确认", count: pendingInvoices, href: "/admin/payments", tone: "stone" as const, detail: "商家付款凭证需要财务处理。" },
    { title: "提现待处理", count: pendingWithdrawals, href: "/admin/payments", tone: "stone" as const, detail: "创作者提现申请等待审核或打款。" },
    { title: "社媒账号待审核", count: pendingSocialAccounts, href: "/admin/social-accounts", tone: "amber" as const, detail: "KOL 社媒账号真实性和数据需要确认。" },
  ];

  const operatingCards = [
    ["进行中推广", activeCampaigns],
    ["本月 GMV", money(gmv)],
    ["已确认平台收入", money(platformRevenue)],
    ["创作者支出预算", money(creatorSpend)],
    ["平均毛利率", percent(margin)],
    ["冻结托管余额", money(frozenEscrow._sum.frozenEscrowBalance)],
  ];

  const capacityCards = [
    ["品牌总数", totalBrands],
    ["活跃品牌", activeBrands],
    ["创作者总数", totalCreators],
    ["活跃创作者", activeCreators],
  ];

  return (
    <div className="grid gap-7">
      <PageHeader eyebrow="管理端" title="今日运营工作台" />

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-stone-950">需要处理</h2>
            <p className="mt-1 text-sm text-stone-500">按履约和资金风险优先排列，进入后处理具体队列。</p>
          </div>
          <StatusBadge>{todos.reduce((sum, item) => sum + item.count, 0)} 待办</StatusBadge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {todos.map((item) => (
            <TodoCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-stone-950">经营快照</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {operatingCards.map(([label, value]) => <MetricCard compact key={label} label={String(label)} value={value} />)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capacityCards.map(([label, value]) => <MetricCard compact key={label} label={String(label)} value={value} />)}
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
              <StatusBadge key="s">{campaign.status}</StatusBadge>,
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
              <StatusBadge key="s">{submission.status}</StatusBadge>,
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
            <StatusBadge key="s">{tx.status}</StatusBadge>,
            shortDate(tx.createdAt),
          ])}
        />
        <p className="mt-3 text-sm text-stone-500">进行中的推广活动数量：{number(activeCampaigns)}</p>
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
