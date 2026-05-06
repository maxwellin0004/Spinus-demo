import Link from "next/link";
import { CampaignStatus, ProofStatus, SubmissionStatus, WalletTxStatus, WalletTxType } from "@prisma/client";
import { DataTable, EmptyState, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
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
    pendingEarnings,
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
    prisma.walletTransaction.aggregate({
      where: { type: WalletTxType.EARNING, status: WalletTxStatus.PENDING, isDemo: false },
      _sum: { amount: true },
    }),
    prisma.campaign.findMany({
      where: { isDemo: false, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      select: { totalBudget: true, creatorBudget: true, platformFee: true },
    }),
    prisma.campaign.findMany({ where: { isDemo: false }, orderBy: { createdAt: "desc" }, take: 5, include: { brand: true } }),
    prisma.submission.findMany({ where: { campaign: { isDemo: false } }, orderBy: { createdAt: "desc" }, take: 5, include: { campaign: true, creator: true } }),
    prisma.walletTransaction.findMany({ where: { isDemo: false }, orderBy: { createdAt: "desc" }, take: 5, include: { creator: true } }),
  ]);

  const gmv = monthCampaigns.reduce((sum, campaign) => sum + Number(campaign.totalBudget), 0);
  const platformRevenue = monthCampaigns.reduce((sum, campaign) => sum + Number(campaign.platformFee), 0);
  const creatorSpend = monthCampaigns.reduce((sum, campaign) => sum + Number(campaign.creatorBudget), 0);
  const margin = gmv ? (platformRevenue / gmv) * 100 : 0;

  const cards = [
    ["Total brands", totalBrands],
    ["Active brands", activeBrands],
    ["Total creators", totalCreators],
    ["Active creators", activeCreators],
    ["Active campaigns", activeCampaigns],
    ["Pending campaigns", pendingCampaigns],
    ["Pending content", pendingSubmissions],
    ["Pending proof", pendingProofs],
    ["Pending settlement", money(pendingEarnings._sum.amount)],
    ["Monthly GMV", money(gmv)],
    ["Platform revenue", money(platformRevenue)],
    ["Creator payout budget", money(creatorSpend)],
    ["Avg campaign margin", percent(margin)],
  ];

  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="管理端" title="平台经营驾驶舱" />
      {cards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => <MetricCard key={label} label={String(label)} value={value} />)}
        </div>
      ) : (
        <EmptyState title="No platform data yet" />
      )}

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
