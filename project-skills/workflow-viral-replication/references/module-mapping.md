# Module Mapping

Use this reference when creating `module_match_report.json` or drafting `data/module_registry.json`.

## Scoring

Default weighted score:

```text
sceneRole match: 30
contentDomain match: 20
layoutTags overlap: 20
retentionTags overlap: 15
styleTags overlap: 10
aspectRatio support: 5
```

Normalize to `0-1`.

Each candidate must include a `scoreBreakdown` object using the same keys:

```json
{
  "sceneRole": 0.3,
  "contentDomain": 0.2,
  "layoutTags": 0.18,
  "retentionTags": 0.12,
  "styleTags": 0.08,
  "aspectRatio": 0.05
}
```

## Match Rules

- `sceneRole` mismatch should usually disqualify a module unless the role is adjacent, such as `problem` and `setup`.
- Aspect ratio mismatch should mark `requiresReview=true`.
- High `riskLevel` modules should require review when asset dependency is also high.
- Prefer one stable template family for the whole video unless the user explicitly asks for mixed modules.
- If scores are close within 0.08, keep both candidates and explain the tradeoff.
- If the top score is below `0.55`, set `matchStatus=weak_match`.
- If no candidate scores above `0.35`, set `matchStatus=no_match` and include `fallbackRecommendation`.

## Module Registry Drafting

Start with coarse modules instead of exact React component names. A module can represent a reusable scene pattern.

Example:

```json
{
  "moduleId": "minimal_psych.big_statement_hook",
  "templateId": "minimal_psych_explainer",
  "displayName": "Psychology big statement hook",
  "sceneRole": "hook",
  "supportedAspectRatios": ["9:16", "16:9"],
  "contentDomains": ["psychology", "self_growth", "behavior"],
  "layoutTags": ["large_text_center", "text_driven", "minimal_background"],
  "retentionTags": ["reverse_claim", "pain_point", "self_identification"],
  "styleTags": ["clean_white", "soft_blue", "warm_paper"],
  "inputFields": ["headline", "subheadline", "keywords", "subtitleCues"],
  "assetSlots": [],
  "riskLevel": "low",
  "notes": "Useful for restrained psychology, behavior, and mechanism-explainer openings"
}
```

## Candidate Reason Format

Reasons should be short but concrete:

```text
Matches hook role, psychology domain, large_text_center layout, and reverse_claim retention; low asset risk.
```

Avoid:

```text
Looks suitable.
```

## Report Requirements

Every source segment needs:

- at least one selected module
- up to three ranked candidates
- numeric score
- score breakdown
- reason
- `matchStatus`
- `fallbackRecommendation` when weak or missing
- `requiresReview`
