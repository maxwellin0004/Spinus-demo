#!/usr/bin/env python
"""Prepare compact context for scene-level copy rewriting."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, safe_text, write_json


VARIANT_PRESETS: dict[str, dict[str, Any]] = {
    "sharp_contrarian": {
        "variantId": "sharp_contrarian",
        "label": "Sharp contrarian",
        "platformFit": ["douyin", "xiaohongshu"],
        "contentTone": "sharp",
        "hookStyle": "reverse_claim",
        "rhetoricalPattern": "belief_correction_to_mechanism",
        "emotionCurve": "high_opening_then_clear_explain",
        "sentenceStyle": "short_direct",
        "ctaStyle": "light_save_prompt",
    },
    "warm_explainer": {
        "variantId": "warm_explainer",
        "label": "Warm explainer",
        "platformFit": ["xiaohongshu", "bilibili"],
        "contentTone": "warm",
        "hookStyle": "gentle_reframe",
        "rhetoricalPattern": "relief_to_mechanism_to_method",
        "emotionCurve": "medium_opening_then_calm",
        "sentenceStyle": "natural_reassuring",
        "ctaStyle": "soft_save_prompt",
    },
    "story_case": {
        "variantId": "story_case",
        "label": "Story case",
        "platformFit": ["douyin", "xiaohongshu", "bilibili"],
        "contentTone": "relatable",
        "hookStyle": "specific_case_open",
        "rhetoricalPattern": "case_to_mechanism_to_takeaway",
        "emotionCurve": "curiosity_then_recognition",
        "sentenceStyle": "concrete_scene_based",
        "ctaStyle": "comment_prompt",
    },
    "expert_breakdown": {
        "variantId": "expert_breakdown",
        "label": "Expert breakdown",
        "platformFit": ["bilibili", "youtube", "xiaohongshu"],
        "contentTone": "authoritative",
        "hookStyle": "conclusion_first",
        "rhetoricalPattern": "claim_to_parts_to_boundary",
        "emotionCurve": "confident_then_structured",
        "sentenceStyle": "precise_compact",
        "ctaStyle": "follow_for_series",
    },
    "checklist_method": {
        "variantId": "checklist_method",
        "label": "Checklist method",
        "platformFit": ["xiaohongshu", "douyin"],
        "contentTone": "practical",
        "hookStyle": "save_worthy_payoff",
        "rhetoricalPattern": "problem_to_actions_to_payoff",
        "emotionCurve": "useful_from_start",
        "sentenceStyle": "action_led",
        "ctaStyle": "save_prompt",
    },
    "emotional_resonance": {
        "variantId": "emotional_resonance",
        "label": "Emotional resonance",
        "platformFit": ["xiaohongshu", "douyin"],
        "contentTone": "empathetic",
        "hookStyle": "identity_callout",
        "rhetoricalPattern": "recognition_to_relief_to_method",
        "emotionCurve": "recognition_then_relief",
        "sentenceStyle": "soft_but_clear",
        "ctaStyle": "comment_reflection",
    },
}


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def relative_to_workspace(workspace: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(workspace.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def chars_per_second(language: str, pace: str) -> float:
    if language.lower().startswith("zh"):
        return 4.9 if pace in {"fast", "medium_fast"} else 4.1
    return 2.9 if pace in {"fast", "medium_fast"} else 2.3


def build_segment_map(viral: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {safe_text(segment.get("id")): segment for segment in viral.get("segments", []) if segment.get("id")}


def build_match_map(report: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    if not report:
        return {}
    return {safe_text(match.get("sourceSegmentId")): match for match in report.get("matches", []) if match.get("sourceSegmentId")}


def compact_scene(
    scene: dict[str, Any],
    source_segment: dict[str, Any] | None,
    match: dict[str, Any] | None,
    language: str,
    pace: str,
) -> dict[str, Any]:
    duration_sec = float(scene.get("durationSec") or 0)
    cps = chars_per_second(language, pace)
    current_copy = scene.get("copy", {})
    return {
        "sceneId": scene.get("sceneId"),
        "sourceSegmentId": scene.get("sourceSegmentId"),
        "role": scene.get("role"),
        "moduleId": scene.get("moduleId"),
        "durationSec": duration_sec,
        "durationInFrames": scene.get("durationInFrames"),
        "targetVoiceoverLength": {
            "language": language,
            "pace": pace,
            "idealCharsOrWords": round(duration_sec * cps),
            "maxCharsOrWords": round(duration_sec * cps * 1.2),
        },
        "layoutIntent": scene.get("visual", {}).get("layoutIntent"),
        "layoutTags": scene.get("visual", {}).get("layoutTags", []),
        "retentionTags": scene.get("visual", {}).get("retentionTags", []),
        "motionPreset": scene.get("motion", {}).get("motionPreset"),
        "currentDraftCopy": {
            "headline": current_copy.get("headline"),
            "body": current_copy.get("body"),
            "bullets": current_copy.get("bullets", []),
            "voiceoverDraft": current_copy.get("voiceoverDraft"),
            "copyStatus": current_copy.get("copyStatus"),
        },
        "referencePattern": {
            "reusableRule": source_segment.get("reusableRule") if source_segment else None,
            "visualIntent": source_segment.get("visualIntent") if source_segment else None,
            "mustPreserve": source_segment.get("mustPreserve", []) if source_segment else [],
            "canChange": source_segment.get("canChange", []) if source_segment else [],
            "replicationPriority": source_segment.get("replicationPriority") if source_segment else None,
        },
        "moduleMatch": {
            "matchStatus": match.get("matchStatus") if match else None,
            "selectedModuleId": match.get("selectedModuleId") if match else scene.get("moduleId"),
            "requiresReview": match.get("requiresReview") if match else None,
            "topScore": match.get("candidates", [{}])[0].get("score") if match and match.get("candidates") else None,
        },
    }


def build_context(
    job_id: str,
    topic: str,
    variant_ids: list[str],
    video_plan: dict[str, Any],
    viral: dict[str, Any],
    replication_plan: dict[str, Any],
    match_report: dict[str, Any] | None,
) -> dict[str, Any]:
    target = video_plan.get("target", {})
    language = safe_text(target.get("language"), replication_plan.get("target", {}).get("language", "zh-CN"))
    audio_rule = replication_plan.get("audioRule", {})
    pace = safe_text(audio_rule.get("voicePace"), "medium_fast")
    segment_map = build_segment_map(viral)
    match_map = build_match_map(match_report)
    variants = [VARIANT_PRESETS.get(variant_id, {"variantId": variant_id, "label": variant_id}) for variant_id in variant_ids]

    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("copy_rewrite_context"),
        "jobId": job_id,
        "topic": topic,
        "target": {
            "accountId": target.get("accountId"),
            "templateId": target.get("templateId"),
            "styleVariant": target.get("styleVariant"),
            "aspectRatio": target.get("aspectRatio"),
            "durationSec": target.get("durationSec"),
            "language": language,
            "platform": viral.get("meta", {}).get("platformGuess"),
            "contentDomain": viral.get("meta", {}).get("contentDomain"),
        },
        "variants": variants,
        "globalRules": {
            "preserve": replication_plan.get("replicationStrategy", {}).get("replicate", []),
            "doNotReplicate": replication_plan.get("replicationStrategy", {}).get("doNotReplicate", []),
            "retentionGoal": replication_plan.get("qualityTarget", {}).get("retentionGoal"),
            "visualSimilarityLevel": replication_plan.get("qualityTarget", {}).get("visualSimilarityLevel"),
            "originalityLevel": replication_plan.get("qualityTarget", {}).get("originalityLevel"),
            "hookType": viral.get("hook", {}).get("type"),
            "narrativePattern": viral.get("narrativeStructure", {}).get("pattern", []),
            "subtitleRule": replication_plan.get("subtitleRule", {}),
            "audioRule": audio_rule,
            "copyrightBoundary": viral.get("copyrightBoundary", {}),
        },
        "scenes": [
            compact_scene(
                scene,
                segment_map.get(safe_text(scene.get("sourceSegmentId"))),
                match_map.get(safe_text(scene.get("sourceSegmentId"))),
                language,
                pace,
            )
            for scene in video_plan.get("scenes", [])
        ],
        "outputContract": {
            "requiredTopLevel": ["schemaVersion", "artifact", "jobId", "variant", "rewrittenScenes", "voiceoverUnits", "review"],
            "oneOutputPerVariant": True,
            "outputFiles": [
                "video_plan.rewritten.<variant_id>.json",
                "voiceover_units.<variant_id>.json",
                "copy_review_report.<variant_id>.json",
            ],
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prepare copy rewrite context from compiled replication artifacts.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--topic", required=True)
    parser.add_argument("--variants", default="sharp_contrarian,warm_explainer")
    parser.add_argument("--output", help="Output path. Defaults to <job-dir>/copy_rewrite_context.json.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    assert job_dir is not None
    output_path = workspace_path(workspace, args.output) if args.output else job_dir / "copy_rewrite_context.json"
    assert output_path is not None
    variant_ids = [item.strip() for item in args.variants.split(",") if item.strip()]

    video_plan = load_json(job_dir / "video_plan.json")
    viral = load_json(job_dir / "viral_breakdown.json")
    replication_plan = load_json(job_dir / "replication_plan.json")
    match_path = job_dir / "module_match_report.json"
    match_report = load_json(match_path) if match_path.exists() else None

    payload = build_context(job_dir.name, args.topic, variant_ids, video_plan, viral, replication_plan, match_report)
    write_json(output_path, payload)
    print("Copy rewrite context prepared.")
    print(f"Output: {relative_to_workspace(workspace, output_path)}")
    print(f"Scenes: {len(payload['scenes'])}")
    print(f"Variants: {', '.join(item['variantId'] for item in payload['variants'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
