# Output Examples

Use these examples as compact shape references, not as exact content.

## viral_breakdown.json

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
    "sourceVideoId": "ref_psych_001",
    "durationSec": 58.4,
    "aspectRatio": "9:16",
    "platformGuess": "xiaohongshu",
    "contentDomain": "psychology",
    "language": "zh-CN"
  },
  "packaging": {
    "title": {
      "raw": "Why self-discipline keeps failing",
      "formula": "pain point + mechanism promise",
      "contains": ["risk", "promise"],
      "confidence": 0.72
    },
    "coverText": {"raw": null, "role": "unknown", "confidence": 0.2},
    "firstFrameText": {
      "raw": "You are not lazy",
      "role": "identity callout",
      "confidence": 0.78
    },
    "surfaceRelationship": "Title promises an explanation; first frame creates viewer self-identification."
  },
  "hook": {
    "type": "reverse_claim",
    "startSec": 0,
    "endSec": 3.5,
    "firstFramePromise": "The viewer's failure has been misdiagnosed",
    "curiosityGap": "What actually causes repeated failure",
    "viewerIdentityTrigger": "People who blame themselves for poor discipline",
    "riskOrReward": "Relief from self-blame plus a practical mechanism",
    "visualSupport": "Large centered statement on clean background",
    "audioSupport": "Fast opening claim followed by a brief pause",
    "whyItRetains": "It rejects the viewer's existing explanation and opens a mechanism gap.",
    "confidence": 0.78
  },
  "narrativeStructure": {
    "pattern": ["hook", "problem", "mechanism", "case", "method", "close"],
    "turningPointsSec": [0, 3.5, 12, 25, 43, 55],
    "summary": "Claim first, then explain the hidden mechanism, validate with a case, and end with a method."
  },
  "segments": [
    {
      "id": "seg_01",
      "role": "hook",
      "startSec": 0,
      "durationSec": 3.5,
      "layoutTags": ["large_text_center"],
      "retentionTags": ["reverse_claim", "self_identification"],
      "visualTags": ["text_driven", "minimal_background"],
      "subtitleDensity": "high",
      "audioEnergy": "high",
      "transitionIn": "cold_open",
      "transitionOut": "short_pause_then_problem_setup",
      "visualIntent": "Deliver a strong identity-level correction immediately.",
      "reusableRule": "Open by replacing a common self-blame explanation with a sharper mechanism claim.",
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
      {"timeSec": 0.8, "reason": "contrarian identity statement lands"},
      {"timeSec": 25, "reason": "case example validates the mechanism"}
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
      "rule": "Keep opening screen text-driven and uncluttered."
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
    "moodTags": ["calm", "sharp", "reflective"],
    "paletteTags": ["warm_paper", "gold_accent"],
    "texture": "clean_editorial",
    "motionStyle": "slow_push_with_text_reveal"
  },
  "fixedRules": [
    "Open with a viewer-identity correction",
    "Explain the hidden mechanism before giving advice",
    "Use two-line subtitles with keyword highlight"
  ],
  "variableCandidates": ["topic", "viewer identity", "case example", "method wording", "supporting visual assets"],
  "sourceEvidence": [
    {
      "id": "ev_001",
      "sourceType": "video_frame",
      "timeRangeSec": [0, 1.2],
      "supports": ["hook.visualSupport", "segments.seg_01.layoutTags"],
      "note": "Opening frame is text-centered and uncluttered."
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

## module_match_report.json

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
  "jobId": "job_ref_001",
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
          "reason": "Matches hook role, psychology domain, large_text_center layout, and reverse_claim retention."
        },
        {
          "moduleId": "comic_habit_spiral.split_hook",
          "score": 0.72,
          "scoreBreakdown": {
            "sceneRole": 0.3,
            "contentDomain": 0.12,
            "layoutTags": 0.12,
            "retentionTags": 0.11,
            "styleTags": 0.02,
            "aspectRatio": 0.05
          },
          "reason": "Hook role matches, but comic style has higher visual dependency."
        }
      ],
      "requiresReview": false
    }
  ]
}
```

## replication_plan.json

```json
{
  "schemaVersion": "1.0",
  "artifact": {
    "type": "replication_plan",
    "status": "draft",
    "createdAt": "2026-05-05T00:00:00+08:00",
    "updatedAt": "2026-05-05T00:00:00+08:00",
    "generator": "workflow-viral-replication"
  },
  "source": {
    "viralBreakdownPath": "data/jobs/job_ref_001/viral_breakdown.json",
    "moduleMatchReportPath": "data/jobs/job_ref_001/module_match_report.json"
  },
  "target": {
    "accountId": "psych_xhs",
    "templateId": "minimal_psych_explainer",
    "styleVariant": "warm_paper",
    "aspectRatio": "9:16",
    "durationSec": 60,
    "language": "zh-CN"
  },
  "qualityTarget": {
    "retentionGoal": "Preserve hook density, segment timing, and the problem-to-mechanism payoff.",
    "visualSimilarityLevel": "structure_and_rhythm",
    "originalityLevel": "high"
  },
  "replicationStrategy": {
    "strength": "medium",
    "replicate": [
      "narrative_structure",
      "segment_timing",
      "hook_pattern",
      "subtitle_density",
      "visual_layout_roles"
    ],
    "doNotReplicate": [
      "exact_words",
      "original_frames",
      "original_voice",
      "original_music",
      "logos",
      "watermarks"
    ]
  },
  "sceneMapping": [
    {
      "sourceSegmentId": "seg_01",
      "targetRole": "hook",
      "moduleId": "minimal_psych.big_statement_hook",
      "durationSec": 4,
      "sourcePattern": "viewer-identity correction delivered as a contrarian claim",
      "adaptationInstruction": "Change the claim to the new topic while preserving the identity correction shape.",
      "avoidInstruction": "Do not reuse the source video's exact opening sentence or recreate its first frame.",
      "layoutIntent": "Center a large statement and deliver a contrarian claim in the first second",
      "contentInstruction": "Replicate the contrarian structure, but rewrite copy for the new topic"
    }
  ],
  "subtitleRule": {
    "fontSize": 36,
    "color": "#ffffff",
    "highlightColor": "#ffd166",
    "position": "bottom_center",
    "maxCharsPerLine": 14
  },
  "audioRule": {
    "voicePace": "medium_fast",
    "bgmMood": "low_tension",
    "sfxDensity": "low"
  },
  "assetRule": {
    "provider": "auto",
    "providerOrder": ["local_asset", "local_api", "openai_image", "svg_fallback"],
    "fallbackProvider": "svg_fallback",
    "allowLocalApi": true,
    "avoidCopyOriginalFrames": true
  },
  "layoutControls": {
    "titlePosition": "center",
    "subtitlePosition": "bottom_center",
    "imageMode": "supporting_visual",
    "density": "medium_high",
    "motionPreset": "slow_push_with_text_reveal"
  },
  "validationChecks": [
    "sceneMapping.moduleId exists in module_registry",
    "no source exact words appear in generated script",
    "no source frame or watermark is used as an asset",
    "all required asset slots have manifest entries or fallbacks",
    "subtitle line length stays within maxCharsPerLine"
  ],
  "reviewStatus": {
    "status": "draft",
    "requiresHumanReview": true
  }
}
```
