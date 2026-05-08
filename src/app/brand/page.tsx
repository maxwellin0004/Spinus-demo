import Link from "next/link";
import { UserRole } from "@prisma/client";
import { OperatorCard } from "@/components/brand-ops";
import { DataTable, EmptyState, LinkButton, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money, number, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

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
  const pendingProofs = proofs.filter((proof) => proof.verificationStatus === "PENDING");
  const pendingApplications = brand.campaigns.flatMap((campaign) => campaign.tasks.flatMap((task) => task.applications)).filter((application) => application.status === "APPLIED");
  const spent = brand.campaigns.reduce((sum, campaign) => sum + Number(campaign.creatorBudget), 0);
  const budget = brand.campaigns.reduce((sum, campaign) => sum + Number(campaign.totalBudget), 0);
  const topContent = proofs.sort((a, b) => b.views - a.views)[0];
  const totalViews = proofs.reduce((sum, proof) => sum + proof.views, 0);
  const totalEngagement = proofs.reduce((sum, proof) => sum + proof.likes + proof.comments + proof.shares + proof.saves, 0);

  const cards = [
    { label: "进行中推广", value: active.length, href: "/brand/campaigns?status=ACTIVE" },
    { label: "待审核申请", value: pendingApplications.length, href: "/brand/campaigns" },
    { label: "待审核内容", value: pendingContent.length, href: "/brand/campaigns" },
    { label: "待验收链接", value: pendingProofs.length, href: "/brand/campaigns" },
    { label: "已发布内容", value: proofs.length, href: "/brand/campaigns" },
    { label: "总浏览量", value: number(totalViews), href: "/brand/campaigns" },
    { label: "互动量", value: number(totalEngagement), href: "/brand/campaigns" },
    { label: "点击", value: number(proofs.reduce((sum, proof) => sum + proof.clicks, 0)), href: "/brand/campaigns" },
    { label: "转化", value: number(proofs.reduce((sum, proof) => sum + proof.conversions, 0)), href: "/brand/campaigns" },
    { label: "已规划预算", value: money(spent), href: "/brand/billing" },
    { label: "剩余预算", value: money(Math.max(0, budget - spent)), href: "/brand/billing" },
    { label: "最佳内容浏览", value: topContent ? number(topContent.views) : "N/A", href: topContent ? `/brand/campaigns/${topContent.campaignId}/reports` : "/brand/campaigns" },
  ];

  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="品牌方" title={`${brand.brandName} 仪表盘`}>
        <LinkButton href="/brand/requests" variant="ghost">提交需求</LinkButton>
        <LinkButton href="/brand/campaigns/new" variant="secondary">创建推广</LinkButton>
      </PageHeader>

      <OperatorCard name={brand.responsibleAdmin?.displayName} email={brand.responsibleAdmin?.user.email} wechat={brand.responsibleAdmin?.wechat} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {cards.map((card) => <MetricCard compact key={card.label} label={card.label} value={card.value} href={card.href} />)}
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
