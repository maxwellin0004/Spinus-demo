import Link from "next/link";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { addBrandMessageAction, batchReviewTaskApplicationsAction, reviewTaskApplicationAction, submitExistingCampaignAction } from "@/lib/actions";
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
  searchParams: Promise<{ error?: string; batch?: string; applicationStatus?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const { error, batch, applicationStatus } = await searchParams;
  const selectedApplicationStatus = Object.values(ApplicationStatus).includes(applicationStatus as ApplicationStatus)
    ? (applicationStatus as ApplicationStatus)
    : null;
  const campaign = await prisma.campaign.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: {
      assets: true,
      tasks: {
        include: {
          applications: {
            include: { creator: true, selectedSocialAccount: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      submissions: true,
      proofs: true,
      messages: { where: { visibleToBrand: true }, include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!campaign) return <PageHeader title="未找到推广活动" />;

  const proofViews = campaign.proofs.reduce((sum, proof) => sum + proof.views, 0);
  const applications = campaign.tasks.flatMap((task) => task.applications.map((application) => ({ ...application, task })));
  const visibleApplications = selectedApplicationStatus
    ? applications.filter((application) => application.status === selectedApplicationStatus)
    : applications;
  const visiblePendingApplications = visibleApplications.filter((application) => application.status === "APPLIED");
  const firstApplication = [...applications].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const firstSubmission = [...campaign.submissions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const firstProof = [...campaign.proofs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const proofReviewed = campaign.proofs.find((proof) => proof.verificationStatus !== "PENDING");
  const settled = campaign.submissions.find((submission) => submission.status === "SETTLED");
  const timeline = [
    { label: "已提交", done: campaign.status !== "DRAFT", date: campaign.createdAt, detail: campaign.status === "DRAFT" ? "草稿尚未发布" : "品牌已提交 Campaign" },
    { label: "已上架", done: ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].includes(campaign.status), date: campaign.updatedAt, detail: `当前状态：${campaign.status}` },
    { label: "KOL 申请", done: applications.length > 0, date: firstApplication?.createdAt, detail: `${applications.length} 个申请` },
    { label: "内容审稿", done: campaign.submissions.length > 0, date: firstSubmission?.createdAt, detail: `${campaign.submissions.length} 条内容提交` },
    { label: "发布链接", done: campaign.proofs.length > 0, date: firstProof?.publishedAt, detail: `${campaign.proofs.length} 条链接` },
    { label: "商家验收", done: Boolean(proofReviewed), date: proofReviewed?.updatedAt, detail: `${campaign.proofs.filter((proof) => proof.verificationStatus === "VERIFIED").length} 条已验收` },
    { label: "收益入账", done: Boolean(settled), date: settled?.updatedAt, detail: settled ? "KOL 收益已进入可提现余额" : "等待商家验收" },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="推广活动" title={campaign.title}>
        <StatusBadge>{campaign.status}</StatusBadge>
        <LinkButton href={`/brand/campaigns/${campaign.id}/submissions`} variant="ghost">
          内容提交
        </LinkButton>
        <LinkButton href={`/brand/campaigns/${campaign.id}/proofs`} variant="ghost">
          发布验收
        </LinkButton>
        <LinkButton href={`/brand/campaigns/${campaign.id}/reports`} variant="secondary">
          报告
        </LinkButton>
      </PageHeader>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {batch ? <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">已批量处理 {batch} 个申请。</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="总预算" value={money(campaign.totalBudget)} />
        <MetricCard label="KOL 奖励预算" value={money(campaign.creatorBudget)} />
        <MetricCard label="内容提交" value={campaign.submissions.length} />
        <MetricCard label="已验收浏览" value={number(proofViews)} />
      </div>

      <ProgressTimeline items={timeline} />

      <Card>
        <h2 className="text-xl font-black">任务简报</h2>
        <p className="mt-3 whitespace-pre-wrap text-stone-600">{campaign.brief}</p>
        <div className="mt-4 grid gap-2 text-sm text-stone-500 md:grid-cols-2">
          <p>必须包含：{campaign.mustInclude.join(", ")}</p>
          <p>禁止表达：{campaign.mustNotInclude.join(", ")}</p>
          <p>广告披露：{campaign.disclosureRequired ? "必须披露" : "未要求"}</p>
          <p>未验证账号申请：{campaign.allowUnverifiedSocialAccounts ? "允许" : "不允许"}</p>
        </div>
        {campaign.status === "DRAFT" ? (
          <form action={submitExistingCampaignAction.bind(null, campaign.id)} className="mt-5">
            <Button variant="secondary">提交发布</Button>
          </form>
        ) : null}
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-black">任务包</h2>
        <DataTable
          headers={["任务", "平台", "奖励", "名额", "申请", "截止时间"]}
          rows={campaign.tasks.map((task) => [task.title, task.platform, money(task.rewardAmount), `${task.slotsTaken}/${task.slotsTotal}`, task.applications.length, shortDate(task.deadline)])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">KOL 申请审核</h2>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-2 text-sm font-semibold text-stone-600">
            申请状态
            <select
              className="min-h-12 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none focus:border-amber-400"
              defaultValue={selectedApplicationStatus ?? ""}
              name="applicationStatus"
            >
              <option value="">全部申请状态</option>
              {Object.values(ApplicationStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <Button variant="ghost">筛选</Button>
          {selectedApplicationStatus ? (
            <Link className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700" href={`/brand/campaigns/${campaign.id}`}>
              清空
            </Link>
          ) : null}
          <span className="text-sm font-semibold text-stone-500">当前显示 {visibleApplications.length} / 全部 {applications.length}</span>
        </form>
        {visibleApplications.length === 0 ? (
          <DataTable headers={["KOL", "任务", "状态"]} rows={[]} />
        ) : (
          <div className="grid gap-4">
            <Card>
              <form id="batch-review" action={batchReviewTaskApplicationsAction.bind(null, campaign.id)} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Textarea label="批量审核备注" name="note" defaultValue="商家已批量处理申请。" rows={3} />
                <div className="flex flex-wrap gap-2">
                  <Button name="decision" value="APPROVED" variant="secondary" type={visiblePendingApplications.length ? "submit" : "button"}>
                    批量通过
                  </Button>
                  <Button name="decision" value="REJECTED" variant="danger" type={visiblePendingApplications.length ? "submit" : "button"}>
                    批量拒绝
                  </Button>
                </div>
              </form>
            </Card>

            {visibleApplications.map((application) => (
              <Card key={application.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input className="mt-1 h-4 w-4" disabled={application.status !== "APPLIED"} form="batch-review" name="applicationIds" type="checkbox" value={application.id} />
                    <div>
                      <h3 className="text-lg font-black text-stone-950">{application.creator.displayName}</h3>
                      <p className="mt-1 text-sm text-stone-500">
                        {application.task.title} · {application.task.platform} · 申请于 {shortDate(application.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge>{application.status}</StatusBadge>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl border border-stone-200 bg-white/70 p-4 text-sm text-stone-700 md:grid-cols-3">
                  <p>申请说明：{application.applicationNote ?? "未填写"}</p>
                  <p>发布账号：{application.selectedSocialAccount?.accountName ?? "未选择"}</p>
                  <p>账号状态：{application.selectedSocialAccount?.verificationStatus ?? "UNKNOWN"}</p>
                  <p>账号粉丝：{application.selectedSocialAccount?.followers ?? 0}</p>
                  <p>手填粉丝：{application.selectedSocialAccount?.submittedFollowers ?? 0}</p>
                  {application.selectedSocialAccount?.accountUrl ? (
                    <Link className="font-black text-stone-950" href={application.selectedSocialAccount.accountUrl}>
                      查看账号
                    </Link>
                  ) : null}
                </div>

                {application.status === "APPLIED" ? (
                  <form action={reviewTaskApplicationAction.bind(null, application.id)} className="mt-5 grid gap-3">
                    <Textarea label="单个审核备注" name="note" defaultValue={application.applicationNote ?? ""} rows={3} />
                    <div className="flex flex-wrap gap-2">
                      <Button name="decision" value="APPROVED" variant="secondary">
                        通过申请
                      </Button>
                      <Button name="decision" value="REJECTED" variant="danger">
                        拒绝申请
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${
                    application.status === "APPROVED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-stone-200 bg-stone-50 text-stone-600"
                  }`}>
                    {application.status === "APPROVED"
                      ? `已通过申请${application.approvedAt ? ` · ${shortDate(application.approvedAt)}` : ""}`
                      : application.status === "REJECTED"
                        ? "已拒绝申请"
                        : "申请已取消"}
                  </div>
                )}
              </Card>
            ))}
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
          <div>
            <Button variant="secondary">发送留言</Button>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-black">素材</h2>
        <DataTable
          headers={["名称", "类型", "URL"]}
          rows={campaign.assets.map((asset) => [
            asset.name,
            asset.kind,
            <Link className="font-semibold text-stone-950" href={asset.url} key={asset.id}>
              {asset.url}
            </Link>,
          ])}
        />
      </section>
    </div>
  );
}
