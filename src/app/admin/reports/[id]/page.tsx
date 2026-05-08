import Link from "next/link";
import { ProofStatus, SubmissionStatus } from "@prisma/client";
import { demoWhere, getAdminContext, hasAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DataTable, EmptyState, LinkButton, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { money, number, shortDate } from "@/lib/format";

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
      tasks: { include: { applications: true } },
      submissions: {
        include: {
          creator: true,
          draft: true,
          proofs: { orderBy: { createdAt: "desc" } },
          application: { include: { task: true, selectedSocialAccount: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      proofs: true,
    },
  });
  if (!campaign) return <PageHeader title="未找到报表" />;

  const applications = campaign.tasks.flatMap((task) => task.applications);
  const approvedApplications = applications.filter((application) => application.status === "APPROVED").length;
  const acceptedLinks = campaign.proofs.filter((proof) => proof.verificationStatus === ProofStatus.VERIFIED).length;
  const settled = campaign.submissions.filter((submission) => submission.status === SubmissionStatus.SETTLED).length;
  const totals = campaign.proofs.reduce(
    (acc, proof) => ({
      views: acc.views + proof.views,
      likes: acc.likes + proof.likes,
      clicks: acc.clicks + proof.clicks,
      conversions: acc.conversions + proof.conversions,
    }),
    { views: 0, likes: 0, clicks: 0, conversions: 0 },
  );

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin 报表" title={campaign.title}>
        {campaign.isDemo ? <StatusBadge>演示数据</StatusBadge> : null}
        <LinkButton href="/admin/reports" variant="ghost">返回报表</LinkButton>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard label="托管预算" value={money(campaign.escrowAmount, campaign.currency)} />
        <MetricCard label="通过 KOL" value={approvedApplications} />
        <MetricCard label="草稿提交" value={campaign.submissions.length} />
        <MetricCard label="发布链接" value={campaign.proofs.length} />
        <MetricCard label="验收通过" value={acceptedLinks} />
        <MetricCard label="已结算" value={settled} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <DataTable
          headers={["品牌", "负责运营", "状态", "任务数", "申请数"]}
          rows={[[ 
            <Link className="font-semibold text-stone-950" href={`/admin/brands/${campaign.brand.id}`} key={campaign.brand.id}>{campaign.brand.brandName}</Link>,
            campaign.brand.responsibleAdmin?.displayName ?? "-",
            <StatusBadge key="s">{campaign.status}</StatusBadge>,
            campaign.tasks.length,
            applications.length,
          ]]}
        />
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          {campaign.submissions.length ? (
            <DataTable
              headers={["阶段", "数量"]}
              rows={[
                ["申请", applications.length],
                ["通过 KOL", approvedApplications],
                ["草稿提交", campaign.submissions.length],
                ["发布链接", campaign.proofs.length],
                ["验收通过", acceptedLinks],
                ["已结算", settled],
              ]}
            />
          ) : (
            <EmptyState title="暂无履约记录" body="KOL 提交草稿或发布链接后会生成报表。" />
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">KOL 履约明细</h2>
        <DataTable
          headers={["KOL", "平台", "账号", "草稿状态", "发布状态", "结算状态", "链接", "更新时间"]}
          rows={campaign.submissions.map((submission) => {
            const latestProof = submission.proofs[0];
            return [
              submission.creator.displayName,
              submission.application.task.platform,
              submission.application.selectedSocialAccount?.accountName ?? "-",
              submission.status,
              latestProof ? `${latestProof.verificationStatus} / ${latestProof.publicationStatus}` : submission.publicationStatus,
              submission.settlementStatus,
              latestProof ? <Link className="font-semibold text-stone-950" href={latestProof.postUrl} key={latestProof.id} target="_blank">打开链接</Link> : "-",
              shortDate(submission.updatedAt),
            ];
          })}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">弱化数据指标</h2>
        <DataTable
          headers={["播放", "点赞", "点击", "转化"]}
          rows={[[number(totals.views), number(totals.likes), number(totals.clicks), number(totals.conversions)]]}
        />
      </section>
    </div>
  );
}
