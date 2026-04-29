# Combinatorial Paradox Cinematic Template

This template packages the validated birthday-paradox preview into a reusable horizontal Remotion workflow for cinematic math and logic explainers.

It is designed for topics that need:

- a high-pressure cold open built around a counterintuitive question;
- elegant mechanism reveals instead of card-based UI pages;
- relationship-growth or probability-growth visual logic;
- Chinese voiceover and subtitle alignment after audio generation;
- one custom image per key scene for every new topic.

## Packaged Files

| File | Role |
|---|---|
| `template_manifest.json` | Template identity, reuse boundary, preview paths |
| `template_data_schema.json` | Data contract for the video scenes |
| `template_data_audio_schema.json` | Voiceover and subtitle alignment contract |
| `style_variants.json` | Render-side visual variants |
| `image_prompt_schema.json` | Schema for generated scene-image prompts |
| `image_prompt_library.json` | Reusable prompt templates by scene type |
| `style_to_prompt_mapping.json` | Style variant to image-generation modifier mapping |
| `asset_generation_plan.json` | Current example's per-scene prompt plan |
| `example_data.json` | Validated birthday-paradox example data |
| `example_voiceover_units.json` | Voiceover units for audio generation |
| `subtitle_timeline.generated.horizontal.json` | Audio-aligned subtitles |
| `audio_alignment_protocol.json` | Audio-first subtitle rule |
| `render_mapping.json` | Field mapping into React / Remotion |
| `workflow_report.md` | Full decomposition and template reasoning |

## Implemented Remotion Entry Points

| Path | Role |
|---|---|
| `video-app/src/compositions/CombinatorialParadoxCinematicComposition.tsx` | Composition timeline |
| `video-app/src/scenes/paradoxLab/ProbabilityParadoxLabScenes.tsx` | Scene system |
| `video-app/src/data/combinatorialParadoxCinematicData.ts` | Current preview data |

## Prompt and Image Workflow

For every new topic, generate a new prompt pack first. Do not reuse the birthday-paradox scene images as final visuals.

Base files:

- `image_prompt_schema.json`
- `image_prompt_library.json`
- `style_to_prompt_mapping.json`
- `asset_generation_plan.json`

Generator script:

- `scripts/generate_combinatorial_paradox_image_prompts.py`

Example command:

```powershell
python .\scripts\generate_combinatorial_paradox_image_prompts.py `
  --topic "Monty Hall problem" `
  --slug monty-hall-problem `
  --question-hook "Why does switching doors improve your odds in a three-door game?" `
  --key-number "2/3" `
  --relationship-object "three doors, one prize marker, and one host action marker" `
  --comparison-unit "the host's constrained reveal changes the probability mass across the remaining doors" `
  --closing-takeaway "The puzzle changes once you count information flow instead of just visible choices."
```

That command writes:

- `data/templates/combinatorial_paradox_cinematic/generated/<slug>/asset_generation_plan.json`
- `data/templates/combinatorial_paradox_cinematic/generated/<slug>/scene_prompt_pack.json`
- `data/templates/combinatorial_paradox_cinematic/generated/<slug>/topic_payload.json`

## New Topic Workflow

1. Generate new prompts with `generate_combinatorial_paradox_image_prompts.py`.
2. Use the generated `scene_prompt_pack.json` to create one topic-specific image per scene.
3. Save the images under `video-app/public/generated/combinatorial-paradox-cinematic/<slug>/`.
4. Write those generated paths back into the scene data.
5. Generate voiceover audio.
6. Rebuild the subtitle timeline from real audio timing.
7. Render the video preview or final output.

## Reuse Boundary

Allowed reuse:

- `SubtitleTrack`
- `AudioTrackLayer`
- font tokens
- Remotion base primitives
- static asset loading
- base interpolation and spring helpers

Forbidden reuse:

- old template page masters;
- old scene skeletons;
- trading, comic, dossier, archive, or psych layout systems.

## Current Preview

- Audio preview video: `video-app/renders/combinatorial-paradox-cinematic-preview-audio.mp4`
- Voiceover audio: `assets/audio/birthday-paradox-elevenlabs.mp3`
- Validation images:
  - `assets/images/panel-1-cold-open.png`
  - `assets/images/panel-2-wrong-path.png`
  - `assets/images/panel-3-mechanism.png`
  - `assets/images/panel-4-probability.png`

Those validation images are now fallback assets, not the default final-image strategy for new topics.
