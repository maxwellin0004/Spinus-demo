#!/usr/bin/env python
"""Apply generated asset manifest to render props."""

from __future__ import annotations

import argparse
import copy
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, resolve_style_variant, safe_text, style_artifact_suffix, write_json


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def relative_to_workspace(workspace: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(workspace.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def assets_by_scene(manifest: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for asset in manifest.get("assets", []):
        grouped.setdefault(safe_text(asset.get("sceneId")), []).append(asset)
    return grouped


def render_asset(asset: dict[str, Any]) -> dict[str, Any]:
    return {
        "assetId": asset.get("assetId"),
        "slot": asset.get("slot"),
        "assetType": asset.get("assetType", "image"),
        "providerUsed": asset.get("providerUsed"),
        "publicPath": asset.get("publicPath"),
        "width": asset.get("width"),
        "height": asset.get("height"),
        "status": asset.get("status"),
    }


def apply_manifest(render_props: dict[str, Any], manifest: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(render_props)
    grouped = assets_by_scene(manifest)
    scenes = result.setdefault("inputProps", {}).setdefault("scenes", [])
    for scene in scenes:
        scene_assets = grouped.get(safe_text(scene.get("sceneId")), [])
        scene["resolvedAssets"] = [render_asset(asset) for asset in scene_assets]
        scene["assetRefs"] = [asset.get("assetId") for asset in scene_assets]
    result["artifact"] = artifact_meta("render_props")
    result.setdefault("inputProps", {})["assetManifest"] = {
        "variantId": manifest.get("variantId"),
        "styleVariant": manifest.get("styleVariant"),
        "assets": [render_asset(asset) for asset in manifest.get("assets", [])],
    }
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Apply asset manifest to render props.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--variant", required=True)
    parser.add_argument("--style-variant", default="auto", help="Override the asset style variant.")
    parser.add_argument("--render-props", help="Defaults to render-props.<variant>.json if present, else render-props.json")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    assert job_dir is not None
    manifest_path = job_dir / f"asset_manifest.{args.variant}.json"
    if args.style_variant and args.style_variant != "auto":
        suffixed = job_dir / f"asset_manifest.{args.variant}{style_artifact_suffix(args.style_variant, True)}.json"
        if suffixed.exists():
            manifest_path = suffixed
    manifest = load_json(manifest_path)
    resolved_style, explicit_style = resolve_style_variant(manifest.get("styleVariant", "dark_warning_orange"), args.style_variant)
    render_path = workspace_path(workspace, args.render_props) if args.render_props else None
    if render_path is None:
        preferred = job_dir / f"render-props.{args.variant}{style_artifact_suffix(resolved_style, explicit_style)}.json"
        render_path = preferred if preferred.exists() else job_dir / "render-props.json"
    render_props = load_json(render_path)
    result = apply_manifest(render_props, manifest)
    output_path = job_dir / f"render-props.assets.{args.variant}{style_artifact_suffix(resolved_style, explicit_style)}.json"
    write_json(output_path, result)
    print("Asset manifest applied.")
    print(f"Output: {relative_to_workspace(workspace, output_path)}")
    print(f"Assets: {len(manifest.get('assets', []))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
