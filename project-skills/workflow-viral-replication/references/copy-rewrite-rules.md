# Copy Rewrite Rules

Use these rules when turning a compiled `video_plan.json` draft into original, publishable copy.

The rewrite stage must preserve the reference video's reusable structure while replacing the actual words, examples, metaphors, and creative choices.

## Purpose

The copy rewrite stage converts deterministic placeholder copy into:

- screen text that can be read quickly
- voiceover text that can be spoken naturally
- subtitle chunks that can be aligned after TTS
- reviewable evidence that the copy is original

The stage does not generate final audio. All timings remain estimated until TTS or human voiceover is generated and aligned.

## Inputs

Required files:

- `video_plan.json`
- `viral_breakdown.json`
- `replication_plan.json`

Recommended files:

- `module_match_report.json`
- `asset_plan.json`
- `render-props.json`

Required user/runtime inputs:

- `topic`
- `copyVariant`
- `targetAudience`
- `platform`
- `language`
- `durationSec`
- `accountStyle` when available

## Outputs

Generate one output set per copy variant:

- `video_plan.rewritten.<variant_id>.json`
- `voiceover_units.<variant_id>.json`
- `copy_review_report.<variant_id>.json`
- optionally `render-props.<variant_id>.json` after rewritten copy is applied

Do not overwrite the original `video_plan.json`.

## Program and Skill Responsibilities

Program responsibilities:

- load source JSON files
- build a compact `copy_rewrite_context.json`
- validate JSON shape
- check rough length limits
- write rewritten artifacts
- preserve scene ids, module ids, timing, style, and asset references

Skill / model responsibilities:

- rewrite screen text, voiceover, and subtitle chunks
- select tone and rhetorical pattern
- make copy natural and platform-fit
- avoid similarity to the reference video
- make each scene's copy fit its role and duration

## Copy Variant IDs

Use stable snake_case variant ids.

Recommended variants:

- `sharp_contrarian`: sharp, direct, reverse-claim, high opening tension
- `warm_explainer`: calm, reassuring, mechanism-first, Xiaohongshu friendly
- `story_case`: story-led, example-first, everyday scene
- `expert_breakdown`: authoritative, structured, documentary/explainer tone
- `checklist_method`: practical, action-led, save-worthy
- `emotional_resonance`: empathy-led, identity and pain-point driven
- `newsroom_warning`: urgent, risk-led, suitable for finance/news
- `ai_workflow_explainer`: dense, technical, workflow payoff led

Each variant must define:

- `variantId`
- `label`
- `platformFit`
- `contentTone`
- `hookStyle`
- `rhetoricalPattern`
- `emotionCurve`
- `sentenceStyle`
- `ctaStyle`

## Variant Guidance

### sharp_contrarian

Use when the reference hook is a reverse claim, mistake warning, or identity correction.

Rules:

- first line should challenge a common belief
- use short, strong sentences
- explain the correction quickly
- avoid sounding like personal attack

Example pattern:

```text
You are not failing because of X.
You are failing because Y is designed wrong.
```

### warm_explainer

Use when the target account needs trust, softness, and lower pressure.

Rules:

- reduce blame
- use gentle reframing
- keep mechanism clear
- avoid excessive urgency

Example pattern:

```text
This may not be a willpower problem.
It may be that the first step is too heavy.
```

### story_case

Use when the topic needs concrete relatability.

Rules:

- open with a specific person or moment
- make the case original
- keep the story short
- reveal the mechanism after the story setup

Example pattern:

```text
Someone plans to study every night.
But the real failure happens before the desk, not at the desk.
```

### expert_breakdown

Use for education, AI, finance, psychology, or business explainers.

Rules:

- state the conclusion early
- define the mechanism in parts
- use precise nouns
- avoid academic bulk

### checklist_method

Use when the replication plan's middle or ending has method/checklist roles.

Rules:

- make the script save-worthy
- use numbered actions
- make each action visually separable
- avoid generic advice

### emotional_resonance

Use when the reference retains through identity, self-recognition, anxiety, relief, or aspiration.

Rules:

- describe the viewer's inner state accurately
- give relief before method
- avoid melodrama
- keep the final takeaway practical

## Scene Role Requirements

### hook

Goal:

- earn the next 2 seconds
- open the loop immediately
- match the reference hook mechanism without copying its words

Required copy:

- `headline`: 1-2 short lines, screen-safe
- `voiceoverDraft`: 1-2 spoken sentences
- `subtitleChunks`: 1-3 chunks
- `retentionDevice`: one of `reverse_claim`, `pain_point`, `big_number`, `curiosity_gap`, `mistake_warning`, `identity_callout`, `result_first`, `question_open`

Avoid:

- "Today we will talk about..."
- background setup
- generic motivational claims

### problem / setup

Goal:

- name the real tension
- make the viewer feel the topic is relevant
- prepare the mechanism

Required copy:

- concrete problem statement
- one reason it matters
- one bridge into the next scene

### mechanism

Goal:

- explain why the problem happens
- make the hidden logic visible
- support a panel/document/flow layout

Required copy:

- cause
- trigger
- result
- one compact metaphor or named mechanism if useful

Avoid:

- vague explanations
- long definitions
- advice before mechanism

### case / evidence

Goal:

- prove the mechanism through a new example
- make abstract logic concrete

Required copy:

- original case
- visible detail
- conclusion tied to the mechanism

Avoid:

- copying the reference video's example
- adding unsupported factual claims

### contrast

Goal:

- show "what people think" vs "what actually matters"

Required copy:

- left-side belief
- right-side correction
- one-line takeaway

### method / checklist

Goal:

- turn insight into repeatable action
- increase save/share value

Required copy:

- 2-4 actions
- each action must be concrete
- no generic advice like "just persist"

### close / cta

Goal:

- compress the payoff
- leave a memorable original line
- optionally invite action

Required copy:

- one takeaway
- optional CTA, light and platform-fit

Avoid:

- overexplaining
- hard-sell CTA unless account style requires it

## Length Rules

Use duration to constrain spoken text.

Chinese:

- conservative voiceover: 3.5-4.5 Chinese chars/sec
- fast voiceover: 4.5-5.5 Chinese chars/sec
- screen headline: usually 8-22 Chinese chars
- screen body: usually 12-36 Chinese chars
- subtitle chunk: usually 6-16 Chinese chars

English:

- conservative voiceover: 2.0-2.5 words/sec
- fast voiceover: 2.5-3.2 words/sec
- screen headline: usually 3-9 words
- screen body: usually 6-18 words
- subtitle chunk: usually 3-8 words

For each scene, compute:

```text
target_spoken_chars = durationSec * chars_per_sec
```

If the voiceover exceeds 120% of the target range, rewrite shorter.

## Screen Text Rules

Screen text is not the same as voiceover.

Screen headline:

- should be scannable without audio
- should preserve the scene's core point
- should avoid long subordinate clauses
- should not exceed the layout's safe text density

Screen body:

- should support the headline
- should be shorter than voiceover
- should be optional for hook and close scenes

Keywords:

- choose 1-4 words/phrases
- prefer nouns, actions, numbers, or contrast words
- avoid selecting filler words

## Voiceover Rules

Voiceover must:

- sound natural when read aloud
- use short sentences
- keep one idea per sentence where possible
- preserve the scene's role
- connect smoothly to the next scene

Do not:

- write essay-like paragraphs
- use overly polished written-language phrasing
- add facts that require verification unless source material supports them
- mention the reference video
- describe the workflow itself

## Subtitle Rules

Subtitles are derived from voiceover but must be chunked.

Each subtitle chunk should include:

- `text`
- `emphasisWords`
- `startPolicy`: `estimated`
- optional `pauseAfterSec`

Do not treat subtitle timing as final. Final timestamps must come after TTS or alignment.

## Originality Rules

Preserve:

- segment role
- timing ratio
- hook mechanism
- narrative order
- visual layout role
- subtitle density
- emotional curve

Replace:

- exact words
- example
- metaphor
- character/persona
- visual asset
- music/voice references
- creator identity
- platform UI

The rewritten copy must be independently publishable without seeing the source video.

## JSON Output Contract

The model should output JSON only when used by automation.

Top-level:

```json
{
  "schemaVersion": "1.0",
  "artifact": {
    "type": "copy_rewrite",
    "status": "draft",
    "generator": "workflow-viral-replication"
  },
  "jobId": "job_id",
  "variant": {
    "variantId": "sharp_contrarian",
    "label": "Sharp contrarian",
    "platformFit": ["douyin", "xiaohongshu"],
    "contentTone": "sharp",
    "hookStyle": "reverse_claim",
    "rhetoricalPattern": "belief_correction_to_mechanism",
    "emotionCurve": "high_opening_then_clear_explain",
    "sentenceStyle": "short_direct",
    "ctaStyle": "light_save_prompt"
  },
  "rewrittenScenes": [
    {
      "sceneId": "scene_01_hook",
      "sourceSegmentId": "seg_01",
      "role": "hook",
      "moduleId": "minimal_psych.big_statement_hook",
      "durationSec": 4,
      "headline": "你不是懒，是启动成本太高",
      "body": "真正卡住你的，往往不是自控力。",
      "bullets": [],
      "keywords": ["不是懒", "启动成本"],
      "onScreenText": ["你不是懒", "是启动成本太高"],
      "voiceoverDraft": "你不是懒，你只是把开始这件事设计得太重了。",
      "subtitleChunks": [
        {
          "text": "你不是懒",
          "emphasisWords": ["不是懒"],
          "startPolicy": "estimated",
          "pauseAfterSec": 0.12
        },
        {
          "text": "是启动成本太高",
          "emphasisWords": ["启动成本"],
          "startPolicy": "estimated",
          "pauseAfterSec": 0.2
        }
      ],
      "retentionDevice": "reverse_claim",
      "transitionLine": "先别急着怪自己，先看它是怎么发生的。",
      "copyStatus": "rewritten",
      "originalityNotes": [
        "Uses the reference hook mechanism but replaces the opening wording.",
        "Uses a new metaphor around startup cost."
      ],
      "reviewFlags": []
    }
  ],
  "voiceoverUnits": [
    {
      "voiceId": "v001",
      "sceneId": "scene_01_hook",
      "role": "hook",
      "text": "你不是懒，你只是把开始这件事设计得太重了。",
      "targetDurationSec": 4,
      "intendedPauseAfterSec": 0.2,
      "pace": "medium_fast",
      "emotion": "sharp",
      "emphasisWords": ["不是懒", "开始", "太重"],
      "timingStatus": "estimated"
    }
  ],
  "review": {
    "status": "needs_review",
    "summary": "Copy rewritten for structure and originality; final TTS alignment still required.",
    "checks": [
      {
        "name": "scene_coverage",
        "status": "passed",
        "note": "All scenes have rewritten copy."
      }
    ],
    "globalFlags": []
  }
}
```

## Review Checks

Run these checks before accepting rewritten copy:

- every `video_plan.scenes[].sceneId` has one rewritten scene
- every rewritten scene keeps the same `sceneId`, `sourceSegmentId`, `role`, and `moduleId`
- `copyStatus` is `rewritten`
- `headline`, `onScreenText`, and `voiceoverDraft` are non-empty
- voiceover length fits scene duration within a reasonable tolerance
- subtitle chunks are shorter than the voiceover and readable
- no placeholder words remain
- no source exact words are reused when source transcript is available
- no original frame, voice, music, creator identity, or watermark is referenced
- final status remains `needs_review` until human approval

## Prompt Assembly Guidance

When assembling the prompt, include only the relevant compressed context:

- target topic and audience
- selected copy variant
- global duration and platform
- viral hook type and narrative pattern
- fixed rules and do-not-copy boundary
- per-scene role, duration, layout intent, retention tags, and current placeholder copy

Do not paste full raw analysis if the rewritten copy can be generated from the normalized artifacts.

## Relationship To Existing Skills

Use these ideas from existing skills:

- from `video-script-maker`: keep voiceover units stable and alignment-ready
- from `short-video-script-creator`: use strong first-three-second hooks, pain points, reverse claims, and result-first openings
- from `workflow-video-script-writer`: make the first lines earn attention and avoid slow intros
- from `video_ai_2`: keep voiceover, subtitles, and visuals consistent

Do not directly reuse those skills' output formats. This workflow requires scene-level JSON that can be written back into `video_plan`.
