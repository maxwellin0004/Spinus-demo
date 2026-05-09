import Link from "next/link";
import type { ReactNode } from "react";
import { CampaignStatus } from "@prisma/client";
import {
  addBrandMessageAction,
  adminCampaignAction,
  createCampaignTaskAction,
  reviewTaskApplicationAction,
  updateInvoiceStatusAction,
} from "@/lib/actions";
import { MessageThread } from "@/components/brand-ops";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, Field, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { money, number, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function adminCampaignFocus({
  status,
  fundingReady,
  pendingApplications,
}: {
  status: CampaignStatus;
  fundingReady: boolean;
  pendingApplications: number;
}) {
  if (!fundingReady) return { title: "先确认资金", body: "资金未托管前不能上架，先处理付款单或等待品牌提交凭证。" };
  if (status === CampaignStatus.PENDING_REVIEW) return { title: "审核内容并上架", body: "资金已就绪，可以完成内容审核并对 KOL 开放申请。" };
  if (status === CampaignStatus.ACTIVE && pendingApplications > 0) return { title: "跟进 KOL 申请", body: `当前有 ${pendingApplications} 个 KOL 申请待审核。` };
  if (status === CampaignStatus.ACTIVE) return { title: "运行中", body: "暂无必须处理项，继续跟进内容提交、发布验收和报表数据。" };
  if (status === CampaignStatus.PAUSED) return { title: "已暂停", body: "确认是否恢复新申请，或结束 Campaign 并退回未用托管。" };
  return { title: "查看状态", body: "核对资金、任务和沟通记录后决定下一步。" };
}

export default async function AdminCampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      brand: true,
      tasks: {
        include: { applications: { include: { creator: true, selectedSocialAccount: true }, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      },
      submissions: true,
      proofs: true,
      assets: true,
      invoices: { orderBy: { createdAt: "desc" } },
      messages: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!campaign) return <PageHeader title="未找到推广活动" />;

  const totals = campaign.proofs.reduce(
    (acc, proof) => ({
      views: acc.views + proof.views,
      clicks: acc.clicks + proof.clicks,
      conversions: acc.conversions + proof.conversions,
    }),
    { views: 0, clicks: 0, conversions: 0 },
  );
  const applications = campaign.tasks.flatMap((task) => task.applications);
  const action = adminCampaignAction.bind(null, campaign.id);
  const createTask = createCampaignTaskAction.bind(null, campaign.id);
  const latestInvoice = campaign.invoices[0];
  const fundingReady = Number(campaign.escrowFrozenAmount) >= Number(campaign.escrowAmount);
  const canApproveContent = fundingReady && campaign.status === CampaignStatus.PENDING_REVIEW;
  const pendingApplications = applications.filter((application) => application.status === "APPLIED").length;
  const focus = adminCampaignFocus({ status: campaign.status, fundingReady, pendingApplications });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="推广活动详情" title={campaign.title}>
        <StatusBadge>{campaign.status}</StatusBadge>
        <Link className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold" href={`/admin/reports/${campaign.id}`}>
          查看报表
        </Link>
      </PageHeader>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <Card className="border-amber-200 bg-amber-50/70">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">当前要处理</p>
        <h2 className="mt-2 text-xl font-black text-stone-950">{focus.title}</h2>
        <p className="mt-1 text-sm text-stone-600">{focus.body}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="总预算" value={money(campaign.totalBudget, campaign.currency)} />
        <MetricCard label="申请数" value={applications.length} />
        <MetricCard label="已发布链接" value={campaign.proofs.length} />
        <MetricCard label="总浏览" value={number(totals.views)} />
        <MetricCard label="托管中" value={money(campaign.escrowFrozenAmount, campaign.currency)} />
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-black">1. 资金到账审核</h2>
          <div className="mt-4 grid gap-3 text-sm text-stone-700">
            <p><strong>需托管金额：</strong>{money(campaign.escrowAmount, campaign.currency)}</p>
            <p><strong>已托管金额：</strong>{money(campaign.escrowFrozenAmount, campaign.currency)}</p>
            <p><strong>资金状态：</strong>{fundingReady ? "已到账并托管" : "待确认到账"}</p>
            {latestInvoice ? (
              <>
                <p><strong>付款单：</strong>{latestInvoice.invoiceNumber ?? "-"}</p>
                <p><strong>付款状态：</strong>{latestInvoice.status}</p>
                <p><strong>交易订单号：</strong>{latestInvoice.paymentReference ?? "-"}</p>
                <p>
                  <strong>付款截图：</strong>
                  {latestInvoice.paymentProofUrl ? (
                    <Link className="font-semibold text-stone-950" href={latestInvoice.paymentProofUrl} target="_blank">
                      查看截图
                    </Link>
                  ) : (
                    "-"
                  )}
                </p>
              </>
            ) : (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 font-semibold text-emerald-800">
                商家余额已足够，提交时已自动冻结托管。
              </p>
            )}
          </div>
          {latestInvoice && !["PAID", "VOID", "REJECTED"].includes(latestInvoice.status) ? (
            <form action={updateInvoiceStatusAction.bind(null, latestInvoice.id)} className="mt-5 grid gap-3">
              <input name="returnTo" type="hidden" value={`/admin/campaigns/${campaign.id}`} />
              <Textarea label="资金审核备注" name="note" defaultValue={latestInvoice.note ?? ""} rows={2} />
              <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                <input className="mt-0.5" name="confirmAction" required type="checkbox" value="yes" />
                我已核对付款状态、金额、订单号和凭证，确认执行该操作。
              </label>
              <div className="flex flex-wrap gap-2">
                <SubmitButton name="action" pendingLabel="正在确认..." value="paid" variant="secondary">确认资金到账</SubmitButton>
                <SubmitButton name="action" pendingLabel="正在处理..." value="reject" variant="danger">拒绝付款</SubmitButton>
              </div>
            </form>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-xl font-black">2. 推广内容审核</h2>
          {campaign.status === CampaignStatus.ACTIVE ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              已上线，当前对 KOL 可见。
            </div>
          ) : null}
          {!fundingReady ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              请先完成资金到账审核。资金未托管前，不能通过推广内容审核。
            </div>
          ) : null}
          <form action={action} className="mt-5 grid gap-4">
            <Textarea label="审核备注 / 拒绝或取消原因" name="reviewNote" defaultValue={campaign.reviewNote ?? ""} />
            <div className="flex flex-wrap gap-2">
              {campaign.status === CampaignStatus.ACTIVE ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
                  已上线
                </span>
              ) : canApproveContent ? (
                <SubmitButton name="action" pendingLabel="正在上架..." value="approve" variant="secondary">通过内容并上线</SubmitButton>
              ) : (
                <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-600">
                  等待资金确认
                </span>
              )}
              <SubmitButton name="action" pendingLabel="正在处理..." value="reject" variant="danger">拒绝内容</SubmitButton>
              <SubmitButton name="action" pendingLabel="正在处理..." value="pause" variant="ghost">暂停新申请</SubmitButton>
              <SubmitButton name="action" pendingLabel="正在处理..." value="resume" variant="ghost">恢复</SubmitButton>
              <SubmitButton name="action" pendingLabel="正在处理..." value="complete" variant="ghost">标记完成</SubmitButton>
              <SubmitButton name="action" pendingLabel="正在处理..." value="cancel" variant="danger">取消并退回未用托管</SubmitButton>
            </div>
          </form>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            内容审核通过后 Campaign 才会进入 ACTIVE，并对 KOL 开放申请。暂停只影响新的 KOL 申请，不影响已通过 KOL 履约。
          </p>
        </Card>
      </section>

      <Card>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <Info label="品牌" value={campaign.brand.brandName} />
          <Info label="目标" value={campaign.objective} />
          <Info label="平台" value={campaign.targetPlatforms.join(", ")} />
          <Info label="国家/地区" value={campaign.targetCountries.join(", ")} />
          <Info label="KOL 奖励预算" value={money(campaign.creatorBudget, campaign.currency)} />
          <Info label="平台服务费" value={money(campaign.platformFee, campaign.currency)} />
          <div className="md:col-span-2"><dt className="font-semibold">Brief</dt><dd className="whitespace-pre-wrap text-stone-600">{campaign.brief}</dd></div>
          <div className="md:col-span-2"><dt className="font-semibold">禁止表达</dt><dd>{campaign.mustNotInclude.join(", ")}</dd></div>
        </dl>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-black">创建任务包</h2>
        <Card>
          <form action={createTask} className="grid gap-4 md:grid-cols-3">
            <Field label="任务标题" name="title" required placeholder="小红书图文任务" />
            <Field label="平台" name="platform" required defaultValue={campaign.targetPlatforms[0] ?? "小红书"} />
            <Field label="内容形式" name="contentType" required defaultValue="图文" />
            <Field label="奖励金额" name="rewardAmount" type="number" defaultValue={Number(campaign.baseReward)} />
            <Field label="名额" name="slotsTotal" type="number" defaultValue={3} />
            <Select label="KOL 等级要求" name="creatorLevelRequired" defaultValue="NEW">
              <option value="NEW">新手</option>
              <option value="VERIFIED">已验证</option>
              <option value="PRO">专业</option>
              <option value="ELITE">精英</option>
            </Select>
            <Field label="截止时间" name="deadline" type="date" defaultValue={campaign.endDate.toISOString().slice(0, 10)} />
            <div className="flex items-end"><SubmitButton pendingLabel="正在创建...">创建任务</SubmitButton></div>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">任务</h2>
        <DataTable
          headers={["任务", "平台", "奖励", "名额", "申请", "等级", "截止"]}
          rows={campaign.tasks.map((task) => [
            task.title,
            task.platform,
            money(task.rewardAmount, campaign.currency),
            `${task.slotsTaken}/${task.slotsTotal}`,
            task.applications.length,
            task.creatorLevelRequired,
            shortDate(task.deadline),
          ])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">KOL 申请审核</h2>
        {applications.length === 0 ? (
          <DataTable headers={["KOL", "任务", "状态"]} rows={[]} />
        ) : (
          <DataTable
            headers={["KOL", "任务", "账号", "粉丝", "状态", "申请说明", "操作"]}
            rows={campaign.tasks.flatMap((task) =>
              task.applications.map((application) => [
                <div key={`kol-${application.id}`}>
                  <p className="font-black text-stone-950">{application.creator.displayName}</p>
                  <p className="mt-1 text-xs text-stone-500">申请于 {shortDate(application.createdAt)}</p>
                </div>,
                <div key={`task-${application.id}`}>
                  <p>{task.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{task.platform}</p>
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
                application.applicationNote ?? "KOL 未填写申请备注。",
                application.status === "APPLIED" ? (
                  <form action={reviewTaskApplicationAction.bind(null, application.id)} className="grid min-w-72 gap-2" key={`action-${application.id}`}>
                    <textarea
                      className="min-h-20 rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm text-stone-950 shadow-inner outline-none focus:border-amber-400"
                      defaultValue={application.applicationNote ?? ""}
                      name="note"
                      placeholder="审核备注"
                    />
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton name="decision" pendingLabel="正在通过..." value="APPROVED" variant="secondary">通过</SubmitButton>
                      <SubmitButton name="decision" pendingLabel="正在拒绝..." value="REJECTED" variant="danger">拒绝</SubmitButton>
                    </div>
                  </form>
                ) : (
                  <span className="text-sm font-semibold text-stone-600" key={`done-${application.id}`}>{application.status}</span>
                ),
              ]),
            )}
          />
        )}
      </section>

      <Card>
        <h2 className="text-xl font-black">品牌沟通记录</h2>
        <div className="mt-5">
          <MessageThread messages={campaign.messages} />
        </div>
        <form action={addBrandMessageAction.bind(null, "campaign", campaign.id)} className="mt-5 grid gap-3">
          <Textarea label="回复品牌" name="body" required rows={4} />
          <label className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm">
            <input className="mr-2" name="visibleToBrand" type="checkbox" defaultChecked />
            品牌方可见
          </label>
          <div><SubmitButton pendingLabel="正在发送..." variant="secondary">发送留言</SubmitButton></div>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-black">素材</h2>
        <DataTable headers={["名称", "类型", "URL"]} rows={campaign.assets.map((asset) => [asset.name, asset.kind, asset.url])} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="font-semibold">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
