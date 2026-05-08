import Link from "next/link";
import { ApplicationStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

function taskStage(status: ApplicationStatus, latest?: { status: SubmissionStatus } | null) {
  if (status === ApplicationStatus.APPLIED) return { label: "申请待审核", next: "等待品牌或平台审核，通过后才能进入内容工作台。" };
  if (status === ApplicationStatus.REJECTED) return { label: "申请已拒绝", next: "如有疑问，请联系你的平台运营。" };
  if (status === ApplicationStatus.CANCELLED) return { label: "申请已取消", next: "该任务当前不能继续推进。" };
  if (!latest) return { label: "内容制作中", next: "进入 Content Studio 生成并提交内容。" };
  if (latest.status === SubmissionStatus.SUBMITTED) return { label: "内容待审核", next: "等待品牌或平台审核内容。" };
  if (latest.status === SubmissionStatus.REVISION_REQUESTED) return { label: "需要修改", next: "查看审核意见后重新编辑提交。" };
  if (latest.status === SubmissionStatus.APPROVED) return { label: "待发布", next: "进入发布助手，复制文案并手动发布。" };
  if (latest.status === SubmissionStatus.PUBLISHED || latest.status === SubmissionStatus.PROOF_SUBMITTED) return { label: "待 Proof 审核", next: "等待 Admin 验证发布链接和数据。" };
  if (latest.status === SubmissionStatus.VERIFIED) return { label: "已验收", next: "Proof 已验证，收益会直接进入钱包。" };
  if (latest.status === SubmissionStatus.SETTLED) return { label: "已入账", next: "收益已进入可提现余额。" };
  return { label: "已结束", next: "该任务当前无需操作。" };
}

export default async function CreatorMyTasksPage() {
  const session = await requireRole(UserRole.CREATOR);
  const applications = await prisma.taskApplication.findMany({
    where: { creator: { userId: session.userId } },
    include: { task: { include: { campaign: true } }, submissions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  const pendingApplications = applications.filter((application) => application.status === "APPLIED").length;
  const approvedWithoutSubmission = applications.filter((application) => application.status === "APPROVED" && application.submissions.length === 0).length;
  const pendingReview = applications.filter((application) => application.submissions[0]?.status === "SUBMITTED").length;
  const needPublish = applications.filter((application) => application.submissions[0]?.status === "APPROVED").length;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者" title="我的任务" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="申请待审核" value={pendingApplications} />
        <MetricCard label="待制作内容" value={approvedWithoutSubmission} />
        <MetricCard label="内容待审核" value={pendingReview} />
        <MetricCard label="待发布" value={needPublish} />
      </div>
      <DataTable
        headers={["Campaign", "Task", "Stage", "Application", "Submission", "Next", "Reward", "Deadline", "Action"]}
        rows={applications.map((application) => {
          const latest = application.submissions[0];
          const stage = taskStage(application.status, latest);
          return [
            application.task.campaign.title,
            application.task.title,
            stage.label,
            <StatusBadge key="a">{application.status}</StatusBadge>,
            latest?.status ? <StatusBadge key="s">{latest.status}</StatusBadge> : "尚未提交",
            stage.next,
            money(application.task.rewardAmount),
            shortDate(application.task.deadline),
            <Link className="font-semibold text-stone-950" href={`/creator/my-tasks/${application.id}`} key={application.id}>打开</Link>,
          ];
        })}
      />
    </div>
  );
}
