import { ReviewDecision } from "@prisma/client";
import { reviewSubmissionAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { Button, Card, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { brandScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";

export default async function AdminSubmissionsPage({ searchParams }: { searchParams: Promise<{ scope?: string; demo?: string }> }) {
  const context = await getAdminContext();
  const { scope, demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const submissions = await prisma.submission.findMany({
    where: { campaign: { ...demoWhere(demo, canSeeDemo), brand: brandScopeWhere(context.profile, scope) } },
    include: { campaign: { include: { brand: true } }, creator: true, draft: true, reviews: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="内容审核中心" />
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
      {submissions.map((submission) => {
        const action = reviewSubmissionAction.bind(null, submission.id);
        return (
          <Card key={submission.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-stone-950">{submission.draft.title}</h2>
                <p className="mt-1 text-sm text-stone-500">{submission.campaign.title} · {submission.creator.displayName} · {shortDate(submission.createdAt)}</p>
              </div>
              <StatusBadge>{submission.status}</StatusBadge>
            </div>
            <div className="mt-5 grid gap-4 text-sm text-stone-700 lg:grid-cols-2">
              <div><p className="font-semibold text-stone-950">脚本</p><p className="mt-2 whitespace-pre-wrap">{submission.draft.script}</p></div>
              <div><p className="font-semibold text-stone-950">文案/话题标签</p><p className="mt-2">{submission.draft.caption}</p><p className="mt-2">{submission.draft.hashtags.join(" ")}</p></div>
            </div>
            <form action={action} className="mt-5 grid gap-3">
              <Textarea label="审核意见" name="comment" required defaultValue={submission.reviews[0]?.comment ?? ""} />
              <input className="rounded-2xl border border-stone-200 px-4 py-3" name="riskPoints" placeholder="Risk points, comma-separated" />
              <div className="flex flex-wrap gap-2">
                <Button name="decision" value={ReviewDecision.APPROVED} variant="secondary">通过</Button>
                <Button name="decision" value={ReviewDecision.REVISION_REQUESTED} variant="ghost">要求修改</Button>
                <Button name="decision" value={ReviewDecision.REJECTED} variant="danger">拒绝</Button>
              </div>
            </form>
          </Card>
        );
      })}
    </div>
  );
}
