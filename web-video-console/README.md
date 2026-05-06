# Codex Video Console

This directory contains a local web console for driving a video-generation workflow around Codex, local templates, local assets, and Remotion.

## Files

- `index.html`: main UI shell
- `styles.css`: layout and styling
- `app.js`: browser client, fetches local API and subscribes to SSE updates
- `server.js`: zero-dependency local Node server
- `start-server.cmd`: Windows launcher for the local server

## Run

From the workspace root:

```powershell
node web-video-console/server.js
```

Or on Windows:

```text
D:\program\ai_video\workflow\web-video-console\start-server.cmd
```

Then open:

```text
http://127.0.0.1:3008
```

## Current API

```text
GET  /api/projects
GET  /api/templates
GET  /api/assets
GET  /api/jobs
POST /api/jobs
GET  /api/jobs/:id
DELETE /api/jobs/:id
GET  /api/jobs/:id/assets
POST /api/jobs/:id/assets/plan
POST /api/jobs/:id/assets/:slotId/bind
POST /api/jobs/:id/assets/:slotId/generate
POST /api/jobs/:id/assets/generate-fresh
PATCH /api/jobs/:id/assets/:slotId
GET  /api/jobs/:id/events
POST /api/jobs/:id/codex/message
POST /api/jobs/:id/actions/generate-plan
POST /api/jobs/:id/actions/tts
POST /api/jobs/:id/actions/render
```

## Current behavior

- Reads real templates from `data/templates`
- Reads real images from `assets/images`
- Reads historical jobs from `data/jobs`
- Seeds one runtime demo job for the video-generation UI
- Streams job snapshots over SSE
- Builds per-job asset plans from template slots and binds local images from `assets/images`
- Copies bound assets into `data/jobs/<job_id>/assets` and `video-app/public/generated-jobs/<job_id>/assets`
- Runs screen-leak QA before Remotion MP4 rendering and writes `screen-qa/report.json`

## Asset workbench

The `素材` tab is a local-first material workflow:

- template asset slots describe what each video needs, for example Hook visual, mechanism chart, and case images
- `POST /api/jobs/:id/assets/plan` creates `data/jobs/<job_id>/assets/asset_plan.json`
- local image choices are copied into the job assets directory and the Remotion public generated-jobs directory
- AI generation creates fresh per-slot assets without reading `assets/images`
- generation prompts are written to `data/jobs/<job_id>/assets/prompts/<slot>.txt` for review
- the job asset manifest is stored at `data/jobs/<job_id>/assets/manifest.json`
- render props include `assets.plan` and `assets.manifest`
- required template slots are checked before render
- the UI supports binding local assets, confirming a slot, and locking/unlocking a slot

Default asset slots are defined in `server.js` and currently include:

```text
hook_inset       -> data.hook.insetImageSrc
mechanism_image  -> data.mechanism.imageSrc
case_01_image    -> data.cases.0.imageSrc
case_02_image    -> data.cases.1.imageSrc
case_03_image    -> data.cases.2.imageSrc
```

When an asset is bound, the server writes/copies files to:

```text
data/jobs/<job_id>/assets/<slot>.jpg
video-app/public/generated-jobs/<job_id>/assets/<slot>.jpg
```

The `renderSrc` in `manifest.json` uses the Remotion public path:

```text
/generated-jobs/<job_id>/assets/<slot>.jpg
```

The render pipeline applies the manifest back into `video_plan.json` before rendering. This means Remotion scenes can continue reading the normal plan image fields, while the asset workbench remains a separate management layer.

AI-generated assets are available from each slot's `AI 生成` button and from the top-level `生成全新素材` button. The full fresh generation path skips local assets and replaces every unlocked slot with a newly generated project asset. Web search assets are still reserved as a UI entry point.

### Asset API

```text
GET   /api/jobs/:id/assets
POST  /api/jobs/:id/assets/plan
POST  /api/jobs/:id/assets/:slotId/bind
PATCH /api/jobs/:id/assets/:slotId
```

`POST /api/jobs/:id/assets/:slotId/bind` accepts:

```json
{
  "assetPath": "assets/images/macd_ref_chart_1.jpg",
  "status": "approved",
  "locked": false
}
```

`PATCH /api/jobs/:id/assets/:slotId` accepts:

```json
{
  "status": "approved",
  "locked": true
}
```

`POST /api/jobs/:id/assets/:slotId/generate` accepts:

```json
{
  "force": false,
  "status": "suggested"
}
```

`POST /api/jobs/:id/assets/generate-fresh` accepts the same body and generates all unlocked slots. Generated files are saved under:

```text
data/jobs/<job_id>/assets/<slot>-ai-<timestamp>.svg
video-app/public/generated-jobs/<job_id>/assets/<slot>-ai-<timestamp>.svg
data/jobs/<job_id>/assets/prompts/<slot>.txt
```

### Asset safety rules

- A bound source file must stay inside `assets/images`.
- Required slots block rendering when missing.
- Locked slots cannot be replaced unless the request explicitly forces replacement.
- The feature does not delete existing job output files.
- Fresh generation skips local candidate selection and never deletes prior generated files.
- Web fetching is not connected yet; the button remains a product placeholder.

## Screen QA

The render action calls `video-app/scripts/screen-leak-qa.mjs` before producing the final MP4. It renders a few still frames, scans render props for prompt/internal metadata leakage, and runs OCR when `tesseract` or `SCREEN_QA_OCR_COMMAND` is available.

Environment knobs:

```powershell
$env:SCREEN_QA_ENABLED="0"          # disable only when debugging
$env:SCREEN_QA_FRAMES="300,560"     # optional fixed frame list
$env:SCREEN_QA_OCR_COMMAND="tesseract"
```

Manual template sweep:

```powershell
Set-Location ./video-app
npm run qa:screen -- --composition codex-job-preview --props ../data/jobs/<job_id>/render-props.json --frames 300,560
npm run qa:screen:batch -- --no-ocr
```

`--no-ocr` is useful on machines without Tesseract. It still renders QA frames and scans render props; OCR text detection starts working as soon as `tesseract` or `SCREEN_QA_OCR_COMMAND` is available.

## Next backend step

Replace the current in-memory runtime actions with real bridge calls that:

- invoke local Codex for planning and code edits
- invoke existing TTS scripts for audio and timestamps
- invoke Remotion for rendering
- write outputs into `data/jobs/<job_id>`

## Safety boundary

- bind only to `127.0.0.1`
- keep workspace rooted at `D:\program\ai_video\workflow`
- restrict writes to approved output directories
- put Codex code edits behind an explicit diff/apply step
