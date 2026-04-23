# tech_archive_explainer Workflow Report

## Purpose

Use this template for technology-history explainer videos built from evidence, years, product shots, standards, patents, screenshots, and short archival narration.

## Scene System

- `TechArchiveHookScene`: opens with a technology mystery and metric contrast.
- `TechArchiveChapterScene`: repeats year + evidence + media cards.
- `TechArchiveCloseScene`: converts the historical story into a reusable conclusion.

## Latest Template Update (2026-04-22)

This template has been updated to match the latest approved production version.

### Visual and Duck Updates

- Switched to AI duck assets with true transparent background:
  - `video-app/public/images/tech-archive/duck-ai/duck-*.png`
- Added page-aware duck animation grammar in scene code:
  - richer entrance presets (`from-right`, `from-left`, `from-bottom`, `pop`)
  - continuous float, drift, sway, breathing
  - per-page position and size variation (not fixed right-side only)
- Updated implementation:
  - `video-app/src/scenes/techArchive/TechArchiveScenes.tsx`

### Audio Updates

- Added template audio layer config:
  - `video-app/src/data/techArchiveAudio.ts`
- Composition now mounts audio layer:
  - `video-app/src/compositions/TechArchiveExplainerComposition.tsx`
- ElevenLabs voiceover generated via `elevenlabs_config.py`:
  - `video-app/public/audio/tech-archive/tech-archive-explainer-elevenlabs.mp3`

### Render Reference

- Latest approved preview (with richer duck animation + ElevenLabs voiceover):
  - `video-app/out/tech-archive-explainer-preview-duckfix-elevenlabs.mp4`

## Reuse Rules

- Do not use a single static duck placement across all pages.
- Always keep duck image transparent and avoid covering key information cards.
- Duck position/size/motion must adapt to each page layout.
- If voiceover is regenerated, update subtitle timing after audio is finalized.
