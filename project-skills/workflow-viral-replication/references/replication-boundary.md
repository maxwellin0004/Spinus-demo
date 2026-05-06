# Replication Boundary

Use this reference for every replication plan.

## Allowed to Replicate

- narrative structure
- hook type
- timing pattern
- subtitle placement and highlight grammar
- visual layout roles
- emotional curve
- pacing and density
- abstract production rules

## Not Allowed to Replicate

- exact words or near-paraphrased source script
- original frames or frame compositions that recreate a distinctive shot
- recognizable people from the source
- original voice or voice clone
- original music
- logos, watermarks, platform UI, creator identity
- proprietary screenshots or brand assets without permission

## Required Fields

Every `viral_breakdown.json` must include:

```json
{
  "copyrightBoundary": {
    "referenceOnlyForStructure": true,
    "doNotCopyExactWords": true,
    "doNotCopyOriginalFrames": true,
    "doNotCopyVoice": true,
    "doNotCopyMusic": true
  }
}
```

Every `replication_plan.json` must include:

```json
{
  "replicationStrategy": {
    "doNotReplicate": [
      "exact_words",
      "original_frames",
      "original_voice",
      "original_music",
      "logos",
      "watermarks"
    ]
  }
}
```

## Review Defaults

Set:

```json
{
  "reviewStatus": {
    "status": "draft",
    "requiresHumanReview": true
  }
}
```

Only mark reviewed after the user explicitly approves the plan or a review workflow records approval.

