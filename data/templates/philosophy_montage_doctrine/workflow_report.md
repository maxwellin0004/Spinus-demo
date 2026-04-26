# Philosophy Montage Doctrine Workflow Report

## Purpose

This template is for cinematic doctrine explainers that open with rapid ideology switching and then settle into slow-moving image-led scenes with subtitle-driven narration.

## What Makes This Template Different

- It is not a card system, comic system, dashboard system, or archive-evidence system.
- It depends on a strong opener grammar: intro card -> rapid concept montage -> lock on the target doctrine.
- The body uses one hero image per scene instead of dense on-canvas layout modules.
- Meaning is carried by narration and subtitles, not by visible paragraph text blocks.

## Scene System

- `opener_concept_switch_scene`: intro card plus 8-10 concept switches, each with a unique image.
- `title_stack_scene`: emotional thesis statement.
- `concept_board_scene`: doctrine clarification.
- `rumination_example_scene`: cost-of-behavior example.
- `control_split_scene`: controllable vs uncontrollable split.
- `decision_prompt_scene`: repeatable question before action.
- `axiom_wall_scene`: one operating rule.
- `city_outro_scene`: emotional relief and conclusion.

## Approved Validation Build

- Composition: `video-app/src/compositions/PhilosophyMontageValidationComposition.tsx`
- Preview: `video-app/out/philosophy-montage-validation-preview.mp4`
- Audio: `video-app/public/audio/philosophy-montage/digital-minimalism-elevenlabs-cn.mp3`
- Subtitle timing: `data/audio_scripts/philosophy_montage_subtitle_timeline.horizontal.json`

## Reuse Rules

- Do not reuse old template page skeletons.
- Every opener term needs its own image; avoid one-background opener reuse.
- Body scenes should stay visually sparse: one image, one idea, one subtitle beat.
- If voiceover is regenerated, subtitle timing must be rebuilt from the new audio.
- Bright, emotionally specific imagery performs better here than dark generic wallpaper.

## Good Topic Fit

- digital minimalism
- stoicism for modern habits
- attention economy critique
- anti-burnout doctrine
- practical philosophy for everyday behavior

## Poor Topic Fit

- evidence-heavy tech history
- chart-driven finance explainers
- comic dialogue storytelling
- UI tutorial walkthroughs

## Second Validation Topic

- Topic: `斯多葛主义的情绪边界`
- Why it fits: It keeps the same cinematic doctrine grammar but changes the semantic domain from digital attention management to emotional boundary and judgment control.
- Script pack location: `data/templates/philosophy_montage_doctrine/validation_pack/`
- Orientation: `horizontal`
- Target duration: `48-55s`
- Style variant: `cosmic_doctrine`

## 图片提示词资产
- image_prompt_library.json：逐场景详细正向/负向提示词（含 opener 10 概念词）。
- prompt_variants.json：风格变体提示词（写实/神话绘感/noir）。
- image_generation_rules.md：统一生成与验收规则。

