# Tanglin Rd / 小黄雀联盟

AI Creator Campaign Platform connecting three roles:

- `Admin`: manages brands, creators, campaigns, submissions, proofs, settlement, compliance, reports.
- `Brand`: creates campaigns, uploads assets, reviews creator content, views campaign reports.
- `Creator`: completes profile, applies to tasks, uses AI Content Studio, submits content/proof, receives wallet earnings.

## Architecture

- `src/app`: Next.js App Router routes for public, auth, admin, brand, creator, and API/CSV endpoints.
- `src/lib`: Prisma client, JWT auth, RBAC actions, audit logging, compliance checks, AI provider, storage helpers.
- `src/components`: shared shell, cards, forms, tables, report chart, notification inbox.
- `prisma/schema.prisma`: PostgreSQL schema with Prisma 7 config in `prisma.config.ts`.
- `prisma/seed.ts`: test data for the full Brand → Admin → Creator → Proof → Wallet → Report loop.

## Core Data Model

Main tables:

`User`, `BrandProfile`, `CreatorProfile`, `SocialAccount`, `Campaign`, `CampaignAsset`, `CampaignTask`, `TaskApplication`, `ContentDraft`, `Submission`, `SubmissionReview`, `Proof`, `MetricsSnapshot`, `Wallet`, `WalletTransaction`, `WithdrawalRequest`, `Invoice`, `Notification`, `AuditLog`, `ComplianceRule`, `RiskFlag`, `Dispute`.

Important status enums:

`CampaignStatus`: `DRAFT`, `PENDING_REVIEW`, `REJECTED`, `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`.

`SubmissionStatus`: `DRAFT_CREATED`, `SUBMITTED`, `REVISION_REQUESTED`, `APPROVED`, `REJECTED`, `PUBLISHED`, `PROOF_SUBMITTED`, `VERIFIED`, `SETTLED`.

`WalletTxType`: `EARNING`, `WITHDRAWAL`, `ADJUSTMENT`, `FREEZE`, `UNFREEZE`.

## Local Setup

PostgreSQL is expected at `DATABASE_URL`.

```bash
npm install
createdb tanglin_rd
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Test accounts:

- `admin@test.com / password123`
- `brand@test.com / password123`
- `creator@test.com / password123`

## Verification

```bash
npx prisma validate
npx prisma migrate dev
npm run prisma:seed
npm run lint
npm run build
```

The AI provider uses `OPENAI_API_KEY` when present and falls back to deterministic mock generation when missing.
