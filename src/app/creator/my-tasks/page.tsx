import Link from "next/link";
import { ApplicationStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { DataTable, MetricCard, PageHeader, StatusBadge, WorkflowHint } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type MyTaskStage = "applied" | "content" | "review" | "publish" | "done";

const stageLabels: Record<MyTaskStage, string> = {
  applied: "申请待审核",
  content: "待制作内容",
  review: "内容待审核",
  publish: "待发布/验收",
  done: "已完成",
};

function taskStage(status: ApplicationStatus, latest?: { status: SubmissionStatus } | null) {
  if (status === ApplicationStatus.APPLIED) return { label: "申请待审核", next: "等待审核", body: "通过后才能进入内容工作台。", tone: "warning" as const };
  if (status === ApplicationStatus.REJECTED) return { label: "申请已拒绝", next: "联系运营", body: "如有疑问，请联系你的平台运营。", tone: "danger" as const };
  if (status === ApplicationStatus.CANCELLED) return { label: "申请已取消", next: "无需操作", body: "该任务当前不能继续推进。", tone: "default" as const };
  if (!latest) return { label: "内容制作中", next: "制作内容", body: "进入 Content Studio 生成并提交内容。", tone: "warning" as const };
  if (latest.status === SubmissionStatus.SUBMITTED) return { label: "内容待审核", next: "等待审稿", body: "等待品牌或平台审核内容。", tone: "warning" as const };
  if (latest.status === SubmissionStatus.REVISION_REQUESTED) return { label: "需要修改", next: "修改重交", body: "查看审核意见后重新编辑提交。", tone: "danger" as const };
  if (latest.status === SubmissionStatus.APPROVED) return { label: "待发布", next: "发布内容", body: "复制文案并手动发布，然后提交链接。", tone: "warning" as const };
  if (latest.status === SubmissionStatus.PUBLISHED || latest.status === SubmissionStatus.PROOF_SUBMITTED) return { label: "发布链接待验收", next: "等待验收", body: "等待商家验收发布链接和数据。", tone: "warning" as const };
  if (latest.status === SubmissionStatus.VERIFIED) return { label: "已验收", next: "查看钱包", body: "收益会直接进入钱包。", tone: "success" as const };
  if (latest.status === SubmissionStatus.SETTLED) return { label: "已入账", next: "可提现", body: "收益已进入可提现余额。", tone: "success" as const };
  return { label: "已结束", next: "无需操作", body: "该任务当前无需操作。", tone: "default" as const };
}

function matchesStage(application: { status: ApplicationStatus; submissions: { status: SubmissionStatus }[] }, stage: MyTaskStage | null) {
  const latest = application.submissions[0];
  if (!stage) return true;
  if (stage === "applied") return application.status === ApplicationStatus.APPLIED;
  if (stage === "content") return application.status === ApplicationStatus.APPROVED && !latest;
  if (stage === "review") return latest?.status === SubmissionStatus.SUBMITTED || latest?.status === SubmissionStatus.REVISION_REQUESTED;
  if (stage === "publish") return latest?.status === SubmissionStatus.APPROVED || latest?.status === SubmissionStatus.PUBLISHED || latest?.status === SubmissionStatus.PROOF_SUBMITTED;
  if (stage === "done") return latest?.status === SubmissionStatus.VERIFIED || latest?.status === SubmissionStatus.SETTLED;
  return true;
}

export default async function CreatorMyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { stage } = await searchParams;
  const selectedStage = ["applied", "content", "review", "publish", "done"].includes(stage ?? "") ? (stage as MyTaskStage) : null;
  const applications = await prisma.taskApplication.findMany({
    where: { creator: { userId: session.userId } },
    include: { task: { include: { campaign: true } }, submissions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const visibleApplications = applications.filter((application) => matchesStage(application, selectedStage));
  const pendingApplications = applications.filter((application) => application.status === ApplicationStatus.APPLIED).length;
  const approvedWithoutSubmission = applications.filter((application) => application.status === ApplicationStatus.APPROVED && application.submissions.length === 0).length;
  const pendingReview = applications.filter((application) => {
    const latest = application.submissions[0];
    return latest?.status === SubmissionStatus.SUBMITTED || latest?.status === SubmissionStatus.REVISION_REQUESTED;
  }).length;
  const needPublish = applications.filter((application) => {
    const latest = application.submissions[0];
    return latest?.status === SubmissionStatus.APPROVED || latest?.status === SubmissionStatus.PUBLISHED || latest?.status === SubmissionStatus.PROOF_SUBMITTED;
  }).length;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者" title="我的任务" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard compact label="申请待审核" value={pendingApplications} href="/creator/my-tasks?stage=applied" />
        <MetricCard compact label="待制作内容" value={approvedWithoutSubmission} href="/creator/my-tasks?stage=content" />
        <MetricCard compact label="内容待审核" value={pendingReview} href="/creator/my-tasks?stage=review" />
        <MetricCard compact label="待发布/验收" value={needPublish} href="/creator/my-tasks?stage=publish" />
      </div>
      {selectedStage ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm font-semibold text-stone-600">
          当前筛选：<StatusBadge>{stageLabels[selectedStage]}</StatusBadge>
          <Link className="font-black text-stone-950" href="/creator/my-tasks">清空筛选</Link>
        </div>
      ) : null}
      <DataTable
        headers={["Campaign", "Task", "Stage", "Application", "Submission", "Next", "Reward", "Deadline", "Action"]}
        rows={visibleApplications.map((application) => {
          const latest = application.submissions[0];
          const stageInfo = taskStage(application.status, latest);
          return [
            application.task.campaign.title,
            application.task.title,
            stageInfo.label,
            <StatusBadge key="a">{application.status}</StatusBadge>,
            latest?.status ? <StatusBadge key="s">{latest.status}</StatusBadge> : "尚未提交",
            <WorkflowHint key={`next-${application.id}`} title={stageInfo.next} body={stageInfo.body} tone={stageInfo.tone} />,
            money(application.task.rewardAmount),
            shortDate(application.task.deadline),
            <Link className="font-semibold text-stone-950" href={`/creator/my-tasks/${application.id}`} key={application.id}>打开</Link>,
          ];
        })}
      />
    </div>
  );
}
