#!/usr/bin/env python
"""Apply a model-generated copy_rewrite JSON to compiled video artifacts."""

from __future__ import annotations

import argparse
import copy
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, safe_text, write_json


PLACEHOLDER_MARKERS = {
    "TARGET_TOPIC",
    "Preview topic",
    "draft_needs_human_or_llm_rewrite",
    "Open with a sharp claim",
    "Preserve the reusable role",
    "Rewrite examples for the new topic",
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


def count_spoken_units(text: str, language: str) -> int:
    if language.lower().startswith("zh"):
        return sum(1 for char in text if not char.isspace())
    return len([part for part in text.replace("\n", " ").split(" ") if part.strip()])


def has_placeholder(value: Any) -> bool:
    if isinstance(value, str):
        return any(marker in value for marker in PLACEHOLDER_MARKERS)
    if isinstance(value, list):
        return any(has_placeholder(item) for item in value)
    if isinstance(value, dict):
        return any(has_placeholder(item) for item in value.values())
    return False


def scene_map(video_plan: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {safe_text(scene.get("sceneId")): scene for scene in video_plan.get("scenes", []) if scene.get("sceneId")}


def rewrite_scene_map(copy_rewrite: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {safe_text(scene.get("sceneId")): scene for scene in copy_rewrite.get("rewrittenScenes", []) if scene.get("sceneId")}


def validate_copy_rewrite(video_plan: dict[str, Any], copy_rewrite: dict[str, Any]) -> tuple[list[str], list[dict[str, Any]]]:
    errors: list[str] = []
    scene_reports: list[dict[str, Any]] = []
    artifact = copy_rewrite.get("artifact", {})
    if artifact.get("type") != "copy_rewrite":
        errors.append("artifact.type must be copy_rewrite")
    variant_id = copy_rewrite.get("variant", {}).get("variantId")
    if not variant_id:
        errors.append("variant.variantId is required")

    original_scenes = scene_map(video_plan)
    rewritten = rewrite_scene_map(copy_rewrite)
    missing = sorted(set(original_scenes) - set(rewritten))
    extra = sorted(set(rewritten) - set(original_scenes))
    if missing:
        errors.append(f"Missing rewritten scenes: {', '.join(missing)}")
    if extra:
        errors.append(f"Unknown rewritten scenes: {', '.join(extra)}")

    language = safe_text(video_plan.get("target", {}).get("language"), "zh-CN")
    for scene_id, original in original_scenes.items():
        rewritten_scene = rewritten.get(scene_id)
        if not rewritten_scene:
            continue
        flags: list[str] = []
        if rewritten_scene.get("sourceSegmentId") != original.get("sourceSegmentId"):
            flags.append("sourceSegmentId_changed")
        if rewritten_scene.get("role") != original.get("role"):
            flags.append("role_changed")
        if rewritten_scene.get("moduleId") != original.get("moduleId"):
            flags.append("moduleId_changed")
        if rewritten_scene.get("copyStatus") != "rewritten":
            flags.append("copyStatus_not_rewritten")
        for field in ["headline", "voiceoverDraft", "onScreenText", "subtitleChunks"]:
            if not rewritten_scene.get(field):
                flags.append(f"missing_{field}")
        if has_placeholder(rewritten_scene):
            flags.append("placeholder_marker_found")

        duration_sec = float(original.get("durationSec") or rewritten_scene.get("durationSec") or 0)
        voice_text = safe_text(rewritten_scene.get("voiceoverDraft"))
        unit_count = count_spoken_units(voice_text, language)
        max_units = round(duration_sec * (5.5 if language.lower().startswith("zh") else 3.2) * 1.25)
        if max_units > 0 and unit_count > max_units:
            flags.append("voiceover_may_be_too_long")

        subtitle_chunks = rewritten_scene.get("subtitleChunks", [])
        for index, chunk in enumerate(subtitle_chunks):
            text = safe_text(chunk.get("text") if isinstance(chunk, dict) else chunk)
            chunk_units = count_spoken_units(text, language)
            if language.lower().startswith("zh") and chunk_units > 18:
                flags.append(f"subtitle_chunk_{index + 1}_too_long")
            if not language.lower().startswith("zh") and chunk_units > 9:
                flags.append(f"subtitle_chunk_{index + 1}_too_long")

        scene_reports.append(
            {
                "sceneId": scene_id,
                "role": original.get("role"),
                "durationSec": duration_sec,
                "voiceoverUnits": unit_count,
                "status": "passed" if not flags else "needs_review",
                "flags": flags,
            }
        )
        for flag in flags:
            if flag in {"sourceSegmentId_changed", "role_changed", "moduleId_changed", "copyStatus_not_rewritten"}:
                errors.append(f"{scene_id}: {flag}")

    voice_units = copy_rewrite.get("voiceoverUnits", [])
    voice_scene_ids = {unit.get("sceneId") for unit in voice_units if isinstance(unit, dict)}
    if set(original_scenes) - voice_scene_ids:
        errors.append("voiceoverUnits must cover every scene")
    return errors, scene_reports


def distribute_subtitle_cues(original_scene: dict[str, Any], rewritten_scene: dict[str, Any]) -> list[dict[str, Any]]:
    chunks = rewritten_scene.get("subtitleChunks", [])
    if not chunks:
        return []
    start = float(original_scene.get("startSec") or 0)
    duration = float(original_scene.get("durationSec") or 0)
    slice_duration = duration / max(1, len(chunks))
    cues: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks):
        chunk_text = safe_text(chunk.get("text") if isinstance(chunk, dict) else chunk)
        chunk_start = start + index * slice_duration
        chunk_end = start + (index + 1) * slice_duration
        cues.append(
            {
                "startSec": round(chunk_start, 3),
                "endSec": round(chunk_end, 3),
                "text": chunk_text,
                "emphasisWords": chunk.get("emphasisWords", []) if isinstance(chunk, dict) else [],
                "status": "estimated_until_tts_alignment",
            }
        )
    return cues


def build_rewritten_video_plan(video_plan: dict[str, Any], copy_rewrite: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(video_plan)
    variant_id = safe_text(copy_rewrite.get("variant", {}).get("variantId"), "copy_variant")
    result["artifact"] = artifact_meta("video_plan")
    result["target"] = {**result.get("target", {}), "copyVariant": variant_id}
    result["reviewStatus"] = {
        "status": "copy_rewritten_needs_tts",
        "requiresHumanReview": True,
        "reason": "Copy has been rewritten, but TTS and subtitle alignment are still estimated.",
    }

    rewritten = rewrite_scene_map(copy_rewrite)
    for scene in result.get("scenes", []):
        rewritten_scene = rewritten.get(safe_text(scene.get("sceneId")))
        if not rewritten_scene:
            continue
        scene["copy"] = {
            "headline": rewritten_scene.get("headline"),
            "body": rewritten_scene.get("body"),
            "bullets": rewritten_scene.get("bullets", []),
            "keywords": rewritten_scene.get("keywords", []),
            "onScreenText": rewritten_scene.get("onScreenText", []),
            "voiceoverDraft": rewritten_scene.get("voiceoverDraft"),
            "retentionDevice": rewritten_scene.get("retentionDevice"),
            "transitionLine": rewritten_scene.get("transitionLine"),
            "copyStatus": "rewritten",
            "copyVariant": variant_id,
            "originalityNotes": rewritten_scene.get("originalityNotes", []),
            "reviewFlags": rewritten_scene.get("reviewFlags", []),
        }
        scene["subtitleCues"] = distribute_subtitle_cues(scene, rewritten_scene)
    return result


def build_voiceover_units(copy_rewrite: dict[str, Any], video_plan: dict[str, Any]) -> dict[str, Any]:
    variant_id = safe_text(copy_rewrite.get("variant", {}).get("variantId"), "copy_variant")
    units = copy.deepcopy(copy_rewrite.get("voiceoverUnits", []))
    for index, unit in enumerate(units):
        unit.setdefault("voiceId", f"v{index + 1:03d}")
        unit.setdefault("timingStatus", "estimated")
    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("voiceover_units"),
        "jobId": video_plan.get("jobId"),
        "variantId": variant_id,
        "language": video_plan.get("target", {}).get("language", "zh-CN"),
        "units": units,
        "timingStatus": "estimated_until_tts_alignment",
        "reviewStatus": {
            "status": "needs_tts_alignment",
            "requiresHumanReview": True,
        },
    }


def build_review_report(
    copy_rewrite: dict[str, Any],
    video_plan: dict[str, Any],
    errors: list[str],
    scene_reports: list[dict[str, Any]],
) -> dict[str, Any]:
    variant_id = safe_text(copy_rewrite.get("variant", {}).get("variantId"), "copy_variant")
    global_flags = copy.deepcopy(copy_rewrite.get("review", {}).get("globalFlags", []))
    if errors:
        global_flags.extend(errors)
    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("copy_review_report", "partial" if errors else "ready"),
        "jobId": video_plan.get("jobId"),
        "variantId": variant_id,
        "status": "needs_fix" if errors else "needs_review",
        "checks": [
            {
                "name": "scene_coverage",
                "status": "failed" if any("Missing rewritten scenes" in error for error in errors) else "passed",
            },
            {
                "name": "identity_preservation",
                "status": "failed" if any(error.endswith("_changed") for error in errors) else "passed",
            },
            {
                "name": "voiceover_units",
                "status": "failed" if any("voiceoverUnits" in error for error in errors) else "passed",
            },
            {
                "name": "timing_status",
                "status": "needs_alignment",
                "note": "All subtitle and voiceover timings remain estimated until TTS alignment.",
            },
        ],
        "sceneReports": scene_reports,
        "globalFlags": global_flags,
        "nextSteps": [
            "Human review rewritten copy.",
            "Generate or record TTS voiceover.",
            "Align subtitles from real audio timing.",
            "Regenerate final render props after audio alignment.",
        ],
    }


def update_render_props(render_props: dict[str, Any], rewritten_video_plan: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(render_props)
    input_props = result.setdefault("inputProps", {})
    input_props["target"] = rewritten_video_plan.get("target", {})
    input_props["topic"] = rewritten_video_plan.get("target", {}).get("topic", input_props.get("topic"))
    input_props["scenes"] = rewritten_video_plan.get("scenes", [])
    input_props["reviewStatus"] = rewritten_video_plan.get("reviewStatus", {})
    result["artifact"] = artifact_meta("render_props")
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Apply copy_rewrite JSON to video_plan artifacts.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--rewrite", required=True, help="Input copy_rewrite.<variant>.json")
    parser.add_argument("--variant-id", help="Override variant id for output file naming.")
    parser.add_argument("--strict", action="store_true", help="Fail without writing artifacts if validation errors are found.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    rewrite_path = workspace_path(workspace, args.rewrite)
    assert job_dir is not None
    assert rewrite_path is not None

    video_plan = load_json(job_dir / "video_plan.json")
    copy_rewrite = load_json(rewrite_path)
    if args.variant_id:
        copy_rewrite.setdefault("variant", {})["variantId"] = args.variant_id
    variant_id = safe_text(copy_rewrite.get("variant", {}).get("variantId"), rewrite_path.stem.replace("copy_rewrite.", ""))

    errors, scene_reports = validate_copy_rewrite(video_plan, copy_rewrite)
    if errors and args.strict:
        raise ValueError("Copy rewrite validation failed:\n" + "\n".join(f"- {error}" for error in errors))

    rewritten_video_plan = build_rewritten_video_plan(video_plan, copy_rewrite)
    voiceover_units = build_voiceover_units(copy_rewrite, video_plan)
    review_report = build_review_report(copy_rewrite, video_plan, errors, scene_reports)

    video_plan_path = job_dir / f"video_plan.rewritten.{variant_id}.json"
    voiceover_path = job_dir / f"voiceover_units.{variant_id}.json"
    review_path = job_dir / f"copy_review_report.{variant_id}.json"
    write_json(video_plan_path, rewritten_video_plan)
    write_json(voiceover_path, voiceover_units)
    write_json(review_path, review_report)

    render_path = job_dir / "render-props.json"
    if render_path.exists():
        render_props = update_render_props(load_json(render_path), rewritten_video_plan)
        write_json(job_dir / f"render-props.{variant_id}.json", render_props)

    print("Copy rewrite applied.")
    print(f"Variant: {variant_id}")
    print(f"Validation errors: {len(errors)}")
    print(f"Video plan: {relative_to_workspace(workspace, video_plan_path)}")
    print(f"Voiceover units: {relative_to_workspace(workspace, voiceover_path)}")
    print(f"Review report: {relative_to_workspace(workspace, review_path)}")
    return 0 if not errors else 2


if __name__ == "__main__":
    raise SystemExit(main())
