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


def load_units(path: Path) -> list[dict[str, object]]:
    units = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(units, list) or not units:
        raise ValueError(f"No voiceover units found in {path}")
    return units


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
    chunks = [str(unit["text"]) for unit in units]
    full_text = " ".join(chunks)
    ranges: list[tuple[int, int]] = []
    cursor = 0
    for chunk in chunks:
        start = full_text.find(chunk, cursor)
        if start < 0:
            raise ValueError(f"Cannot locate unit text: {chunk}")
        end = start + len(chunk)
        ranges.append((start, end))
        cursor = end
    return full_text, ranges


def bilingual_text(unit: dict[str, object]) -> str:
    text = str(unit["text"])
    english = str(unit.get("english_subtitle") or "")
    if english:
        return f"{text}\n{english}"
    return text


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
        text = str(unit["text"])
        start_idx = aligned_text.find(text, search_cursor)
        if start_idx < 0:
            start_idx = source_start
        end_idx = min(start_idx + len(text), len(chars), source_end)
        timed_indices = [index for index in range(start_idx, end_idx) if chars[index].strip()]
        if not timed_indices:
            timed_indices = list(range(start_idx, end_idx))
        start_sec = start_times[timed_indices[0]]
        end_sec = end_times[timed_indices[-1]]
        cues.append(
            {
                "voice_id": unit["voice_id"],
                "visual_section_id": unit["visual_section_id"],
                "start_sec": round(start_sec, 3),
                "end_sec": round(end_sec, 3),
                "startFrame": max(0, round(start_sec * fps)),
                "endFrame": max(1, round(end_sec * fps)),
                "text": bilingual_text(unit),
                "emphasisWords": unit.get("emphasis_words", []),
            }
        )
        search_cursor = start_idx + len(text)

    for index in range(1, len(cues)):
        previous = cues[index - 1]
        current = cues[index]
        if int(current["startFrame"]) <= int(previous["endFrame"]):
            current["startFrame"] = int(previous["endFrame"]) + 1
        if int(current["endFrame"]) <= int(current["startFrame"]):
            current["endFrame"] = int(current["startFrame"]) + 1

    return cues


def write_ts_config(output_path: Path, audio_src: str, cues: list[dict[str, object]]) -> None:
    subtitle_cues = [
        {
            "startFrame": cue["startFrame"],
            "endFrame": cue["endFrame"],
            "text": cue["text"],
            "emphasisWords": cue["emphasisWords"],
        }
        for cue in cues
    ]
    content = f'''import type {{ AudioLayerConfig }} from "../lib/audioTypes";

export const cognitiveDocumentaryAlignedAudio: AudioLayerConfig = {{
  voiceover: {{
    src: "{audio_src}",
    startFrame: 0,
    volume: 1,
    enabled: true,
  }},
  bgm: null,
  sfx: [],
  subtitles: {json.dumps(subtitle_cues, ensure_ascii=False, indent=2)},
}};
'''
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate ElevenLabs audio and aligned subtitles for cognitive doc template.")
    parser.add_argument("--units", required=True)
    parser.add_argument("--output-audio", required=True)
    parser.add_argument("--audio-src", required=True)
    parser.add_argument("--output-timeline", required=True)
    parser.add_argument("--output-ts", required=True)
    parser.add_argument("--fps", type=int, default=30)
    args = parser.parse_args()

    units = load_units(Path(args.units))
    voiceover_text, ranges = text_with_ranges(units)
    response = synthesize_with_timestamps(voiceover_text)

    output_audio = Path(args.output_audio)
    output_audio.parent.mkdir(parents=True, exist_ok=True)
    output_audio.write_bytes(base64.b64decode(str(response["audio_base64"])))

    alignment = response.get("normalized_alignment") or response["alignment"]
    cues = build_cues(units, ranges, alignment, args.fps)
    timeline = {
        "template_id": "cognitive-documentary-essay",
        "example_id": "meeting-no-conclusion",
        "orientation": "horizontal",
        "fps": args.fps,
        "audio_file": str(output_audio).replace("\\", "/"),
        "timing_status": "aligned",
        "alignment_method": "elevenlabs_with_timestamps",
        "cues": cues,
    }

    output_timeline = Path(args.output_timeline)
    output_timeline.parent.mkdir(parents=True, exist_ok=True)
    output_timeline.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    write_ts_config(Path(args.output_ts), args.audio_src, cues)

    print(f"saved audio: {output_audio}")
    print(f"saved timeline: {output_timeline}")
    print(f"saved ts config: {args.output_ts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
