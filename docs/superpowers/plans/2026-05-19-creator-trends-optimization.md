# Creator Trends Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the creator trends page into a guided `发现热点 -> AI 选题 -> 爆款拆解 -> 生成脚本` workflow while preserving the existing analytics workbench.

**Architecture:** Keep `src/app/creator/trends/page.tsx` as the Server Component that loads overview, trend, and saved-trend data. Keep interactive recommendation, cover, script, and saved-pool behavior inside the existing `"use client"` detail component so the detail API is not duplicated. Add small presentational helpers inside the existing client component first; split into a new file only if the component becomes harder to read after the patch.

**Tech Stack:** Next.js 16 App Router, React 19 Server/Client Components, TypeScript, Tailwind CSS utilities, lucide-react icons, existing Prisma-backed server data and creator trend APIs.

---

## File Structure

- Modify `src/app/creator/trends/page.tsx`
  - Keep auth, filter normalization, and server data loading.
  - Adjust nav labels and page ordering.
  - Keep the server/client boundary unchanged.

- Modify `src/components/creator-trends-interactive.tsx`
  - Retitle `CreatorTrendHotTopics` as a decision-support workbench area.
  - Improve empty state copy and responsive row/card stability.
  - Keep existing filter context and URL behavior.

- Modify `src/components/creator-trend-detail-panels.tsx`
  - Add the first-screen workflow hero inside the existing detail component to reuse the same detail request and cache.
  - Reorder recommendation card actions so `生成脚本` is primary.
  - Clarify recommendation, AI cover, detail, failure, and empty states.
  - Keep `ScriptGenerationDrawer` unchanged except for any prop compatibility needed by existing calls.

- Reference `docs/RESPONSIVE_UI.md`
  - Use `min-w-0`, `minmax(0, ...)`, local overflow containers, `text-horizontal`, and horizontally scrollable chip rows where needed.

- Reference `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - `searchParams` is a Promise in Server Component pages.

- Reference `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - Keep database and secrets in Server Components/server modules.
  - Keep state, effects, browser APIs, and event handlers in Client Components.

- Reference `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`
  - Existing native `window.history.replaceState` usage is valid and integrates with the router.

---

### Task 1: Preserve Next.js Boundaries And Reframe Page Shell

**Files:**
- Modify: `src/app/creator/trends/page.tsx`
- Verify: `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- Verify: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

- [ ] **Step 1: Confirm the page remains a Server Component**

Keep `src/app/creator/trends/page.tsx` without a `"use client"` directive. The page must continue loading creator auth, Prisma data, and overview records on the server.

Expected invariant:

```tsx
export default async function CreatorTrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; rec?: string; platform?: string; range?: string; direction?: string; scenario?: string; keyword?: string; filter?: string; pool?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const [{ batch, rec, platform, range, direction, scenario, keyword, filter, pool }, creatorPreference] = await Promise.all([
    searchParams,
    prisma.creatorProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true, insightDirection: true },
    }),
  ]);
}
```

- [ ] **Step 2: Update navigation labels to match the workflow**

Replace the current `navItems` labels with the workflow vocabulary while keeping the existing anchors.

Use:

```tsx
const navItems = [
  { label: "创作路径", href: "#workflow" },
  { label: "趋势判断", href: "#hot-topics" },
  { label: "AI 选题", href: "#topic-recommendations" },
  { label: "爆款拆解", href: "#case-study" },
  { label: "脚本生成", href: "#task-flow" },
  { label: "选题池", href: "#task-flow" },
];
```

- [ ] **Step 3: Keep search first, move workflow before analytics**

Keep `CreatorTrendSearch` at the top of `<main>`, then render the compact data-source summary, then render `CreatorTrendDetailPanels`, then render `CreatorTrendHotTopics`.

Target order:

```tsx
<main className="space-y-5 p-4 sm:p-6 lg:p-8">
  <CreatorTrendSearch />

  <section className={cn(cardClass, "flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between")}>
    {/* existing compact data-source summary */}
  </section>

  <CreatorTrendDetailPanels
    initialBatch={batch}
    initialRec={rec}
    initialPool={pool}
    savedTrends={savedTrends.map((item) => ({
      id: item.id,
      title: item.title,
      topic: item.topic,
      platform: item.platform,
      status: item.status,
      reason: item.reason,
      updatedAt: item.updatedAt.toISOString(),
    }))}
  />

  <CreatorTrendHotTopics
    key={`${filters.direction}:${filters.platform}:${filters.range}:${filters.keyword}`}
    trendData={trendDataSource}
    topicRows={mergedTopicRows}
    trendSource={trendSource}
    topicSource={topicSource}
  />
</main>
```

- [ ] **Step 4: Keep metric cards out of the first-screen path**

Remove or demote the metric-card grid from the first screen. If metrics are retained, place them after the workflow or convert them into compact badges in the data-source summary. Do not keep the four large cards above `CreatorTrendDetailPanels`.

- [ ] **Step 5: Run TypeScript-aware lint after shell edits**

Run:

```powershell
npm.cmd run lint
```

Expected: no syntax or lint failures introduced by the page-shell changes.

---

### Task 2: Add Workflow Hero Inside Existing Detail Component

**Files:**
- Modify: `src/components/creator-trend-detail-panels.tsx`

- [ ] **Step 1: Add workflow-step and status helpers near existing helpers**

Add these helpers near `SourceBadge`, `PlatformBadge`, and `savedStatusLabel`:

```tsx
const workflowSteps = [
  { label: "发现热点", hint: "筛选方向和平台" },
  { label: "AI 选题", hint: "挑选可执行角度" },
  { label: "爆款拆解", hint: "确认内容结构" },
  { label: "生成脚本", hint: "进入图文/视频生产" },
];

function recommendationStatusLabel(data: CreatorTrendDetailData | null, loading: boolean, error: string | null) {
  if (loading) return "AI 选题加载中";
  if (error) return "AI 选题加载失败";
  if (!data) return "暂无 AI 选题";
  if (data.recommendationStatus === "FAILED") return "AI 选题生成失败";
  if (data.recommendationStatus === "PARTIAL") return "AI 选题补全中";
  if (data.recommendationNeedsRefresh) return "AI 选题建议刷新";
  return "AI 选题已就绪";
}
```

- [ ] **Step 2: Add a reusable primary topic action renderer**

Refactor existing `scriptButtons(...)` usage so cards can render a primary script button first. Keep the existing `generateScript` function and script record lookup behavior unchanged.

Target shape:

```tsx
function primaryScriptAction(payload: ScriptGeneratePayload) {
  const key = scriptRecordKey(payload.sourceType, payload.sourceKey);
  const existing = scriptRecords[key];
  const busy = generatingScriptKey === key;

  if (existing?.status === "READY") {
    return (
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800" type="button" onClick={() => setOpenScriptRecord(existing)}>
        <FileText size={16} />
        查看脚本
      </button>
    );
  }

  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      disabled={busy}
      onClick={() => generateScript(payload)}
    >
      {busy ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
      {busy ? "生成中" : "生成脚本"}
    </button>
  );
}
```

- [ ] **Step 3: Add `WorkflowHero` as an inner component**

Create an inner component inside `CreatorTrendDetailPanels` so it can access `data`, `loading`, `detailError`, `activeRecommendations`, `scriptRecords`, `generateScript`, `topicCoverNode`, `setRec`, `setFilters`, and saved action forms without prop drilling.

Use this structure:

```tsx
function WorkflowHero() {
  const status = recommendationStatusLabel(data, loading, detailError);
  const heroRecommendations = activeRecommendations.slice(0, 3);

  return (
    <section id="workflow" className={cn("scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", loading && "opacity-80")}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">创作路径</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">从热点到脚本，一步步完成今天的内容</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            当前方向：{currentDirection.label} · 平台：{platformDisplay(filters.platform)} · 关键词：{filters.keyword.trim() || "全部热点"}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-700">
          {status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {workflowSteps.map((step, index) => (
          <div key={step.label} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{index + 1}</span>
              <p className="text-horizontal whitespace-nowrap text-sm font-black text-slate-950">{step.label}</p>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{step.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {heroRecommendations.length > 0 ? heroRecommendations.map((item) => (
          <article key={`hero-${item.id ?? item.title}`} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {topicCoverNode(item, "h-36", "(min-width: 1024px) 33vw, 100vw")}
            <div className="mt-3 flex items-start justify-between gap-2">
              <h2 className="line-clamp-2 text-base font-black text-slate-950">{item.title}</h2>
              <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", stageClass(item.stage))}>{item.stage}</span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{item.reason}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-black">
              <span className={cn("rounded-md border px-2 py-1", confidenceClass(item.confidence))}>{item.confidence ?? "示例数据"}</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">热度 {item.heat}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {primaryScriptAction({
                ...topicScriptSource(item),
                sourceTitle: item.title,
                platform: item.platform ?? item.tags[1] ?? filters.platform,
                platformLabel: item.platform ?? item.tags[1] ?? platformDisplay(filters.platform),
                directionLabel: currentDirection.label,
                topic: item,
              })}
              <div className="grid grid-cols-2 gap-2">
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:text-slate-950" type="button" onClick={() => setRec(item.id ?? item.sampleSourceContentId ?? item.title)}>
                  查看拆解
                </button>
                <form action={saveCreatorTrendAction}>
                  <input name="title" type="hidden" value={item.title} />
                  <input name="topic" type="hidden" value={item.keyword ?? item.title} />
                  <input name="platform" type="hidden" value={item.platform ?? item.tags[1] ?? ""} />
                  <input name="reason" type="hidden" value={item.reason} />
                  <input name="sourceContentId" type="hidden" value={item.sampleSourceContentId ?? item.id ?? ""} />
                  <input name="sourceUrl" type="hidden" value={item.sampleContentUrl ?? ""} />
                  <button className="w-full rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100" type="submit">
                    加入选题池
                  </button>
                </form>
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500 lg:col-span-3">
            {detailError ? formatAiErrorForUser(detailError) : "当前筛选下暂无 AI 选题，试试切换平台、清空关键词，或重新生成推荐。"}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Render `WorkflowHero` before the detailed recommendation section**

In the returned fragment from `CreatorTrendDetailPanels`, render:

```tsx
<>
  <WorkflowHero />
  <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
    {/* existing topic recommendations, case study, task flow */}
  </section>
  <ScriptGenerationDrawer ... />
</>
```

- [ ] **Step 5: Run lint after adding hero**

Run:

```powershell
npm.cmd run lint
```

Expected: no hook-order errors, no unused imports, no TypeScript syntax failures.

---

### Task 3: Reorder AI Recommendation Card Actions And Improve States

**Files:**
- Modify: `src/components/creator-trend-detail-panels.tsx`

- [ ] **Step 1: Update detailed recommendation card button order**

In the existing recommendation card loop, put `primaryScriptAction(...)` before the save form or make it visually primary. Keep `加入选题池` as a secondary action.

Target action area:

```tsx
<div className="mt-3 grid gap-2">
  {primaryScriptAction({
    ...topicScriptSource(item),
    sourceTitle: item.title,
    platform: item.platform ?? item.tags[1] ?? filters.platform,
    platformLabel: item.platform ?? item.tags[1] ?? platformDisplay(filters.platform),
    directionLabel: currentDirection.label,
    topic: item,
  })}
  <div className="grid grid-cols-2 gap-2">
    <button className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-black text-slate-600 transition hover:text-slate-950" type="button" onClick={() => setRec(item.id ?? item.sampleSourceContentId ?? item.title)}>
      查看拆解
    </button>
    <form action={saveCreatorTrendAction}>
      {/* existing hidden inputs */}
      <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100" type="submit">
        <Save size={14} />
        加入选题池
      </button>
    </form>
  </div>
</div>
```

- [ ] **Step 2: Make detail failure state actionable**

Replace the generic empty recommendation message with:

```tsx
<div className="flex h-48 min-w-96 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm font-semibold text-slate-500">
  <p>{detailError ? formatAiErrorForUser(detailError) : "当前筛选下暂无 AI 选题。"}</p>
  <div className="flex flex-wrap justify-center gap-2">
    <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600" type="button" onClick={() => setFilters({ keyword: "" }, "#topic-recommendations", { navigate: false })}>
      清空关键词
    </button>
    <button className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700" type="button" onClick={() => regenerateRecommendations()}>
      重新生成推荐
    </button>
  </div>
</div>
```

If the existing regenerate function is not named `regenerateRecommendations`, use the current function that powers the existing regenerate button. Do not introduce a second regenerate API call.

- [ ] **Step 3: Clarify AI cover labels**

Keep `topicCoverNode` behavior, but update visible labels:

```tsx
{status === "failed" ? <span>AI 封面生成失败</span> : null}
{status === "loading" ? <span>AI 封面生成中</span> : null}
```

Keep retry text:

```tsx
重新生成封面
```

- [ ] **Step 4: Keep selected detail CTA visible**

Inside `selectedRecommendation` detail, add a primary script action near the existing sample/source buttons:

```tsx
<div className="flex flex-wrap gap-3">
  {primaryScriptAction({
    ...topicScriptSource(selectedRecommendation),
    sourceTitle: selectedRecommendation.title,
    platform: selectedRecommendation.platform ?? selectedRecommendation.tags[1] ?? filters.platform,
    platformLabel: selectedRecommendation.platform ?? selectedRecommendation.tags[1] ?? platformDisplay(filters.platform),
    directionLabel: currentDirection.label,
    topic: selectedRecommendation,
  })}
  {/* existing source link and sample id */}
</div>
```

- [ ] **Step 5: Run lint**

Run:

```powershell
npm.cmd run lint
```

Expected: no unused helper or duplicate function errors.

---

### Task 4: Reframe Trend Chart And Hot-Topic Table As Decision Support

**Files:**
- Modify: `src/components/creator-trends-interactive.tsx`

- [ ] **Step 1: Retitle the trend section**

In `CreatorTrendHotTopics`, replace:

```tsx
<h2 className="text-xl font-black">适合我的热点趋势</h2>
```

with:

```tsx
<div>
  <h2 className="text-xl font-black">判断这个热点值不值得追</h2>
  <p className="mt-1 text-xs font-semibold text-slate-500">先看趋势升温，再决定进入选题和脚本。</p>
</div>
```

- [ ] **Step 2: Retitle the ranking section**

Replace:

```tsx
<h2 className="text-xl font-black">热点匹配度排行</h2>
```

with:

```tsx
<div>
  <h2 className="text-xl font-black">热点匹配度排行</h2>
  <p className="mt-1 text-xs font-semibold text-slate-500">按匹配度、可信度和创作难度筛掉不值得做的热点。</p>
</div>
```

- [ ] **Step 3: Improve empty state actions**

Replace the current empty table text with a compact action block:

```tsx
<td className="px-3 py-8 text-center text-sm font-semibold text-slate-400" colSpan={9}>
  <div className="flex flex-col items-center gap-3">
    <p>当前筛选暂无可展示热点。</p>
    <div className="flex flex-wrap justify-center gap-2">
      <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600" type="button" onClick={() => setFilters({ keyword: "" }, "#hot-topics", { navigate: false })}>
        清空关键词
      </button>
      <button className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700" type="button" onClick={() => setLocalPlatform("all")}>
        查看全部平台
      </button>
    </div>
  </div>
</td>
```

- [ ] **Step 4: Verify responsive guardrails in this component**

Check the section root and children keep:

```tsx
<section id="hot-topics" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
  <div className="min-w-0 ...">
  <div className="min-w-0 overflow-hidden ...">
```

Do not remove `min-w-0`, `overflow-hidden`, or the table's `max-w-full overflow-auto` container.

- [ ] **Step 5: Run lint**

Run:

```powershell
npm.cmd run lint
```

Expected: no lint failures.

---

### Task 5: Final Build And Browser Verification

**Files:**
- Verify: `src/app/creator/trends/page.tsx`
- Verify: `src/components/creator-trends-interactive.tsx`
- Verify: `src/components/creator-trend-detail-panels.tsx`

- [ ] **Step 1: Run production build**

Run:

```powershell
npm.cmd run build
```

Expected: Next.js build succeeds. If the build fails because existing unrelated dirty worktree changes are broken, capture the exact error and determine whether it is in the files touched by this plan.

- [ ] **Step 2: Start the local dev server**

Run:

```powershell
npm.cmd run dev
```

Expected: Next.js serves the app, typically at `http://localhost:3000` or the next available port.

- [ ] **Step 3: Open `/creator/trends` in the in-app browser**

Use Browser plugin navigation to open:

```text
http://localhost:3000/creator/trends
```

Expected:

- Search and filters are visible.
- Workflow hero is visible before the trend chart.
- Three AI topic cards show when detail data is ready.
- Empty/error states show an actionable message when detail data is missing.

- [ ] **Step 4: Check desktop layout**

At 1440px width:

- Header nav stays horizontal.
- Workflow cards fit in three columns.
- Trend chart and ranking table appear below the workflow.
- No visible body-level horizontal overflow.

- [ ] **Step 5: Check mobile layout**

At 390px width:

- Header filters and chips scroll horizontally.
- Workflow cards stack vertically.
- Chinese labels do not wrap one character per line.
- Tables scroll inside their own containers.
- Script drawer still opens full width when invoked.

- [ ] **Step 6: Check core interactions**

Manually verify:

- Change platform, range, direction, and keyword.
- Click a hero card `生成脚本`.
- Click a detailed card `生成脚本`.
- Click `查看拆解`.
- Click `加入选题池`.
- Retry an AI cover if a card shows failed state.
- Confirm the script drawer opens for a ready script record or after generation succeeds.

- [ ] **Step 7: Inspect git diff**

Run:

```powershell
git diff -- src/app/creator/trends/page.tsx src/components/creator-trends-interactive.tsx src/components/creator-trend-detail-panels.tsx
```

Expected: changes are limited to the approved optimization scope.

- [ ] **Step 8: Stage and commit only this feature's files if requested**

Run only after verification and only include files touched by this work:

```powershell
git add -- src/app/creator/trends/page.tsx src/components/creator-trends-interactive.tsx src/components/creator-trend-detail-panels.tsx docs/superpowers/plans/2026-05-19-creator-trends-optimization.md
git commit -m "feat: optimize creator trends workflow"
```

Expected: commit contains the implementation plan and the hotspot page optimization only.

---

## Self-Review

- Spec coverage: The plan covers workflow hero, page ordering, AI recommendation states, cover states, primary script CTA, trend workbench framing, responsive rules, and low-risk performance constraints.
- Placeholder scan: The plan contains no `TBD`, `TODO`, or unspecified future work.
- Type consistency: The plan uses existing types and helpers from `creator-trend-detail-panels.tsx`: `CreatorTrendDetailData`, `TopicCard`, `ScriptGeneratePayload`, `scriptRecordKey`, `topicScriptSource`, `platformDisplay`, `topicCoverNode`, and `generateScript`.
- Scope check: The plan avoids database, API, AI generation algorithm, and script drawer rewrites.
