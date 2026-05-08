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

function compactRecord(record) {
  if (record == null) return record;
  if (record instanceof Date) return record.toISOString();
  if (Array.isArray(record)) return record.map(compactRecord);
  if (typeof record === "object") {
    if (typeof record.toNumber === "function") return record.toString();
    return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, compactRecord(value)]));
  }
  return record;
}

async function main() {
  const failures = [];
  const warnings = [];

  const [negativeBrands, negativeWallets, negativeCampaignEscrows, overspentCampaignEscrows] =
    await Promise.all([
      prisma.brandProfile.findMany({
        where: {
          OR: [{ budgetBalance: { lt: 0 } }, { frozenEscrowBalance: { lt: 0 } }],
        },
        select: { id: true, brandName: true, budgetBalance: true, frozenEscrowBalance: true },
      }),
      prisma.wallet.findMany({
        where: {
          OR: [
            { availableBalance: { lt: 0 } },
            { frozenBalance: { lt: 0 } },
            { cumulativeIncome: { lt: 0 } },
            { cumulativeWithdrawn: { lt: 0 } },
          ],
        },
        select: {
          id: true,
          creatorId: true,
          availableBalance: true,
          frozenBalance: true,
          cumulativeIncome: true,
          cumulativeWithdrawn: true,
        },
      }),
      prisma.campaign.findMany({
        where: {
          OR: [
            { escrowAmount: { lt: 0 } },
            { escrowFrozenAmount: { lt: 0 } },
            { escrowReleasedAmount: { lt: 0 } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          escrowAmount: true,
          escrowFrozenAmount: true,
          escrowReleasedAmount: true,
        },
      }),
      prisma.campaign.findMany({
        where: {
          escrowFrozenAmount: { gt: prisma.campaign.fields.escrowAmount },
        },
        select: {
          id: true,
          title: true,
          status: true,
          escrowAmount: true,
          escrowFrozenAmount: true,
        },
      }),
    ]);

  if (negativeBrands.length) {
    failures.push({
      code: "BRAND_BALANCE_NEGATIVE",
      count: negativeBrands.length,
      samples: negativeBrands.slice(0, 10).map(compactRecord),
    });
  }
  if (negativeWallets.length) {
    failures.push({
      code: "WALLET_BALANCE_NEGATIVE",
      count: negativeWallets.length,
      samples: negativeWallets.slice(0, 10).map(compactRecord),
    });
  }
  if (negativeCampaignEscrows.length) {
    failures.push({
      code: "CAMPAIGN_ESCROW_NEGATIVE",
      count: negativeCampaignEscrows.length,
      samples: negativeCampaignEscrows.slice(0, 10).map(compactRecord),
    });
  }
  if (overspentCampaignEscrows.length) {
    failures.push({
      code: "CAMPAIGN_ESCROW_FROZEN_EXCEEDS_AMOUNT",
      count: overspentCampaignEscrows.length,
      samples: overspentCampaignEscrows.slice(0, 10).map(compactRecord),
    });
  }

  const pendingEarnings = await prisma.walletTransaction.findMany({
    where: { type: "EARNING", status: "PENDING" },
    select: {
      id: true,
      creatorId: true,
      walletId: true,
      amount: true,
      relatedSubmissionId: true,
      createdAt: true,
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  if (pendingEarnings.length) {
    warnings.push({
      code: "LEGACY_PENDING_EARNINGS",
      count: pendingEarnings.length,
      samples: pendingEarnings.map(compactRecord),
    });
  }

  const paidEarnings = await prisma.walletTransaction.findMany({
    where: { type: "EARNING", status: { in: ["APPROVED", "PAID"] }, relatedSubmissionId: { not: null } },
    select: {
      id: true,
      amount: true,
      status: true,
      relatedSubmissionId: true,
      relatedSubmission: {
        select: {
          id: true,
          status: true,
          settlementStatus: true,
          settlementAmount: true,
        },
      },
    },
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  const mismatchedPaidEarnings = paidEarnings.filter((tx) => {
    const submission = tx.relatedSubmission;
    return (
      !submission ||
      submission.status !== "SETTLED" ||
      submission.settlementStatus !== "PAID_TO_WALLET" ||
      money(submission.settlementAmount) !== money(tx.amount)
    );
  });
  if (mismatchedPaidEarnings.length) {
    warnings.push({
      code: "EARNING_SUBMISSION_SETTLEMENT_MISMATCH",
      count: mismatchedPaidEarnings.length,
      samples: mismatchedPaidEarnings.slice(0, 20).map(compactRecord),
    });
  }

  const confirmedNegativeLedgers = await prisma.brandLedgerTransaction.findMany({
    where: { status: "CONFIRMED", amount: { lt: 0 } },
    select: { id: true, brandId: true, campaignId: true, type: true, amount: true, createdAt: true },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  if (confirmedNegativeLedgers.length) {
    failures.push({
      code: "CONFIRMED_LEDGER_NEGATIVE_AMOUNT",
      count: confirmedNegativeLedgers.length,
      samples: confirmedNegativeLedgers.map(compactRecord),
    });
  }

  const summary = {
    ok: failures.length === 0,
    checkedAt: new Date().toISOString(),
    failures,
    warnings,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (failures.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
