import { ReviewDecision, SubmissionStatus } from "@prisma/client";
import { reviewSubmissionAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";
import { shortDate } from "@/lib/format";
import { brandScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";

function submissionTone(status: SubmissionStatus) {
  if (status === SubmissionStatus.APPROVED || status === SubmissionStatus.VERIFIED || status === SubmissionStatus.SETTLED) return "success" as const;
  if (status === SubmissionStatus.REJECTED) return "danger" as const;
  if (status === SubmissionStatus.PROOF_SUBMITTED || status === SubmissionStatus.PUBLISHED || status === SubmissionStatus.SUBMITTED) return "info" as const;
  return "warning" as const;
}

function reviewTone(decision: ReviewDecision) {
  if (decision === ReviewDecision.APPROVED) return "success" as const;
  if (decision === ReviewDecision.REJECTED) return "danger" as const;
  return "warning" as const;
}

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
      <DataTable
        headers={["草稿", "状态", "Campaign / Brand", "KOL", "内容摘要", "审核记录", "操作"]}
        emptyTitle="暂无内容提交"
        emptyBody="KOL 提交草稿后，会在这里按行展示，便于批量扫读和处理。"
        rows={submissions.map((submission) => {
          const action = reviewSubmissionAction.bind(null, submission.id);
          return [
            <div className="grid min-w-[13rem] gap-1" key={`draft-${submission.id}`}>
              <span className="font-black text-stone-950">{submission.draft.title}</span>
              <span className="text-xs text-stone-500">{shortDate(submission.createdAt)}</span>
            </div>,
            <StatusBadge key={`status-${submission.id}`} tone={submissionTone(submission.status)}>{submission.status}</StatusBadge>,
            <div className="grid min-w-[12rem] gap-1" key={`campaign-${submission.id}`}>
              <span className="font-semibold text-stone-950">{submission.campaign.title}</span>
              <span className="text-xs text-stone-500">{submission.campaign.brand.brandName}</span>
            </div>,
            <span className="inline-block min-w-[8rem] font-semibold text-stone-900" key={`creator-${submission.id}`}>{submission.creator.displayName}</span>,
            <details className="min-w-[22rem] text-sm" key={`content-${submission.id}`}>
              <summary className="cursor-pointer font-black text-stone-950">查看脚本与文案</summary>
              <div className="mt-3 grid gap-3 text-stone-700">
                <div>
                  <p className="font-semibold text-stone-950">脚本</p>
                  <p className="mt-1 whitespace-pre-wrap">{submission.draft.script}</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-950">文案/话题标签</p>
                  <p className="mt-1">{submission.draft.caption}</p>
                  <p className="mt-1">{submission.draft.hashtags.join(" ")}</p>
                </div>
              </div>
            </details>,
            submission.reviews.length ? (
              <details className="min-w-[16rem] text-sm" key={`reviews-${submission.id}`}>
                <summary className="cursor-pointer font-black text-stone-950">{submission.reviews.length} 条记录</summary>
                <div className="mt-2 grid gap-2">
                  {submission.reviews.slice(0, 3).map((review) => (
                    <div className="rounded-xl bg-stone-50 p-3" key={review.id}>
                      <StatusBadge tone={reviewTone(review.decision)}>{review.decision}</StatusBadge>
                      <p className="mt-2 whitespace-pre-wrap">{review.comment}</p>
                      <p className="mt-2 text-xs text-stone-500">{shortDate(review.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : (
              "暂无记录"
            ),
            <details className="min-w-[20rem]" key={`action-${submission.id}`}>
              <summary className="cursor-pointer font-black text-stone-950">处理审核</summary>
              <form action={action} className="mt-3 grid gap-3">
                <textarea
                  className="min-h-24 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                  name="comment"
                  required
                  defaultValue={submission.reviews[0]?.comment ?? ""}
                  placeholder="审核意见"
                />
                <input className="rounded-2xl border border-stone-200 px-4 py-3" name="riskPoints" placeholder="Risk points, comma-separated" />
                <div className="flex flex-wrap gap-2">
                  <SubmitButton name="decision" pendingLabel="正在通过..." value={ReviewDecision.APPROVED} variant="secondary">通过</SubmitButton>
                  <SubmitButton name="decision" pendingLabel="正在提交..." value={ReviewDecision.REVISION_REQUESTED} variant="ghost">要求修改</SubmitButton>
                  <SubmitButton name="decision" pendingLabel="正在拒绝..." value={ReviewDecision.REJECTED} variant="danger">拒绝</SubmitButton>
                </div>
              </form>
            </details>,
          ];
        })}
      />
    </div>
  );
}
