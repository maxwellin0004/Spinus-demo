import Link from "next/link";
import { generateDemoDataAction } from "@/lib/actions";
import { requireAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Card, DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";
import { money, number, shortDate } from "@/lib/format";

export default async function AdminDemoPage() {
  await requireAdminPermission("demo.manage");
  const [brands, creators, campaigns, demoEarnings] = await Promise.all([
    prisma.brandProfile.findMany({ where: { isDemo: true }, include: { responsibleAdmin: true }, orderBy: { createdAt: "desc" } }),
    prisma.creatorProfile.findMany({ where: { isDemo: true }, include: { responsibleAdmin: true }, orderBy: { createdAt: "desc" } }),
    prisma.campaign.findMany({ where: { isDemo: true }, include: { brand: true, proofs: true }, orderBy: { createdAt: "desc" } }),
    prisma.walletTransaction.aggregate({ where: { isDemo: true, type: "EARNING" }, _sum: { amount: true } }),
  ]);
  const demoViews = campaigns.reduce((sum, campaign) => sum + campaign.proofs.reduce((proofSum, proof) => proofSum + proof.views, 0), 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创始人" title="演示数据模式" />
      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-xl font-semibold">生成内部演示数据</h2>
            <p className="mt-2 text-sm text-stone-600">
              演示数据会写入品牌、创作者、Campaign、Proof 和钱包流水，但带有内部 isDemo 标记。真实 Dashboard、真实财务统计和创作者任务大厅默认排除这些数据。
            </p>
          </div>
          <form action={generateDemoDataAction}>
            <SubmitButton pendingLabel="正在生成..." variant="secondary">生成一组演示数据</SubmitButton>
          </form>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="演示品牌" value={brands.length} />
        <MetricCard label="演示创作者" value={creators.length} />
        <MetricCard label="演示推广" value={campaigns.length} />
        <MetricCard label="演示收益" value={money(demoEarnings._sum.amount)} sub={`${number(demoViews)} 播放，仅供展示`} />
      </div>
      <section>
        <h2 className="mb-3 text-xl font-semibold">演示推广活动</h2>
        <DataTable
          headers={["推广活动", "品牌", "状态", "播放", "报告", "创建时间"]}
          rows={campaigns.map((campaign) => [
            campaign.title,
            campaign.brand.brandName,
            <StatusBadge key="s">{campaign.status}</StatusBadge>,
            number(campaign.proofs.reduce((sum, proof) => sum + proof.views, 0)),
            <Link className="font-semibold text-stone-950" href={`/admin/reports/${campaign.id}?demo=include`} key={campaign.id}>查看</Link>,
            shortDate(campaign.createdAt),
          ])}
        />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">演示账号</h2>
        <DataTable
          headers={["类型", "名称", "负责运营", "创建时间"]}
          rows={[
            ...brands.map((brand) => ["品牌", brand.brandName, brand.responsibleAdmin?.displayName ?? "-", shortDate(brand.createdAt)]),
            ...creators.map((creator) => ["创作者", creator.displayName, creator.responsibleAdmin?.displayName ?? "-", shortDate(creator.createdAt)]),
          ]}
        />
      </section>
    </div>
  );
}
