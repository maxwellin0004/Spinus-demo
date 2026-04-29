from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from pathlib import Path
from urllib import request

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from elevenlabs_config import ELEVENLABS_CONFIG


def load_units(units_path: Path) -> list[dict[str, object]]:
    units = json.loads(units_path.read_text(encoding="utf-8"))
    if not isinstance(units, list) or not units:
        raise ValueError("Voiceover units must be a non-empty JSON array.")

    normalized: list[dict[str, object]] = []
    for index, raw_unit in enumerate(units):
        if not isinstance(raw_unit, dict):
            raise ValueError(f"Voiceover unit #{index + 1} is not an object.")
        text = str(raw_unit.get("text") or "").strip()
        if not text:
            raise ValueError(f"Voiceover unit #{index + 1} is missing text.")
        normalized.append(
            {
                "voice_id": str(raw_unit.get("voiceId") or f"v{index + 1:02d}"),
                "visual_section_id": str(raw_unit.get("visualSectionId") or f"section_{index + 1:02d}"),
                "text": text,
                "emphasis_words": [str(word).strip() for word in raw_unit.get("emphasisWords", []) if str(word).strip()],
            }
        )

    return normalized


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
            raise ValueError(f"Cannot locate voiceover unit in combined text: {chunk}")
        end = start + len(chunk)
        ranges.append((start, end))
        cursor = end
    return full_text, ranges


def cue_text(text: str, max_line_chars: int = 18) -> str:
    if len(text) <= max_line_chars:
        return text

    punctuation_candidates = {"，", "。", "？", "！", ",", ".", "?", "!"}
    midpoint = len(text) // 2
    best_index: int | None = None
    best_distance = 10_000
    for index, char in enumerate(text):
        if char not in punctuation_candidates:
            continue
        distance = abs(index - midpoint)
        if distance < best_distance:
            best_index = index + 1
            best_distance = distance

    if best_index is None or best_index <= 0 or best_index >= len(text):
        best_index = midpoint

    return f"{text[:best_index]}\n{text[best_index:]}"


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
        text = str(unit["text"])
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
                "text": cue_text(text),
                "emphasisWords": unit["emphasis_words"],
            }
        )
        search_cursor = end_idx

    for index in range(1, len(cues)):
        previous = cues[index - 1]
        current = cues[index]
        if int(current["startFrame"]) <= int(previous["endFrame"]):
            current["startFrame"] = int(previous["endFrame"]) + 1

    return cues


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate ElevenLabs TTS audio plus aligned subtitle cues for a Codex job."
    )
    parser.add_argument("--units-file", required=True, help="JSON file containing voiceover units.")
    parser.add_argument("--output-audio", required=True, help="Output MP3 path.")
    parser.add_argument("--output-subtitles", required=True, help="Output subtitle JSON path.")
    parser.add_argument("--output-alignment", required=True, help="Output raw alignment JSON path.")
    parser.add_argument("--fps", type=int, default=30)
    args = parser.parse_args()

    units = load_units(Path(args.units_file))
    voiceover_text, ranges = text_with_ranges(units)
    response = synthesize_with_timestamps(voiceover_text)

    output_audio = Path(args.output_audio)
    output_subtitles = Path(args.output_subtitles)
    output_alignment = Path(args.output_alignment)
    output_audio.parent.mkdir(parents=True, exist_ok=True)
    output_subtitles.parent.mkdir(parents=True, exist_ok=True)
    output_alignment.parent.mkdir(parents=True, exist_ok=True)

    output_audio.write_bytes(base64.b64decode(str(response["audio_base64"])))

    alignment = response.get("normalized_alignment") or response["alignment"]
    output_alignment.write_text(json.dumps(alignment, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    cues = build_cues(units, ranges, alignment, args.fps)
    output_subtitles.write_text(json.dumps(cues, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"saved audio={output_audio}")
    print(f"saved subtitles={output_subtitles}")
    print(f"saved alignment={output_alignment}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
