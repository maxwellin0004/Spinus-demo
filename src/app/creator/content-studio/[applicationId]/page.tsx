import Link from "next/link";
import { ApplicationStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { saveDraftAction, submitContentAction } from "@/lib/actions";
import { generateCreatorContent } from "@/lib/ai";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, Field, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { shortDate } from "@/lib/format";

const modes = ["真实体验型", "教程教学型", "种草推荐型", "开箱测评型", "痛点解决型", "案例复盘型", "挑战任务型"];

export default async function ContentStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ mode?: string; error?: string; saved?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { applicationId } = await params;
  const { mode, error, saved } = await searchParams;
  const application = await prisma.taskApplication.findFirst({
    where: { id: applicationId, creator: { userId: session.userId } },
    include: {
      creator: true,
      task: { include: { campaign: { include: { assets: true } } } },
      drafts: { orderBy: { createdAt: "desc" }, take: 1 },
      submissions: { include: { draft: true, reviews: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!application) return <EmptyState title="未找到申请记录" />;
  if (application.status !== ApplicationStatus.APPROVED) return <EmptyState title="任务尚未通过" body="只有已通过的任务申请可以进入内容工作台。" />;

  const campaign = application.task.campaign;
  const requiresDraftReview = campaign.requiresDraftReview;
  const latestSubmission = application.submissions[0];
  const latestDraft = application.drafts[0];
  const latestReview = latestSubmission?.reviews[0];
  const revisionRound = latestSubmission?.status === SubmissionStatus.REVISION_REQUESTED ? latestSubmission.draft.revisionRound + 1 : latestDraft?.revisionRound ?? 0;
  const revisionLimitReached = latestSubmission?.status === SubmissionStatus.REVISION_REQUESTED && latestSubmission.draft.revisionRound >= campaign.revisionLimit;
  const closedStatuses: SubmissionStatus[] = [SubmissionStatus.SUBMITTED, SubmissionStatus.APPROVED, SubmissionStatus.REJECTED];
  const canSubmit = !revisionLimitReached && !closedStatuses.includes(latestSubmission?.status as SubmissionStatus);

  const generated = mode
    ? await generateCreatorContent({
        campaign: {
          title: campaign.title,
          brief: campaign.brief,
          mustInclude: campaign.mustInclude,
          mustNotInclude: campaign.mustNotInclude,
          hashtags: campaign.hashtags,
          cta: campaign.cta,
        },
        platform: application.task.platform,
        mode,
      })
    : null;

  const title = generated?.title ?? latestDraft?.title ?? "";
  const script = generated?.script ?? latestDraft?.script ?? "";
  const caption = generated?.caption ?? latestDraft?.caption ?? "";
  const coverText = generated?.coverText ?? latestDraft?.coverText ?? "";
  const hashtags = (generated?.hashtags ?? latestDraft?.hashtags ?? campaign.hashtags).join(", ");
  const disclosurePosition = latestDraft?.disclosurePosition ?? (campaign.disclosureRequired ? "标题或正文开头明确标注商业合作/广告披露" : "");

  const save = saveDraftAction.bind(null, application.id);
  const submit = submitContentAction.bind(null, application.id);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="KOL 工作台" title={requiresDraftReview ? "内容草稿" : "发布内容"}>
        <StatusBadge>{application.task.platform}</StatusBadge>
        <StatusBadge>{requiresDraftReview ? "需要商家审稿" : "免草稿审稿"}</StatusBadge>
        {requiresDraftReview ? <StatusBadge>第 {revisionRound} 轮</StatusBadge> : null}
      </PageHeader>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {saved ? <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">草稿已保存。</div> : null}
      {latestSubmission?.status === SubmissionStatus.REVISION_REQUESTED ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-black">商家要求修改</p>
          <p className="mt-2 whitespace-pre-wrap">{latestSubmission.revisionNote || latestReview?.comment}</p>
          <p className="mt-2">最多 {campaign.revisionLimit} 轮修改，当前已完成 {latestSubmission.draft.revisionRound} 轮。</p>
        </div>
      ) : null}
      {!requiresDraftReview ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          该任务不需要商家预审草稿。提交发布内容后会直接进入发布链接阶段。
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-semibold">{campaign.title}</h2>
          <p className="mt-3 whitespace-pre-wrap text-stone-600">{campaign.brief}</p>
          <div className="mt-5 grid gap-2 text-sm text-stone-700">
            <p><strong>平台任务：</strong>{application.task.title}</p>
            <p><strong>平台补充要求：</strong>{application.task.platformRequirement || "无"}</p>
            <p><strong>必须包含：</strong>{campaign.mustInclude.join(", ") || "无"}</p>
            <p><strong>禁止事项：</strong>{campaign.mustNotInclude.join(", ") || "无"}</p>
            <p><strong>行动号召：</strong>{campaign.cta}</p>
            <p><strong>广告披露：</strong>{campaign.disclosureRequired ? "必须显性披露，提交时需要确认位置。" : "当前任务不要求披露。"}</p>
            <p><strong>提交截止：</strong>{application.task.draftDeadline ? shortDate(application.task.draftDeadline) : shortDate(application.task.deadline)}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {modes.map((item) => (
              <Link
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-amber-100"
                href={`/creator/content-studio/${application.id}?mode=${encodeURIComponent(item)}`}
                key={item}
              >
                生成：{item}
              </Link>
            ))}
          </div>
          {campaign.assets.length ? (
            <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-sm">
              <p className="font-black text-stone-950">Campaign 素材</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {campaign.assets.map((asset) => (
                  <a className="rounded-full border border-stone-200 bg-white px-4 py-2 font-semibold text-stone-950" href={asset.url} key={asset.id}>
                    {asset.name}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <form className="grid gap-4" encType="multipart/form-data">
            <input name="provider" type="hidden" value={generated?.provider ?? "manual"} />
            <Field label="标题" name="title" required defaultValue={title} />
            <Textarea label={requiresDraftReview ? "结构化草稿/脚本" : "发布脚本"} name="script" required defaultValue={script} rows={8} />
            <Textarea label="发布文案" name="caption" required defaultValue={caption} rows={4} />
            <Field label="话题标签，逗号分隔" name="hashtags" defaultValue={hashtags} />
            <Field label="封面文案" name="coverText" required defaultValue={coverText} />
            <Textarea label="广告披露位置与方式" name="disclosurePosition" required={campaign.disclosureRequired} defaultValue={disclosurePosition} rows={3} />
            <Field label="预览附件外链，可选" name="previewAttachmentUrl" defaultValue={latestDraft?.previewAttachmentUrl ?? ""} />
            {requiresDraftReview ? (
              <label className="grid gap-2 text-sm font-medium text-stone-700">
                预览附件上传，可选，最大 50MB
                <input className="rounded-2xl border border-stone-200 bg-white px-4 py-3" name="previewAttachment" type="file" />
              </label>
            ) : null}
            <div className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
              {requiresDraftReview
                ? "提交后会执行敏感词检查，并进入商家审稿。"
                : "提交后会执行敏感词检查；通过后直接回到任务页提交发布链接。"}
            </div>
            <div className="flex flex-wrap gap-3">
              {requiresDraftReview ? (
                <button formAction={save} className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700">
                  保存草稿
                </button>
              ) : null}
              <button formAction={submit} disabled={!canSubmit} className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50">
                {requiresDraftReview ? "提交商家审稿" : "提交内容并进入发布"}
              </button>
            </div>
            {!canSubmit ? <p className="text-sm text-stone-500">当前状态不能继续提交，请回到任务详情查看下一步。</p> : null}
          </form>
        </Card>
      </section>
    </div>
  );
}
