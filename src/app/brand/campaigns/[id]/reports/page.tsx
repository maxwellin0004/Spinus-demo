import { ProofStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DataTable, EmptyState, LinkButton, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { money, number, shortDate } from "@/lib/format";

export default async function BrandCampaignReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: {
      tasks: { include: { applications: true } },
      submissions: {
        include: {
          creator: true,
          draft: true,
          proofs: { include: { postMetricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 } }, orderBy: { createdAt: "desc" } },
          application: { include: { task: true, selectedSocialAccount: { include: { metricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 } } } } },
        },
        orderBy: { createdAt: "desc" },
      },
      proofs: true,
    },
  });
  if (!campaign) return <PageHeader title="未找到报表" />;

  const applications = campaign.tasks.flatMap((task) => task.applications);
  const approvedApplications = applications.filter((application) => application.status === "APPROVED").length;
  const submittedDrafts = campaign.submissions.length;
  const approvedSubmissionStatuses: SubmissionStatus[] = [SubmissionStatus.APPROVED, SubmissionStatus.PROOF_SUBMITTED, SubmissionStatus.VERIFIED, SubmissionStatus.SETTLED];
  const approvedDrafts = campaign.submissions.filter((submission) => approvedSubmissionStatuses.includes(submission.status)).length;
  const linkSubmitted = campaign.proofs.length;
  const acceptedLinks = campaign.proofs.filter((proof) => proof.verificationStatus === ProofStatus.VERIFIED).length;
  const rejectedLinks = campaign.proofs.filter((proof) => proof.verificationStatus === ProofStatus.REJECTED).length;
  const settled = campaign.submissions.filter((submission) => submission.status === SubmissionStatus.SETTLED).length;
  const completionRate = approvedApplications ? `${Math.round((acceptedLinks / approvedApplications) * 100)}%` : "0%";

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Campaign 报表" title={campaign.title}>
        <StatusBadge>{campaign.status}</StatusBadge>
        <LinkButton href={`/api/brand/campaigns/${campaign.id}/report.csv`} variant="ghost">导出 CSV</LinkButton>
      </PageHeader>

      {campaign.submissions.length === 0 ? <EmptyState title="暂无履约记录" body="KOL 提交草稿或发布链接后，报表会显示履约状态。" /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard label="托管预算" value={money(campaign.escrowAmount, campaign.currency)} />
        <MetricCard label="通过 KOL" value={approvedApplications} />
        <MetricCard label="草稿提交" value={submittedDrafts} />
        <MetricCard label="发布链接" value={linkSubmitted} />
        <MetricCard label="验收通过" value={acceptedLinks} sub={`完成率 ${completionRate}`} />
        <MetricCard label="已结算" value={settled} />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">任务履约汇总</h2>
        <DataTable
          headers={["平台", "内容形式", "名额", "申请", "通过", "奖励", "发布截止"]}
          rows={campaign.tasks.map((task) => [
            task.platform,
            task.contentType,
            `${task.slotsTaken}/${task.slotsTotal}`,
            task.applications.length,
            task.applications.filter((application) => application.status === "APPROVED").length,
            money(task.rewardAmount, campaign.currency),
            shortDate(task.publishDeadline ?? task.deadline),
          ])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">KOL 履约明细</h2>
        <DataTable
          headers={["KOL", "平台", "账号", "草稿状态", "发布状态", "结算状态", "发布链接", "粉丝快照", "浏览", "点赞", "收藏", "评论", "分享", "作者匹配", "更新时间"]}
          rows={campaign.submissions.map((submission) => {
            const latestProof = submission.proofs[0];
            const latestPostSnapshot = latestProof?.postMetricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
            const latestAccountSnapshot = submission.application.selectedSocialAccount?.metricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
            return [
              submission.creator.displayName,
              submission.application.task.platform,
              submission.application.selectedSocialAccount?.accountName ?? "-",
              submission.status,
              latestProof ? `${latestProof.verificationStatus} / ${latestProof.publicationStatus}` : submission.publicationStatus,
              submission.settlementStatus,
              latestProof ? <a className="font-semibold text-stone-950" href={latestProof.postUrl} key={latestProof.id} target="_blank">打开链接</a> : "-",
              latestAccountSnapshot?.followerCount == null ? "-" : number(latestAccountSnapshot.followerCount),
              latestPostSnapshot?.viewCount == null ? "-" : number(latestPostSnapshot.viewCount),
              latestPostSnapshot?.likeCount == null ? "-" : number(latestPostSnapshot.likeCount),
              latestPostSnapshot?.favoriteCount == null ? "-" : number(latestPostSnapshot.favoriteCount),
              latestPostSnapshot?.commentCount == null ? "-" : number(latestPostSnapshot.commentCount),
              latestPostSnapshot?.shareCount == null ? "-" : number(latestPostSnapshot.shareCount),
              latestPostSnapshot?.authorMatchStatus ?? "-",
              shortDate(submission.updatedAt),
            ];
          })}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">验收结果</h2>
        <DataTable
          headers={["发布链接", "KOL", "状态", "拒绝原因", "补交次数", "提交时间"]}
          rows={campaign.submissions.flatMap((submission) =>
            submission.proofs.map((proof) => [
              <a className="font-semibold text-stone-950" href={proof.postUrl} key={proof.id} target="_blank">打开链接</a>,
              submission.creator.displayName,
              <StatusBadge key="s">{proof.verificationStatus}</StatusBadge>,
              proof.rejectionReason ? `${proof.rejectionReason}: ${proof.rejectionNote ?? ""}` : "-",
              proof.resubmissionCount,
              shortDate(proof.createdAt),
            ]),
          )}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">数据指标</h2>
        <DataTable
          headers={["发布数", "验收通过", "验收拒绝", "播放", "点赞", "点击", "转化"]}
          rows={[[
            linkSubmitted,
            acceptedLinks,
            rejectedLinks,
            number(campaign.proofs.reduce((sum, proof) => sum + proof.views, 0)),
            number(campaign.proofs.reduce((sum, proof) => sum + proof.likes, 0)),
            number(campaign.proofs.reduce((sum, proof) => sum + proof.clicks, 0)),
            number(campaign.proofs.reduce((sum, proof) => sum + proof.conversions, 0)),
          ]]}
        />
      </section>
    </div>
  );
}
