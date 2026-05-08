import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadDotenv();

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
  return Number(value ?? 0);
}

function serialize(record) {
  if (record == null) return record;
  if (record instanceof Date) return record.toISOString();
  if (Array.isArray(record)) return record.map(serialize);
  if (typeof record === "object") {
    if (typeof record.toNumber === "function") return record.toString();
    return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, serialize(value)]));
  }
  return record;
}

async function main() {
  const [
    pendingEarnings,
    underEscrowedCampaigns,
    settlementMismatches,
    campaignsWithEscrowWithoutFreezeLedger,
    brandsWithFrozenMismatch,
  ] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { type: "EARNING", status: "PENDING" },
      select: {
        id: true,
        creatorId: true,
        walletId: true,
        amount: true,
        relatedSubmissionId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.campaign.findMany({
      where: {
        status: { in: ["AWAITING_PAYMENT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "COMPLETED"] },
        OR: [{ escrowAmount: { equals: 0 } }, { escrowAmount: { lt: prisma.campaign.fields.totalBudget } }],
      },
      select: {
        id: true,
        brandId: true,
        title: true,
        status: true,
        totalBudget: true,
        creatorBudget: true,
        platformFee: true,
        escrowAmount: true,
        escrowFrozenAmount: true,
        escrowReleasedAmount: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.walletTransaction.findMany({
      where: { type: "EARNING", status: { in: ["APPROVED", "PAID"] }, relatedSubmissionId: { not: null } },
      select: {
        id: true,
        amount: true,
        status: true,
        relatedSubmissionId: true,
        relatedSubmission: {
          select: {
            id: true,
            campaignId: true,
            creatorId: true,
            status: true,
            settlementStatus: true,
            settlementAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.campaign.findMany({
      where: {
        escrowFrozenAmount: { gt: 0 },
        ledgerTransactions: { none: { type: "ESCROW_FREEZE", status: "CONFIRMED" } },
      },
      select: {
        id: true,
        brandId: true,
        title: true,
        status: true,
        escrowAmount: true,
        escrowFrozenAmount: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.brandProfile.findMany({
      select: {
        id: true,
        brandName: true,
        frozenEscrowBalance: true,
        campaigns: {
          select: { escrowFrozenAmount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const mismatches = settlementMismatches.filter((tx) => {
    const submission = tx.relatedSubmission;
    return (
      !submission ||
      submission.status !== "SETTLED" ||
      submission.settlementStatus !== "PAID_TO_WALLET" ||
      money(submission.settlementAmount) !== money(tx.amount)
    );
  });

  const frozenMismatchBrands = brandsWithFrozenMismatch
    .map((brand) => {
      const campaignFrozen = brand.campaigns.reduce(
        (sum, campaign) => sum + money(campaign.escrowFrozenAmount),
        0,
      );
      return {
        id: brand.id,
        brandName: brand.brandName,
        frozenEscrowBalance: brand.frozenEscrowBalance,
        campaignFrozen,
        delta: money(brand.frozenEscrowBalance) - campaignFrozen,
      };
    })
    .filter((brand) => Math.abs(brand.delta) >= 0.01);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      pendingEarnings: pendingEarnings.length,
      underEscrowedCampaigns: underEscrowedCampaigns.length,
      earningSettlementMismatches: mismatches.length,
      campaignsWithEscrowWithoutFreezeLedger: campaignsWithEscrowWithoutFreezeLedger.length,
      brandFrozenBalanceMismatches: frozenMismatchBrands.length,
    },
    items: {
      pendingEarnings: pendingEarnings.map(serialize),
      underEscrowedCampaigns: underEscrowedCampaigns.map(serialize),
      earningSettlementMismatches: mismatches.slice(0, 100).map(serialize),
      campaignsWithEscrowWithoutFreezeLedger: campaignsWithEscrowWithoutFreezeLedger.map(serialize),
      brandFrozenBalanceMismatches: frozenMismatchBrands.map(serialize),
    },
    suggestedCleanupOrder: [
      "Backfill campaign escrowAmount/escrowFrozenAmount from totalBudget only for campaigns that were already funded.",
      "Convert legacy pending earnings into accepted proof wallet credits only after confirming the corresponding submission acceptance.",
      "Add missing brand ledger entries for any historical balance movement before changing visible balances.",
      "Resolve brand frozen balance mismatches before enabling strict ledger enforcement.",
    ],
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
