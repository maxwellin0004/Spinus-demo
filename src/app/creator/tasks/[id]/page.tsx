import { applyTaskAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";
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
  const existingInCampaign = creator
    ? await prisma.taskApplication.findFirst({
        where: {
          creatorId: creator.id,
          task: { campaignId: task.campaignId },
          status: { in: ["APPLIED", "APPROVED"] },
        },
        include: { task: true },
      })
    : null;

  const socialAccounts = creator?.socialAccounts ?? [];
  const verifiedAccounts = socialAccounts.filter((account) => account.verificationStatus === "VERIFIED");
  const matchingVerifiedAccounts = verifiedAccounts.filter((account) => account.platform === task.platform);
  const selectableAccounts = matchingVerifiedAccounts.length ? matchingVerifiedAccounts : verifiedAccounts;
  const hasSocial = socialAccounts.length > 0;
  const hasVerifiedSocial = verifiedAccounts.length > 0;
  const remainingSlots = task.slotsTotal - task.slotsTaken;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="任务简报" title={task.title}>
        <StatusBadge>{task.platform}</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{decodeURIComponent(error)}</div> : null}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-xl font-semibold">{task.campaign.title}</h2>
          <p className="mt-3 whitespace-pre-wrap text-stone-600">{task.campaign.brief}</p>
          <div className="mt-5 grid gap-3 text-sm">
            <p>
              <strong>品牌：</strong> {task.campaign.brand.brandName}
            </p>
            <p>
              <strong>必须包含：</strong> {task.campaign.mustInclude.join(", ")}
            </p>
            <p>
              <strong>禁止事项：</strong> {task.campaign.mustNotInclude.join(", ")}
            </p>
            <p>
              <strong>话题标签：</strong> {task.campaign.hashtags.join(" ")}
            </p>
            <p>
              <strong>行动号召：</strong> {task.campaign.cta}
            </p>
            <p>
              <strong>广告披露：</strong> 必须包含商业合作/广告披露。
            </p>
            {task.platformRequirement ? (
              <p>
                <strong>平台补充要求：</strong> {task.platformRequirement}
              </p>
            ) : null}
          </div>
        </Card>
        <Card>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="font-semibold">固定奖励</dt>
              <dd>{money(task.rewardAmount, "CNY")}</dd>
            </div>
            <div>
              <dt className="font-semibold">名额</dt>
              <dd>
                {task.slotsTaken}/{task.slotsTotal}，剩余 {remainingSlots}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">最低粉丝数</dt>
              <dd>{task.minimumFollowers.toLocaleString("zh-CN")}</dd>
            </div>
            <div>
              <dt className="font-semibold">交稿截止</dt>
              <dd>{shortDate(task.draftDeadline)}</dd>
            </div>
            <div>
              <dt className="font-semibold">发布截止</dt>
              <dd>{shortDate(task.publishDeadline ?? task.deadline)}</dd>
            </div>
            <div>
              <dt className="font-semibold">资料状态</dt>
              <dd>{creator?.reviewStatus ?? "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold">社媒账号</dt>
              <dd>{hasSocial ? `${socialAccounts.length} 个，${hasVerifiedSocial ? `${verifiedAccounts.length} 个已验证` : "暂无已验证账号"}` : "未添加"}</dd>
            </div>
          </dl>

          {existing ? (
            <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-sm font-semibold text-stone-700">已申请，当前状态：{existing.status}</div>
          ) : existingInCampaign ? (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              你已申请该 Campaign 下的任务：{existingInCampaign.task.title}。V1 默认同一 Campaign 一个 KOL 只能接 1 个任务。
            </div>
          ) : !hasSocial ? (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">请先到个人资料页添加社媒账号。</div>
          ) : !hasVerifiedSocial ? (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">默认只有已验证社媒账号可以申请任务，请等待平台审核。</div>
          ) : remainingSlots <= 0 ? (
            <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-sm font-semibold text-stone-700">任务名额已满。</div>
          ) : (
            <form action={applyTaskAction.bind(null, task.id)} className="mt-5 grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-stone-700">
                选择发布账号
                <select className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950" name="selectedSocialAccountId" required>
                  {selectableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.platform} · {account.accountName} · 粉丝 {account.followers.toLocaleString("zh-CN")}
                    </option>
                  ))}
                </select>
              </label>
              <Textarea label="申请说明" name="applicationNote" rows={3} placeholder="说明你为什么适合这个任务，以及计划如何完成。" required />
              <SubmitButton pendingLabel="正在提交..." variant="secondary">确认规则并提交申请</SubmitButton>
              <p className="text-xs text-stone-500">申请不会自动通过，需要商家审核后才能进入创作或发布流程。</p>
            </form>
          )}
        </Card>
      </div>
      <Card>
        <h2 className="text-xl font-semibold">素材</h2>
        <div className="mt-3 grid gap-2 text-sm">
          {task.campaign.assets.length ? (
            task.campaign.assets.map((asset) => (
              <a className="font-semibold text-stone-950" href={asset.url} key={asset.id} download>
                {asset.name}
              </a>
            ))
          ) : (
            <p className="text-stone-500">暂无素材。</p>
          )}
        </div>
      </Card>
    </div>
  );
}
