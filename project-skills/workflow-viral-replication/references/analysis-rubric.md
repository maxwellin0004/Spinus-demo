# Analysis Rubric

Use this reference when creating `viral_breakdown.json` or evaluating whether a Stage 2 `analysis.json` is detailed enough for replication.

## Quality Bar

A usable breakdown must identify:

- why the first 0-5 seconds retain attention
- how the video is segmented
- where rhythm changes happen
- which visual layouts repeat
- what subtitle grammar is used
- how voice, pause, BGM, and SFX support retention
- what is fixed versus variable for future videos

Avoid vague labels unless followed by executable detail. Bad: `fast rhythm`. Better: `frontLoadedDensity=high; first three changes occur within 0-5s; average hook change interval is about 1.5s`.

## Hook Analysis

Extract these fields:

- `hook.type`: one of the controlled hook labels from `tag-taxonomy.md`
- `hook.startSec` and `hook.endSec`
- `hook.firstFramePromise`: what the viewer is promised immediately
- `hook.curiosityGap`: what information is withheld
- `hook.viewerIdentityTrigger`: which viewer identity is activated
- `hook.riskOrReward`: pain, risk, benefit, or payoff
- `hook.visualSupport`: how the image/layout reinforces the hook
- `hook.audioSupport`: voice/BGM/SFX contribution
- `hook.whyItRetains`: concrete retention mechanism
- `hook.confidence`: 0-1

## Packaging Analysis

Preserve packaging surfaces separately:

- title
- cover text
- first-frame text
- description opening when relevant

For each surface, capture raw text when available, its role, formula, relationship to other surfaces, and confidence. Do not merge title and first-frame text into one generic hook.

## Segment Analysis

Segments must be continuous, non-overlapping, and ordered by time.

Each segment needs:

- `id`: stable local id such as `seg_01`
- `role`: controlled `sceneRole`
- `startSec`
- `durationSec`
- `layoutTags`
- `retentionTags`
- `visualTags`
- `subtitleDensity`
- `audioEnergy`
- `visualIntent`
- `reusableRule`
- `confidence`

Add `sourceEvidenceIds` whenever possible. Each important claim should point to at least one evidence item when the source is available.

Use `estimated` or lower confidence when timestamps are inferred without reliable OCR/ASR.

For replication control, add:

- `replicationPriority`: `high`, `medium`, or `low`
- `mustPreserve`: structural properties to preserve, such as `role`, `timing`, `hook_type`, `subtitle_density`
- `canChange`: replaceable properties, such as `copy`, `visual_asset`, `example`, `speaker_wording`

## Rhythm Analysis

Do not collapse rhythm into a single adjective. Capture:

- `avgShotLengthSec`
- `cutDensity`: `low`, `medium`, `medium_high`, `high`
- `frontLoadDensity`: `low`, `medium`, `high`
- `turningPointsSec`
- `speedCurve`, for example `fast_opening_then_medium_explain`
- `pausePattern`
- `peakMoments`

## Visual Layout Analysis

For each recurring visual layout, identify:

- layout tag
- role in the narrative
- where text sits
- where images/charts/characters sit
- whether the background is full bleed, card based, split screen, or document-like
- asset dependency level: `none`, `low`, `medium`, `high`
- recreation difficulty: `low`, `medium`, `high`
- `moduleHints` when a known local module obviously fits
- `layoutControls` when the layout can be represented by render controls

## Evidence Requirements

When a source video or Stage 2 artifact is available:

- `hook.type` must have evidence.
- every segment must have at least one evidence id.
- every visual layout should have evidence or confidence below `0.6`.
- every high-confidence style or rhythm claim should cite evidence.

If evidence is missing, mark `reviewStatus.requiresHumanReview=true` in downstream plans.

## Subtitle Analysis

Extract:

- position
- font size class
- max line count
- approximate characters per line
- highlight strategy
- highlight color if visible
- stroke/background behavior
- timing sync pattern

If exact font size is unknown, use `small`, `standard`, `large`, or `extra_large`.

## Audio Analysis

Extract:

- voice pace
- voice energy curve
- pause pattern
- BGM mood
- SFX density
- hook sound emphasis
- sync behavior between speech and visual changes

If no audio is available, mark audio fields as `unknown` and confidence below 0.4.

## Confidence Rules

- `0.9-1.0`: directly observed from reliable video/OCR/ASR
- `0.7-0.89`: strong visual or transcript evidence
- `0.5-0.69`: plausible inference with partial evidence
- `0.3-0.49`: weak inference; needs review
- `<0.3`: unknown or placeholder

## Fixed vs Variable

Always separate:

- fixed reusable rules: structure, hook type, timing logic, subtitle grammar
- variable candidates: topic, examples, names, claims, images, exact copy
