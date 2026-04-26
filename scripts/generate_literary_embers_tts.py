from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path
from urllib import request

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from elevenlabs_config import ELEVENLABS_CONFIG


def load_units(units_path: Path) -> tuple[dict[str, object], list[dict[str, object]]]:
    payload = json.loads(units_path.read_text(encoding="utf-8-sig"))
    units = payload.get("voiceover_units", [])
    if not isinstance(units, list) or not units:
        raise ValueError(f"No voiceover_units found in {units_path}")
    return payload, units


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


def text_with_ranges(units: list[dict[str, object]]) -> tuple[str, list[tuple[int, int]]]:
    chunks = [str(unit["text"]).strip() for unit in units]
    full_text = " ".join(chunks)
    ranges: list[tuple[int, int]] = []
    cursor = 0
    for chunk in chunks:
        start = full_text.find(chunk, cursor)
        if start < 0:
            raise ValueError(f"Cannot locate unit text in full voiceover: {chunk}")
        end = start + len(chunk)
        ranges.append((start, end))
        cursor = end
    return full_text, ranges


def split_subtitle(text: str, max_line_chars: int = 16) -> str:
    stripped = text.strip()
    if len(stripped) <= max_line_chars:
        return stripped
    punctuation = ["，", "。", "：", "；", "、"]
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
    for unit, (source_start, _source_end) in zip(units, ranges):
        text = str(unit["text"]).strip()
        start_idx = aligned_text.find(text, search_cursor)
        if start_idx < 0:
            start_idx = source_start
        end_idx = start_idx + len(text)
        if end_idx > len(chars):
            raise ValueError(f"Alignment index out of range for unit {unit['voice_id']}: {text}")

        timed_indices = [index for index in range(start_idx, end_idx) if chars[index].strip()]
        if not timed_indices:
            timed_indices = list(range(start_idx, end_idx))

        start_sec = start_times[timed_indices[0]]
        end_sec = end_times[timed_indices[-1]]
        start_frame = max(0, round(start_sec * fps))
        end_frame = max(start_frame + 1, round(end_sec * fps))

        cues.append(
            {
                "voiceId": unit["voice_id"],
                "visualSectionId": unit["visual_section_id"],
                "start_sec": round(start_sec, 3),
                "end_sec": round(end_sec, 3),
                "startFrame": start_frame,
                "endFrame": end_frame,
                "textZh": split_subtitle(str(unit.get("subtitle_zh") or text)),
                "textEn": str(unit.get("subtitle_en") or ""),
                "text": split_subtitle(text),
                "emphasisWords": unit.get("emphasis_words", []),
            }
        )
        search_cursor = end_idx

    for index in range(1, len(cues)):
        previous = cues[index - 1]
        current = cues[index]
        if int(current["startFrame"]) <= int(previous["endFrame"]):
            current["startFrame"] = int(previous["endFrame"]) + 1

    return cues


def write_ts_audio_config(output_path: Path, cues: list[dict[str, object]], audio_src: str) -> None:
    ts_cues = [
      {
        "voiceId": cue["voiceId"],
        "startFrame": cue["startFrame"],
        "endFrame": cue["endFrame"],
        "textZh": cue["textZh"],
        "textEn": cue["textEn"],
        "emphasisWords": cue["emphasisWords"],
      }
      for cue in cues
    ]
    subtitle_cues = [
      {
        "startFrame": cue["startFrame"],
        "endFrame": cue["endFrame"],
        "text": cue["textZh"],
        "emphasisWords": cue["emphasisWords"],
      }
      for cue in cues
    ]
    content = f"""import {{ createVoiceOnlyAudioConfig }} from "./audioPresets";
import type {{ BilingualQuoteCue }} from "../components/video/BilingualQuoteTrack";

export const literaryEmbersSubtitleCues: BilingualQuoteCue[] = {json.dumps(ts_cues, ensure_ascii=True, indent=2)};

export const literaryEmbersAudio = createVoiceOnlyAudioConfig({{
  voiceoverSrc: "{audio_src}",
  subtitles: {json.dumps(subtitle_cues, ensure_ascii=True, indent=2)},
  voiceoverEnabled: true,
}});
"""
    output_path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate ElevenLabs TTS audio and subtitle timeline for literary embers validation.")
    parser.add_argument("--units-json", required=True)
    parser.add_argument("--output-audio", required=True)
    parser.add_argument("--audio-src", required=True)
    parser.add_argument("--output-timeline", required=True)
    parser.add_argument("--output-ts", required=True)
    parser.add_argument("--fps", type=int, default=30)
    args = parser.parse_args()

    units_path = Path(args.units_json)
    output_audio = Path(args.output_audio)
    output_timeline = Path(args.output_timeline)
    output_ts = Path(args.output_ts)

    payload, units = load_units(units_path)
    voiceover_text, ranges = text_with_ranges(units)
    response = synthesize_with_timestamps(voiceover_text)

    output_audio.parent.mkdir(parents=True, exist_ok=True)
    output_audio.write_bytes(base64.b64decode(str(response["audio_base64"])))

    alignment = response.get("normalized_alignment") or response["alignment"]
    cues = build_cues(units, ranges, alignment, args.fps)
    timeline = {
      "template_id": payload.get("template_id", "literary_embers_quote_montage"),
      "video_id": payload.get("video_id", "moon_sixpence_validation_v1"),
      "orientation": payload.get("orientation", "vertical"),
      "fps": args.fps,
      "audio_file": str(output_audio).replace("\\", "/"),
      "audio_duration_sec": round(max(cue["end_sec"] for cue in cues), 3),
      "timing_status": "aligned",
      "alignment_method": "elevenlabs_with_timestamps",
      "cues": cues,
    }
    output_timeline.parent.mkdir(parents=True, exist_ok=True)
    output_timeline.write_text(json.dumps(timeline, ensure_ascii=True, indent=2), encoding="utf-8")
    output_ts.parent.mkdir(parents=True, exist_ok=True)
    write_ts_audio_config(output_ts, cues, args.audio_src)
    print(f"saved audio: {output_audio}")
    print(f"saved timeline: {output_timeline}")
    print(f"saved ts config: {output_ts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
