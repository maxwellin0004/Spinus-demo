# Creator Trends Optimization Design

## Goal

Optimize the creator hot-trends page around the main workflow:

`发现热点 -> AI 选题 -> 爆款拆解 -> 生成脚本`

The page should help creators move from trend discovery to script generation faster, while keeping the existing professional trend-analysis tools available below the first screen.

## Priorities

- Improve information architecture.
- Improve visual hierarchy and product polish.
- Increase conversion from trend browsing to script generation.
- Improve perceived performance and state clarity without a large architecture rewrite.

## Chosen Approach

Use a hybrid design: a guided creation workflow at the top, followed by a denser professional workbench.

This keeps the existing data and AI capabilities, but changes the first impression from "analytics dashboard" to "content creation path." The main call to action is `生成脚本`; secondary actions are `查看拆解` and `加入选题池`.

## Page Structure

### Header And Filters

Keep the existing sticky header, navigation, and filters:

- Time range
- Platform
- Direction
- Scenario
- Keyword search

The header should stay compact and horizontally scrollable on small screens. Filtering should preserve the current URL parameter model.

### Workflow Hero

Add a first-screen workflow area below search and filters.

It should show:

- Current filter scope.
- Data source, confidence, update time, and sample summary in compact badges.
- A four-step workflow indicator: `发现热点`, `AI 选题`, `爆款拆解`, `生成脚本`.
- Three primary AI topic recommendation cards for the active scope.

Each recommendation card should include:

- AI cover state.
- Topic title.
- Recommendation reason.
- Heat or potential score.
- Confidence and sample/update metadata.
- Tags/platform labels.
- Primary button: `生成脚本`.
- Secondary buttons: `查看拆解`, `加入选题池`.

The first screen should make the next action obvious without removing analytical depth.

### Professional Workbench

Below the workflow hero, keep and reorganize the existing capabilities:

1. `趋势与热点榜`
   - Trend chart and hot-topic match table.
   - Purpose: decide whether a trend is worth following.

2. `AI 选题推荐`
   - Batches, regenerate action, recommendation details, cover generation state.
   - Purpose: compare and select creation angles.

3. `爆款案例拆解`
   - Case-study evidence and reusable patterns.
   - Purpose: explain why an angle works before script generation.

4. `选题池与脚本`
   - Saved trends, draft pool, existing generated script records, and script drawer.
   - Purpose: continue execution after selection.

## Component Design

### `CreatorTrendsPage`

Continue to own server-side data loading:

- Overview metrics.
- Trend series.
- Hot-topic rows.
- Saved trends.
- Initial filter normalization.

It should render the page shell, header, search/filter controls, compact data-source summary, and pass relevant props to client components.

### `CreatorTrendWorkflowHero`

Add a lightweight component for the first-screen workflow summary.

Preferred implementation: render it from the same client detail data already used by `CreatorTrendDetailPanels`, or place it inside that client component so the detail API is not requested twice.

Responsibilities:

- Render the workflow indicator.
- Render the active top three recommendation cards.
- Surface loading, partial, failed, and refresh-needed states.
- Provide primary script-generation actions.

### `CreatorTrendHotTopics`

Keep this component for the trend chart and hot-topic table, but place it in the workbench section.

Design adjustments:

- Title and helper copy should frame the section as decision support.
- Maintain table containment and horizontal scrolling.
- Keep local range/platform controls stable.

### `CreatorTrendDetailPanels`

Keep this component as the main client-side AI recommendation and execution area.

Adjustments:

- Reorder recommendation card actions: `生成脚本`, `查看拆解`, `加入选题池`.
- Make selected recommendation details easier to scan.
- Keep the existing script drawer for generated output.
- Keep recommendation batching, regeneration, detail cache, and inflight request merging.
- Keep cover image generation per card, with clearer state labels and retry affordance.

### `ScriptGenerationDrawer`

No structural rewrite.

It remains the place for full script tables, regeneration controls, and copy actions. This avoids heavy table rendering in the first screen.

## Data Flow

Server-side page load:

1. Authenticate creator.
2. Normalize filters from URL.
3. Load overview, trend rows, trend series, daily snapshot, Xiaohongshu opportunities, and saved trends.
4. Render the page shell and workbench.

Client-side detail load:

1. `CreatorTrendDetailPanels` builds a request key from direction, platform, and debounced keyword.
2. It reads local cache or joins an inflight detail request.
3. It fetches `/api/creator/trends/detail`.
4. It renders recommendation batches, case study, watch pool, and draft pool.
5. Visible recommendation cards request AI covers independently.
6. Script lookup runs for visible recommendation and case-study sources.
7. `生成脚本` posts to the existing script generation flow and opens the drawer on success.

No new API is required for this optimization unless implementation discovers duplicated client requests that cannot be avoided cleanly.

## State And Error Handling

### Page Data

Show source, confidence, update time, and sample summary in compact badges. Fallback/example data should be clearly labeled.

### AI Recommendations

Represent these states clearly:

- Loading.
- Ready.
- Partial.
- Failed.
- Needs refresh.

Failure states should show a clear regenerate action instead of silently displaying fake recommendation cards.

### AI Covers

Each card owns its own cover state:

- Generating.
- Ready.
- Failed with retry.

Failed cover generation should not block script generation.

### Script Generation

The script button should show a generating state for the active item. On success, open the existing drawer. On failure, show the error near the action area.

### Empty Results

For empty filtered results, offer concrete next actions:

- Clear keyword.
- Switch platform.
- Switch direction.
- Regenerate AI recommendations.

## Performance And Stability

Use low-risk improvements only:

- Preserve existing detail cache and inflight request merging.
- Preserve keyword debounce.
- Avoid rendering large script tables outside the drawer.
- Keep stable heights for loading cards to reduce layout shift.
- Use local loading states instead of making the page feel like it fully reloads.
- Keep wide tables inside scroll containers.
- Follow `docs/RESPONSIVE_UI.md`.

Do not perform database, API, or state-management rewrites as part of this pass.

## Responsive Requirements

The page must work at:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px
- 1600px

Pass criteria:

- No short Chinese label wraps one character per line.
- No unintended body-level horizontal scroll.
- Tables scroll inside their own containers.
- Filter controls remain reachable on phones.
- Recommendation cards keep stable dimensions while images and AI states load.

## Testing Plan

Run:

- `npm run lint`
- `npm run build`

Manual checks:

- Open `/creator/trends`.
- Check desktop and mobile widths.
- Change direction, platform, range, and keyword.
- Check loading and empty-result states.
- Check AI recommendation generation, failed/partial state display, and retry affordance.
- Check AI cover loading, failure, and retry.
- Click `生成脚本` from a recommendation card and from selected details.
- Confirm the script drawer opens after generation or lookup.
- Click `查看拆解`.
- Click `加入选题池`.
- Confirm no body-level horizontal overflow.

## Non-Goals

- Rewriting the trend collection pipeline.
- Changing the AI topic deck generation algorithm.
- Redesigning the script drawer from scratch.
- Adding a calendar implementation beyond the existing saved/draft pool.
- Replacing the current URL filter model.

## Implementation Notes

- Before editing Next.js code, read the relevant documentation under `node_modules/next/dist/docs/` because this project uses Next.js 16.2.4 and local rules warn that conventions may differ from older Next.js versions.
- Preserve existing dirty worktree changes unless they directly conflict with this feature.
- Keep edits focused on the creator trends page and related components.
