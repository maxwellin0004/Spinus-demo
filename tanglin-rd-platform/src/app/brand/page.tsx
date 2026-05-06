import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OperatorCard } from "@/components/brand-ops";
import { DataTable, EmptyState, LinkButton, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { money, number, shortDate } from "@/lib/format";
import { UserRole } from "@prisma/client";

export default async function BrandDashboard() {
  const session = await requireRole(UserRole.BRAND);
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: {
      campaigns: {
        include: { submissions: true, proofs: true, tasks: { include: { applications: true } } },
        orderBy: { createdAt: "desc" },
      },
      responsibleAdmin: { include: { user: true } },
      requests: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!brand) return <EmptyState title="缺少品牌资料" />;
  const proofs = brand.campaigns.flatMap((campaign) => campaign.proofs);
  const active = brand.campaigns.filter((campaign) => campaign.status === "ACTIVE");
  const pendingContent = brand.campaigns.flatMap((campaign) => campaign.submissions).filter((submission) => submission.status === "SUBMITTED");
  const spent = brand.campaigns.reduce((sum, campaign) => sum + Number(campaign.creatorBudget), 0);
  const budget = brand.campaigns.reduce((sum, campaign) => sum + Number(campaign.totalBudget), 0);
  const topContent = proofs.sort((a, b) => b.views - a.views)[0];
  const cards = [
    ["Active campaigns", active.length],
    ["Pending reviews", pendingContent.length],
    ["Published content", proofs.length],
    ["Total views", number(proofs.reduce((sum, proof) => sum + proof.views, 0))],
    ["Engagement", number(proofs.reduce((sum, proof) => sum + proof.likes + proof.comments + proof.shares + proof.saves, 0))],
    ["Clicks", number(proofs.reduce((sum, proof) => sum + proof.clicks, 0))],
    ["Conversions", number(proofs.reduce((sum, proof) => sum + proof.conversions, 0))],
    ["Budget spent", money(spent)],
    ["Budget left", money(Math.max(0, budget - spent))],
    ["Best content", topContent ? number(topContent.views) : "N/A"],
  ];
  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="品牌方" title={`${brand.brandName} 仪表盘`}>
        <LinkButton href="/brand/requests" variant="ghost">先提交需求</LinkButton>
        <LinkButton href="/brand/campaigns/new" variant="secondary">创建推广</LinkButton>
      </PageHeader>
      <OperatorCard name={brand.responsibleAdmin?.displayName} email={brand.responsibleAdmin?.user.email} wechat={brand.responsibleAdmin?.wechat} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => <MetricCard key={label} label={String(label)} value={value} />)}
      </div>
      <section>
        <h2 className="mb-3 text-xl font-semibold">推广活动</h2>
        <DataTable
          headers={["Campaign", "Status", "Budget", "Tasks", "Submissions", "Report"]}
          rows={brand.campaigns.map((campaign) => [
            <Link className="font-semibold text-stone-950" href={`/brand/campaigns/${campaign.id}`} key={campaign.id}>{campaign.title}</Link>,
            <StatusBadge key="s">{campaign.status}</StatusBadge>,
            money(campaign.totalBudget),
            campaign.tasks.length,
            campaign.submissions.length,
            <Link className="font-semibold text-stone-950" href={`/brand/campaigns/${campaign.id}/reports`} key="r">报告</Link>,
          ])}
        />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">最近需求</h2>
        <DataTable
          headers={["需求", "目标", "状态", "创建时间"]}
          rows={brand.requests.map((request) => [
            <Link className="font-semibold text-stone-950" href={`/brand/requests/${request.id}`} key={request.id}>{request.title}</Link>,
            request.objective,
            <StatusBadge key="s">{request.status}</StatusBadge>,
            shortDate(request.createdAt),
          ])}
        />
      </section>
      <p className="text-sm text-stone-500">最近推广更新时间：{shortDate(brand.campaigns[0]?.updatedAt)}</p>
    </div>
  );
}
