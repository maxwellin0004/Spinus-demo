import { UserRole } from "@prisma/client";
import { addSocialAccountAction, updateCreatorProfileAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreatorOnboardingCard, CreatorOperatorCard } from "@/components/creator-ops";
import { Button, Card, DataTable, Field, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { shortDate } from "@/lib/format";

export default async function CreatorProfilePage() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: { socialAccounts: { orderBy: { createdAt: "desc" } }, wallet: true, responsibleAdmin: { include: { user: true } } },
  });
  if (!creator) return <PageHeader title="缺少创作者资料" />;
  const verifiedSocials = creator.socialAccounts.filter((account) => account.verificationStatus === "VERIFIED");
  const profileComplete = Boolean(creator.displayName && creator.country && creator.languages.length && creator.categories.length && creator.contentTypes.length && creator.bio);
  const onboarding = [
    { label: "基础资料", done: profileComplete, detail: profileComplete ? "资料完整。" : "请补齐语言、领域、内容形式和简介。" },
    { label: "至少一个社媒账号", done: creator.socialAccounts.length > 0, detail: creator.socialAccounts.length ? `已添加 ${creator.socialAccounts.length} 个。` : "添加后才能申请任务。" },
    { label: "社媒账号验证", done: verifiedSocials.length > 0, detail: verifiedSocials.length ? `${verifiedSocials.length} 个账号已验证。` : "新增账号默认待验证，Admin 审核后生效。" },
    { label: "平台审核状态", done: creator.reviewStatus === "APPROVED", detail: `当前状态：${creator.reviewStatus}` },
    { label: "可接任务等级", done: creator.level !== "NEW" || creator.reviewStatus === "APPROVED", detail: `当前等级：${creator.level}` },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者" title="资料与收款">
        <StatusBadge>{creator.reviewStatus}</StatusBadge>
        <StatusBadge>{creator.level}</StatusBadge>
      </PageHeader>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <CreatorOnboardingCard items={onboarding} level={creator.level} />
        <CreatorOperatorCard name={creator.responsibleAdmin?.displayName} email={creator.responsibleAdmin?.user.email} wechat={creator.responsibleAdmin?.wechat} />
      </section>
      <Card>
        <h2 className="mb-5 text-xl font-black">编辑基础资料</h2>
        <form action={updateCreatorProfileAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Display name" name="displayName" defaultValue={creator.displayName} required />
          <Field label="Country / region" name="country" defaultValue={creator.country} required />
          <Field label="Languages (comma-separated)" name="languages" defaultValue={creator.languages.join(", ")} />
          <Field label="Categories (comma-separated)" name="categories" defaultValue={creator.categories.join(", ")} />
          <Field label="Content types (comma-separated)" name="contentTypes" defaultValue={creator.contentTypes.join(", ")} />
          <Field label="Payout wallet / bank ref" name="payoutWalletAddress" defaultValue={creator.wallet?.payoutWalletAddress ?? ""} />
          <div className="md:col-span-2"><Textarea label="Bio" name="bio" defaultValue={creator.bio ?? ""} /></div>
          <div className="md:col-span-2"><Button>保存资料</Button></div>
        </form>
      </Card>
      <section>
        <h2 className="mb-3 text-xl font-semibold">社媒账号</h2>
        <DataTable
          headers={["Platform", "Account", "URL", "Followers", "Avg views", "Verification", "Note", "Updated"]}
          rows={creator.socialAccounts.map((account) => [
            account.platform,
            account.accountName,
            <a className="font-semibold text-stone-950" href={account.accountUrl} key={account.id}>{account.accountUrl}</a>,
            account.followers,
            account.avgViews,
            <StatusBadge key="v">{account.verificationStatus}</StatusBadge>,
            account.verificationNote ?? "-",
            shortDate(account.updatedAt),
          ])}
        />
      </section>
      <Card>
        <h2 className="text-xl font-semibold">添加社媒账号</h2>
        <p className="mt-2 text-sm text-stone-600">新增账号会进入“待验证”，Admin 会检查账号链接、粉丝数、平均播放和内容类型。</p>
        <form action={addSocialAccountAction} className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="Platform" name="platform" defaultValue="TikTok" required />
          <Field label="Account name" name="accountName" required />
          <Field label="Account URL" name="accountUrl" required />
          <Field label="Followers" name="followers" type="number" defaultValue={0} />
          <Field label="Average views" name="avgViews" type="number" defaultValue={0} />
          <Field label="Content type" name="contentType" defaultValue="短视频" />
          <Field label="Country" name="country" defaultValue={creator.country} />
          <Field label="Language" name="language" defaultValue="中文" />
          <div className="flex items-end"><Button>添加账号并提交验证</Button></div>
        </form>
      </Card>
    </div>
  );
}
