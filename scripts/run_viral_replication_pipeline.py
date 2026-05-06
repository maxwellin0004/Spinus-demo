#!/usr/bin/env python
"""Run the viral replication pipeline from an existing analysis.json."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import traceback
from pathlib import Path
from typing import Any

from build_detailed_visual_analysis import build_detailed_visual_analysis
from compile_replication_plan import compile_artifacts, validate_compiled
from convert_analysis_to_viral_breakdown import convert
from generate_replication_plan import generate
from infer_layout_profile import enrich_viral_breakdown, infer_layout_profile
from match_template_modules import match
from replication_artifact_utils import artifact_meta, load_json, now_iso, style_artifact_suffix, write_json
from validate_replication_artifacts import (
    validate_module_match_report,
    validate_module_registry,
    validate_replication_plan,
    validate_viral_breakdown,
)


def sanitize_job_id(value: str) -> str:
    text = re.sub(r"[^A-Za-z0-9_-]+", "_", value.strip())
    text = re.sub(r"_+", "_", text).strip("_")
    if not text:
        text = "viral_job"
    return text[:80]


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def run_step(command: list[str], cwd: Path) -> None:
    completed = subprocess.run(command, cwd=cwd, check=False)
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


class PipelineStatus:
    def __init__(self, job_id: str, job_dir: Path, inputs: dict[str, Any], outputs: dict[str, Any]) -> None:
        self.job_id = job_id
        self.job_dir = job_dir
        self.payload: dict[str, Any] = {
            "schemaVersion": "1.0",
            "artifact": artifact_meta("replication_status"),
            "jobId": job_id,
            "status": "running",
            "startedAt": now_iso(),
            "finishedAt": None,
            "inputs": inputs,
            "outputs": outputs,
            "steps": [],
        }

    @property
    def path(self) -> Path:
        return self.job_dir / "replication_status.json"

    def write(self) -> None:
        write_json(self.path, self.payload)

    def start_step(self, name: str) -> dict[str, Any]:
        step = {
            "name": name,
            "status": "running",
            "startedAt": now_iso(),
            "finishedAt": None,
        }
        self.payload["steps"].append(step)
        self.write()
        return step

    def complete_step(self, step: dict[str, Any], output: str | None = None) -> None:
        step["status"] = "completed"
        step["finishedAt"] = now_iso()
        if output:
            step["output"] = output
        self.write()

    def fail_step(self, step: dict[str, Any], error: Exception) -> None:
        step["status"] = "failed"
        step["finishedAt"] = now_iso()
        step["error"] = str(error)
        step["traceback"] = traceback.format_exc()
        self.payload["status"] = "failed"
        self.payload["finishedAt"] = now_iso()
        self.write()

    def complete(self) -> None:
        self.payload["status"] = "completed"
        self.payload["finishedAt"] = now_iso()
        artifact = self.payload.get("artifact")
        if isinstance(artifact, dict):
            artifact["status"] = "ready"
            artifact["updatedAt"] = now_iso()
        self.write()


def copy_input(src: Path, dst: Path, force: bool) -> None:
    if not src.exists():
        raise FileNotFoundError(f"Input file not found: {src}")
    if dst.exists() and src.resolve() != dst.resolve() and not force:
        raise FileExistsError(f"{dst} already exists. Use --force to overwrite it.")
    if src.resolve() != dst.resolve():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def resolve_job(args: argparse.Namespace, workspace: Path) -> tuple[str, Path, Path, Path | None]:
    if args.job_dir:
        job_dir = workspace_path(workspace, args.job_dir)
        assert job_dir is not None
        job_id = sanitize_job_id(args.job_id or job_dir.name)
    else:
        if args.job_id:
            job_id = sanitize_job_id(args.job_id)
        elif args.analysis:
            job_id = sanitize_job_id(f"viral_{Path(args.analysis).stem}")
        else:
            raise ValueError("Provide either --job-dir or --analysis.")
        job_dir = workspace / "data" / "jobs" / job_id

    analysis_src = workspace_path(workspace, args.analysis) if args.analysis else job_dir / "analysis.json"
    summary_src = workspace_path(workspace, args.summary) if args.summary else None
    return job_id, job_dir, analysis_src, summary_src


def relative_to_workspace(workspace: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(workspace.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def validate_all(workspace: Path, registry: dict[str, Any], viral: dict[str, Any], report: dict[str, Any], plan: dict[str, Any]) -> list[str]:
    modules, issues = validate_module_registry(registry, workspace)
    issues.extend(validate_viral_breakdown(viral))
    issues.extend(validate_module_match_report(report, modules))
    issues.extend(validate_replication_plan(plan, modules))
    return issues


def run_pipeline(args: argparse.Namespace) -> dict[str, Any]:
    workspace = Path(args.workspace).resolve()
    job_id, job_dir, analysis_src, summary_src = resolve_job(args, workspace)
    registry_path = workspace_path(workspace, args.registry)
    assert registry_path is not None

    job_dir.mkdir(parents=True, exist_ok=True)
    analysis_path = job_dir / "analysis.json"
    summary_path = job_dir / "summary.json"
    viral_path = job_dir / "viral_breakdown.json"
    visual_analysis_detailed_path = job_dir / "visual_analysis_detailed.json"
    layout_profile_path = job_dir / "layout_profile.json"
    match_path = job_dir / "module_match_report.json"
    plan_path = job_dir / "replication_plan.json"
    video_plan_path = job_dir / "video_plan.json"
    asset_plan_path = job_dir / "asset_plan.json"
    render_props_path = job_dir / "render-props.json"
    compile_report_path = job_dir / "compile_report.json"
    copy_rewrite_context_path = job_dir / "copy_rewrite_context.json"
    copy_rewrite_path = workspace_path(workspace, args.copy_rewrite) if args.copy_rewrite else None
    rewrite_variant = sanitize_job_id(args.rewrite_variant or "sharp_contrarian")
    topic_copy_strategy_path = job_dir / f"topic_copy_strategy.{rewrite_variant}.json"
    asset_style_suffix = style_artifact_suffix(args.style_variant, args.style_variant != "auto")
    copy_rewrite_sample_path = job_dir / f"copy_rewrite.{rewrite_variant}.json"
    voiceover_package_path = job_dir / f"voiceover_package.{rewrite_variant}.json"
    voiceover_alignment_path = job_dir / f"voiceover_alignment.{rewrite_variant}.json"
    voiceover_subtitles_path = job_dir / f"voiceover_subtitles.{rewrite_variant}.json"
    voiceover_render_props_path = job_dir / f"render-props.voiceover.{rewrite_variant}.json"
    final_render_props_path = job_dir / f"render-props.final.{rewrite_variant}{asset_style_suffix}.json"
    render_package_path = job_dir / f"render_package.{rewrite_variant}{asset_style_suffix}.json"
    final_output_path = workspace_path(workspace, args.render_output) if args.render_output else job_dir / f"output.{rewrite_variant}{asset_style_suffix}.mp4"
    assert final_output_path is not None

    inputs = {
        "analysis": relative_to_workspace(workspace, analysis_path),
        "summary": relative_to_workspace(workspace, summary_path) if (summary_src or summary_path.exists()) else None,
        "registry": relative_to_workspace(workspace, registry_path),
    }
    outputs = {
        "viralBreakdown": relative_to_workspace(workspace, viral_path),
        "visualAnalysisDetailed": relative_to_workspace(workspace, visual_analysis_detailed_path),
        "layoutProfile": relative_to_workspace(workspace, layout_profile_path),
        "moduleMatchReport": relative_to_workspace(workspace, match_path),
        "replicationPlan": relative_to_workspace(workspace, plan_path),
        "status": relative_to_workspace(workspace, job_dir / "replication_status.json"),
    }
    if args.compile:
        outputs.update(
            {
                "videoPlan": relative_to_workspace(workspace, video_plan_path),
                "assetPlan": relative_to_workspace(workspace, asset_plan_path),
                "renderProps": relative_to_workspace(workspace, render_props_path),
                "compileReport": relative_to_workspace(workspace, compile_report_path),
            }
        )
    if args.delivery:
        outputs.update(
            {
                "copyRewriteContext": relative_to_workspace(workspace, copy_rewrite_context_path),
                "topicCopyStrategy": relative_to_workspace(workspace, topic_copy_strategy_path),
                "copyRewrite": relative_to_workspace(workspace, copy_rewrite_path) if copy_rewrite_path else relative_to_workspace(workspace, copy_rewrite_sample_path),
                "assetPromptPlan": relative_to_workspace(workspace, job_dir / f"asset_prompt_plan.{rewrite_variant}{asset_style_suffix}.json"),
                "assetManifest": relative_to_workspace(workspace, job_dir / f"asset_manifest.{rewrite_variant}{asset_style_suffix}.json"),
                "assetRenderProps": relative_to_workspace(workspace, job_dir / f"render-props.assets.{rewrite_variant}{asset_style_suffix}.json"),
                "voiceoverPackage": relative_to_workspace(workspace, voiceover_package_path),
                "voiceoverAlignment": relative_to_workspace(workspace, voiceover_alignment_path),
                "voiceoverSubtitles": relative_to_workspace(workspace, voiceover_subtitles_path),
                "voiceoverRenderProps": relative_to_workspace(workspace, voiceover_render_props_path),
                "finalRenderProps": relative_to_workspace(workspace, final_render_props_path),
                "renderPackage": relative_to_workspace(workspace, render_package_path),
                "finalOutputVideo": relative_to_workspace(workspace, final_output_path),
            }
        )
    status = PipelineStatus(job_id, job_dir, inputs, outputs)
    status.write()

    try:
        step = status.start_step("copy_inputs")
        copy_input(analysis_src, analysis_path, args.force)
        if summary_src:
            copy_input(summary_src, summary_path, args.force)
        status.complete_step(step, relative_to_workspace(workspace, analysis_path))

        step = status.start_step("convert_analysis")
        analysis = load_json(analysis_path)
        summary = load_json(summary_path) if summary_path.exists() else None
        visual_analysis_detailed = build_detailed_visual_analysis(analysis, summary)
        write_json(visual_analysis_detailed_path, visual_analysis_detailed)
        analysis["visual_analysis_detailed"] = visual_analysis_detailed
        viral = convert(analysis, summary, source_video_id=args.source_video_id or job_id)
        layout_profile = infer_layout_profile(analysis, summary)
        write_json(layout_profile_path, layout_profile)
        viral = enrich_viral_breakdown(viral, layout_profile)
        write_json(viral_path, viral)
        status.complete_step(step, relative_to_workspace(workspace, viral_path))

        step = status.start_step("match_modules")
        registry = load_json(registry_path)
        report = match(viral, registry, args.top_k)
        write_json(match_path, report)
        status.complete_step(step, relative_to_workspace(workspace, match_path))

        step = status.start_step("generate_replication_plan")
        plan = generate(
            viral,
            report,
            registry,
            args.account_id,
            args.template_id,
            args.style_variant,
            args.strength,
            relative_to_workspace(workspace, viral_path),
            relative_to_workspace(workspace, match_path),
        )
        write_json(plan_path, plan)
        status.complete_step(step, relative_to_workspace(workspace, plan_path))

        step = status.start_step("validate")
        issues = validate_all(workspace, registry, viral, report, plan)
        if issues:
            raise ValueError("Validation failed:\n" + "\n".join(f"- {issue}" for issue in issues))
        status.complete_step(step)

        if args.compile:
            step = status.start_step("compile_replication_plan")
            compiled = compile_artifacts(plan, registry, viral, workspace, job_id, args.topic)
            compile_issues = validate_compiled(compiled["video_plan"], compiled["asset_plan"], compiled["render_props"])
            if compile_issues:
                compiled["compile_report"]["issues"].extend(compile_issues)
                compiled["compile_report"]["status"] = "partial"
                compiled["compile_report"]["artifact"]["status"] = "partial"
            write_json(video_plan_path, compiled["video_plan"])
            write_json(asset_plan_path, compiled["asset_plan"])
            write_json(render_props_path, compiled["render_props"])
            write_json(compile_report_path, compiled["compile_report"])
            status.complete_step(step, relative_to_workspace(workspace, render_props_path))

        if args.delivery:
            step = status.start_step("prepare_copy_rewrite_context")
            run_step(
                [
                    sys.executable,
                    "scripts/prepare_copy_rewrite_context.py",
                    "--workspace",
                    str(workspace),
                    "--job-dir",
                    str(job_dir),
                    "--topic",
                    args.topic,
                    "--variants",
                    rewrite_variant,
                    "--output",
                    str(copy_rewrite_context_path),
                ],
                workspace,
            )
            status.complete_step(step, relative_to_workspace(workspace, copy_rewrite_context_path))

            if args.strategy_copy_rewrite:
                step = status.start_step("prepare_topic_copy_strategy")
                run_step(
                    [
                        sys.executable,
                        "scripts/prepare_topic_copy_strategy.py",
                        "--workspace",
                        str(workspace),
                        "--job-dir",
                        str(job_dir),
                        "--topic",
                        args.topic,
                        "--variant",
                        rewrite_variant,
                        "--output",
                        str(topic_copy_strategy_path),
                        "--rewrite-output",
                        str(copy_rewrite_sample_path),
                    ],
                    workspace,
                )
                copy_rewrite_path = copy_rewrite_sample_path
                status.complete_step(step, relative_to_workspace(workspace, topic_copy_strategy_path))
            elif args.draft_copy_rewrite:
                step = status.start_step("draft_copy_rewrite_sample")
                run_step(
                    [
                        sys.executable,
                        "scripts/draft_copy_rewrite_sample.py",
                        "--workspace",
                        str(workspace),
                        "--context",
                        str(copy_rewrite_context_path),
                        "--variant",
                        rewrite_variant,
                        "--output",
                        str(copy_rewrite_sample_path),
                    ],
                    workspace,
                )
                copy_rewrite_path = copy_rewrite_sample_path
                status.complete_step(step, relative_to_workspace(workspace, copy_rewrite_sample_path))

            if copy_rewrite_path is None:
                raise ValueError("Delivery mode requires --copy-rewrite or --draft-copy-rewrite.")

            step = status.start_step("apply_copy_rewrite")
            run_step(
                [
                    sys.executable,
                    "scripts/apply_copy_rewrite.py",
                    "--workspace",
                    str(workspace),
                    "--job-dir",
                    str(job_dir),
                    "--rewrite",
                    str(copy_rewrite_path),
                ],
                workspace,
            )
            status.complete_step(step, relative_to_workspace(workspace, job_dir / f"video_plan.rewritten.{rewrite_variant}.json"))

            step = status.start_step("run_asset_stage")
            asset_command = [
                sys.executable,
                "scripts/run_asset_stage.py",
                "--workspace",
                str(workspace),
                "--job-dir",
                str(job_dir),
                "--variant",
                rewrite_variant,
                "--style-variant",
                args.style_variant,
            ]
            if args.provider_order:
                asset_command.extend(["--provider-order", args.provider_order])
            if args.strict_assets:
                asset_command.append("--strict")
            run_step(asset_command, workspace)
            status.complete_step(step, relative_to_workspace(workspace, job_dir / f"render-props.assets.{rewrite_variant}{asset_style_suffix}.json"))

            step = status.start_step("run_voice_stage")
            voice_command = [
                sys.executable,
                "scripts/run_voice_stage.py",
                "--workspace",
                str(workspace),
                "--job-dir",
                str(job_dir),
                "--variant",
                rewrite_variant,
            ]
            if args.voice_dry_run:
                voice_command.append("--dry-run")
            run_step(voice_command, workspace)
            status.complete_step(step, relative_to_workspace(workspace, voiceover_render_props_path))

            step = status.start_step("run_render_stage")
            render_command = [
                sys.executable,
                "scripts/run_render_stage.py",
                "--workspace",
                str(workspace),
                "--job-dir",
                str(job_dir),
                "--variant",
                rewrite_variant,
                "--style-variant",
                args.style_variant,
                "--output",
                str(final_output_path),
            ]
            if args.voice_dry_run:
                render_command.append("--dry-run")
            run_step(render_command, workspace)
            status.complete_step(step, relative_to_workspace(workspace, render_package_path))

        status.complete()
        return status.payload
    except Exception as exc:  # noqa: BLE001
        if status.payload["steps"] and status.payload["steps"][-1].get("status") == "running":
            status.fail_step(status.payload["steps"][-1], exc)
        else:
            status.payload["status"] = "failed"
            status.payload["finishedAt"] = now_iso()
            status.payload["error"] = str(exc)
            status.payload["traceback"] = traceback.format_exc()
            status.write()
        raise


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run viral replication artifact pipeline.")
    parser.add_argument("--workspace", default=".", help="Workspace root.")
    parser.add_argument("--analysis", help="Input analysis.json. Required unless --job-dir contains analysis.json.")
    parser.add_argument("--summary", help="Optional summary.json.")
    parser.add_argument("--job-id", help="Job id. Required when --analysis is used unless inferred from filename.")
    parser.add_argument("--job-dir", help="Existing job directory containing analysis.json.")
    parser.add_argument("--registry", default="data/module_registry.json")
    parser.add_argument("--account-id", required=True)
    parser.add_argument("--template-id", default="auto")
    parser.add_argument("--style-variant", default="auto")
    parser.add_argument("--strength", choices=["low", "medium", "high"], default="medium")
    parser.add_argument("--source-video-id", help="Override viral_breakdown.meta.sourceVideoId.")
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--compile", action="store_true", help="Also generate video_plan, asset_plan, render-props, and compile_report.")
    parser.add_argument("--topic", default="TARGET_TOPIC", help="Target topic used for deterministic draft copy during --compile.")
    parser.add_argument("--force", action="store_true", help="Overwrite copied analysis/summary inputs.")
    parser.add_argument("--delivery", action="store_true", help="After compile, run copy rewrite, assets, and voice stages.")
    parser.add_argument("--rewrite-variant", default="sharp_contrarian", help="Copy variant to use for delivery stages.")
    parser.add_argument("--copy-rewrite", help="Path to an existing copy_rewrite.<variant>.json.")
    parser.add_argument("--strategy-copy-rewrite", action="store_true", help="Generate a strategy-based copy rewrite before assets and voice.")
    parser.add_argument("--draft-copy-rewrite", action="store_true", help="Generate a deterministic sample copy rewrite before assets and voice.")
    parser.add_argument("--provider-order", help="Comma-separated asset provider order override for delivery stage.")
    parser.add_argument("--strict-assets", action="store_true", help="Fail delivery when any asset generation attempt fails.")
    parser.add_argument("--voice-dry-run", action="store_true", help="Run stage 5 without calling the TTS API.")
    parser.add_argument("--render-output", help="Optional final MP4 path for Stage 6.")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.delivery and not args.compile:
        args.compile = True
    payload = run_pipeline(args)
    print("Replication pipeline completed.")
    print("Validation passed.")
    print(f"Job directory: {payload['outputs']['status'].rsplit('/', 1)[0]}")
    print(f"Status file: {payload['outputs']['status']}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Replication pipeline failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
