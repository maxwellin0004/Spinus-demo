import Link from "next/link";
import { UserRole } from "@prisma/client";
import { addSocialAccountAction, deleteSocialAccountAction, updateCreatorProfileAction, updateSocialAccountAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, DataTable, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";
import { shortDate } from "@/lib/format";
import { V1_CATEGORIES, V1_CONTENT_TYPES, V1_COUNTRIES, V1_LANGUAGES, V1_PLATFORMS } from "@/lib/v1Options";

const profileTabs = [
  { value: "basic", label: "基础资料" },
  { value: "social", label: "社媒账号" },
  { value: "payout", label: "收款信息" },
  { value: "review", label: "审核状态" },
  { value: "preferences", label: "偏好设置" },
] as const;

type ProfileTab = (typeof profileTabs)[number]["value"];

function isProfileTab(value?: string): value is ProfileTab {
  return profileTabs.some((tab) => tab.value === value);
}

function ProfileTabLink({ tab, activeTab }: { tab: (typeof profileTabs)[number]; activeTab: ProfileTab }) {
  const active = tab.value === activeTab;
  return (
    <Link
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-stone-950 bg-stone-950 text-white shadow-sm"
          : "border-stone-200 bg-white/80 text-stone-700 hover:border-amber-300 hover:bg-amber-50"
      }`}
      href={`/creator/profile?tab=${tab.value}`}
    >
      {tab.label}
    </Link>
  );
}

function HiddenProfileFields({
  creator,
}: {
  creator: {
    displayName: string;
    country: string;
    languages: string[];
    categories: string[];
    contentTypes: string[];
    bio: string | null;
  };
}) {
  return (
    <>
      <input name="displayName" type="hidden" value={creator.displayName} />
      <input name="country" type="hidden" value={creator.country || V1_COUNTRIES[0]} />
      <input name="languages" type="hidden" value={creator.languages.join(", ")} />
      <input name="categories" type="hidden" value={creator.categories.join(", ")} />
      <input name="contentTypes" type="hidden" value={creator.contentTypes.join(", ")} />
      <input name="bio" type="hidden" value={creator.bio ?? ""} />
    </>
  );
}

export default async function CreatorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; edit?: string; editAccount?: string; error?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { tab, edit, editAccount, error } = await searchParams;
  const activeTab: ProfileTab = isProfileTab(tab) ? tab : "basic";
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: {
      socialAccounts: {
        orderBy: { createdAt: "desc" },
        include: { selectedApplications: { select: { id: true, status: true } } },
      },
      wallet: true,
      responsibleAdmin: { include: { user: true } },
    },
  });

  if (!creator) return <PageHeader title="缺少 KOL 资料" />;

  const verifiedSocials = creator.socialAccounts.filter((account) => account.verificationStatus === "VERIFIED");
  const pendingSocials = creator.socialAccounts.filter((account) => account.verificationStatus === "PENDING");
  const profileComplete = Boolean(creator.displayName && creator.country && creator.languages.length && creator.categories.length && creator.contentTypes.length && creator.bio);
  const payoutWalletAddress = creator.wallet?.payoutWalletAddress ?? "";
  const payoutEditing = activeTab === "payout" && (edit === "1" || !payoutWalletAddress);
  const editingSocialAccount = activeTab === "social" ? creator.socialAccounts.find((account) => account.id === editAccount) : null;
  const canApplyTasks = profileComplete && verifiedSocials.length > 0 && creator.reviewStatus === "APPROVED";
  const onboarding = [
    { label: "基础资料", done: profileComplete, detail: profileComplete ? "资料完整。" : "请补齐语言、领域、内容形式和简介。" },
    { label: "至少一个社媒账号", done: creator.socialAccounts.length > 0, detail: creator.socialAccounts.length ? `已添加 ${creator.socialAccounts.length} 个账号。` : "添加后才能申请任务。" },
    { label: "社媒账号验证", done: verifiedSocials.length > 0, detail: verifiedSocials.length ? `${verifiedSocials.length} 个账号已验证。` : "新增账号默认待验证，Admin 审核后生效。" },
    { label: "平台审核状态", done: creator.reviewStatus === "APPROVED", detail: `当前状态：${creator.reviewStatus}` },
    { label: "可接任务等级", done: creator.level !== "NEW" || creator.reviewStatus === "APPROVED", detail: `当前等级：${creator.level}` },
  ];
  const onboardingCompleted = onboarding.filter((item) => item.done).length;
  const onboardingPercent = Math.round((onboardingCompleted / onboarding.length) * 100);
  const operatorName = creator.responsibleAdmin?.displayName ?? "暂未分配";
  const operatorContact = creator.responsibleAdmin?.user.email || creator.responsibleAdmin?.wechat || "暂未填写";

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="KOL 中心" title="资料与社媒账号">
        <StatusBadge>{creator.reviewStatus}</StatusBadge>
        <StatusBadge>{creator.level}</StatusBadge>
      </PageHeader>

      <section>
        <details className="group rounded-2xl border border-[var(--line)] bg-white/82 p-4 shadow-sm backdrop-blur-sm">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-stone-950">资料进度</h2>
              <p className="mt-1 text-sm text-stone-500">完成度 {onboardingPercent}% · {onboardingCompleted}/{onboarding.length} 项已完成 · {canApplyTasks ? "可接任务" : "当前受限"}</p>
            </div>
            <div className="flex items-center gap-2">
              {onboardingCompleted < onboarding.length ? (
                <Link className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-black text-stone-950 shadow-sm" href="/creator/profile?tab=basic">
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
            [
              "基础资料",
              <StatusBadge key="basic-status" tone={profileComplete ? "success" : "warning"}>{profileComplete ? "已完成" : "待补充"}</StatusBadge>,
              profileComplete ? "语言、领域、内容形式和简介已填写" : "基础资料仍不完整",
              profileComplete ? "等待平台审核或继续维护资料" : "补齐语言、领域、内容形式和简介",
              <Link className="font-black text-stone-950" href="/creator/profile?tab=basic" key="basic-action">查看</Link>,
            ],
            [
              "社媒账号",
              <StatusBadge key="social-status" tone={creator.socialAccounts.length > 0 ? "success" : "warning"}>{creator.socialAccounts.length > 0 ? "已添加" : "待添加"}</StatusBadge>,
              `${creator.socialAccounts.length} 个账号 · ${verifiedSocials.length} 已验证 · ${pendingSocials.length} 待验证`,
              creator.socialAccounts.length > 0 ? "保持账号资料可核对" : "添加至少一个社媒账号",
              <Link className="font-black text-stone-950" href="/creator/profile?tab=social" key="social-action">管理</Link>,
            ],
            [
              "平台审核",
              <StatusBadge key="review-status" tone={creator.reviewStatus === "APPROVED" ? "success" : creator.reviewStatus === "REJECTED" ? "danger" : "warning"}>{creator.reviewStatus}</StatusBadge>,
              `当前等级：${creator.level}`,
              creator.reviewStatus === "APPROVED" ? "可以继续申请符合条件的任务" : "等待 Admin 审核资料和账号",
              <Link className="font-black text-stone-950" href="/creator/profile?tab=review" key="review-action">查看</Link>,
            ],
            [
              "可接任务",
              <StatusBadge key="task-status" tone={canApplyTasks ? "success" : "neutral"}>{canApplyTasks ? "可以" : "受限"}</StatusBadge>,
              canApplyTasks ? "当前满足接单条件" : "需完成资料、账号验证和平台审核",
              canApplyTasks ? "进入任务大厅选择任务" : "按上方缺口补齐资料",
              <Link className="font-black text-stone-950" href="/creator/marketplace" key="task-action">任务大厅</Link>,
            ],
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

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white/78 p-2 shadow-sm">
        {profileTabs.map((item) => (
          <ProfileTabLink activeTab={activeTab} key={item.value} tab={item} />
        ))}
      </nav>

      {activeTab === "basic" ? (
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
            <input name="payoutWalletAddress" type="hidden" value={payoutWalletAddress} />
            <div className="md:col-span-2">
              <Textarea label="个人简介" name="bio" defaultValue={creator.bio ?? ""} />
            </div>
            <div className="md:col-span-2">
              <SubmitButton pendingLabel="正在保存...">保存资料</SubmitButton>
            </div>
          </form>
        </Card>
      ) : null}

      {activeTab === "social" ? (
        <div className="grid gap-6">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}
          <section>
            <h2 className="mb-3 text-xl font-semibold">社媒账号</h2>
            <DataTable
              headers={["平台", "账号", "链接", "粉丝数", "均播/均读", "验证状态", "审核备注", "更新时间", "操作"]}
              rows={creator.socialAccounts.map((account) => {
                const boundApplications = account.selectedApplications.filter((application) => application.status === "APPLIED" || application.status === "APPROVED");
                const canDelete = boundApplications.length === 0;
                return [
                  account.platform,
                  account.accountName,
                  <a className="font-semibold text-stone-950" href={account.accountUrl} key={account.id}>{account.accountUrl}</a>,
                  account.followers || account.submittedFollowers || 0,
                  account.avgViews || account.submittedAvgViews || 0,
                  <StatusBadge key="v">{account.verificationStatus}</StatusBadge>,
                  account.verificationNote ?? "-",
                  shortDate(account.updatedAt),
                  <div className="flex flex-wrap items-center gap-2" key={`${account.id}-actions`}>
                    <Link className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-black text-stone-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50" href={`/creator/profile?tab=social&editAccount=${account.id}`}>
                      修改
                    </Link>
                    {canDelete ? (
                      <form action={deleteSocialAccountAction.bind(null, account.id)}>
                        <SubmitButton className="rounded-full px-3 py-1.5 text-xs" pendingLabel="删除中..." variant="danger">
                          删除
                        </SubmitButton>
                      </form>
                    ) : (
                      <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 text-xs font-black text-stone-500" title="该账号已绑定进行中的任务申请，不能删除">
                        已绑定任务
                      </span>
                    )}
                  </div>,
                ];
              })}
            />
          </section>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{editingSocialAccount ? "修改社媒账号" : "添加社媒账号"}</h2>
                <p className="mt-2 text-sm text-stone-600">
                  {editingSocialAccount ? "修改后账号会重新进入待验证队列，验证通过前不能作为已验证账号使用。" : "新增账号会进入待验证队列。第一版审核重点是账号链接真实性、平台匹配、粉丝数与基础内容一致性。"}
                </p>
                {editingSocialAccount ? (
                  <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                    修改账号名称、链接或基础数据后，当前已验证状态会失效，需要 Admin 重新审核。
                  </p>
                ) : null}
              </div>
              {editingSocialAccount ? (
                <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-700 shadow-sm" href="/creator/profile?tab=social">
                  取消修改
                </Link>
              ) : null}
            </div>
            <form action={editingSocialAccount ? updateSocialAccountAction.bind(null, editingSocialAccount.id) : addSocialAccountAction} className="mt-5 grid gap-4 md:grid-cols-3">
              <Select label="平台" name="platform" defaultValue={editingSocialAccount?.platform ?? V1_PLATFORMS[0]}>
                {V1_PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
              </Select>
              <Field label="账号名称" name="accountName" defaultValue={editingSocialAccount?.accountName ?? ""} required />
              <Field label="账号主页链接" name="accountUrl" defaultValue={editingSocialAccount?.accountUrl ?? ""} required />
              <Field label="粉丝数" name="followers" type="number" defaultValue={editingSocialAccount?.followers ?? 0} />
              <Field label="平均播放/阅读" name="avgViews" type="number" defaultValue={editingSocialAccount?.avgViews ?? 0} />
              <Select label="主要内容形式" name="contentType" defaultValue={editingSocialAccount?.contentType ?? V1_CONTENT_TYPES[0]}>
                {V1_CONTENT_TYPES.map((type) => <option key={type}>{type}</option>)}
              </Select>
              <Select label="国家/地区" name="country" defaultValue={editingSocialAccount?.country || creator.country || V1_COUNTRIES[0]}>
                {V1_COUNTRIES.map((country) => <option key={country}>{country}</option>)}
              </Select>
              <Select label="语言" name="language" defaultValue={editingSocialAccount?.language || creator.languages[0] || V1_LANGUAGES[0]}>
                {V1_LANGUAGES.map((language) => <option key={language}>{language}</option>)}
              </Select>
              <div className="flex items-end">
                <SubmitButton pendingLabel="正在提交...">{editingSocialAccount ? "重新提交审核" : "提交账号审核"}</SubmitButton>
              </div>
            </form>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              默认只有已验证账号可以申请任务；商家后续可以在任务里放开此限制。
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "payout" ? (
        <Card>
          <h2 className="mb-5 text-xl font-black">收款信息</h2>
          <p className="mb-5 text-sm text-stone-600">这里用于提现人工处理。请填写稳定、可核对的收款账号或银行卡备注。</p>
          {payoutEditing ? (
            <form action={updateCreatorProfileAction} className="grid gap-4 md:grid-cols-2">
              <HiddenProfileFields creator={creator} />
              <input name="returnTo" type="hidden" value="/creator/profile?tab=payout" />
              <div className="md:col-span-2">
                <Field label="收款账号/银行卡备注" name="payoutWalletAddress" defaultValue={payoutWalletAddress} />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <SubmitButton pendingLabel="正在保存...">保存收款信息</SubmitButton>
                {payoutWalletAddress ? (
                  <Link className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700 shadow-sm" href="/creator/profile?tab=payout">
                    取消
                  </Link>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-stone-200 bg-stone-100/80 p-4">
                <p className="text-sm font-black text-stone-500">收款账号/银行卡备注</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-base font-semibold text-stone-700">{payoutWalletAddress}</p>
              </div>
              <div>
                <Link className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-900 shadow-sm transition hover:border-amber-300 hover:bg-amber-50" href="/creator/profile?tab=payout&edit=1">
                  修改
                </Link>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {activeTab === "review" ? (
        <Card>
          <h2 className="mb-5 text-xl font-black">审核状态</h2>
          <div className="grid gap-4 text-sm text-stone-700 md:grid-cols-2">
            <p>资料审核：<StatusBadge>{creator.reviewStatus}</StatusBadge></p>
            <p>当前等级：<StatusBadge>{creator.level}</StatusBadge></p>
            <p>资料完整度：{profileComplete ? "已完成" : "待补充"}</p>
            <p>可接任务：{canApplyTasks ? "可以申请任务" : "需先完成资料、审核或账号验证"}</p>
            <p>已验证社媒账号：{verifiedSocials.length}</p>
            <p>待验证社媒账号：{pendingSocials.length}</p>
          </div>
        </Card>
      ) : null}

      {activeTab === "preferences" ? (
        <Card>
          <h2 className="mb-5 text-xl font-black">偏好设置</h2>
          <div className="grid gap-4 text-sm text-stone-700 md:grid-cols-2">
            <p>可接平台：{creator.socialAccounts.map((account) => account.platform).join(", ") || "待添加社媒账号"}</p>
            <p>内容类型：{creator.contentTypes.join(", ") || V1_CONTENT_TYPES.join(", ")}</p>
            <p>内容领域：{creator.categories.join(", ") || V1_CATEGORIES.slice(0, 6).join(", ")}</p>
            <p>语言：{creator.languages.join(", ") || V1_LANGUAGES.join(", ")}</p>
          </div>
          <p className="mt-4 text-sm text-stone-500">V1 暂不单独保存偏好字段，当前偏好来自基础资料和社媒账号。</p>
        </Card>
      ) : null}
    </div>
  );
}
