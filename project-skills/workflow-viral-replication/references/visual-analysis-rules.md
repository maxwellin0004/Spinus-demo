# Visual Analysis Rules

`visual_analysis_detailed.json` is the bridge between video decomposition and high-fidelity Remotion replication.

For every structural scene, analyze these layers:

- `layout`: layout archetype, title zone, subtitle zone, subject zone, creator-handle zone, image mode, safe areas.
- `textLayers`: headline, subtitle, keyword highlight, creator handle. Creator identity is detection-only unless the target account explicitly provides one.
- `imageLayer`: background or supporting visual, subject pattern, negative-space needs, generated-text policy.
- `motion`: camera movement, scale range, parallax, motion intensity, and reusable motion preset.
- `effects`: film grain, vignette, glow, light leak, blur, particles, scanline, shake, or other scene-level effects.
- `transition`: cut/dissolve/blur/flash timing, duration, and audio-sync purpose.
- `subtitleBehavior`: short rhythm captions, max line length, max lines, and whether full voiceover paragraphs are forbidden.
- `remixDirective`: what to preserve, what to innovate, and what to remove or replace.

Preserve:

- layout hierarchy
- scene timing
- subtitle position and density
- motion grammar
- effect stack
- transition rhythm

Change:

- source frame
- creator identity
- exact text
- original face/person
- original logo/watermark
- source-specific scene composition

For cinematic quote references, prefer:

- full-bleed background
- top-center title
- short red/highlighted subtitle below title
- no full paragraph subtitles
- slow push or gentle pan
- film grain, vignette, soft glow, optional light leak
- clean hard cut or subtle dissolve between narrative beats
