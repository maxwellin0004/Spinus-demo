import { ReviewDecision, SubmissionStatus, UserRole } from "@prisma/client";
import { reviewSubmissionAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/form-controls";
import { Button, DataTable, EmptyState, PageHeader, Select, StatusBadge, WorkflowHint } from "@/components/ui";
import { shortDate } from "@/lib/format";

function changed(before?: string, after?: string) {
  if (!before) return "首版提交";
  return before === after ? "未修改" : "已修改";
}

function submissionNextStep(status: SubmissionStatus, canRequestRevision: boolean) {
  if (status === SubmissionStatus.SUBMITTED) {
    return canRequestRevision
      ? { title: "待审稿", body: "查看版本变化后通过、要求修改或拒绝。", tone: "warning" as const }
      : { title: "最终处理", body: "已达到修改上限，本次只能通过或拒绝。", tone: "warning" as const };
  }
  if (status === SubmissionStatus.APPROVED) return { title: "等待发布", body: "KOL 可按已通过草稿发布内容。", tone: "success" as const };
  if (status === SubmissionStatus.REJECTED) return { title: "已拒绝", body: "该草稿无需继续处理。", tone: "danger" as const };
  if (status === SubmissionStatus.REVISION_REQUESTED) return { title: "等待重交", body: "等待 KOL 根据意见提交新版本。", tone: "warning" as const };
  return { title: "查看状态", body: "按当前草稿状态跟进。", tone: "default" as const };
}

export default async function BrandSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const { error, status } = await searchParams;
  const selectedStatus = Object.values(SubmissionStatus).includes(status as SubmissionStatus)
    ? (status as SubmissionStatus)
    : null;
  const campaign = await prisma.campaign.findFirst({ where: { id, brand: { userId: session.userId } } });
  if (!campaign) return <PageHeader title="未找到推广活动" />;

  const submissions = await prisma.submission.findMany({
    where: {
      campaignId: id,
      ...(selectedStatus ? { status: selectedStatus } : {}),
    },
    include: {
      creator: true,
      draft: true,
      reviews: { include: { reviewer: true }, orderBy: { createdAt: "asc" } },
      application: {
        include: {
          task: true,
          selectedSocialAccount: true,
          drafts: { orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="商家审稿" title={`${campaign.title} 内容草稿`}>
        <StatusBadge>{campaign.requiresDraftReview ? "需要审稿" : "免审稿"}</StatusBadge>
        <StatusBadge>最多 {campaign.revisionLimit} 轮修改</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <form className="flex flex-wrap items-end gap-3">
        <Select label="草稿状态" name="status" defaultValue={selectedStatus ?? ""}>
          <option value="">全部草稿状态</option>
          {Object.values(SubmissionStatus).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Button variant="ghost">筛选</Button>
        {selectedStatus ? (
          <a className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700" href={`/brand/campaigns/${id}/submissions`}>
            清空
          </a>
        ) : null}
        <span className="text-sm font-semibold text-stone-500">当前显示 {submissions.length} 条</span>
      </form>
      {submissions.length === 0 ? <EmptyState title="暂无内容提交" body="KOL 提交结构化草稿后，会在这里显示版本对比、广告披露说明和审核记录。" /> : null}

      {submissions.length ? (
        <DataTable
          headers={["KOL / 任务", "状态", "草稿摘要", "披露与附件", "版本变化", "审核历史", "下一步", "操作"]}
          emptyTitle="暂无内容提交"
          emptyBody="KOL 提交结构化草稿后，会在这里显示版本对比、广告披露说明和审核记录。"
          rows={submissions.map((submission) => {
            const versions = submission.application.drafts;
            const currentIndex = versions.findIndex((draft) => draft.id === submission.draftId);
            const previous = currentIndex > 0 ? versions[currentIndex - 1] : undefined;
            const current = submission.draft;
            const canReview = submission.status === SubmissionStatus.SUBMITTED;
            const canRequestRevision = current.revisionRound < campaign.revisionLimit;
            const nextStep = submissionNextStep(submission.status, canRequestRevision);

            return [
              <div key={`meta-${submission.id}`}>
                <p className="font-black text-stone-950">{submission.creator.displayName}</p>
                <p className="mt-1 text-xs text-stone-500">{submission.application.task.title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {submission.application.task.platform} · 第 {current.revisionRound} 轮 · {shortDate(submission.createdAt)}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  账号：{submission.application.selectedSocialAccount?.accountName ?? "未绑定"}
                </p>
              </div>,
              <div className="grid gap-2" key={`status-${submission.id}`}>
                <StatusBadge>{submission.status}</StatusBadge>
                <StatusBadge>{current.reviewStatus}</StatusBadge>
              </div>,
              <details className="max-w-md text-sm" key={`draft-${submission.id}`}>
                <summary className="cursor-pointer font-black text-stone-950">{current.title}</summary>
                <div className="mt-3 grid gap-2 text-stone-600">
                  <p className="whitespace-pre-wrap">{current.script}</p>
                  <p>{current.caption}</p>
                  <p>{current.hashtags.join(" ")}</p>
                  <p>封面：{current.coverText}</p>
                </div>
              </details>,
              <div key={`disclosure-${submission.id}`}>
                <p className="max-w-xs whitespace-pre-wrap text-sm">{current.disclosurePosition || "未填写披露位置"}</p>
                {current.previewAttachmentUrl ? (
                  <a className="mt-2 inline-block font-black text-stone-950" href={current.previewAttachmentUrl}>
                    查看附件
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-stone-500">无附件</p>
                )}
              </div>,
              <div className="grid gap-1 text-sm" key={`changes-${submission.id}`}>
                <p>标题：{changed(previous?.title, current.title)}</p>
                <p>脚本：{changed(previous?.script, current.script)}</p>
                <p>文案：{changed(previous?.caption, current.caption)}</p>
                <p>封面：{changed(previous?.coverText, current.coverText)}</p>
              </div>,
              submission.reviews.length ? (
                <details className="max-w-sm text-sm" key={`reviews-${submission.id}`}>
                  <summary className="cursor-pointer font-black text-stone-950">{submission.reviews.length} 条记录</summary>
                  <div className="mt-2 grid gap-2">
                    {submission.reviews.map((review) => (
                      <div className="rounded-xl bg-stone-50 p-3" key={review.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">{review.reviewerRole === "ADMIN" ? "平台审核" : "商家审核"}</p>
                          <StatusBadge>{review.decision}</StatusBadge>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap">{review.comment}</p>
                        {review.riskPoints.length ? <p className="mt-2 text-amber-700">风险点：{review.riskPoints.join(", ")}</p> : null}
                        <p className="mt-2 text-xs text-stone-500">{shortDate(review.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                "暂无审核记录"
              ),
              <WorkflowHint key={`next-${submission.id}`} title={nextStep.title} body={nextStep.body} tone={nextStep.tone} />,
              canReview ? (
                <details className="min-w-80" key={`action-${submission.id}`}>
                  <summary className="cursor-pointer font-black text-stone-950">处理草稿</summary>
                  <form action={reviewSubmissionAction.bind(null, submission.id)} className="mt-3 grid gap-2">
                    <textarea
                      className="min-h-20 rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm text-stone-950 shadow-inner outline-none focus:border-amber-400"
                      defaultValue={submission.reviews.at(-1)?.comment ?? ""}
                      name="comment"
                      placeholder="审核意见，拒绝或要求修改时必须写清原因"
                      required
                    />
                    <textarea
                      className="min-h-14 rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm text-stone-950 shadow-inner outline-none focus:border-amber-400"
                      name="riskPoints"
                      placeholder="结构化风险点，逗号分隔，可选"
                    />
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton name="decision" pendingLabel="正在通过..." value={ReviewDecision.APPROVED} variant="secondary">通过</SubmitButton>
                      {canRequestRevision ? (
                        <SubmitButton name="decision" pendingLabel="正在提交..." value={ReviewDecision.REVISION_REQUESTED} variant="ghost">要求修改</SubmitButton>
                      ) : null}
                      <SubmitButton name="decision" pendingLabel="正在拒绝..." value={ReviewDecision.REJECTED} variant="danger">拒绝</SubmitButton>
                    </div>
                    {!canRequestRevision ? <p className="text-xs text-red-700">已达到最多 {campaign.revisionLimit} 轮修改，本次只能通过或拒绝。</p> : null}
                  </form>
                </details>
              ) : (
                <span className="text-sm font-semibold text-stone-600" key={`done-${submission.id}`}>无需操作</span>
              ),
            ];
          })}
        />
      ) : null}
    </div>
  );
}
