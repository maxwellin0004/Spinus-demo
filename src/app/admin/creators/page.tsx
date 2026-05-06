import Link from "next/link";
import { DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { money, percent, shortDate } from "@/lib/format";
import { creatorScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; level?: string; scope?: string; demo?: string }>;
}) {
  const context = await getAdminContext();
  const { q, country, level, scope, demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const creators = await prisma.creatorProfile.findMany({
    where: {
      ...creatorScopeWhere(context.profile, scope),
      ...demoWhere(demo, canSeeDemo),
      displayName: q ? { contains: q, mode: "insensitive" } : undefined,
      country: country || undefined,
      level: level && level !== "ALL" ? (level as never) : undefined,
    },
    include: { socialAccounts: true, wallet: true, responsibleAdmin: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="创作者管理" />
      <form className="flex flex-wrap gap-3">
        <input className="rounded-full border border-stone-200 px-4 py-3" name="q" placeholder="Search creator" defaultValue={q} />
        <input className="rounded-full border border-stone-200 px-4 py-3" name="country" placeholder="Country" defaultValue={country} />
        <select className="rounded-full border border-stone-200 px-4 py-3" name="level" defaultValue={level ?? "ALL"}>
          <option value="ALL">全部等级</option>
          <option value="NEW">新手</option>
          <option value="VERIFIED">已认证</option>
          <option value="PRO">专业</option>
          <option value="ELITE">精英</option>
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="scope" defaultValue={scope}>
          {scopeOptions(context.profile).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="demo" defaultValue={demo ?? "real"}>
          <option value="real">只看真实数据</option>
          {canSeeDemo ? <option value="include">包含演示数据</option> : null}
          {canSeeDemo ? <option value="only">只看演示数据</option> : null}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>
      <DataTable
        headers={["Creator", "Country", "Platforms", "负责运营", "Level", "Status", "演示数据", "Income", "Completion", "Created"]}
        rows={creators.map((creator) => [
          <Link className="font-semibold text-stone-950" href={`/admin/creators/${creator.id}`} key={creator.id}>{creator.displayName}</Link>,
          creator.country,
          creator.socialAccounts.map((account) => account.platform).join(", ") || "-",
          creator.responsibleAdmin?.displayName ?? "-",
          creator.level,
          <StatusBadge key="s">{creator.reviewStatus}</StatusBadge>,
          creator.isDemo ? "是" : "否",
          money(creator.wallet?.cumulativeIncome ?? creator.cumulativeIncome),
          percent(creator.completionRate),
          shortDate(creator.createdAt),
        ])}
      />
    </div>
  );
}
