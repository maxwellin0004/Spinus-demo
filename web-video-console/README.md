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
