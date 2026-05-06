# Layout Profile Rules

`layout_profile.json` decides whether a reference should use an existing information template or a visual-layout-specific Remotion template.

Required fields:

- `layoutArchetype`: one of `cinematic_quote_full_bleed`, `hud_explainer`, `document_card`, `split_screen_tutorial`, `talking_head_caption`, `template_module_adapted`
- `recommendedTemplateId`: template id to prefer during module matching
- `recommendedStyleVariant`: style variant to pass into the plan
- `visualSimilarityMode`: `layout_and_style`, `layout_only`, or `structure_and_rhythm`
- `detectedTraits`: booleans for full-bleed background, large top title, bilingual subtitles, creator handle, card/HUD layout
- `layoutTags` and `styleTags`: tags to merge into segments before module matching
- `textZones`: title, subtitle, secondary subtitle, creator handle positions
- `assetPolicy`: image mode, safe text zones, and whether generated images must contain no text

For `cinematic_quote_full_bleed`:

- Use full-screen background media, not cards or panels.
- Render text in Remotion, not inside generated images.
- Preserve top title/source, lower bilingual subtitle, and bottom creator-handle zones.
- Prefer `cinematic_quote_full_bleed` modules regardless of content domain.
- Use slow push or gentle parallax motion.
