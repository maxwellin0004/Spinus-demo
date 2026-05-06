# Tag Taxonomy

Use these controlled tags for matching. If a needed tag is missing, add it deliberately to this file and update module entries; do not invent one-off synonyms.

## contentDomain

- `psychology`
- `behavior`
- `trading`
- `finance`
- `ai`
- `technology`
- `business`
- `self_growth`
- `education`
- `literature`
- `math`
- `social_commentary`

## sceneRole

- `hook`
- `problem`
- `setup`
- `mechanism`
- `case`
- `evidence`
- `contrast`
- `method`
- `checklist`
- `close`
- `cta`

## hook.type

- `reverse_claim`
- `pain_point`
- `big_number`
- `curiosity_gap`
- `conflict_setup`
- `mistake_warning`
- `result_first`
- `question_open`
- `identity_callout`

## layoutTags

- `large_text_center`
- `top_title_body_text`
- `split_screen`
- `chart_board`
- `case_card`
- `document_panel`
- `comic_panel`
- `timeline`
- `checklist`
- `full_bleed_image`
- `background_image_overlay`
- `quote_card`
- `comparison_table`
- `number_dashboard`
- `evidence_wall`
- `method_cards`
- `progressive_reveal`

## retentionTags

- `reverse_claim`
- `pain_point`
- `curiosity_gap`
- `big_number`
- `conflict`
- `mistake_analysis`
- `self_identification`
- `evidence_drop`
- `step_by_step`
- `open_loop`
- `payoff`
- `risk_warning`
- `before_after`

## visualTags

- `text_driven`
- `minimal_background`
- `warm_editorial`
- `archival_material`
- `chart_visual`
- `cinematic_still`
- `comic_illustration`
- `documentary_broll`
- `ui_like_panel`
- `photo_overlay`

## styleTags

- `clean_white`
- `warm_paper`
- `soft_blue`
- `gray_academic`
- `dark_warning_orange`
- `dark_warning_red`
- `chart_blue_orange`
- `dark_archive_green`
- `warm_retro_orange`
- `blue_lab_document`
- `comic_night_purple`
- `comic_soft_day_blue`
- `cinematic_amber_noir`
- `cool_probability_room`
- `cold_newsroom`

## Density / Energy Values

Use these values for `subtitleDensity`, `audioEnergy`, `cutDensity`, and related fields:

- `low`
- `medium`
- `medium_high`
- `high`

## Evidence Sources

Use these values in `sourceEvidence[].sourceType`:

- `video_frame`
- `ocr`
- `asr`
- `transcript`
- `metadata`
- `manual_note`
- `inference`

## Review Status

Use these values in `reviewStatus.status`:

- `draft`
- `needs_review`
- `approved`
- `rejected`

## Artifact Status

Use these values in top-level `artifact.status`:

- `draft`
- `partial`
- `ready`
- `stale`
- `failed`

## Match Status

Use these values in `module_match_report.matches[].matchStatus`:

- `matched`
- `weak_match`
- `no_match`

## Fallback Recommendations

Use these values when module matching is weak or missing:

- `use_template_level_match`
- `require_new_module`
- `manual_review`
- `fallback_to_generic_scene`

## Visual Similarity Level

Use these values in `replication_plan.qualityTarget.visualSimilarityLevel`:

- `structure_only`
- `structure_and_rhythm`
- `structure_rhythm_style`

## Originality Level

Use these values in `replication_plan.qualityTarget.originalityLevel`:

- `medium`
- `high`
- `strict`

## Naming Rules

- Prefer lower snake case for tag values.
- Keep tag values short and reusable.
- Put explanations in `summary`, `notes`, `visualIntent`, or `reusableRule`, not in tag names.
