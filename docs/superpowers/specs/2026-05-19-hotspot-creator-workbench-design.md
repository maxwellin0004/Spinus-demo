# Hotspot Creator Workbench Design

## Goal

Turn the Creator trends page from a dense insight browsing page into a creator workbench that helps a user move from hotspot discovery to script, generated images, AI review, and publishing readiness with fewer context switches.

The first implementation should improve the full hotspot workflow, not only one panel:

- Desktop uses a two-column workbench.
- The right column becomes the active script/image/review workspace.
- Mobile keeps the current vertical browsing flow and opens the workspace as a full-screen panel.
- Image generation remains manual and cache-backed.
- AI publish review is manual, reads generated images, and caches its result.

## Confirmed Product Decisions

- Scope includes the hotspot page layout, script workspace, image generation experience, publish review, and a small UI component layer.
- Light dependencies are allowed: Radix primitives and a toast library are acceptable; heavy UI kits such as Ant Design or MUI are out of scope.
- Desktop script detail should no longer be a blocking overlay by default. It should appear as a persistent right-side workbench after a topic/script is selected.
- Mobile should continue to use a full-screen drawer/workspace because two-column layout is not practical.
- Publish review must use AI and must inspect generated image content, not only prompts and status.
- Publish review results must be cached in the database and shown again after refresh.
- Existing image generation uses the current image-model gateway configuration and should stay compatible with the current `gpt-image-2` flow.

## User Experience

### Desktop Layout

The page becomes a split workbench:

- Left column, roughly 60-65% width:
  - trend filters and direction context
  - recommendation batches
  - selected topic detail
  - case study and topic pool
- Right column, roughly 35-40% width:
  - empty state when no script is selected
  - active script workspace after opening or generating a script
  - sticky positioning within the viewport where practical

The right workspace should not hide the topic list. The user should be able to keep browsing while keeping the current script and image outputs visible.

### Mobile Layout

Mobile keeps a single-column page. Opening a script uses a full-screen workspace panel with the same content order as desktop. The panel should have a clear close control and avoid nested scroll traps.

### Script Workspace Structure

The workspace uses this order:

1. Header/status bar:
   - source title
   - script status
   - generation mode
   - model
   - generated time
   - script regenerate action
2. Workflow progress:
   - script ready
   - images generated
   - AI review completed
   - ready to publish
3. Image creation section:
   - main button: generate all images
   - progress: `3/5 已完成`
   - per-page cards with image, page label, status, retry
   - failure state with short error and retry
4. Tabs:
   - `摘要`
   - `图片`
   - `表格`
   - `发布检查`
5. Footer actions:
   - copy current script group
   - copy all
   - optional admin/read-only diagnostics when applicable

The default tab should be `摘要` after script generation and should switch attention to `图片` when the user starts generating images.

## UI Component Layer

Add a small local UI layer for the workbench rather than introducing a heavy design system. Components should wrap Tailwind classes and Radix primitives where useful:

- `WorkbenchButton`
- `WorkbenchTabs`
- `WorkbenchProgress`
- `WorkbenchTooltip`
- `WorkbenchToast`
- `WorkbenchStatusBadge`
- `WorkbenchEmptyState`

The component layer should be local and pragmatic. It should not refactor unrelated admin, brand, or creator pages.

## Image Generation Experience

The existing script image feature remains the foundation:

- Prompts are extracted from the script's image prompt table.
- The user manually clicks `生成全部图片`.
- The server sends image generation requests concurrently.
- Each page succeeds or fails independently.
- Per-page retry regenerates only that page.
- Generated image records remain cache-backed by script, page, prompt hash, and model.

Enhancements:

- The UI should show per-card status immediately.
- The batch button should show aggregate progress.
- Toasts should report batch completion, partial failure, and single-page retry results.
- The image cards should make it obvious that model-generated Chinese text requires human review.

## AI Publish Review

### Trigger

AI publish review is manually triggered from the `发布检查` tab with a button such as `AI 检查发布风险`.

The review should not automatically run after every image or script change because it has cost and latency.

### Inputs

The review input should include:

- script metadata: source title, platform, generation mode, model
- summary items extracted from script tables
- publishing package table content where available
- graphic page table content
- image prompt table content
- generated image records:
  - page label
  - image URL
  - status
  - prompt
  - expected text / overlay instruction
- target platform context

The AI request must include the generated images as visual inputs. If an image URL cannot be used by the gateway, the implementation should convert local generated images to base64 and send them as image inputs.

### Output Contract

The AI review should return strict JSON:

```json
{
  "score": 0,
  "summary": "string",
  "checks": [
    {
      "id": "string",
      "label": "string",
      "status": "PASS | WARNING | FAIL",
      "detail": "string"
    }
  ],
  "imageFindings": [
    {
      "pageKey": "string",
      "pageLabel": "string",
      "status": "PASS | WARNING | FAIL",
      "textAccuracy": "string",
      "visualRisk": "string",
      "suggestion": "string"
    }
  ],
  "riskItems": [
    {
      "severity": "LOW | MEDIUM | HIGH",
      "source": "script | image | publishing",
      "detail": "string",
      "suggestion": "string"
    }
  ],
  "suggestions": ["string"]
}
```

The UI should show:

- score
- summary
- required fixes
- image-by-image findings
- suggested next actions

### Caching

Create a dedicated review table named `CreatorTrendScriptReview`.

Fields:

- `scriptGenerationId`
- `model`
- `inputHash`
- `status`
- `score`
- `summary`
- `checksJson`
- `imageFindingsJson`
- `riskItemsJson`
- `suggestionsJson`
- `rawResponseJson`
- `errorMessage`
- `createdAt`
- `updatedAt`

Cache key should include script text/table content, image URLs/statuses, image prompts, target model, and relevant platform metadata. If any of these change, the UI should mark the latest review as stale and recommend rechecking.

## API Design

Add creator-only endpoints under the existing trends scripts namespace:

- `GET /api/creator/trends/scripts/review?scriptGenerationId=...`
  - returns latest cached review and whether it is stale
- `POST /api/creator/trends/scripts/review`
  - triggers review
  - accepts `scriptGenerationId` and optional `force`
  - returns cached review when input hash matches unless `force` is true

Admin script detail should display latest review read-only if present. Admin should not trigger review in the first version.

## Data Model

Add `CreatorTrendScriptReview` linked to `CreatorTrendScriptGeneration` with cascade delete.

Add a relation field from `CreatorTrendScriptGeneration` to reviews.

No existing generated script or image records should be migrated except by future user action. Existing scripts without review records simply show an empty review state.

## Error Handling

- If image generation partially fails, keep successful images and show failed cards.
- If AI review fails, store a failed review row with the error message.
- If image input cannot be fetched or encoded, AI review should fail clearly and suggest regenerating or checking storage/public URL configuration.
- If the gateway returns non-JSON, store raw response for admin diagnostics and show a short creator-safe error.
- If review is stale, show the old result but clearly label it as out of date.

## Testing And Verification

Required checks:

- `npx.cmd prisma format`
- `npx.cmd prisma generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Manual UI checks:

- desktop two-column layout at wide viewport
- mobile full-screen workspace behavior
- empty workspace state
- existing script opens in workspace
- script generation fills workspace
- image batch progress and partial failure states
- AI review empty, loading, success, stale, and failed states
- Admin detail read-only script images and latest review

Use Browser/Playwright screenshots after implementation to verify desktop and mobile visual layout.

## Out Of Scope

- Full visual editor for generated images.
- Manual text placement/canvas composition.
- Ant Design, MUI, or broad design-system migration.
- Admin-triggered review.
- Rewriting the crawler, recommendation generation, or topic scoring logic.
- Automatic publish/scheduling.
