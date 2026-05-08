import { CampaignStatus, TaskStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { V1_CATEGORIES, V1_COUNTRIES, V1_PLATFORMS } from "@/lib/v1Options";
import { Card, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function CreatorMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; country?: string; minReward?: string; industry?: string }>;
}) {
  await requireRole(UserRole.CREATOR);
  const { platform, country, minReward, industry } = await searchParams;
  const tasks = (
    await prisma.campaignTask.findMany({
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
    })
  ).filter((task) => task.slotsTaken < task.slotsTotal);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者" title="任务大厅" />
      <form className="flex flex-wrap gap-3">
        <select className="rounded-full border border-stone-200 px-4 py-3" name="platform" defaultValue={platform ?? ""}>
          <option value="">全部平台</option>
          {V1_PLATFORMS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="country" defaultValue={country ?? ""}>
          <option value="">全部地区</option>
          {V1_COUNTRIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="industry" defaultValue={industry ?? ""}>
          <option value="">全部分类</option>
          {V1_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input className="rounded-full border border-stone-200 px-4 py-3" name="minReward" type="number" placeholder="最低奖励" defaultValue={minReward} />
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => {
          const remainingSlots = task.slotsTotal - task.slotsTaken;
          return (
            <Card key={task.id} className="grid gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-stone-950">{task.campaign.title}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {task.campaign.brand.brandName} · {task.platform} · {task.contentType}
                  </p>
                </div>
                <StatusBadge>{task.platform}</StatusBadge>
              </div>
              <p className="text-sm text-stone-600">{task.campaign.brief.slice(0, 160)}...</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold">固定奖励</p>
                  <p>{money(task.rewardAmount, "CNY")}</p>
                </div>
                <div>
                  <p className="font-semibold">剩余名额</p>
                  <p>{remainingSlots}</p>
                </div>
                <div>
                  <p className="font-semibold">最低粉丝</p>
                  <p>{task.minimumFollowers.toLocaleString("zh-CN")}</p>
                </div>
                <div>
                  <p className="font-semibold">发布截止</p>
                  <p>{shortDate(task.publishDeadline ?? task.deadline)}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                默认需要使用已验证社媒账号申请。商家通过后才进入创作或发布流程。
              </div>
              <LinkButton href={`/creator/tasks/${task.id}`} variant="secondary">
                查看任务
              </LinkButton>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
