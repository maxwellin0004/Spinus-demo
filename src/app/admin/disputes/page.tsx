import Link from "next/link";
import { DisputeDecision, DisputeStatus, ProofStatus } from "@prisma/client";
import { createDisputeFromProofAction, decideDisputeAction } from "@/lib/actions";
import { requireAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Card, DataTable, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";
import { crawlerMetric, money, shortDate } from "@/lib/format";

const decisionLabels: Record<DisputeDecision, string> = {
  FULL_SETTLEMENT: "支持 KOL，全额结算",
  FULL_REFUND: "支持商家，全额退回",
  PARTIAL_SETTLEMENT: "部分结算",
  ALLOW_RESUBMISSION: "允许 KOL 补交",
};

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; dispute?: string }>;
}) {
  await requireAdminPermission("proof.review");
  const { status, error, dispute: focusedDisputeId } = await searchParams;
  const statusFilter = status && status !== "ALL" ? (status as DisputeStatus) : undefined;
  const disputes = await prisma.dispute.findMany({
    where: { status: statusFilter },
    include: {
      submission: {
        include: {
          campaign: { include: { brand: true } },
          creator: true,
          draft: true,
          reviews: { include: { reviewer: true }, orderBy: { createdAt: "asc" } },
          proofs: { include: { postMetricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 } }, orderBy: { createdAt: "desc" } },
          application: { include: { task: true, selectedSocialAccount: { include: { metricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 } } } } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const rejectedProofs = await prisma.proof.findMany({
    where: {
      verificationStatus: ProofStatus.REJECTED,
      submission: {
        disputes: { none: { status: { in: [DisputeStatus.OPEN, DisputeStatus.NEEDS_INFO, DisputeStatus.DECIDED] } } },
      },
    },
    include: {
      campaign: { include: { brand: true } },
      creator: true,
      submission: { include: { application: { include: { task: true, selectedSocialAccount: { include: { metricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } } } } }, draft: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const openCount = disputes.filter((item) => item.status === DisputeStatus.OPEN || item.status === DisputeStatus.NEEDS_INFO).length;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="争议处理">
        <StatusBadge>{openCount} 待处理</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <form className="flex flex-wrap gap-3">
        <select className="rounded-full border border-stone-200 px-4 py-3" name="status" defaultValue={status ?? "ALL"}>
          <option value="ALL">全部</option>
          <option value="OPEN">待处理</option>
          <option value="NEEDS_INFO">待补充信息</option>
          <option value="DECIDED">已裁决</option>
          <option value="CLOSED">已关闭</option>
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>

      <section>
        <h2 className="mb-3 text-xl font-semibold">可创建争议的拒绝记录</h2>
        <DataTable
          headers={["商家", "KOL", "任务", "拒绝原因", "链接", "时间", "操作"]}
          rows={rejectedProofs.map((proof) => [
            proof.campaign.brand.brandName,
            proof.creator.displayName,
            proof.submission.application.task.title,
            proof.rejectionReason ?? "-",
            <Link className="font-semibold text-stone-950" href={proof.postUrl} key={proof.id} target="_blank">打开链接</Link>,
            shortDate(proof.updatedAt),
            <form action={createDisputeFromProofAction.bind(null, proof.id)} className="grid gap-2" key={`form-${proof.id}`}>
              <input name="reason" type="hidden" value={`商家拒绝发布链接：${proof.rejectionReason ?? "未说明"}. ${proof.rejectionNote ?? ""}`} />
              <SubmitButton pendingLabel="正在创建..." variant="ghost">创建争议</SubmitButton>
            </form>,
          ])}
        />
      </section>

      <div className="grid gap-4">
        {disputes.map((dispute) => {
          const submission = dispute.submission;
          if (!submission) return null;
          const action = decideDisputeAction.bind(null, dispute.id);
          const latestProof = submission.proofs[0];
          const latestPostSnapshot = latestProof?.postMetricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
          const latestPostAttempt = latestProof?.postMetricSnapshots[0];
          const latestAccountSnapshot = submission.application.selectedSocialAccount?.metricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
          const rewardAmount = Number(submission.application.task.rewardAmount);
          const focused = focusedDisputeId === dispute.id;

          return (
            <Card key={dispute.id} className={focused ? "ring-4 ring-amber-200" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-stone-950">{submission.campaign.title}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {submission.campaign.brand.brandName} · {submission.creator.displayName} · {submission.application.task.platform} · {shortDate(dispute.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge>{dispute.status}</StatusBadge>
                  {dispute.decision ? <StatusBadge>{dispute.decision}</StatusBadge> : null}
                </div>
              </div>

              <section className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                  <h3 className="font-black text-stone-950">争议摘要</h3>
                  <div className="mt-3 grid gap-2">
                    <p><strong>原因：</strong>{dispute.reason}</p>
                    <p><strong>商家拒绝分类：</strong>{dispute.merchantReasonCategory ?? "-"}</p>
                    <p><strong>商家说明：</strong>{dispute.merchantNote ?? "-"}</p>
                    <p><strong>KOL 回应：</strong>{dispute.kolResponse ?? "暂无"}</p>
                    <p><strong>任务奖励：</strong>{money(rewardAmount, submission.campaign.currency)}</p>
                    <p><strong>当前结算：</strong>{submission.settlementStatus} / {submission.settlementAmount ? money(submission.settlementAmount, submission.campaign.currency) : "-"}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-stone-700">
                  <h3 className="font-black text-stone-950">平台内证据</h3>
                  <div className="mt-3 grid gap-2">
                    <p><strong>发布账号：</strong>{submission.application.selectedSocialAccount?.accountName ?? "未绑定"}</p>
                    <p><strong>账号链接：</strong>{submission.application.selectedSocialAccount?.accountUrl ?? "-"}</p>
                    <p><strong>发布链接：</strong>{latestProof ? <Link className="font-semibold text-stone-950" href={latestProof.postUrl} target="_blank">打开链接</Link> : "-"}</p>
                    <p><strong>Proof 状态：</strong>{latestProof ? `${latestProof.verificationStatus} / ${latestProof.publicationStatus}` : "-"}</p>
                    <p><strong>账号抓取粉丝：</strong>{latestAccountSnapshot?.followerCount == null ? "未获取" : latestAccountSnapshot.followerCount.toLocaleString("zh-CN")}</p>
                    <p><strong>作品作者匹配：</strong>{latestPostSnapshot?.authorMatchStatus ?? "未核验"}</p>
                    <p><strong>作品数据：</strong>{latestPostSnapshot ? `浏览 ${crawlerMetric(latestPostSnapshot.viewCount, "views", latestPostSnapshot.rawProvider)} / 点赞 ${crawlerMetric(latestPostSnapshot.likeCount, "likes", latestPostSnapshot.rawProvider)} / 收藏 ${crawlerMetric(latestPostSnapshot.favoriteCount, "saves", latestPostSnapshot.rawProvider)} / 评论 ${crawlerMetric(latestPostSnapshot.commentCount, "comments", latestPostSnapshot.rawProvider)} / 分享 ${crawlerMetric(latestPostSnapshot.shareCount, "shares", latestPostSnapshot.rawProvider)}` : "未获取"}</p>
                    <p><strong>自动抓取提示：</strong>{latestPostAttempt?.failureReason ?? "-"}</p>
                    <p><strong>广告披露：</strong>{submission.draft.disclosurePosition ?? "未填写"}</p>
                    <p><strong>已通过草稿：</strong>{submission.draft.title}</p>
                    <p className="whitespace-pre-wrap rounded-2xl bg-white/70 p-3">{submission.draft.caption}</p>
                  </div>
                </div>
              </section>

              {submission.reviews.length ? (
                <section className="mt-4 rounded-3xl border border-stone-200 bg-white/70 p-4">
                  <h3 className="font-black text-stone-950">草稿审核记录</h3>
                  <div className="mt-3 grid gap-3">
                    {submission.reviews.map((review) => (
                      <div className="rounded-2xl bg-stone-50 p-3 text-sm" key={review.id}>
                        <p className="font-semibold">{review.reviewerRole} · {review.decision} · {shortDate(review.createdAt)}</p>
                        <p className="mt-1 whitespace-pre-wrap">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {dispute.status === DisputeStatus.OPEN || dispute.status === DisputeStatus.NEEDS_INFO ? (
                <form action={action} className="mt-5 grid gap-3">
                  <Select label="裁决结果" name="decision" defaultValue={DisputeDecision.ALLOW_RESUBMISSION}>
                    {Object.entries(decisionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </Select>
                  <Field label="部分结算金额，仅部分结算时填写" name="partialSettlementAmount" type="number" defaultValue={Math.floor(rewardAmount / 2)} />
                  <Textarea label="裁决说明" name="resolution" required rows={4} />
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton pendingLabel="正在提交..." variant="secondary">提交裁决</SubmitButton>
                  </div>
                </form>
              ) : (
                <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
                  <p><strong>裁决：</strong>{dispute.decision ? decisionLabels[dispute.decision] : "-"}</p>
                  <p className="mt-2 whitespace-pre-wrap">{dispute.resolution}</p>
                  <p className="mt-2">裁决时间：{shortDate(dispute.decidedAt)}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
