import { CreatorLevel } from "@prisma/client";

const rank: Record<CreatorLevel, number> = {
  NEW: 0,
  VERIFIED: 1,
  PRO: 2,
  ELITE: 3,
};

export function hasCreatorLevel(current: CreatorLevel, required: CreatorLevel) {
  return rank[current] >= rank[required];
}
