# ai_concept_analyse Workflow Report

## Audio Alignment Addendum

This template is now audio-alignment aware.

Standard execution order:

1. Generate the 11-script pack with `$video-script-maker`.
2. Ensure `voiceover_script` is split into stable `voiceover_units`.
3. Generate final TTS audio from `voiceover_units`.
4. Read the real audio duration and run forced alignment or transcription timestamps when available.
5. Rebuild `subtitle_timeline.horizontal.json` from real audio timing.
6. Render `video-app` from the aligned subtitle timeline.

Important rule:

- Estimated script timing is allowed for rough previews only.
- Final voiceover videos should not use hand-estimated subtitle frames.
- `render_mapping.audio_sync.json` defines the mapping between `voiceover_units`, final audio, subtitle timeline, and Remotion render data.

Relevant files:

- `audio_alignment_protocol.json`
- `template_data_audio_schema.json`
- `example_voiceover_units.json`
- `render_mapping.audio_sync.json`
