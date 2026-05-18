# AI Topic Cover Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate AI cover images for creator trend topic cards with `gpt-image-2`, while keeping the trend detail page fast and avoiding repeated image-generation cost.

**Architecture:** Topic recommendation AI will return cover-image prompts alongside title, reason, and angles. The trend detail page returns text recommendations immediately, then the client calls a separate image endpoint per card; the endpoint checks a database cache before calling the configured image model and saving the returned image through the existing upload storage.

**Tech Stack:** Next.js app router, Prisma/PostgreSQL, existing `PlatformSettings` AI config, existing upload storage abstraction, fetch-based OpenAI-compatible image endpoint calls.

---

### Task 1: Extend Recommendation Payload

**Files:**
- Modify: `src/lib/insights/analysis.ts`
- Modify: `src/lib/insights/recommendation-ai.ts`
- Modify: `src/lib/insights/creator-trend-detail.ts`

- [ ] Add `coverImagePrompt` and `coverNegativePrompt` optional fields to `RecommendationSummary` and `TopicCard`.
- [ ] Update the topic rewrite prompt output contract to request these fields.
- [ ] Map AI-returned cover prompts into recommendation cards while preserving original sample cover as fallback.

### Task 2: Add Image Cache Model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260519002000_creator_trend_topic_images/migration.sql`

- [ ] Create `CreatorTrendTopicImage` with a unique `cacheKey`, prompt metadata, model, status, image URL, and error message fields.
- [ ] Generate Prisma client after adding the model.

### Task 3: Add Generated Image Storage Helper

**Files:**
- Modify: `src/lib/storage.ts`

- [ ] Add a server-side helper that saves raw generated image bytes with a safe filename.
- [ ] Reuse existing local/S3 storage behavior so generated images follow the same deployment path as uploads.

### Task 4: Implement Image Generation Service

**Files:**
- Create: `src/lib/insights/topic-cover-images.ts`

- [ ] Resolve Admin-configured image model settings using `readInsightImageAiRuntimeConfig`.
- [ ] Build deterministic cache keys from source ID, title, prompt hash, and model.
- [ ] Call `{baseUrl}/images/generations` with `gpt-image-2`, decode `b64_json` or fetch returned URL, save bytes, and write the cache row.
- [ ] Return original sample cover when AI image generation is not configured or fails.

### Task 5: Add Creator API and Frontend Integration

**Files:**
- Create: `src/app/api/creator/trends/topic-image/route.ts`
- Modify: `src/components/creator-trend-detail-panels.tsx`

- [ ] Add an authenticated creator route that accepts source title, source content ID, platform, fallback cover, and prompts.
- [ ] In topic cards, request AI images only when a prompt exists.
- [ ] Show original cover while generating; replace with AI image URL when ready.
- [ ] Keep failures quiet in the card UI and fall back to the original cover.

### Task 6: Verify

**Commands:**
- `npm.cmd run prisma:generate`
- `npm.cmd run build`

- [ ] Confirm Prisma client generation succeeds.
- [ ] Confirm production build succeeds.
- [ ] Confirm no plaintext API key is written into source or migrations.
