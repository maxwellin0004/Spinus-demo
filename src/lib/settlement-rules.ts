function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function evaluateAcceptedSubmissionSettlement({
  rewardAmount,
  platformFeeRate,
  escrowFrozenAmount,
}: {
  rewardAmount: number | string | { toString(): string };
  platformFeeRate: number | string | { toString(): string };
  escrowFrozenAmount: number | string | { toString(): string };
}) {
  const amount = roundMoney(Number(rewardAmount));
  if (amount <= 0) {
    return {
      ok: false as const,
      reason: "invalid_reward_amount" as const,
      amount,
      platformFee: 0,
      releaseTarget: 0,
      releasedFromEscrow: 0,
      platformFeeRecognized: 0,
    };
  }

  const platformFee = roundMoney(amount * Number(platformFeeRate));
  const releaseTarget = roundMoney(amount + platformFee);
  const releasedFromEscrow = Math.min(Number(escrowFrozenAmount), releaseTarget);
  const platformFeeRecognized = Math.max(0, roundMoney(releasedFromEscrow - amount));

  return {
    ok: true as const,
    amount,
    platformFee,
    releaseTarget,
    releasedFromEscrow,
    platformFeeRecognized,
  };
}
