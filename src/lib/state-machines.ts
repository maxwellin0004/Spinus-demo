import {
  ApplicationStatus,
  CampaignStatus,
  DraftReviewStatus,
  DraftStatus,
  ProofStatus,
  PublicationStatus,
  SettlementStatus,
  SubmissionStatus,
} from "@prisma/client";

const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.DRAFT]: [CampaignStatus.AWAITING_PAYMENT, CampaignStatus.PENDING_REVIEW],
  [CampaignStatus.AWAITING_PAYMENT]: [CampaignStatus.PENDING_REVIEW, CampaignStatus.CANCELLED],
  [CampaignStatus.PENDING_REVIEW]: [CampaignStatus.ACTIVE, CampaignStatus.REJECTED, CampaignStatus.CANCELLED],
  [CampaignStatus.REJECTED]: [CampaignStatus.ARCHIVED],
  [CampaignStatus.ACTIVE]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
  [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
  [CampaignStatus.COMPLETED]: [CampaignStatus.ARCHIVED],
  [CampaignStatus.CANCELLED]: [CampaignStatus.ARCHIVED],
  [CampaignStatus.ARCHIVED]: [],
};

const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.APPLIED]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.CANCELLED],
  [ApplicationStatus.APPROVED]: [ApplicationStatus.CANCELLED],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.CANCELLED]: [],
};

const DRAFT_TRANSITIONS: Record<DraftStatus, DraftStatus[]> = {
  [DraftStatus.DRAFT]: [DraftStatus.SUBMITTED, DraftStatus.APPROVED, DraftStatus.BLOCKED],
  [DraftStatus.SUBMITTED]: [DraftStatus.APPROVED, DraftStatus.REVISION_REQUESTED, DraftStatus.REJECTED],
  [DraftStatus.REVISION_REQUESTED]: [DraftStatus.SUBMITTED, DraftStatus.BLOCKED],
  [DraftStatus.APPROVED]: [],
  [DraftStatus.REJECTED]: [],
  [DraftStatus.BLOCKED]: [],
};

const DRAFT_REVIEW_TRANSITIONS: Record<DraftReviewStatus, DraftReviewStatus[]> = {
  [DraftReviewStatus.NOT_REQUIRED]: [],
  [DraftReviewStatus.NOT_SUBMITTED]: [DraftReviewStatus.SUBMITTED, DraftReviewStatus.REJECTED],
  [DraftReviewStatus.SUBMITTED]: [DraftReviewStatus.APPROVED, DraftReviewStatus.REVISION_REQUESTED, DraftReviewStatus.REJECTED],
  [DraftReviewStatus.REVISION_REQUESTED]: [DraftReviewStatus.SUBMITTED, DraftReviewStatus.REJECTED],
  [DraftReviewStatus.APPROVED]: [],
  [DraftReviewStatus.REJECTED]: [],
};

const SUBMISSION_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  [SubmissionStatus.DRAFT_CREATED]: [SubmissionStatus.SUBMITTED, SubmissionStatus.REJECTED],
  [SubmissionStatus.SUBMITTED]: [SubmissionStatus.APPROVED, SubmissionStatus.REVISION_REQUESTED, SubmissionStatus.REJECTED],
  [SubmissionStatus.REVISION_REQUESTED]: [SubmissionStatus.SUBMITTED, SubmissionStatus.REJECTED],
  [SubmissionStatus.APPROVED]: [SubmissionStatus.PROOF_SUBMITTED, SubmissionStatus.VERIFIED, SubmissionStatus.REJECTED],
  [SubmissionStatus.REJECTED]: [],
  [SubmissionStatus.PUBLISHED]: [SubmissionStatus.PROOF_SUBMITTED, SubmissionStatus.VERIFIED, SubmissionStatus.REJECTED],
  [SubmissionStatus.PROOF_SUBMITTED]: [SubmissionStatus.APPROVED, SubmissionStatus.VERIFIED, SubmissionStatus.REJECTED],
  [SubmissionStatus.VERIFIED]: [SubmissionStatus.SETTLED],
  [SubmissionStatus.SETTLED]: [],
};

const PROOF_TRANSITIONS: Record<ProofStatus, ProofStatus[]> = {
  [ProofStatus.PENDING]: [ProofStatus.VERIFIED, ProofStatus.REJECTED, ProofStatus.NEEDS_SUPPLEMENT],
  [ProofStatus.NEEDS_SUPPLEMENT]: [ProofStatus.PENDING, ProofStatus.REJECTED],
  [ProofStatus.VERIFIED]: [],
  [ProofStatus.REJECTED]: [],
};

const PUBLICATION_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  [PublicationStatus.PENDING_PUBLICATION]: [PublicationStatus.LINK_SUBMITTED, PublicationStatus.EXPIRED],
  [PublicationStatus.LINK_SUBMITTED]: [PublicationStatus.ACCEPTED, PublicationStatus.REJECTED, PublicationStatus.DISPUTED, PublicationStatus.EXPIRED],
  [PublicationStatus.ACCEPTED]: [PublicationStatus.DISPUTED],
  [PublicationStatus.REJECTED]: [PublicationStatus.RESUBMITTED, PublicationStatus.DISPUTED],
  [PublicationStatus.RESUBMITTED]: [PublicationStatus.ACCEPTED, PublicationStatus.REJECTED, PublicationStatus.DISPUTED],
  [PublicationStatus.DISPUTED]: [PublicationStatus.ACCEPTED, PublicationStatus.REJECTED, PublicationStatus.RESUBMITTED],
  [PublicationStatus.EXPIRED]: [PublicationStatus.DISPUTED],
};

const SETTLEMENT_TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  [SettlementStatus.NOT_ESCROWED]: [SettlementStatus.ESCROWED, SettlementStatus.CANCELLED],
  [SettlementStatus.ESCROWED]: [SettlementStatus.PAYABLE, SettlementStatus.PARTIALLY_SETTLED, SettlementStatus.REFUNDED, SettlementStatus.CANCELLED],
  [SettlementStatus.PAYABLE]: [SettlementStatus.PAID_TO_WALLET, SettlementStatus.PARTIALLY_SETTLED, SettlementStatus.REFUNDED],
  [SettlementStatus.PARTIALLY_SETTLED]: [SettlementStatus.PAID_TO_WALLET, SettlementStatus.REFUNDED],
  [SettlementStatus.PAID_TO_WALLET]: [],
  [SettlementStatus.REFUNDED]: [],
  [SettlementStatus.CANCELLED]: [],
};

function canTransition<T extends string>(transitions: Record<T, T[]>, from: T, to: T) {
  if (from === to) return true;
  return transitions[from]?.includes(to) ?? false;
}

function assertTransition<T extends string>(entity: string, transitions: Record<T, T[]>, from: T, to: T) {
  if (canTransition(transitions, from, to)) return;
  throw new Error(`Invalid ${entity} status transition: ${from} -> ${to}`);
}

export function canTransitionCampaign(from: CampaignStatus, to: CampaignStatus) {
  return canTransition(CAMPAIGN_TRANSITIONS, from, to);
}

export function assertCampaignTransition(from: CampaignStatus, to: CampaignStatus) {
  assertTransition("Campaign", CAMPAIGN_TRANSITIONS, from, to);
}

export function allowedCampaignTransitions(from: CampaignStatus) {
  return CAMPAIGN_TRANSITIONS[from] ?? [];
}

export function assertApplicationTransition(from: ApplicationStatus, to: ApplicationStatus) {
  assertTransition("Application", APPLICATION_TRANSITIONS, from, to);
}

export function assertDraftTransition(from: DraftStatus, to: DraftStatus) {
  assertTransition("Draft", DRAFT_TRANSITIONS, from, to);
}

export function assertDraftReviewTransition(from: DraftReviewStatus, to: DraftReviewStatus) {
  assertTransition("Draft review", DRAFT_REVIEW_TRANSITIONS, from, to);
}

export function assertSubmissionTransition(from: SubmissionStatus, to: SubmissionStatus) {
  assertTransition("Submission", SUBMISSION_TRANSITIONS, from, to);
}

export function assertProofTransition(from: ProofStatus, to: ProofStatus) {
  assertTransition("Proof", PROOF_TRANSITIONS, from, to);
}

export function assertPublicationTransition(from: PublicationStatus, to: PublicationStatus) {
  assertTransition("Publication", PUBLICATION_TRANSITIONS, from, to);
}

export function assertSettlementTransition(from: SettlementStatus, to: SettlementStatus) {
  assertTransition("Settlement", SETTLEMENT_TRANSITIONS, from, to);
}
