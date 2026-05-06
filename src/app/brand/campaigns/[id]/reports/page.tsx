import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DataTable, EmptyState, LinkButton, MetricCard, PageHeader } from "@/components/ui";
import { money, number } from "@/lib/format";
import { ReportChart } from "@/components/report-chart";

export default async function BrandCampaignReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: { proofs: { include: { creator: true, submission: { include: { draft: true } } } }, tasks: { include: { applications: true } } },
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
      <PageHeader eyebrow="推广报告" title={campaign.title}>
        <LinkButton href={`/api/brand/campaigns/${campaign.id}/report.csv`} variant="ghost">导出 CSV</LinkButton>
      </PageHeader>
      {campaign.proofs.length === 0 ? <EmptyState title="No verified proof yet" body="Report metrics appear after Admin verifies creator proof." /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Budget" value={money(campaign.totalBudget)} />
        <MetricCard label="Views" value={number(totals.views)} />
        <MetricCard label="Clicks" value={number(totals.clicks)} />
        <MetricCard label="Conversions" value={number(totals.conversions)} />
        <MetricCard label="CPA / CPM / CPE" value={`${money(cpa)} / ${money(cpm)} / ${money(cpe)}`} />
      </div>
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <ReportChart data={chartData} />
      </div>
      <section>
        <h2 className="mb-3 text-xl font-semibold">内容排行榜</h2>
        <DataTable
          headers={["Content", "Creator", "Platform", "Views", "Likes", "Clicks", "Conversions"]}
          rows={campaign.proofs.sort((a, b) => b.views - a.views).map((proof) => [
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
          headers={["Creator", "Views", "Interactions", "Conversions"]}
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
