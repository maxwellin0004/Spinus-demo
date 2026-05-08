import { AdminLevel, UserRole } from "@prisma/client";
import { getAdminContext, hasAdminPermission, isFounder } from "@/lib/admin";
import { CopyButton } from "@/components/copy-button";
import { Card, DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { number, shortDate } from "@/lib/format";
import { registerInviteUrl } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

function dateStart(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function dateEnd(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  parsed.setDate(parsed.getDate() + 1);
  return parsed;
}

export default async function AdminInvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; bd?: string; from?: string; to?: string }>;
}) {
  const context = await getAdminContext();
  const params = await searchParams;
  const canViewAll = isFounder(context.profile) || hasAdminPermission(context.profile, "staff.manage");
  const roleFilter = params.role === UserRole.BRAND || params.role === UserRole.CREATOR ? params.role : undefined;
  const from = dateStart(params.from);
  const to = dateEnd(params.to);

  const selectableAdmins = canViewAll
    ? await prisma.adminProfile.findMany({
        where: {
          OR: [{ level: AdminLevel.STAFF }, { invitationCodes: { some: {} } }],
        },
        include: { user: true, invitationCodes: { orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "asc" },
      })
    : await prisma.adminProfile.findMany({
        where: { id: context.profile.id },
        include: { user: true, invitationCodes: { orderBy: { createdAt: "desc" } } },
      });

  const selectedAdminId = canViewAll && params.bd && selectableAdmins.some((admin) => admin.id === params.bd) ? params.bd : undefined;
  const scopedAdminIds = canViewAll
    ? selectedAdminId
      ? [selectedAdminId]
      : selectableAdmins.map((admin) => admin.id)
    : [context.profile.id];

  const attributions = await prisma.invitationAttribution.findMany({
    where: {
      invitedByAdminId: { in: scopedAdminIds },
      user: {
        role: roleFilter,
        createdAt: {
          gte: from,
          lt: to,
        },
      },
    },
    include: {
      invitedByAdmin: true,
      invitationCode: true,
      user: {
        include: {
          brandProfile: { include: { responsibleAdmin: true } },
          creatorProfile: { include: { responsibleAdmin: true } },
        },
      },
    },
    orderBy: { user: { createdAt: "desc" } },
  });

  const summary = selectableAdmins
    .filter((admin) => scopedAdminIds.includes(admin.id))
    .map((admin) => {
      const adminAttributions = attributions.filter((item) => item.invitedByAdminId === admin.id);
      const activeInvite = admin.invitationCodes.find((code) => code.active);
      const latestInvite = activeInvite ?? admin.invitationCodes[0];
      return {
        admin,
        invite: latestInvite,
        brandCount: adminAttributions.filter((item) => item.user.role === UserRole.BRAND).length,
        creatorCount: adminAttributions.filter((item) => item.user.role === UserRole.CREATOR).length,
        totalCount: adminAttributions.length,
        latestRegistration: adminAttributions[0]?.user.createdAt,
      };
    });

  const ownAdmin = selectableAdmins.find((admin) => admin.id === context.profile.id);
  const ownActiveInvite = ownAdmin?.invitationCodes.find((code) => code.active);
  const ownLatestInvite = ownActiveInvite ?? ownAdmin?.invitationCodes[0];

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="BD 邀请" title="邀请码数据" />

      {!canViewAll ? (
        <Card>
          <h2 className="text-xl font-semibold">我的邀请链接</h2>
          {ownLatestInvite ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge>{ownLatestInvite.code}</StatusBadge>
              <StatusBadge>{ownLatestInvite.active ? "启用" : "已停用"}</StatusBadge>
              {ownLatestInvite.active ? (
                <>
                  <code className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-800">{registerInviteUrl(ownLatestInvite.code)}</code>
                  <CopyButton text={registerInviteUrl(ownLatestInvite.code)} label="复制链接" />
                </>
              ) : (
                <p className="text-sm font-semibold text-red-700">邀请码已停用，请联系管理员。</p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-red-700">你的邀请码未配置，请联系管理员。</p>
          )}
        </Card>
      ) : null}

      <Card>
        <form className="grid gap-4 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            用户角色
            <select className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" name="role" defaultValue={params.role ?? "ALL"}>
              <option value="ALL">全部</option>
              <option value={UserRole.BRAND}>品牌方</option>
              <option value={UserRole.CREATOR}>创作者</option>
            </select>
          </label>
          {canViewAll ? (
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              BD
              <select className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" name="bd" defaultValue={selectedAdminId ?? "ALL"}>
                <option value="ALL">全部 BD</option>
                {selectableAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.displayName} / {admin.user.email}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            开始日期
            <input className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" name="from" type="date" defaultValue={params.from ?? ""} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            结束日期
            <input className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" name="to" type="date" defaultValue={params.to ?? ""} />
          </label>
          <div className="flex items-end">
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
          </div>
        </form>
      </Card>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">BD 邀请汇总</h2>
        <DataTable
          headers={["BD", "邮箱", "邀请码", "状态", "品牌方注册数", "创作者注册数", "总注册数", "最近注册时间"]}
          rows={summary.map((item) => [
            item.admin.displayName,
            item.admin.user.email,
            item.invite?.code ?? "未配置",
            item.invite ? <StatusBadge key="status">{item.invite.active ? "启用" : "停用"}</StatusBadge> : "-",
            number(item.brandCount),
            number(item.creatorCount),
            number(item.totalCount),
            shortDate(item.latestRegistration),
          ])}
        />
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">注册用户明细</h2>
        <DataTable
          headers={["用户", "邮箱", "角色", "审核状态", "邀请来源 BD", "当前负责运营", "邀请码", "注册时间"]}
          rows={attributions.map((item) => {
            const profile = item.user.role === UserRole.BRAND ? item.user.brandProfile : item.user.creatorProfile;
            const currentAdmin = item.user.role === UserRole.BRAND ? item.user.brandProfile?.responsibleAdmin : item.user.creatorProfile?.responsibleAdmin;
            const displayName = item.user.role === UserRole.BRAND ? item.user.brandProfile?.brandName : item.user.creatorProfile?.displayName;
            return [
              displayName ?? item.user.email,
              item.user.email,
              <StatusBadge key="role">{item.user.role}</StatusBadge>,
              profile?.reviewStatus ?? "-",
              item.invitedByAdmin.displayName,
              currentAdmin?.displayName ?? "-",
              item.codeSnapshot,
              shortDate(item.user.createdAt),
            ];
          })}
        />
      </section>
    </div>
  );
}
