import Link from "next/link";
import { CampaignStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DataTable, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function BrandCampaignsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireRole(UserRole.BRAND);
  const { status } = await searchParams;
  const selectedStatus = Object.values(CampaignStatus).includes(status as CampaignStatus) ? (status as CampaignStatus) : undefined;
  const campaigns = await prisma.campaign.findMany({
    where: { brand: { userId: session.userId }, ...(selectedStatus ? { status: selectedStatus } : {}) },
    include: { tasks: true, submissions: true, proofs: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="推广活动"><LinkButton href="/brand/campaigns/new" variant="secondary">新建推广</LinkButton></PageHeader>
      <form className="flex flex-wrap gap-3">
        <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="status" defaultValue={selectedStatus ?? ""}>
          <option value="">全部状态</option>
          {Object.values(CampaignStatus).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white">筛选</button>
        {selectedStatus ? <Link className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-700" href="/brand/campaigns">清空</Link> : null}
      </form>
      <DataTable
        headers={["Campaign", "Status", "Budget", "Tasks", "Submissions", "Proofs", "End"]}
        rows={campaigns.map((campaign) => [
          <Link className="font-semibold text-stone-950" href={`/brand/campaigns/${campaign.id}`} key={campaign.id}>{campaign.title}</Link>,
          <StatusBadge key="s">{campaign.status}</StatusBadge>,
          money(campaign.totalBudget),
          campaign.tasks.length,
          <Link className="font-semibold text-stone-950" href={`/brand/campaigns/${campaign.id}/submissions`} key="sub">{campaign.submissions.length}</Link>,
          campaign.proofs.length,
          shortDate(campaign.endDate),
        ])}
      />
    </div>
  );
}
