#!/usr/bin/env python
"""Generate assets from asset_prompt_plan using local_api first with fallbacks."""

from __future__ import annotations

import argparse
import base64
import json
import shutil
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from replication_artifact_utils import (
    artifact_meta,
    load_json,
    resolve_style_variant,
    safe_text,
    style_artifact_suffix,
    write_json,
)


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def load_config(workspace: Path) -> dict[str, Any]:
    path = workspace / "config.local.json"
    return load_json(path) if path.exists() else {}


def provider_order(asset: dict[str, Any], forced: list[str] | None = None) -> list[str]:
    if forced:
        return forced
    order = [safe_text(item) for item in asset.get("providerOrder", []) if safe_text(item)]
    return order or ["local_api", "openai_image", "svg_fallback"]


def output_paths(workspace: Path, job_id: str, variant: str, style_suffix: str, asset_id: str, ext: str) -> tuple[Path, str]:
    public_rel = Path("generated-jobs") / job_id / f"{variant}{style_suffix}" / f"{asset_id}.{ext}"
    absolute = workspace / "video-app" / "public" / public_rel
    return absolute, public_rel.as_posix()


def image_url_to_bytes(url: str, timeout: int) -> tuple[bytes, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
        mime_type = response.headers.get("Content-Type", "image/png").split(";")[0]
        return response.read(), mime_type


def decode_base64_image(value: str) -> bytes:
    if "," in value and value.strip().startswith("data:"):
        value = value.split(",", 1)[1]
    return base64.b64decode(value)


def save_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def call_image_api(url: str, key: str | None, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
            response_body = response.read().decode("utf-8")
            return json.loads(response_body)
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise ValueError(f"HTTP {exc.code}: {details}") from exc


def extract_response_image(response: dict[str, Any], timeout: int) -> tuple[bytes, str, dict[str, Any]]:
    if response.get("imageBase64"):
        return decode_base64_image(response["imageBase64"]), response.get("mimeType", "image/png"), response
    if response.get("b64_json"):
        return decode_base64_image(response["b64_json"]), "image/png", response
    if response.get("imageUrl"):
        data, mime = image_url_to_bytes(response["imageUrl"], timeout)
        return data, mime, response
    if response.get("imagePath"):
        path = Path(response["imagePath"])
        return path.read_bytes(), "image/png", response
    data = response.get("data")
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, dict):
            if first.get("b64_json"):
                return decode_base64_image(first["b64_json"]), "image/png", response
            if first.get("url"):
                image_data, mime = image_url_to_bytes(first["url"], timeout)
                return image_data, mime, response
    raise ValueError("Image API response did not include imageBase64, b64_json, imageUrl, imagePath, data[].b64_json, or data[].url")


def extract_image_url_from_chat(response: dict[str, Any]) -> str:
    content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not isinstance(content, str):
        content = json.dumps(content, ensure_ascii=False)
    import re

    markdown = re.search(r"!\[[^\]]*]\((https?://[^)\s]+)\)", content)
    if markdown:
        return markdown.group(1)
    plain = re.search(r"https?://[^\s\"'<>]+", content)
    return plain.group(0) if plain else ""


def generate_local_api(workspace: Path, config: dict[str, Any], job_id: str, variant: str, style_suffix: str, asset: dict[str, Any]) -> dict[str, Any]:
    url = safe_text(config.get("LOCAL_IMAGE_API_URL"))
    if not url:
        raise ValueError("LOCAL_IMAGE_API_URL is not configured")
    key = safe_text(config.get("LOCAL_IMAGE_API_KEY"))
    model = safe_text(config.get("LOCAL_IMAGE_API_MODEL") or config.get("IMAGE_ASSET_MODEL"), "local-image")
    timeout = int(config.get("LOCAL_IMAGE_API_TIMEOUT_SEC") or 120)
    size = asset.get("size", {})
    payload = {
        "prompt": asset.get("prompt"),
        "negativePrompt": asset.get("negativePrompt"),
        "width": int(size.get("width", 1024)),
        "height": int(size.get("height", 1024)),
        "styleVariant": asset.get("styleGuide", {}).get("styleVariant"),
        "model": model,
        "outputFormat": "png",
    }
    response = call_image_api(url, key or None, payload, timeout)
    image_data, mime_type, meta = extract_response_image(response, timeout)
    ext = "png" if "png" in mime_type else "jpg"
    absolute, public_path = output_paths(workspace, job_id, variant, style_suffix, asset["assetId"], ext)
    save_bytes(absolute, image_data)
    return {
        "providerUsed": "local_api",
        "absolutePath": absolute.as_posix(),
        "publicPath": public_path,
        "mimeType": mime_type,
        "providerMeta": {key: meta.get(key) for key in ["model", "seed", "created"] if isinstance(meta, dict) and key in meta},
    }


def generate_openai_image(workspace: Path, config: dict[str, Any], job_id: str, variant: str, style_suffix: str, asset: dict[str, Any]) -> dict[str, Any]:
    url = safe_text(config.get("OPENAI_IMAGES_GENERATIONS_URL"))
    key = safe_text(config.get("OPENAI_IMAGE_API_KEY"))
    if not url or not key:
        raise ValueError("OPENAI_IMAGES_GENERATIONS_URL and OPENAI_IMAGE_API_KEY are required")
    model = safe_text(config.get("IMAGE_ASSET_MODEL"), "gpt-image-1")
    timeout = int(config.get("OPENAI_IMAGE_TIMEOUT_SEC") or 180)
    size = asset.get("size", {})
    size_text = f"{int(size.get('width', 1024))}x{int(size.get('height', 1024))}"
    parsed_url = urlparse(url)
    full_prompt = f"{asset.get('prompt')}\n\nNegative prompt: {asset.get('negativePrompt')}"
    if parsed_url.path.rstrip("/").endswith("/chat/completions"):
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": full_prompt}],
        }
        response = call_image_api(url, key, payload, timeout)
        image_url = extract_image_url_from_chat(response)
        if not image_url:
            raise ValueError("chat/completions image response did not include an image URL")
        image_data, mime_type = image_url_to_bytes(image_url, timeout)
        meta = {"model": model, "imageUrl": image_url}
    else:
        payload = {
            "model": model,
            "prompt": full_prompt,
            "size": size_text,
        }
        response = call_image_api(url, key, payload, timeout)
        image_data, mime_type, meta = extract_response_image(response, timeout)
    ext = "png" if "png" in mime_type else "jpg"
    absolute, public_path = output_paths(workspace, job_id, variant, style_suffix, asset["assetId"], ext)
    save_bytes(absolute, image_data)
    return {
        "providerUsed": "openai_image",
        "absolutePath": absolute.as_posix(),
        "publicPath": public_path,
        "mimeType": mime_type,
        "providerMeta": {"model": model, "responseKeys": sorted(meta.keys()) if isinstance(meta, dict) else []},
    }


def svg_escape(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def generate_svg_fallback(workspace: Path, job_id: str, variant: str, style_suffix: str, asset: dict[str, Any]) -> dict[str, Any]:
    size = asset.get("size", {})
    width = int(size.get("width", 1024))
    height = int(size.get("height", 1024))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#050816"/>
      <stop offset="100%" stop-color="#101624"/>
    </linearGradient>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M 72 0 L 0 0 0 72" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="{width}" height="{height}" fill="url(#bg)"/>
  <rect width="{width}" height="{height}" fill="url(#grid)" opacity="0.45"/>
  <rect x="{width * 0.14:.0f}" y="{height * 0.18:.0f}" width="{width * 0.72:.0f}" height="{height * 0.54:.0f}" fill="rgba(255,255,255,0.04)" stroke="rgba(255,122,69,0.65)" stroke-width="3"/>
  <circle cx="{width * 0.5:.0f}" cy="{height * 0.42:.0f}" r="{min(width, height) * 0.12:.0f}" fill="none" stroke="#ff7a45" stroke-width="8"/>
  <circle cx="{width * 0.5:.0f}" cy="{height * 0.42:.0f}" r="{min(width, height) * 0.055:.0f}" fill="rgba(255,122,69,0.22)" stroke="rgba(247,249,255,0.72)" stroke-width="4"/>
  <path d="M {width * 0.35:.0f} {height * 0.55:.0f} L {width * 0.5:.0f} {height * 0.36:.0f} L {width * 0.65:.0f} {height * 0.55:.0f}" fill="none" stroke="rgba(247,249,255,0.82)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="{width * 0.28:.0f}" y="{height * 0.72:.0f}" width="{width * 0.44:.0f}" height="{height * 0.035:.0f}" rx="{height * 0.017:.0f}" fill="rgba(255,122,69,0.34)"/>
  <rect x="{width * 0.34:.0f}" y="{height * 0.78:.0f}" width="{width * 0.32:.0f}" height="{height * 0.02:.0f}" rx="{height * 0.01:.0f}" fill="rgba(247,249,255,0.20)"/>
</svg>'''
    absolute, public_path = output_paths(workspace, job_id, variant, style_suffix, asset["assetId"], "svg")
    absolute.parent.mkdir(parents=True, exist_ok=True)
    absolute.write_text(svg, encoding="utf-8")
    return {
        "providerUsed": "svg_fallback",
        "absolutePath": absolute.as_posix(),
        "publicPath": public_path,
        "mimeType": "image/svg+xml",
        "providerMeta": {},
    }


def generate_asset(workspace: Path, config: dict[str, Any], job_id: str, variant: str, style_suffix: str, asset: dict[str, Any], forced_order: list[str] | None) -> tuple[dict[str, Any], list[dict[str, str]]]:
    attempts: list[dict[str, str]] = []
    for provider in provider_order(asset, forced_order):
        try:
            if provider == "local_api":
                result = generate_local_api(workspace, config, job_id, variant, style_suffix, asset)
            elif provider == "openai_image":
                result = generate_openai_image(workspace, config, job_id, variant, style_suffix, asset)
            elif provider == "svg_fallback":
                result = generate_svg_fallback(workspace, job_id, variant, style_suffix, asset)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            attempts.append({"provider": provider, "status": "succeeded"})
            return result, attempts
        except Exception as exc:  # noqa: BLE001
            attempts.append({"provider": provider, "status": "failed", "error": str(exc)})
            continue
    raise ValueError(f"All providers failed for {asset.get('assetId')}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate image assets from asset_prompt_plan.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--variant", required=True)
    parser.add_argument("--style-variant", default="auto", help="Override the plan style variant.")
    parser.add_argument("--provider-order", help="Comma-separated override, e.g. local_api,openai_image,svg_fallback")
    parser.add_argument("--strict", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    assert job_dir is not None
    plan_path = job_dir / f"asset_prompt_plan.{args.variant}.json"
    if args.style_variant and args.style_variant != "auto":
        suffixed = job_dir / f"asset_prompt_plan.{args.variant}{style_artifact_suffix(args.style_variant, True)}.json"
        if suffixed.exists():
            plan_path = suffixed
    plan = load_json(plan_path)
    config = load_config(workspace)
    forced_order = [item.strip() for item in args.provider_order.split(",") if item.strip()] if args.provider_order else None
    resolved_style, explicit_style = resolve_style_variant(plan.get("styleVariant", "dark_warning_orange"), args.style_variant)
    style_suffix = style_artifact_suffix(resolved_style, explicit_style)
    manifest_assets: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    for asset in plan.get("assets", []):
        attempts: list[dict[str, str]] = []
        try:
            result, attempts = generate_asset(workspace, config, plan.get("jobId", job_dir.name), args.variant, style_suffix, asset, forced_order)
            manifest_assets.append(
                {
                    "assetId": asset.get("assetId"),
                    "sceneId": asset.get("sceneId"),
                    "slot": asset.get("slot"),
                    "assetType": asset.get("assetType", "image"),
                    "status": "ready",
                    "providerUsed": result["providerUsed"],
                    "attemptedProviders": attempts,
                    "publicPath": result["publicPath"],
                    "absolutePath": result["absolutePath"],
                    "mimeType": result["mimeType"],
                    "width": asset.get("size", {}).get("width"),
                    "height": asset.get("size", {}).get("height"),
                    "prompt": asset.get("prompt"),
                    "negativePrompt": asset.get("negativePrompt"),
                    "providerMeta": result.get("providerMeta", {}),
                }
            )
        except Exception as exc:  # noqa: BLE001
            failures.append({"assetId": asset.get("assetId"), "error": str(exc), "attemptedProviders": attempts})
            if args.strict:
                raise
    ready = len(manifest_assets)
    total = len(plan.get("assets", []))
    fallback = sum(1 for asset in manifest_assets if asset.get("providerUsed") == "svg_fallback")
    manifest = {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("asset_manifest", "ready" if not failures else "partial"),
        "jobId": plan.get("jobId", job_dir.name),
        "variantId": args.variant,
        "styleVariant": resolved_style,
        "styleVariantSource": "explicit" if explicit_style else "plan",
        "assets": manifest_assets,
    }
    report = {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("asset_generation_report", "ready" if not failures else "partial"),
        "jobId": plan.get("jobId", job_dir.name),
        "variantId": args.variant,
        "styleVariant": resolved_style,
        "styleVariantSource": "explicit" if explicit_style else "plan",
        "summary": {"total": total, "ready": ready, "fallback": fallback, "failed": len(failures)},
        "failures": failures,
    }
    write_json(job_dir / f"asset_manifest.{args.variant}{style_suffix}.json", manifest)
    write_json(job_dir / f"asset_generation_report.{args.variant}{style_suffix}.json", report)
    print("Asset generation completed.")
    print(f"Total: {total}")
    print(f"Ready: {ready}")
    print(f"Fallback: {fallback}")
    print(f"Failed: {len(failures)}")
    return 0 if not failures else 2


if __name__ == "__main__":
    raise SystemExit(main())
