import { AdminDataScope, AdminLevel, UserStatus } from "@prisma/client";
import { createAdminStaffAction, updateAdminStaffAction } from "@/lib/actions";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin";
import { CopyButton, SubmitButton } from "@/components/form-controls";
import { Field, PageHeader, Select, StatusBadge } from "@/components/ui";
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
  "payment.view": "财务只读",
  "payment.confirm": "付款确认",
  "payment.refund.review": "退款审核",
  "payment.refund.execute": "退款执行",
  "payment.config.manage": "支付配置",
  "payment.manage": "结算管理（旧版全权限）",
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
      <details className="overflow-hidden rounded-2xl border border-stone-200 bg-white/86 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-amber-50/35">
          <div>
            <h2 className="text-lg font-black text-stone-950">创建员工账号</h2>
            <p className="mt-1 text-sm text-stone-500">新增 BD 或运营账号时展开填写，日常查看员工列表时保持收起。</p>
          </div>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-black text-stone-700">展开</span>
        </summary>
        <form action={createAdminStaffAction} className="grid gap-4 border-t border-stone-100 bg-stone-50/60 px-5 py-5 md:grid-cols-2">
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
          <div className="md:col-span-2"><SubmitButton pendingLabel="正在创建..." variant="secondary">创建员工账号</SubmitButton></div>
        </form>
      </details>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white/86 shadow-sm">
        <div className="hidden grid-cols-[1.35fr_0.75fr_0.85fr_0.9fr_0.85fr_auto] gap-3 bg-stone-50 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-stone-500 md:grid">
          <span>员工</span>
          <span>级别 / 状态</span>
          <span>数据范围</span>
          <span>BD 邀请码</span>
          <span>负责数据</span>
          <span className="text-right">操作</span>
        </div>
        {admins.map((admin) => {
          const activeInvite = admin.invitationCodes.find((code) => code.active);
          const latestInvite = activeInvite ?? admin.invitationCodes[0];
          const inviteCode = latestInvite?.code ?? generateInviteCodeCandidate();
          const inviteUrl = registerInviteUrl(inviteCode);
          const enabledPermissions = admin.permissions
            .map((permission) => permissionLabels[permission] ?? permission)
            .slice(0, 5);
          return (
            <details className="group border-t border-stone-100 first:border-t-0" key={admin.id}>
              <summary className="grid cursor-pointer gap-3 px-4 py-4 transition hover:bg-amber-50/35 md:grid-cols-[1.35fr_0.75fr_0.85fr_0.9fr_0.85fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-stone-950">{admin.displayName}</p>
                  <p className="truncate text-xs font-semibold text-stone-500">{admin.user.email}</p>
                  <p className="mt-1 truncate text-xs text-stone-500">{admin.teamName ?? "未配置团队"} / {admin.wechat ?? "未配置微信"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge>{admin.level}</StatusBadge>
                  <StatusBadge>{admin.user.status}</StatusBadge>
                </div>
                <div className="text-sm font-semibold text-stone-700">{admin.dataScope}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-black text-stone-800">{latestInvite?.code ?? "未配置"}</code>
                    {latestInvite ? <StatusBadge>{latestInvite.active ? "启用" : "停用"}</StatusBadge> : null}
                  </div>
                  {latestInvite?.active ? (
                    <div className="mt-1">
                      <CopyButton value={inviteUrl}>复制链接</CopyButton>
                    </div>
                  ) : null}
                </div>
                <div className="text-sm text-stone-600">
                  <p>品牌 {admin.managedBrands.length}</p>
                  <p>创作者 {admin.managedCreators.length}</p>
                  <p className="text-xs text-stone-400">{shortDate(admin.createdAt)}</p>
                </div>
                <span className="text-right text-sm font-black text-stone-950 group-open:text-amber-700">编辑</span>
              </summary>

              <form action={updateAdminStaffAction.bind(null, admin.id)} className="grid gap-4 border-t border-stone-100 bg-stone-50/70 px-4 py-4">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
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
                  <Field label="敏感操作确认" name="sensitiveConfirmation" placeholder="需要时输入 CONFIRM" />
                  <Field label="BD 邀请码" name="inviteCode" defaultValue={inviteCode} />
                  <Field label="邀请码备注（可选）" name="inviteNote" defaultValue={latestInvite?.note ?? ""} />
                  <label className="rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-semibold text-stone-700">
                    <input className="mr-2" name="inviteActive" type="checkbox" defaultChecked={Boolean(latestInvite?.active)} />
                    启用邀请码
                  </label>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-stone-900">注册链接</span>
                    <code className="rounded-xl bg-white px-3 py-2 text-stone-800">{latestInvite?.active ? inviteUrl : latestInvite ? "邀请码已停用" : "保存后生成"}</code>
                    {latestInvite?.active ? <CopyButton value={inviteUrl}>复制链接</CopyButton> : null}
                  </div>
                  {latestInvite && !latestInvite.active ? <p className="mt-2 text-red-700">该邀请码已停用，BD 暂不能使用注册链接。</p> : null}
                </div>
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-stone-400">
                    当前权限：{enabledPermissions.length ? enabledPermissions.join(" / ") : "未配置"}
                    {admin.permissions.length > enabledPermissions.length ? ` 等 ${admin.permissions.length} 项` : ""}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {ADMIN_PERMISSIONS.map((permission) => (
                    <label className="rounded-xl border border-stone-200 bg-white/80 px-3 py-2 text-sm" key={permission}>
                      <input className="mr-2" name="permissions" type="checkbox" value={permission} defaultChecked={admin.permissions.includes(permission)} />
                      {permissionLabels[permission]}
                    </label>
                  ))}
                  </div>
                </div>
                <SubmitButton pendingLabel="正在保存...">保存员工权限和邀请码</SubmitButton>
              </form>
            </details>
          );
        })}
      </section>
    </div>
  );
}
