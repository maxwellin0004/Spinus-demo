import { CampaignStatus, TaskStatus, UserRole } from "@prisma/client";
import { CreatorMarketplaceExperience, type MarketplaceTask } from "@/components/creator-marketplace-experience";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { V1_CATEGORIES, V1_COUNTRIES, V1_PLATFORMS } from "@/lib/v1Options";

type MarketplaceSearchParams = {
  platform?: string;
  country?: string;
  minReward?: string;
  industry?: string;
  q?: string;
  tab?: string;
};

function currentTimeMs() {
  return Date.now();
}

function daysUntil(value: Date | null, nowMs: number) {
  if (!value) return null;
  const ms = value.getTime() - nowMs;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function scoreTask(task: {
  platform: string;
  contentType: string;
  minimumFollowers: number;
  campaign: { industry: string };
}, creator?: { categories: string[]; contentTypes: string[]; socialAccounts: { platform: string; followers: number; verified: boolean }[] } | null) {
  let score = 58;
  if (creator?.categories.includes(task.campaign.industry)) score += 16;
  if (creator?.contentTypes.includes(task.contentType)) score += 10;
  const account = creator?.socialAccounts.find((item) => item.platform === task.platform);
  if (account) score += account.verified ? 10 : 5;
  if (account && account.followers >= task.minimumFollowers) score += 8;
  if (task.minimumFollowers <= 10_000) score += 4;
  return Math.min(98, score);
}

function taskMatchesQuery(task: MarketplaceTask, query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;
  return [task.title, task.brandName, task.platform, task.contentType, task.industry, ...task.tags]
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

export default async function CreatorMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<MarketplaceSearchParams>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { platform, country, minReward, industry, q = "", tab = "all" } = await searchParams;
  const nowMs = currentTimeMs();

  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: { socialAccounts: true, wallet: true },
  });

  const rawTasks = (
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
      take: 128,
    })
  ).filter((task) => task.slotsTaken < task.slotsTotal);

  const taskDtos = rawTasks.map<MarketplaceTask>((task) => {
    const deadline = task.publishDeadline ?? task.deadline;
    const remainingSlots = task.slotsTotal - task.slotsTaken;
    const matchScore = scoreTask(task, creator);
    return {
      id: task.id,
      title: task.title || task.campaign.title,
      campaignTitle: task.campaign.title,
      brandName: task.campaign.brand.brandName,
      platform: task.platform,
      contentType: task.contentType,
      industry: task.campaign.industry,
      brief: task.campaign.brief,
      rewardAmount: Number(task.rewardAmount),
      remainingSlots,
      totalSlots: task.slotsTotal,
      minimumFollowers: task.minimumFollowers,
      deadline: deadline.toISOString(),
      daysLeft: daysUntil(deadline, nowMs),
      matchScore,
      tags: [
        task.contentType,
        task.campaign.requiresDraftReview ? "需审核" : "免初审",
        task.campaign.allowUnverifiedSocialAccounts ? "低门槛" : "已认证账号",
        task.campaign.disclosureRequired ? "需标识广告" : "自然种草",
      ],
      isRecommended: matchScore >= 86,
      requiresDraftReview: task.campaign.requiresDraftReview,
      allowUnverifiedSocialAccounts: task.campaign.allowUnverifiedSocialAccounts,
      href: `/creator/tasks/${task.id}`,
    };
  });

  const filteredTasks = taskDtos
    .filter((task) => taskMatchesQuery(task, q))
    .filter((task) => {
      if (tab === "recommended") return task.isRecommended;
      if (tab === "highReward") return task.rewardAmount >= 80;
      if (tab === "ending") return task.daysLeft !== null && task.daysLeft <= 7;
      if (tab === "new") return true;
      return true;
    })
    .sort((a, b) => {
      if (tab === "highReward") return b.rewardAmount - a.rewardAmount;
      if (tab === "ending") return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
      if (tab === "recommended") return b.matchScore - a.matchScore;
      return b.matchScore - a.matchScore || b.rewardAmount - a.rewardAmount;
    });

  const stats = {
    available: rawTasks.length,
    estimatedIncome: rawTasks.reduce((sum, task) => sum + Number(task.rewardAmount) * Math.max(0, task.slotsTotal - task.slotsTaken), 0),
    weeklyNew: rawTasks.filter((task) => nowMs - task.createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000).length,
    endingSoon: rawTasks.filter((task) => {
      const left = daysUntil(task.publishDeadline ?? task.deadline, nowMs);
      return left !== null && left <= 7;
    }).length,
  };

  return (
    <CreatorMarketplaceExperience
      currentFilters={{ platform, country, industry, minReward, q, tab }}
      filterOptions={{ platforms: V1_PLATFORMS, countries: V1_COUNTRIES, industries: V1_CATEGORIES }}
      stats={stats}
      tasks={filteredTasks}
      walletAvailable={Number(creator?.wallet?.availableBalance ?? 0)}
    />
  );
}
