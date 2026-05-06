import { verifyProofAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { number, shortDate } from "@/lib/format";
import { brandScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";

export default async function AdminProofsPage({ searchParams }: { searchParams: Promise<{ scope?: string; demo?: string }> }) {
  const context = await getAdminContext();
  const { scope, demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const proofs = await prisma.proof.findMany({
    where: { campaign: { ...demoWhere(demo, canSeeDemo), brand: brandScopeWhere(context.profile, scope) } },
    include: { campaign: true, creator: true, submission: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="发布证明审核" />
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
        headers={["Creator", "Campaign", "URL", "Metrics", "Status", "Submitted"]}
        rows={proofs.map((proof) => [
          proof.creator.displayName,
          proof.campaign.title,
          <a className="font-semibold text-stone-950" href={proof.postUrl} target="_blank" rel="noreferrer" key={proof.id}>打开链接</a>,
          `${number(proof.views)} views / ${number(proof.clicks)} clicks / ${number(proof.conversions)} conv.`,
          <StatusBadge key="s">{proof.verificationStatus}</StatusBadge>,
          shortDate(proof.createdAt),
        ])}
      />
      {proofs.map((proof) => {
        const action = verifyProofAction.bind(null, proof.id);
        return (
          <Card key={proof.id}>
            <form action={action} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Textarea label={`Admin note for ${proof.creator.displayName}`} name="adminNote" defaultValue={proof.adminNote ?? ""} rows={2} />
              <div className="flex gap-2">
                <Button name="action" value="verify" variant="secondary">验证通过</Button>
                <Button name="action" value="reject" variant="danger">拒绝</Button>
              </div>
            </form>
          </Card>
        );
      })}
    </div>
  );
}
