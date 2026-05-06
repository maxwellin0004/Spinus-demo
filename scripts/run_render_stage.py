#!/usr/bin/env python
"""Run the final Stage 6 render for a replication variant."""

from __future__ import annotations

import argparse
import copy
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, safe_text, style_artifact_suffix, write_json


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


def run_command(command: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, check=False, text=True, capture_output=True)


def find_candidate(job_dir: Path, stem: str, variant: str, style_suffix: str, prefer_style_suffix: bool = False) -> Path | None:
    exact = job_dir / f"{stem}.{variant}.json"
    if exact.exists() and not prefer_style_suffix:
        return exact

    if style_suffix:
        suffixed = job_dir / f"{stem}.{variant}{style_suffix}.json"
        if suffixed.exists():
            return suffixed

    if exact.exists():
        return exact

    matches = sorted(job_dir.glob(f"{stem}.{variant}*.json"), key=lambda path: path.stat().st_mtime, reverse=True)
    return matches[0] if matches else None


def deep_copy(value: Any) -> Any:
    return copy.deepcopy(value)


def merge_render_props(asset_props: dict[str, Any] | None, voice_props: dict[str, Any] | None) -> dict[str, Any]:
    if asset_props is None and voice_props is None:
        raise ValueError("No render props were found")

    base = deep_copy(asset_props if asset_props is not None else voice_props)
    assert isinstance(base, dict)

    if voice_props and isinstance(voice_props, dict):
        if voice_props.get("schemaVersion"):
            base["schemaVersion"] = voice_props.get("schemaVersion")
        if isinstance(voice_props.get("artifact"), dict):
            base["artifact"] = deep_copy(voice_props["artifact"])
        if isinstance(voice_props.get("composition"), dict):
            base["composition"] = deep_copy(voice_props["composition"])

        input_props = base.setdefault("inputProps", {})
        voice_input = voice_props.get("inputProps", {})
        if isinstance(voice_input, dict):
            for key in ["jobId", "topic", "language", "style", "timeline", "reviewStatus"]:
                if key in voice_input and input_props.get(key) is None:
                    input_props[key] = deep_copy(voice_input[key])
            if voice_input.get("audio") is not None:
                input_props["audio"] = deep_copy(voice_input["audio"])
            if voice_input.get("audioRule") is not None and input_props.get("audioRule") is None:
                input_props["audioRule"] = deep_copy(voice_input["audioRule"])
            if voice_input.get("subtitleRule") is not None and input_props.get("subtitleRule") is None:
                input_props["subtitleRule"] = deep_copy(voice_input["subtitleRule"])
            if voice_input.get("assetManifest") is not None and input_props.get("assetManifest") is None:
                input_props["assetManifest"] = deep_copy(voice_input["assetManifest"])
            if voice_input.get("scenes") and not input_props.get("scenes"):
                input_props["scenes"] = deep_copy(voice_input["scenes"])
            if voice_input.get("timeline") and not input_props.get("timeline"):
                input_props["timeline"] = deep_copy(voice_input["timeline"])

    return base


def probe_media(path: Path) -> dict[str, Any]:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return {"available": False}
    command = [
        ffprobe,
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        str(path),
    ]
    completed = run_command(command, path.parent)
    if completed.returncode != 0:
        return {
            "available": True,
            "status": "failed",
            "error": completed.stderr.strip(),
        }
    payload = json.loads(completed.stdout or "{}")
    format_info = payload.get("format", {}) if isinstance(payload, dict) else {}
    streams = payload.get("streams", []) if isinstance(payload, dict) else []
    video_stream = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
    audio_stream = next((stream for stream in streams if stream.get("codec_type") == "audio"), None)
    return {
        "available": True,
        "status": "ok",
        "durationSec": float(format_info.get("duration") or 0),
        "sizeBytes": int(format_info.get("size") or path.stat().st_size),
        "video": {
            "codecName": video_stream.get("codec_name") if isinstance(video_stream, dict) else None,
            "width": int(video_stream.get("width") or 0) if isinstance(video_stream, dict) else None,
            "height": int(video_stream.get("height") or 0) if isinstance(video_stream, dict) else None,
        },
        "audio": {
            "codecName": audio_stream.get("codec_name") if isinstance(audio_stream, dict) else None,
        }
        if isinstance(audio_stream, dict)
        else None,
        "streamCount": len(streams),
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Render the final video from merged Stage 4 and Stage 5 props.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--variant", required=True)
    parser.add_argument("--style-variant", default="auto", help="Override the artifact style suffix.")
    parser.add_argument("--composition-id", default="replicated-video-preview")
    parser.add_argument("--output", help="Output MP4 path. Defaults to data/jobs/<job_id>/output.<variant>.mp4")
    parser.add_argument("--props", help="Optional explicit props input path.")
    parser.add_argument("--dry-run", action="store_true", help="Write merged props and report without calling Remotion.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    assert job_dir is not None

    style_suffix = style_artifact_suffix(args.style_variant, args.style_variant != "auto")
    asset_props_path = workspace_path(workspace, args.props)
    if asset_props_path is None:
        asset_props_path = find_candidate(job_dir, "render-props.assets", args.variant, style_suffix, prefer_style_suffix=True)
    voice_props_path = find_candidate(job_dir, "render-props.voiceover", args.variant, style_suffix, prefer_style_suffix=True)
    base_props_path = job_dir / f"render-props.{args.variant}.json"
    if not base_props_path.exists():
        base_props_path = job_dir / "render-props.json"

    asset_props = load_json(asset_props_path) if asset_props_path and asset_props_path.exists() else None
    voice_props = load_json(voice_props_path) if voice_props_path and voice_props_path.exists() else None
    base_props = load_json(base_props_path) if base_props_path.exists() else None

    final_props = merge_render_props(asset_props if isinstance(asset_props, dict) else base_props, voice_props if isinstance(voice_props, dict) else base_props)
    if isinstance(final_props.get("composition"), dict):
        final_props["composition"]["compositionId"] = safe_text(final_props["composition"].get("compositionId"), args.composition_id)
    else:
        final_props["composition"] = {"compositionId": args.composition_id}
    if isinstance(final_props.get("inputProps"), dict):
        final_props["inputProps"].setdefault("jobId", job_dir.name)
        final_props["inputProps"].setdefault("reviewStatus", {"status": "ready_for_render"})

    final_props_path = job_dir / f"render-props.final.{args.variant}{style_suffix}.json"
    write_json(final_props_path, final_props)

    output_path = workspace_path(workspace, args.output)
    if output_path is None:
        output_path = job_dir / f"output.{args.variant}{style_suffix}.mp4"
    assert output_path is not None
    output_path.parent.mkdir(parents=True, exist_ok=True)

    render_command = [
        "npx.cmd" if sys.platform == "win32" else "npx",
        "remotion",
        "render",
        "src/index.ts",
        safe_text(final_props.get("composition", {}).get("compositionId"), args.composition_id),
        str(output_path),
        f"--props={final_props_path}",
        "--overwrite",
    ]

    render_started = time.time()
    render_status = "dry_run" if args.dry_run else "pending"
    render_stdout = ""
    render_stderr = ""
    if not args.dry_run:
        completed = run_command(render_command, workspace / "video-app")
        render_stdout = completed.stdout
        render_stderr = completed.stderr
        if completed.returncode != 0:
            package = {
                "schemaVersion": "1.0",
                "artifact": artifact_meta("render_package", "failed"),
                "jobId": job_dir.name,
                "variantId": args.variant,
                "styleVariant": args.style_variant,
                "status": "failed",
                "renderPropsPath": relative_to_workspace(workspace, final_props_path),
                "outputVideoPath": relative_to_workspace(workspace, output_path),
                "renderCommand": render_command,
                "renderTimeSec": round(time.time() - render_started, 3),
                "error": completed.stderr.strip() or completed.stdout.strip(),
            }
            write_json(job_dir / f"render_package.{args.variant}{style_suffix}.json", package)
            print(render_stdout)
            print(render_stderr, file=sys.stderr)
            return completed.returncode
        render_status = "rendered"

    file_size = output_path.stat().st_size if output_path.exists() else 0
    media_probe = probe_media(output_path) if output_path.exists() and not args.dry_run else {"available": False}
    expected_duration_sec = 0.0
    if isinstance(final_props.get("inputProps"), dict):
        timeline = final_props["inputProps"].get("timeline", {})
        if isinstance(timeline, dict):
            fps = float(timeline.get("fps") or 30)
            duration_in_frames = float(timeline.get("durationInFrames") or 0)
            expected_duration_sec = round(duration_in_frames / fps, 3) if fps else 0.0

    qa_checks = [
        {
            "name": "output_exists",
            "status": "passed" if output_path.exists() and file_size > 0 else "failed",
        },
        {
            "name": "media_probe",
            "status": "passed" if media_probe.get("status") == "ok" else "skipped" if not media_probe.get("available") else "failed",
        },
    ]
    if media_probe.get("status") == "ok" and expected_duration_sec:
        actual_duration = float(media_probe.get("durationSec") or 0)
        duration_delta = abs(actual_duration - expected_duration_sec)
        qa_checks.append(
            {
                "name": "duration_match",
                "status": "passed" if duration_delta <= 1.0 else "warning",
                "expectedSec": expected_duration_sec,
                "actualSec": round(actual_duration, 3),
                "deltaSec": round(duration_delta, 3),
            }
        )
    input_props = final_props.get("inputProps") if isinstance(final_props.get("inputProps"), dict) else {}
    audio = input_props.get("audio") if isinstance(input_props, dict) else None
    voiceover = audio.get("voiceover") if isinstance(audio, dict) else None
    audio_present = bool(voiceover.get("src")) if isinstance(voiceover, dict) else False
    qa_checks.append(
        {
            "name": "audio_config_present",
            "status": "passed" if audio_present else "warning",
        }
    )

    qa_status = "passed"
    if any(check.get("status") == "failed" for check in qa_checks):
        qa_status = "failed"
    elif any(check.get("status") == "warning" for check in qa_checks):
        qa_status = "warning"

    package = {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("render_package", "ready" if render_status == "rendered" else "draft"),
        "jobId": job_dir.name,
        "variantId": args.variant,
        "styleVariant": args.style_variant,
        "status": render_status,
        "composition": final_props.get("composition", {}),
        "renderPropsPath": relative_to_workspace(workspace, final_props_path),
        "outputVideoPath": relative_to_workspace(workspace, output_path),
        "renderCommand": render_command,
        "renderTimeSec": round(time.time() - render_started, 3),
        "renderSummary": {
            "fileSizeBytes": file_size,
            "expectedDurationSec": expected_duration_sec,
            "mediaProbe": media_probe,
        },
        "qa": {
            "status": qa_status,
            "checks": qa_checks,
        },
        "reviewStatus": {
            "status": "ready_for_publish" if render_status == "rendered" and qa_status == "passed" else "needs_review",
            "requiresHumanReview": qa_status != "passed",
        },
    }
    write_json(job_dir / f"render_package.{args.variant}{style_suffix}.json", package)
    print("Render stage completed.")
    print(f"Output: {output_path}")
    print(f"Render props: {final_props_path}")
    print(f"Package: {job_dir / f'render_package.{args.variant}{style_suffix}.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
