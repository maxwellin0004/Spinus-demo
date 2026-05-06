import Link from "next/link";
import { UserRole } from "@prisma/client";
import { addBrandMessageAction, reviewTaskApplicationAction, submitExistingCampaignAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread, ProgressTimeline } from "@/components/brand-ops";
import { Button, Card, DataTable, LinkButton, MetricCard, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { money, number, shortDate } from "@/lib/format";

export default async function BrandCampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const { error } = await searchParams;
  const campaign = await prisma.campaign.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: {
      assets: true,
      tasks: { include: { applications: { include: { creator: true }, orderBy: { createdAt: "desc" } } } },
      submissions: true,
      proofs: true,
      messages: { where: { visibleToBrand: true }, include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!campaign) return <PageHeader title="未找到推广活动" />;
  const proofViews = campaign.proofs.reduce((sum, proof) => sum + proof.views, 0);
  const applications = campaign.tasks.flatMap((task) => task.applications);
  const firstApplication = applications.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const firstSubmission = [...campaign.submissions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const firstProof = [...campaign.proofs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const proofReviewed = campaign.proofs.find((proof) => proof.verificationStatus !== "PENDING");
  const settled = campaign.submissions.find((submission) => submission.status === "SETTLED");
  const timeline = [
    { label: "已提交", done: campaign.status !== "DRAFT", date: campaign.createdAt, detail: campaign.status === "DRAFT" ? "草稿尚未提交审核" : "品牌已提交 Campaign" },
    { label: "Admin 审核中", done: campaign.status !== "DRAFT", date: campaign.updatedAt, detail: campaign.reviewNote || "等待平台确认预算、合规和任务配置" },
    { label: "已上架", done: ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].includes(campaign.status), date: campaign.updatedAt, detail: `当前状态：${campaign.status}` },
    { label: "创作者申请", done: applications.length > 0, date: firstApplication?.createdAt, detail: `${applications.length} 个申请` },
    { label: "内容审核", done: campaign.submissions.length > 0, date: firstSubmission?.createdAt, detail: `${campaign.submissions.length} 条内容提交` },
    { label: "已发布", done: campaign.proofs.length > 0, date: firstProof?.publishedAt, detail: `${campaign.proofs.length} 条 Proof` },
    { label: "Proof 审核", done: Boolean(proofReviewed), date: proofReviewed?.updatedAt, detail: `${campaign.proofs.filter((proof) => proof.verificationStatus === "VERIFIED").length} 条已验证` },
    { label: "结算完成", done: Boolean(settled), date: settled?.updatedAt, detail: settled ? "创作者收益已确认" : "等待 Admin 结算确认" },
  ];
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="推广活动" title={campaign.title}>
        <StatusBadge>{campaign.status}</StatusBadge>
        <LinkButton href={`/brand/campaigns/${campaign.id}/submissions`} variant="ghost">内容提交</LinkButton>
        <LinkButton href={`/brand/campaigns/${campaign.id}/reports`} variant="secondary">报告</LinkButton>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Budget" value={money(campaign.totalBudget)} />
        <MetricCard label="Creator reward budget" value={money(campaign.creatorBudget)} />
        <MetricCard label="Submissions" value={campaign.submissions.length} />
        <MetricCard label="Verified views" value={number(proofViews)} />
      </div>
      <ProgressTimeline items={timeline} />
      <Card>
        <h2 className="text-xl font-semibold">任务简报</h2>
        <p className="mt-3 whitespace-pre-wrap text-stone-600">{campaign.brief}</p>
        <p className="mt-3 text-sm text-stone-500">Must include: {campaign.mustInclude.join(", ")}</p>
        <p className="mt-1 text-sm text-stone-500">Forbidden: {campaign.mustNotInclude.join(", ")}</p>
        {campaign.status === "DRAFT" ? (
          <form action={submitExistingCampaignAction.bind(null, campaign.id)} className="mt-5">
            <Button variant="secondary">提交草稿审核</Button>
          </form>
        ) : null}
      </Card>
      <section>
        <h2 className="mb-3 text-xl font-semibold">任务包</h2>
        <DataTable headers={["Task", "Platform", "Reward", "Slots", "Applications", "Deadline"]} rows={campaign.tasks.map((task) => [task.title, task.platform, money(task.rewardAmount), `${task.slotsTaken}/${task.slotsTotal}`, task.applications.length, shortDate(task.deadline)])} />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">创作者申请审核</h2>
        {applications.length === 0 ? (
          <DataTable headers={["Creator", "Task", "Status"]} rows={[]} />
        ) : (
          <div className="grid gap-4">
            {campaign.tasks.flatMap((task) =>
              task.applications.map((application) => (
                <Card key={application.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-stone-950">{application.creator.displayName}</h3>
                      <p className="mt-1 text-sm text-stone-500">{task.title} · {task.platform} · 申请于 {shortDate(application.createdAt)}</p>
                    </div>
                    <StatusBadge>{application.status}</StatusBadge>
                  </div>
                  <p className="mt-4 rounded-3xl border border-stone-200 bg-white/70 p-4 text-sm text-stone-700">{application.applicationNote ?? "创作者未填写申请备注。"}</p>
                  <form action={reviewTaskApplicationAction.bind(null, application.id)} className="mt-5 grid gap-3">
                    <Textarea label="审核备注" name="note" defaultValue={application.applicationNote ?? ""} rows={3} />
                    <div className="flex flex-wrap gap-2">
                      <Button name="decision" value="APPROVED" variant="secondary">通过申请</Button>
                      <Button name="decision" value="REJECTED" variant="danger">拒绝申请</Button>
                    </div>
                  </form>
                </Card>
              )),
            )}
          </div>
        )}
      </section>
      <Card>
        <h2 className="text-xl font-black">品牌与运营沟通记录</h2>
        <div className="mt-5">
          <MessageThread messages={campaign.messages} />
        </div>
        <form action={addBrandMessageAction.bind(null, "campaign", campaign.id)} className="mt-5 grid gap-3">
          <Textarea label="留言给运营" name="body" required rows={4} />
          <div><Button variant="secondary">发送留言</Button></div>
        </form>
      </Card>
      <section>
        <h2 className="mb-3 text-xl font-semibold">素材</h2>
        <DataTable headers={["Name", "Kind", "URL"]} rows={campaign.assets.map((asset) => [asset.name, asset.kind, <Link className="font-semibold text-stone-950" href={asset.url} key={asset.id}>{asset.url}</Link>])} />
      </section>
    </div>
  );
}
