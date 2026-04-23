# new_signals Audio Sync Rules

`new_signals` videos with voiceover must use audio-first timing.

## Required Flow

1. `video-script-maker` must output `voiceover_units`.
2. Each `voiceover_unit` must be split into short `sentence_units` or `semantic_units`.
3. ElevenLabs generates the final voiceover audio.
4. The real audio duration must be read before rendering.
5. A generated subtitle timeline must be created:
   - Preferred: forced alignment or transcription timestamps.
   - Preview fallback: duration-fit timing from the real audio duration.
6. `video-app` must render from `subtitle_timeline.generated.{orientation}.json` or an equivalent generated data file.

## Hard Rules

- Do not render final voiceover videos from hand-estimated subtitle frames.
- Do not use paragraph-level subtitle blocks for final voiceover videos.
- Keep most cues between 1.5 and 4.5 seconds.
- Each cue must map to `voice_id` and `visual_section_id`.
- Scene switches should follow `visual_section_id` boundaries when practical.
- If generated audio duration differs from planned video duration by more than 1 second, retime subtitles and either retime scenes or add an intentional closing hold.

## Status Labels

- `estimated`: script-only timing, not suitable for final render.
- `estimated_after_audio_duration_fit`: real audio duration was used, but no forced alignment was available. Suitable for previews.
- `aligned`: forced alignment or transcription timestamps were used. Suitable for final render.
