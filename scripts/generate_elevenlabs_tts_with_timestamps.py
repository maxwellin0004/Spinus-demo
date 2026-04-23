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


def parse_units_from_ts(ts_path: Path) -> list[dict[str, object]]:
    source = ts_path.read_text(encoding="utf-8")
    block_match = re.search(
        r"export const newSignalsVolumeVoiceoverUnits = \[(.*?)\];",
        source,
        flags=re.S,
    )
    if not block_match:
        raise ValueError(f"Cannot find newSignalsVolumeVoiceoverUnits in {ts_path}")

    units: list[dict[str, object]] = []
    item_pattern = re.compile(
        r"\{\s*voiceId:\s*\"(?P<voice_id>[^\"]+)\".*?"
        r"visualSectionId:\s*\"(?P<section>[^\"]+)\".*?"
        r"text:\s*\"(?P<text>[^\"]+)\".*?"
        r"emphasisWords:\s*\[(?P<emphasis>[^\]]*)\]",
        flags=re.S,
    )
    for match in item_pattern.finditer(block_match.group(1)):
        emphasis = re.findall(r'"([^"]+)"', match.group("emphasis"))
        units.append(
            {
                "voice_id": match.group("voice_id"),
                "visual_section_id": match.group("section"),
                "text": match.group("text"),
                "emphasis_words": emphasis,
            }
        )

    if not units:
        raise ValueError(f"No voiceover units parsed from {ts_path}")

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
            raise ValueError(f"Cannot locate unit text in full voiceover: {chunk}")
        end = start + len(chunk)
        ranges.append((start, end))
        cursor = end
    return full_text, ranges


def cue_text(text: str, max_line_chars: int = 17) -> str:
    if len(text) <= max_line_chars:
        return text

    punctuation_candidates = ["，", "；", "、", "。"]
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
    for unit, (source_start, source_end) in zip(units, ranges):
        text = str(unit["text"])
        start_idx = aligned_text.find(text, search_cursor)
        if start_idx < 0:
            # Fallback to source index. This works when ElevenLabs returns exact input characters.
            start_idx = source_start
        end_idx = start_idx + len(text)
        if end_idx > len(chars):
            raise ValueError(f"Alignment index out of range for unit {unit['voice_id']}: {text}")

        timed_indices = [
            index for index in range(start_idx, end_idx) if chars[index].strip()
        ]
        if not timed_indices:
            timed_indices = list(range(start_idx, end_idx))

        start_sec = start_times[timed_indices[0]]
        end_sec = end_times[timed_indices[-1]]
        start_frame = max(0, round(start_sec * fps))
        end_frame = max(start_frame + 1, round(end_sec * fps))

        cues.append(
            {
                "voice_id": unit["voice_id"],
                "visual_section_id": unit["visual_section_id"],
                "start_sec": round(start_sec, 3),
                "end_sec": round(end_sec, 3),
                "startFrame": start_frame,
                "endFrame": end_frame,
                "text": cue_text(text),
                "emphasisWords": unit["emphasis_words"],
            }
        )
        search_cursor = end_idx

    # Avoid 1-frame overlaps after rounding.
    for index in range(1, len(cues)):
        previous = cues[index - 1]
        current = cues[index]
        if int(current["startFrame"]) <= int(previous["endFrame"]):
            current["startFrame"] = int(previous["endFrame"]) + 1

    return cues


def write_ts_audio_config(
    output_path: Path,
    units: list[dict[str, object]],
    cues: list[dict[str, object]],
    audio_src: str,
) -> None:
    ts_units = [
        {
            "voiceId": unit["voice_id"],
            "visualSectionId": unit["visual_section_id"],
            "text": unit["text"],
            "emphasisWords": unit["emphasis_words"],
        }
        for unit in units
    ]
    ts_cues = [
        {
            "startFrame": cue["startFrame"],
            "endFrame": cue["endFrame"],
            "text": cue["text"],
            "emphasisWords": cue["emphasisWords"],
        }
        for cue in cues
    ]
    content = f'''import type {{ AudioLayerConfig }} from "../lib/audioTypes";

export const newSignalsVolumeVoiceoverUnits = {json.dumps(ts_units, ensure_ascii=False, indent=2)};

export const newSignalsVolumeVoiceoverText = newSignalsVolumeVoiceoverUnits
  .map((unit) => unit.text)
  .join(" ");

export const newSignalsVolumeAudio: AudioLayerConfig = {{
  voiceover: {{
    src: "{audio_src}",
    startFrame: 0,
    volume: 1,
    enabled: true,
  }},
  bgm: {{
    src: "/audio/new-signals/financial-tension-low.mp3",
    startFrame: 0,
    volume: 0.18,
    loop: true,
    enabled: false,
  }},
  sfx: [
    {{
      src: "/audio/sfx/headline-hit-01.mp3",
      startFrame: 16,
      volume: 0.62,
      enabled: false,
    }},
    {{
      src: "/audio/sfx/chart-tick-01.mp3",
      startFrame: 420,
      volume: 0.32,
      enabled: false,
    }},
  ],
  subtitles: {json.dumps(ts_cues, ensure_ascii=False, indent=2)},
}};
'''
    output_path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate ElevenLabs TTS audio with character timestamps and write Remotion subtitle cues."
    )
    parser.add_argument("--source-ts", required=True, help="TS file containing newSignalsVolumeVoiceoverUnits")
    parser.add_argument("--output-audio", required=True, help="Output MP3 path")
    parser.add_argument("--audio-src", required=True, help="Remotion staticFile audio src")
    parser.add_argument("--output-timeline", required=True, help="Output aligned timeline JSON")
    parser.add_argument("--output-ts", required=True, help="Output TS audio config")
    parser.add_argument("--fps", type=int, default=30)
    args = parser.parse_args()

    source_ts = Path(args.source_ts)
    output_audio = Path(args.output_audio)
    output_timeline = Path(args.output_timeline)
    output_ts = Path(args.output_ts)

    units = parse_units_from_ts(source_ts)
    voiceover_text, ranges = text_with_ranges(units)
    response = synthesize_with_timestamps(voiceover_text)

    audio_base64 = str(response["audio_base64"])
    output_audio.parent.mkdir(parents=True, exist_ok=True)
    output_audio.write_bytes(base64.b64decode(audio_base64))

    alignment = response.get("normalized_alignment") or response["alignment"]
    cues = build_cues(units, ranges, alignment, args.fps)

    timeline = {
        "template_id": "new_signals",
        "example_id": "volume_divergence",
        "orientation": "horizontal",
        "fps": args.fps,
        "audio_file": str(output_audio).replace("\\", "/"),
        "timing_status": "aligned",
        "alignment_method": "elevenlabs_with_timestamps",
        "cues": cues,
    }
    output_timeline.parent.mkdir(parents=True, exist_ok=True)
    output_timeline.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")

    write_ts_audio_config(output_ts, units, cues, args.audio_src)
    print(f"saved audio: {output_audio}")
    print(f"saved timeline: {output_timeline}")
    print(f"saved ts config: {output_ts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
