import Link from "next/link";
import { DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { money, number } from "@/lib/format";
import { demoWhere, getAdminContext, hasAdminPermission, brandScopeWhere, scopeOptions } from "@/lib/admin";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; demo?: string }>;
}) {
  const context = await getAdminContext();
  if (!hasAdminPermission(context.profile, "reports.view")) return <PageHeader title="无权查看报表" />;
  const { scope, demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const campaigns = await prisma.campaign.findMany({
    where: {
      ...demoWhere(demo, canSeeDemo),
      brand: brandScopeWhere(context.profile, scope),
    },
    include: { brand: { include: { responsibleAdmin: true } }, proofs: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="全局报表" />
      <form className="flex flex-wrap gap-3">
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
        headers={["Campaign", "Brand", "负责运营", "Status", "Budget", "Views", "Clicks", "Conversions", "Report"]}
        rows={campaigns.map((campaign) => [
          campaign.title,
          campaign.brand.brandName,
          campaign.brand.responsibleAdmin?.displayName ?? "-",
          <StatusBadge key="s">{campaign.status}</StatusBadge>,
          money(campaign.totalBudget),
          number(campaign.proofs.reduce((sum, proof) => sum + proof.views, 0)),
          number(campaign.proofs.reduce((sum, proof) => sum + proof.clicks, 0)),
          number(campaign.proofs.reduce((sum, proof) => sum + proof.conversions, 0)),
          <Link className="font-semibold text-stone-950" href={`/admin/reports/${campaign.id}${campaign.isDemo ? "?demo=include" : ""}`} key={campaign.id}>查看</Link>,
        ])}
      />
    </div>
  );
}
