import Link from "next/link";
import { ApplicationStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { submitProofAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CopyButton } from "@/components/copy-button";
import { CreatorOperatorCard, CreatorTaskTimeline } from "@/components/creator-ops";
import { Button, Card, Field, PageHeader, StatusBadge } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function CreatorTaskRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; applied?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { id } = await params;
  const { error, applied } = await searchParams;
  const application = await prisma.taskApplication.findFirst({
    where: { id, creator: { userId: session.userId } },
    include: {
      creator: { include: { responsibleAdmin: { include: { user: true } } } },
      task: { include: { campaign: { include: { assets: true } } } },
      submissions: { include: { draft: true, reviews: { orderBy: { createdAt: "desc" } }, proofs: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!application) return <PageHeader title="未找到任务" />;
  const submission = application.submissions[0];
  const proof = submission?.proofs[0];
  const canPublish = submission?.status === SubmissionStatus.APPROVED;
  const canCreate = application.status === ApplicationStatus.APPROVED;
  const hasSubmission = Boolean(submission);
  const hasProof = Boolean(proof);
  const timeline = [
    { label: "已申请", done: true, detail: shortDate(application.createdAt), active: application.status === "APPLIED" },
    { label: "已通过", done: application.status === "APPROVED", detail: application.status === "REJECTED" ? "申请被拒绝" : shortDate(application.approvedAt), active: application.status === "APPROVED" && !hasSubmission },
    { label: "制作中", done: hasSubmission || canCreate, detail: hasSubmission ? "已提交内容" : "等待制作内容", active: canCreate && !hasSubmission },
    { label: "待审核", done: submission?.status === "SUBMITTED" || ["REVISION_REQUESTED", "APPROVED", "PROOF_SUBMITTED", "VERIFIED", "SETTLED"].includes(submission?.status ?? ""), detail: submission ? shortDate(submission.submittedAt) : "未提交", active: submission?.status === "SUBMITTED" },
    { label: "需修改", done: submission?.status === "REVISION_REQUESTED", detail: submission?.revisionNote ?? "无", active: submission?.status === "REVISION_REQUESTED" },
    { label: "待发布", done: canPublish || ["PROOF_SUBMITTED", "VERIFIED", "SETTLED"].includes(submission?.status ?? ""), detail: canPublish ? "内容已通过，准备发布" : "等待内容通过", active: canPublish },
    { label: "待 Proof", done: hasProof || submission?.status === "PROOF_SUBMITTED" || submission?.status === "VERIFIED" || submission?.status === "SETTLED", detail: hasProof ? shortDate(proof?.createdAt) : "发布后回传链接和截图", active: submission?.status === "PROOF_SUBMITTED" },
    { label: "待结算", done: submission?.status === "VERIFIED" || submission?.status === "SETTLED", detail: submission?.status === "VERIFIED" ? "等待 Admin 确认收益" : "Proof 通过后进入", active: submission?.status === "VERIFIED" },
    { label: "已结算", done: submission?.status === "SETTLED", detail: submission?.status === "SETTLED" ? "收益已入钱包" : "等待结算", active: submission?.status === "SETTLED" },
  ];
  const finalCopy = submission ? [
    submission.draft.title,
    "",
    submission.draft.script,
    "",
    submission.draft.caption,
    submission.draft.hashtags.join(" "),
    application.task.campaign.cta,
  ].filter(Boolean).join("\n") : "";

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="任务工作区" title={application.task.title}>
        <StatusBadge>{application.status}</StatusBadge>
        {canCreate ? <Link className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950" href={`/creator/content-studio/${application.id}`}>内容工作台</Link> : null}
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {applied ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">申请已提交，等待品牌或平台审核。</div> : null}
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <h2 className="text-xl font-semibold">{application.task.campaign.title}</h2>
          <p className="mt-2 text-stone-600">{application.task.campaign.brief}</p>
          <p className="mt-3 text-sm font-semibold">奖励：{money(application.task.rewardAmount)} · 截止时间：{shortDate(application.task.deadline)}</p>
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
            <h2 className="text-xl font-semibold">最新提交</h2>
            <StatusBadge>{submission.status}</StatusBadge>
          </div>
          <p className="mt-3 font-semibold">{submission.draft.title}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{submission.draft.script}</p>
          {submission.reviews.length ? (
            <div className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm">
              <p className="font-semibold">最新审核意见</p>
              <p>{submission.reviews[0].comment}</p>
            </div>
          ) : null}
        </Card>
      ) : (
        <Card>
          <h2 className="text-xl font-semibold">下一步</h2>
          <p className="mt-2 text-sm text-stone-600">{canCreate ? "申请已通过，可以进入内容工作台制作草稿。" : "申请正在审核，通过后才能进入内容工作台。"}</p>
        </Card>
      )}
      {canPublish ? (
        <Card>
          <h2 className="text-xl font-semibold">发布助手</h2>
          <p className="mt-2 text-sm text-stone-500">本产品不存储第三方平台密码，不模拟登录，也不自动发布。请复制已通过内容，手动发布后再提交证明。</p>
          <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl bg-stone-100 p-4 text-sm">
              <p className="font-semibold">已通过文案</p>
              <p className="mt-2 font-black">{submission.draft.title}</p>
              <p className="mt-2 whitespace-pre-wrap">{submission.draft.caption}</p>
              <p className="mt-2">{submission.draft.hashtags.join(" ")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton text={submission.draft.title} label="复制标题" />
                <CopyButton text={submission.draft.caption} label="复制文案" />
                <CopyButton text={submission.draft.hashtags.join(" ")} label="复制 Hashtag" />
                <CopyButton text={finalCopy} label="复制全部" />
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/70 p-4 text-sm">
              <p className="font-black text-stone-950">发布 Checklist</p>
              <ul className="mt-3 grid gap-2 text-stone-600">
                {application.task.campaign.disclosureRequired ? <li>包含商业合作披露。</li> : null}
                <li>确认 CTA：{application.task.campaign.cta}</li>
                <li>确认禁用表达：{application.task.campaign.mustNotInclude.join(", ")}</li>
                <li>确认发布后能回传链接、截图和基础数据。</li>
              </ul>
            </div>
          </section>
          <section className="mt-4 rounded-2xl border border-stone-200 bg-white/70 p-4">
            <p className="font-black text-stone-950">素材下载区</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {application.task.campaign.assets.map((asset) => (
                <a className="rounded-full border border-stone-200 bg-white px-4 py-2 font-semibold text-stone-950" href={asset.url} key={asset.id} download>下载 {asset.name}</a>
              ))}
            </div>
          </section>
          <form action={submitProofAction.bind(null, submission.id)} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Post URL" name="postUrl" required placeholder="https://..." />
            <Field label="Published at" name="publishedAt" type="datetime-local" required />
            <input className="rounded-2xl border border-stone-200 bg-white px-4 py-3" name="screenshot" type="file" />
            <Field label="Screenshot URL (optional)" name="screenshotUrl" />
            <Field label="Views" name="views" type="number" defaultValue={0} />
            <Field label="Likes" name="likes" type="number" defaultValue={0} />
            <Field label="Comments" name="comments" type="number" defaultValue={0} />
            <Field label="Shares" name="shares" type="number" defaultValue={0} />
            <Field label="Saves" name="saves" type="number" defaultValue={0} />
            <Field label="Clicks" name="clicks" type="number" defaultValue={0} />
            <Field label="Conversions" name="conversions" type="number" defaultValue={0} />
            <div className="flex items-end"><Button variant="secondary">提交发布证明</Button></div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
