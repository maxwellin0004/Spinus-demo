#!/usr/bin/env python
"""Compile Codex-direct video analysis tables into analysis.json.

This script does not call any model API. It consumes an existing
analysis_tables.json artifact, compiles it into the template-video-2-style
analysis.json contract, and preserves the reproduction-focused 21-table data
under reproduction_visual_analysis.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.analyze_video import build_summary_payload, read_json, write_json
from scripts.run_table_first_analysis import compile_analysis_from_tables, tables_to_markdown


def load_json_required(path: Path) -> Any:
    payload = read_json(path)
    if payload is None:
        raise FileNotFoundError(f"JSON file not found or unreadable: {path}")
    return payload


def infer_source_id(args: argparse.Namespace, source_meta: dict[str, Any], tables_path: Path) -> str:
    if args.source_id:
        return args.source_id
    for key in ("source_id", "sourceVideoId", "source_video_id", "id"):
        value = source_meta.get(key)
        if value:
            return str(value)
    job_dir = tables_path.parent
    if job_dir.name:
        return job_dir.name.replace("job_", "")
    return "source_video"


def compile_tables(args: argparse.Namespace) -> dict[str, Any]:
    tables_path = Path(args.tables)
    tables_doc = load_json_required(tables_path)
    source_meta = load_json_required(Path(args.source_meta)) if args.source_meta else {}
    transcript = load_json_required(Path(args.transcript)) if args.transcript else {}
    source_id = infer_source_id(args, source_meta, tables_path)

    analysis = compile_analysis_from_tables(source_id, source_meta, transcript, tables_doc, args.mode)
    summary = build_summary_payload(analysis)
    if summary.get("summary"):
        analysis["summary"] = summary["summary"]

    output = Path(args.output)
    write_json(output, analysis)

    if args.summary_output:
        write_json(Path(args.summary_output), summary)

    if args.markdown_output:
        Path(args.markdown_output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.markdown_output).write_text(tables_to_markdown(tables_doc), encoding="utf-8")

    return {
        "analysis": analysis,
        "summary": summary,
        "output": str(output),
        "summary_output": args.summary_output,
        "markdown_output": args.markdown_output,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Compile Codex-direct 21-table analysis into analysis.json.")
    parser.add_argument("--tables", required=True, help="Path to analysis_tables.json.")
    parser.add_argument("--output", required=True, help="Output analysis.json path.")
    parser.add_argument("--summary-output", help="Optional output summary.json path.")
    parser.add_argument("--markdown-output", help="Optional regenerated analysis_tables.md path.")
    parser.add_argument("--source-meta", help="Optional source meta.json path.")
    parser.add_argument("--transcript", help="Optional transcript.json path.")
    parser.add_argument("--source-id", help="Optional source id override.")
    parser.add_argument("--mode", default="codex_direct", help="Review mode stored in analysis.review.mode.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    result = compile_tables(args)
    analysis = result["analysis"]
    reproduction = analysis.get("reproduction_visual_analysis") if isinstance(analysis, dict) else {}
    shot_layout = reproduction.get("shot_layout") if isinstance(reproduction, dict) else []
    print(f"Wrote analysis: {result['output']}")
    if result.get("summary_output"):
        print(f"Wrote summary: {result['summary_output']}")
    if result.get("markdown_output"):
        print(f"Wrote tables markdown: {result['markdown_output']}")
    print(f"Shot layouts: {len(shot_layout) if isinstance(shot_layout, list) else 0}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
