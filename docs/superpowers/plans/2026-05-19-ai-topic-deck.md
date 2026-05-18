# AI Topic Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace rewritten hot-post cards with cached 12-card AI topic decks and generated AI covers.

**Architecture:** Add a database-backed AI topic deck cache keyed by direction, platform, keyword, and hot-post sample signature. Detail reads cached decks or generates one 12-card deck, while a POST route force-regenerates the same deck and returns updated detail data. Cover images continue through the existing image cache but no longer fall back to hot-post images in the UI.

**Tech Stack:** Next.js 16 route handlers, React client component, Prisma/Postgres, existing Lingtrue/OpenAI-compatible chat and image APIs.

---

### Task 1: Data Model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260519013000_creator_trend_ai_topic_decks/migration.sql`

- [ ] Add `CreatorTrendAiTopicDeck` with cache key, filters, sample signature, model, JSON items, status, and error fields.
- [ ] Add indexes for filter lookup and status debugging.

### Task 2: AI Deck Service

**Files:**
- Create: `src/lib/insights/ai-topic-deck.ts`
- Modify: `src/lib/insights/ai-prompts.ts`

- [ ] Define the AI output contract for 12 topic cards.
- [ ] Compute a stable sample signature from hot-post ids.
- [ ] Read a ready cached deck when the signature matches.
- [ ] On cache miss or force regeneration, call the text model once and validate 12 usable cards.
- [ ] Store failed generations explicitly instead of returning rule cards as AI.

### Task 3: Detail Integration

**Files:**
- Modify: `src/lib/insights/creator-trend-detail.ts`

- [ ] Replace per-batch rule rewrite with one 12-card AI deck generation.
- [ ] Split the deck into 4 batches of 3 cards.
- [ ] Add recommendation status and error fields to the detail payload.
- [ ] Keep hot-post metadata as evidence fields only.

### Task 4: Regenerate API

**Files:**
- Create: `src/app/api/creator/trends/recommendations/regenerate/route.ts`

- [ ] Require creator role.
- [ ] Normalize direction, platform, and keyword.
- [ ] Force-regenerate the full 12-card deck.
- [ ] Return updated detail data to the client.

### Task 5: Frontend Behavior

**Files:**
- Modify: `src/components/creator-trend-detail-panels.tsx`

- [ ] Render 3-card batches from the 12-card deck.
- [ ] Add a "重新生成 AI 选题" button.
- [ ] Clear local image request state after regeneration.
- [ ] Show AI cover loading/failure placeholders instead of hot-post image fallback.
- [ ] Show AI generation failure with the regenerate button.

### Task 6: Verification

**Commands:**
- `npm.cmd run prisma:generate`
- `npx.cmd prisma migrate deploy`
- `npm.cmd run build`

- [ ] Confirm the app builds and routes compile.
- [ ] Confirm no plaintext API keys were added.
