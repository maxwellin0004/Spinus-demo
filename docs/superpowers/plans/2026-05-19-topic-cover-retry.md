# Topic Cover Retry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow failed AI topic cover images to be regenerated from both Admin and Creator pages.

**Architecture:** Keep the existing single-cover image endpoint and cache table. Add a client-side retry helper for Creator cards and a server action for Admin failed image rows, both rerunning the same stored prompt without changing the AI topic recommendation text.

**Tech Stack:** Next.js App Router route handlers and server actions, Prisma, existing `generateTopicCoverImage`, React client state.

---

### Task 1: Creator Failed Cover Retry

**Files:**
- Modify: `src/components/creator-trend-detail-panels.tsx`

- [ ] Extract the per-card image request into a reusable function.
- [ ] Add a failure-state button labeled `重新生成封面`.
- [ ] On click, stop event bubbling, set that card to `loading`, call `/api/creator/trends/topic-image`, then update the single card state to `ready` or `failed`.

### Task 2: Admin Failed Cover Queue

**Files:**
- Modify: `src/lib/actions.ts`
- Modify: `src/app/admin/insights/page.tsx`

- [ ] Add `regenerateTopicCoverImageAction(imageId, formData)` that requires Admin insight permission, loads the failed image row and platform AI settings, reruns `generateTopicCoverImage`, and revalidates Admin/Creator insight pages.
- [ ] Query recent `CreatorTrendTopicImage` failed rows on Admin insights.
- [ ] Render a compact failed-cover table with title, platform, error, updated time, and a `重新生成封面` button per row.

### Task 3: Verification

**Commands:**
- [ ] Run `npm.cmd run build`.
- [ ] Confirm TypeScript accepts the server action and client retry changes.
