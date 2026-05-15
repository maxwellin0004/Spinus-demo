import Link from "next/link";
import { ApplicationStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CreatorDashboard() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: {
      wallet: true,
      socialAccounts: true,
      responsibleAdmin: { include: { user: true } },
      applications: {
        include: {
          submissions: {
            include: { proofs: true },
            orderBy: { createdAt: "desc" },
          },
          task: { include: { campaign: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!creator) {
    return <PageHeader title="缺少创作者资料" />;
  }

  const applications = creator.applications;
  const submissions = applications.flatMap((application) => application.submissions);
  const verifiedSocials = creator.socialAccounts.filter((account) => account.verificationStatus === "VERIFIED");
  const profileComplete = Boolean(creator.displayName && creator.country && creator.languages.length && creator.categories.length && creator.contentTypes.length && creator.bio);
  const available = Number(creator.wallet?.availableBalance ?? 0);
  const activeTasks = await prisma.campaignTask.count({
    where: {
      status: "ACTIVE",
      campaign: { status: "ACTIVE", isDemo: false },
    },
  });
  const referralCount = await prisma.creatorReferralAttribution.count({
    where: { creatorProfileId: creator.id },
  });
  const operatorName = creator.responsibleAdmin?.displayName || "待分配";
  const operatorContact = creator.responsibleAdmin?.wechat || creator.responsibleAdmin?.user.email || "待补充";

  const readiness = [
    { label: "基础资料", done: profileComplete, detail: profileComplete ? "资料已完整" : "继续完善语言、领域、内容形式和简介" },
    { label: "社媒账号", done: creator.socialAccounts.length > 0, detail: creator.socialAccounts.length ? `已添加 ${creator.socialAccounts.length} 个账号` : "至少添加 1 个社媒账号" },
    { label: "账号验证", done: verifiedSocials.length > 0, detail: verifiedSocials.length ? `${verifiedSocials.length} 个账号已验证` : "等待平台完成账号审核" },
    { label: "平台审核", done: creator.reviewStatus === "APPROVED", detail: `当前状态：${creator.reviewStatus}` },
    { label: "收款信息", done: Boolean(creator.wallet?.payoutWalletAddress), detail: creator.wallet?.payoutWalletAddress ? "已填写提现信息" : "建议补全钱包提现信息" },
  ];
  const readinessDone = readiness.filter((item) => item.done).length;
  const readinessPercent = Math.round((readinessDone / readiness.length) * 100);

  const cards = [
    { label: "可申请任务", value: activeTasks, href: "/creator/marketplace", sub: "当前可浏览的真实任务" },
    { label: "我的申请", value: applications.length, href: "/creator/my-tasks", sub: "历史申请总数" },
    {
      label: "待制作内容",
      value: applications.filter((application) => application.status === ApplicationStatus.APPROVED && application.submissions.length === 0).length,
      href: "/creator/my-tasks?stage=content",
      sub: "已通过但尚未提交",
    },
    {
      label: "待审核内容",
      value: submissions.filter((submission) => submission.status === SubmissionStatus.SUBMITTED).length,
      href: "/creator/my-tasks?stage=review",
      sub: "等待平台审核",
    },
    {
      label: "可提现余额",
      value: money(available),
      href: "/creator/wallet",
      sub: `累计收入 ${money(creator.wallet?.cumulativeIncome ?? creator.cumulativeIncome)}`,
    },
    { label: "分享注册", value: referralCount, href: "/creator/share", sub: "通过你的海报完成注册" },
    { label: "创作者等级", value: creator.level, href: "/creator/profile", sub: `完成率 ${Number(creator.completionRate).toFixed(1)}%` },
    { label: "当前会员", value: creatorMembershipLabel(creator.membershipTier), href: "/creator/membership", sub: creator.membershipEndsAt ? `到期 ${creator.membershipEndsAt.toLocaleDateString("zh-CN")}` : "可在后台开通成长 / Pro" },
  ];

  return (
    <div className="grid gap-8">
      <PageHeader eyebrow="Creator" title={`${creator.displayName} 的创作者工作台`}>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-black text-stone-950 shadow-sm" href="/creator/marketplace">
            浏览任务
          </Link>
          <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" href="/creator/share">
            分享海报
          </Link>
          <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" href="/creator/membership">
            会员方案
          </Link>
        </div>
      </PageHeader>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[var(--line)] bg-white/84 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">今日状态</p>
              <h2 className="mt-2 text-2xl font-black text-stone-950">接单准备度 {readinessPercent}%</h2>
              <p className="mt-2 text-sm text-stone-600">已完成 {readinessDone} / {readiness.length} 项基础准备。</p>
            </div>
            <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" href="/creator/profile">
              完善资料
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {readiness.map((item) => (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4" key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-stone-950">{item.label}</p>
                  <StatusBadge tone={item.done ? "success" : "warning"}>{item.done ? "已完成" : "待处理"}</StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white/84 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">会员与分享</p>
          <h2 className="mt-2 text-2xl font-black text-stone-950">新增两个增长入口</h2>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-[linear-gradient(135deg,#0f2f8f,#2563eb)] p-4 text-white">
              <p className="text-sm font-black">专属分享海报</p>
              <p className="mt-2 text-sm leading-6 text-white/80">二维码直达创作者注册页，支持个人分享归因。</p>
            </div>
            <div className="rounded-2xl bg-[linear-gradient(135deg,#4c1d95,#9333ea)] p-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">当前会员状态</p>
                <StatusBadge tone={creatorMembershipTone(creator.membershipTier)}>{creatorMembershipLabel(creator.membershipTier)}</StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/80">
                {creator.membershipEndsAt ? `会员有效期到 ${creator.membershipEndsAt.toLocaleDateString("zh-CN")}` : "目前还未开通会员，可联系运营开通成长会员或 Pro 高阶会员。"}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-black text-stone-950">对接运营</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{operatorName} / {operatorContact}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard href={card.href} key={card.label} label={card.label} sub={card.sub} value={card.value} />
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-xl font-black text-stone-950">最近任务</h2>
        <DataTable
          headers={["Campaign", "Task", "申请状态", "最近提交", "操作"]}
          rows={applications.map((application) => [
            application.task.campaign.title,
            application.task.title,
            <StatusBadge key={`${application.id}-application`}>{application.status}</StatusBadge>,
            application.submissions[0]?.status ? <StatusBadge key={`${application.id}-submission`}>{application.submissions[0].status}</StatusBadge> : "未提交",
            <Link className="font-semibold text-stone-950" href={`/creator/my-tasks/${application.id}`} key={application.id}>
              打开
            </Link>,
          ])}
        />
      </section>
    </div>
  );
}
