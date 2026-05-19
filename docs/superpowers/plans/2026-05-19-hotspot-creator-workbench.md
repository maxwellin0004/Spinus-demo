# Hotspot Creator Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Creator hotspot workbench: desktop two-column creation workspace, improved script/image workflow, and AI publish review with image inspection and cached results.

**Architecture:** Keep the existing Creator trends data flow and script generation endpoints. Add a focused script review domain module plus API, a local workbench UI component layer, and refactor the script viewer so desktop can render as an inline workspace while mobile/Admin can still render full-panel/read-only views.

**Tech Stack:** Next.js App Router, React client components, Prisma/PostgreSQL, Tailwind CSS, Radix Tabs/Tooltip, Sonner toast, existing insight AI gateway helpers.

---

### Task 1: Dependencies And Schema

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260519043000_creator_trend_script_reviews/migration.sql`

- [ ] **Step 1: Install light UI dependencies**

Run:

```powershell
npm.cmd install @radix-ui/react-tabs @radix-ui/react-tooltip sonner
```

Expected: package files updated with the three dependencies.

- [ ] **Step 2: Add `CreatorTrendScriptReview` to Prisma**

Add this relation to `CreatorTrendScriptGeneration`:

```prisma
scriptReviews          CreatorTrendScriptReview[]
```

Add this model:

```prisma
model CreatorTrendScriptReview {
  id                 String                       @id @default(cuid())
  scriptGenerationId String
  scriptGeneration   CreatorTrendScriptGeneration @relation(fields: [scriptGenerationId], references: [id], onDelete: Cascade)
  model              String
  inputHash          String
  status             String                       @default("READY")
  score              Int?
  summary            String?
  checksJson         Json?
  imageFindingsJson  Json?
  riskItemsJson      Json?
  suggestionsJson    Json?
  rawResponseJson    Json?
  errorMessage       String?
  createdAt          DateTime                     @default(now())
  updatedAt          DateTime                     @updatedAt

  @@unique([scriptGenerationId, inputHash, model])
  @@index([scriptGenerationId, updatedAt])
  @@index([status, updatedAt])
}
```

- [ ] **Step 3: Add SQL migration**

Create `prisma/migrations/20260519043000_creator_trend_script_reviews/migration.sql` with the SQL equivalent of the model above.

- [ ] **Step 4: Verify Prisma**

Run:

```powershell
npx.cmd prisma format
npx.cmd prisma generate
```

Expected: both commands succeed.

### Task 2: AI Publish Review Domain Module

**Files:**
- Create: `src/lib/insights/script-review.ts`
- Modify: `src/lib/insights/script-tables.ts`
- Modify: `src/lib/insights/trend-script-generation.ts`

- [ ] **Step 1: Define review view types**

Add exported `ScriptReviewView`, `ScriptReviewCheck`, `ScriptReviewImageFinding`, and `ScriptReviewRiskItem` types to `script-tables.ts`. Status values are `PASS | WARNING | FAIL`; review status values are `GENERATING | READY | FAILED`.

- [ ] **Step 2: Implement input hashing and stale detection**

In `script-review.ts`, export:

```ts
export function buildScriptReviewInput(script, images): ScriptReviewInput
export function hashScriptReviewInput(input: ScriptReviewInput, model: string): string
export function scriptReviewToView(review, currentInputHash: string): ScriptReviewView
```

The hash must include script tables/plain text, image URLs/statuses/prompts, platform, and model.

- [ ] **Step 3: Implement visual input preparation**

In `script-review.ts`, support image URL inputs first. If a generated image URL starts with `/`, read `public/<url>` and convert it to a base64 data URL before sending to the gateway.

- [ ] **Step 4: Implement AI request**

Use existing `readInsightAiRuntimeConfig`, `postJson`, and `formatInsightAi...` helpers. Request strict JSON from `/chat/completions` with text plus image inputs. Store raw response and parsed fields.

- [ ] **Step 5: Include latest reviews in `scriptGenerationToView`**

Extend the view conversion so `ScriptGenerationView` includes `scriptReviews`, sorted newest first.

### Task 3: Review API

**Files:**
- Create: `src/app/api/creator/trends/scripts/review/route.ts`
- Modify: `src/app/admin/insights/script-generations/[id]/page.tsx`
- Modify: `src/app/api/creator/trends/scripts/lookup/route.ts`
- Modify: `src/app/api/creator/trends/scripts/generate/route.ts`

- [ ] **Step 1: Add creator-owned GET endpoint**

`GET /api/creator/trends/scripts/review?scriptGenerationId=...` loads the creator-owned script, latest review, current input hash, and returns `{ review, stale }`.

- [ ] **Step 2: Add creator-owned POST endpoint**

`POST /api/creator/trends/scripts/review` accepts `{ scriptGenerationId, force }`. If not forced and cache matches, return cached review. Otherwise create/update a generating row, call AI review, store success/failure, and return the latest view.

- [ ] **Step 3: Include images/reviews in script view queries**

Update lookup, generate response, and Admin detail queries to include `scriptImages` and `scriptReviews`.

### Task 4: Workbench UI Component Layer

**Files:**
- Create: `src/components/workbench-ui.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add local wrappers**

Create `WorkbenchButton`, `WorkbenchTabs`, `WorkbenchProgress`, `WorkbenchTooltip`, `WorkbenchStatusBadge`, and `WorkbenchEmptyState`.

- [ ] **Step 2: Add toast provider**

Add `<Toaster />` from `sonner` to the root app layout body.

### Task 5: Script Workspace Refactor

**Files:**
- Modify: `src/components/script-generation-viewer.tsx`

- [ ] **Step 1: Extract workspace component**

Keep `ScriptGenerationDrawer` for mobile/fullscreen use. Add `ScriptGenerationWorkspace` that renders the same script record inline.

- [ ] **Step 2: Add workflow progress**

Compute progress from script status, image ready count, latest review status, and review pass/fail status.

- [ ] **Step 3: Reorganize tabs**

Use `WorkbenchTabs` for `摘要`, `图片`, `表格`, `发布检查`. Default to `摘要`; switch to `图片` when image generation starts.

- [ ] **Step 4: Enhance image UI**

Show immediate generating cards, aggregate progress, per-card retry, failure detail, and toast outcomes.

- [ ] **Step 5: Add publish review tab**

Render review empty/loading/success/stale/failure states and a manual `AI 检查发布风险` button.

### Task 6: Creator Trends Two-Column Workbench

**Files:**
- Modify: `src/components/creator-trend-detail-panels.tsx`
- Modify: `src/app/creator/trends/page.tsx`

- [ ] **Step 1: Keep active script open inline on desktop**

When a script opens or is generated, set it as active workspace content. Desktop renders it in a sticky right column.

- [ ] **Step 2: Preserve full-screen mobile panel**

Mobile uses the existing drawer/fullscreen pattern and the same `ScriptGenerationWorkspace` internals.

- [ ] **Step 3: Add desktop empty state**

When no script is active, show a right-column empty state explaining the creation flow.

### Task 7: Verification

**Files:**
- No source files expected unless fixing issues.

- [ ] **Step 1: Run static checks**

```powershell
npx.cmd prisma format
npx.cmd prisma generate
npm.cmd run lint
npm.cmd run build
```

Expected: no build errors. Existing warnings may remain if unrelated.

- [ ] **Step 2: Browser check**

Start the app and verify:

- desktop `/creator/trends` shows two-column workbench
- mobile viewport opens script workspace full-screen
- image generation cards show progress
- publish review tab shows empty and loading states
- Admin detail shows read-only images/review

## Self-Review

- Spec coverage: layout, component layer, image generation, AI visual review, cache, Admin read-only, errors, and verification are covered.
- Placeholder scan: no TBD/TODO placeholders are used.
- Type consistency: review status and check status values are defined once and reused by API/UI tasks.
