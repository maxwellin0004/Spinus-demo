import Link from "next/link";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DataTable, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function BrandCampaignsPage() {
  const session = await requireRole(UserRole.BRAND);
  const campaigns = await prisma.campaign.findMany({
    where: { brand: { userId: session.userId } },
    include: { tasks: true, submissions: true, proofs: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="推广活动"><LinkButton href="/brand/campaigns/new" variant="secondary">新建推广</LinkButton></PageHeader>
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
