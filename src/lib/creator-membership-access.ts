import { CreatorMembershipTier } from "@prisma/client";
import { isMembershipActive } from "@/lib/creator-membership-status";

export type CreatorMembershipFeature = "marketplace" | "trends";

const featureRules: Record<
  CreatorMembershipFeature,
  {
    label: string;
    description: string;
    requiredTier: "GROWTH" | "PRO";
  }
> = {
  marketplace: {
    label: "任务大厅",
    description: "成长会员及以上可查看和申请内部任务。",
    requiredTier: CreatorMembershipTier.GROWTH,
  },
  trends: {
    label: "热点选题",
    description: "Pro 高阶会员可查看趋势分析和高级选题数据。",
    requiredTier: CreatorMembershipTier.PRO,
  },
};

export function creatorMembershipFeatureRule(feature: CreatorMembershipFeature) {
  return featureRules[feature];
}

export function effectiveCreatorMembershipTier(tier: CreatorMembershipTier, endsAt?: Date | string | null) {
  return isMembershipActive(tier, endsAt) ? tier : CreatorMembershipTier.NONE;
}

export function hasCreatorMembershipFeature(
  tier: CreatorMembershipTier,
  feature: CreatorMembershipFeature,
  endsAt?: Date | string | null,
) {
  const effectiveTier = effectiveCreatorMembershipTier(tier, endsAt);
  if (featureRules[feature].requiredTier === CreatorMembershipTier.GROWTH) {
    return effectiveTier === CreatorMembershipTier.GROWTH || effectiveTier === CreatorMembershipTier.PRO;
  }
  return effectiveTier === CreatorMembershipTier.PRO;
}

export function membershipUpgradeQuery(feature: CreatorMembershipFeature) {
  return `/creator/membership?feature=${feature}`;
}
