# White Taxonomy Character Card Template

## Template Contract

This template renders a horizontal 16:9 psychology or behavior taxonomy card:

- White background.
- Large blue centered question.
- One horizontal row of 4-10 category cards.
- Each category uses a generated anime PNG character or a fallback vector figure.
- Bottom black narration band carries the口播字幕.
- Scene changes are low-frequency: the board stays stable, while captions and item highlights advance.

Do not reuse old page masters or scene skeletons from other templates. This template only reuses Remotion primitives, the font system, image loading, and `AudioTrackLayer`.

## Source Files

- Composition: `video-app/src/compositions/SleepPostureTaxonomyComposition.tsx`
- Scene system: `video-app/src/scenes/sleepPostureTaxonomy/SleepPostureTaxonomyScenes.tsx`
- Data: `video-app/src/data/sleepPostureTaxonomyData.ts`
- Audio: `video-app/src/data/sleepPostureTaxonomyAudio.ts`
- Character images: `video-app/public/images/sleep-posture-taxonomy/`
- Audio assets: `video-app/public/audio/sleep-posture-taxonomy/`
- Preview output: `data/jobs/sleep-posture-taxonomy-validation-preview.mp4`

## Data Fields

For a new topic, replace:

- `header.channelLabel`
- `header.eyebrow`
- `header.question`
- `header.sourceNote`
- `items[]`
- `timeline[]`
- `sleepPostureTaxonomyAudio.voiceover.src`
- `sleepPostureTaxonomyAudio.bgm.src`

Each `items[]` object should include:

- `id`: stable id used by timeline highlights.
- `letter`: A/B/C...
- `label`: category name.
- `pose`: semantic pose key.
- `imageSrc`: public-relative PNG path.
- `shortTrait`: short secondary label.

## Asset Rules

Generate each character separately. Do not generate a 6-person sheet and crop it unless the style is already locked.

Recommended prompt skeleton:

```text
A single cute anime-style full-body character sprite of [specific action], [emotion], colorful casual outfit, complete body anatomy with clear torso, arms, hands, legs and shoes, soft rounded face, expressive eyes, natural black hair, polished modern Japanese anime infographic character, flat illustration with soft shading, smooth clean outlines, centered isolated character on pure white background, no text, no labels, no border, high clarity. Avoid stick figure, bean body, noodle limbs, simple doodle, ugly face, deformed hands, extra fingers, messy lines, photorealism.
```

Keep all PNGs visually consistent:

- Similar camera distance.
- Similar body scale.
- Pure white or transparent-looking background.
- No embedded label text.
- Strongly distinct pose silhouette.

## Audio Rules

Rough preview can use estimated timeline segments.

For final delivery:

1. Write口播 text in `data/audio_scripts/`.
2. Generate or import voiceover into `video-app/public/audio/sleep-posture-taxonomy/`.
3. Update `sleepPostureTaxonomyAudio.voiceover.src`.
4. If exact subtitle sync is required, regenerate `subtitle_timeline.generated.horizontal.json` from the final audio timestamps.

## Render

```powershell
Set-Location .\video-app
npx remotion render src/index.ts sleep-posture-taxonomy-validation-preview ..\data\jobs\sleep-posture-taxonomy-validation-preview.mp4
```

## Validation Checklist

- Characters are anime/person illustrations, not stick figures.
- All category poses are visually distinct at 1920x1080.
- The board stays stable; only caption, highlight, and subtle push-in move.
- Bottom caption does not overlap with item row.
- MP4 contains an audio stream.
- No imports from old template scene systems.
