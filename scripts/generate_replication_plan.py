#!/usr/bin/env python
"""Generate replication_plan.json from viral_breakdown and module_match_report."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, choose_style_variant, load_json, write_json


DO_NOT_REPLICATE = ["exact_words", "original_frames", "original_voice", "original_music", "logos", "watermarks"]


def index_by_id(items: list[dict[str, Any]], key: str) -> dict[str, dict[str, Any]]:
    return {str(item.get(key)): item for item in items if isinstance(item, dict) and item.get(key)}


def selected_template(matches: list[dict[str, Any]], modules: dict[str, dict[str, Any]], requested: str) -> str:
    if requested and requested != "auto":
        return requested
    for match in matches:
        module = modules.get(match.get("selectedModuleId"))
        if module:
            return str(module.get("templateId"))
    return "minimal_psych_explainer"


def selected_style(domain: str, template_id: str, requested: str) -> str:
    if requested and requested != "auto":
        return requested
    if template_id == "cinematic_quote_full_bleed":
        return "cinematic_soft_green_amber"
    if template_id == "new_signals":
        return "dark_warning_orange"
    if template_id == "minimal_psych_explainer":
        return "warm_paper"
    if template_id == "comic_habit_spiral":
        return "comic_night_purple"
    if template_id == "tech_archive_explainer":
        return "dark_archive_green"
    if template_id == "combinatorial_paradox_cinematic":
        return "cinematic_amber_noir"
    if template_id == "corporate_retreat_dossier":
        return "cold_newsroom"
    return choose_style_variant(domain)


def visual_layouts_by_segment(breakdown: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for layout in breakdown.get("visualLayouts") or []:
        if not isinstance(layout, dict):
            continue
        for segment_id in layout.get("usedInSegments") or []:
            if segment_id:
                result[str(segment_id)] = layout
    return result


def scene_mapping(breakdown: dict[str, Any], report: dict[str, Any]) -> list[dict[str, Any]]:
    segments = index_by_id(breakdown.get("segments") or [], "id")
    visual_by_segment = visual_layouts_by_segment(breakdown)
    mappings = []
    for match in report.get("matches") or []:
        segment_id = match.get("sourceSegmentId")
        segment = segments.get(str(segment_id), {})
        visual_layout = visual_by_segment.get(str(segment_id), {})
        layout_controls = dict(visual_layout.get("layoutControls") or {})
        selected = match.get("selectedModuleId")
        if not selected:
            selected = "minimal_psych.mechanism_statement"
        role = str(segment.get("role") or "mechanism")
        mappings.append(
            {
                "sourceSegmentId": segment_id,
                "targetRole": role,
                "moduleId": selected,
                "durationSec": float(segment.get("durationSec") or 4),
                "sourcePattern": str(segment.get("reusableRule") or f"Preserve {role} structural function."),
                "adaptationInstruction": "Rewrite the content for the target topic while preserving the segment role, timing pressure, and retention mechanism.",
                "avoidInstruction": "Do not reuse source wording, original frames, original people, logos, watermarks, voice, or music.",
                "layoutIntent": str(segment.get("visualIntent") or "Preserve layout role, not source pixels."),
                "visualRemix": {
                    "layoutArchetype": visual_layout.get("layoutArchetype"),
                    "textLayers": visual_layout.get("textLayers", []),
                    "imageLayer": visual_layout.get("imageLayer", {}),
                    "motionPreset": visual_layout.get("motionPreset"),
                    "cameraMove": visual_layout.get("cameraMove"),
                    "effects": visual_layout.get("effects", []),
                    "transition": visual_layout.get("transition", {}),
                    "subtitleBehavior": visual_layout.get("subtitleBehavior", {}),
                    "remixDirective": visual_layout.get("remixDirective", {}),
                },
                "layoutControls": layout_controls,
                "contentInstruction": "Generate original copy and examples for the new topic using this module as the visual container.",
            }
        )
    return mappings


def generate(
    breakdown: dict[str, Any],
    report: dict[str, Any],
    registry: dict[str, Any],
    account_id: str,
    template_id: str,
    style_variant: str,
    strength: str,
    output_breakdown_path: str,
    output_match_path: str,
) -> dict[str, Any]:
    modules = index_by_id(registry.get("modules") or [], "moduleId")
    matches = report.get("matches") or []
    domain = str(breakdown.get("meta", {}).get("contentDomain") or "education")
    layout_profile = breakdown.get("layoutProfile") if isinstance(breakdown.get("layoutProfile"), dict) else {}
    preferred_template = layout_profile.get("recommendedTemplateId")
    preferred_style = layout_profile.get("recommendedStyleVariant")
    resolved_template = template_id if template_id and template_id != "auto" else selected_template(matches, modules, preferred_template or template_id)
    resolved_style = selected_style(domain, resolved_template, preferred_style if style_variant == "auto" else style_variant)
    subtitle = breakdown.get("subtitleRule") or {}
    audio = breakdown.get("audioRule") or {}
    mappings = scene_mapping(breakdown, report)
    requires_review = any(match.get("requiresReview") for match in matches)
    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("replication_plan"),
        "source": {
            "viralBreakdownPath": output_breakdown_path,
            "moduleMatchReportPath": output_match_path,
        },
        "target": {
            "accountId": account_id,
            "templateId": resolved_template,
            "styleVariant": resolved_style,
            "aspectRatio": str(breakdown.get("meta", {}).get("aspectRatio") or "9:16"),
            "durationSec": float(breakdown.get("meta", {}).get("durationSec") or sum(item["durationSec"] for item in mappings) or 60),
            "language": str(breakdown.get("meta", {}).get("language") or "zh-CN"),
        },
        "qualityTarget": {
            "retentionGoal": "Preserve hook density, segment timing, and the reference video's payoff structure.",
            "visualSimilarityLevel": "structure_rhythm_style"
            if layout_profile.get("visualSimilarityMode") == "layout_and_style"
            else ("structure_and_rhythm" if strength != "low" else "structure_only"),
            "originalityLevel": "high" if strength != "high" else "strict",
        },
        "replicationStrategy": {
            "strength": strength,
            "replicate": [
                "narrative_structure",
                "segment_timing",
                "hook_pattern",
                "subtitle_density",
                "visual_layout_roles",
                "layout_archetype",
                "text_zones",
                "motion_presets",
                "effect_stack",
                "transition_grammar",
            ],
            "doNotReplicate": DO_NOT_REPLICATE,
        },
        "sceneMapping": mappings,
        "subtitleRule": {
            "fontSize": 36 if subtitle.get("fontSizeClass") in {"large", "extra_large"} else 28,
            "color": "#ffffff",
            "highlightColor": subtitle.get("highlightColor") or "#ffd166",
            "position": subtitle.get("position") or "bottom_center",
            "maxCharsPerLine": 14,
        },
        "audioRule": {
            "voicePace": audio.get("voicePace") or "medium_fast",
            "bgmMood": audio.get("bgmMood") or "low_tension",
            "sfxDensity": audio.get("sfxDensity") or "low",
            "pausePattern": audio.get("pausePattern") or "unknown",
        },
        "assetRule": {
            "provider": "auto",
            "providerOrder": ["local_asset", "local_api", "openai_image", "svg_fallback"],
            "fallbackProvider": "svg_fallback",
            "allowLocalApi": True,
            "avoidCopyOriginalFrames": True,
        },
        "layoutControls": {
            "layoutArchetype": layout_profile.get("layoutArchetype", "template_module_adapted"),
            "titlePosition": "center",
            "subtitlePosition": subtitle.get("position") or "bottom_center",
            "imageMode": layout_profile.get("assetPolicy", {}).get("imageMode") or "supporting_visual",
            "density": "medium_high" if strength in {"medium", "high"} else "medium",
            "motionPreset": layout_profile.get("motionStyle") or breakdown.get("style", {}).get("motionStyle") or "slow_push_with_text_reveal",
            "textZones": layout_profile.get("textZones", {}),
        },
        "validationChecks": [
            "sceneMapping.moduleId exists in module_registry",
            "no source exact words appear in generated script",
            "no source frame or watermark is used as an asset",
            "all required asset slots have manifest entries or fallbacks",
            "subtitle line length stays within maxCharsPerLine",
        ],
        "reviewStatus": {
            "status": "needs_review" if requires_review else "draft",
            "requiresHumanReview": True,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate replication_plan.json.")
    parser.add_argument("--viral-breakdown", required=True, help="Path to viral_breakdown.json.")
    parser.add_argument("--module-match-report", required=True, help="Path to module_match_report.json.")
    parser.add_argument("--registry", default="data/module_registry.json", help="Path to module_registry.json.")
    parser.add_argument("--output", required=True, help="Output replication_plan.json path.")
    parser.add_argument("--account-id", default="default")
    parser.add_argument("--template-id", default="auto")
    parser.add_argument("--style-variant", default="auto")
    parser.add_argument("--strength", choices=["low", "medium", "high"], default="medium")
    args = parser.parse_args()

    output = generate(
        load_json(Path(args.viral_breakdown)),
        load_json(Path(args.module_match_report)),
        load_json(Path(args.registry)),
        args.account_id,
        args.template_id,
        args.style_variant,
        args.strength,
        args.viral_breakdown,
        args.module_match_report,
    )
    write_json(Path(args.output), output)
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
