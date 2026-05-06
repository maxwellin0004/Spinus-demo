# Data Contracts

Use camelCase for new replication artifacts. Keep `schemaVersion` and `artifact` metadata in every top-level artifact.

## Top-level Artifact Metadata

Every new replication artifact should include:

```json
{
  "schemaVersion": "1.0",
  "artifact": {
    "type": "viral_breakdown",
    "status": "draft",
    "createdAt": "2026-05-05T00:00:00+08:00",
    "updatedAt": "2026-05-05T00:00:00+08:00",
    "generator": "workflow-viral-replication"
  }
}
```

Use `status=ready` only after required fields are populated and validation passes.

## Artifact Roles

- `analysis.json`: detailed Stage 2 decomposition from the existing sample-video workflow.
- `summary.json`: compressed reusable rules from Stage 2.
- `viral_breakdown.json`: normalized, tag-based description of the reference video's reusable structure.
- `module_registry.json`: repository-level catalog of local template/module capabilities.
- `module_match_report.json`: ranked module matches for each breakdown segment.
- `replication_plan.json`: execution strategy for generating a new original video.
- `asset_plan.json`: specific image/audio slots and generation prompts.
- `render-props.json`: Remotion input.

## viral_breakdown.json Required Shape

Required top-level fields:

- `schemaVersion`
- `artifact`
- `meta`
- `packaging`
- `hook`
- `narrativeStructure`
- `segments`
- `rhythmRule`
- `visualLayouts`
- `subtitleRule`
- `audioRule`
- `style`
- `fixedRules`
- `variableCandidates`
- `sourceEvidence`
- `copyrightBoundary`

Minimum example:

```json
{
  "schemaVersion": "1.0",
  "artifact": {
    "type": "viral_breakdown",
    "status": "draft",
    "createdAt": "2026-05-05T00:00:00+08:00",
    "updatedAt": "2026-05-05T00:00:00+08:00",
    "generator": "workflow-viral-replication"
  },
  "meta": {
    "sourceVideoId": "ref_001",
    "durationSec": 58.4,
    "aspectRatio": "9:16",
    "platformGuess": "xiaohongshu",
    "contentDomain": "psychology",
    "language": "zh-CN"
  },
  "packaging": {
    "title": {
      "raw": "Example title from metadata",
      "formula": "contrarian claim + promised explanation",
      "contains": ["risk", "contrast"],
      "confidence": 0.72
    },
    "coverText": {
      "raw": null,
      "role": "unknown",
      "confidence": 0.2
    },
    "firstFrameText": {
      "raw": "You are not lazy",
      "role": "identity callout",
      "confidence": 0.76
    },
    "surfaceRelationship": "Title creates the topic promise; first frame narrows it to viewer identity."
  },
  "hook": {
    "type": "reverse_claim",
    "startSec": 0,
    "endSec": 3.5,
    "firstFramePromise": "Points to a familiar but misunderstood viewer problem",
    "curiosityGap": "Why the common approach fails",
    "viewerIdentityTrigger": "Viewers who keep failing at self-management",
    "whyItRetains": "Rejects the old belief first, then promises a mechanism explanation",
    "visualSupport": "Large centered text with minimal background",
    "audioSupport": "Fast opening voice with a short pause after the claim",
    "confidence": 0.78
  },
  "narrativeStructure": {
    "pattern": ["hook", "problem", "mechanism", "case", "method", "close"],
    "turningPointsSec": [0, 3.5, 12, 25, 43, 55],
    "summary": "Front-loads the claim, explains the mechanism, then turns it into a usable method."
  },
  "segments": [
    {
      "id": "seg_01",
      "role": "hook",
      "startSec": 0,
      "durationSec": 3.5,
      "layoutTags": ["large_text_center"],
      "retentionTags": ["reverse_claim", "pain_point"],
      "visualTags": ["text_driven", "minimal_background"],
      "subtitleDensity": "high",
      "audioEnergy": "high",
      "transitionIn": "cold_open",
      "transitionOut": "short_pause_then_problem_setup",
      "visualIntent": "Deliver a strong claim in the first second",
      "reusableRule": "Use a contrarian sentence to enter the topic quickly",
      "replicationPriority": "high",
      "mustPreserve": ["role", "timing", "hook_type", "subtitle_density"],
      "canChange": ["copy", "visual_asset", "example"],
      "sourceEvidenceIds": ["ev_001", "ev_002"],
      "confidence": 0.76
    }
  ],
  "rhythmRule": {
    "avgShotLengthSec": 2.8,
    "cutDensity": "medium_high",
    "frontLoadDensity": "high",
    "speedCurve": "fast_opening_then_medium_explain",
    "pausePattern": "short pause after hook claim",
    "peakMoments": [
      {"timeSec": 0.8, "reason": "first contrarian statement lands"},
      {"timeSec": 25, "reason": "case example validates mechanism"}
    ]
  },
  "visualLayouts": [
    {
      "layoutId": "layout_01",
      "layoutTags": ["large_text_center", "minimal_background"],
      "usedInSegments": ["seg_01"],
      "textRegion": "center",
      "assetRegion": "none",
      "assetDependency": "none",
      "recreationDifficulty": "low",
      "moduleHints": ["minimal_psych.big_statement_hook"],
      "layoutControls": {
        "titlePosition": "center",
        "imageMode": "none",
        "density": "high"
      },
      "rule": "Keep the first screen text-driven and uncluttered."
    }
  ],
  "subtitleRule": {
    "position": "bottom_center",
    "fontSizeClass": "large",
    "lineCount": 2,
    "highlightStyle": "keyword_color",
    "highlightColor": "#ffd166",
    "stroke": true
  },
  "audioRule": {
    "voicePace": "medium_fast",
    "bgmMood": "low_tension",
    "sfxDensity": "low",
    "pausePattern": "short_pause_after_hook"
  },
  "style": {
    "moodTags": ["calm", "sharp"],
    "paletteTags": ["warm_white", "gold_accent"],
    "texture": "clean_editorial",
    "motionStyle": "slow_push_with_text_reveal"
  },
  "fixedRules": [
    "Open with a contrarian identity claim within the first second",
    "Move from problem to mechanism before giving advice",
    "Use two-line subtitles with keyword highlight"
  ],
  "variableCandidates": [
    "topic",
    "viewer identity",
    "case example",
    "method wording",
    "supporting visual assets"
  ],
  "sourceEvidence": [
    {
      "id": "ev_001",
      "sourceType": "video_frame",
      "timeRangeSec": [0, 1.2],
      "supports": ["hook.type", "segments.seg_01.layoutTags"],
      "note": "Opening frame is text-centered with no competing asset."
    },
    {
      "id": "ev_002",
      "sourceType": "asr",
      "timeRangeSec": [0, 3.5],
      "supports": ["hook.whyItRetains", "audioRule.voicePace"],
      "note": "Opening narration states the contrarian claim quickly."
    }
  ],
  "copyrightBoundary": {
    "referenceOnlyForStructure": true,
    "doNotCopyExactWords": true,
    "doNotCopyOriginalFrames": true,
    "doNotCopyVoice": true,
    "doNotCopyMusic": true
  }
}
```

## module_registry.json Required Shape

Top-level:

- `schemaVersion`
- `modules`

Each module:

- `moduleId`
- `templateId`
- `displayName`
- `sceneRole`
- `supportedAspectRatios`
- `contentDomains`
- `layoutTags`
- `retentionTags`
- `styleTags`
- `inputFields`
- `assetSlots`
- `riskLevel`
- `notes`

`moduleId` must be stable and should follow:

```text
<template_family>.<module_name>
```

## module_match_report.json Required Shape

```json
{
  "schemaVersion": "1.0",
  "artifact": {
    "type": "module_match_report",
    "status": "draft",
    "createdAt": "2026-05-05T00:00:00+08:00",
    "updatedAt": "2026-05-05T00:00:00+08:00",
    "generator": "workflow-viral-replication"
  },
  "jobId": "job_001",
  "matches": [
    {
      "sourceSegmentId": "seg_01",
      "selectedModuleId": "minimal_psych.big_statement_hook",
      "matchStatus": "matched",
      "fallbackRecommendation": null,
      "candidates": [
        {
          "moduleId": "minimal_psych.big_statement_hook",
          "score": 0.91,
          "scoreBreakdown": {
            "sceneRole": 0.3,
            "contentDomain": 0.2,
            "layoutTags": 0.18,
            "retentionTags": 0.13,
            "styleTags": 0.07,
            "aspectRatio": 0.03
          },
          "reason": "role, domain, layout, and retention tags match"
        }
      ],
      "requiresReview": false
    }
  ]
}
```

## replication_plan.json Required Shape

Required top-level fields:

- `schemaVersion`
- `source`
- `target`
- `qualityTarget`
- `replicationStrategy`
- `sceneMapping`
- `subtitleRule`
- `audioRule`
- `assetRule`
- `layoutControls`
- `validationChecks`
- `reviewStatus`

`sceneMapping.moduleId` must exist in `module_registry.json`.

Each `sceneMapping` entry should include:

- `sourceSegmentId`
- `targetRole`
- `moduleId`
- `durationSec`
- `sourcePattern`
- `adaptationInstruction`
- `avoidInstruction`
- `layoutIntent`
- `contentInstruction`

`qualityTarget` should include:

- `retentionGoal`
- `visualSimilarityLevel`
- `originalityLevel`

## video_plan.json Required Shape

`video_plan.json` is the deterministic scene plan compiled from `replication_plan.json`.

Required top-level fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `source`
- `target`
- `scenes`
- `subtitleRule`
- `audioRule`
- `reviewStatus`

Each scene should include:

- `sceneId`
- `sourceSegmentId`
- `moduleId`
- `templateId`
- `role`
- `startSec`
- `durationSec`
- `startFrame`
- `durationInFrames`
- `copy`
- `visual`
- `layoutControls`
- `motion`
- `subtitleCues`
- `assetRefs`
- `reviewNotes`

`copy.copyStatus` must remain `draft_needs_human_or_llm_rewrite` unless a later rewrite step has generated original final copy.

## asset_plan.json Required Shape

`asset_plan.json` lists the concrete assets needed by the compiled scenes.

Required top-level fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `assetRule`
- `assets`
- `providerPolicy`

Each asset should include:

- `assetId`
- `sceneId`
- `slot`
- `assetType`
- `provider`
- `providerOrder`
- `fallbackProvider`
- `status`
- `prompt`
- `negativePrompt`
- `outputPath`
- `fallback`

Asset prompts must explicitly forbid copying source frames, logos, watermarks, platform UI, and recognizable original compositions.

## render-props.json Required Shape

`render-props.json` is the Remotion-facing input package.

Required top-level fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `composition`
- `inputProps`

`composition` should include:

- `compositionId`
- `templateId`
- `styleVariant`
- `aspectRatio`
- `fps`
- `width`
- `height`
- `durationInFrames`
- `bindingStatus`

`inputProps` should include:

- `jobId`
- `topic`
- `language`
- `target`
- `style`
- `timeline`
- `scenes`
- `assets`
- `subtitleRule`
- `audioRule`
- `layoutControls`
- `reviewStatus`

If `composition.bindingStatus` is `adapter_ready`, the artifact can be rendered by `replicated-video-preview` for rough preview. If it is `requires_adapter`, the artifact is a standard production package but is not yet directly consumable by the existing React composition without a Remotion adapter.

## copy_rewrite JSON Required Shape

The copy rewrite stage is generated by a skill/model and applied by programmatic validation.

Top-level required fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `variant`
- `rewrittenScenes`
- `voiceoverUnits`
- `review`

`artifact.type` must be `copy_rewrite`.

`variant` should include:

- `variantId`
- `label`
- `platformFit`
- `contentTone`
- `hookStyle`
- `rhetoricalPattern`
- `emotionCurve`
- `sentenceStyle`
- `ctaStyle`

Each `rewrittenScenes` entry should include:

- `sceneId`
- `sourceSegmentId`
- `role`
- `moduleId`
- `durationSec`
- `headline`
- `body`
- `bullets`
- `keywords`
- `onScreenText`
- `voiceoverDraft`
- `subtitleChunks`
- `retentionDevice`
- `transitionLine`
- `copyStatus`
- `originalityNotes`
- `reviewFlags`

`copyStatus` must be `rewritten` when accepted.

Each subtitle chunk should include:

- `text`
- `emphasisWords`
- `startPolicy`
- optional `pauseAfterSec`

Each `voiceoverUnits` entry should include:

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

`timingStatus` must remain `estimated` until TTS/audio alignment is completed.

## video_plan.rewritten.<variant>.json Required Shape

This file keeps the same top-level structure as `video_plan.json`, but every scene's `copy` object is replaced by the rewritten copy.

Rules:

- preserve `jobId`, `source`, `target`, `scenes`, `subtitleRule`, `audioRule`
- preserve all scene ids, module ids, timings, visual settings, layout controls, motion settings, and asset refs
- set each `scenes[].copy.copyStatus` to `rewritten`
- set top-level `reviewStatus.status` to `needs_copy_review` or `copy_rewritten_needs_tts`
- add `copyVariant` to `target`

## voiceover_units.<variant>.json Required Shape

This is the TTS-ready narration plan.

Top-level required fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `variantId`
- `language`
- `units`
- `timingStatus`
- `reviewStatus`

Each unit should include:

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

`timingStatus` must remain `estimated` until TTS/audio alignment is completed.

## voiceover_package.<variant>.json Required Shape

This file packages the Stage 5 synthesis outputs.

Top-level required fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `variantId`
- `language`
- `timingStatus`
- `alignmentMethod`
- `sourceVoiceoverUnitsPath`
- `outputs`
- `voiceoverText`
- `lengthReport`
- `units`
- `cues`
- `reviewStatus`

`outputs` should include:

- `audioPublicPath`
- `audioAbsolutePath`
- `alignmentPath`
- `subtitlesPath`
- `audioConfigTsPath`
- `renderPropsPath`

## voiceover_alignment.<variant>.json Required Shape

This file stores the raw TTS alignment payload or a close local copy of it.

Keep enough structure to debug timestamps and character alignment.

## voiceover_subtitles.<variant>.json Required Shape

This file stores the subtitle cue list used by the Remotion audio config.

Each cue should include:

- `startFrame`
- `endFrame`
- `text`
- `emphasisWords`

## render-props.voiceover.<variant>.json Required Shape

This is the Stage 4 render props with Stage 5 audio applied.

Rules:

- preserve the existing scene structure and resolved assets
- add `inputProps.audio` as an `AudioLayerConfig`-shaped object
- keep `inputProps.audio.subtitles` compatible with `SubtitleTrack`

## render-props.final.<variant>.json Required Shape

This is the final merged render package for Stage 6.

Rules:

- preserve the existing scene structure, resolved assets, and Stage 5 audio
- keep `composition.compositionId` aligned with the render target
- include all fields needed by Remotion render

## render_package.<variant>.json Required Shape

This file records the final render execution result.

Top-level required fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `variantId`
- `styleVariant`
- `status`
- `composition`
- `renderPropsPath`
- `outputVideoPath`
- `renderCommand`
- `renderTimeSec`
- `renderSummary`
- `qa`
- `reviewStatus`

`renderSummary` should include:

- `fileSizeBytes`
- `expectedDurationSec`
- `mediaProbe`

`qa` should include:

- `status`
- `checks`

## copy_review_report.<variant>.json Required Shape

This file records validation and review state.

Top-level required fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `variantId`
- `status`
- `checks`
- `sceneReports`
- `globalFlags`
- `nextSteps`

The status should remain `needs_review` until a human approves the copy.

## asset_prompt_plan.<variant>.json Required Shape

This file is the skill/model-authored image prompt plan for Stage 4.

Top-level required fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `variantId`
- `styleVariant`
- `providerOrder`
- `assets`

`artifact.type` must be `asset_prompt_plan`.

Each asset should include:

- `assetId`
- `sceneId`
- `slot`
- `assetType`
- `required`
- `size`
- `purpose`
- `prompt`
- `negativePrompt`
- `styleGuide`
- `providerOrder`
- `copyrightBoundary`
- `status`

Provider order should normally start with `local_api`, then `openai_image`, then `svg_fallback`.

If the style is overridden explicitly, the artifact filename should use a matching suffix such as `asset_prompt_plan.<variant>.<style>.json`.

## asset_manifest.<variant>.json Required Shape

This file records actual generated or fallback asset files.

Top-level required fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `variantId`
- `styleVariant`
- `assets`

`artifact.type` must be `asset_manifest`.

Each asset should include:

- `assetId`
- `sceneId`
- `slot`
- `assetType`
- `status`
- `providerUsed`
- `attemptedProviders`
- `publicPath`
- `absolutePath`
- `mimeType`
- `width`
- `height`
- `prompt`
- `negativePrompt`

`publicPath` must be relative to `video-app/public`, for example `generated-jobs/<job_id>/<variant>/<asset>.png`.

When a style override is active, use a matching folder name such as `generated-jobs/<job_id>/<variant>.<style>/<asset>.png`.

## asset_generation_report.<variant>.json Required Shape

This file records provider execution results.

Top-level required fields:

- `schemaVersion`
- `artifact`
- `jobId`
- `variantId`
- `styleVariant`
- `summary`
- `failures`

`summary` should include:

- `total`
- `ready`
- `fallback`
- `failed`

## render-props.assets.<variant>.json Required Shape

This is `render-props.<variant>.json` with resolved assets applied.

Rules:

- preserve the original composition and timeline
- each scene may include `resolvedAssets`
- each scene's `assetRefs` should match resolved asset ids
- top-level `inputProps.assetManifest` should summarize all resolved assets
- when stage 4 runs with a style override, preserve that style identifier in the render-props asset manifest summary
