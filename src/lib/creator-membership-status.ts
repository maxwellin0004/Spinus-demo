import { CreatorMembershipTier } from "@prisma/client";

export function creatorMembershipLabel(tier: CreatorMembershipTier) {
  if (tier === CreatorMembershipTier.GROWTH) return "成长会员";
  if (tier === CreatorMembershipTier.PRO) return "Pro 高阶会员";
  return "未开通";
}

export function creatorMembershipTone(tier: CreatorMembershipTier) {
  if (tier === CreatorMembershipTier.PRO) return "purple" as const;
  if (tier === CreatorMembershipTier.GROWTH) return "success" as const;
  return "neutral" as const;
}

export function isMembershipActive(tier: CreatorMembershipTier, endsAt?: Date | string | null) {
  if (tier === CreatorMembershipTier.NONE) return false;
  if (!endsAt) return true;
  return new Date(endsAt).getTime() >= Date.now();
}
