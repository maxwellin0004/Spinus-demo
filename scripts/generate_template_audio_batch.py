from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = ROOT / "scripts"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from generate_elevenlabs_tts import synthesize


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate ElevenLabs voiceovers for all template scripts.")
    parser.add_argument(
        "--manifest",
        default="data/audio_scripts/template_audio_manifest.json",
        help="Manifest JSON path",
    )
    parser.add_argument(
        "--only",
        nargs="*",
        help="Optional composition ids to generate",
    )
    args = parser.parse_args()

    manifest_path = ROOT / args.manifest
    items = json.loads(manifest_path.read_text(encoding="utf-8"))
    allowed = set(args.only or [])

    for item in items:
        if allowed and item["id"] not in allowed:
            continue

        text = (ROOT / item["text_file"]).read_text(encoding="utf-8").strip()
        output = ROOT / item["output"]
        synthesize(text, output)
        print(f"generated {item['id']} -> {output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
