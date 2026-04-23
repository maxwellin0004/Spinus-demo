---
name: workflow-template-video-2
description: Use when running a Stage 2 style structured sample-video decomposition inside the workflow repository and the task benefits from analysis and summary style module outputs.
---

# Workflow Template Video 2

Use this skill when the task is closer to a structured decomposition pipeline than a casual summary.

## Module Concepts

1. extract_basic_meta
2. transcribe_audio
3. analyze_title
4. analyze_description
5. analyze_hook
6. analyze_structure
7. analyze_script_style
8. analyze_visual_rhythm
9. analyze_visual_style
10. analyze_subtitle_audio
11. build_summary

## Repository Mapping

Relevant files and directories:

- `scripts/analyze_video.py`
- `scripts/prompt_config.json`
- `data/source_videos/`
- `data/preprocess/`
- `data/jobs/`
- `data/analyses/`

