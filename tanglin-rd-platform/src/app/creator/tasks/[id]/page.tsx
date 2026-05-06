import { applyTaskAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { UserRole } from "@prisma/client";

export default async function CreatorTaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await requireRole(UserRole.CREATOR);
  const task = await prisma.campaignTask.findUnique({ where: { id }, include: { campaign: { include: { assets: true, brand: true } } } });
  if (!task) return <PageHeader title="未找到任务" />;
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId }, include: { socialAccounts: true } });
  const existing = creator ? await prisma.taskApplication.findUnique({ where: { taskId_creatorId: { taskId: task.id, creatorId: creator.id } } }) : null;
  const hasSocial = Boolean(creator?.socialAccounts.length);
  const verifiedSocial = Boolean(creator?.socialAccounts.some((account) => account.verificationStatus === "VERIFIED"));
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="任务简报" title={task.title}><StatusBadge>{task.platform}</StatusBadge></PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-xl font-semibold">{task.campaign.title}</h2>
          <p className="mt-3 whitespace-pre-wrap text-stone-600">{task.campaign.brief}</p>
          <div className="mt-5 grid gap-3 text-sm">
            <p><strong>必须包含：</strong> {task.campaign.mustInclude.join(", ")}</p>
            <p><strong>禁止事项：</strong> {task.campaign.mustNotInclude.join(", ")}</p>
            <p><strong>话题标签：</strong> {task.campaign.hashtags.join(" ")}</p>
            <p><strong>行动号召：</strong> {task.campaign.cta}</p>
            <p><strong>披露要求：</strong> {task.campaign.disclosureRequired ? "必须包含商业合作披露。" : "品牌未要求。"}</p>
          </div>
        </Card>
        <Card>
          <dl className="grid gap-3 text-sm">
            <div><dt className="font-semibold">奖励</dt><dd>{money(task.rewardAmount)}</dd></div>
            <div><dt className="font-semibold">名额</dt><dd>{task.slotsTaken}/{task.slotsTotal}</dd></div>
            <div><dt className="font-semibold">要求等级</dt><dd>{task.creatorLevelRequired}</dd></div>
            <div><dt className="font-semibold">截止时间</dt><dd>{shortDate(task.deadline)}</dd></div>
            <div><dt className="font-semibold">资料状态</dt><dd>{creator?.reviewStatus ?? "-"}</dd></div>
            <div><dt className="font-semibold">社媒账号</dt><dd>{hasSocial ? `${creator!.socialAccounts.length} 个，${verifiedSocial ? "已有验证" : "待验证"}` : "未添加"}</dd></div>
          </dl>
          {existing ? (
            <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-sm font-semibold text-stone-700">
              已申请，当前状态：{existing.status}
            </div>
          ) : (
            <form action={applyTaskAction.bind(null, task.id)} className="mt-5 grid gap-3">
              <Textarea label="申请说明，可选" name="applicationNote" rows={3} placeholder="告诉品牌/平台你计划怎样完成这条内容。" />
              <Button variant="secondary">确认规则并提交申请</Button>
              <p className="text-xs text-stone-500">申请不会自动通过，需要品牌或平台审核后才能进入内容工作台。</p>
            </form>
          )}
        </Card>
      </div>
      <Card>
        <h2 className="text-xl font-semibold">素材</h2>
        <div className="mt-3 grid gap-2 text-sm">
          {task.campaign.assets.map((asset) => (
            <a className="font-semibold text-stone-950" href={asset.url} key={asset.id} download>{asset.name}</a>
          ))}
        </div>
      </Card>
    </div>
  );
}
