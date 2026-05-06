#!/usr/bin/env python
"""Convert template-video-2 analysis.json into viral_breakdown.json."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import (
    artifact_meta,
    as_list,
    choose_style_variant,
    confidence_from,
    infer_tags,
    load_json,
    normalize_content_domain,
    normalize_hook_type,
    normalize_role,
    parse_time_range,
    safe_text,
    str_list,
    style_tags_for_domain,
    write_json,
)


def build_packaging(analysis: dict[str, Any]) -> dict[str, Any]:
    meta = analysis.get("meta", {}) if isinstance(analysis.get("meta"), dict) else {}
    title = analysis.get("title_analysis", {}) if isinstance(analysis.get("title_analysis"), dict) else {}
    description = analysis.get("description_analysis", {}) if isinstance(analysis.get("description_analysis"), dict) else {}
    raw_title = safe_text(title.get("raw_title"), safe_text(meta.get("title"), ""))
    cover_text = title.get("cover_text", meta.get("cover_text"))
    first_frame = title.get("first_frame_text", meta.get("first_frame_text"))
    return {
        "title": {
            "raw": raw_title or None,
            "formula": safe_text(title.get("formula"), safe_text(title.get("title_type"), "unknown")),
            "contains": [key for key, flag in (title.get("contains") or {}).items() if flag],
            "confidence": confidence_from(title, 0.45),
        },
        "coverText": {
            "raw": cover_text,
            "role": "packaging_surface" if cover_text else "unknown",
            "confidence": 0.7 if cover_text else 0.2,
        },
        "firstFrameText": {
            "raw": first_frame,
            "role": "first_frame_hook" if first_frame else "unknown",
            "confidence": 0.7 if first_frame else 0.2,
        },
        "descriptionOpening": {
            "raw": safe_text(description.get("raw_description"), safe_text(meta.get("description"), ""))[:240] or None,
            "role": safe_text(description.get("opening_role"), "unknown"),
            "confidence": confidence_from(description, 0.4),
        },
        "surfaceRelationship": safe_text(
            (title.get("relationship_between_surfaces") or {}).get("title_vs_first_frame"),
            "Packaging surfaces need review; title, cover, and first-frame relationship was not explicit.",
        ),
    }


def build_hook(analysis: dict[str, Any]) -> dict[str, Any]:
    hook = analysis.get("hook_analysis", {}) if isinstance(analysis.get("hook_analysis"), dict) else {}
    meta = analysis.get("meta", {}) if isinstance(analysis.get("meta"), dict) else {}
    hook_text = safe_text(hook.get("hook_text"), safe_text(meta.get("first_frame_text"), ""))
    start, duration = parse_time_range(hook.get("time_range_sec"), 0.0, 5.0)
    hook_type = normalize_hook_type(hook.get("hook_type"), hook_text)
    devices = hook.get("devices") or {}
    device_text = ", ".join([key for key, flag in devices.items() if flag]) if isinstance(devices, dict) else ""
    return {
        "type": hook_type,
        "startSec": start,
        "endSec": start + duration,
        "firstFramePromise": hook_text or "Opening promise needs review",
        "curiosityGap": safe_text(hook.get("core_mechanism"), safe_text(hook.get("surface_dependency"), "Hidden mechanism or payoff needs review")),
        "viewerIdentityTrigger": "Inferred from hook wording; review against transcript.",
        "riskOrReward": device_text or "uncertain",
        "visualSupport": safe_text(hook.get("visual_support"), "Visual support not available; inferred from structure."),
        "audioSupport": "Opening audio support inferred from Stage 2 analysis; review if ASR is missing.",
        "whyItRetains": safe_text(
            hook.get("core_mechanism"),
            "The opening creates an information gap that should be resolved by the next segment.",
        ),
        "confidence": confidence_from(hook, 0.5),
    }


def section_text(section: Any) -> str:
    if isinstance(section, dict):
        parts = []
        for key in ["role", "section", "title", "summary", "purpose", "content", "visual", "notes"]:
            if key in section:
                parts.append(safe_text(section.get(key)))
        return " ".join(part for part in parts if part)
    return safe_text(section)


def section_start_duration(section: Any, index: int, total: int, duration_sec: float) -> tuple[float, float]:
    fallback_duration = max(1.0, duration_sec / max(1, total))
    fallback_start = fallback_duration * index
    if isinstance(section, dict):
        for key in ["time_range_sec", "timeRangeSec", "time_range", "range"]:
            if key in section:
                return parse_time_range(section.get(key), fallback_start, fallback_duration)
        if "startSec" in section or "durationSec" in section:
            try:
                return max(0.0, float(section.get("startSec", fallback_start))), max(0.1, float(section.get("durationSec", fallback_duration)))
            except (TypeError, ValueError):
                pass
        if "start_sec" in section or "duration_sec" in section:
            try:
                return max(0.0, float(section.get("start_sec", fallback_start))), max(0.1, float(section.get("duration_sec", fallback_duration)))
            except (TypeError, ValueError):
                pass
    return fallback_start, fallback_duration


def build_segments(analysis: dict[str, Any], domain: str, duration_sec: float) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    structure = analysis.get("structure_analysis")
    sections = structure if isinstance(structure, list) and structure else []
    if not sections:
        sections = [
            {"role": "hook", "summary": safe_text((analysis.get("hook_analysis") or {}).get("hook_text"), "Opening hook")},
            {"role": "mechanism", "summary": "Main mechanism or explanation inferred from analysis."},
            {"role": "close", "summary": "Closing payoff or CTA inferred from analysis."},
        ]
    total = len(sections)
    segments: list[dict[str, Any]] = []
    evidence: list[dict[str, Any]] = []
    previous_end = 0.0
    for index, section in enumerate(sections):
        text = section_text(section)
        role = normalize_role((section or {}).get("role") if isinstance(section, dict) else text, index, total)
        start, seg_duration = section_start_duration(section, index, total, duration_sec or 30.0)
        start = max(previous_end, min(start, duration_sec))
        if index < total - 1:
            next_start, _ = section_start_duration(sections[index + 1], index + 1, total, duration_sec or 30.0)
            if next_start > start:
                seg_duration = min(seg_duration, next_start - start)
        else:
            seg_duration = min(seg_duration, max(0.1, duration_sec - start))
        seg_duration = max(0.1, seg_duration)
        previous_end = start + seg_duration
        layout_tags, retention_tags, visual_tags = infer_tags(text, role, domain)
        evidence_id = f"ev_{index + 1:03d}"
        evidence.append(
            {
                "id": evidence_id,
                "sourceType": "metadata" if not isinstance(section, dict) else "manual_note",
                "timeRangeSec": [round(start, 2), round(start + seg_duration, 2)],
                "supports": [f"segments.seg_{index + 1:02d}.role", f"segments.seg_{index + 1:02d}.layoutTags"],
                "note": text or f"Segment {index + 1} inferred from structure analysis.",
            }
        )
        if index == 0:
            evidence[-1]["supports"].append("hook.type")
        segments.append(
            {
                "id": f"seg_{index + 1:02d}",
                "role": role,
                "startSec": round(start, 2),
                "durationSec": round(seg_duration, 2),
                "layoutTags": layout_tags,
                "retentionTags": retention_tags,
                "visualTags": visual_tags,
                "subtitleDensity": "high" if role == "hook" else "medium",
                "audioEnergy": "high" if role == "hook" else "medium",
                "transitionIn": "cold_open" if index == 0 else "hard_cut_or_soft_reveal",
                "transitionOut": "payoff_or_bridge" if index < total - 1 else "final_hold",
                "visualIntent": text or f"Use {role} segment to advance the narrative.",
                "reusableRule": text or f"Preserve the {role} role while rewriting content for the new topic.",
                "replicationPriority": "high" if role == "hook" else "medium",
                "mustPreserve": ["role", "timing"] + (["hook_type", "subtitle_density"] if role == "hook" else []),
                "canChange": ["copy", "visual_asset", "example", "speaker_wording"],
                "sourceEvidenceIds": [evidence_id],
                "confidence": confidence_from(section if isinstance(section, dict) else None, 0.55),
            }
        )
    return segments, evidence


def build_rhythm(analysis: dict[str, Any], segments: list[dict[str, Any]]) -> dict[str, Any]:
    rhythm = analysis.get("rhythm_analysis", {}) if isinstance(analysis.get("rhythm_analysis"), dict) else {}
    changes = rhythm.get("scene_changes") if isinstance(rhythm.get("scene_changes"), list) else []
    avg = rhythm.get("avgShotLengthSec")
    if avg is None and len(segments) > 1:
        avg = sum(float(item["durationSec"]) for item in segments) / len(segments)
    return {
        "avgShotLengthSec": round(float(avg or 0), 2),
        "cutDensity": safe_text(rhythm.get("cutDensity"), "medium_high" if len(changes) >= 6 else "medium"),
        "frontLoadDensity": "high" if segments and segments[0].get("durationSec", 99) <= 5 else "medium",
        "speedCurve": safe_text(rhythm.get("speedCurve"), "fast_opening_then_medium_explain"),
        "pausePattern": safe_text(rhythm.get("pausePattern"), safe_text((analysis.get("audio_analysis") or {}).get("pause_pattern"), "unknown")),
        "peakMoments": rhythm.get("peak_moments") if isinstance(rhythm.get("peak_moments"), list) else [],
    }


def build_visual_layouts(analysis: dict[str, Any], segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    detailed = analysis.get("visual_analysis_detailed")
    detailed_scenes = detailed.get("scenes") if isinstance(detailed, dict) and isinstance(detailed.get("scenes"), list) else []
    if detailed_scenes:
        layouts = []
        for index, scene in enumerate(detailed_scenes):
            layout = scene.get("layout") if isinstance(scene.get("layout"), dict) else {}
            motion = scene.get("motion") if isinstance(scene.get("motion"), dict) else {}
            transition = scene.get("transition") if isinstance(scene.get("transition"), dict) else {}
            segment = segments[min(index, len(segments) - 1)] if segments else {}
            layout_tags = [layout.get("archetype")] if layout.get("archetype") else []
            layout_tags.extend(segment.get("layoutTags", []))
            layouts.append(
                {
                    "layoutId": f"layout_{index + 1:02d}",
                    "sourceSceneId": scene.get("sceneId"),
                    "sourceSectionId": scene.get("sourceSectionId"),
                    "layoutArchetype": layout.get("archetype"),
                    "layoutTags": list(dict.fromkeys([safe_text(item) for item in layout_tags if safe_text(item)])),
                    "usedInSegments": [segment.get("id")] if segment.get("id") else [],
                    "textLayers": layout.get("textLayers", []),
                    "imageLayer": layout.get("imageLayer", {}),
                    "safeZones": layout.get("safeZones", {}),
                    "motionPreset": motion.get("motionPreset"),
                    "cameraMove": motion.get("cameraMove"),
                    "effects": scene.get("effects", []),
                    "transition": transition,
                    "subtitleBehavior": scene.get("subtitleBehavior", {}),
                    "assetGuidance": scene.get("assetGuidance", {}),
                    "remixDirective": scene.get("remixDirective", {}),
                    "layoutControls": {
                        "layoutArchetype": layout.get("archetype"),
                        "titlePosition": (layout.get("safeZones") or {}).get("title", "top_center"),
                        "subtitlePosition": (layout.get("safeZones") or {}).get("caption", "lower_center"),
                        "imageMode": (layout.get("imageLayer") or {}).get("imageMode", "supporting_visual"),
                        "motionPreset": motion.get("motionPreset", "slow_push_with_text_reveal"),
                        "effectStack": [item.get("effectId") for item in scene.get("effects", []) if isinstance(item, dict) and item.get("effectId")],
                        "transitionPreset": transition.get("transitionIn"),
                    },
                    "rule": "Preserve the detected visual grammar while replacing source-specific imagery and text.",
                    "confidence": scene.get("confidence", 0.55),
                }
            )
        return layouts

    visual = analysis.get("visual_analysis")
    layouts: list[dict[str, Any]] = []
    if isinstance(visual, list) and visual:
        iterable = visual
    else:
        iterable = [{"layoutTags": segments[0].get("layoutTags", []) if segments else ["large_text_center"], "summary": "Inferred primary layout"}]
    for index, item in enumerate(iterable):
        text = section_text(item)
        layout_tags = str_list(item.get("layoutTags") or item.get("layout_tags")) if isinstance(item, dict) else []
        if not layout_tags:
            layout_tags, _, _ = infer_tags(text, segments[index].get("role", "hook") if index < len(segments) else "hook", "education")
        layouts.append(
            {
                "layoutId": f"layout_{index + 1:02d}",
                "layoutTags": layout_tags,
                "usedInSegments": [segments[min(index, len(segments) - 1)]["id"]] if segments else [],
                "textRegion": safe_text(item.get("textRegion") if isinstance(item, dict) else None, "center"),
                "assetRegion": safe_text(item.get("assetRegion") if isinstance(item, dict) else None, "supporting"),
                "assetDependency": safe_text(item.get("assetDependency") if isinstance(item, dict) else None, "low"),
                "recreationDifficulty": safe_text(item.get("recreationDifficulty") if isinstance(item, dict) else None, "medium"),
                "moduleHints": [],
                "layoutControls": {
                    "titlePosition": "center" if "large_text_center" in layout_tags else "top",
                    "imageMode": "none" if "minimal_background" in layout_tags else "supporting_visual",
                    "density": "high" if "number_dashboard" in layout_tags else "medium",
                },
                "rule": text or "Preserve layout role, not exact source frame.",
            }
        )
    return layouts


def convert(analysis: dict[str, Any], summary: dict[str, Any] | None = None, source_video_id: str | None = None) -> dict[str, Any]:
    meta = analysis.get("meta", {}) if isinstance(analysis.get("meta"), dict) else {}
    duration_sec = float(meta.get("duration_sec") or meta.get("durationSec") or 0)
    domain = normalize_content_domain(meta.get("track"), meta.get("title"), meta.get("description"))
    segments, evidence = build_segments(analysis, domain, duration_sec or 30.0)
    hook = build_hook(analysis)
    if evidence:
        evidence[0]["supports"] = sorted(set(evidence[0].get("supports", []) + ["hook.type", "hook.whyItRetains"]))
    subtitle = analysis.get("subtitle_analysis", {}) if isinstance(analysis.get("subtitle_analysis"), dict) else {}
    audio = analysis.get("audio_analysis", {}) if isinstance(analysis.get("audio_analysis"), dict) else {}
    script = analysis.get("script_analysis", {}) if isinstance(analysis.get("script_analysis"), dict) else {}
    summary_obj = summary.get("summary", summary) if isinstance(summary, dict) else analysis.get("summary", {})
    fixed_rules = str_list((summary_obj or {}).get("best_fixed_rules") if isinstance(summary_obj, dict) else [])
    fixed_rules.extend(str_list((summary_obj or {}).get("top_template_rules") if isinstance(summary_obj, dict) else []))
    variable_candidates = str_list((summary_obj or {}).get("best_variable_candidates") if isinstance(summary_obj, dict) else [])

    if not fixed_rules:
        fixed_rules = [segment["reusableRule"] for segment in segments[:3]]
    if not variable_candidates:
        variable_candidates = ["topic", "viewer identity", "case example", "visual assets", "method wording"]

    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("viral_breakdown"),
        "meta": {
            "sourceVideoId": source_video_id or safe_text(analysis.get("source_video_id"), "source_video"),
            "durationSec": duration_sec,
            "aspectRatio": safe_text(meta.get("aspect_ratio"), "9:16"),
            "platformGuess": safe_text(meta.get("platform"), "unknown"),
            "contentDomain": domain,
            "language": safe_text(meta.get("language"), "zh-CN"),
        },
        "packaging": build_packaging(analysis),
        "hook": hook,
        "narrativeStructure": {
            "pattern": [segment["role"] for segment in segments],
            "turningPointsSec": [segment["startSec"] for segment in segments],
            "summary": safe_text(script.get("paragraph_organization"), "Narrative pattern inferred from Stage 2 structure analysis."),
        },
        "segments": segments,
        "rhythmRule": build_rhythm(analysis, segments),
        "visualLayouts": build_visual_layouts(analysis, segments),
        "visualAnalysisDetailed": analysis.get("visual_analysis_detailed"),
        "subtitleRule": {
            "position": safe_text(subtitle.get("position"), "bottom_center"),
            "fontSizeClass": safe_text(subtitle.get("fontSizeClass"), "large"),
            "lineCount": 2,
            "highlightStyle": safe_text(subtitle.get("highlight_strategy"), "keyword_color"),
            "highlightColor": "#ffd166",
            "stroke": True,
            "timingPattern": safe_text(subtitle.get("timing_pattern"), "voice_first"),
        },
        "audioRule": {
            "voicePace": safe_text(audio.get("voice_style"), safe_text(audio.get("pace"), "medium_fast")),
            "bgmMood": safe_text(audio.get("bgm_style"), "low_tension"),
            "sfxDensity": "low" if not audio.get("hook_sfx_likely") else "medium",
            "pausePattern": safe_text(audio.get("pause_pattern"), "unknown"),
        },
        "style": {
            "moodTags": str_list(script.get("dominant_modes")) or ["calm", "sharp"],
            "paletteTags": [choose_style_variant(domain)],
            "styleTags": style_tags_for_domain(domain),
            "texture": "inferred_from_reference",
            "motionStyle": "slow_push_with_text_reveal",
        },
        "fixedRules": fixed_rules,
        "variableCandidates": variable_candidates,
        "sourceEvidence": evidence,
        "copyrightBoundary": {
            "referenceOnlyForStructure": True,
            "doNotCopyExactWords": True,
            "doNotCopyOriginalFrames": True,
            "doNotCopyVoice": True,
            "doNotCopyMusic": True,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert template-video-2 analysis.json into viral_breakdown.json.")
    parser.add_argument("--analysis", required=True, help="Path to analysis.json.")
    parser.add_argument("--summary", help="Optional summary.json path.")
    parser.add_argument("--output", required=True, help="Output viral_breakdown.json path.")
    parser.add_argument("--source-video-id", help="Override sourceVideoId.")
    args = parser.parse_args()

    analysis = load_json(Path(args.analysis))
    summary = load_json(Path(args.summary)) if args.summary else None
    payload = convert(analysis, summary, args.source_video_id)
    write_json(Path(args.output), payload)
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
