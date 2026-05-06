#!/usr/bin/env python
"""Run stage 4 asset prompt generation, image generation, and manifest application."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def run_step(command: list[str], cwd: Path) -> None:
    completed = subprocess.run(command, cwd=cwd, check=False)
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run stage 4 asset generation for a replication job.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--variant", required=True)
    parser.add_argument("--style-variant", default="auto", help="Override the target style variant.")
    parser.add_argument("--provider-order", help="Comma-separated provider order override.")
    parser.add_argument("--strict", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    assert job_dir is not None

    base = [sys.executable]
    prepare = base + [
        "scripts/prepare_asset_prompt_plan.py",
        "--workspace",
        str(workspace),
        "--job-dir",
        str(job_dir),
        "--variant",
        args.variant,
        "--style-variant",
        args.style_variant,
    ]
    generate = base + [
        "scripts/generate_assets.py",
        "--workspace",
        str(workspace),
        "--job-dir",
        str(job_dir),
        "--variant",
        args.variant,
        "--style-variant",
        args.style_variant,
    ]
    if args.provider_order:
        generate.extend(["--provider-order", args.provider_order])
    if args.strict:
        generate.append("--strict")
    apply = base + [
        "scripts/apply_asset_manifest.py",
        "--workspace",
        str(workspace),
        "--job-dir",
        str(job_dir),
        "--variant",
        args.variant,
        "--style-variant",
        args.style_variant,
    ]

    run_step(prepare, workspace)
    run_step(generate, workspace)
    run_step(apply, workspace)
    print("Stage 4 asset pipeline completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
