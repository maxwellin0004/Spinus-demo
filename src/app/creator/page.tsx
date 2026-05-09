import Link from "next/link";
import { ApplicationStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { DataTable, LinkButton, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CreatorDashboard() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: {
      wallet: { include: { transactions: true } },
      socialAccounts: true,
      responsibleAdmin: { include: { user: true } },
      applications: { include: { submissions: { include: { proofs: true } }, task: { include: { campaign: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!creator) return <PageHeader title="缺少创作者资料" />;

  const applications = creator.applications;
  const submissions = applications.flatMap((app) => app.submissions);
  const activeTasks = await prisma.campaignTask.count({ where: { status: "ACTIVE", campaign: { status: "ACTIVE", isDemo: false } } });
  const verifiedSocials = creator.socialAccounts.filter((account) => account.verificationStatus === "VERIFIED");
  const profileComplete = Boolean(creator.displayName && creator.country && creator.languages.length && creator.categories.length && creator.contentTypes.length && creator.bio);
  const walletReady = Boolean(creator.wallet?.payoutWalletAddress);
  const available = Number(creator.wallet?.availableBalance ?? 0);

  const onboarding = [
    { label: "基础资料", done: profileComplete, detail: profileComplete ? "已填写昵称、国家、语言、领域和简介。" : "请补齐语言、领域、内容形式和个人简介。", href: "/creator/profile" },
    { label: "社媒账号", done: creator.socialAccounts.length > 0, detail: creator.socialAccounts.length ? `已添加 ${creator.socialAccounts.length} 个账号。` : "至少添加一个社媒账号后才能申请任务。", href: "/creator/profile" },
    { label: "账号验证", done: verifiedSocials.length > 0, detail: verifiedSocials.length ? `${verifiedSocials.length} 个账号已验证。` : "等待 Admin 审核社媒账号真实性。", href: "/creator/profile" },
    { label: "创作者审核", done: creator.reviewStatus === "APPROVED", detail: `当前状态：${creator.reviewStatus}`, href: "/creator/profile" },
    { label: "收款信息", done: walletReady, detail: walletReady ? "已填写收款钱包/银行信息。" : "填写后才方便提现。", href: "/creator/profile" },
  ];
  const onboardingCompleted = onboarding.filter((item) => item.done).length;
  const onboardingPercent = Math.round((onboardingCompleted / onboarding.length) * 100);
  const operatorName = creator.responsibleAdmin?.displayName ?? "暂未分配";
  const operatorContact = creator.responsibleAdmin?.user.email || creator.responsibleAdmin?.wechat || "暂未填写";

  const cards = [
    { label: "可申请任务", value: activeTasks, href: "/creator/marketplace" },
    { label: "已申请任务", value: applications.length, href: "/creator/my-tasks" },
    { label: "待制作内容", value: applications.filter((app) => app.status === ApplicationStatus.APPROVED && app.submissions.length === 0).length, href: "/creator/my-tasks?stage=content" },
    { label: "内容审核中", value: submissions.filter((submission) => submission.status === SubmissionStatus.SUBMITTED).length, href: "/creator/my-tasks?stage=review" },
    { label: "待发布", value: submissions.filter((submission) => submission.status === SubmissionStatus.APPROVED).length, href: "/creator/my-tasks?stage=publish" },
    { label: "待提交链接", value: submissions.filter((submission) => submission.status === SubmissionStatus.PUBLISHED || submission.status === SubmissionStatus.APPROVED).length, href: "/creator/my-tasks?stage=publish" },
    { label: "可提现余额", value: money(available), href: "/creator/wallet" },
    { label: "累计收入", value: money(creator.wallet?.cumulativeIncome ?? creator.cumulativeIncome), href: "/creator/wallet" },
    { label: "完成任务", value: creator.completedTasks, href: "/creator/my-tasks?stage=done" },
    { label: "等级", value: creator.level, href: "/creator/profile" },
    { label: "履约率", value: `${Number(creator.completionRate).toFixed(1)}%`, href: "/creator/profile" },
  ];

  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="创作者" title={`${creator.displayName} 仪表盘`}>
        <LinkButton href="/creator/marketplace" variant="secondary">浏览任务</LinkButton>
      </PageHeader>

      <section>
        <details className="group rounded-2xl border border-[var(--line)] bg-white/82 p-4 shadow-sm backdrop-blur-sm">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-stone-950">今日接单准备</h2>
              <p className="mt-1 text-sm text-stone-500">
                完成度 {onboardingPercent}% · {onboardingCompleted}/{onboarding.length} 项已完成 · 运营联系人：{operatorName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onboardingCompleted < onboarding.length ? (
                <Link className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-black text-stone-950 shadow-sm" href="/creator/profile">
                  完善资料
                </Link>
              ) : null}
              <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-700 shadow-sm group-open:hidden">展开</span>
              <span className="hidden rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-700 shadow-sm group-open:inline-flex">隐藏</span>
            </div>
          </summary>
          <div className="mt-4">
            <DataTable
              headers={["项目", "状态", "当前记录", "下一步", "操作"]}
              rows={[
                ...onboarding.map((item) => [
                  item.label,
                  <StatusBadge key={`${item.label}-status`} tone={item.done ? "success" : "warning"}>{item.done ? "已完成" : "待处理"}</StatusBadge>,
                  item.detail,
                  item.done ? "保持资料可核对" : "补齐后再申请任务",
                  <Link className="font-black text-stone-950" href={item.href ?? "/creator/profile"} key={`${item.label}-action`}>查看</Link>,
                ]),
                [
                  "运营联系人",
                  <StatusBadge key="operator-status" tone={creator.responsibleAdmin ? "success" : "neutral"}>{operatorName}</StatusBadge>,
                  operatorContact,
                  creator.responsibleAdmin ? "需要协助时联系运营" : "等待平台分配运营联系人",
                  <span className="text-stone-400" key="operator-action">-</span>,
                ],
              ]}
            />
          </div>
        </details>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => <MetricCard key={card.label} label={card.label} value={card.value} href={card.href} />)}
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">最近任务</h2>
        <DataTable
          headers={["Campaign", "Task", "Application", "Latest submission", "Action"]}
          rows={applications.map((application) => [
            application.task.campaign.title,
            application.task.title,
            <StatusBadge key="a">{application.status}</StatusBadge>,
            application.submissions[0]?.status ? <StatusBadge key="s">{application.submissions[0].status}</StatusBadge> : "未提交",
            <Link className="font-semibold text-stone-950" href={`/creator/my-tasks/${application.id}`} key={application.id}>打开</Link>,
          ])}
        />
      </section>
    </div>
  );
}
