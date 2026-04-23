# Duck Generation Workflow

## Rule

For `tech_archive_explainer`, the duck mascot must not be reused as one generic cutout.

Use this sequence:

1. Lock the character identity using `duck_character_system.json`.
2. Pick the matching scene action from `duck_scene_prompts.json`.
3. Generate one transparent-background duck asset per scene.
4. Save final selected assets into:
   - `video-app/public/images/tech-archive/duck-ai/`
5. Update the scene mapping so each scene uses its own duck image.

## Why

If one duck pose is reused everywhere:

- the video looks cheap
- the duck feels like a sticker, not an IP
- action and narration stop matching

If each scene has its own duck:

- the mascot becomes part of the storytelling
- the video feels closer to a real channel identity
- hook / analysis / explanation / summary all become more natural

## Prompting standard

Every duck prompt must include:

- transparent background
- cute polished 2D illustration
- same character identity
- exact scene action
- emotional state
- no text
- no background card
- no watermark

## Recommended scene-to-pose mapping

- Hook scene: `hook_question`
- Historical archive scene: `archive_research`
- Standard/protocol explanation scene: `pointing_explain`
- Capability upgrade scene: `power_growth`
- Closing summary scene: `final_present`

## Upgrade note

Current SVG duck assets are temporary placeholders.

The preferred next version is:

- generate raster duck assets with AI
- export transparent PNG
- map each PNG directly into the Remotion scenes
