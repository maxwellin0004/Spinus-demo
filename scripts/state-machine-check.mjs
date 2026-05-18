import fs from "node:fs";
import path from "node:path";
import {
  ApplicationStatus,
  CampaignStatus,
  ProofStatus,
  PublicationStatus,
  SettlementStatus,
  SubmissionStatus,
  TaskStatus,
  PrismaClient,
} from "@prisma/client";
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
  const failures = [];
  const warnings = [];

  const campaigns = await prisma.campaign.findMany({
    where: { isDemo: false },
    select: {
      id: true,
      title: true,
      status: true,
      escrowAmount: true,
      escrowFrozenAmount: true,
      escrowReleasedAmount: true,
      totalBudget: true,
      tasks: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const needsFullEscrow = campaigns.filter((campaign) =>
    [CampaignStatus.PENDING_REVIEW, CampaignStatus.ACTIVE, CampaignStatus.PAUSED].includes(campaign.status) &&
    money(campaign.escrowFrozenAmount) + money(campaign.escrowReleasedAmount) + 0.01 < money(campaign.escrowAmount)
  );
  if (needsFullEscrow.length) {
    failures.push({
      code: "CAMPAIGN_ACTIVE_FLOW_WITHOUT_FULL_ESCROW",
      count: needsFullEscrow.length,
      samples: needsFullEscrow.slice(0, 20).map((campaign) => serialize({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        escrowAmount: campaign.escrowAmount,
        escrowFrozenAmount: campaign.escrowFrozenAmount,
        escrowReleasedAmount: campaign.escrowReleasedAmount,
      })),
    });
  }

  const draftWithEscrow = campaigns.filter((campaign) => campaign.status === CampaignStatus.DRAFT && money(campaign.escrowFrozenAmount) > 0);
  if (draftWithEscrow.length) {
    failures.push({
      code: "DRAFT_CAMPAIGN_HAS_FROZEN_ESCROW",
      count: draftWithEscrow.length,
      samples: draftWithEscrow.slice(0, 20).map(serialize),
    });
  }

  const archivedOpenTasks = campaigns.filter((campaign) =>
    [CampaignStatus.COMPLETED, CampaignStatus.CANCELLED, CampaignStatus.ARCHIVED].includes(campaign.status) &&
    campaign.tasks.some((task) => task.status !== TaskStatus.CLOSED)
  );
  if (archivedOpenTasks.length) {
    warnings.push({
      code: "CLOSED_CAMPAIGN_HAS_OPEN_TASKS",
      count: archivedOpenTasks.length,
      samples: archivedOpenTasks.slice(0, 20).map((campaign) => serialize({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        taskStatuses: campaign.tasks.map((task) => task.status),
      })),
    });
  }

  const awaitingPaymentWithFullEscrow = campaigns.filter((campaign) =>
    campaign.status === CampaignStatus.AWAITING_PAYMENT &&
    money(campaign.escrowFrozenAmount) + money(campaign.escrowReleasedAmount) + 0.01 >= money(campaign.escrowAmount)
  );
  if (awaitingPaymentWithFullEscrow.length) {
    warnings.push({
      code: "AWAITING_PAYMENT_CAMPAIGN_ALREADY_FUNDED",
      count: awaitingPaymentWithFullEscrow.length,
      samples: awaitingPaymentWithFullEscrow.slice(0, 20).map(serialize),
    });
  }

  const approvedApplicationsOnClosedTasks = await prisma.taskApplication.findMany({
    where: {
      status: ApplicationStatus.APPROVED,
      task: {
        OR: [
          { status: TaskStatus.CLOSED },
          { campaign: { status: { in: [CampaignStatus.DRAFT, CampaignStatus.AWAITING_PAYMENT, CampaignStatus.REJECTED, CampaignStatus.CANCELLED, CampaignStatus.ARCHIVED] } } },
        ],
      },
    },
    select: {
      id: true,
      status: true,
      task: { select: { id: true, status: true, campaignId: true, campaign: { select: { title: true, status: true } } } },
    },
    take: 100,
  });
  if (approvedApplicationsOnClosedTasks.length) {
    failures.push({
      code: "APPROVED_APPLICATION_ON_CLOSED_OR_UNAVAILABLE_TASK",
      count: approvedApplicationsOnClosedTasks.length,
      samples: approvedApplicationsOnClosedTasks.slice(0, 20).map(serialize),
    });
  }

  const pendingProofWithWrongSubmission = await prisma.proof.findMany({
    where: {
      verificationStatus: ProofStatus.PENDING,
      submission: { status: { not: SubmissionStatus.PROOF_SUBMITTED } },
    },
    select: {
      id: true,
      verificationStatus: true,
      submissionId: true,
      submission: { select: { status: true, publicationStatus: true, settlementStatus: true } },
    },
    take: 100,
  });
  if (pendingProofWithWrongSubmission.length) {
    failures.push({
      code: "PENDING_PROOF_WITHOUT_PROOF_SUBMITTED_SUBMISSION",
      count: pendingProofWithWrongSubmission.length,
      samples: pendingProofWithWrongSubmission.slice(0, 20).map(serialize),
    });
  }

  const finalProofWithWrongSubmission = await prisma.proof.findMany({
    where: {
      verificationStatus: { in: [ProofStatus.VERIFIED, ProofStatus.REJECTED] },
      OR: [
        {
          verificationStatus: ProofStatus.VERIFIED,
          submission: {
            status: { notIn: [SubmissionStatus.VERIFIED, SubmissionStatus.SETTLED] },
          },
        },
        {
          verificationStatus: ProofStatus.REJECTED,
          submission: {
            status: { not: SubmissionStatus.APPROVED },
            publicationStatus: { not: PublicationStatus.REJECTED },
          },
        },
      ],
    },
    select: {
      id: true,
      verificationStatus: true,
      publicationStatus: true,
      submissionId: true,
      submission: { select: { status: true, publicationStatus: true, settlementStatus: true } },
    },
    take: 100,
  });
  if (finalProofWithWrongSubmission.length) {
    failures.push({
      code: "FINAL_PROOF_SUBMISSION_STATE_MISMATCH",
      count: finalProofWithWrongSubmission.length,
      samples: finalProofWithWrongSubmission.slice(0, 20).map(serialize),
    });
  }

  const paidSettlementWithoutSettledSubmission = await prisma.submission.findMany({
    where: {
      settlementStatus: SettlementStatus.PAID_TO_WALLET,
      status: { not: SubmissionStatus.SETTLED },
    },
    select: {
      id: true,
      status: true,
      publicationStatus: true,
      settlementStatus: true,
      settlementAmount: true,
    },
    take: 100,
  });
  if (paidSettlementWithoutSettledSubmission.length) {
    failures.push({
      code: "PAID_SETTLEMENT_WITHOUT_SETTLED_SUBMISSION",
      count: paidSettlementWithoutSettledSubmission.length,
      samples: paidSettlementWithoutSettledSubmission.slice(0, 20).map(serialize),
    });
  }

  const acceptedPublicationWithoutVerifiedFlow = await prisma.submission.findMany({
    where: {
      publicationStatus: PublicationStatus.ACCEPTED,
      status: { notIn: [SubmissionStatus.VERIFIED, SubmissionStatus.SETTLED] },
    },
    select: {
      id: true,
      status: true,
      publicationStatus: true,
      settlementStatus: true,
      campaignId: true,
    },
    take: 100,
  });
  if (acceptedPublicationWithoutVerifiedFlow.length) {
    warnings.push({
      code: "ACCEPTED_PUBLICATION_WITHOUT_VERIFIED_OR_SETTLED_SUBMISSION",
      count: acceptedPublicationWithoutVerifiedFlow.length,
      samples: acceptedPublicationWithoutVerifiedFlow.slice(0, 20).map(serialize),
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
