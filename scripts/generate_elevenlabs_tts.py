from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from urllib import request

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from elevenlabs_config import ELEVENLABS_CONFIG


def synthesize(text: str, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    voice_id = ELEVENLABS_CONFIG.default_voice_id
    url = f"{ELEVENLABS_CONFIG.base_url}/text-to-speech/{voice_id}"

    payload = {
        "text": text,
        "model_id": ELEVENLABS_CONFIG.default_model_id,
        "output_format": ELEVENLABS_CONFIG.default_output_format,
        "voice_settings": ELEVENLABS_CONFIG.voice_settings(),
    }
    req = request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=ELEVENLABS_CONFIG.headers(),
        method="POST",
    )

    with request.urlopen(req, timeout=ELEVENLABS_CONFIG.timeout_seconds) as response:
        audio = response.read()

    output_path.write_bytes(audio)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate ElevenLabs TTS audio file.")
    parser.add_argument("--text", help="Voiceover text")
    parser.add_argument("--text-file", help="UTF-8 text file containing the voiceover text")
    parser.add_argument("--output", required=True, help="Output mp3 path")
    args = parser.parse_args()

    if not args.text and not args.text_file:
        raise SystemExit("Either --text or --text-file is required.")

    text = args.text
    if args.text_file:
        text = Path(args.text_file).read_text(encoding="utf-8").strip()

    synthesize(text, Path(args.output))
    print(f"saved {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
