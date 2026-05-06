#!/usr/bin/env python
"""Prepare a topic/copy strategy and deterministic rewrite draft for replication jobs."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, safe_text, write_json


COPY_ARC_ZH = [
    {
        "headline": "别先找模板",
        "body": "先看它怎么抓人",
        "voiceover": "别先找模板。先看它第一秒用什么东西抓住你。",
        "chunks": ["别先找模板", "先看它怎么抓人"],
        "keywords": ["模板", "抓人"],
        "retention": "reverse_claim",
    },
    {
        "headline": "拆出视觉骨架",
        "body": "标题、字幕、主体、留白",
        "voiceover": "第二步，把画面拆成骨架：标题在哪，字幕在哪，主体在哪，哪里必须留白。",
        "chunks": ["拆出视觉骨架", "标题、字幕、主体、留白"],
        "keywords": ["视觉骨架", "留白"],
        "retention": "framework_naming",
    },
    {
        "headline": "记录动效触发点",
        "body": "不是加特效，是卡节奏",
        "voiceover": "特效也要拆。网格、闪光、缩放、故障感，分别卡在哪个信息点上。",
        "chunks": ["记录动效触发点", "不是加特效，是卡节奏"],
        "keywords": ["动效", "节奏"],
        "retention": "mechanism_detail",
    },
    {
        "headline": "拆声音和字幕",
        "body": "听到什么，就显示什么",
        "voiceover": "然后拆声音。底部字幕必须跟配音一致，视觉标题只负责强调。",
        "chunks": ["拆声音和字幕", "听到什么，就显示什么"],
        "keywords": ["声音", "字幕"],
        "retention": "mistake_correction",
    },
    {
        "headline": "生成新选题",
        "body": "保留结构，替换主题",
        "voiceover": "接着换成新选题。我们保留它的结构，不复制原文，也不复制原画面。",
        "chunks": ["生成新选题", "保留结构，替换主题"],
        "keywords": ["新选题", "结构"],
        "retention": "boundary_rule",
    },
    {
        "headline": "出图不是随便画",
        "body": "要按安全区生成",
        "voiceover": "生成图片时，也要按安全区来。文字区要干净，主体不能挡字幕。",
        "chunks": ["出图不是随便画", "要按安全区生成"],
        "keywords": ["安全区", "字幕"],
        "retention": "production_constraint",
    },
    {
        "headline": "动效交给模板",
        "body": "每段读取参数运动",
        "voiceover": "渲染时，模板读取参数。该横移就横移，该脉冲就脉冲，该网格就网格。",
        "chunks": ["动效交给模板", "每段读取参数运动"],
        "keywords": ["模板", "参数"],
        "retention": "automation_payoff",
    },
    {
        "headline": "配音重新对齐",
        "body": "字幕从音频切片",
        "voiceover": "最后重新配音。字幕直接从音频时间轴切出来，这样听到和看到才一致。",
        "chunks": ["配音重新对齐", "字幕从音频切片"],
        "keywords": ["配音", "音频时间轴"],
        "retention": "quality_fix",
    },
    {
        "headline": "复刻的是系统",
        "body": "不是一条视频",
        "voiceover": "所以复刻的不是一条视频，而是一套可以反复生产的系统。",
        "chunks": ["复刻的是系统", "不是一条视频"],
        "keywords": ["系统", "反复生产"],
        "retention": "payoff",
    },
]


def workspace_path(workspace: Path, value: str | None) -> Path | None:
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else workspace / path


def build_strategy(video_plan: dict[str, Any], topic: str, variant: str) -> dict[str, Any]:
    scenes = video_plan.get("scenes", [])
    scene_strategy = []
    for index, scene in enumerate(scenes):
        arc = COPY_ARC_ZH[min(index, len(COPY_ARC_ZH) - 1)]
        scene_strategy.append(
            {
                "sceneId": scene.get("sceneId"),
                "sourceSegmentId": scene.get("sourceSegmentId"),
                "role": scene.get("role"),
                "durationSec": scene.get("durationSec"),
                "headlineGoal": arc["headline"],
                "visualCaptionGoal": arc["body"],
                "spokenGoal": arc["voiceover"],
                "retentionDevice": arc["retention"],
                "rewriteBoundary": "Keep the reference role, rhythm, layout intent, and effect grammar; replace topic, wording, examples, and generated visuals.",
            }
        )

    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("topic_copy_strategy"),
        "jobId": video_plan.get("jobId"),
        "variantId": variant,
        "topic": topic,
        "recommendedTopic": topic,
        "templateFit": {
            "status": "fit",
            "reason": "The reference style works well for process explanation, system demonstration, and high-density AI workflow content.",
        },
        "selectedDirection": {
            "angle": "把爆款复刻从审美判断变成可执行系统",
            "hookPromise": "观众会看到为什么不能只复刻画面，而要复刻结构、动效、声音和生成规则。",
        },
        "hookDirections": [
            "别先找模板，先拆第一秒怎么抓人",
            "复刻爆款不是抄画面，是迁移结构",
            "真正能批量生产的，是参数化的视频系统",
        ],
        "sceneStrategy": scene_strategy,
        "copyRules": {
            "visualText": "Top visual headline/body must be short, graphic, and independent from spoken subtitles.",
            "spokenSubtitles": "Bottom subtitles must come only from TTS/audio alignment, not from scene-level estimated subtitle cues.",
            "voiceover": "One voiceover unit per scene, short enough for the scene duration; avoid long paragraphs.",
            "originality": "Do not copy source wording, watermark, platform UI, people, or exact frame composition.",
        },
    }


def build_copy_rewrite(video_plan: dict[str, Any], strategy: dict[str, Any], variant: str) -> dict[str, Any]:
    scenes = video_plan.get("scenes", [])
    rewritten_scenes: list[dict[str, Any]] = []
    voiceover_units: list[dict[str, Any]] = []
    for index, scene in enumerate(scenes):
        arc = COPY_ARC_ZH[min(index, len(COPY_ARC_ZH) - 1)]
        duration = float(scene.get("durationSec") or 0)
        rewritten_scenes.append(
            {
                "sceneId": scene.get("sceneId"),
                "sourceSegmentId": scene.get("sourceSegmentId"),
                "role": scene.get("role"),
                "moduleId": scene.get("moduleId"),
                "durationSec": duration,
                "headline": arc["headline"],
                "body": arc["body"],
                "bullets": arc["chunks"],
                "keywords": arc["keywords"],
                "onScreenText": [arc["headline"], arc["body"]],
                "voiceoverDraft": arc["voiceover"],
                "subtitleChunks": [
                    {
                        "text": chunk,
                        "emphasisWords": [word for word in arc["keywords"] if word in chunk],
                        "startPolicy": "estimated_until_tts_alignment",
                        "pauseAfterSec": 0.12 if chunk_index < len(arc["chunks"]) - 1 else 0.2,
                    }
                    for chunk_index, chunk in enumerate(arc["chunks"])
                ],
                "retentionDevice": arc["retention"],
                "transitionLine": "进入下一层拆解",
                "copyStatus": "rewritten",
                "originalityNotes": [
                    "Keeps the reference structure and visual grammar.",
                    "Uses new topic, new wording, and new generated assets.",
                ],
                "reviewFlags": [],
            }
        )
        voiceover_units.append(
            {
                "voiceId": f"v{index + 1:03d}",
                "sceneId": scene.get("sceneId"),
                "role": scene.get("role"),
                "text": arc["voiceover"],
                "targetDurationSec": duration,
                "intendedPauseAfterSec": 0.18,
                "pace": "medium_fast",
                "emotion": "sharp" if index == 0 else "focused",
                "emphasisWords": arc["keywords"],
                "timingStatus": "estimated",
            }
        )

    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("copy_rewrite"),
        "jobId": video_plan.get("jobId"),
        "variant": {
            "variantId": variant,
            "label": "Sharp system explainer",
            "platformFit": ["douyin", "xiaohongshu"],
            "contentTone": "sharp_clear",
            "hookStyle": "reverse_claim",
            "rhetoricalPattern": "mistake_correction_to_system_method",
            "emotionCurve": "high_opening_then_structured_payoff",
            "sentenceStyle": "short_direct",
        },
        "sourceStrategy": {
            "path": f"topic_copy_strategy.{variant}.json",
            "selectedDirection": strategy.get("selectedDirection", {}),
        },
        "rewrittenScenes": rewritten_scenes,
        "voiceoverUnits": voiceover_units,
        "review": {
            "status": "ready_for_pipeline_test",
            "summary": "Deterministic strategy-based rewrite for workflow validation.",
            "checks": [
                {"name": "scene_coverage", "status": "passed"},
                {"name": "audio_subtitle_boundary", "status": "passed"},
                {"name": "originality_boundary", "status": "needs_human_review"},
            ],
            "globalFlags": [],
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prepare topic/copy strategy for a replication job.")
    parser.add_argument("--workspace", default=".")
    parser.add_argument("--job-dir", required=True)
    parser.add_argument("--topic", required=True)
    parser.add_argument("--variant", default="sharp_contrarian")
    parser.add_argument("--output")
    parser.add_argument("--rewrite-output")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workspace = Path(args.workspace).resolve()
    job_dir = workspace_path(workspace, args.job_dir)
    assert job_dir is not None
    video_plan = load_json(job_dir / "video_plan.json")
    strategy = build_strategy(video_plan, safe_text(args.topic), args.variant)
    output = workspace_path(workspace, args.output) if args.output else job_dir / f"topic_copy_strategy.{args.variant}.json"
    assert output is not None
    write_json(output, strategy)
    if args.rewrite_output:
        rewrite_output = workspace_path(workspace, args.rewrite_output)
    else:
        rewrite_output = job_dir / f"copy_rewrite.{args.variant}.json"
    assert rewrite_output is not None
    write_json(rewrite_output, build_copy_rewrite(video_plan, strategy, args.variant))
    print("Topic/copy strategy prepared.")
    print(f"Strategy: {output}")
    print(f"Copy rewrite: {rewrite_output}")
    print(f"Scenes: {len(video_plan.get('scenes', []))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
