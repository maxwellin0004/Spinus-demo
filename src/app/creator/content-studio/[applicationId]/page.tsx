import Link from "next/link";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { saveDraftAction, submitContentAction } from "@/lib/actions";
import { generateCreatorContent } from "@/lib/ai";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, StatusBadge, Textarea } from "@/components/ui";

const modes = ["专业解释型", "真人体验型", "吐槽反差型", "教程教学型", "案例复盘型", "挑战任务型", "快速种草型"];

export default async function ContentStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ mode?: string; error?: string; saved?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { applicationId } = await params;
  const { mode, error, saved } = await searchParams;
  const application = await prisma.taskApplication.findFirst({
    where: { id: applicationId, creator: { userId: session.userId } },
    include: {
      creator: true,
      task: { include: { campaign: true } },
      drafts: { orderBy: { createdAt: "desc" }, take: 1 },
      submissions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!application) return <EmptyState title="未找到申请记录" />;
  if (application.status !== ApplicationStatus.APPROVED) return <EmptyState title="任务尚未通过" body="只有已通过的任务申请可以进入内容工作台。" />;

  const generated = mode
    ? await generateCreatorContent({
        campaign: {
          title: application.task.campaign.title,
          brief: application.task.campaign.brief,
          mustInclude: application.task.campaign.mustInclude,
          mustNotInclude: application.task.campaign.mustNotInclude,
          hashtags: application.task.campaign.hashtags,
          cta: application.task.campaign.cta,
        },
        platform: application.task.platform,
        mode,
      })
    : null;
  const latestDraft = application.drafts[0];

  const title = generated?.title ?? latestDraft?.title ?? "";
  const script = generated?.script ?? latestDraft?.script ?? "";
  const caption = generated?.caption ?? latestDraft?.caption ?? "";
  const coverText = generated?.coverText ?? latestDraft?.coverText ?? "";
  const hashtags = (generated?.hashtags ?? latestDraft?.hashtags ?? application.task.campaign.hashtags).join(", ");

  const save = saveDraftAction.bind(null, application.id);
  const submit = submitContentAction.bind(null, application.id);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者" title="AI 内容工作台">
        <StatusBadge>{application.task.platform}</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {saved ? <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">草稿已保存。</div> : null}
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-semibold">{application.task.campaign.title}</h2>
          <p className="mt-3 whitespace-pre-wrap text-stone-600">{application.task.campaign.brief}</p>
          <div className="mt-5 grid gap-2 text-sm text-stone-700">
            <p><strong>必须包含：</strong> {application.task.campaign.mustInclude.join(", ")}</p>
            <p><strong>禁止事项：</strong> {application.task.campaign.mustNotInclude.join(", ")}</p>
            <p><strong>行动号召：</strong> {application.task.campaign.cta}</p>
            <p><strong>披露要求：</strong> {application.task.campaign.disclosureRequired ? "需要披露" : "不要求披露"}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {modes.map((item) => (
              <Link
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-amber-100"
                href={`/creator/content-studio/${application.id}?mode=${encodeURIComponent(item)}`}
                key={item}
              >
                生成：{item}
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <form className="grid gap-4">
            <input name="provider" type="hidden" value={generated?.provider ?? "manual"} />
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              标题
              <input className="rounded-2xl border border-stone-200 px-4 py-3" name="title" required defaultValue={title} />
            </label>
            <Textarea label="Script" name="script" required defaultValue={script} rows={8} />
            <Textarea label="Caption" name="caption" required defaultValue={caption} rows={4} />
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              话题标签（逗号分隔）
              <input className="rounded-2xl border border-stone-200 px-4 py-3" name="hashtags" defaultValue={hashtags} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              封面文案
              <input className="rounded-2xl border border-stone-200 px-4 py-3" name="coverText" required defaultValue={coverText} />
            </label>
            <div className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
              提交时会在服务端执行敏感词检查。命中的词会明确提示，并写入审计日志。
            </div>
            <div className="flex flex-wrap gap-3">
              <button formAction={save} className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700">
                保存草稿
              </button>
              <button formAction={submit} className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950">
                提交审核
              </button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
