#!/usr/bin/env python
"""Prepare an asset prompt plan from rewritten video copy."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import (
    artifact_meta,
    load_json,
    resolve_style_variant,
    safe_text,
    style_artifact_suffix,
    write_json,
)


ROLE_SLOT = {
    "hook": "hero_visual",
    "mechanism": "mechanism_visual",
    "method": "method_visual",
    "checklist": "method_visual",
    "case": "supporting_visual",
    "evidence": "supporting_visual",
    "contrast": "supporting_visual",
    "close": "close_visual",
}

OVERLAY_SLOTS = (
    "foreground_overlay",
    "focus_overlay",
    "detail_overlay",
    "label_overlay",
    "callout_overlay",
    "arrow_overlay",
)

NEGATIVE_BASE = (
    "watermark, logo, readable text, subtitles, platform UI, screenshot, copied frame, "
    "creator identity, celebrity likeness, photorealistic face, cluttered composition, "
    "low quality, blurry, distorted anatomy, bad hands, extra limbs"
)


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def size_for(aspect_ratio: str, slot: str) -> dict[str, int]:
    if aspect_ratio == "3:4":
        return {"width": 1080, "height": 1440}
    if slot == "background_texture":
        return {"width": 1080, "height": 1920} if aspect_ratio == "9:16" else {"width": 1920, "height": 1080}
    return {"width": 1024, "height": 1024} if aspect_ratio == "9:16" else {"width": 1280, "height": 720}


STYLE_DESCRIPTIONS = {
    "dark_warning_orange": "dark navy or near-black base, orange accent light, subtle HUD grid, high-contrast editorial infographic, clean cinematic lighting",
    "dark_warning_red": "dark base, red warning accent, urgent contrast, sharper risk framing, clean editorial composition",
    "chart_blue_orange": "cool blue analytical base, orange emphasis, chart-like spatial logic, professional report aesthetic, restrained clutter",
    "warm_paper": "warm off-white paper texture, soft shadows, restrained gold accent, clean editorial composition, tactile paper grain",
    "clean_white": "bright neutral background, crisp object edges, restrained blue accent, clean modern editorial layout",
    "soft_blue": "soft blue-white editorial background, calm analytic tone, subtle shadows, clear object separation",
    "gray_academic": "gray-white academic surface, sober editorial layout, muted contrast, document-like clarity",
    "dark_archive_green": "dark archival green base, museum-documentary mood, subdued warm highlights, factual and restrained composition",
    "warm_retro_orange": "warm retro orange palette, documentary nostalgia, paper texture, clear structure, low visual noise",
    "blue_lab_document": "blue lab document palette, clinical documentation feel, crisp lines, measured spacing, precise structure",
    "comic_night_purple": "comic-inspired night purple palette, bold silhouette shapes, high-contrast illustration energy, clear negative space",
    "comic_soft_day_blue": "comic-inspired soft day blue palette, friendly illustrated geometry, readable layout, light graphic energy",
    "cinematic_amber_noir": "cinematic amber and noir contrast, dramatic shadows, minimal but intense object staging, high readability",
    "cool_probability_room": "cool analytical room, pale blue-gray light, probability-diagram mood, restrained academic clarity",
    "cold_newsroom": "cold newsroom palette, factual editorial lighting, glass-and-paper texture, calm authority, concise structure",
    "cinematic_soft_green_amber": "full-screen cinematic quote background, muted green and warm amber light, soft glow, filmic grain, emotional landscape or silhouette, clean empty zones for overlaid title and bilingual subtitles",
}

ROLE_DIRECTIVES = {
    "hook": {
        "visual_goal": "deliver one instantly legible metaphor",
        "subject_pattern": "single focal object, one threshold, one obstacle",
        "composition": "centered or slightly low-centered subject, large breathing room above, no busy supporting elements",
        "camera": "front-facing still life or slightly low angle",
        "motion": "static image with strong silhouette and visual tension",
    },
    "mechanism": {
        "visual_goal": "show the causal chain behind the problem",
        "subject_pattern": "three-part causal arrangement, blockage, distance, release path",
        "composition": "layered depth or left-to-right progression, keep the logic easy to scan",
        "camera": "frontal diagram-like still with mild depth",
        "motion": "structured, explanatory, slightly more spatial than the hook",
    },
    "method": {
        "visual_goal": "show a repeatable action path",
        "subject_pattern": "three-step route, tiles, tools, or cards before action",
        "composition": "ordered progression with clear step separation and safe subtitle space",
        "camera": "clean editorial still, slight perspective depth",
        "motion": "calm, process-oriented, practical",
    },
    "checklist": {
        "visual_goal": "show a short actionable checklist",
        "subject_pattern": "three to five steps, cards, marks, or tiles",
        "composition": "balanced grid or sequence with readable negative space",
        "camera": "frontal or top-biased editorial still",
        "motion": "structured and compact",
    },
    "case": {
        "visual_goal": "support a concrete example with one recognizable scene object",
        "subject_pattern": "one case object, one evidence cue, one supporting surface",
        "composition": "documentary-style support area with clear focus and modest detail",
        "camera": "editorial still or evidence-board framing",
        "motion": "grounded and concrete",
    },
    "evidence": {
        "visual_goal": "make evidence feel structured and credible",
        "subject_pattern": "document, chart, or artifact cluster",
        "composition": "evidence-board or report layout, low clutter",
        "camera": "frontal documentary framing",
        "motion": "calm, factual, specific",
    },
    "contrast": {
        "visual_goal": "show before-and-after difference clearly",
        "subject_pattern": "split comparison, mirrored objects, or two-state contrast",
        "composition": "clear division between states with matching scale",
        "camera": "comparison frame with a hard visual split or symmetrical layout",
        "motion": "binary and legible",
    },
    "close": {
        "visual_goal": "leave one clean memory anchor",
        "subject_pattern": "single resolved symbol or simplified doorway",
        "composition": "minimal, centered, quiet, with more empty space than information",
        "camera": "front-facing still with calm finish",
        "motion": "minimal and resolved",
    },
}

STYLE_DIRECTIVES = {
    "dark_warning_orange": {
        "scene_language": "dark warning editorial system, orange highlight, subtle HUD grid, risk-aware contrast",
        "lighting": "low-key cinematic light with bright orange edge accents",
        "material": "matte dark surfaces with crisp illuminated edges",
    },
    "dark_warning_red": {
        "scene_language": "urgent warning system, red emphasis, sharper contrast, higher tension",
        "lighting": "low-key dramatic light with stronger red signal accents",
        "material": "matte dark surfaces with sharper, more severe highlights",
    },
    "chart_blue_orange": {
        "scene_language": "analytical chart system, blue base with orange emphasis, professional report look",
        "lighting": "clean report lighting, controlled contrast, readable spatial separation",
        "material": "paper, glass, chartboard, or polished diagram surfaces",
    },
    "warm_paper": {
        "scene_language": "warm editorial paper system, soft tactile texture, quiet gold accents",
        "lighting": "diffused warm light with soft shadows and gentle falloff",
        "material": "paper, stone, plaster, or tactile matte objects with visible grain",
    },
    "clean_white": {
        "scene_language": "bright clean editorial system, minimal clutter, restrained blue accent",
        "lighting": "neutral high-key light with clear edges",
        "material": "smooth white surfaces, paper, or simple clean objects",
    },
    "soft_blue": {
        "scene_language": "soft blue editorial system, calm analytic mood, low tension",
        "lighting": "soft cool light with mild shadow separation",
        "material": "paper, frosted glass, or light blue surfaces",
    },
    "gray_academic": {
        "scene_language": "gray academic system, sober document-like clarity",
        "lighting": "neutral diffuse light, almost classroom-like",
        "material": "paper, board, or neutral textured surfaces",
    },
    "dark_archive_green": {
        "scene_language": "archival green documentary system, museum-like restraint",
        "lighting": "low-key archival lighting with subdued warm practicals",
        "material": "aged paper, archival surfaces, museum display objects",
    },
    "warm_retro_orange": {
        "scene_language": "warm retro documentary system, nostalgic but clean",
        "lighting": "soft vintage practical light with amber warmth",
        "material": "paper, wood, warm texture, lightly aged surfaces",
    },
    "blue_lab_document": {
        "scene_language": "blue lab documentation system, precise and clinical",
        "lighting": "cool measured lab light with crisp separation",
        "material": "glass, paper, metal, and neat document surfaces",
    },
    "comic_night_purple": {
        "scene_language": "comic night system, bold silhouette language, high graphic contrast",
        "lighting": "stylized night light with strong shape separation",
        "material": "illustrated surfaces, bold graphic shapes, comic-like blocks",
    },
    "comic_soft_day_blue": {
        "scene_language": "soft comic daytime system, friendly graphic rhythm, lighter contrast",
        "lighting": "daylight-like soft graphic light",
        "material": "simple illustrated forms with light texture",
    },
    "cinematic_amber_noir": {
        "scene_language": "cinematic amber noir system, dramatic but readable",
        "lighting": "amber rim light, deep shadow, strong object isolation",
        "material": "dark matte surfaces, warm highlights, heavy contrast",
    },
    "cool_probability_room": {
        "scene_language": "cool probability room system, analytical and quiet",
        "lighting": "cool diffuse academic light with measured contrast",
        "material": "paper, board, glass, and soft room geometry",
    },
    "cold_newsroom": {
        "scene_language": "cold newsroom system, factual editorial tone, calm authority",
        "lighting": "cool newsroom light with glass-and-paper clarity",
        "material": "glass, paper, steel, and report-like surfaces",
    },
    "cinematic_soft_green_amber": {
        "scene_language": "full-bleed cinematic quote system, emotional landscape or silhouette, no panels, no diagrams",
        "lighting": "soft glowing highlights, gentle haze, muted green shadows with warm amber rim light",
        "material": "natural scenery, soft film grain, atmospheric depth, open negative space",
    },
}


def style_description(style_variant: str) -> str:
    return STYLE_DESCRIPTIONS.get(style_variant, f"{style_variant} visual system, clean editorial composition, high readability")


def purpose_for(scene: dict[str, Any]) -> str:
    role = safe_text(scene.get("role"), "mechanism")
    headline = safe_text(scene.get("copy", {}).get("headline"))
    body = safe_text(scene.get("copy", {}).get("body"))
    if role == "hook":
        return f"Create a strong visual metaphor for the opening claim: {headline}."
    if role == "mechanism":
        return f"Visualize the mechanism behind the claim: {headline}. Supporting idea: {body}"
    if role in {"method", "checklist"}:
        return f"Visualize the practical method or action path: {headline}. Supporting idea: {body}"
    if role == "close":
        return f"Create a minimal memory anchor for the final takeaway: {headline}."
    return f"Support the scene idea visually: {headline}. {body}"


def subject_for(scene: dict[str, Any]) -> str:
    role = safe_text(scene.get("role"), "mechanism")
    headline = safe_text(scene.get("copy", {}).get("headline"))
    layout_archetype = safe_text(scene.get("layoutControls", {}).get("layoutArchetype"))
    if layout_archetype == "cinematic_quote_full_bleed":
        if role == "hook":
            return "abstract glowing fragments or moonlit light shapes over a dark soft-focus background, with large empty lower area for subtitles"
        if role in {"problem", "setup"}:
            return "lonely silhouette near a window or shoreline, quiet emotional distance, large clean sky or wall area for title text"
        if role == "mechanism":
            return "wide grassland or shoreline with a small human figure, warm light path crossing muted green shadows"
        if role == "close":
            return "minimal moonlit road or open field fading into warm light, calm farewell mood, no readable text"
        return "full-screen cinematic emotional background with one simple silhouette and clean subtitle-safe negative space"
    visual_remix = scene.get("visualRemix") if isinstance(scene.get("visualRemix"), dict) else {}
    image_layer = visual_remix.get("imageLayer") if isinstance(visual_remix.get("imageLayer"), dict) else {}
    asset_guidance = visual_remix.get("assetGuidance") if isinstance(visual_remix.get("assetGuidance"), dict) else {}
    remix_layout = safe_text(visual_remix.get("layoutArchetype") or layout_archetype)
    subject_pattern = safe_text(image_layer.get("subjectPattern"))
    asset_types = ", ".join(asset_guidance.get("assetTypes") or [])
    if remix_layout == "hud_explainer":
        return subject_pattern or f"dark tech dashboard composition with HUD frame, dot grid, clean UI nodes, no readable labels; asset motifs: {asset_types}"
    if remix_layout == "document_card":
        return subject_pattern or "layered card stack over dark grid background, bold central emphasis zone, no readable text"
    if remix_layout == "stage_frame":
        return subject_pattern or "centered stage-like geometric frame with abstract character silhouette and dynamic shapes, no readable text"
    if role == "hook":
        return "a small glowing doorway blocked by a single oversized abstract weight"
    if role == "mechanism":
        return "three abstract friction blocks before a clean doorway, showing unclear task, oversized first step, and distant feedback without readable labels"
    if role in {"method", "checklist"}:
        return "three clean action tiles leading toward a lighter doorway, with tools arranged before the first step and no readable text"
    if role == "close":
        return "a heavy doorway becoming lighter, simplified into one memorable symbol"
    return f"an original conceptual still that supports: {headline}"


def sanitized_copy_focus(scene: dict[str, Any]) -> str:
    headline = safe_text(scene.get("copy", {}).get("headline"))
    body = safe_text(scene.get("copy", {}).get("body"))
    parts = [part for part in [headline, body] if part]
    if not parts:
        return ""
    return " / ".join(parts[:2])


def scene_asset_guidance(scene: dict[str, Any]) -> dict[str, Any]:
    visual_remix = scene.get("visualRemix") if isinstance(scene.get("visualRemix"), dict) else {}
    guidance = visual_remix.get("assetGuidance") if isinstance(visual_remix.get("assetGuidance"), dict) else {}
    return guidance


def overlay_slots_for(scene: dict[str, Any]) -> list[str]:
    role = safe_text(scene.get("role"), "mechanism")
    visual_remix = scene.get("visualRemix") if isinstance(scene.get("visualRemix"), dict) else {}
    layout_archetype = safe_text(visual_remix.get("layoutArchetype"))
    guidance = scene_asset_guidance(scene)
    asset_types = [safe_text(item).lower() for item in (guidance.get("assetTypes") or []) if safe_text(item)]
    slots: list[str] = []

    if role in {"hook", "problem", "mechanism"} and layout_archetype in {"hud_explainer", "document_card", "stage_frame", "cinematic_quote_full_bleed"}:
        slots.append("foreground_overlay")
    if role in {"hook", "problem", "mechanism", "evidence", "contrast"}:
        slots.append("callout_overlay")
    if role in {"method", "checklist"}:
        slots.extend(["detail_overlay", "arrow_overlay"])
    if role in {"case", "evidence"}:
        slots.append("label_overlay")
    if role in {"hook", "close", "contrast"}:
        slots.append("focus_overlay")
    if "timeline_nodes" in asset_types:
        slots.append("detail_overlay")
    if "ui_buttons" in asset_types or "icon_set" in asset_types:
        slots.append("callout_overlay")
    if "hud_elements" in asset_types or "dot_grid_bg" in asset_types:
        slots.append("label_overlay")

    unique_slots: list[str] = []
    for slot in slots:
        if slot in OVERLAY_SLOTS and slot not in unique_slots:
            unique_slots.append(slot)
    return unique_slots


def needs_overlay_layer(scene: dict[str, Any]) -> bool:
    return bool(overlay_slots_for(scene))


def overlay_subject_for(scene: dict[str, Any], slot: str) -> str:
    role = safe_text(scene.get("role"), "mechanism")
    headline = safe_text(scene.get("copy", {}).get("headline"))
    body = safe_text(scene.get("copy", {}).get("body"))
    if slot == "foreground_overlay":
        if role == "hook":
            return "single dominant object, silhouette, or symbolic figure cutout with strong edge separation"
        if role == "mechanism":
            return "one clear causal object or a compact three-part object cluster with visible separation"
        return "clean foreground cutout with strong contrast and overlap-friendly edges"
    if slot == "focus_overlay":
        return "zoomed center subject, compact hero crop, or simplified symbolic insert"
    if slot == "detail_overlay":
        return "secondary detail crop, small object cluster, or diagram fragment that supports the main idea"
    if slot == "label_overlay":
        return "clean label plate, caption card, or annotation frame with empty center for later text"
    if slot == "callout_overlay":
        return "attention callout, highlighted shape, or emphasis bubble that points to one key idea"
    if slot == "arrow_overlay":
        return "directional arrow, connector path, or pointer graphic with clear movement"
    return f"original overlay element that supports: {headline} {body}".strip()


def overlay_purpose_for(scene: dict[str, Any], slot: str) -> str:
    role = safe_text(scene.get("role"), "mechanism")
    if slot == "foreground_overlay":
        if role == "hook":
            return "Make the opening claim feel immediate and visually dominant."
        if role == "mechanism":
            return "Expose the causal object or key mechanism as the first thing the viewer notices."
        return "Create a strong foreground emphasis layer."
    if slot == "focus_overlay":
        return "Add a tighter focal layer that isolates the central idea."
    if slot == "detail_overlay":
        return "Add supporting detail that explains the main image without overcrowding it."
    if slot == "label_overlay":
        return "Reserve a clean plate for later text or tags."
    if slot == "callout_overlay":
        return "Direct attention toward one key feature or insight."
    if slot == "arrow_overlay":
        return "Show direction, sequence, or relation between two parts."
    return "Support the scene with an extra layered visual."


def overlay_visual_rules(slot: str) -> list[str]:
    if slot == "foreground_overlay":
        return [
            "Use a single dominant subject or a compact cutout silhouette.",
            "Keep the background minimal so the layer can sit above the base image without visual collision.",
            "Leave irregular transparent-looking edges or soft fade edges where possible.",
        ]
    if slot == "focus_overlay":
        return [
            "Treat this as a tighter zoom or crop of the core idea.",
            "Center the visual weight and keep the outer margins lighter.",
            "Make the crop feel closer and more compressed than the base background.",
        ]
    if slot == "detail_overlay":
        return [
            "Use a small supporting object cluster, diagram fragment, or isolated detail insert.",
            "Keep the image compact and specific, not like a full second background.",
            "Let the layer explain one detail only.",
        ]
    if slot == "label_overlay":
        return [
            "Design this as a clean annotation plate or label strip.",
            "Keep one broad area visually calm so later text or icons can sit there.",
            "Avoid decorative clutter and avoid heavy scenery.",
        ]
    if slot == "callout_overlay":
        return [
            "Make one side feel heavier so the eye reads the callout direction immediately.",
            "Use contrast, framing, or highlighted framing shapes instead of a generic card.",
            "The layer should feel like an emphasis marker, not a poster.",
        ]
    if slot == "arrow_overlay":
        return [
            "Prioritize a clear directional shape, curve, or connector path.",
            "Make the form legible at small size and keep the composition sparse.",
            "This should read like a motion cue or pointer graphic, not a scene panel.",
        ]
    return []


def prompt_for(scene: dict[str, Any], target: dict[str, Any], slot: str) -> str:
    aspect_ratio = safe_text(target.get("aspectRatio"), "9:16")
    style_variant = safe_text(target.get("styleVariant"), "dark_warning_orange")
    role = safe_text(scene.get("role"), "mechanism")
    layout_intent = safe_text(scene.get("visual", {}).get("layoutIntent"), "clean conceptual support visual")
    role_rules = ROLE_DIRECTIVES.get(role, ROLE_DIRECTIVES["mechanism"])
    style_rules = STYLE_DIRECTIVES.get(style_variant, {
        "scene_language": f"{style_variant} visual system",
        "lighting": "clear cinematic lighting",
        "material": "clean editorial surfaces",
    })
    copy_focus = sanitized_copy_focus(scene)
    layout_archetype = safe_text(scene.get("layoutControls", {}).get("layoutArchetype"))
    visual_remix = scene.get("visualRemix") if isinstance(scene.get("visualRemix"), dict) else {}
    remix_layout = safe_text(visual_remix.get("layoutArchetype") or layout_archetype)
    effects = visual_remix.get("effects") if isinstance(visual_remix.get("effects"), list) else []
    effect_names = [safe_text(item.get("effectId")) for item in effects if isinstance(item, dict) and safe_text(item.get("effectId"))]
    asset_guidance = visual_remix.get("assetGuidance") if isinstance(visual_remix.get("assetGuidance"), dict) else {}
    style_markers = ", ".join(asset_guidance.get("styleMarkers") or [])
    fixed_elements = ", ".join(asset_guidance.get("fixedElements") or [])
    if slot in OVERLAY_SLOTS:
        overlay_goal = overlay_purpose_for(scene, slot)
        lines = [
            f"Create a second overlay layer for a {aspect_ratio} short video scene.",
            f"Scene role: {role}.",
            f"Copy focus: {copy_focus}.",
            f"Visual purpose: {purpose_for(scene)}",
            f"Overlay goal: {overlay_goal}",
            f"Subject: {overlay_subject_for(scene, slot)}.",
            "This layer will be placed on top of a separate background image in Remotion.",
            "It should read as a foreground emphasis layer, close-up cutout, symbolic insert, label strip, callout marker, or directional graphic, depending on the slot.",
            "Leave the layer clean and isolated if possible; no readable text, no logos, no watermark, no UI chrome, and no big full-scene background.",
            "Composition: strong silhouette separation, overlap-friendly edges, asymmetrical spacing, and enough empty edge space for stacking with other layers.",
            *overlay_visual_rules(slot),
            "Originality boundary: do not recreate any source frame, face, logo, watermark, or exact composition.",
        ]
        if slot == "label_overlay":
            lines.insert(-2, "Keep the center clean so later text or icons can sit on top without visual collision.")
        elif slot == "arrow_overlay":
            lines.insert(-2, "Keep the shape directional and legible at small size.")
        elif slot == "callout_overlay":
            lines.insert(-2, "Keep one side visually heavier so the callout reads immediately.")
        elif slot == "detail_overlay":
            lines.insert(-2, "Keep the content compact and specific rather than full-scene.")
        elif slot == "focus_overlay":
            lines.insert(-2, "Keep the crop tighter than the base image so it feels like a zoomed emphasis.")
        return " ".join(lines)
    if remix_layout in {"hud_explainer", "document_card", "stage_frame"}:
        layout_language = {
            "hud_explainer": "dark gamified HUD interface, dot grid, corner brackets, subtle scan grid, data-viz energy, crisp tech-noir hierarchy",
            "document_card": "retro-tech card stack, high-contrast central card, grid background, chromatic edge split, clean text-safe areas",
            "stage_frame": "impact title stage, geometric shapes, centered subject frame, pop-art tech energy, pulse-ready composition",
        }.get(remix_layout, "dark visual system")
        lines = [
            f"Create an original {aspect_ratio} short-video background inspired by a {remix_layout} layout.",
            f"Scene role: {role}.",
            f"Copy focus: {copy_focus}.",
            f"Visual purpose: {purpose_for(scene)}",
            f"Subject: {subject_for(scene)}.",
            f"Layout system: {layout_language}.",
            f"Detected source style markers to reinterpret: {style_markers or 'tech motion graphics, high contrast, clean overlays'}.",
            f"Fixed visual grammar to preserve as abstract structure: {fixed_elements or 'HUD alignment, grid rhythm, geometric framing'}.",
            f"Effects to support later in Remotion: {', '.join(effect_names) or 'subtle grid and glow'}; leave room for animated overlays.",
            "Composition: no readable text in the image; leave clear top/center/bottom safe zones for Remotion-rendered title and subtitles.",
            "Originality boundary: do not recreate any source frame, game UI, logo, watermark, creator handle, platform interface, or exact composition.",
        ]
        return " ".join(lines)
    if layout_archetype == "cinematic_quote_full_bleed":
        lines = [
            f"Create an original {aspect_ratio} full-bleed cinematic background for a quote-style short video.",
            f"Scene role: {role}.",
            f"Visual purpose: {purpose_for(scene)}",
            f"Subject: {subject_for(scene)}.",
            "Composition: no card, no panel, no UI, no infographic; one atmospheric full-screen image with clear negative space at top and lower center for overlaid title and bilingual subtitles.",
            f"Style system: {style_variant}. {style_rules['scene_language']}; {style_rules['lighting']}; {style_rules['material']}.",
            "Camera: soft cinematic still, shallow depth, gentle haze, film grain, emotional but restrained.",
            "Text policy: absolutely no readable text inside the image; all text will be rendered later by Remotion.",
            "Originality boundary: do not recreate any reference-video frame, person, room, camera angle, watermark, logo, book cover, or recognizable composition.",
        ]
        if copy_focus:
            lines.insert(3, f"Copy focus: {copy_focus}.")
        return " ".join(lines)
    lines = [
        f"Create an original {aspect_ratio} short-video supporting visual.",
        f"Scene role: {role}.",
        f"Scene objective: {role_rules['visual_goal']}.",
        f"Visual purpose: {purpose_for(scene)}",
        f"Subject: {subject_for(scene)}.",
        f"Scene design: {role_rules['subject_pattern']}; {role_rules['composition']}; {role_rules['camera']}.",
        f"Layout intent: {layout_intent}.",
        f"Style system: {style_variant}. {style_rules['scene_language']}; {style_rules['lighting']}; {style_rules['material']}.",
        f"Style cue: {style_description(style_variant)}.",
        "Prompt discipline: one clear focal idea, no readable text, no logos, no watermark, no platform UI, no copied frame, no creator identity.",
        "Originality boundary: do not recreate any reference-video frame, person, room, camera angle, or recognizable composition.",
    ]
    if copy_focus:
        lines.insert(4, f"Copy focus: {copy_focus}.")
    if role in {"hook", "close"}:
        lines.append("Keep the scene minimal and symbol-driven.")
    elif role in {"method", "checklist"}:
        lines.append("Keep the scene step-oriented and highly ordered.")
    elif role in {"mechanism", "evidence", "contrast"}:
        lines.append("Keep the scene explanatory and easy to scan at a glance.")
    return " ".join(lines)


def build_asset(scene: dict[str, Any], target: dict[str, Any], provider_order: list[str]) -> dict[str, Any]:
    role = safe_text(scene.get("role"), "mechanism")
    slot = ROLE_SLOT.get(role, "supporting_visual")
    scene_id = safe_text(scene.get("sceneId"), "scene")
    asset_id = f"asset_{scene_id}_{slot}"
    size = size_for(safe_text(target.get("aspectRatio"), "9:16"), slot)
    style_variant = safe_text(target.get("styleVariant"), "dark_warning_orange")
    role_rules = ROLE_DIRECTIVES.get(role, ROLE_DIRECTIVES["mechanism"])
    return {
        "assetId": asset_id,
        "sceneId": scene_id,
        "slot": slot,
        "assetType": "image",
        "required": False,
        "size": size,
        "purpose": purpose_for(scene),
        "prompt": prompt_for(scene, target, slot),
        "negativePrompt": NEGATIVE_BASE,
        "styleGuide": {
            "styleVariant": style_variant,
            "palette": style_description(style_variant),
            "composition": role_rules["composition"],
            "textPolicy": "no readable text",
        },
        "providerOrder": provider_order,
        "copyrightBoundary": {
            "doNotCopyOriginalFrames": True,
            "doNotUseLogos": True,
            "doNotUseCreatorIdentity": True,
        },
        "status": "planned",
    }


def build_overlay_asset(scene: dict[str, Any], target: dict[str, Any], provider_order: list[str], slot: str) -> dict[str, Any]:
    scene_id = safe_text(scene.get("sceneId"), "scene")
    asset_id = f"asset_{scene_id}_{slot}"
    aspect_ratio = safe_text(target.get("aspectRatio"), "9:16")
    if aspect_ratio == "3:4":
        size = {"width": 1080, "height": 1440}
    elif aspect_ratio == "16:9":
        size = {"width": 1920, "height": 1080}
    elif aspect_ratio == "1:1":
        size = {"width": 1080, "height": 1080}
    else:
        size = {"width": 1080, "height": 1920}
    return {
        "assetId": asset_id,
        "sceneId": scene_id,
        "slot": slot,
        "assetType": "image",
        "required": False,
        "size": size,
        "purpose": f"{overlay_purpose_for(scene, slot)} for {purpose_for(scene)}",
        "prompt": prompt_for(scene, target, slot),
        "negativePrompt": NEGATIVE_BASE,
        "styleGuide": {
            "styleVariant": safe_text(target.get("styleVariant"), "dark_warning_orange"),
            "palette": "layered overlay asset with strong subject separation, overlap-friendly edges, and clear visual hierarchy",
            "composition": "layered cutout, inset panel, or graphic overlay with clean edges",
            "textPolicy": "no readable text",
        },
        "providerOrder": provider_order,
        "copyrightBoundary": {
            "doNotCopyOriginalFrames": True,
            "doNotUseLogos": True,
            "doNotUseCreatorIdentity": True,
        },
        "status": "planned",
    }


def build_plan(job_dir: Path, variant: str, style_variant_requested: str | None) -> dict[str, Any]:
    video_plan = load_json(job_dir / f"video_plan.rewritten.{variant}.json")
    replication_plan = load_json(job_dir / "replication_plan.json")
    target = video_plan.get("target", {})
    resolved_style, explicit_style = resolve_style_variant(safe_text(target.get("styleVariant"), "dark_warning_orange"), style_variant_requested)
    provider_order = replication_plan.get("assetRule", {}).get("providerOrder", ["local_api", "openai_image", "svg_fallback"])
    provider_order = [provider for provider in provider_order if provider != "local_asset"]
    if "local_api" not in provider_order:
        provider_order.insert(0, "local_api")
    if "svg_fallback" not in provider_order:
        provider_order.append("svg_fallback")
    target = dict(target)
    target["styleVariant"] = resolved_style
    assets = []
    for scene in video_plan.get("scenes", []):
        assets.append(build_asset(scene, target, provider_order))
        for slot in overlay_slots_for(scene):
            assets.append(build_overlay_asset(scene, target, provider_order, slot))
    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("asset_prompt_plan"),
        "jobId": video_plan.get("jobId", job_dir.name),
        "variantId": variant,
        "styleVariant": resolved_style,
        "styleVariantSource": "explicit" if explicit_style else "target",
        "providerOrder": provider_order,
        "assets": assets,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prepare asset prompt plan for a rewritten video plan.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--variant", required=True)
    parser.add_argument("--style-variant", default="auto", help="Override the target style variant.")
    parser.add_argument("--output", help="Defaults to <job-dir>/asset_prompt_plan.<variant>.json")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    assert job_dir is not None
    plan = build_plan(job_dir, args.variant, args.style_variant)
    suffix = style_artifact_suffix(plan["styleVariant"], plan["styleVariantSource"] == "explicit")
    output_path = workspace_path(workspace, args.output) if args.output else job_dir / f"asset_prompt_plan.{args.variant}{suffix}.json"
    assert output_path is not None
    write_json(output_path, plan)
    print("Asset prompt plan prepared.")
    print(f"Output: {output_path}")
    print(f"Assets: {len(plan['assets'])}")
    print(f"Style variant: {plan['styleVariant']} ({plan['styleVariantSource']})")
    print(f"Provider order: {', '.join(plan['providerOrder'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
