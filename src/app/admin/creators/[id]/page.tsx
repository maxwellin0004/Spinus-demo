import { updateCreatorAction, updateSocialAccountVerificationAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { money, percent, shortDate } from "@/lib/format";
import { getAdminContext } from "@/lib/admin";

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
      responsibleAdmin: true,
    },
  });
  if (!creator) return <PageHeader title="未找到创作者" />;
  const admins = await prisma.adminProfile.findMany({ where: { user: { status: "ACTIVE" } }, include: { user: true }, orderBy: { createdAt: "asc" } });
  const action = updateCreatorAction.bind(null, creator.id);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者详情" title={creator.displayName}><StatusBadge>{creator.level}</StatusBadge></PageHeader>
      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="text-xl font-semibold">管理控制</h2>
          <form action={action} className="mt-5 grid gap-4">
            <Select label="Review status" name="reviewStatus" defaultValue={creator.reviewStatus}>
              <option value="APPROVED">已通过</option>
              <option value="PENDING">待处理</option>
              <option value="REJECTED">已拒绝</option>
              <option value="FROZEN">冻结</option>
            </Select>
            <Select label="Creator level" name="level" defaultValue={creator.level}>
              <option value="NEW">新手</option>
              <option value="VERIFIED">已认证</option>
              <option value="PRO">专业</option>
              <option value="ELITE">精英</option>
            </Select>
            <Select label="Risk level" name="riskLevel" defaultValue={creator.riskLevel}>
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
            </Select>
            <Select label="负责运营" name="responsibleAdminId" defaultValue={creator.responsibleAdminId ?? ""}>
              <option value="">未分配</option>
              {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.displayName} · {admin.user.email}</option>)}
            </Select>
            <input className="rounded-2xl border border-stone-200 px-4 py-3" name="violationDelta" type="number" defaultValue={0} />
            <SubmitButton pendingLabel="正在保存...">保存创作者</SubmitButton>
          </form>
        </Card>
        <Card>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="font-semibold">邮箱</dt><dd>{creator.email}</dd></div>
            <div><dt className="font-semibold">国家/地区</dt><dd>{creator.country}</dd></div>
            <div><dt className="font-semibold">语言</dt><dd>{creator.languages.join(", ")}</dd></div>
            <div><dt className="font-semibold">擅长领域</dt><dd>{creator.categories.join(", ")}</dd></div>
            <div><dt className="font-semibold">完成任务数</dt><dd>{creator.completedTasks}</dd></div>
            <div><dt className="font-semibold">履约率</dt><dd>{percent(creator.completionRate)}</dd></div>
            <div><dt className="font-semibold">钱包</dt><dd>{money(creator.wallet?.availableBalance)}</dd></div>
            <div><dt className="font-semibold">违规次数</dt><dd>{creator.violationCount}</dd></div>
            <div><dt className="font-semibold">负责运营</dt><dd>{creator.responsibleAdmin?.displayName ?? "-"}</dd></div>
            <div><dt className="font-semibold">演示数据</dt><dd>{creator.isDemo ? "是" : "否"}</dd></div>
          </dl>
        </Card>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">社媒账号</h2>
        {creator.socialAccounts.length === 0 ? (
          <DataTable headers={["Platform", "Account"]} rows={[]} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {creator.socialAccounts.map((account) => (
              <Card key={account.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-stone-950">{account.platform} · {account.accountName}</h3>
                    <a className="mt-1 block break-all text-sm font-semibold text-stone-700" href={account.accountUrl}>{account.accountUrl}</a>
                  </div>
                  <StatusBadge>{account.verificationStatus}</StatusBadge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div><dt className="font-semibold">粉丝数</dt><dd>{account.followers}</dd></div>
                  <div><dt className="font-semibold">平均播放</dt><dd>{account.avgViews}</dd></div>
                  <div><dt className="font-semibold">内容形式</dt><dd>{account.contentType}</dd></div>
                  <div><dt className="font-semibold">国家/语言</dt><dd>{account.country} / {account.language}</dd></div>
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
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton pendingLabel="正在保存..." variant="secondary">保存社媒审核</SubmitButton>
                  </div>
                </form>
              </Card>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">任务历史</h2>
        <DataTable
          headers={["Campaign", "Task", "Status", "Applied"]}
          rows={creator.applications.map((application) => [
            application.task.campaign.title,
            application.task.title,
            <StatusBadge key="s">{application.status}</StatusBadge>,
            shortDate(application.createdAt),
          ])}
        />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">收益</h2>
        <DataTable
          headers={["Type", "Amount", "Status", "Note", "Created"]}
          rows={(creator.wallet?.transactions ?? []).map((tx) => [
            tx.type,
            money(tx.amount),
            <StatusBadge key="s">{tx.status}</StatusBadge>,
            tx.note ?? "-",
            shortDate(tx.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
