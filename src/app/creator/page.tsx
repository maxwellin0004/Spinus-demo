import Link from "next/link";
import { UserRole, WalletTxStatus, WalletTxType } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreatorOnboardingCard, CreatorOperatorCard } from "@/components/creator-ops";
import { DataTable, LinkButton, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { money } from "@/lib/format";

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
  const onboarding = [
    { label: "基础资料", done: profileComplete, detail: profileComplete ? "已填写昵称、国家、语言、领域和简介。" : "请补齐语言、领域、内容形式和个人简介。", href: "/creator/profile" },
    { label: "社媒账号", done: creator.socialAccounts.length > 0, detail: creator.socialAccounts.length ? `已添加 ${creator.socialAccounts.length} 个账号。` : "至少添加一个社媒账号后才能申请任务。", href: "/creator/profile" },
    { label: "账号验证", done: verifiedSocials.length > 0, detail: verifiedSocials.length ? `${verifiedSocials.length} 个账号已验证。` : "等待 Admin 审核社媒账号真实性。", href: "/creator/profile" },
    { label: "创作者审核", done: creator.reviewStatus === "APPROVED", detail: `当前状态：${creator.reviewStatus}` },
    { label: "收款信息", done: walletReady, detail: walletReady ? "已填写收款钱包/银行信息。" : "填写后才方便提现。", href: "/creator/profile" },
  ];
  const pendingSettlement = creator.wallet?.transactions
    .filter((tx) => tx.type === WalletTxType.EARNING && tx.status === WalletTxStatus.PENDING)
    .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0;
  const available = Number(creator.wallet?.availableBalance ?? 0);
  const cards = [
    ["Open tasks", activeTasks],
    ["Applied tasks", applications.length],
    ["Need content", applications.filter((app) => app.status === "APPROVED" && app.submissions.length === 0).length],
    ["Under review", submissions.filter((submission) => submission.status === "SUBMITTED").length],
    ["Need publish", submissions.filter((submission) => submission.status === "APPROVED").length],
    ["Need proof", submissions.filter((submission) => submission.status === "PUBLISHED" || submission.status === "APPROVED").length],
    ["Pending settlement", money(pendingSettlement)],
    ["Available balance", money(available)],
    ["Cumulative income", money(creator.wallet?.cumulativeIncome ?? creator.cumulativeIncome)],
    ["Completed tasks", creator.completedTasks],
    ["Level", creator.level],
    ["Completion rate", `${Number(creator.completionRate).toFixed(1)}%`],
  ];
  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="创作者" title={`${creator.displayName} 仪表盘`}>
        <LinkButton href="/creator/marketplace" variant="secondary">浏览任务</LinkButton>
      </PageHeader>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <CreatorOnboardingCard items={onboarding} level={creator.level} />
        <CreatorOperatorCard name={creator.responsibleAdmin?.displayName} email={creator.responsibleAdmin?.user.email} wechat={creator.responsibleAdmin?.wechat} />
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => <MetricCard key={label} label={String(label)} value={value} />)}
      </div>
      <section>
        <h2 className="mb-3 text-xl font-semibold">最近任务</h2>
        <DataTable
          headers={["Campaign", "Task", "Application", "Latest submission", "Action"]}
          rows={applications.map((application) => [
            application.task.campaign.title,
            application.task.title,
            <StatusBadge key="a">{application.status}</StatusBadge>,
            application.submissions[0]?.status ? <StatusBadge key="s">{application.submissions[0].status}</StatusBadge> : "Not submitted",
            <Link className="font-semibold text-stone-950" href={`/creator/my-tasks/${application.id}`} key={application.id}>打开</Link>,
          ])}
        />
      </section>
    </div>
  );
}
