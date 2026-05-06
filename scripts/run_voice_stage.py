#!/usr/bin/env python
"""Run Stage 5 voiceover synthesis and alignment for a viral replication job."""

from __future__ import annotations

import argparse
import base64
import copy
import json
import sys
from pathlib import Path
from urllib import request

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from elevenlabs_config import ELEVENLABS_CONFIG
from replication_artifact_utils import artifact_meta, load_json, safe_text, write_json


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def load_voiceover_payload(path: Path) -> dict[str, object]:
    payload = load_json(path)
    if isinstance(payload, list):
        return {"units": payload}
    if isinstance(payload, dict):
        if isinstance(payload.get("units"), list):
            return payload
        if isinstance(payload.get("voiceoverUnits"), list):
            clone = copy.deepcopy(payload)
            clone["units"] = clone.pop("voiceoverUnits")
            return clone
    raise ValueError(f"Unsupported voiceover unit payload shape: {path}")


def normalize_units(payload: dict[str, object]) -> list[dict[str, object]]:
    units = payload.get("units", [])
    if not isinstance(units, list) or not units:
        raise ValueError("voiceover units must be a non-empty array")
    normalized: list[dict[str, object]] = []
    for index, raw_unit in enumerate(units):
        if not isinstance(raw_unit, dict):
            raise ValueError(f"voiceover unit #{index + 1} is not an object")
        text = safe_text(raw_unit.get("text"))
        if not text:
            raise ValueError(f"voiceover unit #{index + 1} is missing text")
        normalized.append(
            {
                "voiceId": safe_text(raw_unit.get("voiceId"), f"v{index + 1:03d}"),
                "sceneId": safe_text(raw_unit.get("sceneId")),
                "role": safe_text(raw_unit.get("role"), "mechanism"),
                "text": text,
                "targetDurationSec": float(raw_unit.get("targetDurationSec") or 0),
                "intendedPauseAfterSec": float(raw_unit.get("intendedPauseAfterSec") or 0),
                "pace": safe_text(raw_unit.get("pace"), "medium_fast"),
                "emotion": safe_text(raw_unit.get("emotion"), "neutral"),
                "emphasisWords": [safe_text(item) for item in raw_unit.get("emphasisWords", []) if safe_text(item)],
                "timingStatus": safe_text(raw_unit.get("timingStatus"), "estimated"),
                "subtitleZh": safe_text(raw_unit.get("subtitle_zh") or raw_unit.get("subtitleZh")),
                "subtitleEn": safe_text(raw_unit.get("subtitle_en") or raw_unit.get("subtitleEn")),
            }
        )
    return normalized


def build_voiceover_text(units: list[dict[str, object]]) -> str:
    return " ".join(safe_text(unit.get("text")).strip() for unit in units if safe_text(unit.get("text")).strip())


def text_with_ranges(units: list[dict[str, object]]) -> tuple[str, list[tuple[int, int]]]:
    chunks = [safe_text(unit.get("text")).strip() for unit in units]
    full_text = " ".join(chunk for chunk in chunks if chunk)
    ranges: list[tuple[int, int]] = []
    cursor = 0
    for chunk in chunks:
        if not chunk:
            continue
        start = full_text.find(chunk, cursor)
        if start < 0:
            raise ValueError(f"Cannot locate unit text in combined voiceover: {chunk}")
        end = start + len(chunk)
        ranges.append((start, end))
        cursor = end
    return full_text, ranges


def synthesize_with_timestamps(text: str) -> dict[str, object]:
    voice_id = ELEVENLABS_CONFIG.default_voice_id
    url = (
        f"{ELEVENLABS_CONFIG.base_url}/text-to-speech/{voice_id}/with-timestamps"
        f"?output_format={ELEVENLABS_CONFIG.default_output_format}"
    )
    payload = {
        "text": text,
        "model_id": ELEVENLABS_CONFIG.default_model_id,
        "voice_settings": ELEVENLABS_CONFIG.voice_settings(),
    }
    req = request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers=ELEVENLABS_CONFIG.headers(),
        method="POST",
    )
    with request.urlopen(req, timeout=ELEVENLABS_CONFIG.timeout_seconds) as response:
        return json.loads(response.read().decode("utf-8"))


def split_subtitle(text: str, max_line_chars: int = 16) -> str:
    stripped = text.strip()
    if len(stripped) <= max_line_chars:
        return stripped
    punctuation = ["，", "。", "；", "、", ",", "."]
    midpoint = len(stripped) // 2
    best_index: int | None = None
    best_distance = 10_000
    for index, char in enumerate(stripped):
        if char not in punctuation:
            continue
        distance = abs(index - midpoint)
        if distance < best_distance:
            best_index = index + 1
            best_distance = distance
    if best_index is None or best_index <= 0 or best_index >= len(stripped):
        best_index = midpoint
    return f"{stripped[:best_index]}\n{stripped[best_index:]}"


def split_caption_chunks(text: str, max_chars: int = 18) -> list[str]:
    stripped = "".join(str(text or "").replace("\n", "").split())
    if not stripped:
        return []
    if len(stripped) <= max_chars:
        return [stripped]

    punctuation = set("，。；：！？,.;:!?")
    raw_parts: list[str] = []
    cursor = 0
    for index, char in enumerate(stripped):
        if char in punctuation:
            part = stripped[cursor : index + 1].strip()
            if part:
                raw_parts.append(part)
            cursor = index + 1
    if cursor < len(stripped):
        raw_parts.append(stripped[cursor:].strip())
    if not raw_parts:
        raw_parts = [stripped]

    chunks: list[str] = []
    current = ""
    for part in raw_parts:
        if len(part) > max_chars:
            if current:
                chunks.append(current)
                current = ""
            for offset in range(0, len(part), max_chars):
                chunks.append(part[offset : offset + max_chars])
            continue
        if current and len(current) + len(part) > max_chars:
            chunks.append(current)
            current = part
        else:
            current += part
    if current:
        chunks.append(current)
    return [chunk for chunk in chunks if chunk]


def expand_spoken_subtitle_cues(cues: list[dict[str, object]], fps: int, max_chars: int = 18) -> list[dict[str, object]]:
    expanded: list[dict[str, object]] = []
    for cue in cues:
        raw_text = safe_text(cue.get("rawSubtitleZh")) or safe_text(cue.get("rawText")) or safe_text(cue.get("subtitleZh")) or safe_text(cue.get("text"))
        chunks = split_caption_chunks(raw_text, max_chars=max_chars) or [raw_text]
        start_frame = int(cue["startFrame"])
        end_frame = int(cue["endFrame"])
        frame_span = max(1, end_frame - start_frame)
        weights = [max(1, len(chunk)) for chunk in chunks]
        total_weight = max(1, sum(weights))
        cursor = start_frame
        for index, chunk in enumerate(chunks):
            if index == len(chunks) - 1:
                chunk_end = end_frame
            else:
                cumulative = sum(weights[: index + 1])
                chunk_end = start_frame + round(frame_span * cumulative / total_weight)
                remaining = len(chunks) - index - 1
                chunk_end = max(cursor + 1, min(end_frame - remaining, chunk_end))
            expanded.append(
                {
                    **cue,
                    "startFrame": cursor,
                    "endFrame": max(cursor + 1, chunk_end),
                    "startSec": round(cursor / fps, 3),
                    "endSec": round(max(cursor + 1, chunk_end) / fps, 3),
                    "text": split_subtitle(chunk),
                    "subtitleZh": split_subtitle(chunk),
                    "subtitleSource": "tts_alignment_chunk",
                    "chunkIndex": index + 1,
                    "chunkCount": len(chunks),
                }
            )
            cursor = max(cursor + 1, chunk_end)
    return expanded


def build_cues(
    units: list[dict[str, object]],
    ranges: list[tuple[int, int]],
    alignment: dict[str, list[object]],
    fps: int,
) -> list[dict[str, object]]:
    chars = [str(char) for char in alignment["characters"]]
    start_times = [float(value) for value in alignment["character_start_times_seconds"]]
    end_times = [float(value) for value in alignment["character_end_times_seconds"]]
    aligned_text = "".join(chars)

    cues: list[dict[str, object]] = []
    search_cursor = 0
    for unit, (source_start, source_end) in zip(units, ranges):
        text = safe_text(unit.get("text")).strip()
        start_idx = aligned_text.find(text, search_cursor)
        if start_idx < 0:
            start_idx = source_start
        end_idx = min(start_idx + len(text), len(chars), source_end)
        timed_indices = [index for index in range(start_idx, end_idx) if chars[index].strip()]
        if not timed_indices:
            timed_indices = list(range(start_idx, end_idx))
        start_sec = start_times[timed_indices[0]]
        end_sec = end_times[timed_indices[-1]]
        start_frame = max(0, round(start_sec * fps))
        end_frame = max(start_frame + 1, round(end_sec * fps))
        subtitle_text = safe_text(unit.get("subtitleZh")) or split_subtitle(text)
        cues.append(
            {
                "voiceId": unit["voiceId"],
                "sceneId": unit["sceneId"],
                "role": unit["role"],
                "startSec": round(start_sec, 3),
                "endSec": round(end_sec, 3),
                "startFrame": start_frame,
                "endFrame": end_frame,
                "text": split_subtitle(text),
                "subtitleZh": subtitle_text,
                "rawText": text,
                "rawSubtitleZh": subtitle_text.replace("\n", ""),
                "subtitleEn": safe_text(unit.get("subtitleEn")),
                "emphasisWords": unit.get("emphasisWords", []),
            }
        )
        search_cursor = end_idx

    for index in range(1, len(cues)):
        previous = cues[index - 1]
        current = cues[index]
        if int(current["startFrame"]) <= int(previous["endFrame"]):
            current["startFrame"] = int(previous["endFrame"]) + 1
        if int(current["endFrame"]) <= int(current["startFrame"]):
            current["endFrame"] = int(current["startFrame"]) + 1

    return cues


def estimate_length_report(units: list[dict[str, object]], language: str) -> list[dict[str, object]]:
    report: list[dict[str, object]] = []
    is_zh = language.lower().startswith("zh")
    for unit in units:
        text = safe_text(unit.get("text")).strip()
        duration = float(unit.get("targetDurationSec") or 0)
        char_count = sum(1 for char in text if not char.isspace()) if is_zh else len([part for part in text.split(" ") if part.strip()])
        max_units = round(duration * (5.5 if is_zh else 3.2) * 1.25) if duration else 0
        report.append(
            {
                "voiceId": unit["voiceId"],
                "sceneId": unit["sceneId"],
                "targetDurationSec": duration,
                "spokenUnits": char_count,
                "maxRecommendedUnits": max_units,
                "status": "ok" if not max_units or char_count <= max_units else "too_long",
            }
        )
    return report


def write_audio_config_ts(output_path: Path, audio_src: str, cues: list[dict[str, object]], subtitle_font_size: int, subtitle_color: str) -> None:
    subtitle_cues = [
        {
            "startFrame": cue["startFrame"],
            "endFrame": cue["endFrame"],
            "text": cue["subtitleZh"] or cue["text"],
            "emphasisWords": cue["emphasisWords"],
        }
        for cue in cues
    ]
    content = f'''import type {{ AudioLayerConfig }} from "../../lib/audioTypes";
import {{ createVoiceOnlyAudioConfig }} from "../../audioPresets";

export const voiceoverAudio: AudioLayerConfig = {{
  ...createVoiceOnlyAudioConfig({{
    voiceoverSrc: "{audio_src}",
    subtitles: {json.dumps(subtitle_cues, ensure_ascii=False, indent=2)},
    voiceoverEnabled: true,
  }}),
  subtitleStyle: {{
    fontSize: {subtitle_font_size},
    color: "{subtitle_color}",
  }},
}};
'''
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")


def build_audio_config(audio_src: str, cues: list[dict[str, object]], subtitle_font_size: int, subtitle_color: str) -> dict[str, object]:
    subtitles = [
        {
            "startFrame": cue["startFrame"],
            "endFrame": cue["endFrame"],
            "text": cue["subtitleZh"] or cue["text"],
            "emphasisWords": cue["emphasisWords"],
        }
        for cue in cues
    ]
    return {
        "voiceover": {
            "src": audio_src,
            "startFrame": 0,
            "volume": 1,
            "enabled": True,
        },
        "bgm": None,
        "sfx": [],
        "subtitles": subtitles,
        "subtitleStyle": {
            "fontSize": subtitle_font_size,
            "color": subtitle_color,
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate Stage 5 voiceover audio, timestamps, subtitles, and TS config.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--variant", required=True)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--dry-run", action="store_true", help="Write package artifacts without calling the TTS API.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    assert job_dir is not None

    voiceover_path = job_dir / f"voiceover_units.{args.variant}.json"
    package_payload = load_voiceover_payload(voiceover_path)
    units = normalize_units(package_payload)
    full_text, ranges = text_with_ranges(units)

    replication_plan = load_json(job_dir / "replication_plan.json")
    subtitle_rule = replication_plan.get("subtitleRule", {}) if isinstance(replication_plan, dict) else {}
    subtitle_font_size = int(subtitle_rule.get("fontSize") or 36)
    subtitle_color = safe_text(subtitle_rule.get("color"), "#ffffff")
    language = safe_text(package_payload.get("language"), "zh-CN")
    job_id = safe_text(package_payload.get("jobId"), job_dir.name)

    public_audio_path = workspace / "video-app" / "public" / "generated-jobs" / job_id / args.variant / "voiceover.mp3"
    public_audio_path.parent.mkdir(parents=True, exist_ok=True)
    audio_src = f"/generated-jobs/{job_id}/{args.variant}/voiceover.mp3"

    if args.dry_run:
        alignment = {
            "characters": list(full_text),
            "character_start_times_seconds": [0.0 for _ in full_text],
            "character_end_times_seconds": [0.0 for _ in full_text],
        }
        audio_bytes = b""
        cues = [
            {
                "voiceId": unit["voiceId"],
                "sceneId": unit["sceneId"],
                "role": unit["role"],
                "startSec": 0.0,
                "endSec": float(unit.get("targetDurationSec") or 0),
                "startFrame": 0,
                "endFrame": max(1, round(float(unit.get("targetDurationSec") or 0) * args.fps)),
                "text": split_subtitle(safe_text(unit.get("text"))),
                "subtitleZh": split_subtitle(safe_text(unit.get("subtitleZh")) or safe_text(unit.get("text"))),
                "rawText": safe_text(unit.get("text")),
                "rawSubtitleZh": safe_text(unit.get("subtitleZh")) or safe_text(unit.get("text")),
                "subtitleEn": safe_text(unit.get("subtitleEn")),
                "emphasisWords": unit.get("emphasisWords", []),
            }
            for unit in units
        ]
    else:
        response = synthesize_with_timestamps(full_text)
        audio_bytes = base64.b64decode(str(response["audio_base64"]))
        public_audio_path.write_bytes(audio_bytes)
        alignment = response.get("normalized_alignment") or response["alignment"]
        cues = build_cues(units, ranges, alignment, args.fps)
    unit_cues = cues
    cues = expand_spoken_subtitle_cues(unit_cues, args.fps)

    subtitles_path = job_dir / f"voiceover_subtitles.{args.variant}.json"
    alignment_path = job_dir / f"voiceover_alignment.{args.variant}.json"
    audio_config_path = workspace / "video-app" / "src" / "data" / "generated-jobs" / job_id / f"{args.variant}Audio.ts"
    package_path = job_dir / f"voiceover_package.{args.variant}.json"

    output_subtitles = [
        {
            "startFrame": cue["startFrame"],
            "endFrame": cue["endFrame"],
            "text": cue["subtitleZh"] or cue["text"],
            "emphasisWords": cue["emphasisWords"],
        }
        for cue in cues
    ]

    write_json(subtitles_path, output_subtitles)
    write_json(alignment_path, alignment)
    audio_config = build_audio_config(audio_src, cues, subtitle_font_size, subtitle_color)
    render_props_path = job_dir / f"render-props.voiceover.{args.variant}.json"
    if (job_dir / f"render-props.assets.{args.variant}.json").exists():
        base_render_props = load_json(job_dir / f"render-props.assets.{args.variant}.json")
    elif (job_dir / f"render-props.{args.variant}.json").exists():
        base_render_props = load_json(job_dir / f"render-props.{args.variant}.json")
    elif (job_dir / "render-props.json").exists():
        base_render_props = load_json(job_dir / "render-props.json")
    else:
        base_render_props = None
    if isinstance(base_render_props, dict):
        merged_render_props = copy.deepcopy(base_render_props)
        merged_render_props.setdefault("inputProps", {})["audio"] = audio_config
        write_json(render_props_path, merged_render_props)
    write_audio_config_ts(audio_config_path, audio_src, cues, subtitle_font_size, subtitle_color)

    package = {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("voiceover_package", "draft" if args.dry_run else "ready"),
        "jobId": job_id,
        "variantId": args.variant,
        "language": language,
        "timingStatus": "aligned" if not args.dry_run else "estimated",
        "alignmentMethod": "elevenlabs_with_timestamps" if not args.dry_run else "estimated",
        "sourceVoiceoverUnitsPath": f"data/jobs/{job_id}/voiceover_units.{args.variant}.json",
        "outputs": {
            "audioPublicPath": f"generated-jobs/{job_id}/{args.variant}/voiceover.mp3",
            "audioAbsolutePath": public_audio_path.as_posix(),
            "alignmentPath": f"data/jobs/{job_id}/voiceover_alignment.{args.variant}.json",
            "subtitlesPath": f"data/jobs/{job_id}/voiceover_subtitles.{args.variant}.json",
            "audioConfigTsPath": f"video-app/src/data/generated-jobs/{job_id}/{args.variant}Audio.ts",
            "renderPropsPath": f"data/jobs/{job_id}/render-props.voiceover.{args.variant}.json" if isinstance(base_render_props, dict) else None,
        },
        "voiceoverText": full_text,
        "lengthReport": estimate_length_report(units, language),
        "units": units,
        "unitCues": unit_cues,
        "cues": cues,
        "reviewStatus": {
            "status": "ready_for_render" if not args.dry_run else "dry_run",
            "requiresHumanReview": False if not args.dry_run else True,
        },
        "audioConfig": audio_config,
    }
    write_json(package_path, package)

    print("Voice stage completed.")
    print(f"Audio: {public_audio_path}")
    print(f"Subtitles: {subtitles_path}")
    print(f"Alignment: {alignment_path}")
    print(f"TS config: {audio_config_path}")
    print(f"Package: {package_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
