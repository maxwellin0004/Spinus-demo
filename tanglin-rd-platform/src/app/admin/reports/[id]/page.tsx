import Link from "next/link";
import { demoWhere, getAdminContext, hasAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DataTable, EmptyState, LinkButton, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { money, number } from "@/lib/format";
import { ReportChart } from "@/components/report-chart";

export default async function AdminCampaignReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const context = await getAdminContext();
  if (!hasAdminPermission(context.profile, "reports.view")) return <PageHeader title="无权查看报表" />;
  const { id } = await params;
  const { demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const campaign = await prisma.campaign.findFirst({
    where: { id, ...demoWhere(demo, canSeeDemo) },
    include: {
      brand: { include: { responsibleAdmin: true } },
      proofs: { include: { creator: true, submission: { include: { draft: true } } } },
      tasks: { include: { applications: true } },
    },
  });
  if (!campaign) return <PageHeader title="未找到报告" />;

  const totals = campaign.proofs.reduce(
    (acc, proof) => ({
      views: acc.views + proof.views,
      likes: acc.likes + proof.likes,
      comments: acc.comments + proof.comments,
      shares: acc.shares + proof.shares,
      saves: acc.saves + proof.saves,
      clicks: acc.clicks + proof.clicks,
      conversions: acc.conversions + proof.conversions,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, conversions: 0 },
  );
  const cpa = totals.conversions ? Number(campaign.creatorBudget) / totals.conversions : 0;
  const cpm = totals.views ? (Number(campaign.creatorBudget) / totals.views) * 1000 : 0;
  const cpe = totals.likes + totals.comments + totals.shares + totals.saves ? Number(campaign.creatorBudget) / (totals.likes + totals.comments + totals.shares + totals.saves) : 0;
  const chartData = campaign.proofs.map((proof) => ({ name: proof.platform, views: proof.views, clicks: proof.clicks, conversions: proof.conversions }));

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin 报告" title={campaign.title}>
        {campaign.isDemo ? <StatusBadge>演示数据</StatusBadge> : null}
        <LinkButton href="/admin/reports" variant="ghost">返回报表</LinkButton>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="预算" value={money(campaign.totalBudget)} />
        <MetricCard label="播放量" value={number(totals.views)} />
        <MetricCard label="点击" value={number(totals.clicks)} />
        <MetricCard label="转化" value={number(totals.conversions)} />
        <MetricCard label="CPA / CPM / CPE" value={`${money(cpa)} / ${money(cpm)} / ${money(cpe)}`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <DataTable
          headers={["品牌", "负责运营", "状态", "任务数", "申请数"]}
          rows={[[
            <Link className="font-semibold text-stone-950" href={`/admin/brands/${campaign.brand.id}`} key={campaign.brand.id}>{campaign.brand.brandName}</Link>,
            campaign.brand.responsibleAdmin?.displayName ?? "-",
            <StatusBadge key="s">{campaign.status}</StatusBadge>,
            campaign.tasks.length,
            campaign.tasks.reduce((sum, task) => sum + task.applications.length, 0),
          ]]}
        />
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          {chartData.length ? <ReportChart data={chartData} /> : <EmptyState title="暂无已验证发布证明" body="Admin 验证 Proof 后会生成报告图表。" />}
        </div>
      </div>
      <section>
        <h2 className="mb-3 text-xl font-semibold">内容排行榜</h2>
        <DataTable
          headers={["内容", "创作者", "平台", "播放", "点赞", "点击", "转化"]}
          rows={[...campaign.proofs].sort((a, b) => b.views - a.views).map((proof) => [
            proof.submission.draft.title,
            proof.creator.displayName,
            proof.platform,
            number(proof.views),
            number(proof.likes),
            number(proof.clicks),
            number(proof.conversions),
          ])}
        />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">创作者排行榜</h2>
        <DataTable
          headers={["创作者", "播放", "互动", "转化"]}
          rows={campaign.proofs.map((proof) => [
            proof.creator.displayName,
            number(proof.views),
            number(proof.likes + proof.comments + proof.shares + proof.saves),
            number(proof.conversions),
          ])}
        />
      </section>
    </div>
  );
}
