# Asset Prompt Rules

Use these rules when generating image prompts for the viral replication workflow.

Stage 4 is split into:

1. `asset_prompt_plan.<variant>.json`: skill/model writes high-quality visual prompts.
2. `asset_manifest.<variant>.json`: Python executes providers and records actual files.

When you want to compare multiple visual systems for the same copy variant, override `styleVariant` and write a suffixed set of artifacts such as `asset_prompt_plan.<variant>.<style>.json`, `asset_manifest.<variant>.<style>.json`, and `render-props.assets.<variant>.<style>.json`.

## Core Goal

Generate original visual assets that support the rewritten scene copy and layout role.

Do not generate assets that recreate:

- source video frames
- source creator identity
- logos or watermarks
- social platform UI
- recognizable people from the reference
- exact scene compositions from the reference

## Provider Priority

Default provider order:

```text
local_api -> openai_image -> svg_fallback
```

Use `local_api` first when configured in `config.local.json`.

Fallback must always exist. A failed image provider should not block preview rendering unless strict mode is explicitly requested.

## Prompt Structure

Every prompt should include:

- target format: vertical or horizontal short-video visual
- scene role: hook, mechanism, method, close, etc.
- visual purpose: what the image helps the viewer understand
- subject: concrete objects or abstract symbols
- metaphor: why the subject represents the scene idea
- layout: safe area and negative space
- style: palette, material, lighting, density
- text policy: no readable text in the image
- originality boundary: do not copy the reference frame or creator identity

Preferred prompt shape:

```text
Create an original {aspect_ratio} short-video supporting visual.
Scene role: {role}.
Scene objective: {goal}.
Visual purpose: {purpose}.
Subject: {subject}.
Scene design: {pattern}; {composition}; {camera}.
Layout intent: {layout_intent}.
Style system: {style_variant}. {style_language}; {lighting}; {material}.
Style cue: {style_note}.
Prompt discipline: one clear focal idea, no readable text, no logos, no watermark, no platform UI, no copied frame, no creator identity.
Originality boundary: do not recreate any reference-video frame, person, room, camera angle, or recognizable composition.
```

Prompt template:

```text
Create an original {aspect_ratio} short-video supporting visual.
Scene role: {role}.
Visual purpose: {purpose}.
Subject: {subject}.
Visual metaphor: {metaphor}.
Composition: {composition}, with clean negative space for captions and UI overlays.
Style: {style}.
Text policy: no readable words, no logos, no watermark, no platform UI.
Originality boundary: do not recreate any reference-video frame, person, room, camera angle, or recognizable composition.
```

## Negative Prompt

Always include:

```text
watermark, logo, readable text, subtitles, platform UI, screenshot, copied frame, creator identity, celebrity likeness, photorealistic face, cluttered composition, low quality, blurry, distorted anatomy
```

Add provider-specific negatives when useful:

- for local diffusion APIs: `bad hands, extra limbs, malformed objects`
- for infographic styles: `busy chart, unreadable tiny labels, dense text`
- for conceptual visuals: `literal app interface, stock photo, generic office`

## Slot Types

Recommended slots:

- `hero_visual`: main opening metaphor or strong concept still
- `mechanism_visual`: visualizes cause/trigger/result
- `method_visual`: visualizes checklist or action path
- `close_visual`: simple payoff or memory anchor
- `background_texture`: non-literal background support

Default slot selection:

- `hook`: `hero_visual`
- `mechanism`: `mechanism_visual`
- `method` / `checklist`: `method_visual`
- `case` / `evidence`: `supporting_visual`
- `close`: `close_visual`

If a module already declares `assetSlotSpecs`, prefer those specs over defaults.

## Size Rules

For `9:16`:

- `hero_visual`: `1024x1024`
- `mechanism_visual`: `1024x1024`
- `method_visual`: `1024x1024`
- `background_texture`: `1080x1920`

For `16:9`:

- `hero_visual`: `1280x720`
- `mechanism_visual`: `1280x720`
- `method_visual`: `1280x720`
- `background_texture`: `1920x1080`

## Role Guidance

### hook

Use one strong metaphor. The image should not explain everything.

Good subjects:

- heavy doorway
- locked first step
- glowing threshold
- single oversized obstacle

Avoid:

- busy checklist
- full story scene
- literal phone/social media screenshot

### mechanism

Show why the issue happens.

Good subjects:

- cause/trigger/result as abstract objects
- layered panels
- weight, friction, distance, branching path
- controlled diagram without readable labels

### method

Show repeatable action.

Good subjects:

- three-step path
- small tools arranged before action
- checklist cards without readable text
- progress tiles

### close

Use a memory anchor.

Good subjects:

- simplified doorway
- lighter switch
- one object transformed from heavy to light
- minimal symbol with negative space

## Style Guidance

For `dark_warning_orange`:

- dark navy or near-black base
- orange accent light
- subtle HUD grid
- clean editorial composition
- high contrast
- avoid purple-blue gradient dominance

For `warm_paper`:

- warm off-white background
- soft shadows
- simple editorial still
- restrained gold or ink accent

For `clean_white`:

- bright neutral background
- crisp object edges
- blue or black accent
- low clutter

When the workflow switches styles, the prompt language should switch too. A `warm_paper` asset should read like a soft editorial still, while `cold_newsroom` should read like a factual reporting board, not just the same image with a different color word.

## asset_prompt_plan JSON Contract

Top-level:

```json
{
  "schemaVersion": "1.0",
  "artifact": {
    "type": "asset_prompt_plan",
    "status": "draft",
    "generator": "workflow-viral-replication"
  },
  "jobId": "job_id",
  "variantId": "codex_sharp_contrarian",
  "styleVariant": "dark_warning_orange",
  "providerOrder": ["local_api", "openai_image", "svg_fallback"],
  "assets": [
    {
      "assetId": "asset_scene_02_mechanism_visual",
      "sceneId": "scene_02_mechanism",
      "slot": "mechanism_visual",
      "assetType": "image",
      "required": false,
      "size": {"width": 1024, "height": 1024},
      "purpose": "Visualize procrastination as heavy entry friction before action.",
      "prompt": "...",
      "negativePrompt": "...",
      "styleGuide": {
        "styleVariant": "dark_warning_orange",
        "palette": "dark navy with orange accent",
        "composition": "central object, clean negative space",
        "textPolicy": "no readable text"
      },
      "providerOrder": ["local_api", "openai_image", "svg_fallback"],
      "copyrightBoundary": {
        "doNotCopyOriginalFrames": true,
        "doNotUseLogos": true,
        "doNotUseCreatorIdentity": true
      },
      "status": "planned"
    }
  ]
}
```

## Review Checklist

Before execution, check:

- every asset has `assetId`, `sceneId`, `slot`, `size`, `prompt`, and `negativePrompt`
- prompt is tied to rewritten scene copy
- prompt does not ask for readable text
- prompt does not mention copying the reference frame
- provider order starts with `local_api` unless local API is explicitly disabled
- image size matches the asset slot and aspect ratio
- if a non-auto style override is used, the file name and `generated-jobs/<job_id>/...` folder should carry the same style suffix
