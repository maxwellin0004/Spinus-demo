import Link from "next/link";
import { DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { money, shortDate } from "@/lib/format";
import { brandScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";

function reviewTone(status: string) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED" || status === "FROZEN") return "danger" as const;
  return "warning" as const;
}

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; scope?: string; demo?: string }>;
}) {
  const context = await getAdminContext();
  const { q, status, scope, demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const brands = await prisma.brandProfile.findMany({
    where: {
      ...brandScopeWhere(context.profile, scope),
      ...demoWhere(demo, canSeeDemo),
      brandName: q ? { contains: q, mode: "insensitive" } : undefined,
      reviewStatus: status && status !== "ALL" ? (status as never) : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      campaigns: { select: { totalBudget: true } },
      responsibleAdmin: true,
    },
  });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="品牌管理" />
      <form className="flex flex-wrap gap-3">
        <input className="rounded-full border border-stone-200 px-4 py-3" name="q" placeholder="Search brand" defaultValue={q} />
        <select className="rounded-full border border-stone-200 px-4 py-3" name="status" defaultValue={status ?? "ALL"}>
          <option value="ALL">全部状态</option>
          <option value="PENDING">待处理</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已拒绝</option>
          <option value="FROZEN">冻结</option>
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
        headers={["Brand", "Company", "Country", "负责运营", "Status", "演示数据", "Risk", "Spend", "Created"]}
        rows={brands.map((brand) => [
          <Link className="font-semibold text-stone-950" href={`/admin/brands/${brand.id}`} key={brand.id}>{brand.brandName}</Link>,
          brand.companyName,
          brand.country,
          brand.responsibleAdmin?.displayName ?? "-",
          <StatusBadge key="s" tone={reviewTone(brand.reviewStatus)}>{brand.reviewStatus}</StatusBadge>,
          brand.isDemo ? "是" : "否",
          brand.riskLevel,
          money(brand.campaigns.reduce((sum, campaign) => sum + Number(campaign.totalBudget), 0)),
          shortDate(brand.createdAt),
        ])}
      />
    </div>
  );
}
