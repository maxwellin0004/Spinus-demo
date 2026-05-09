import Link from "next/link";
import { ApplicationStatus, CampaignStatus, UserRole } from "@prisma/client";
import { addBrandMessageAction, batchReviewTaskApplicationsAction, reviewTaskApplicationAction, submitExistingCampaignAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread, ProgressTimeline } from "@/components/brand-ops";
import { SubmitButton } from "@/components/form-controls";
import { Button, Card, DataTable, LinkButton, MetricCard, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { money, number, shortDate } from "@/lib/format";

const detailTabs = [
  { value: "overview", label: "概览" },
  { value: "tasks", label: "任务包" },
  { value: "applications", label: "KOL 申请" },
  { value: "submissions", label: "内容提交" },
  { value: "proofs", label: "发布验收" },
  { value: "messages", label: "沟通记录" },
  { value: "reports", label: "报告" },
] as const;

type DetailTab = (typeof detailTabs)[number]["value"];

function isDetailTab(value?: string): value is DetailTab {
  return detailTabs.some((tab) => tab.value === value);
}

function TabLink({
  campaignId,
  tab,
  activeTab,
}: {
  campaignId: string;
  tab: (typeof detailTabs)[number];
  activeTab: DetailTab;
}) {
  const active = tab.value === activeTab;
  return (
    <Link
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-stone-950 bg-stone-950 text-white shadow-sm"
          : "border-stone-200 bg-white/80 text-stone-700 hover:border-amber-300 hover:bg-amber-50"
      }`}
      href={`/brand/campaigns/${campaignId}?tab=${tab.value}`}
    >
      {tab.label}
    </Link>
  );
}

function campaignFocus({
  status,
  pendingApplications,
  pendingSubmissions,
  pendingProofs,
}: {
  status: CampaignStatus;
  pendingApplications: number;
  pendingSubmissions: number;
  pendingProofs: number;
}) {
  if (status === CampaignStatus.DRAFT) return { title: "草稿待发布", body: "确认预算和付款信息后提交发布。", href: null };
  if (status === CampaignStatus.AWAITING_PAYMENT) return { title: "等待付款确认", body: "请在账单中提交付款截图和交易订单号，Admin 确认后自动进入内容审核。", href: "/brand/billing" };
  if (status === CampaignStatus.PENDING_REVIEW) return { title: "等待 Admin 审核上架", body: "资金已进入审核链路，Admin 通过后 KOL 才能申请任务。", href: null };
  if (pendingApplications > 0) return { title: "有 KOL 申请待处理", body: `当前有 ${pendingApplications} 个申请需要审核。`, href: null };
  if (pendingSubmissions > 0) return { title: "有内容草稿待审核", body: `当前有 ${pendingSubmissions} 条内容等待处理。`, href: null };
  if (pendingProofs > 0) return { title: "有发布链接待验收", body: `当前有 ${pendingProofs} 条发布链接等待验收，通过后 KOL 收益会入账。`, href: null };
  if (status === CampaignStatus.ACTIVE) return { title: "Campaign 正在运行", body: "暂无必须处理项，继续关注申请、内容提交和验收进度。", href: null };
  return { title: "当前无待处理动作", body: "可以查看报表或沟通记录确认后续安排。", href: null };
}

export default async function BrandCampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; batch?: string; applicationStatus?: string; tab?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const { error, batch, applicationStatus, tab } = await searchParams;
  const activeTab: DetailTab = isDetailTab(tab) ? tab : "overview";
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
      submissions: { include: { creator: true, draft: true, application: { include: { task: true } } }, orderBy: { createdAt: "desc" } },
      proofs: { include: { creator: true, submission: { include: { draft: true, application: { include: { task: true } } } } }, orderBy: { createdAt: "desc" } },
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
  const pendingApplications = applications.filter((application) => application.status === "APPLIED").length;
  const pendingSubmissions = campaign.submissions.filter((submission) => submission.status === "SUBMITTED").length;
  const pendingProofs = campaign.proofs.filter((proof) => proof.verificationStatus === "PENDING").length;
  const focus = campaignFocus({ status: campaign.status, pendingApplications, pendingSubmissions, pendingProofs });
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

      <Card className="border-amber-200 bg-amber-50/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">当前要处理</p>
            <h2 className="mt-2 text-xl font-black text-stone-950">{focus.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{focus.body}</p>
          </div>
          {focus.href ? (
            <Link className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white" href={focus.href}>
              去处理
            </Link>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="总预算" value={money(campaign.totalBudget)} />
        <MetricCard label="KOL 奖励预算" value={money(campaign.creatorBudget)} />
        <MetricCard label="内容提交" value={campaign.submissions.length} />
        <MetricCard label="已验收浏览" value={number(proofViews)} />
      </div>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white/78 p-2 shadow-sm">
        {detailTabs.map((item) => (
          <TabLink activeTab={activeTab} campaignId={campaign.id} key={item.value} tab={item} />
        ))}
      </nav>

      {activeTab === "overview" ? (
        <div className="grid gap-6">
          <ProgressTimeline items={timeline} />
          <Card>
            <h2 className="text-xl font-black">概览摘要</h2>
            <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-3">
              <p>任务包：{campaign.tasks.length}</p>
              <p>KOL 申请：{applications.length}</p>
              <p>待处理申请：{pendingApplications}</p>
              <p>内容提交：{campaign.submissions.length}</p>
              <p>待验收链接：{pendingProofs}</p>
              <p>已验收浏览：{number(proofViews)}</p>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "tasks" ? (
        <div className="grid gap-6">
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
            <SubmitButton pendingLabel="正在提交..." variant="secondary">提交发布</SubmitButton>
          </form>
        ) : null}
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-black">任务包</h2>
        <DataTable
          headers={["任务", "平台", "奖励", "名额", "申请", "下一步", "截止时间"]}
          rows={campaign.tasks.map((task) => {
            const taskPending = task.applications.filter((application) => application.status === "APPLIED").length;
            const taskApproved = task.applications.filter((application) => application.status === "APPROVED").length;
            return [
              task.title,
              task.platform,
              money(task.rewardAmount),
              `${task.slotsTaken}/${task.slotsTotal}`,
              task.applications.length,
              taskPending > 0 ? `审核 ${taskPending} 个申请` : taskApproved > 0 ? "等待内容提交" : "继续招募 KOL",
              shortDate(task.deadline),
            ];
          })}
        />
      </section>
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
      ) : null}

      {activeTab === "applications" ? (
      <section>
        <h2 className="mb-3 text-xl font-black">KOL 申请审核</h2>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <input name="tab" type="hidden" value="applications" />
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
            <Link className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700" href={`/brand/campaigns/${campaign.id}?tab=applications`}>
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
                  <SubmitButton name="decision" pendingLabel="正在批量通过..." value="APPROVED" variant="secondary" type={visiblePendingApplications.length ? "submit" : "button"}>
                    批量通过
                  </SubmitButton>
                  <SubmitButton name="decision" pendingLabel="正在批量拒绝..." value="REJECTED" variant="danger" type={visiblePendingApplications.length ? "submit" : "button"}>
                    批量拒绝
                  </SubmitButton>
                </div>
              </form>
            </Card>
            <DataTable
              headers={["选择", "KOL", "任务", "账号", "粉丝", "状态", "申请说明", "操作"]}
              rows={visibleApplications.map((application) => [
                <input
                  className="h-4 w-4"
                  disabled={application.status !== "APPLIED"}
                  form="batch-review"
                  key={`select-${application.id}`}
                  name="applicationIds"
                  type="checkbox"
                  value={application.id}
                />,
                <div key={`kol-${application.id}`}>
                  <p className="font-black text-stone-950">{application.creator.displayName}</p>
                  <p className="mt-1 text-xs text-stone-500">申请于 {shortDate(application.createdAt)}</p>
                </div>,
                <div key={`task-${application.id}`}>
                  <p>{application.task.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{application.task.platform}</p>
                </div>,
                <div key={`account-${application.id}`}>
                  <p>{application.selectedSocialAccount?.accountName ?? "未选择"}</p>
                  <p className="mt-1 text-xs text-stone-500">{application.selectedSocialAccount?.verificationStatus ?? "UNKNOWN"}</p>
                  {application.selectedSocialAccount?.accountUrl ? (
                    <Link className="mt-1 inline-block font-black text-stone-950" href={application.selectedSocialAccount.accountUrl}>
                      查看账号
                    </Link>
                  ) : null}
                </div>,
                `${application.selectedSocialAccount?.followers ?? 0} / 手填 ${application.selectedSocialAccount?.submittedFollowers ?? 0}`,
                <StatusBadge key={`status-${application.id}`}>{application.status}</StatusBadge>,
                application.applicationNote ?? "未填写",
                application.status === "APPLIED" ? (
                  <form action={reviewTaskApplicationAction.bind(null, application.id)} className="grid min-w-72 gap-2" key={`action-${application.id}`}>
                    <textarea
                      className="min-h-20 rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm text-stone-950 shadow-inner outline-none focus:border-amber-400"
                      defaultValue={application.applicationNote ?? ""}
                      name="note"
                      placeholder="单个审核备注"
                    />
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton name="decision" pendingLabel="正在通过..." value="APPROVED" variant="secondary">
                        通过
                      </SubmitButton>
                      <SubmitButton name="decision" pendingLabel="正在拒绝..." value="REJECTED" variant="danger">
                        拒绝
                      </SubmitButton>
                    </div>
                  </form>
                ) : (
                  <span className="text-sm font-semibold text-stone-600" key={`done-${application.id}`}>
                    {application.status === "APPROVED"
                      ? `已通过${application.approvedAt ? ` · ${shortDate(application.approvedAt)}` : ""}`
                      : application.status === "REJECTED"
                        ? "已拒绝"
                        : "已取消"}
                  </span>
                ),
              ])}
            />
          </div>
        )}
      </section>
      ) : null}

      {activeTab === "submissions" ? (
        <section>
          <h2 className="mb-3 text-xl font-black">内容提交</h2>
          <DataTable
            headers={["KOL", "任务", "草稿", "状态", "发布", "结算", "提交时间"]}
            emptyTitle="暂无内容提交"
            emptyBody="KOL 提交草稿后，会在这里按行查看。"
            rows={campaign.submissions.map((submission) => [
              submission.creator.displayName,
              submission.application.task.title,
              <div className="grid min-w-[16rem] gap-1" key={`draft-${submission.id}`}>
                <span className="font-black text-stone-950">{submission.draft.title}</span>
                <span className="text-xs text-stone-500">{submission.draft.caption}</span>
              </div>,
              <StatusBadge key={`status-${submission.id}`}>{submission.status}</StatusBadge>,
              <StatusBadge key={`publication-${submission.id}`}>{submission.publicationStatus}</StatusBadge>,
              <StatusBadge key={`settlement-${submission.id}`}>{submission.settlementStatus}</StatusBadge>,
              shortDate(submission.createdAt),
            ])}
          />
          <div className="mt-4">
            <LinkButton href={`/brand/campaigns/${campaign.id}/submissions`} variant="secondary">进入内容审核</LinkButton>
          </div>
        </section>
      ) : null}

      {activeTab === "proofs" ? (
        <section>
          <h2 className="mb-3 text-xl font-black">发布验收</h2>
          <DataTable
            headers={["KOL", "任务", "链接", "状态", "浏览", "点赞", "点击", "提交时间"]}
            emptyTitle="暂无发布链接"
            emptyBody="KOL 提交发布链接后，会在这里汇总显示。"
            rows={campaign.proofs.map((proof) => [
              proof.creator.displayName,
              proof.submission.application.task.title,
              <Link className="font-black text-stone-950" href={proof.postUrl} key={`url-${proof.id}`} target="_blank">打开链接</Link>,
              <StatusBadge key={`status-${proof.id}`}>{proof.verificationStatus}</StatusBadge>,
              number(proof.views),
              number(proof.likes),
              number(proof.clicks),
              shortDate(proof.createdAt),
            ])}
          />
          <div className="mt-4">
            <LinkButton href={`/brand/campaigns/${campaign.id}/proofs`} variant="secondary">进入发布验收</LinkButton>
          </div>
        </section>
      ) : null}

      {activeTab === "messages" ? (
      <Card>
        <h2 className="text-xl font-black">品牌与运营沟通记录</h2>
        <div className="mt-5">
          <MessageThread messages={campaign.messages} />
        </div>
        <form action={addBrandMessageAction.bind(null, "campaign", campaign.id)} className="mt-5 grid gap-3">
          <Textarea label="留言给运营" name="body" required rows={4} />
          <div>
            <SubmitButton pendingLabel="正在发送..." variant="secondary">发送留言</SubmitButton>
          </div>
        </form>
      </Card>
      ) : null}

      {activeTab === "reports" ? (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="通过 KOL" value={applications.filter((application) => application.status === "APPROVED").length} />
            <MetricCard label="发布链接" value={campaign.proofs.length} />
            <MetricCard label="验收通过" value={campaign.proofs.filter((proof) => proof.verificationStatus === "VERIFIED").length} />
            <MetricCard label="点击" value={number(campaign.proofs.reduce((sum, proof) => sum + proof.clicks, 0))} />
          </div>
          <section>
            <h2 className="mb-3 text-xl font-black">数据指标</h2>
            <DataTable
              headers={["发布数", "验收通过", "浏览", "点赞", "点击", "转化"]}
              rows={[[
                campaign.proofs.length,
                campaign.proofs.filter((proof) => proof.verificationStatus === "VERIFIED").length,
                number(campaign.proofs.reduce((sum, proof) => sum + proof.views, 0)),
                number(campaign.proofs.reduce((sum, proof) => sum + proof.likes, 0)),
                number(campaign.proofs.reduce((sum, proof) => sum + proof.clicks, 0)),
                number(campaign.proofs.reduce((sum, proof) => sum + proof.conversions, 0)),
              ]]}
            />
          </section>
          <div>
            <LinkButton href={`/brand/campaigns/${campaign.id}/reports`} variant="secondary">查看完整报告</LinkButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
