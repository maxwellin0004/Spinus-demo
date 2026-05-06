#!/usr/bin/env python
"""Create a deterministic sample copy_rewrite JSON for pipeline testing."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, safe_text, write_json


SAMPLES_ZH: dict[str, dict[str, dict[str, Any]]] = {
    "sharp_contrarian": {
        "hook": {
            "headline": "你不是懒，是启动成本太高",
            "body": "真正卡住你的，往往不是自控力。",
            "voiceover": "你不是懒，你只是把开始这件事设计得太重了。",
            "chunks": ["你不是懒", "是启动成本太高"],
            "keywords": ["不是懒", "启动成本"],
            "retention": "reverse_claim",
        },
        "mechanism": {
            "headline": "拖延其实有三个触发点",
            "body": "任务太模糊、第一步太大、反馈太晚。",
            "voiceover": "拖延不是突然发生的。通常是任务太模糊，第一步太大，反馈又太晚。大脑看不到立刻开始的好处，就会自动选择更轻松的事。",
            "chunks": ["任务太模糊", "第一步太大", "反馈太晚"],
            "keywords": ["模糊", "第一步", "反馈"],
            "retention": "step_by_step",
        },
        "method": {
            "headline": "先别逼自己坚持",
            "body": "把开始动作压到 30 秒内。",
            "voiceover": "先别要求自己坚持一小时。只做三件事：写下第一步，把工具提前放好，把开始时间压到三十秒。",
            "chunks": ["写下第一步", "工具提前放好", "30 秒内开始"],
            "keywords": ["第一步", "30秒", "开始"],
            "retention": "checklist",
        },
        "close": {
            "headline": "拖延要改的不是你",
            "body": "是你开始之前的设计。",
            "voiceover": "真正要改的不是你这个人，而是你开始之前的设计。",
            "chunks": ["改的不是你", "是开始前的设计"],
            "keywords": ["设计", "开始"],
            "retention": "payoff",
        },
    },
    "warm_explainer": {
        "hook": {
            "headline": "拖延不一定是自控力差",
            "body": "很多时候，是开始这一步太重了。",
            "voiceover": "拖延不一定是自控力差，很多时候只是开始这一步太重了。",
            "chunks": ["不一定是自控力差", "只是开始太重"],
            "keywords": ["自控力", "开始"],
            "retention": "gentle_reframe",
        },
        "mechanism": {
            "headline": "大脑会先计算成本",
            "body": "越不清楚、越复杂，越容易被推迟。",
            "voiceover": "当一件事看起来很大、很乱、很难得到反馈，大脑会先计算成本。成本越高，你越容易把它放到明天。",
            "chunks": ["事情看起来太大", "大脑先计算成本", "所以推到明天"],
            "keywords": ["成本", "明天"],
            "retention": "mechanism_gap",
        },
        "method": {
            "headline": "把任务变轻一点",
            "body": "先做一个小到不能拒绝的动作。",
            "voiceover": "你可以把任务变轻一点。先只打开文件，先只写一句，先只准备桌面。开始变轻，继续才会发生。",
            "chunks": ["先打开文件", "先写一句", "开始变轻"],
            "keywords": ["变轻", "一句", "继续"],
            "retention": "step_by_step",
        },
        "close": {
            "headline": "别先责怪自己",
            "body": "先把开始设计得更容易。",
            "voiceover": "所以别先责怪自己，先把开始这件事设计得更容易。",
            "chunks": ["别先责怪自己", "让开始更容易"],
            "keywords": ["开始", "更容易"],
            "retention": "relief_payoff",
        },
    },
    "story_case": {
        "hook": {
            "headline": "他每天都想开始",
            "body": "但每次都卡在同一个地方。",
            "voiceover": "有个人每天都想开始学习，但每次都卡在同一个地方。",
            "chunks": ["每天都想开始", "每次都卡住"],
            "keywords": ["开始", "卡住"],
            "retention": "specific_case_open",
        },
        "mechanism": {
            "headline": "问题不在学习本身",
            "body": "而在开始前没有清晰入口。",
            "voiceover": "问题不在学习本身，而是他每次坐下以后，还要想学什么、从哪页开始、先做哪一步。入口越乱，越容易逃走。",
            "chunks": ["不是学习本身", "是入口太乱", "所以容易逃走"],
            "keywords": ["入口", "逃走"],
            "retention": "case_to_mechanism",
        },
        "method": {
            "headline": "前一晚只做三件事",
            "body": "放好材料，写好第一步，定好开始点。",
            "voiceover": "他的解决办法很简单：前一晚放好材料，写好第一步，定好开始点。第二天只负责执行，不负责重新思考。",
            "chunks": ["放好材料", "写好第一步", "第二天只执行"],
            "keywords": ["材料", "第一步", "执行"],
            "retention": "checklist",
        },
        "close": {
            "headline": "真正的改变在前一晚",
            "body": "不是在你最累的时候硬撑。",
            "voiceover": "很多改变不是发生在你最累的时候，而是发生在你提前设计好的那一刻。",
            "chunks": ["不是硬撑", "是提前设计"],
            "keywords": ["提前", "设计"],
            "retention": "story_payoff",
        },
    },
}


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def choose_sample(variant_id: str, role: str) -> dict[str, Any]:
    variant = SAMPLES_ZH.get(variant_id, SAMPLES_ZH["sharp_contrarian"])
    return variant.get(role) or variant.get("mechanism") or SAMPLES_ZH["sharp_contrarian"]["mechanism"]


def build_rewrite(context: dict[str, Any], variant_id: str) -> dict[str, Any]:
    variant = next((item for item in context.get("variants", []) if item.get("variantId") == variant_id), None)
    if not variant:
        variant = {"variantId": variant_id, "label": variant_id}

    rewritten_scenes: list[dict[str, Any]] = []
    voiceover_units: list[dict[str, Any]] = []
    for index, scene in enumerate(context.get("scenes", [])):
        role = safe_text(scene.get("role"), "mechanism")
        sample = choose_sample(variant_id, role)
        duration = float(scene.get("durationSec") or 0)
        rewritten_scenes.append(
            {
                "sceneId": scene.get("sceneId"),
                "sourceSegmentId": scene.get("sourceSegmentId"),
                "role": role,
                "moduleId": scene.get("moduleId"),
                "durationSec": duration,
                "headline": sample["headline"],
                "body": sample["body"],
                "bullets": sample["chunks"],
                "keywords": sample["keywords"],
                "onScreenText": [sample["headline"], sample["body"]],
                "voiceoverDraft": sample["voiceover"],
                "subtitleChunks": [
                    {
                        "text": chunk,
                        "emphasisWords": [word for word in sample["keywords"] if word in chunk],
                        "startPolicy": "estimated",
                        "pauseAfterSec": 0.12 if chunk_index < len(sample["chunks"]) - 1 else 0.2,
                    }
                    for chunk_index, chunk in enumerate(sample["chunks"])
                ],
                "retentionDevice": sample["retention"],
                "transitionLine": "继续看下一步。",
                "copyStatus": "rewritten",
                "originalityNotes": [
                    "Preserves the scene role and timing from the reference structure.",
                    "Uses new wording, examples, and metaphors for the target topic.",
                ],
                "reviewFlags": ["sample_copy_needs_human_review"],
            }
        )
        voiceover_units.append(
            {
                "voiceId": f"v{index + 1:03d}",
                "sceneId": scene.get("sceneId"),
                "role": role,
                "text": sample["voiceover"],
                "targetDurationSec": duration,
                "intendedPauseAfterSec": 0.2,
                "pace": context.get("globalRules", {}).get("audioRule", {}).get("voicePace", "medium_fast"),
                "emotion": variant.get("contentTone", "sharp"),
                "emphasisWords": sample["keywords"],
                "timingStatus": "estimated",
            }
        )

    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("copy_rewrite"),
        "jobId": context.get("jobId"),
        "variant": variant,
        "rewrittenScenes": rewritten_scenes,
        "voiceoverUnits": voiceover_units,
        "review": {
            "status": "needs_review",
            "summary": "Deterministic sample rewrite for pipeline verification; replace with skill/model copy before production.",
            "checks": [
                {"name": "scene_coverage", "status": "passed"},
                {"name": "originality_boundary", "status": "needs_human_review"},
            ],
            "globalFlags": ["sample_copy_not_final"],
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Draft a sample copy_rewrite JSON from copy_rewrite_context.json.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--context", required=True)
    parser.add_argument("--variant", default="sharp_contrarian")
    parser.add_argument("--output", help="Output path. Defaults to context directory.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    context_path = workspace_path(workspace, args.context)
    assert context_path is not None
    context = load_json(context_path)
    payload = build_rewrite(context, args.variant)
    output_path = workspace_path(workspace, args.output) if args.output else context_path.parent / f"copy_rewrite.{args.variant}.json"
    assert output_path is not None
    write_json(output_path, payload)
    print("Sample copy rewrite drafted.")
    print(f"Output: {output_path}")
    print(f"Scenes: {len(payload['rewrittenScenes'])}")
    print(f"Variant: {args.variant}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
