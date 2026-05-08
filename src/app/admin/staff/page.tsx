import { AdminDataScope, AdminLevel, UserStatus } from "@prisma/client";
import { createAdminStaffAction, updateAdminStaffAction } from "@/lib/actions";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin";
import { CopyButton } from "@/components/copy-button";
import { Button, Card, DataTable, Field, PageHeader, Select, StatusBadge } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { generateInviteCodeCandidate, registerInviteUrl } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

const permissionLabels: Record<string, string> = {
  "staff.manage": "员工管理",
  "account.create": "账号开通",
  "account.freeze": "账号冻结",
  "account.reset_password": "重置密码",
  "campaign.manage": "推广管理",
  "content.review": "内容审核",
  "proof.review": "证明审核",
  "payment.manage": "结算管理",
  "compliance.manage": "合规管理",
  "reports.view": "报表查看",
  "audit.view": "审计日志",
  "demo.manage": "演示数据",
};

export default async function AdminStaffPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdminPermission("staff.manage");
  const { error } = await searchParams;
  const admins = await prisma.adminProfile.findMany({
    include: {
      user: true,
      invitationCodes: { orderBy: { createdAt: "desc" } },
      managedBrands: { select: { id: true } },
      managedCreators: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const newInviteCode = generateInviteCodeCandidate();

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="员工账号与 BD 邀请码" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <Card>
        <h2 className="text-xl font-semibold">创建员工账号</h2>
        <form action={createAdminStaffAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="邮箱" name="email" required />
          <Field label="初始密码" name="password" type="password" required />
          <Field label="员工名称" name="displayName" required />
          <Field label="团队名称" name="teamName" defaultValue="商务运营组" />
          <Field label="微信号" name="wechat" defaultValue="xiaohuangque_ops" />
          <Select label="账号级别" name="level" defaultValue={AdminLevel.STAFF}>
            <option value={AdminLevel.STAFF}>员工 / BD</option>
            <option value={AdminLevel.FOUNDER}>创始人</option>
          </Select>
          <Select label="数据范围" name="dataScope" defaultValue={AdminDataScope.ASSIGNED}>
            <option value={AdminDataScope.ASSIGNED}>我负责的客户</option>
            <option value={AdminDataScope.TEAM}>团队客户</option>
            <option value={AdminDataScope.ALL}>全部客户</option>
          </Select>
          <Field label="BD 邀请码" name="inviteCode" defaultValue={newInviteCode} required />
          <Field label="邀请码备注（可选）" name="inviteNote" />
          <label className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-semibold text-stone-700">
            <input className="mr-2" name="inviteActive" type="checkbox" defaultChecked />
            启用邀请码
          </label>
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-semibold text-stone-700">权限</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ADMIN_PERMISSIONS.map((permission) => (
                <label className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm" key={permission}>
                  <input className="mr-2" name="permissions" type="checkbox" value={permission} defaultChecked={["account.create", "campaign.manage", "content.review", "reports.view"].includes(permission)} />
                  {permissionLabels[permission]}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2"><Button variant="secondary">创建员工账号</Button></div>
        </form>
      </Card>

      <DataTable
        headers={["员工", "邮箱", "级别", "数据范围", "状态", "邀请码", "邀请状态", "负责品牌", "负责创作者", "创建时间"]}
        rows={admins.map((admin) => {
          const activeInvite = admin.invitationCodes.find((code) => code.active);
          const latestInvite = activeInvite ?? admin.invitationCodes[0];
          return [
            admin.displayName,
            admin.user.email,
            <StatusBadge key="level">{admin.level}</StatusBadge>,
            admin.dataScope,
            <StatusBadge key="status">{admin.user.status}</StatusBadge>,
            latestInvite?.code ?? "未配置",
            latestInvite ? <StatusBadge key="invite">{latestInvite.active ? "启用" : "停用"}</StatusBadge> : "-",
            admin.managedBrands.length,
            admin.managedCreators.length,
            shortDate(admin.createdAt),
          ];
        })}
      />

      <div className="grid gap-4">
        {admins.map((admin) => {
          const activeInvite = admin.invitationCodes.find((code) => code.active);
          const latestInvite = activeInvite ?? admin.invitationCodes[0];
          const inviteCode = latestInvite?.code ?? generateInviteCodeCandidate();
          const inviteUrl = registerInviteUrl(inviteCode);
          return (
            <Card key={admin.id}>
              <form action={updateAdminStaffAction.bind(null, admin.id)} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Field label="员工名称" name="displayName" defaultValue={admin.displayName} />
                  <Field label="团队名称" name="teamName" defaultValue={admin.teamName ?? ""} />
                  <Field label="微信号" name="wechat" defaultValue={admin.wechat ?? ""} />
                  <Select label="账号级别" name="level" defaultValue={admin.level}>
                    <option value={AdminLevel.STAFF}>员工 / BD</option>
                    <option value={AdminLevel.FOUNDER}>创始人</option>
                  </Select>
                  <Select label="数据范围" name="dataScope" defaultValue={admin.dataScope}>
                    <option value={AdminDataScope.ASSIGNED}>我负责的客户</option>
                    <option value={AdminDataScope.TEAM}>团队客户</option>
                    <option value={AdminDataScope.ALL}>全部客户</option>
                  </Select>
                  <Select label="状态" name="status" defaultValue={admin.user.status}>
                    <option value={UserStatus.ACTIVE}>启用</option>
                    <option value={UserStatus.FROZEN}>冻结</option>
                  </Select>
                  <Field label="重置密码（可空）" name="password" type="password" />
                  <Field label="BD 邀请码" name="inviteCode" defaultValue={inviteCode} />
                  <Field label="邀请码备注（可选）" name="inviteNote" defaultValue={latestInvite?.note ?? ""} />
                  <label className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-semibold text-stone-700">
                    <input className="mr-2" name="inviteActive" type="checkbox" defaultChecked={Boolean(latestInvite?.active)} />
                    启用邀请码
                  </label>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-stone-900">注册链接</span>
                    <code className="rounded-xl bg-white px-3 py-2 text-stone-800">{latestInvite?.active ? inviteUrl : latestInvite ? "邀请码已停用" : "保存后生成"}</code>
                    {latestInvite?.active ? <CopyButton text={inviteUrl} label="复制链接" /> : null}
                  </div>
                  {latestInvite && !latestInvite.active ? <p className="mt-2 text-red-700">该邀请码已停用，BD 暂不能使用注册链接。</p> : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ADMIN_PERMISSIONS.map((permission) => (
                    <label className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm" key={permission}>
                      <input className="mr-2" name="permissions" type="checkbox" value={permission} defaultChecked={admin.permissions.includes(permission)} />
                      {permissionLabels[permission]}
                    </label>
                  ))}
                </div>
                <Button>保存员工权限和邀请码</Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
