# Cognitive Documentary Essay Template

## Purpose

This template packages the validated reference-video workflow into a reusable Remotion template for horizontal cinematic knowledge essays.

It is designed for topics that need:

- a contrarian opening claim;
- full-bleed documentary or office B-roll;
- Chinese voiceover with bilingual subtitles;
- chapter impact words over footage;
- hard cuts and slow Ken Burns motion instead of card-based UI.

## Packaged Template Files

| File | Role |
|---|---|
| `template_manifest.json` | Template identity, reuse boundary, validated example paths |
| `template_data_schema.json` | Data contract for scenes and captions |
| `template_data_audio_schema.json` | Voiceover and subtitle alignment contract |
| `style_variants.json` | Visual variants |
| `image_prompt_schema.json` | Schema for generated scene image prompts |
| `image_prompt_library.json` | Reusable prompt templates by scene type |
| `style_to_prompt_mapping.json` | Style variant to image-generation modifier mapping |
| `asset_generation_plan.json` | Current example's per-scene image prompt plan |
| `example_data.json` | Validated example topic data |
| `example_voiceover_units.json` | ElevenLabs-ready voiceover units |
| `subtitle_timeline.generated.horizontal.json` | ElevenLabs timestamp-aligned subtitles |
| `audio_alignment_protocol.json` | Required audio-first subtitle workflow |
| `render_mapping.json` | Field mapping into React / Remotion |
| `workflow_report.md` | Full decomposition and template reasoning |

## Implemented Remotion Entry Points

| Path | Role |
|---|---|
| `video-app/src/compositions/CognitiveDocumentaryEssayComposition.tsx` | Composition timeline |
| `video-app/src/scenes/cognitiveDocumentary/CognitiveDocumentaryScenes.tsx` | New full-bleed scene system |
| `video-app/src/data/cognitiveDocumentaryEssayData.ts` | Scene data |
| `video-app/src/data/cognitiveDocumentaryEssayAudio.ts` | ElevenLabs audio and aligned subtitles |

## Validated Preview

| Output | Path |
|---|---|
| Audio preview video | `data/jobs/cognitive-documentary-essay-elevenlabs.mp4` |
| ElevenLabs voiceover | `video-app/public/audio/cognitive-documentary-essay/meeting-no-conclusion-elevenlabs.mp3` |
| Aligned subtitle timeline | `data/templates/cognitive-documentary-essay/subtitle_timeline.generated.horizontal.json` |

## Reuse Boundary

Allowed reuse:

- `SubtitleTrack`
- `AudioTrackLayer`
- theme font tokens
- Remotion base APIs
- local image loading
- basic interpolation / spring primitives

Forbidden reuse:

- existing template page masters;
- existing scene skeletons from trading, HUD, comic, psych, archive, or dossier templates;
- card/dashboard/chart-first visual systems.

## New Topic Workflow

1. Replace `example_voiceover_units.json` with the new topic narration units.
2. Build a new `asset_generation_plan.json` from the topic, script sections, chapter keywords, and scene types.
3. Generate unique images for every scene using `image_prompt_library.json` plus `style_to_prompt_mapping.json`.
4. Save generated images under `video-app/public/generated/cognitive-documentary-essay/<topic-slug>/`.
5. Replace `video-app/src/data/cognitiveDocumentaryEssayData.ts` scene data or generate a new data file following `template_data_schema.json`.
6. Set each scene `visual.asset` to the generated image path and keep `visual.fallbackAsset` as a local fallback.
7. Run ElevenLabs timestamp generation:

```powershell
python .\scripts\generate_cognitive_doc_elevenlabs.py --units .\data\templates\cognitive-documentary-essay\example_voiceover_units.json --output-audio .\video-app\public\audio\cognitive-documentary-essay\<topic>.mp3 --audio-src /audio/cognitive-documentary-essay/<topic>.mp3 --output-timeline .\data\templates\cognitive-documentary-essay\subtitle_timeline.generated.horizontal.json --output-ts .\video-app\src\data\cognitiveDocumentaryEssayAudio.ts --fps 30
```

8. Render:

```powershell
Set-Location .\video-app
npx remotion render src\index.ts cognitive-documentary-essay-preview ..\data\jobs\<topic>.mp4 --overwrite
```

## Final Render Rule

Do not render final videos from hand-estimated subtitle frames. The final subtitle timeline must come from generated or recorded audio timing. If forced alignment is unavailable, mark the subtitle timeline as `estimated_after_audio_duration_fit`.

## Image Generation Rule

Do not treat bundled local images as the default final visuals. They are fallback and layout placeholders. For each new topic, every scene should receive a topic-specific generated or licensed image.

Style switching works in two layers:

| Layer | File | Effect |
|---|---|---|
| Prompt style | `style_to_prompt_mapping.json` | Changes the generated image look before render |
| Render tint | `scene.visual.tint` in scene data | Applies Remotion color treatment over the generated image |

To switch the visual style of a new video, change `style_variant` in `asset_generation_plan.json`, regenerate images, then keep or adjust `scene.visual.tint` to match.
