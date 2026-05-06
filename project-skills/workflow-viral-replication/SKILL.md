---
name: workflow-viral-replication
description: Use when turning a reference viral video into this repository's replication workflow: decompose the sample, normalize analysis into viral_breakdown.json, match local Remotion template modules, generate replication_plan.json, choose asset providers, and prepare video_plan/render inputs without copying original words, frames, voice, music, logos, or watermarks.
---

# Workflow Viral Replication

Use this skill for tasks such as:

- deconstructing a reference viral video and producing an original replication plan
- mapping reference video structure to this repository's existing templates
- designing or generating `viral_breakdown.json`, `module_match_report.json`, or `replication_plan.json`
- converting `analysis.json` / `summary.json` into repository-native execution artifacts
- rewriting compiled `video_plan.json` copy into original scene-level scripts
- choosing local assets, a local image API, OpenAI image generation, or fallback assets

## Core Contract

Replicate only reusable production patterns:

- narrative structure
- hook mechanism
- segment pacing
- subtitle grammar
- visual layout roles
- emotional curve
- reusable template rules

Never copy:

- exact source-video words
- original frames or recognizable scene compositions
- original voice
- original music
- logos, watermarks, creator identity, or platform UI

Default every replication plan to human review before final render.

## Repository Mapping

Relevant project locations:

- `data/templates/` for template manifests, schemas, examples, style variants
- `data/module_registry.json` for local module capabilities
- `data/jobs/<job_id>/` for replication artifacts
- `web-video-console/server.js` for job actions and asset generation pipeline
- `video-app/src/compositions/` and `video-app/src/scenes/` for Remotion render surfaces

Use the existing Stage 2 decomposition workflow when raw video analysis is needed:

- `template-video-2` skill outputs `analysis.json` and `summary.json`
- normalize those into `viral_breakdown.json` before module matching

## Workflow

1. If no Stage 2 output exists, run or request a `template-video-2` style decomposition to produce `analysis.json` and `summary.json`.
2. If `analysis.json` already exists, prefer `scripts/run_viral_replication_pipeline.py` to run the full artifact chain in one command.
3. Produce or update `viral_breakdown.json`.
4. Produce or update `visual_analysis_detailed.json`. This is mandatory for high-fidelity replication because it records per-scene layout, text layers, image layers, motion presets, effects, transitions, subtitle behavior, and remix directives.
5. Produce or update `layout_profile.json` before module matching. This is mandatory when the reference depends on a specific visual layout such as full-bleed cinematic quote, HUD explainer, document card, split-screen tutorial, or talking-head caption.
6. Read `data/module_registry.json`; if missing, draft the minimal needed entries using `references/module-mapping.md`.
7. Generate `module_match_report.json` with ranked candidates per segment, prioritizing `layout_profile.layoutArchetype` over content domain when visual similarity is requested.
8. Generate `replication_plan.json` using `references/data-contracts.md`.
9. Compile `replication_plan.json` into `video_plan.json`, `asset_plan.json`, `render-props.json`, and `compile_report.json` when the user wants executable production artifacts.
10. If the user wants production-ready content rather than a structural preview, rewrite copy using `references/copy-rewrite-rules.md`.
11. Validate the copyright boundary using `references/replication-boundary.md`.
12. If assets are involved, apply `references/asset-provider-policy.md`.
13. Prepare the next artifact requested by the user: TTS inputs, subtitles, render props adapter, or implementation changes.

Manual artifact editing is only needed when the pipeline output fails review or the user asks to refine a specific artifact.

Pipeline command shape:

```powershell
python scripts\run_viral_replication_pipeline.py --analysis <analysis.json> --summary <summary.json> --job-id <job_id> --account-id <account_id> --force
```

Add `--compile --topic "<target topic>"` when the plan should be compiled into production artifacts:

```powershell
python scripts\run_viral_replication_pipeline.py --analysis <analysis.json> --job-id <job_id> --account-id <account_id> --topic "<target topic>" --compile --force
```

Add `--delivery --rewrite-variant <variant> --draft-copy-rewrite` to chain copy rewrite, assets, and voice after compile during testing. For production, replace `--draft-copy-rewrite` with `--copy-rewrite <copy_rewrite.json>`:

```powershell
python scripts\run_viral_replication_pipeline.py --analysis <analysis.json> --job-id <job_id> --account-id <account_id> --topic "<target topic>" --compile --delivery --rewrite-variant sharp_contrarian --draft-copy-rewrite --voice-dry-run
```

To compile an existing plan only:

```powershell
python scripts\compile_replication_plan.py --replication-plan data/jobs/<job_id>/replication_plan.json --topic "<target topic>"
```

The pipeline writes:

- `data/jobs/<job_id>/analysis.json`
- `data/jobs/<job_id>/summary.json` when provided
- `data/jobs/<job_id>/viral_breakdown.json`
- `data/jobs/<job_id>/visual_analysis_detailed.json`
- `data/jobs/<job_id>/layout_profile.json`
- `data/jobs/<job_id>/module_match_report.json`
- `data/jobs/<job_id>/replication_plan.json`
- `data/jobs/<job_id>/replication_status.json`
- `data/jobs/<job_id>/video_plan.json` when `--compile` is used
- `data/jobs/<job_id>/asset_plan.json` when `--compile` is used
- `data/jobs/<job_id>/render-props.json` when `--compile` is used
- `data/jobs/<job_id>/compile_report.json` when `--compile` is used

## Detail Standard

For replication work, prefer structured detail over short summaries. A valid `viral_breakdown.json` should include packaging surfaces, narrative structure, segment timing, rhythm rules, visual layouts, subtitle/audio rules, fixed rules, variable candidates, source evidence, confidence values, and copyright boundaries.

`visual_analysis_detailed.json` is the per-scene visual grammar artifact. It should describe each scene's layout archetype, text layers, image layer, safe zones, motion preset, camera move, effect stack, transition preset, subtitle behavior, asset guidance, and remix directive. This artifact answers: "what exactly is happening visually in this shot, and what can be preserved or changed?"

`layout_profile.json` is the visual-template gate. It should classify the reference into a layout archetype and record text zones, image mode, style traits, motion style, effect stack, transition pattern, and the recommended template id. If the profile detects `cinematic_quote_full_bleed`, the plan must avoid HUD/document/card templates and use a full-bleed cinematic render path.

Compiled artifacts are deterministic drafts. `video_plan.json` may contain placeholder copy, but it must keep scene roles, timings, module ids, layout intent, subtitle draft cues, asset references, and review status. Final copy and TTS timing still require a rewrite/alignment step before final render.

When `render-props.json.composition.compositionId` is `replicated-video-preview` and `bindingStatus` is `adapter_ready`, the package can be used for a rough Remotion preview through `video-app/src/compositions/ReplicatedVideoComposition.tsx`. This preview is for structure, timing, layout density, and copy overflow review; it is not the final high-fidelity template render.

Copy rewriting is a skill/model task wrapped by programmatic validation. Do not replace `sceneId`, `sourceSegmentId`, `moduleId`, timing, layout intent, or asset refs when rewriting copy. Generate one output set per copy variant, for example `video_plan.rewritten.sharp_contrarian.json`, `voiceover_units.sharp_contrarian.json`, and `copy_review_report.sharp_contrarian.json`.

Copy rewrite execution helpers:

```powershell
python scripts\prepare_copy_rewrite_context.py --job-dir data\jobs\<job_id> --topic "<target topic>" --variants sharp_contrarian,warm_explainer,story_case
```

Use the skill/model to generate `copy_rewrite.<variant>.json` from `copy_rewrite_context.json` and `references/copy-rewrite-rules.md`, then apply it:

```powershell
python scripts\apply_copy_rewrite.py --job-dir data\jobs\<job_id> --rewrite data\jobs\<job_id>\copy_rewrite.<variant>.json
```

For pipeline verification only, `scripts\draft_copy_rewrite_sample.py` can create deterministic sample rewrite JSON. Do not treat that sample copy as production-ready.

Asset prompt and execution helpers:

```powershell
python scripts\prepare_asset_prompt_plan.py --job-dir data\jobs\<job_id> --variant <variant>
python scripts\generate_assets.py --job-dir data\jobs\<job_id> --variant <variant>
python scripts\apply_asset_manifest.py --job-dir data\jobs\<job_id> --variant <variant>
python scripts\run_asset_stage.py --job-dir data\jobs\<job_id> --variant <variant> --style-variant <style_variant>
```

`prepare_asset_prompt_plan.py` creates a programmatic draft. For production, improve or regenerate prompts with the skill/model using `references/asset-prompt-rules.md` before running `generate_assets.py`. The prompt should be structured by scene role, scene objective, subject, layout intent, and style system, not as a single loose sentence. Asset execution should prioritize `local_api`, then `openai_image`, then `svg_fallback`.

Use `--style-variant` to run the same copy variant through different visual systems without overwriting the default artifacts. When the style is overridden, the scripts write suffixed files such as `asset_prompt_plan.<variant>.<style>.json`, `asset_manifest.<variant>.<style>.json`, and `render-props.assets.<variant>.<style>.json`.

Stage 5 voiceover helpers:

```powershell
python scripts\run_voice_stage.py --job-dir data\jobs\<job_id> --variant <variant>
```

Use `references/voiceover-stage-rules.md` for Stage 5 prompt and pacing guidance. Stage 5 turns rewritten `voiceover_units.<variant>.json` into aligned audio, subtitle cues, a `voiceover_package.<variant>.json`, a generated `AudioLayerConfig` TS file under `video-app/src/data/generated-jobs/<job_id>/`, and a `render-props.voiceover.<variant>.json` preview package with audio applied.

Stage 6 final render helpers:

```powershell
python scripts\run_render_stage.py --job-dir data\jobs\<job_id> --variant <variant>
```

Stage 6 merges the asset and voice render props into `render-props.final.<variant>.json`, calls Remotion to render the final MP4, and writes a `render_package.<variant>.json` summary. Use `--dry-run` to validate the merge and output paths without rendering video.

## Required Artifact Chain

Preferred chain:

```text
analysis.json / summary.json
-> viral_breakdown.json
-> visual_analysis_detailed.json
-> layout_profile.json
-> module_match_report.json
-> replication_plan.json
-> video_plan.json / asset_plan.json
-> copy_rewrite_context.json
-> copy_rewrite.<variant>.json
-> video_plan.rewritten.<variant>.json / voiceover_units.<variant>.json / copy_review_report.<variant>.json
-> asset_prompt_plan.<variant>.json / asset_manifest.<variant>.json / render-props.assets.<variant>.json
-> voiceover_package.<variant>.json / voiceover_alignment.<variant>.json / voiceover_subtitles.<variant>.json
-> render-props.voiceover.<variant>.json
-> render-props.final.<variant>.json / render_package.<variant>.json / output.<variant>.mp4
-> render-props.json
```

## Reference Loading

Read only the needed references:

- `references/analysis-rubric.md`: detailed analysis standards and confidence rules.
- `references/data-contracts.md`: responsibilities and required fields for each JSON artifact.
- `references/tag-taxonomy.md`: allowed tags and naming rules.
- `references/module-mapping.md`: module scoring and report format.
- `references/layout-profile-rules.md`: visual layout archetype selection and text-zone rules.
- `references/visual-analysis-rules.md`: detailed per-scene layout, motion, effect, transition, and subtitle analysis rules.
- `references/replication-boundary.md`: originality and safety boundary.
- `references/asset-provider-policy.md`: local API / OpenAI / local asset / fallback behavior.
- `references/asset-prompt-rules.md`: image prompt quality rules, slot selection, provider order, and asset prompt JSON contract.
- `references/copy-rewrite-rules.md`: scene-level copy rewrite, variants, voiceover units, subtitle chunks, and originality checks.
- `references/output-examples.md`: compact example outputs.
