---
name: workflow-codex
description: Use when working inside the workflow repository and you need repository-specific guidance about scripts, data, assets, video-app, web-video-console, migration setup, or the standard execution order in this project.
---

# Workflow Codex

Use this skill as the repository-level navigation guide.

## Start Here

Read in this order:

1. `README.md`
2. `AGENTS.md`
3. `config.py`
4. Task-specific entrypoint

## Main Repository Roles

- `scripts/`: Python workflow logic
- `data/`: source videos, preprocess output, jobs, analyses, templates, audio scripts
- `assets/`: shared fonts and images
- `video-app/`: Remotion + React + TypeScript rendering app
- `web-video-console/`: static mock console prototype

## Standard Routing

- Analyze sample videos through `scripts/analyze_video.py`
- Work on TTS through the ElevenLabs scripts in `scripts/`
- Work on rendering through `video-app/`

