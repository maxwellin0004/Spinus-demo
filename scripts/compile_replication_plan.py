#!/usr/bin/env python
"""Compile replication_plan.json into executable production artifacts."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, safe_text, slug_text, write_json


COMPOSITION_DEFAULTS: dict[str, dict[str, Any]] = {
    "ai_concept_analyse": {
        "compositionId": "replicated-video-preview",
        "fps": 30,
        "width": 1920,
        "height": 1080,
        "bindingStatus": "adapter_ready",
    },
    "new_signals": {
        "compositionId": "replicated-video-preview",
        "fps": 30,
        "width": 1080,
        "height": 1920,
        "bindingStatus": "adapter_ready",
    },
    "minimal_psych_explainer": {
        "compositionId": "replicated-video-preview",
        "fps": 30,
        "width": 1920,
        "height": 1080,
        "bindingStatus": "adapter_ready",
    },
    "cinematic_quote_full_bleed": {
        "compositionId": "cinematic-quote-replication",
        "fps": 30,
        "width": 1080,
        "height": 1440,
        "bindingStatus": "native_template",
    },
}

STYLE_TOKEN_FALLBACKS: dict[str, dict[str, str]] = {
    "dark_warning_orange": {
        "backgroundBase": "#050816",
        "backgroundSoft": "#0b1022",
        "accent": "#ff7a45",
        "textPrimary": "#f7f9ff",
        "textMuted": "rgba(247, 249, 255, 0.72)",
        "frame": "rgba(255, 255, 255, 0.16)",
    },
    "dark_hud_orange": {
        "backgroundBase": "#050816",
        "backgroundSoft": "#0b1022",
        "accent": "#ff7a45",
        "textPrimary": "#f7f9ff",
        "textMuted": "rgba(247, 249, 255, 0.72)",
        "frame": "rgba(255, 255, 255, 0.16)",
    },
    "warm_paper": {
        "backgroundBase": "#f7f1e6",
        "backgroundSoft": "#fffaf0",
        "accent": "#b47a2b",
        "textPrimary": "#241d16",
        "textMuted": "rgba(36, 29, 22, 0.68)",
        "frame": "rgba(36, 29, 22, 0.14)",
    },
    "clean_white": {
        "backgroundBase": "#f8fafc",
        "backgroundSoft": "#ffffff",
        "accent": "#2563eb",
        "textPrimary": "#111827",
        "textMuted": "rgba(17, 24, 39, 0.66)",
        "frame": "rgba(17, 24, 39, 0.12)",
    },
    "cinematic_soft_green_amber": {
        "backgroundBase": "#10150f",
        "backgroundSoft": "#26321f",
        "accent": "#b23a32",
        "textPrimary": "#ffffff",
        "textMuted": "rgba(255, 255, 255, 0.82)",
        "frame": "rgba(0, 0, 0, 0.38)",
    },
}

ROLE_COPY: dict[str, dict[str, str]] = {
    "hook": {
        "headline": "{topic}: the first assumption is usually wrong",
        "body": "Open with a sharp claim, then immediately create a reason to keep watching.",
    },
    "problem": {
        "headline": "The real problem behind {topic}",
        "body": "Name the friction clearly before explaining the mechanism.",
    },
    "setup": {
        "headline": "Before judging {topic}, look at the context",
        "body": "Set the frame of reference with one concrete observation.",
    },
    "mechanism": {
        "headline": "The mechanism of {topic}",
        "body": "Break the idea into a cause, a trigger, and a visible result.",
    },
    "case": {
        "headline": "A concrete case makes it visible",
        "body": "Use a new example that proves the pattern without copying the reference.",
    },
    "evidence": {
        "headline": "The evidence layer",
        "body": "Show supporting proof through documents, numbers, or structured panels.",
    },
    "contrast": {
        "headline": "What people think vs what actually matters",
        "body": "Use contrast to make the core distinction easy to remember.",
    },
    "method": {
        "headline": "Turn {topic} into three actions",
        "body": "Convert the explanation into a practical checklist.",
    },
    "checklist": {
        "headline": "The checklist",
        "body": "Give the viewer a repeatable way to apply the idea.",
    },
    "close": {
        "headline": "Remember this about {topic}",
        "body": "Close with a compact takeaway and no copied wording.",
    },
    "cta": {
        "headline": "Use this as your next test",
        "body": "End with a light action prompt that matches the account style.",
    },
}

ROLE_COPY_ZH: dict[str, dict[str, str]] = {
    "hook": {
        "headline": "{topic}，第一个误区就错了",
        "body": "先用反常识判断抓住注意力，再马上抛出继续看的理由。",
    },
    "problem": {
        "headline": "{topic}真正的问题不在表面",
        "body": "先把卡住用户的摩擦说清楚，再进入机制解释。",
    },
    "setup": {
        "headline": "先看{topic}背后的上下文",
        "body": "用一个具体观察建立判断框架。",
    },
    "mechanism": {
        "headline": "{topic}背后的机制",
        "body": "拆成原因、触发点和看得见的结果。",
    },
    "case": {
        "headline": "换一个例子就能看懂",
        "body": "使用全新的案例证明结构，不复用参考视频表达。",
    },
    "evidence": {
        "headline": "证据层在这里",
        "body": "用文档、数字或结构化面板承接论证。",
    },
    "contrast": {
        "headline": "你以为的重点，和真正的重点",
        "body": "用对比让核心边界更容易被记住。",
    },
    "method": {
        "headline": "把{topic}变成三个动作",
        "body": "把解释转成可以直接执行的清单。",
    },
    "checklist": {
        "headline": "照这个清单做",
        "body": "给观众一个可以重复使用的方法。",
    },
    "close": {
        "headline": "记住{topic}这件事",
        "body": "用一句新的总结收束，不复用参考视频原话。",
    },
    "cta": {
        "headline": "把它用在下一次判断里",
        "body": "用轻量行动提示结束，保持账号风格。",
    },
}


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


def normalize_style_tokens(tokens: dict[str, Any]) -> dict[str, Any]:
    mapping = {
        "background_base": "backgroundBase",
        "background_soft": "backgroundSoft",
        "text_primary": "textPrimary",
        "text_muted": "textMuted",
    }
    result: dict[str, Any] = {}
    for key, value in tokens.items():
        result[mapping.get(key, key)] = value
    return result


def load_style_tokens(workspace: Path, template_id: str, style_variant: str) -> dict[str, Any]:
    style_path = workspace / "data" / "templates" / template_id / "style_variants.json"
    if style_path.exists():
        payload = load_json(style_path)
        for variant in payload.get("variants", []):
            if variant.get("variant_id") == style_variant:
                return normalize_style_tokens(variant.get("tokens", {}))
        default_variant = payload.get("default_variant")
        for variant in payload.get("variants", []):
            if variant.get("variant_id") == default_variant:
                return normalize_style_tokens(variant.get("tokens", {}))
    return STYLE_TOKEN_FALLBACKS.get(style_variant, STYLE_TOKEN_FALLBACKS["dark_warning_orange"])


def modules_by_id(registry: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {safe_text(module.get("moduleId")): module for module in registry.get("modules", []) if module.get("moduleId")}


def segments_by_id(viral_breakdown: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    if not viral_breakdown:
        return {}
    return {safe_text(segment.get("id")): segment for segment in viral_breakdown.get("segments", []) if segment.get("id")}


def choose_composition(template_id: str, aspect_ratio: str) -> dict[str, Any]:
    composition = dict(COMPOSITION_DEFAULTS.get(template_id, COMPOSITION_DEFAULTS["ai_concept_analyse"]))
    if aspect_ratio == "3:4":
        composition["width"] = 1080
        composition["height"] = 1440
        return composition
    if aspect_ratio == "9:16":
        composition["width"] = 1080
        composition["height"] = 1920
    elif aspect_ratio == "1:1":
        composition["width"] = 1080
        composition["height"] = 1080
    else:
        composition["width"] = int(composition.get("width", 1920))
        composition["height"] = int(composition.get("height", 1080))
    return composition


def split_words(text: str, limit: int = 4) -> list[str]:
    tokens = [item for item in re.split(r"[\s,.;:!?，。；：！？]+", text) if item]
    if not tokens:
        return []
    return tokens[:limit]


def repair_mojibake(text: str) -> str:
    if not any(char in text for char in ("鎴", "鎷", "欢", "锛", "涓", "瀛")):
        return text
    try:
        repaired = text.encode("gbk").decode("utf-8")
    except UnicodeError:
        return text
    return repaired if repaired else text


def copy_for_role(role: str, topic: str, language: str) -> dict[str, str]:
    templates = ROLE_COPY_ZH if language.lower().startswith("zh") else ROLE_COPY
    template = templates.get(role, templates["mechanism"])
    return {key: value.format(topic=topic) for key, value in template.items()}


def build_scene(
    index: int,
    mapping: dict[str, Any],
    module: dict[str, Any],
    source_segment: dict[str, Any] | None,
    topic: str,
    fps: int,
    start_sec: float,
    style_tokens: dict[str, Any],
    layout_controls: dict[str, Any],
    language: str,
) -> dict[str, Any]:
    role = safe_text(mapping.get("targetRole"), "mechanism")
    duration_value = mapping.get("durationSec")
    if duration_value is None and source_segment:
        duration_value = source_segment.get("durationSec")
    duration_sec = max(2.4, float(duration_value or 5.0))
    copy = copy_for_role(role, topic, language)
    source_pattern = safe_text(mapping.get("sourcePattern"), safe_text(source_segment.get("reusableRule") if source_segment else None))
    keywords = split_words(copy["headline"])
    subtitle_line = copy["headline"]

    visual_remix = mapping.get("visualRemix") if isinstance(mapping.get("visualRemix"), dict) else {}
    scene_layout_controls = {**layout_controls, **(mapping.get("layoutControls") if isinstance(mapping.get("layoutControls"), dict) else {})}
    transition = visual_remix.get("transition") if isinstance(visual_remix.get("transition"), dict) else {}
    motion_preset = safe_text(visual_remix.get("motionPreset"), safe_text(scene_layout_controls.get("motionPreset"), "clean_reveal"))

    return {
        "sceneId": f"scene_{index + 1:02d}_{slug_text(role)}",
        "sourceSegmentId": safe_text(mapping.get("sourceSegmentId"), f"seg_{index + 1:02d}"),
        "moduleId": safe_text(module.get("moduleId"), safe_text(mapping.get("moduleId"))),
        "templateId": safe_text(module.get("templateId"), "unknown"),
        "role": role,
        "startSec": round(start_sec, 3),
        "durationSec": round(duration_sec, 3),
        "startFrame": round(start_sec * fps),
        "durationInFrames": max(1, round(duration_sec * fps)),
        "copy": {
            "headline": copy["headline"],
            "body": copy["body"],
            "bullets": [
                "保留可复用的角色和节奏",
                "为新主题重写案例和表达",
                "避免复用原文、原画面和原构图",
            ],
            "keywords": keywords,
            "onScreenText": [copy["headline"], copy["body"]],
            "voiceoverDraft": f"{copy['headline']}. {copy['body']}",
            "copyStatus": "draft_needs_human_or_llm_rewrite",
        },
        "visual": {
            "layoutTags": source_segment.get("layoutTags", []) if source_segment else module.get("layoutTags", []),
            "retentionTags": source_segment.get("retentionTags", []) if source_segment else module.get("retentionTags", []),
            "visualTags": source_segment.get("visualTags", []) if source_segment else [],
            "layoutIntent": safe_text(mapping.get("layoutIntent"), source_pattern),
            "sourcePattern": source_pattern,
            "styleTokens": style_tokens,
        },
        "layoutControls": scene_layout_controls,
        "visualRemix": visual_remix,
        "motion": {
            "transitionIn": safe_text(transition.get("transitionIn"), source_segment.get("transitionIn", "cut") if source_segment else "cut"),
            "transitionOut": safe_text(transition.get("transitionOut"), source_segment.get("transitionOut", "cut") if source_segment else "cut"),
            "motionPreset": motion_preset,
            "cameraMove": safe_text(visual_remix.get("cameraMove"), "in"),
            "effects": visual_remix.get("effects", []),
        },
        "subtitleCues": [
            {
                "startSec": round(start_sec, 3),
                "endSec": round(start_sec + duration_sec, 3),
                "text": subtitle_line,
                "status": "estimated_until_tts_alignment",
            }
        ],
        "assetRefs": [],
        "reviewNotes": [
            safe_text(mapping.get("adaptationInstruction")),
            safe_text(mapping.get("avoidInstruction")),
        ],
    }


def build_asset(
    scene: dict[str, Any],
    slot: str,
    asset_rule: dict[str, Any],
    provider_order: list[str],
    topic: str,
) -> dict[str, Any]:
    provider = safe_text(asset_rule.get("provider"), "auto")
    if provider == "auto":
        provider = provider_order[0] if provider_order else "svg_fallback"
    fallback = safe_text(asset_rule.get("fallbackProvider"), "svg_fallback")
    asset_id = f"asset_{scene['sceneId']}_{slug_text(slot)}"
    return {
        "assetId": asset_id,
        "sceneId": scene["sceneId"],
        "slot": slot,
        "assetType": "image",
        "provider": provider,
        "providerOrder": provider_order,
        "fallbackProvider": fallback,
        "status": "planned",
        "prompt": (
            f"Create an original supporting visual for {topic}. "
            f"Scene role: {scene['role']}. Layout intent: {scene['visual']['layoutIntent']}. "
            "Do not copy reference frames, logos, watermarks, platform UI, faces, or exact compositions."
        ),
        "negativePrompt": "watermark, logo, readable copied text, platform UI, source frame recreation, celebrity likeness",
        "outputPath": f"video-app/public/generated-jobs/{scene['sceneId']}/{asset_id}.png",
        "fallback": {
            "type": fallback,
            "description": "Use a generated abstract panel or local placeholder if the preferred provider fails.",
        },
    }


def compile_artifacts(
    plan: dict[str, Any],
    registry: dict[str, Any],
    viral_breakdown: dict[str, Any] | None,
    workspace: Path,
    job_id: str,
    topic: str,
) -> dict[str, dict[str, Any]]:
    target = plan.get("target", {})
    template_id = safe_text(target.get("templateId"), "ai_concept_analyse")
    style_variant = safe_text(target.get("styleVariant"), "dark_warning_orange")
    aspect_ratio = safe_text(target.get("aspectRatio"), "16:9")
    language = safe_text(target.get("language"), "zh-CN")
    topic = repair_mojibake(topic)
    style_tokens = load_style_tokens(workspace, template_id, style_variant)
    composition = choose_composition(template_id, aspect_ratio)
    fps = int(composition.get("fps", 30))
    module_map = modules_by_id(registry)
    source_segments = segments_by_id(viral_breakdown)
    provider_order = [safe_text(item) for item in plan.get("assetRule", {}).get("providerOrder", []) if safe_text(item)]

    scenes: list[dict[str, Any]] = []
    assets: list[dict[str, Any]] = []
    issues: list[str] = []
    start_sec = 0.0

    for index, mapping in enumerate(plan.get("sceneMapping", [])):
        module_id = safe_text(mapping.get("moduleId"))
        module = module_map.get(module_id)
        if not module:
            module = {"moduleId": module_id, "templateId": template_id, "assetSlots": []}
            issues.append(f"Missing module in registry: {module_id}")
        source_segment = source_segments.get(safe_text(mapping.get("sourceSegmentId")), {})
        scene = build_scene(index, mapping, module, source_segment, topic, fps, start_sec, style_tokens, plan.get("layoutControls", {}), language)
        scenes.append(scene)

        for slot in module.get("assetSlots", []):
            asset = build_asset(scene, safe_text(slot, "supporting_visual"), plan.get("assetRule", {}), provider_order, topic)
            assets.append(asset)
            scene["assetRefs"].append(asset["assetId"])

        start_sec += float(scene["durationSec"])

    duration_sec = round(start_sec, 3)
    duration_frames = sum(int(scene["durationInFrames"]) for scene in scenes)
    timeline_scenes = [
        {
            "sceneId": scene["sceneId"],
            "role": scene["role"],
            "moduleId": scene["moduleId"],
            "from": scene["startFrame"],
            "durationInFrames": scene["durationInFrames"],
        }
        for scene in scenes
    ]

    video_plan = {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("video_plan"),
        "jobId": job_id,
        "source": {
            "replicationPlanPath": "replication_plan.json",
            "viralBreakdownPath": plan.get("source", {}).get("viralBreakdownPath"),
        },
        "target": {
            **target,
            "topic": topic,
            "durationSec": duration_sec,
            "durationInFrames": duration_frames,
            "fps": fps,
        },
        "scenes": scenes,
        "subtitleRule": plan.get("subtitleRule", {}),
        "audioRule": plan.get("audioRule", {}),
        "reviewStatus": {
            "status": "needs_copy_review",
            "requiresHumanReview": True,
            "reason": "Draft copy is deterministic placeholder text and should be rewritten before final render.",
        },
    }

    asset_plan = {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("asset_plan"),
        "jobId": job_id,
        "assetRule": plan.get("assetRule", {}),
        "assets": assets,
        "providerPolicy": {
            "allowLocalApi": bool(plan.get("assetRule", {}).get("allowLocalApi", True)),
            "avoidCopyOriginalFrames": True,
            "reviewRequiredForGeneratedPeopleOrBrands": True,
        },
    }

    render_props = {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("render_props"),
        "jobId": job_id,
        "composition": {
            **composition,
            "templateId": template_id,
            "styleVariant": style_variant,
            "aspectRatio": aspect_ratio,
            "durationInFrames": duration_frames,
        },
        "inputProps": {
            "jobId": job_id,
            "topic": topic,
            "language": language,
            "target": video_plan["target"],
            "style": {
                "variant": style_variant,
                "tokens": style_tokens,
            },
            "timeline": {
                "fps": fps,
                "durationSec": duration_sec,
                "durationInFrames": duration_frames,
                "scenes": timeline_scenes,
            },
            "scenes": scenes,
            "assets": assets,
            "subtitleRule": plan.get("subtitleRule", {}),
            "audioRule": plan.get("audioRule", {}),
            "layoutControls": plan.get("layoutControls", {}),
            "reviewStatus": video_plan["reviewStatus"],
        },
    }

    compile_report = {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("compile_report", "ready" if not issues else "partial"),
        "jobId": job_id,
        "status": "ready" if not issues else "partial",
        "outputs": {
            "videoPlan": "video_plan.json",
            "assetPlan": "asset_plan.json",
            "renderProps": "render-props.json",
        },
        "checks": [
            {
                "name": "scene_count",
                "status": "passed" if scenes else "failed",
                "value": len(scenes),
            },
            {
                "name": "asset_copy_boundary",
                "status": "passed",
                "value": "All planned prompts forbid copying source frames, logos, and watermarks.",
            },
            {
                "name": "remotion_binding",
                "status": "passed" if composition.get("bindingStatus") == "adapter_ready" else "warning",
                "value": composition.get("bindingStatus"),
            },
        ],
        "issues": issues,
    }

    return {
        "video_plan": video_plan,
        "asset_plan": asset_plan,
        "render_props": render_props,
        "compile_report": compile_report,
    }


def validate_compiled(video_plan: dict[str, Any], asset_plan: dict[str, Any], render_props: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    scenes = video_plan.get("scenes", [])
    if not scenes:
        issues.append("video_plan.scenes must not be empty")
    scene_ids = {scene.get("sceneId") for scene in scenes}
    for asset in asset_plan.get("assets", []):
        if asset.get("sceneId") not in scene_ids:
            issues.append(f"asset {asset.get('assetId')} references unknown scene {asset.get('sceneId')}")
        prompt = safe_text(asset.get("prompt")).lower()
        if "do not copy" not in prompt:
            issues.append(f"asset {asset.get('assetId')} prompt must include copy boundary")
    timeline = render_props.get("inputProps", {}).get("timeline", {})
    if len(timeline.get("scenes", [])) != len(scenes):
        issues.append("render_props timeline scene count does not match video_plan scenes")
    if int(timeline.get("durationInFrames", 0)) <= 0:
        issues.append("render_props timeline durationInFrames must be positive")
    return issues


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Compile replication_plan.json into video_plan, asset_plan, and render-props.")
    parser.add_argument("--workspace", default=".", help="Workspace root.")
    parser.add_argument("--replication-plan", required=True, help="Input replication_plan.json.")
    parser.add_argument("--viral-breakdown", help="Optional viral_breakdown.json. Defaults to path from replication_plan.source.")
    parser.add_argument("--registry", default="data/module_registry.json", help="Module registry path.")
    parser.add_argument("--output-dir", help="Output directory. Defaults to the replication plan directory.")
    parser.add_argument("--job-id", help="Job id. Defaults to output directory name.")
    parser.add_argument("--topic", default="TARGET_TOPIC", help="Target topic for draft copy placeholders.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    plan_path = workspace_path(workspace, args.replication_plan)
    registry_path = workspace_path(workspace, args.registry)
    assert plan_path is not None
    assert registry_path is not None
    output_dir = workspace_path(workspace, args.output_dir) if args.output_dir else plan_path.parent
    assert output_dir is not None
    job_id = safe_text(args.job_id, output_dir.name)

    plan = load_json(plan_path)
    registry = load_json(registry_path)
    viral_path = workspace_path(workspace, args.viral_breakdown)
    if viral_path is None:
        viral_from_plan = plan.get("source", {}).get("viralBreakdownPath")
        viral_path = workspace_path(workspace, viral_from_plan) if viral_from_plan else None
    viral = load_json(viral_path) if viral_path and viral_path.exists() else None

    compiled = compile_artifacts(plan, registry, viral, workspace, job_id, args.topic)
    issues = validate_compiled(compiled["video_plan"], compiled["asset_plan"], compiled["render_props"])
    if issues:
        compiled["compile_report"]["issues"].extend(issues)
        compiled["compile_report"]["status"] = "partial"
        compiled["compile_report"]["artifact"]["status"] = "partial"

    output_dir.mkdir(parents=True, exist_ok=True)
    write_json(output_dir / "video_plan.json", compiled["video_plan"])
    write_json(output_dir / "asset_plan.json", compiled["asset_plan"])
    write_json(output_dir / "render-props.json", compiled["render_props"])
    write_json(output_dir / "compile_report.json", compiled["compile_report"])

    print("Replication plan compiled.")
    print(f"Output directory: {relative_to_workspace(workspace, output_dir)}")
    print(f"Scenes: {len(compiled['video_plan'].get('scenes', []))}")
    print(f"Assets: {len(compiled['asset_plan'].get('assets', []))}")
    if compiled["compile_report"].get("issues"):
        print("Compile status: partial")
        for issue in compiled["compile_report"]["issues"]:
            print(f"- {issue}")
    else:
        print("Compile status: ready")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Compile failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
