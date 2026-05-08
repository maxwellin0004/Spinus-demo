import { UserRole } from "@prisma/client";
import { addSocialAccountAction, updateCreatorProfileAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreatorOnboardingCard, CreatorOperatorCard } from "@/components/creator-ops";
import { Button, Card, DataTable, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { V1_CATEGORIES, V1_CONTENT_TYPES, V1_COUNTRIES, V1_LANGUAGES, V1_PLATFORMS } from "@/lib/v1Options";

export default async function CreatorProfilePage() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: { socialAccounts: { orderBy: { createdAt: "desc" } }, wallet: true, responsibleAdmin: { include: { user: true } } },
  });

  if (!creator) return <PageHeader title="缺少 KOL 资料" />;

  const verifiedSocials = creator.socialAccounts.filter((account) => account.verificationStatus === "VERIFIED");
  const profileComplete = Boolean(creator.displayName && creator.country && creator.languages.length && creator.categories.length && creator.contentTypes.length && creator.bio);
  const onboarding = [
    { label: "基础资料", done: profileComplete, detail: profileComplete ? "资料完整。" : "请补齐语言、领域、内容形式和简介。" },
    { label: "至少一个社媒账号", done: creator.socialAccounts.length > 0, detail: creator.socialAccounts.length ? `已添加 ${creator.socialAccounts.length} 个账号。` : "添加后才能申请任务。" },
    { label: "社媒账号验证", done: verifiedSocials.length > 0, detail: verifiedSocials.length ? `${verifiedSocials.length} 个账号已验证。` : "新增账号默认待验证，Admin 审核后生效。" },
    { label: "平台审核状态", done: creator.reviewStatus === "APPROVED", detail: `当前状态：${creator.reviewStatus}` },
    { label: "可接任务等级", done: creator.level !== "NEW" || creator.reviewStatus === "APPROVED", detail: `当前等级：${creator.level}` },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="KOL 中心" title="资料与社媒账号">
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
          <Field label="展示名称" name="displayName" defaultValue={creator.displayName} required />
          <Select label="国家/地区" name="country" defaultValue={creator.country || V1_COUNTRIES[0]}>
            {V1_COUNTRIES.map((country) => <option key={country}>{country}</option>)}
          </Select>
          <Field label="语言，多个用逗号分隔" name="languages" defaultValue={creator.languages.join(", ")} />
          <Field label="内容领域，多个用逗号分隔" name="categories" defaultValue={creator.categories.join(", ")} />
          <Field label="内容形式，多个用逗号分隔" name="contentTypes" defaultValue={creator.contentTypes.join(", ")} />
          <Field label="收款账号/银行卡备注" name="payoutWalletAddress" defaultValue={creator.wallet?.payoutWalletAddress ?? ""} />
          <div className="md:col-span-2">
            <Textarea label="个人简介" name="bio" defaultValue={creator.bio ?? ""} />
          </div>
          <div className="md:col-span-2">
            <Button>保存资料</Button>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-semibold">社媒账号</h2>
        <DataTable
          headers={["平台", "账号", "链接", "粉丝数", "均播/均读", "验证状态", "审核备注", "更新时间"]}
          rows={creator.socialAccounts.map((account) => [
            account.platform,
            account.accountName,
            <a className="font-semibold text-stone-950" href={account.accountUrl} key={account.id}>{account.accountUrl}</a>,
            account.followers || account.submittedFollowers || 0,
            account.avgViews || account.submittedAvgViews || 0,
            <StatusBadge key="v">{account.verificationStatus}</StatusBadge>,
            account.verificationNote ?? "-",
            shortDate(account.updatedAt),
          ])}
        />
      </section>

      <Card>
        <h2 className="text-xl font-semibold">添加社媒账号</h2>
        <p className="mt-2 text-sm text-stone-600">新增账号会进入待验证队列。第一版审核重点是账号链接真实性、平台匹配、粉丝数与基础内容一致性。</p>
        <form action={addSocialAccountAction} className="mt-5 grid gap-4 md:grid-cols-3">
          <Select label="平台" name="platform" defaultValue={V1_PLATFORMS[0]}>
            {V1_PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
          </Select>
          <Field label="账号名称" name="accountName" required />
          <Field label="账号主页链接" name="accountUrl" required />
          <Field label="粉丝数" name="followers" type="number" defaultValue={0} />
          <Field label="平均播放/阅读" name="avgViews" type="number" defaultValue={0} />
          <Select label="主要内容形式" name="contentType" defaultValue={V1_CONTENT_TYPES[0]}>
            {V1_CONTENT_TYPES.map((type) => <option key={type}>{type}</option>)}
          </Select>
          <Select label="国家/地区" name="country" defaultValue={creator.country || V1_COUNTRIES[0]}>
            {V1_COUNTRIES.map((country) => <option key={country}>{country}</option>)}
          </Select>
          <Select label="语言" name="language" defaultValue={creator.languages[0] || V1_LANGUAGES[0]}>
            {V1_LANGUAGES.map((language) => <option key={language}>{language}</option>)}
          </Select>
          <div className="flex items-end">
            <Button>提交账号审核</Button>
          </div>
        </form>
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          默认只有已验证账号可以申请任务；商家后续可以在任务里放开此限制。
        </div>
      </Card>
    </div>
  );
}
