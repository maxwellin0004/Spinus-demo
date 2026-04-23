---
name: workflow-tts-pipeline
description: Use when working on the TTS, subtitle timing, or voiceover alignment pipeline inside the workflow repository, especially for ElevenLabs generation, timeline export, TS audio config generation, and audio asset handoff into video-app.
---

# Workflow TTS Pipeline

Use this skill when the task is mainly about generating or debugging voiceover and subtitle timing artifacts.

## Start Here

Read:

1. `elevenlabs_config.py`
2. `scripts/generate_elevenlabs_tts.py`
3. `scripts/generate_elevenlabs_tts_with_timestamps.py`
4. `scripts/generate_template_audio_batch.py`
5. `video-app/src/lib/audioTypes.ts`
6. `video-app/src/components/video/`

## Validation Checklist

- audio file exists
- output path matches downstream usage
- subtitle cue frames are monotonic
- generated config matches downstream audio types

