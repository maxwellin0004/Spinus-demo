import { verifyProofAction } from "@/lib/actions";
import { brandScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, PageHeader, PostMetricsPanel, StatusBadge, Textarea } from "@/components/ui";
import { number, shortDate } from "@/lib/format";

export default async function AdminProofsPage({ searchParams }: { searchParams: Promise<{ scope?: string; demo?: string }> }) {
  const context = await getAdminContext();
  const { scope, demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const proofs = await prisma.proof.findMany({
    where: { campaign: { ...demoWhere(demo, canSeeDemo), brand: brandScopeWhere(context.profile, scope) } },
    include: {
      campaign: true,
      creator: true,
      submission: true,
      postMetricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 },
      crawlerJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin" title="Proof verification" />
      <form className="flex flex-wrap gap-3">
        <select className="rounded-full border border-stone-200 px-4 py-3" name="scope" defaultValue={scope}>
          {scopeOptions(context.profile).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="demo" defaultValue={demo ?? "real"}>
          <option value="real">Real data only</option>
          {canSeeDemo ? <option value="include">Include demo data</option> : null}
          {canSeeDemo ? <option value="only">Demo data only</option> : null}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">Filter</button>
      </form>

      <DataTable
        headers={["Creator", "Campaign", "URL", "Metrics", "Status", "Submitted"]}
        rows={proofs.map((proof) => {
          const latestSuccess = proof.postMetricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
          return [
            proof.creator.displayName,
            proof.campaign.title,
            <a className="font-semibold text-stone-950" href={proof.postUrl} target="_blank" rel="noreferrer" key={proof.id}>Open post</a>,
            latestSuccess
              ? `Views ${number(latestSuccess.viewCount)} / Likes ${number(latestSuccess.likeCount)} / Saves ${number(latestSuccess.favoriteCount)} / Comments ${number(latestSuccess.commentCount)} / Shares ${number(latestSuccess.shareCount)}`
              : `${number(proof.views)} views / ${number(proof.clicks)} clicks / ${number(proof.conversions)} conv.`,
            <StatusBadge key="s">{proof.verificationStatus}</StatusBadge>,
            shortDate(proof.createdAt),
          ];
        })}
      />

      {proofs.map((proof) => {
        const action = verifyProofAction.bind(null, proof.id);
        const latestSuccess = proof.postMetricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
        const latestAttempt = proof.postMetricSnapshots[0];
        return (
          <Card key={proof.id}>
            <div className="mb-4 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-stone-950">{proof.creator.displayName}</p>
                  <a className="text-sm font-semibold text-stone-950" href={proof.postUrl} target="_blank" rel="noreferrer">Open post</a>
                </div>
                <StatusBadge>{proof.crawlerJobs[0]?.status ?? latestAttempt?.status ?? "NO_JOB"}</StatusBadge>
              </div>
              <PostMetricsPanel snapshot={latestSuccess} latestAttempt={latestAttempt} compact />
            </div>
            <form action={action} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Textarea label={`Admin note for ${proof.creator.displayName}`} name="adminNote" defaultValue={proof.adminNote ?? ""} rows={2} />
              <div className="flex gap-2">
                <Button name="action" value="verify" variant="secondary">Verify</Button>
                <Button name="action" value="reject" variant="danger">Reject</Button>
              </div>
            </form>
          </Card>
        );
      })}
    </div>
  );
}
