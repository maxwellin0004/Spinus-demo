import { CreatorMembershipTier } from "@prisma/client";
import { updateCreatorAction, updateSocialAccountVerificationAction } from "@/lib/actions";
import { getAdminContext } from "@/lib/admin";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { money, percent, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function dateInputValue(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default async function AdminCreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await getAdminContext();
  const { id } = await params;
  const creator = await prisma.creatorProfile.findUnique({
    where: { id },
    include: {
      user: true,
      socialAccounts: { orderBy: { createdAt: "desc" } },
      wallet: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } } },
      applications: { include: { task: { include: { campaign: true } } }, orderBy: { createdAt: "desc" } },
      responsibleAdmin: { include: { user: true } },
      referralsReceived: {
        include: {
          user: {
            include: { creatorProfile: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      membershipApplications: {
        include: { reviewedBy: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!creator) return <PageHeader title="未找到创作者" />;

  const admins = await prisma.adminProfile.findMany({
    where: { user: { status: "ACTIVE" } },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  const action = updateCreatorAction.bind(null, creator.id);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Creator Detail" title={creator.displayName}>
        <StatusBadge>{creator.level}</StatusBadge>
        <StatusBadge tone={creatorMembershipTone(creator.membershipTier)}>{creatorMembershipLabel(creator.membershipTier)}</StatusBadge>
      </PageHeader>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <h2 className="text-xl font-semibold">管理控制</h2>
          <form action={action} className="mt-5 grid gap-4">
            <Select label="审核状态" name="reviewStatus" defaultValue={creator.reviewStatus}>
              <option value="APPROVED">已通过</option>
              <option value="PENDING">待处理</option>
              <option value="REJECTED">已拒绝</option>
              <option value="FROZEN">冻结</option>
            </Select>

            <Select label="创作者等级" name="level" defaultValue={creator.level}>
              <option value="NEW">新手</option>
              <option value="VERIFIED">已认证</option>
              <option value="PRO">专业</option>
              <option value="ELITE">精英</option>
            </Select>

            <Select label="会员档位" name="membershipTier" defaultValue={creator.membershipTier}>
              <option value={CreatorMembershipTier.NONE}>未开通</option>
              <option value={CreatorMembershipTier.GROWTH}>成长会员</option>
              <option value={CreatorMembershipTier.PRO}>Pro 高阶会员</option>
            </Select>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="会员开始日期" name="membershipStartedAt" type="date" defaultValue={dateInputValue(creator.membershipStartedAt)} />
              <Field label="会员结束日期" name="membershipEndsAt" type="date" defaultValue={dateInputValue(creator.membershipEndsAt)} />
            </div>

            <Textarea label="会员备注" name="membershipNote" defaultValue={creator.membershipNote ?? ""} rows={3} />

            <Select label="风险等级" name="riskLevel" defaultValue={creator.riskLevel}>
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
            </Select>

            <Select label="负责运营" name="responsibleAdminId" defaultValue={creator.responsibleAdminId ?? ""}>
              <option value="">未分配</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.displayName} / {admin.user.email}
                </option>
              ))}
            </Select>

            <Field label="新增违规次数" name="violationDelta" type="number" defaultValue={0} />
            <SubmitButton pendingLabel="正在保存...">保存创作者</SubmitButton>
          </form>
        </Card>

        <Card>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="font-semibold">邮箱</dt><dd>{creator.email}</dd></div>
            <div><dt className="font-semibold">国家 / 地区</dt><dd>{creator.country}</dd></div>
            <div><dt className="font-semibold">语言</dt><dd>{creator.languages.join(", ") || "-"}</dd></div>
            <div><dt className="font-semibold">擅长领域</dt><dd>{creator.categories.join(", ") || "-"}</dd></div>
            <div><dt className="font-semibold">完成任务数</dt><dd>{creator.completedTasks}</dd></div>
            <div><dt className="font-semibold">履约率</dt><dd>{percent(creator.completionRate)}</dd></div>
            <div><dt className="font-semibold">钱包余额</dt><dd>{money(creator.wallet?.availableBalance)}</dd></div>
            <div><dt className="font-semibold">累计收入</dt><dd>{money(creator.wallet?.cumulativeIncome ?? creator.cumulativeIncome)}</dd></div>
            <div><dt className="font-semibold">违规次数</dt><dd>{creator.violationCount}</dd></div>
            <div><dt className="font-semibold">会员档位</dt><dd>{creatorMembershipLabel(creator.membershipTier)}</dd></div>
            <div><dt className="font-semibold">会员有效期</dt><dd>{creator.membershipEndsAt ? shortDate(creator.membershipEndsAt) : "未设置"}</dd></div>
            <div><dt className="font-semibold">专属分享码</dt><dd>{creator.shareCode}</dd></div>
            <div><dt className="font-semibold">负责运营</dt><dd>{creator.responsibleAdmin?.displayName ?? "-"}</dd></div>
            <div><dt className="font-semibold">联系方式</dt><dd>{creator.responsibleAdmin?.wechat || creator.responsibleAdmin?.user.email || "-"}</dd></div>
            <div><dt className="font-semibold">演示数据</dt><dd>{creator.isDemo ? "是" : "否"}</dd></div>
            <div><dt className="font-semibold">分享带来注册</dt><dd>{creator.referralsReceived.length}</dd></div>
          </dl>
          {creator.membershipNote ? (
            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
              <p className="font-semibold text-stone-950">会员备注</p>
              <p className="mt-2 whitespace-pre-wrap">{creator.membershipNote}</p>
            </div>
          ) : null}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">会员申请记录</h2>
        <DataTable
          headers={["提交时间", "档位", "金额", "状态", "付款单号", "凭证", "审核时间", "处理人", "备注"]}
          rows={creator.membershipApplications.map((application) => [
            shortDate(application.createdAt),
            <StatusBadge key={`${application.id}-tier`} tone={creatorMembershipTone(application.tier)}>
              {creatorMembershipLabel(application.tier)}
            </StatusBadge>,
            money(application.amount, application.currency),
            <StatusBadge key={`${application.id}-status`}>{application.status}</StatusBadge>,
            application.paymentReference || "-",
            application.paymentProofUrl ? (
              <a className="font-semibold text-stone-950 underline-offset-2 hover:underline" href={application.paymentProofUrl} key={`${application.id}-proof`} target="_blank">
                查看凭证
              </a>
            ) : (
              "-"
            ),
            shortDate(application.reviewedAt),
            application.reviewedBy?.email ?? "-",
            application.adminNote ?? application.creatorNote ?? "-",
          ])}
          emptyTitle="还没有会员申请记录"
          emptyBody="创作者提交付款凭证后，这里会保留每一条开通申请。"
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">邀请注册用户</h2>
        <DataTable
          emptyTitle="还没有通过这个创作者的海报带来注册"
          emptyBody="当用户通过该创作者的专属分享码完成注册后，这里会显示邀请明细。"
          headers={["用户", "邮箱", "角色", "当前状态", "会员状态", "注册时间", "分享码"]}
          rows={creator.referralsReceived.map((referral) => [
            referral.user.creatorProfile?.displayName ?? referral.user.email,
            referral.user.email,
            <StatusBadge key={`${referral.id}-role`}>{referral.user.role}</StatusBadge>,
            <StatusBadge key={`${referral.id}-status`}>{referral.user.status}</StatusBadge>,
            referral.user.creatorProfile ? (
              <StatusBadge key={`${referral.id}-membership`} tone={creatorMembershipTone(referral.user.creatorProfile.membershipTier)}>
                {creatorMembershipLabel(referral.user.creatorProfile.membershipTier)}
              </StatusBadge>
            ) : (
              "-"
            ),
            shortDate(referral.createdAt),
            referral.codeSnapshot,
          ])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">社媒账号</h2>
        {creator.socialAccounts.length === 0 ? (
          <DataTable headers={["平台", "账号"]} rows={[]} emptyTitle="还没有社媒账号" emptyBody="创作者提交账号后，这里会显示审核项。" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {creator.socialAccounts.map((account) => (
              <Card key={account.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-stone-950">{account.platform} / {account.accountName}</h3>
                    <a className="mt-1 block break-all text-sm font-semibold text-stone-700" href={account.accountUrl}>{account.accountUrl}</a>
                  </div>
                  <StatusBadge>{account.verificationStatus}</StatusBadge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div><dt className="font-semibold">粉丝数</dt><dd>{account.followers}</dd></div>
                  <div><dt className="font-semibold">平均播放</dt><dd>{account.avgViews}</dd></div>
                  <div><dt className="font-semibold">内容形式</dt><dd>{account.contentType}</dd></div>
                  <div><dt className="font-semibold">国家 / 语言</dt><dd>{account.country} / {account.language}</dd></div>
                  <div><dt className="font-semibold">验证时间</dt><dd>{shortDate(account.verifiedAt)}</dd></div>
                  <div><dt className="font-semibold">当前备注</dt><dd>{account.verificationNote ?? "-"}</dd></div>
                </dl>
                <form action={updateSocialAccountVerificationAction.bind(null, account.id)} className="mt-5 grid gap-3">
                  <Select label="验证状态" name="verificationStatus" defaultValue={account.verificationStatus}>
                    <option value="PENDING">待验证</option>
                    <option value="VERIFIED">验证通过</option>
                    <option value="REJECTED">验证拒绝</option>
                  </Select>
                  <Textarea label="审核备注" name="verificationNote" defaultValue={account.verificationNote ?? ""} rows={3} />
                  <SubmitButton pendingLabel="正在保存..." variant="secondary">保存社媒审核</SubmitButton>
                </form>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">任务历史</h2>
        <DataTable
          headers={["Campaign", "Task", "状态", "申请时间"]}
          rows={creator.applications.map((application) => [
            application.task.campaign.title,
            application.task.title,
            <StatusBadge key={`${application.id}-status`}>{application.status}</StatusBadge>,
            shortDate(application.createdAt),
          ])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">收益记录</h2>
        <DataTable
          headers={["类型", "金额", "状态", "备注", "创建时间"]}
          rows={(creator.wallet?.transactions ?? []).map((tx) => [
            tx.type,
            money(tx.amount),
            <StatusBadge key={tx.id}>{tx.status}</StatusBadge>,
            tx.note ?? "-",
            shortDate(tx.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
