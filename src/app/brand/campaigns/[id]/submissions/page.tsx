import { ReviewDecision, SubmissionStatus, UserRole } from "@prisma/client";
import { reviewSubmissionAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, EmptyState, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { shortDate } from "@/lib/format";

function changed(before?: string, after?: string) {
  if (!before) return "首版提交";
  return before === after ? "未修改" : "已修改";
}

export default async function BrandSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const { error } = await searchParams;
  const campaign = await prisma.campaign.findFirst({ where: { id, brand: { userId: session.userId } } });
  if (!campaign) return <PageHeader title="未找到推广活动" />;

  const submissions = await prisma.submission.findMany({
    where: { campaignId: id },
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
      {submissions.length === 0 ? <EmptyState title="暂无内容提交" body="KOL 提交结构化草稿后，会在这里显示版本对比、广告披露说明和审核记录。" /> : null}

      {submissions.map((submission) => {
        const versions = submission.application.drafts;
        const currentIndex = versions.findIndex((draft) => draft.id === submission.draftId);
        const previous = currentIndex > 0 ? versions[currentIndex - 1] : undefined;
        const current = submission.draft;
        const reviewAction = reviewSubmissionAction.bind(null, submission.id);
        const canReview = submission.status === SubmissionStatus.SUBMITTED;
        const canRequestRevision = current.revisionRound < campaign.revisionLimit;

        return (
          <Card key={submission.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{current.title}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {submission.creator.displayName} · {submission.application.task.platform} · {shortDate(submission.createdAt)} · 第 {current.revisionRound} 轮
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge>{submission.status}</StatusBadge>
                <StatusBadge>{current.reviewStatus}</StatusBadge>
              </div>
            </div>

            <section className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                <h3 className="font-black text-stone-950">KOL 与任务信息</h3>
                <div className="mt-3 grid gap-2">
                  <p><strong>账号：</strong>{submission.application.selectedSocialAccount?.platform ?? submission.application.task.platform} / {submission.application.selectedSocialAccount?.accountName ?? "未绑定"}</p>
                  <p><strong>账号链接：</strong>{submission.application.selectedSocialAccount?.accountUrl ?? "-"}</p>
                  <p><strong>内容形式：</strong>{submission.application.task.contentType}</p>
                  <p><strong>交稿截止：</strong>{submission.application.task.draftDeadline ? shortDate(submission.application.task.draftDeadline) : shortDate(submission.application.task.deadline)}</p>
                  <p><strong>发布截止：</strong>{submission.application.task.publishDeadline ? shortDate(submission.application.task.publishDeadline) : shortDate(submission.application.task.deadline)}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-stone-700">
                <h3 className="font-black text-stone-950">广告披露与附件</h3>
                <p className="mt-3 whitespace-pre-wrap">{current.disclosurePosition || "未填写披露位置"}</p>
                {current.previewAttachmentUrl ? (
                  <a className="mt-3 inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 font-semibold text-stone-950" href={current.previewAttachmentUrl}>
                    查看预览附件
                  </a>
                ) : (
                  <p className="mt-3 text-stone-500">未提交预览附件。</p>
                )}
              </div>
            </section>

            <section className="mt-5">
              <h3 className="mb-3 font-black text-stone-950">版本对比</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                  <h3 className="font-black text-stone-950">上一版</h3>
                  {previous ? (
                    <div className="mt-3 grid gap-3 text-sm text-stone-600">
                      <p className="font-semibold">{previous.title}</p>
                      <p className="whitespace-pre-wrap">{previous.script}</p>
                      <p>{previous.caption}</p>
                      <p>{previous.hashtags.join(" ")}</p>
                      <p>封面：{previous.coverText}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-stone-500">这是 KOL 的首版提交。</p>
                  )}
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4">
                  <h3 className="font-black text-stone-950">当前版</h3>
                  <div className="mt-3 grid gap-3 text-sm text-stone-700">
                    <p className="font-semibold">{current.title}</p>
                    <p className="whitespace-pre-wrap">{current.script}</p>
                    <p>{current.caption}</p>
                    <p>{current.hashtags.join(" ")}</p>
                    <p>封面：{current.coverText}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-3xl border border-stone-200 bg-white/70 p-4">
              <h3 className="font-black text-stone-950">修改记录</h3>
              <div className="mt-3 grid gap-2 text-sm text-stone-600 md:grid-cols-4">
                <p>标题：{changed(previous?.title, current.title)}</p>
                <p>脚本：{changed(previous?.script, current.script)}</p>
                <p>文案：{changed(previous?.caption, current.caption)}</p>
                <p>封面：{changed(previous?.coverText, current.coverText)}</p>
              </div>
            </section>

            <section className="mt-4 rounded-3xl border border-stone-200 bg-white/70 p-4">
              <h3 className="font-black text-stone-950">审核历史</h3>
              {submission.reviews.length ? (
                <div className="mt-3 grid gap-3">
                  {submission.reviews.map((review) => (
                    <div className="rounded-2xl bg-stone-50 p-4 text-sm" key={review.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black text-stone-950">{review.reviewerRole === "ADMIN" ? "平台审核" : "商家审核"} · {review.reviewer.email}</p>
                        <StatusBadge>{review.decision}</StatusBadge>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-stone-700">{review.comment}</p>
                      {review.riskPoints.length ? <p className="mt-2 text-amber-700">风险点：{review.riskPoints.join(", ")}</p> : null}
                      <p className="mt-2 text-xs text-stone-500">{shortDate(review.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-500">暂无审核记录。</p>
              )}
            </section>

            {canReview ? (
              <form action={reviewAction} className="mt-5 grid gap-3">
                <Textarea label="本次审核意见，拒绝或要求修改时必须写清原因" name="comment" required defaultValue={submission.reviews.at(-1)?.comment ?? ""} />
                <Textarea label="结构化风险点，逗号分隔，可选" name="riskPoints" rows={2} />
                <div className="flex flex-wrap gap-2">
                  <Button name="decision" value={ReviewDecision.APPROVED} variant="secondary">通过，允许发布</Button>
                  {canRequestRevision ? (
                    <Button name="decision" value={ReviewDecision.REVISION_REQUESTED} variant="ghost">要求修改</Button>
                  ) : null}
                  <Button name="decision" value={ReviewDecision.REJECTED} variant="danger">拒绝</Button>
                </div>
                {!canRequestRevision ? <p className="text-sm text-red-700">已达到最多 {campaign.revisionLimit} 轮修改，本次只能通过或拒绝。</p> : null}
              </form>
            ) : (
              <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">该草稿当前不是待审核状态，无需操作。</div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
