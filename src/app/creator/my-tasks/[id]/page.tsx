import Link from "next/link";
import { ApplicationStatus, ProofStatus, PublicationStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { submitProofAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CopyButton } from "@/components/copy-button";
import { CreatorOperatorCard, CreatorTaskTimeline } from "@/components/creator-ops";
import { SubmitButton } from "@/components/form-controls";
import { Card, Field, PageHeader, PostMetricsPanel, StatusBadge, WorkflowHint } from "@/components/ui";
import { crawlerMetric, money, shortDate } from "@/lib/format";

function proofNextStep(proofStatus?: ProofStatus | null, publishExpired?: boolean) {
  if (proofStatus === ProofStatus.VERIFIED) return { title: "已验收", body: "收益会进入可提现余额。", tone: "success" as const };
  if (proofStatus === ProofStatus.REJECTED) return { title: "需要补交", body: "查看拒绝原因后重新提交链接。", tone: "danger" as const };
  if (proofStatus === ProofStatus.PENDING) return { title: "等待验收", body: "商家会检查链接、数据和内容。", tone: "warning" as const };
  if (publishExpired) return { title: "已过截止", body: "请联系运营确认是否还能补交。", tone: "danger" as const };
  return { title: "提交链接", body: "发布后提交公开可访问的作品链接。", tone: "warning" as const };
}

export default async function CreatorTaskRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; applied?: string; submitted?: string; proof?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { id } = await params;
  const { error, applied, submitted, proof: proofSubmitted } = await searchParams;
  const application = await prisma.taskApplication.findFirst({
    where: { id, creator: { userId: session.userId } },
    include: {
      creator: { include: { responsibleAdmin: { include: { user: true } } } },
      task: { include: { campaign: { include: { assets: true } } } },
      submissions: {
        include: {
          draft: true,
          reviews: { orderBy: { createdAt: "desc" } },
          proofs: { include: { postMetricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 }, crawlerJobs: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!application) return <PageHeader title="未找到任务" />;

  const submission = application.submissions[0];
  const latestProof = submission?.proofs[0];
  const latestPostSnapshot = latestProof?.postMetricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
  const latestCrawlerSnapshot = latestProof?.postMetricSnapshots[0];
  const latestCrawlerJob = latestProof?.crawlerJobs[0];
  const campaign = application.task.campaign;
  const requiresDraftReview = campaign.requiresDraftReview;
  const publishDeadline = application.task.publishDeadline ?? application.task.deadline;
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const publishExpired = now > publishDeadline.getTime();
  const latestProofStep = proofNextStep(latestProof?.verificationStatus, publishExpired);
  const canCreate = application.status === ApplicationStatus.APPROVED;
  const canOpenStudio = canCreate && (!submission || submission.status === SubmissionStatus.REVISION_REQUESTED);
  const canSubmitLink = submission?.status === SubmissionStatus.APPROVED && !publishExpired;
  const hasPendingOrAcceptedProof = submission?.proofs.some((item) => item.verificationStatus !== ProofStatus.REJECTED) ?? false;
  const canSubmitProof = canSubmitLink && !hasPendingOrAcceptedProof;
  const currentAction = canOpenStudio
    ? { title: requiresDraftReview ? "提交内容草稿" : "填写发布内容", body: "进入内容工作台完成当前任务的下一步。", href: `/creator/content-studio/${application.id}` }
    : canSubmitProof
      ? { title: "提交发布链接", body: "复制文案发布后，把公开可访问的作品链接提交给品牌验收。", href: null }
      : application.status === ApplicationStatus.APPLIED
        ? { title: "等待申请审核", body: "品牌或平台通过申请后，任务会进入内容制作阶段。", href: null }
        : { title: "当前无可提交动作", body: "继续查看审核意见、验收状态或等待品牌处理。", href: null };
  const finalCopy = submission
    ? [
        submission.draft.title,
        "",
        submission.draft.script,
        "",
        submission.draft.caption,
        submission.draft.hashtags.join(" "),
        campaign.cta,
      ].filter(Boolean).join("\n")
    : "";

  const applicationApproved = application.status === ApplicationStatus.APPROVED;
  const applicationRejected = application.status === ApplicationStatus.REJECTED;
  const applicationDetail = applicationApproved
    ? `已通过${application.approvedAt ? ` · ${shortDate(application.approvedAt)}` : ""}`
    : applicationRejected
      ? "未通过"
      : `待通过 · 申请于 ${shortDate(application.createdAt)}`;

  const timeline = [
    {
      label: "申请状态",
      done: applicationApproved,
      detail: applicationDetail,
      active: application.status === ApplicationStatus.APPLIED,
    },
    ...(requiresDraftReview
      ? [
          {
            label: "内容草稿",
            done: Boolean(submission),
            detail: submission ? shortDate(submission.submittedAt) : "等待提交草稿",
            active: canCreate && !submission,
          },
          {
            label: "商家审稿",
            done: submission?.status === SubmissionStatus.APPROVED || ["PROOF_SUBMITTED", "VERIFIED", "SETTLED"].includes(submission?.status ?? ""),
            detail: submission?.revisionNote ?? submission?.status ?? "未提交",
            active: submission?.status === SubmissionStatus.SUBMITTED || submission?.status === SubmissionStatus.REVISION_REQUESTED,
          },
        ]
      : []),
    {
      label: "发布链接",
      done: Boolean(latestProof),
      detail: latestProof ? shortDate(latestProof.createdAt) : `发布截止 ${shortDate(publishDeadline)}`,
      active: canSubmitProof || submission?.status === SubmissionStatus.PROOF_SUBMITTED,
    },
    {
      label: "商家验收",
      done: latestProof?.verificationStatus === ProofStatus.VERIFIED,
      detail: latestProof?.verificationStatus ?? "等待链接",
      active: latestProof?.verificationStatus === ProofStatus.PENDING,
    },
    {
      label: "收益入账",
      done: submission?.publicationStatus === PublicationStatus.ACCEPTED || submission?.status === SubmissionStatus.VERIFIED || submission?.status === SubmissionStatus.SETTLED,
      detail: submission?.settlementStatus ?? "验收通过后入账",
      active: submission?.status === SubmissionStatus.VERIFIED,
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="任务工作区" title={application.task.title}>
        <StatusBadge>{application.status}</StatusBadge>
        {submission ? <StatusBadge>{submission.status}</StatusBadge> : null}
        {canOpenStudio ? (
          <Link className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950" href={`/creator/content-studio/${application.id}`}>
            {requiresDraftReview ? "提交内容草稿" : "填写发布内容"}
          </Link>
        ) : null}
      </PageHeader>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {applied ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">申请已提交，等待商家审核。</div> : null}
      {submitted ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{requiresDraftReview ? "内容草稿已提交。" : "内容已提交，可以进入发布阶段。"}</div> : null}
      {proofSubmitted ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">发布链接已提交，等待商家验收。</div> : null}

      <Card className="border-amber-200 bg-amber-50/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">当前要处理</p>
            <h2 className="mt-2 text-xl font-black text-stone-950">{currentAction.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{currentAction.body}</p>
          </div>
          {currentAction.href ? (
            <Link className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-stone-950" href={currentAction.href}>
              去处理
            </Link>
          ) : null}
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <h2 className="text-xl font-semibold">{campaign.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-stone-600">{campaign.brief}</p>
          <p className="mt-3 text-sm font-semibold">奖励：{money(application.task.rewardAmount)} · 发布截止：{shortDate(publishDeadline)}</p>
          <p className="mt-2 text-sm text-stone-500">流程：{requiresDraftReview ? "需要商家审稿" : "免草稿审稿，提交内容后直接进入发布阶段"}</p>
          {application.applicationNote ? <p className="mt-3 rounded-2xl bg-stone-100 p-3 text-sm text-stone-600">申请说明：{application.applicationNote}</p> : null}
        </Card>
        <CreatorOperatorCard
          name={application.creator.responsibleAdmin?.displayName}
          email={application.creator.responsibleAdmin?.user.email}
          wechat={application.creator.responsibleAdmin?.wechat}
        />
      </section>

      <CreatorTaskTimeline items={timeline} />

      {submission ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{requiresDraftReview ? "已提交内容" : "发布内容"}</h2>
            <div className="flex flex-wrap gap-2">
              <StatusBadge>{submission.status}</StatusBadge>
              <StatusBadge>{submission.publicationStatus}</StatusBadge>
            </div>
          </div>
          <p className="mt-3 font-semibold">{submission.draft.title}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{submission.draft.caption}</p>
          <p className="mt-2 text-sm text-stone-600">{submission.draft.hashtags.join(" ")}</p>
          {submission.reviews.length ? (
            <div className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm">
              <p className="font-semibold">最新审核意见</p>
              <p>{submission.reviews[0].comment}</p>
            </div>
          ) : null}
          {submission.revisionNote && submission.publicationStatus === PublicationStatus.REJECTED ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">发布链接被拒绝</p>
              <p>{submission.revisionNote}</p>
            </div>
          ) : null}
        </Card>
      ) : (
        <Card>
          <h2 className="text-xl font-semibold">下一步</h2>
          <p className="mt-2 text-sm text-stone-600">
            {canCreate
              ? requiresDraftReview
                ? "申请已通过，请进入内容草稿页提交给商家审稿。"
                : "申请已通过，请填写发布内容，提交后直接进入发布链接阶段。"
              : "申请正在审核，通过后才能制作内容。"}
          </p>
        </Card>
      )}

      {submission?.status === SubmissionStatus.APPROVED ? (
        <Card>
          <h2 className="text-xl font-semibold">发布链接提交</h2>
          <p className="mt-2 text-sm text-stone-500">第一版只要求提交公开可访问的发布链接。链接失效或不可访问，默认由 KOL 负责补交。</p>
          <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl bg-stone-100 p-4 text-sm">
              <p className="font-semibold">发布文案</p>
              <p className="mt-2 font-black">{submission.draft.title}</p>
              <p className="mt-2 whitespace-pre-wrap">{submission.draft.caption}</p>
              <p className="mt-2">{submission.draft.hashtags.join(" ")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton text={submission.draft.title} label="复制标题" />
                <CopyButton text={submission.draft.caption} label="复制文案" />
                <CopyButton text={submission.draft.hashtags.join(" ")} label="复制话题" />
                <CopyButton text={finalCopy} label="复制全部" />
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/70 p-4 text-sm">
              <p className="font-black text-stone-950">发布确认</p>
              <ul className="mt-3 grid gap-2 text-stone-600">
                {campaign.disclosureRequired ? <li>已包含广告披露：{submission.draft.disclosurePosition}</li> : null}
                <li>已确认 CTA：{campaign.cta}</li>
                <li>已确认禁用表达：{campaign.mustNotInclude.join(", ") || "无"}</li>
                <li>发布链接必须公开可访问，并匹配任务平台：{application.task.platform}</li>
              </ul>
            </div>
          </section>
          {latestProof ? (
            <div className="mt-4 rounded-2xl border border-stone-200 bg-white/70 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-stone-950">最近提交</p>
                  <p className="mt-2">
                    <Link className="font-semibold text-stone-950" href={latestProof.postUrl} target="_blank">打开链接</Link>
                    <span className="ml-3">{latestProof.verificationStatus} / {latestProof.publicationStatus}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <CopyButton text={latestProof.postUrl} label="复制链接" />
                  </div>
                </div>
                <WorkflowHint title={latestProofStep.title} body={latestProofStep.body} tone={latestProofStep.tone} />
              </div>
              {latestProof.rejectionReason ? <p className="mt-2 text-red-700">{latestProof.rejectionReason}: {latestProof.rejectionNote}</p> : null}
              <div className="mt-4 rounded-2xl bg-stone-50 p-3">
                <p className="font-black text-stone-950">自动核验</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <p><strong>状态：</strong>{latestCrawlerJob ? latestCrawlerJob.status : latestCrawlerSnapshot ? latestCrawlerSnapshot.status : "等待核验"}</p>
                  <p><strong>最近抓取：</strong>{latestCrawlerSnapshot ? shortDate(latestCrawlerSnapshot.fetchedAt) : "-"}</p>
                  <p><strong>作者匹配：</strong>{latestPostSnapshot?.authorMatchStatus ?? "未核验"}</p>
                  <p><strong>浏览：</strong>{crawlerMetric(latestPostSnapshot?.viewCount, "views", latestPostSnapshot?.rawProvider)}</p>
                  <p><strong>点赞：</strong>{crawlerMetric(latestPostSnapshot?.likeCount, "likes", latestPostSnapshot?.rawProvider)}</p>
                  <p><strong>收藏：</strong>{crawlerMetric(latestPostSnapshot?.favoriteCount, "saves", latestPostSnapshot?.rawProvider)}</p>
                  <p><strong>评论：</strong>{crawlerMetric(latestPostSnapshot?.commentCount, "comments", latestPostSnapshot?.rawProvider)}</p>
                  <p><strong>分享：</strong>{crawlerMetric(latestPostSnapshot?.shareCount, "shares", latestPostSnapshot?.rawProvider)}</p>
                  <p><strong>提示：</strong>{latestCrawlerSnapshot?.failureReason ? "自动核验失败，请等待商家人工验收。" : "-"}</p>
                </div>
                <div className="mt-4">
                  <PostMetricsPanel snapshot={latestPostSnapshot} latestAttempt={latestCrawlerSnapshot} />
                </div>
              </div>
            </div>
          ) : null}
          {!latestProof ? (
            <div className="mt-4">
              <WorkflowHint title={latestProofStep.title} body={latestProofStep.body} tone={latestProofStep.tone} />
            </div>
          ) : null}
          {canSubmitProof ? (
            <form action={submitProofAction.bind(null, submission.id)} className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="发布链接" name="postUrl" required placeholder="https://..." />
              <Field label="发布时间" name="publishedAt" type="datetime-local" required />
              <div className="flex items-end"><SubmitButton pendingLabel="正在提交..." variant="secondary">提交发布链接</SubmitButton></div>
            </form>
          ) : (
            <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
              {publishExpired ? "发布截止时间已过，请等待商家或平台处理。" : "当前已有发布链接等待验收，或该任务已进入后续阶段。"}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

