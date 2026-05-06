#!/usr/bin/env python
"""Infer a reusable visual layout profile from Stage 2 analysis output."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, safe_text, write_json


def text_blob(value: Any) -> str:
    if isinstance(value, dict):
        return " ".join(text_blob(item) for item in value.values())
    if isinstance(value, list):
        return " ".join(text_blob(item) for item in value)
    return str(value or "")


def count_matches(text: str, needles: list[str]) -> int:
    lower = text.lower()
    return sum(1 for needle in needles if needle.lower() in lower)


def infer_layout_profile(analysis: dict[str, Any], summary: dict[str, Any] | None = None) -> dict[str, Any]:
    source = analysis.get("source", {}) if isinstance(analysis.get("source"), dict) else {}
    visual = analysis.get("visual_analysis", {}) if isinstance(analysis.get("visual_analysis"), dict) else {}
    detailed = analysis.get("visual_analysis_detailed", {}) if isinstance(analysis.get("visual_analysis_detailed"), dict) else {}
    subtitles = analysis.get("subtitle_analysis", {}) if isinstance(analysis.get("subtitle_analysis"), dict) else {}
    frame_summaries = analysis.get("frame_summaries", []) if isinstance(analysis.get("frame_summaries"), list) else []
    blob = " ".join([text_blob(visual), text_blob(detailed), text_blob(subtitles), text_blob(frame_summaries), text_blob(summary or {})])

    cinematic_score = 0
    cinematic_score += count_matches(blob, ["电影", "cinematic", "胶片", "柔光", "风景", "剪影", "海", "月光", "草地", "人物"])
    cinematic_score += count_matches(blob, ["bilingual", "英文", "中英", "subtitle", "双语"])
    cinematic_score += count_matches(blob, ["全屏", "full_bleed", "background", "背景", "large top title", "顶部"])

    hud_score = count_matches(blob, ["hud", "grid", "ui_like", "document_panel", "信息图", "卡片", "面板"])
    has_bilingual = count_matches(blob, ["英文", "中英", "bilingual", "english subtitle"]) >= 1
    has_top_title = count_matches(blob, ["顶部", "大标题", "书名", "《", "title"]) >= 1
    has_full_bleed = count_matches(blob, ["全屏", "full_bleed", "背景", "风景", "画面"]) >= 1

    if cinematic_score >= max(3, hud_score + 1) or (has_full_bleed and has_top_title and cinematic_score >= 2 and hud_score == 0):
        archetype = "cinematic_quote_full_bleed"
        template_id = "cinematic_quote_full_bleed"
        style_variant = "cinematic_soft_green_amber"
        layout_tags = ["full_bleed_image", "large_top_title", "bilingual_subtitle", "creator_handle_bottom", "cinematic_still"]
        style_tags = ["cinematic_soft_green_amber", "film_glow", "emotional_quote"]
        motion_style = "slow_push_full_bleed"
    else:
        archetype = "template_module_adapted"
        template_id = "auto"
        style_variant = "auto"
        layout_tags = []
        style_tags = []
        motion_style = "slow_push_with_text_reveal"

    aspect_ratio = safe_text(source.get("aspect_ratio") or source.get("aspectRatio") or analysis.get("meta", {}).get("aspectRatio"), "9:16")
    if aspect_ratio == "9:16" and float(source.get("width", 0) or 0) == 1080 and float(source.get("height", 0) or 0) == 1440:
        aspect_ratio = "3:4"
    if archetype == "cinematic_quote_full_bleed" and aspect_ratio == "9:16":
        aspect_ratio = "3:4"

    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("layout_profile"),
        "layoutArchetype": archetype,
        "recommendedTemplateId": template_id,
        "recommendedStyleVariant": style_variant,
        "aspectRatio": aspect_ratio,
        "visualSimilarityMode": "layout_and_style" if archetype != "template_module_adapted" else "structure_and_rhythm",
        "detectedTraits": {
            "fullBleedBackground": has_full_bleed,
            "largeTopTitle": has_top_title,
            "bilingualSubtitles": has_bilingual,
            "cinematicLighting": cinematic_score > 0,
            "hudOrCardLayout": hud_score > 0,
        },
        "layoutTags": layout_tags,
        "styleTags": style_tags,
        "motionStyle": motion_style,
        "effectStack": (detailed.get("globalVisualGrammar") or {}).get("effectStack", []) if isinstance(detailed.get("globalVisualGrammar"), dict) else [],
        "transitionPattern": safe_text((detailed.get("globalVisualGrammar") or {}).get("transitionPattern") if isinstance(detailed.get("globalVisualGrammar"), dict) else None),
        "textZones": {
            "title": "top_center",
            "subtitlePrimary": "lower_center",
            "subtitleSecondary": "below_primary",
            "creatorHandle": "bottom_center",
        },
        "assetPolicy": {
            "imageMode": "full_bleed_background",
            "safeTextZones": ["top_center", "lower_center", "bottom_center"],
            "forbidTextInGeneratedImages": True,
        },
        "confidence": 0.78 if archetype == "cinematic_quote_full_bleed" else 0.55,
    }


def enrich_viral_breakdown(viral: dict[str, Any], profile: dict[str, Any]) -> dict[str, Any]:
    viral["layoutProfile"] = profile
    if profile.get("layoutArchetype") == "cinematic_quote_full_bleed":
        viral.setdefault("style", {})
        viral["style"]["styleTags"] = profile.get("styleTags", [])
        viral["style"]["motionStyle"] = profile.get("motionStyle", "slow_push_full_bleed")
        viral["style"]["effectStack"] = profile.get("effectStack", [])
        viral["style"]["transitionPattern"] = profile.get("transitionPattern")
        viral["style"]["layoutArchetype"] = profile.get("layoutArchetype")
        viral.setdefault("meta", {})["aspectRatio"] = profile.get("aspectRatio") or viral.get("meta", {}).get("aspectRatio", "9:16")
        for segment in viral.get("segments", []) or []:
            tags = list(dict.fromkeys([*(segment.get("layoutTags") or []), *(profile.get("layoutTags") or [])]))
            segment["layoutTags"] = tags
            visual_tags = list(dict.fromkeys([*(segment.get("visualTags") or []), "cinematic_still", "full_bleed_background"]))
            segment["visualTags"] = visual_tags
    return viral


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Infer layout_profile.json from analysis.json.")
    parser.add_argument("--analysis", required=True)
    parser.add_argument("--summary")
    parser.add_argument("--viral-breakdown")
    parser.add_argument("--output", required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    analysis = load_json(Path(args.analysis))
    summary = load_json(Path(args.summary)) if args.summary and Path(args.summary).exists() else None
    profile = infer_layout_profile(analysis, summary)
    write_json(Path(args.output), profile)
    if args.viral_breakdown:
        viral_path = Path(args.viral_breakdown)
        if viral_path.exists():
            write_json(viral_path, enrich_viral_breakdown(load_json(viral_path), profile))
    print(f"Wrote {args.output}")
    print(f"Layout archetype: {profile['layoutArchetype']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
