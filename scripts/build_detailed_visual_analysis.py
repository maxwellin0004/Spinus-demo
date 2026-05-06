#!/usr/bin/env python
"""Build detailed per-scene visual analysis for replication rendering."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, parse_time_range, safe_text, str_list, write_json


def text_blob(value: Any) -> str:
    if isinstance(value, dict):
        return " ".join(text_blob(item) for item in value.values())
    if isinstance(value, list):
        return " ".join(text_blob(item) for item in value)
    return str(value or "")


def lower_blob(value: Any) -> str:
    return text_blob(value).lower()


def get_sections(analysis: dict[str, Any]) -> list[dict[str, Any]]:
    sections = analysis.get("structure_analysis")
    if isinstance(sections, list) and sections:
        return [item for item in sections if isinstance(item, dict)]
    duration = float((analysis.get("meta") or {}).get("duration_sec") or 30)
    return [
        {"id": "S1", "start_sec": 0, "end_sec": min(5, duration), "label": "hook", "purpose": "Opening hook"},
        {"id": "S2", "start_sec": min(5, duration), "end_sec": duration, "label": "body", "purpose": "Main body"},
    ]


def find_visual(analysis: dict[str, Any], section_id: str, index: int) -> dict[str, Any]:
    visuals = analysis.get("visual_analysis")
    if not isinstance(visuals, list):
        return {}
    for item in visuals:
        if isinstance(item, dict) and safe_text(item.get("section_id")) == section_id:
            return item
    if index < len(visuals) and isinstance(visuals[index], dict):
        return visuals[index]
    return {}


def reproduction_visual(analysis: dict[str, Any]) -> dict[str, Any]:
    value = analysis.get("reproduction_visual_analysis")
    return value if isinstance(value, dict) else {}


def list_dicts(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def by_shot_id(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for index, row in enumerate(rows):
        shot_id = safe_text(row.get("shot_id") or row.get("shotId") or row.get("id"), f"shot_{index + 1:03d}")
        result[shot_id] = row
    return result


def rhythm_changes(analysis: dict[str, Any], start: float, end: float) -> list[dict[str, Any]]:
    rhythm = analysis.get("rhythm_analysis") if isinstance(analysis.get("rhythm_analysis"), dict) else {}
    changes = rhythm.get("scene_changes") if isinstance(rhythm.get("scene_changes"), list) else []
    result = []
    for item in changes:
        if not isinstance(item, dict):
            continue
        try:
            time_sec = float(item.get("time_sec", -1))
        except (TypeError, ValueError):
            continue
        if start <= time_sec <= end:
            result.append(item)
    return result


def infer_layout_archetype(visual: dict[str, Any]) -> str:
    raw = safe_text(visual.get("layout_archetype") or visual.get("layoutArchetype")).lower()
    if raw:
        if any(key in raw for key in ["hud", "dashboard", "game-ui"]):
            return "hud_explainer"
        if any(key in raw for key in ["card", "stack"]):
            return "document_card"
        if any(key in raw for key in ["stage", "frame"]):
            return "stage_frame"
        if any(key in raw for key in ["quote", "cinematic"]):
            return "cinematic_quote_full_bleed"
    blob = lower_blob(visual)
    if any(key in blob for key in ["top-centered", "top title", "white title", "red subtitle", "quote", "cinematic", "silhouette"]):
        return "cinematic_quote_full_bleed"
    if any(key in blob for key in ["hud", "dashboard", "grid", "data", "chart"]):
        return "hud_explainer"
    if any(key in blob for key in ["document", "card", "panel"]):
        return "document_card"
    if any(key in blob for key in ["split", "two-column", "left visual right text"]):
        return "split_screen_tutorial"
    return "full_bleed_or_single_focus"


def infer_text_layers(visual: dict[str, Any], archetype: str) -> list[dict[str, Any]]:
    raw_layers = visual.get("text_layers") or visual.get("textLayers")
    if isinstance(raw_layers, list) and raw_layers:
        layers = []
        for index, item in enumerate(raw_layers):
            if not isinstance(item, dict):
                continue
            role = safe_text(item.get("role"), f"text_{index + 1}")
            position = safe_text(item.get("position"), "center")
            layers.append(
                {
                    "layerId": role if role else f"text_{index + 1}",
                    "role": role,
                    "position": position,
                    "style": safe_text(item.get("style"), "bold_readable_text"),
                    "animation": safe_text(item.get("animation"), "fade_in"),
                    "mustPreserve": bool(item.get("must_preserve") or item.get("mustPreserve")),
                    "maxLines": 2 if role != "creator_handle" else 1,
                    "safeArea": {"x": 0.08, "y": 0.06, "w": 0.84, "h": 0.22}
                    if "top" in position or "center" in position
                    else {"x": 0.1, "y": 0.76, "w": 0.8, "h": 0.16},
                    "replicationRule": "Preserve layer role, position, style, and animation; rewrite source text for the new topic.",
                }
            )
        return layers
    blob = lower_blob(visual)
    layers: list[dict[str, Any]] = []
    if "top" in blob or "title" in blob or archetype == "cinematic_quote_full_bleed":
        layers.append(
            {
                "layerId": "title",
                "role": "scene_headline",
                "position": "top_center",
                "style": "large_white_bold_shadow",
                "animation": "fade_in_up_fast",
                "maxLines": 2,
                "safeArea": {"x": 0.08, "y": 0.06, "w": 0.84, "h": 0.18},
                "replicationRule": "Keep the headline position and hierarchy; rewrite the text for the new topic.",
            }
        )
    if "red subtitle" in blob or "subtitle" in blob or "dual-language" in blob or archetype == "cinematic_quote_full_bleed":
        layers.append(
            {
                "layerId": "subtitle_primary",
                "role": "short_caption_or_quote_support",
                "position": "below_title_or_lower_center",
                "style": "red_or_highlighted_text_with_light_stroke",
                "animation": "delayed_fade_in",
                "maxLines": 2,
                "safeArea": {"x": 0.1, "y": 0.14, "w": 0.8, "h": 0.16},
                "replicationRule": "Use short rhythm captions; do not place full voiceover paragraphs on screen.",
            }
        )
    if "watermark" in blob:
        layers.append(
            {
                "layerId": "creator_handle",
                "role": "source_creator_or_platform_mark",
                "position": "bottom_center",
                "style": "small_white_shadow",
                "animation": "static",
                "maxLines": 1,
                "safeArea": {"x": 0.2, "y": 0.92, "w": 0.6, "h": 0.05},
                "replicationRule": "Detect only. Do not copy source creator identity; render only if the target account config explicitly provides a handle.",
            }
        )
    return layers


def infer_image_layer(visual: dict[str, Any], archetype: str) -> dict[str, Any]:
    raw = visual.get("image_layer") or visual.get("imageLayer")
    if isinstance(raw, dict) and raw:
        return {
            "layerId": "background",
            "role": "primary_visual_context",
            "imageMode": safe_text(raw.get("image_mode") or raw.get("imageMode"), "supporting_visual"),
            "subjectPattern": safe_text(raw.get("subject_position") or raw.get("subjectPosition"), "center"),
            "composition": safe_text(raw.get("negative_space") or raw.get("negativeSpace"), "preserve detected negative space"),
            "safeTextZones": raw.get("safe_text_zones") or raw.get("safeTextZones") or [],
            "forbidGeneratedText": bool(raw.get("forbid_generated_text", raw.get("forbidGeneratedText", True))),
            "forbidCopyingOriginalFrame": True,
        }
    blob = lower_blob(visual)
    subject = "atmospheric full-screen background"
    if "silhouette" in blob:
        subject = "human silhouette in cinematic landscape"
    elif "landscape" in blob or "travel" in blob:
        subject = "wide emotional landscape with clean negative space"
    elif "character" in blob:
        subject = "cinematic character or subject close-up with strong backlight"
    elif "chart" in blob:
        subject = "clean chart or interface visual"
    return {
        "layerId": "background",
        "role": "primary_visual_context",
        "imageMode": "full_bleed_background" if archetype in {"cinematic_quote_full_bleed", "full_bleed_or_single_focus"} else "supporting_visual",
        "subjectPattern": subject,
        "composition": "leave clean negative space for title and captions",
        "forbidGeneratedText": True,
        "forbidCopyingOriginalFrame": True,
    }


def infer_motion(visual: dict[str, Any], index: int, archetype: str) -> dict[str, Any]:
    raw = visual.get("motion")
    if isinstance(raw, dict) and raw:
        return {
            "motionPreset": safe_text(raw.get("motion_preset") or raw.get("motionPreset"), "clean_reveal"),
            "cameraMove": safe_text(raw.get("camera_move") or raw.get("cameraMove"), "static"),
            "scaleRange": raw.get("scale_range") or raw.get("scaleRange") or [1, 1.04],
            "parallax": safe_text(raw.get("parallax"), "none"),
            "motionIntensity": safe_text(raw.get("intensity"), "medium"),
            "replicationRule": "Preserve the motion grammar, not the original frame.",
        }
    blob = lower_blob(visual)
    if "pov" in blob or "travel" in blob:
        preset = "gentle_pan_with_slow_push"
    elif "close-up" in blob:
        preset = "slow_push_in_subject"
    elif archetype == "cinematic_quote_full_bleed":
        preset = "slow_push_full_bleed"
    else:
        preset = "clean_reveal"
    direction = ["in", "right", "left", "out"][index % 4]
    return {
        "motionPreset": preset,
        "cameraMove": direction,
        "scaleRange": [1.035, 1.095] if "slow" in preset or "push" in preset else [1.0, 1.035],
        "parallax": "subtle",
        "motionIntensity": "low" if archetype == "cinematic_quote_full_bleed" else "medium",
        "replicationRule": "Preserve the motion grammar, not the original frame.",
    }


def infer_effects(visual: dict[str, Any], archetype: str) -> list[dict[str, Any]]:
    raw = visual.get("effects")
    if isinstance(raw, list) and raw:
        effects = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            effects.append(
                {
                    "effectId": safe_text(item.get("effect_id") or item.get("effectId"), "effect"),
                    "type": safe_text(item.get("type"), "overlay"),
                    "intensity": item.get("intensity", "medium"),
                    "timing": safe_text(item.get("timing"), "full_scene"),
                }
            )
        return effects
    blob = lower_blob(visual)
    effects = []
    if archetype == "cinematic_quote_full_bleed" or any(key in blob for key in ["cinematic", "melancholic", "backlit", "silhouette"]):
        effects.extend(
            [
                {"effectId": "film_grain", "type": "texture", "intensity": 0.18, "timing": "full_scene"},
                {"effectId": "vignette", "type": "lighting", "intensity": 0.28, "timing": "full_scene"},
                {"effectId": "soft_glow", "type": "lighting", "intensity": 0.22, "timing": "slow_pulse"},
            ]
        )
    if any(key in blob for key in ["light", "moon", "backlit", "energy"]):
        effects.append({"effectId": "light_leak", "type": "overlay", "intensity": 0.14, "timing": "entry_or_peak"})
    if archetype != "cinematic_quote_full_bleed" and any(key in blob for key in ["hud", "tech", "cyber"]):
        effects.append({"effectId": "scanline_or_grid", "type": "graphic_overlay", "intensity": 0.12, "timing": "full_scene"})
    return effects


def transition_from_change(change: dict[str, Any] | None, index: int) -> dict[str, Any]:
    if not change:
        return {"transitionIn": "hard_cut" if index == 0 else "soft_cut", "transitionOut": "soft_cut", "durationFrames": 8}
    change_type = safe_text(change.get("change_type"), "cut").lower()
    strength = safe_text(change.get("change_strength"), "soft_change").lower()
    if "dissolve" in change_type:
        transition = "cross_dissolve"
    elif "blur" in change_type:
        transition = "blur_reveal"
    elif "flash" in change_type:
        transition = "flash_white"
    elif "hard" in strength:
        transition = "hard_cut"
    else:
        transition = "soft_cut"
    return {
        "transitionIn": transition,
        "transitionOut": "soft_cut" if transition == "hard_cut" else transition,
        "durationFrames": 4 if transition == "hard_cut" else 10,
        "audioSync": bool(change.get("linked_to_audio_emphasis")),
        "purpose": safe_text(change.get("purpose")),
    }


def infer_transition(visual: dict[str, Any], change: dict[str, Any] | None, index: int) -> dict[str, Any]:
    raw = visual.get("transition")
    if isinstance(raw, dict) and raw:
        return {
            "transitionIn": safe_text(raw.get("transition_in") or raw.get("transitionIn"), "hard_cut" if index == 0 else "soft_cut").lower().replace("-", "_"),
            "transitionOut": safe_text(raw.get("transition_out") or raw.get("transitionOut"), "soft_cut").lower().replace("-", "_"),
            "durationFrames": int(raw.get("duration_frames_estimate") or raw.get("durationFrames") or 10),
            "audioSync": bool(raw.get("audio_sync") or raw.get("audioSync")),
        }
    return transition_from_change(change, index)


def build_scene_from_reproduction(
    shot: dict[str, Any],
    shot_layout: dict[str, Any],
    layer_layout: dict[str, Any],
    secondary_assets: list[dict[str, Any]],
    remotion_mapping: dict[str, Any],
    index: int,
) -> dict[str, Any]:
    shot_id = safe_text(shot.get("shot_id") or shot.get("shotId") or shot.get("id"), f"shot_{index + 1:03d}")
    start, duration = parse_time_range(shot.get("time_range") or shot.get("timeRange"), index * 5.0, 5.0)
    end = start + duration
    layout_type = safe_text(shot_layout.get("layout_type") or shot_layout.get("layoutType"), "shot_layout")
    text_density = safe_text(shot_layout.get("text_position_density") or shot_layout.get("textPositionDensity"))
    subtitle_safe_area = safe_text(shot_layout.get("subtitle_safe_area") or shot_layout.get("subtitleSafeArea"), "bottom_center")
    main_position = safe_text(shot_layout.get("main_subject_position_size") or shot_layout.get("mainSubjectPositionSize"), "center")
    second_position = safe_text(shot_layout.get("secondary_asset_position_size") or shot_layout.get("secondaryAssetPositionSize"))

    text_layers = []
    on_screen_text = safe_text(shot.get("on_screen_text") or shot.get("onScreenText"))
    main_focus = safe_text(shot.get("main_focus") or shot.get("mainFocus"))
    if main_focus or on_screen_text or text_density:
        text_layers.append(
            {
                "layerId": "primary_text",
                "role": "headline_or_key_visual_text",
                "position": safe_text(shot_layout.get("text_position") or shot_layout.get("textPosition"), "derived_from_layout"),
                "style": "preserve reference hierarchy; use high contrast keywords",
                "animation": safe_text(remotion_mapping.get("animation_implementation") or remotion_mapping.get("animationImplementation"), "layout_timed_reveal"),
                "maxLines": 2,
                "contentHint": on_screen_text or main_focus,
                "densityRule": text_density,
                "safeArea": {"x": 0.06, "y": 0.06, "w": 0.88, "h": 0.72},
                "replicationRule": safe_text(
                    shot_layout.get("reproduction_execution_rule") or shot_layout.get("reproductionExecutionRule"),
                    "Preserve size hierarchy and rewrite text for the new topic.",
                ),
            }
        )

    return {
        "sceneId": shot_id,
        "sourceSectionId": safe_text(shot.get("section_id") or shot.get("sectionId"), shot_id),
        "timeRangeSec": [round(start, 2), round(end, 2)],
        "roleLabel": safe_text(shot.get("visual_purpose") or shot.get("visualPurpose"), safe_text(shot.get("section_id"), "shot")),
        "layout": {
            "archetype": layout_type,
            "description": safe_text(
                shot_layout.get("screen_regions") or shot_layout.get("screenRegions"),
                safe_text(shot.get("screen_description") or shot.get("screenDescription"), "shot-specific layout"),
            ),
            "screenRegions": safe_text(shot_layout.get("screen_regions") or shot_layout.get("screenRegions")),
            "mainSubjectPositionSize": main_position,
            "secondaryAssetPositionSize": second_position,
            "visualAttentionPath": safe_text(shot_layout.get("visual_attention_path") or shot_layout.get("visualAttentionPath")),
            "reproductionExecutionRule": safe_text(shot_layout.get("reproduction_execution_rule") or shot_layout.get("reproductionExecutionRule")),
            "textLayers": text_layers,
            "imageLayer": {
                "layerId": "primary_subject",
                "role": "primary_visual_focus",
                "imageMode": safe_text(layer_layout.get("primary_subject_layer") or layer_layout.get("primarySubjectLayer"), "generated_subject_or_graphic"),
                "subjectPattern": main_position,
                "composition": safe_text(layer_layout.get("z_order") or layer_layout.get("zOrder"), "follow shot layout z-order"),
                "safeTextZones": [subtitle_safe_area],
                "forbidGeneratedText": False,
                "forbidCopyingOriginalFrame": True,
            },
            "backgroundLayer": safe_text(layer_layout.get("background_layer") or layer_layout.get("backgroundLayer")),
            "secondaryAssetLayer": safe_text(layer_layout.get("secondary_asset_layer") or layer_layout.get("secondaryAssetLayer")),
            "decorationLayer": safe_text(layer_layout.get("decoration_layer") or layer_layout.get("decorationLayer")),
            "subtitleSafeArea": subtitle_safe_area,
            "safeZones": {
                "title": "from_shot_layout",
                "caption": subtitle_safe_area,
                "subject": main_position,
            },
        },
        "motion": {
            "motionPreset": "shot_layout_driven",
            "cameraMove": "preserve_reference_attention_path",
            "scaleRange": [1.0, 1.04],
            "parallax": "layered" if second_position else "subtle",
            "motionIntensity": "medium",
            "replicationRule": safe_text(remotion_mapping.get("animation_implementation") or remotion_mapping.get("animationImplementation")),
        },
        "effects": [],
        "transition": {"transitionIn": "hard_cut" if index == 0 else "soft_cut", "transitionOut": "soft_cut", "durationFrames": 8},
        "subtitleBehavior": {
            "mode": "voice_synced_caption",
            "maxCharsPerLine": 18,
            "maxLines": 2,
            "avoidFullParagraph": True,
            "position": subtitle_safe_area,
        },
        "assetGuidance": {
            "assetTypes": [safe_text(item.get("asset_type") or item.get("assetType")) for item in secondary_assets if safe_text(item.get("asset_type") or item.get("assetType"))],
            "styleMarkers": [safe_text(shot.get("main_focus") or shot.get("mainFocus"))],
            "fixedElements": [safe_text(layer_layout.get("decoration_layer") or layer_layout.get("decorationLayer"))],
            "variableElements": [safe_text(shot.get("on_screen_text") or shot.get("onScreenText"))],
            "preserveRules": [safe_text(shot_layout.get("reproduction_execution_rule") or shot_layout.get("reproductionExecutionRule"))],
            "innovationRules": ["Replace source-specific assets and text while preserving layout proportions."],
            "secondaryAssets": secondary_assets,
            "recreationDifficulty": "medium",
        },
        "remixDirective": {
            "preserve": ["shot_layout", "visual_attention_path", "subtitle_safe_area", "layer_order"],
            "innovate": ["topic_text", "generated_assets", "examples"],
            "removeOrReplace": ["watermark", "creator_identity", "source_specific_frame"],
        },
        "remotionMapping": remotion_mapping,
        "confidence": float(shot.get("confidence") or 0.74),
    }


def infer_subtitle_behavior(visual: dict[str, Any], archetype: str) -> dict[str, Any]:
    raw = visual.get("subtitle_behavior") or visual.get("subtitleBehavior")
    if isinstance(raw, dict) and raw:
        return {
            "mode": "short_rhythm_caption",
            "maxCharsPerLine": int(raw.get("max_chars_per_line") or raw.get("maxCharsPerLine") or 16),
            "maxLines": int(raw.get("max_lines") or raw.get("maxLines") or 2),
            "avoidFullParagraph": bool(raw.get("avoid_full_paragraph", raw.get("avoidFullParagraph", True))),
            "position": safe_text(raw.get("position"), "bottom_center").lower().replace("-", "_"),
        }
    return {
        "mode": "short_rhythm_caption",
        "maxCharsPerLine": 16,
        "maxLines": 2,
        "avoidFullParagraph": True,
        "position": "below_title_or_lower_center" if archetype == "cinematic_quote_full_bleed" else "bottom_center",
    }


def build_scene(section: dict[str, Any], visual: dict[str, Any], changes: list[dict[str, Any]], index: int) -> dict[str, Any]:
    start, duration = parse_time_range(
        [section.get("start_sec", section.get("startSec", 0)), section.get("end_sec", section.get("endSec", 0))],
        float(section.get("start_sec", section.get("startSec", 0)) or 0),
        5,
    )
    end = start + duration
    archetype = infer_layout_archetype(visual)
    first_change = changes[0] if changes else None
    return {
        "sceneId": f"scene_{index + 1:02d}",
        "sourceSectionId": safe_text(section.get("id"), f"S{index + 1}"),
        "timeRangeSec": [round(start, 2), round(end, 2)],
        "roleLabel": safe_text(section.get("label"), safe_text(section.get("purpose"), "scene")),
        "layout": {
            "archetype": archetype,
            "description": safe_text(visual.get("layout"), "single full-screen composition"),
            "textLayers": infer_text_layers(visual, archetype),
            "imageLayer": infer_image_layer(visual, archetype),
            "safeZones": {
                "title": "top_center",
                "caption": "below_title_or_lower_center",
                "subject": "center_or_lower_third",
            },
        },
        "motion": infer_motion(visual, index, archetype),
        "effects": infer_effects(visual, archetype),
        "transition": infer_transition(visual, first_change, index),
        "subtitleBehavior": infer_subtitle_behavior(visual, archetype),
        "assetGuidance": {
            "assetTypes": str_list(visual.get("asset_types")),
            "styleMarkers": str_list(visual.get("style_markers")),
            "fixedElements": str_list(visual.get("fixed_elements")),
            "variableElements": str_list(visual.get("variable_elements")),
            "preserveRules": str_list(visual.get("preserve_rules")),
            "innovationRules": str_list(visual.get("innovation_rules")),
            "recreationDifficulty": safe_text(visual.get("recreation_difficulty"), "medium"),
        },
        "remixDirective": {
            "preserve": ["layout_hierarchy", "motion_preset", "transition_timing", "subtitle_position"],
            "innovate": ["background_subject", "metaphor", "color_balance", "caption_wording"],
            "removeOrReplace": ["watermark", "creator_identity", "source_specific_frame"],
        },
        "confidence": float(visual.get("confidence") or section.get("confidence") or 0.55),
    }


def build_detailed_visual_analysis(analysis: dict[str, Any], summary: dict[str, Any] | None = None) -> dict[str, Any]:
    reproduction = reproduction_visual(analysis)
    shot_rows = list_dicts(reproduction.get("shot_visuals"))
    if shot_rows:
        layout_by_id = by_shot_id(list_dicts(reproduction.get("shot_layout")))
        layer_by_id = by_shot_id(list_dicts(reproduction.get("layer_layout")))
        remotion_by_id = by_shot_id(list_dicts(reproduction.get("remotion_mapping")))
        secondary_rows = list_dicts(reproduction.get("secondary_assets"))
        scenes = []
        for index, shot in enumerate(shot_rows):
            shot_id = safe_text(shot.get("shot_id") or shot.get("shotId") or shot.get("id"), f"shot_{index + 1:03d}")
            secondary_for_shot = [
                item
                for item in secondary_rows
                if safe_text(item.get("shot_id") or item.get("shotId") or item.get("id")) == shot_id
            ]
            scenes.append(
                build_scene_from_reproduction(
                    shot,
                    layout_by_id.get(shot_id, {}),
                    layer_by_id.get(shot_id, {}),
                    secondary_for_shot,
                    remotion_by_id.get(shot_id, {}),
                    index,
                )
            )

        archetypes = [scene["layout"]["archetype"] for scene in scenes]
        primary_archetype = max(set(archetypes), key=archetypes.count) if archetypes else "unknown"
        return {
            "schemaVersion": "1.1",
            "artifact": artifact_meta("visual_analysis_detailed"),
            "sourceVideoId": safe_text(analysis.get("source_video_id"), "source_video"),
            "primaryLayoutArchetype": primary_archetype,
            "globalVisualGrammar": {
                "layoutPattern": "shot_layout_driven",
                "motionPattern": "preserve visual attention path and per-shot layout proportions",
                "effectStack": [],
                "transitionPattern": "shot changes align with detected visual timeline",
                "subtitlePattern": "bottom safe-area captions unless shot_layout specifies otherwise",
            },
            "scenes": scenes,
            "visualRemixRules": [
                "Use reproduction_visual_analysis.shot_layout as the primary layout contract.",
                "Keep table 7, table 8, and table 9 shot IDs aligned through rendering.",
                "Preserve visual attention path, size proportions, and subtitle safe areas.",
                "Replace source-specific assets, creator identity, and watermarks.",
                "Use generated assets only after checking the shot_layout size and position rules.",
            ],
            "summaryInfluence": summary.get("summary") if isinstance(summary, dict) else None,
        }

    sections = get_sections(analysis)
    scenes = []
    for index, section in enumerate(sections):
        start = float(section.get("start_sec", section.get("startSec", 0)) or 0)
        end = float(section.get("end_sec", section.get("endSec", start + 5)) or start + 5)
        visual = find_visual(analysis, safe_text(section.get("id"), f"S{index + 1}"), index)
        scenes.append(build_scene(section, visual, rhythm_changes(analysis, start, end), index))

    archetypes = [scene["layout"]["archetype"] for scene in scenes]
    primary_archetype = max(set(archetypes), key=archetypes.count) if archetypes else "unknown"
    effect_counts: dict[str, int] = {}
    for scene in scenes:
        for effect in scene.get("effects", []):
            effect_counts[effect["effectId"]] = effect_counts.get(effect["effectId"], 0) + 1

    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("visual_analysis_detailed"),
        "sourceVideoId": safe_text(analysis.get("source_video_id"), "source_video"),
        "primaryLayoutArchetype": primary_archetype,
        "globalVisualGrammar": {
            "layoutPattern": "top title + highlighted subtitle + full-bleed cinematic image"
            if primary_archetype == "cinematic_quote_full_bleed"
            else "scene-specific layout pattern",
            "motionPattern": "slow camera movement with text reveal",
            "effectStack": sorted(effect_counts, key=effect_counts.get, reverse=True),
            "transitionPattern": "scene changes align with narrative turning points",
            "subtitlePattern": "short rhythm captions, not full paragraph subtitles",
        },
        "scenes": scenes,
        "visualRemixRules": [
            "Analyze and preserve layout hierarchy per scene before choosing a Remotion module.",
            "Convert detected watermarks or creator handles into optional target-account fields; never copy the source identity.",
            "Generate new image subjects while preserving text-safe composition zones.",
            "Use motion presets and effect stacks as reusable grammar, not as copied source frames.",
            "Keep subtitle text short and timed to phrase beats; avoid rendering the full voiceover paragraph over the image.",
        ],
        "summaryInfluence": summary.get("summary") if isinstance(summary, dict) else None,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build visual_analysis_detailed.json from analysis.json.")
    parser.add_argument("--analysis", required=True)
    parser.add_argument("--summary")
    parser.add_argument("--output", required=True)
    parser.add_argument("--update-analysis", action="store_true", help="Also embed the detailed result into analysis.json.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    analysis_path = Path(args.analysis)
    analysis = load_json(analysis_path)
    summary = load_json(Path(args.summary)) if args.summary and Path(args.summary).exists() else None
    payload = build_detailed_visual_analysis(analysis, summary)
    write_json(Path(args.output), payload)
    if args.update_analysis:
        analysis["visual_analysis_detailed"] = payload
        write_json(analysis_path, analysis)
    print(f"Wrote {args.output}")
    print(f"Scenes: {len(payload['scenes'])}")
    print(f"Primary layout archetype: {payload['primaryLayoutArchetype']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
