import { ApplicationStatus, CreatorLevel, ReviewStatus, SocialVerificationStatus, TaskStatus, type CampaignStatus } from "@prisma/client";
import { hasCreatorLevel } from "@/lib/levels";

type SocialAccountLike = {
  platform: string;
  followers: number;
  verificationStatus?: SocialVerificationStatus | string;
  verified?: boolean;
};

type CreatorMatchLike = {
  reviewStatus: ReviewStatus | string;
  level: CreatorLevel;
  categories: string[];
  contentTypes: string[];
  socialAccounts: SocialAccountLike[];
};

type TaskMatchLike = {
  platform: string;
  contentType: string;
  minimumFollowers: number;
  slotsTaken: number;
  slotsTotal: number;
  status: TaskStatus | string;
  creatorLevelRequired: CreatorLevel;
  campaign: {
    status: CampaignStatus | string;
    industry: string;
    allowUnverifiedSocialAccounts: boolean;
  };
};

type ExistingApplicationLike = {
  status: ApplicationStatus | string;
  task?: { title: string } | null;
} | null;

function isVerified(account: SocialAccountLike) {
  return account.verificationStatus === SocialVerificationStatus.VERIFIED || account.verified === true;
}

export function buildTaskMatch(task: TaskMatchLike, creator?: CreatorMatchLike | null, existingInCampaign?: ExistingApplicationLike) {
  const socialAccounts = creator?.socialAccounts ?? [];
  const platformAccounts = socialAccounts.filter((account) => account.platform === task.platform);
  const verifiedPlatformAccounts = platformAccounts.filter(isVerified);
  const bestPlatformAccount = [...platformAccounts].sort((a, b) => b.followers - a.followers)[0];
  const bestVerifiedPlatformAccount = [...verifiedPlatformAccounts].sort((a, b) => b.followers - a.followers)[0];
  const usableAccount = task.campaign.allowUnverifiedSocialAccounts ? bestPlatformAccount : bestVerifiedPlatformAccount;
  const remainingSlots = task.slotsTotal - task.slotsTaken;

  const reasons: string[] = [];
  const blockers: string[] = [];

  if (creator?.categories.includes(task.campaign.industry)) reasons.push("内容领域匹配");
  if (creator?.contentTypes.includes(task.contentType)) reasons.push("内容形式匹配");
  if (bestPlatformAccount) reasons.push(`已绑定 ${task.platform} 账号`);
  if (bestVerifiedPlatformAccount) reasons.push("同平台账号已验证");
  if (usableAccount && usableAccount.followers >= task.minimumFollowers) reasons.push("粉丝数达到任务门槛");
  if (remainingSlots > 0) reasons.push(`剩余 ${remainingSlots} 个名额`);

  if (!creator) blockers.push("请先完成创作者资料");
  if (creator && creator.reviewStatus !== ReviewStatus.APPROVED) blockers.push("创作者资料仍在平台审核中");
  if (!socialAccounts.length) blockers.push("请先添加社媒账号");
  if (socialAccounts.length && !platformAccounts.length) blockers.push(`缺少 ${task.platform} 账号`);
  if (!task.campaign.allowUnverifiedSocialAccounts && platformAccounts.length && !verifiedPlatformAccounts.length) blockers.push(`${task.platform} 账号尚未验证`);
  if (usableAccount && usableAccount.followers < task.minimumFollowers) blockers.push(`粉丝数 ${usableAccount.followers.toLocaleString("zh-CN")} 未达到最低 ${task.minimumFollowers.toLocaleString("zh-CN")}`);
  if (!hasCreatorLevel(creator?.level ?? CreatorLevel.NEW, task.creatorLevelRequired)) blockers.push(`创作者等级未达到 ${task.creatorLevelRequired}`);
  if (remainingSlots <= 0) blockers.push("任务名额已满");
  if (task.status !== TaskStatus.ACTIVE || task.campaign.status !== "ACTIVE") blockers.push("任务暂未开放申请");
  if (existingInCampaign && (existingInCampaign.status === ApplicationStatus.APPLIED || existingInCampaign.status === ApplicationStatus.APPROVED)) {
    blockers.push(`你已申请该 Campaign 下的任务：${existingInCampaign.task?.title ?? "已申请任务"}`);
  }

  const score = Math.min(
    98,
    52 +
      (creator?.categories.includes(task.campaign.industry) ? 16 : 0) +
      (creator?.contentTypes.includes(task.contentType) ? 10 : 0) +
      (bestVerifiedPlatformAccount ? 12 : bestPlatformAccount ? 5 : 0) +
      (usableAccount && usableAccount.followers >= task.minimumFollowers ? 8 : 0) +
      (task.minimumFollowers <= 10_000 ? 4 : 0),
  );

  return {
    score,
    reasons: reasons.length ? reasons : ["任务信息完整，可查看详情后判断是否申请"],
    blockers,
    canApply: blockers.length === 0,
    recommended: score >= 86 && blockers.length === 0,
    usableAccount,
  };
}
