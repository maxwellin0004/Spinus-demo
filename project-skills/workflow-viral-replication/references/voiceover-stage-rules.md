# Voiceover Stage Rules

Use this reference for Stage 5 of the viral replication workflow.

Stage 5 turns rewritten copy into a spoken package:

1. `voiceover_units.<variant>.json` from Stage 3 is the input.
2. The skill/model may refine pacing, pause placement, and emphasis words before synthesis.
3. Python generates TTS audio, timestamp alignment, subtitle cues, and a Remotion-ready audio config.

## Core Goal

Produce narration that is:

- short enough for the scene duration
- easy to read aloud
- easy to align back to subtitles
- usable in Remotion without manual timing cleanup

## Responsibilities

Skill / model responsibilities:

- tighten spoken phrasing
- preserve scene role and narrative order
- add or correct `emphasisWords`
- keep one idea per unit
- keep the script natural when read aloud

Program responsibilities:

- validate the voiceover unit shape
- synthesize TTS audio
- collect ElevenLabs alignment timestamps
- generate subtitle cues
- write a Remotion-ready `AudioLayerConfig` TS file
- package paths and timing metadata for downstream render steps

## Input Contract

Stage 5 expects the Stage 3 `voiceover_units.<variant>.json` shape:

- `jobId`
- `variantId`
- `language`
- `units`
- `timingStatus`
- `reviewStatus`

Each unit should keep:

- `voiceId`
- `sceneId`
- `role`
- `text`
- `targetDurationSec`
- `intendedPauseAfterSec`
- `pace`
- `emotion`
- `emphasisWords`
- `timingStatus`

## Output Contract

Stage 5 writes:

- `voiceover_package.<variant>.json`
- `voiceover_alignment.<variant>.json`
- `voiceover_subtitles.<variant>.json`
- `video-app/public/generated-jobs/<job_id>/<variant>/voiceover.mp3`
- `video-app/src/data/generated-jobs/<job_id>/<variant>Audio.ts`
- `data/jobs/<job_id>/render-props.voiceover.<variant>.json`

## Writing Rules

- Keep spoken sentences short.
- Put the main claim first.
- Avoid long subordinate clauses.
- Prefer direct cause/effect wording.
- Let scene transitions stay light.
- Do not turn the voiceover into an essay.

## Timing Rules

- Respect `targetDurationSec` before synthesis.
- Keep a small time buffer where possible.
- Treat subtitles as estimated until real TTS alignment exists.
- After TTS, adjust cue gaps to avoid overlap.

## Failure Rules

If TTS fails:

1. keep the package output
2. mark timing as estimated or partial
3. surface the provider error in the package
4. do not silently overwrite the rewritten copy
