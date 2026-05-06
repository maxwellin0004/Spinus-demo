import Link from "next/link";
import { DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { money, shortDate } from "@/lib/format";
import { brandScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; scope?: string; demo?: string }>;
}) {
  const context = await getAdminContext();
  const { status, q, scope, demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const campaigns = await prisma.campaign.findMany({
    where: {
      ...demoWhere(demo, canSeeDemo),
      status: status && status !== "ALL" ? (status as never) : undefined,
      title: q ? { contains: q, mode: "insensitive" } : undefined,
      brand: brandScopeWhere(context.profile, scope),
    },
    include: { brand: { include: { responsibleAdmin: true } }, tasks: true, submissions: true, proofs: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="推广活动管理" />
      <form className="flex flex-wrap gap-3">
        <input className="rounded-full border border-stone-200 px-4 py-3" name="q" placeholder="Search campaign" defaultValue={q} />
        <select className="rounded-full border border-stone-200 px-4 py-3" name="status" defaultValue={status ?? "ALL"}>
          <option value="ALL">全部状态</option>
          <option value="PENDING_REVIEW">待审核</option>
          <option value="ACTIVE">活跃</option>
          <option value="PAUSED">已暂停</option>
          <option value="COMPLETED">已完成</option>
          <option value="REJECTED">已拒绝</option>
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
        headers={["Campaign", "Brand", "负责运营", "Status", "演示数据", "Budget", "Tasks", "Submissions", "Proofs", "End"]}
        rows={campaigns.map((campaign) => [
          <Link className="font-semibold text-stone-950" href={`/admin/campaigns/${campaign.id}`} key={campaign.id}>{campaign.title}</Link>,
          campaign.brand.brandName,
          campaign.brand.responsibleAdmin?.displayName ?? "-",
          <StatusBadge key="s">{campaign.status}</StatusBadge>,
          campaign.isDemo ? "是" : "否",
          money(campaign.totalBudget),
          campaign.tasks.length,
          campaign.submissions.length,
          campaign.proofs.length,
          shortDate(campaign.endDate),
        ])}
      />
    </div>
  );
}
