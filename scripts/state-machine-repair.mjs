import fs from "node:fs";
import path from "node:path";
import {
  CampaignStatus,
  InvoiceStatus,
  PrismaClient,
  TaskStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadDotenv();

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const FUNDED_CAMPAIGN_STATUSES = [
  CampaignStatus.PENDING_REVIEW,
  CampaignStatus.ACTIVE,
  CampaignStatus.PAUSED,
];
const CLOSED_CAMPAIGN_STATUSES = [
  CampaignStatus.COMPLETED,
  CampaignStatus.CANCELLED,
  CampaignStatus.ARCHIVED,
];

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

function hasFullEscrow(campaign) {
  return money(campaign.escrowFrozenAmount) + money(campaign.escrowReleasedAmount) + 0.01 >= money(campaign.escrowAmount);
}

function missingEscrow(campaign) {
  return Math.max(0, money(money(campaign.escrowAmount) - money(campaign.escrowFrozenAmount) - money(campaign.escrowReleasedAmount)));
}

function hasOperationalWork(campaign) {
  if (campaign._count.drafts > 0 || campaign._count.submissions > 0 || campaign._count.proofs > 0) return true;
  return campaign.tasks.some((task) => task.slotsTaken > 0 || task._count.applications > 0);
}

function summarizeCampaign(campaign) {
  return {
    campaignId: campaign.id,
    title: campaign.title,
    status: campaign.status,
    escrowAmount: money(campaign.escrowAmount),
    escrowFrozenAmount: money(campaign.escrowFrozenAmount),
    escrowReleasedAmount: money(campaign.escrowReleasedAmount),
    missingEscrow: missingEscrow(campaign),
    taskCount: campaign.tasks.length,
    openTaskCount: campaign.tasks.filter((task) => task.status !== TaskStatus.CLOSED).length,
    applicationCount: campaign.tasks.reduce((sum, task) => sum + task._count.applications, 0),
    draftCount: campaign._count.drafts,
    submissionCount: campaign._count.submissions,
    proofCount: campaign._count.proofs,
    paidInvoiceCount: campaign.invoices.filter((invoice) => invoice.status === InvoiceStatus.PAID).length,
  };
}

function addOperation(operations, type, campaign, details = {}) {
  operations.push({
    type,
    ...summarizeCampaign(campaign),
    ...details,
  });
}

async function audit(tx, action, campaign, beforeJson, afterJson) {
  await tx.auditLog.create({
    data: {
      action,
      entityType: "campaign",
      entityId: campaign.id,
      beforeJson,
      afterJson,
    },
  });
}

async function quarantineUnderfundedCampaign(tx, campaign, operations) {
  addOperation(operations, "quarantine_underfunded_campaign", campaign, {
    fromStatus: campaign.status,
    toStatus: CampaignStatus.AWAITING_PAYMENT,
    taskStatus: TaskStatus.PAUSED,
  });
  if (!apply) return;

  await tx.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.AWAITING_PAYMENT },
  });
  await tx.campaignTask.updateMany({
    where: { campaignId: campaign.id, status: { not: TaskStatus.CLOSED } },
    data: { status: TaskStatus.PAUSED },
  });
  await audit(
    tx,
    "state_machine.legacy_underfunded_campaign_quarantined",
    campaign,
    {
      status: campaign.status,
      escrowAmount: String(campaign.escrowAmount),
      escrowFrozenAmount: String(campaign.escrowFrozenAmount),
      escrowReleasedAmount: String(campaign.escrowReleasedAmount),
    },
    {
      status: CampaignStatus.AWAITING_PAYMENT,
      taskStatus: TaskStatus.PAUSED,
      missingEscrow: missingEscrow(campaign),
    },
  );
}

async function moveAwaitingPaymentToReview(tx, campaign, operations) {
  addOperation(operations, "move_funded_awaiting_payment_campaign_to_review", campaign, {
    fromStatus: CampaignStatus.AWAITING_PAYMENT,
    toStatus: CampaignStatus.PENDING_REVIEW,
  });
  if (!apply) return;

  await tx.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.PENDING_REVIEW },
  });
  await audit(
    tx,
    "state_machine.legacy_funded_campaign_moved_to_review",
    campaign,
    { status: CampaignStatus.AWAITING_PAYMENT },
    { status: CampaignStatus.PENDING_REVIEW },
  );
}

async function moveFundedDraftToReview(tx, campaign, operations) {
  addOperation(operations, "move_funded_draft_campaign_to_review", campaign, {
    fromStatus: CampaignStatus.DRAFT,
    toStatus: CampaignStatus.PENDING_REVIEW,
  });
  if (!apply) return;

  await tx.campaign.update({
    where: { id: campaign.id },
    data: { status: CampaignStatus.PENDING_REVIEW },
  });
  await audit(
    tx,
    "state_machine.legacy_funded_draft_moved_to_review",
    campaign,
    { status: CampaignStatus.DRAFT },
    { status: CampaignStatus.PENDING_REVIEW },
  );
}

async function closeTasksForClosedCampaign(tx, campaign, operations) {
  addOperation(operations, "close_tasks_for_closed_campaign", campaign, {
    affectedTaskIds: campaign.tasks.filter((task) => task.status !== TaskStatus.CLOSED).map((task) => task.id),
  });
  if (!apply) return;

  await tx.campaignTask.updateMany({
    where: { campaignId: campaign.id, status: { not: TaskStatus.CLOSED } },
    data: { status: TaskStatus.CLOSED },
  });
  await audit(
    tx,
    "state_machine.legacy_closed_campaign_tasks_closed",
    campaign,
    { taskStatuses: campaign.tasks.map((task) => ({ id: task.id, status: task.status })) },
    { taskStatus: TaskStatus.CLOSED },
  );
}

async function buildRepairPlan(tx) {
  const operations = [];
  const manualReview = [];

  const campaigns = await tx.campaign.findMany({
    where: { isDemo: false },
    select: {
      id: true,
      title: true,
      status: true,
      escrowAmount: true,
      escrowFrozenAmount: true,
      escrowReleasedAmount: true,
      invoices: { select: { id: true, amount: true, status: true, paidAt: true } },
      tasks: {
        select: {
          id: true,
          status: true,
          slotsTaken: true,
          _count: { select: { applications: true } },
        },
      },
      _count: { select: { drafts: true, submissions: true, proofs: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  for (const campaign of campaigns) {
    if (FUNDED_CAMPAIGN_STATUSES.includes(campaign.status) && !hasFullEscrow(campaign)) {
      if (hasOperationalWork(campaign)) {
        addOperation(manualReview, "manual_review_underfunded_campaign_with_work", campaign, {
          reason: "Campaign already has applications, drafts, submissions, proofs, or taken slots.",
        });
      } else {
        await quarantineUnderfundedCampaign(tx, campaign, operations);
      }
      continue;
    }

    if (campaign.status === CampaignStatus.AWAITING_PAYMENT && hasFullEscrow(campaign)) {
      await moveAwaitingPaymentToReview(tx, campaign, operations);
      continue;
    }

    if (campaign.status === CampaignStatus.DRAFT && money(campaign.escrowFrozenAmount) > 0) {
      if (hasFullEscrow(campaign) && !hasOperationalWork(campaign)) {
        await moveFundedDraftToReview(tx, campaign, operations);
      } else {
        addOperation(manualReview, "manual_review_draft_campaign_with_escrow", campaign, {
          reason: "Draft has escrow movement but is not cleanly fully funded or already has operational work.",
        });
      }
      continue;
    }

    if (CLOSED_CAMPAIGN_STATUSES.includes(campaign.status) && campaign.tasks.some((task) => task.status !== TaskStatus.CLOSED)) {
      await closeTasksForClosedCampaign(tx, campaign, operations);
    }
  }

  return { operations, manualReview };
}

async function main() {
  const { operations, manualReview } = apply
    ? await prisma.$transaction((tx) => buildRepairPlan(tx), { timeout: 30000 })
    : await buildRepairPlan(prisma);

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        generatedAt: new Date().toISOString(),
        summary: {
          executableOperations: operations.length,
          manualReviewItems: manualReview.length,
        },
        operations,
        manualReview,
        applyHint: apply ? undefined : "Run `npm run state:repair -- --apply` after reviewing this plan.",
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
