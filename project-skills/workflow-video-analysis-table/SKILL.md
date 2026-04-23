---
name: workflow-video-analysis-table
description: Use when deconstructing a reference video inside the workflow repository into reusable Chinese analysis tables covering hook, structure, visual rhythm, subtitle rules, audio rules, and imitation suitability.
---

# Workflow Video Analysis Table

Use this skill for structured reference-video decomposition.

## Output Preference

Return Chinese Markdown tables covering:

1. Basic info
2. Hook
3. Structure
4. Script style
5. Visual structure
6. Visual rhythm
7. Subtitle rules
8. Audio rules
9. Fixed rules vs variables

## Repository Mapping

Use alongside:

- `scripts/analyze_video.py`
- `data/source_videos/`
- `data/preprocess/`
- `data/jobs/`
- `data/analyses/`

