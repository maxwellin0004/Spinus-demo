import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadDotenv();

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function loadDotenv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function money(value) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

async function getCampaignsNeedingEscrowBackfill(tx) {
  const campaigns = await tx.campaign.findMany({
    where: {
      status: { in: ["PENDING_REVIEW", "ACTIVE", "PAUSED", "COMPLETED"] },
    },
    include: { brand: true },
    orderBy: { createdAt: "asc" },
  });

  return campaigns
    .map((campaign) => {
      const totalBudget = money(campaign.totalBudget);
      const escrowAmount = money(campaign.escrowAmount);
      const escrowFrozen = money(campaign.escrowFrozenAmount);
      const escrowReleased = money(campaign.escrowReleasedAmount);
      return {
        campaign,
        totalBudget,
        missingEscrowAmount: Math.max(0, money(totalBudget - escrowAmount)),
        missingLockedAmount: Math.max(0, money(totalBudget - escrowFrozen - escrowReleased)),
      };
    })
    .filter((item) => item.missingEscrowAmount > 0 || item.missingLockedAmount > 0);
}

async function backfillCampaignEscrow(tx, item, operations) {
  const { campaign, missingEscrowAmount, missingLockedAmount } = item;
  operations.push({
    type: "campaign_escrow_backfill",
    campaignId: campaign.id,
    title: campaign.title,
    missingEscrowAmount,
    missingLockedAmount,
  });
  if (!apply) return;

  if (missingLockedAmount > 0) {
    const brandBefore = money(campaign.brand.budgetBalance);
    const brandAfterPayment = money(brandBefore + missingLockedAmount);

    await tx.brandProfile.update({
      where: { id: campaign.brandId },
      data: { budgetBalance: { increment: missingLockedAmount } },
    });
    await tx.brandLedgerTransaction.create({
      data: {
        brandId: campaign.brandId,
        campaignId: campaign.id,
        type: "PAYMENT",
        amount: missingLockedAmount,
        currency: campaign.currency,
        status: "CONFIRMED",
        beforeBalance: brandBefore,
        afterBalance: brandAfterPayment,
        note: "Legacy finance cleanup: synthetic funding before escrow freeze.",
      },
    });

    await tx.brandProfile.update({
      where: { id: campaign.brandId },
      data: {
        budgetBalance: { decrement: missingLockedAmount },
        frozenEscrowBalance: { increment: missingLockedAmount },
      },
    });
    await tx.brandLedgerTransaction.create({
      data: {
        brandId: campaign.brandId,
        campaignId: campaign.id,
        type: "ESCROW_FREEZE",
        amount: missingLockedAmount,
        currency: campaign.currency,
        status: "CONFIRMED",
        beforeBalance: brandAfterPayment,
        afterBalance: brandBefore,
        note: "Legacy finance cleanup: freeze escrow for already active campaign.",
      },
    });
  }

  await tx.campaign.update({
    where: { id: campaign.id },
    data: {
      escrowAmount: { increment: missingEscrowAmount },
      escrowFrozenAmount: { increment: missingLockedAmount },
    },
  });
  await tx.auditLog.create({
    data: {
      action: "finance.legacy_campaign_escrow_backfilled",
      entityType: "campaign",
      entityId: campaign.id,
      afterJson: {
        missingEscrowAmount,
        missingLockedAmount,
        totalBudget: item.totalBudget,
      },
    },
  });
}

async function getLegacyEarnings(tx) {
  const pending = await tx.walletTransaction.findMany({
    where: { type: "EARNING", status: "PENDING", relatedSubmissionId: { not: null } },
    include: {
      wallet: true,
      creator: true,
      relatedSubmission: { include: { campaign: { include: { brand: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const approved = await tx.walletTransaction.findMany({
    where: { type: "EARNING", status: { in: ["APPROVED", "PAID"] }, relatedSubmissionId: { not: null } },
    include: {
      wallet: true,
      creator: true,
      relatedSubmission: { include: { campaign: { include: { brand: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const mismatchedApproved = approved.filter((earning) => {
    const submission = earning.relatedSubmission;
    return (
      !submission ||
      submission.status !== "SETTLED" ||
      submission.settlementStatus !== "PAID_TO_WALLET" ||
      money(submission.settlementAmount) !== money(earning.amount)
    );
  });

  return [
    ...pending.map((earning) => ({ earning, shouldCreditWallet: true })),
    ...mismatchedApproved.map((earning) => ({ earning, shouldCreditWallet: false })),
  ];
}

async function settleLegacyEarning(tx, item, operations) {
  const { earning, shouldCreditWallet } = item;
  if (!earning.relatedSubmission) return;

  const amount = money(earning.amount);
  const submission = earning.relatedSubmission;
  const campaign = submission.campaign;
  const platformFee = money(amount * money(campaign.platformFeeRate));
  const releaseTarget = money(amount + platformFee);
  const releaseAmount = Math.min(money(campaign.escrowFrozenAmount), releaseTarget);
  const platformFeeRecognized = Math.max(0, money(releaseAmount - amount));

  operations.push({
    type: "earning_settlement_backfill",
    transactionId: earning.id,
    submissionId: submission.id,
    campaignId: campaign.id,
    amount,
    shouldCreditWallet,
    releaseAmount,
    platformFeeRecognized,
  });
  if (!apply) return;

  if (shouldCreditWallet) {
    await tx.walletTransaction.update({
      where: { id: earning.id },
      data: {
        status: "APPROVED",
        note: "Legacy finance cleanup: accepted proof credited to withdrawable balance.",
      },
    });
    await tx.wallet.update({
      where: { id: earning.walletId },
      data: {
        availableBalance: { increment: amount },
        cumulativeIncome: { increment: amount },
      },
    });
    await tx.creatorProfile.update({
      where: { id: earning.creatorId },
      data: {
        cumulativeIncome: { increment: amount },
        completedTasks: { increment: 1 },
      },
    });
  }

  await tx.submission.update({
    where: { id: submission.id },
    data: {
      status: "SETTLED",
      settlementStatus: "PAID_TO_WALLET",
      settlementAmount: amount,
      acceptedAt: submission.acceptedAt ?? new Date(),
    },
  });

  if (releaseAmount > 0) {
    await tx.brandProfile.update({
      where: { id: campaign.brandId },
      data: { frozenEscrowBalance: { decrement: releaseAmount } },
    });
    await tx.campaign.update({
      where: { id: campaign.id },
      data: {
        escrowFrozenAmount: { decrement: releaseAmount },
        escrowReleasedAmount: { increment: releaseAmount },
      },
    });
    await tx.brandLedgerTransaction.create({
      data: {
        brandId: campaign.brandId,
        campaignId: campaign.id,
        type: "KOL_SETTLEMENT",
        amount,
        currency: campaign.currency,
        status: "CONFIRMED",
        beforeBalance: campaign.brand.budgetBalance,
        afterBalance: campaign.brand.budgetBalance,
        note: `Legacy finance cleanup: settlement release for submission ${submission.id}.`,
      },
    });
    if (platformFeeRecognized > 0) {
      await tx.brandLedgerTransaction.create({
        data: {
          brandId: campaign.brandId,
          campaignId: campaign.id,
          type: "PLATFORM_FEE",
          amount: platformFeeRecognized,
          currency: campaign.currency,
          status: "CONFIRMED",
          beforeBalance: campaign.brand.budgetBalance,
          afterBalance: campaign.brand.budgetBalance,
          note: `Legacy finance cleanup: platform fee recognized for submission ${submission.id}.`,
        },
      });
    }
  }

  await tx.auditLog.create({
    data: {
      action: "finance.legacy_earning_settled",
      entityType: "submission",
      entityId: submission.id,
      afterJson: {
        transactionId: earning.id,
        amount,
        shouldCreditWallet,
        releaseAmount,
        platformFeeRecognized,
      },
    },
  });
}

async function runCleanup(tx) {
  const operations = [];
  for (const item of await getCampaignsNeedingEscrowBackfill(tx)) {
    await backfillCampaignEscrow(tx, item, operations);
  }
  for (const item of await getLegacyEarnings(tx)) {
    await settleLegacyEarning(tx, item, operations);
  }
  return operations;
}

async function main() {
  const operations = apply
    ? await prisma.$transaction((tx) => runCleanup(tx), { timeout: 30000 })
    : await runCleanup(prisma);

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        generatedAt: new Date().toISOString(),
        operationCount: operations.length,
        operations,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
