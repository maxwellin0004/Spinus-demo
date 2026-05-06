import { requireAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { shortDate } from "@/lib/format";

function compactJson(value: unknown) {
  if (!value) return "-";
  const serialized = JSON.stringify(value);
  return serialized.length > 140 ? `${serialized.slice(0, 140)}...` : serialized;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; actor?: string }>;
}) {
  await requireAdminPermission("audit.view");
  const { action, entity, actor } = await searchParams;
  const logs = await prisma.auditLog.findMany({
    where: {
      action: action ? { contains: action, mode: "insensitive" } : undefined,
      entityType: entity ? { contains: entity, mode: "insensitive" } : undefined,
      actorUserId: actor || undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });
  const actorIds = logs.map((log) => log.actorUserId).filter((id): id is string => Boolean(id));
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, email: true } });
  const actorMap = new Map(actors.map((user) => [user.id, user.email]));

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="操作日志" />
      <form className="flex flex-wrap gap-3">
        <input className="rounded-full border border-stone-200 px-4 py-3" name="action" placeholder="动作关键词" defaultValue={action} />
        <input className="rounded-full border border-stone-200 px-4 py-3" name="entity" placeholder="对象类型" defaultValue={entity} />
        <select className="rounded-full border border-stone-200 px-4 py-3" name="actor" defaultValue={actor ?? ""}>
          <option value="">全部操作人</option>
          {actors.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>
      <DataTable
        headers={["时间", "操作人", "角色", "动作", "对象", "对象 ID", "变更前", "变更后"]}
        rows={logs.map((log) => [
          shortDate(log.createdAt),
          log.actorUserId ? actorMap.get(log.actorUserId) ?? log.actorUserId.slice(0, 8) : "系统",
          log.actorRole ? <StatusBadge key="role">{log.actorRole}</StatusBadge> : "-",
          log.action,
          log.entityType,
          log.entityId.slice(0, 12),
          <code className="text-xs" key="before">{compactJson(log.beforeJson)}</code>,
          <code className="text-xs" key="after">{compactJson(log.afterJson)}</code>,
        ])}
      />
    </div>
  );
}
