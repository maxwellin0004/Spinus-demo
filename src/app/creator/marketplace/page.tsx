import { CampaignStatus, TaskStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function CreatorMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; country?: string; minReward?: string; industry?: string }>;
}) {
  await requireRole(UserRole.CREATOR);
  const { platform, country, minReward, industry } = await searchParams;
  const tasks = await prisma.campaignTask.findMany({
    where: {
      status: TaskStatus.ACTIVE,
      rewardAmount: minReward ? { gte: Number(minReward) } : undefined,
      platform: platform || undefined,
      campaign: {
        status: CampaignStatus.ACTIVE,
        isDemo: false,
        industry: industry || undefined,
        targetCountries: country ? { has: country } : undefined,
      },
    },
    include: { campaign: { include: { brand: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者" title="任务大厅" />
      <form className="flex flex-wrap gap-3">
        <input className="rounded-full border border-stone-200 px-4 py-3" name="platform" placeholder="Platform" defaultValue={platform} />
        <input className="rounded-full border border-stone-200 px-4 py-3" name="country" placeholder="Country" defaultValue={country} />
        <input className="rounded-full border border-stone-200 px-4 py-3" name="industry" placeholder="Industry" defaultValue={industry} />
        <input className="rounded-full border border-stone-200 px-4 py-3" name="minReward" type="number" placeholder="Min reward" defaultValue={minReward} />
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task.id} className="grid gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-stone-950">{task.campaign.title}</h2>
                <p className="mt-1 text-sm text-stone-500">{task.campaign.brand.brandName} · {task.platform}</p>
              </div>
              <StatusBadge>{task.creatorLevelRequired}</StatusBadge>
            </div>
            <p className="text-sm text-stone-600">{task.campaign.brief.slice(0, 160)}...</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="font-semibold">奖励</p><p>{money(task.rewardAmount)}</p></div>
              <div><p className="font-semibold">名额</p><p>剩余 {task.slotsTotal - task.slotsTaken}</p></div>
              <div><p className="font-semibold">国家/地区</p><p>{task.campaign.targetCountries.join(", ")}</p></div>
              <div><p className="font-semibold">截止时间</p><p>{shortDate(task.deadline)}</p></div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              申请后需品牌或平台审核，通过后才进入内容工作台。
            </div>
            <LinkButton href={`/creator/tasks/${task.id}`} variant="secondary">查看任务</LinkButton>
          </Card>
        ))}
      </div>
    </div>
  );
}
