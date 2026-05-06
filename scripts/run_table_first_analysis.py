from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config import API_CONFIG, MODEL_ROUTING
from scripts.analyze_video import (
    analyze_image_frame,
    build_mock_analysis,
    build_summary_payload,
    default_transcript,
    extract_json_object,
    read_json,
    run_ffmpeg_extract_audio,
    run_ffmpeg_extract_frames,
    select_representative_frames,
    transcribe_audio,
    write_json,
    write_status,
)
from scripts.api_client import post_json


TABLE_KEYS = [
    "basic_info",
    "title_packaging",
    "description",
    "hook",
    "content_structure",
    "script_style",
    "shot_visuals",
    "shot_layout",
    "layer_layout",
    "visual_structure",
    "visual_rhythm",
    "section_rhythm",
    "fx_rules",
    "secondary_assets",
    "subtitle",
    "audio",
    "asset_prompts",
    "remotion_mapping",
    "fixed_variable",
    "similarity_boundary",
    "template_rules",
]


TABLE_LABELS = {
    "basic_info": "1. 基础信息",
    "title_packaging": "2. 标题包装拆解",
    "description": "3. 简介拆解",
    "hook": "4. Hook 拆解",
    "content_structure": "5. 内容结构拆解",
    "script_style": "6. 文案风格拆解",
    "shot_visuals": "7. 逐镜头视觉拆解",
    "shot_layout": "8. 逐镜头布局分析",
    "layer_layout": "9. 逐镜头图层拆解",
    "visual_structure": "10. 画面结构母版拆解",
    "visual_rhythm": "11. 画面节奏与切换点拆解",
    "section_rhythm": "12. 分段节奏总结",
    "fx_rules": "13. 动画与特效参数拆解",
    "secondary_assets": "14. 第二层素材与重点引导拆解",
    "subtitle": "15. 字幕拆解",
    "audio": "16. 音频拆解",
    "asset_prompts": "17. 素材生成提示词拆解",
    "remotion_mapping": "18. Remotion 复刻映射",
    "fixed_variable": "19. 固定规则与变量",
    "similarity_boundary": "20. 视觉相似度与创新边界",
    "template_rules": "21. 最值得复用的模板规律",
}


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def normalize_rows(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        if value and all(isinstance(row, list) for row in value):
            headers = [str(item) for item in value[0]]
            normalized = []
            for row in value[1:]:
                normalized.append({headers[index] if index < len(headers) else f"col_{index + 1}": item for index, item in enumerate(row)})
            return normalized
        return [row if isinstance(row, dict) else {"content": row} for row in value]
    if isinstance(value, dict):
        rows = value.get("rows")
        if isinstance(rows, list):
            return [row if isinstance(row, dict) else {"content": row} for row in rows]
        return [value]
    if value in (None, ""):
        return []
    return [{"content": str(value)}]


def text_of(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        return "；".join(text_of(item) for item in value if text_of(item))
    if isinstance(value, dict):
        parts = []
        for key, item in value.items():
            item_text = text_of(item)
            if item_text:
                parts.append(f"{key}: {item_text}")
        return "；".join(parts)
    return str(value)


def first_matching(row: dict[str, Any], *keys: str, default: Any = "") -> Any:
    lowered = {str(key).lower(): value for key, value in row.items()}
    aliases = {
        "shot_id": ["镜头ID", "镜头", "shotId", "id"],
        "timerange": ["时间范围", "时间段"],
        "time_range": ["时间范围", "时间段"],
        "layout_type": ["布局类型"],
        "layouttype": ["布局类型"],
        "screen_regions": ["画面分区"],
        "screenregions": ["画面分区"],
        "main_subject_position_size": ["主体位置与尺寸"],
        "mainsubjectpositionsize": ["主体位置与尺寸"],
        "secondary_asset_position_size": ["第二层素材位置与尺寸"],
        "secondaryassetpositionsize": ["第二层素材位置与尺寸"],
        "text_position_density": ["文字位置与密度"],
        "textpositiondensity": ["文字位置与密度"],
        "subtitle_safe_area": ["字幕安全区"],
        "subtitlesafearea": ["字幕安全区"],
        "visual_attention_path": ["视觉动线"],
        "visualattentionpath": ["视觉动线"],
        "reproduction_execution_rule": ["复刻执行规则"],
        "reproductionexecutionrule": ["复刻执行规则"],
        "section_id": ["所属段落", "段落ID"],
        "visual_purpose": ["画面目的", "目的"],
        "screen_description": ["画面描述", "描述"],
        "main_focus": ["主视觉焦点", "焦点"],
        "on_screen_text": ["文字信息", "文字"],
        "reproduction_priority": ["复刻优先级"],
        "background_layer": ["背景层"],
        "primary_subject_layer": ["主体层"],
        "secondary_asset_layer": ["第二层素材"],
        "text_layer": ["文字层"],
        "subtitle_layer": ["字幕层"],
        "decoration_or_hud_layer": ["装饰/HUD层", "装饰层", "HUD层"],
        "decoration_layer": ["装饰/HUD层", "装饰层", "HUD层"],
        "z_order": ["层级关系"],
        "safe_area_notes": ["安全区注意"],
        "asset_type": ["素材类型", "第二层素材类型"],
        "asset_count": ["素材数量"],
        "position_size": ["位置/尺寸"],
        "attention_role": ["观众注意力作用"],
        "animation": ["动画方式"],
        "replacement_rule": ["可替换规则"],
        "asset_id": ["素材ID"],
        "positive_prompt": ["正向提示词"],
        "style_constraints": ["风格约束"],
        "negative_prompt": ["负向提示词"],
        "size_or_alpha_requirement": ["尺寸/透明背景要求"],
        "variable_slots": ["可替换变量"],
        "component_suggestion": ["组件建议"],
        "input_data_fields": ["输入数据字段"],
        "animation_implementation": ["动画实现"],
        "asset_path_or_generation_need": ["资产路径/生成需求"],
        "risk_notes": ["风险点"],
    }
    for key in keys:
        if key in row:
            return row[key]
        value = lowered.get(key.lower())
        if value is not None:
            return value
        for alias in aliases.get(key, []) + aliases.get(key.lower(), []):
            if alias in row:
                return row[alias]
            value = lowered.get(alias.lower())
            if value is not None:
                return value
    return default


def find_row(rows: list[dict[str, Any]], *needles: str) -> dict[str, Any]:
    for row in rows:
        haystack = json.dumps(row, ensure_ascii=False).lower()
        if any(needle.lower() in haystack for needle in needles):
            return row
    return {}


def infer_duration(source_meta: dict[str, Any], frame_index: dict[str, Any]) -> float:
    duration = float(source_meta.get("duration_sec") or 0)
    if duration > 0:
        return duration
    frames = frame_index.get("frames", [])
    if not frames:
        return 0.0
    return float(max(frame.get("time_sec", 0) for frame in frames))


def table_prompt(source_meta: dict[str, Any], transcript: dict[str, Any], frame_summaries: list[dict[str, Any]]) -> str:
    evidence = {
        "meta": {
            "title": source_meta.get("title", ""),
            "description": source_meta.get("description", ""),
            "cover_text": source_meta.get("cover_text"),
            "first_frame_text": source_meta.get("first_frame_text"),
            "platform": source_meta.get("platform", ""),
            "track": source_meta.get("track", ""),
            "duration_sec": source_meta.get("duration_sec"),
            "language": source_meta.get("language", "zh"),
        },
        "transcript": {
            "full_text": transcript.get("full_text", ""),
            "segments": transcript.get("segments", [])[:40],
            "source": transcript.get("source", ""),
        },
        "frame_summaries": frame_summaries,
    }
    return (
        "你正在为一个视频复刻工作流执行 Stage 2 拆解。\n"
        "先输出高质量人工可读拆解表，再由程序编译为 analysis.json。\n"
        "请严格只输出 JSON，不要 Markdown，不要解释。\n"
        "JSON 顶层必须包含 tables 对象；tables 必须包含以下 21 个 key：\n"
        f"{', '.join(TABLE_KEYS)}\n\n"
        "每个 key 的值必须是数组，每个数组元素是一行表格。行字段可以使用中文字段名，但必须具体、可执行。\n"
        "重点要求：\n"
        "1. 逐镜头视觉拆解必须覆盖 hook、转折、高潮、结尾；短视频尽量每 2-5 秒一行。\n"
        "2. 逐镜头布局分析必须和逐镜头视觉拆解的 shot_id/time_range 一一对应，不允许只写代表镜头。\n"
        "3. 逐镜头布局分析必须包含画面分区、主体位置与尺寸、第二层素材位置与尺寸、文字位置与密度、字幕安全区、视觉动线、复刻执行规则。\n"
        "4. 逐镜头图层拆解必须拆 background、primary_subject、secondary_assets、text、subtitle、decoration/HUD。\n"
        "5. 第二层素材必须说明素材类型、数量、位置尺寸、注意力作用、动画方式、可替换规则。\n"
        "6. 动画与特效必须写成可执行参数：入场方式、运动方向、持续时间、easing、强度、触发时机。\n"
        "7. 素材生成提示词必须包含 positive_prompt、style_constraints、negative_prompt、size/alpha 要求。\n"
        "8. Remotion 映射必须说明 composition/scene、组件建议、输入字段、动画实现和资产需求。\n"
        "9. 明确区分 observed_fact 与 template_inference，不确定就写 uncertain。\n"
        "10. 不要把账号水印/平台 UI 当作必须复刻元素。\n\n"
        "输入证据如下：\n"
        f"{json.dumps(evidence, ensure_ascii=False, indent=2)}"
    )


def build_mock_tables(source_meta: dict[str, Any], transcript: dict[str, Any], frame_summaries: list[dict[str, Any]]) -> dict[str, Any]:
    first_text = source_meta.get("first_frame_text") or source_meta.get("cover_text") or source_meta.get("title", "")
    duration = float(source_meta.get("duration_sec") or 0)
    return {
        "artifact": {
            "type": "video_analysis_tables",
            "source": "mock",
            "created_at": now_iso(),
            "notes": "Mock fallback. Use live model mode for production-quality table-first decomposition.",
        },
        "tables": {
            "basic_info": [
                {"模块": "source", "字段": "title", "结果": source_meta.get("title", "")},
                {"模块": "source", "字段": "duration_sec", "结果": duration},
                {"模块": "source", "字段": "language", "结果": source_meta.get("language", "zh")},
            ],
            "title_packaging": [
                {"项目": "首屏/标题抓手", "拆解结果": first_text, "模板推断": "用一个强概念或强判断先建立观看理由"}
            ],
            "description": [
                {"项目": "简介", "拆解结果": source_meta.get("description", "") or "uncertain", "模板推断": "简介缺失时不参与复刻判断"}
            ],
            "hook": [
                {"项目": "0-5秒 Hook", "拆解结果": first_text or transcript.get("full_text", "")[:40], "模板推断": "先给概念/冲突，再展开解释"}
            ],
            "content_structure": [
                {"段落ID": "hook", "时间范围": "0-5", "段落名称": "概念开场", "目的": "抓注意力", "信息密度": "high"},
                {"段落ID": "body", "时间范围": f"5-{max(5, int(duration))}", "段落名称": "观点展开", "目的": "建立论证", "信息密度": "medium"},
            ],
            "script_style": [
                {"项目": "文案风格", "拆解结果": "观点先行、口语解释、短句推进", "模板推断": "每段先抛结论，再补证据"}
            ],
            "shot_visuals": [
                {
                    "镜头ID": "shot_001",
                    "时间范围": "0-5",
                    "所属段落": "hook",
                    "画面目的": "建立注意力",
                    "画面描述": "large headline with supporting visual",
                    "主视觉焦点": first_text or "topic keyword",
                    "复刻优先级": "high",
                }
            ],
            "shot_layout": [
                {
                    "镜头ID": "shot_001",
                    "时间范围": "0-5",
                    "布局类型": "concept hook",
                    "画面分区": "center keyword, top HUD, bottom subtitle safe area",
                    "主体位置与尺寸": "main keyword centered, 70%-80% width",
                    "第二层素材位置与尺寸": "small HUD/callout in corners, 5%-12% width",
                    "文字位置与密度": "one large keyword plus one short definition line",
                    "字幕安全区": "bottom center, keep 6%-8% bottom margin",
                    "视觉动线": "keyword -> definition -> subtitle",
                    "复刻执行规则": "keep the main keyword dominant; avoid crowded overlays",
                }
            ],
            "layer_layout": [
                {
                    "镜头ID": "shot_001",
                    "背景层": "dark or branded background",
                    "主体层": "main topic visual",
                    "第二层素材": "supporting icon/callout",
                    "文字层": "large hook text",
                    "字幕层": "bottom subtitle safe area",
                    "装饰/HUD层": "optional frame accents",
                    "层级关系": "background < subject < overlays < text < subtitle",
                }
            ],
            "visual_structure": [
                {
                    "section": "global",
                    "画面类型": "headline / chart / explainer page",
                    "布局结构": "dark background, large text, chart or illustration focus",
                    "主要素材": "text, chart, illustrated subject",
                    "固定元素": "high-contrast headline, bottom subtitles, repeated visual frame",
                    "可替换元素": "topic word, chart labels, supporting subject",
                    "复刻难度": "medium",
                }
            ],
            "visual_rhythm": [
                {"时间点": 0, "切换类型": "hard_change", "前后变化": "opening title", "切换目的": "establish hook", "强度": "high"}
            ],
            "section_rhythm": [
                {"区段": "hook", "平均切换间隔": "fast", "节奏等级": "high", "特征": "large title and hard emphasis"}
            ],
            "fx_rules": [
                {"类别": "entry", "主要效果": "title pop / panel reveal", "用法": "sync with spoken emphasis", "强度": "medium-high"}
            ],
            "secondary_assets": [
                {
                    "镜头ID": "shot_001",
                    "第二层素材类型": "icon/callout/image sticker",
                    "素材数量": "1-3",
                    "位置/尺寸": "side or corner, 20-40% width",
                    "观众注意力作用": "point to the key concept",
                    "动画方式": "pop or slide in",
                    "可替换规则": "replace by topic-specific visual",
                }
            ],
            "subtitle": [
                {"项目": "字幕", "拆解结果": "bottom centered hard subtitles, 1-2 lines", "模板推断": "subtitle must stay readable and synchronized"}
            ],
            "audio": [
                {"项目": "音频", "拆解结果": "spoken narration, likely tech underscore", "模板推断": "emphasis points should align with visual changes"}
            ],
            "asset_prompts": [
                {
                    "素材ID": "asset_shot_001_overlay",
                    "对应镜头": "shot_001",
                    "素材类型": "transparent overlay",
                    "正向提示词": "topic-related clean visual element, high contrast, matches the video's style",
                    "风格约束": "consistent palette, no watermark, readable shape",
                    "负向提示词": "blurry, tiny details, platform UI, watermark",
                    "尺寸/透明背景要求": "transparent PNG, 1024x1024",
                    "可替换变量": "topic keyword",
                }
            ],
            "remotion_mapping": [
                {
                    "镜头ID": "shot_001",
                    "composition/scene": "HookScene",
                    "组件建议": "BackgroundLayer, SubjectLayer, OverlayAssetLayer, KineticText, SubtitleTrack",
                    "输入数据字段": "hook_text, asset_ids, subtitle_segments",
                    "动画实现": "spring pop for title, slide/scale overlay",
                    "资产路径/生成需求": "generate overlay asset if missing",
                    "风险点": "avoid crowded text and tiny overlays",
                }
            ],
            "fixed_variable": [
                {"类型": "固定规则", "内容": "strong hook, high-contrast layout, readable subtitles"},
                {"类型": "变量", "内容": "topic, concept word, chart labels, examples"},
            ],
            "similarity_boundary": [
                {
                    "维度": "layout and rhythm",
                    "必须模仿": "large hook text, clear visual focus, synchronized emphasis",
                    "可以创新": "topic asset, examples, exact wording",
                    "禁止照搬/不建议复刻": "account watermark, platform UI, copyrighted character likeness",
                    "验收标准": "same attention path, different original assets",
                }
            ],
            "template_rules": [
                {"类别": "核心规则", "结果": "先用表格拆解校准视觉与节奏，再编译成 analysis.json 给后续阶段消费"}
            ],
        },
    }


def generate_tables(source_meta: dict[str, Any], transcript: dict[str, Any], frame_summaries: list[dict[str, Any]]) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return build_mock_tables(source_meta, transcript, frame_summaries)

    profile = MODEL_ROUTING.by_task("table_first_analysis")
    payload = {
        "model": profile.model,
        "stream": profile.stream,
        "temperature": min(profile.temperature, 0.2),
        "max_tokens": max(profile.max_tokens, 6000),
        "messages": [
            {
                "role": "system",
                "content": "你是短视频复刻工作流的高精度拆解器。你的输出必须是可审阅、可模板化、可编译为 analysis.json 的结构化 JSON。",
            },
            {"role": "user", "content": table_prompt(source_meta, transcript, frame_summaries)},
        ],
    }
    try:
        response = post_json(API_CONFIG.chat_completions_url, API_CONFIG.api_key, payload, API_CONFIG.timeout_seconds)
        content = response["choices"][0]["message"]["content"]
        parsed = extract_json_object(content)
        parsed.setdefault("artifact", {})
        parsed["artifact"].update(
            {
                "type": "video_analysis_tables",
                "source": "api",
                "model": profile.model,
                "created_at": now_iso(),
            }
        )
        parsed.setdefault("tables", {})
        for key in TABLE_KEYS:
            parsed["tables"].setdefault(key, [])
        return parsed
    except Exception as exc:
        fallback = build_mock_tables(source_meta, transcript, frame_summaries)
        fallback["artifact"]["source"] = "mock_fallback"
        fallback["artifact"]["fallback_reason"] = str(exc)
        return fallback


def markdown_table(rows: list[dict[str, Any]]) -> str:
    rows = normalize_rows(rows)
    if not rows:
        return "| 项目 | 结果 |\n|---|---|\n| empty | uncertain |\n"
    columns: list[str] = []
    for row in rows:
        for key in row.keys():
            key_text = str(key)
            if key_text not in columns:
                columns.append(key_text)
    columns = columns[:8]
    lines = [
        "| " + " | ".join(columns) + " |",
        "| " + " | ".join("---" for _ in columns) + " |",
    ]
    for row in rows:
        cells = [text_of(row.get(column, "")).replace("\n", "<br>") for column in columns]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines) + "\n"


def tables_to_markdown(tables_doc: dict[str, Any]) -> str:
    lines = ["# Video Analysis Tables", ""]
    artifact = tables_doc.get("artifact", {})
    if artifact:
        lines.append(f"- source: {artifact.get('source', '')}")
        if artifact.get("model"):
            lines.append(f"- model: {artifact.get('model')}")
        lines.append(f"- created_at: {artifact.get('created_at', '')}")
        lines.append("")
    tables = tables_doc.get("tables", {})
    for key in TABLE_KEYS:
        lines.append(f"## {TABLE_LABELS[key]}")
        lines.append("")
        lines.append(markdown_table(tables.get(key, [])))
        lines.append("")
    return "\n".join(lines)


def compile_analysis_from_tables(
    source_id: str,
    source_meta: dict[str, Any],
    transcript: dict[str, Any],
    tables_doc: dict[str, Any],
    mode: str,
) -> dict[str, Any]:
    tables = {key: normalize_rows(tables_doc.get("tables", {}).get(key, [])) for key in TABLE_KEYS}
    draft = build_mock_analysis(source_id, source_meta, mode, transcript)

    title_row = find_row(tables["title_packaging"], "标题", "首屏", "hook", "概念")
    hook_row = find_row(tables["hook"], "hook", "0-5", "抓手")
    script_row = find_row(tables["script_style"], "文案", "句式", "语气")
    subtitle_row = find_row(tables["subtitle"], "字幕", "position", "位置")
    audio_row = find_row(tables["audio"], "音频", "口播", "voice")

    if title_row:
        draft["title_analysis"].update(
            {
                "raw_title": source_meta.get("title", ""),
                "cover_text": source_meta.get("cover_text", ""),
                "first_frame_text": source_meta.get("first_frame_text", ""),
                "formula": text_of(first_matching(title_row, "标题公式", "公式", "模板推断", "拆解结果")),
                "keyword_slots": [text_of(first_matching(title_row, "关键词槽位", "关键词", "项目"))],
                "variable_candidates": [text_of(first_matching(title_row, "可变量", "变量", "可替换元素", "模板推断"))],
                "confidence": max(float(draft["title_analysis"].get("confidence", 0) or 0), 0.72),
            }
        )

    if hook_row:
        draft["hook_analysis"].update(
            {
                "time_range_sec": [0, 5],
                "hook_text": text_of(first_matching(hook_row, "Hook 文本", "拆解结果", "内容", "hook_text")),
                "core_mechanism": text_of(first_matching(hook_row, "抓手机制", "核心抓手机制", "模板推断")),
                "visual_support": text_of(first_matching(hook_row, "视觉配合", "visual_support", "画面")),
                "template_rule_candidates": [text_of(first_matching(hook_row, "模板规则", "可复用规则", "模板推断"))],
                "confidence": max(float(draft["hook_analysis"].get("confidence", 0) or 0), 0.72),
            }
        )

    structure = []
    for index, row in enumerate(tables["content_structure"]):
        time_range = text_of(first_matching(row, "时间范围", "time_range", "时间段"))
        start_sec = first_matching(row, "start_sec", "开始", default=index * 10)
        end_sec = first_matching(row, "end_sec", "结束", default=(index + 1) * 10)
        if time_range and "-" in time_range:
            left, right = time_range.replace("s", "").split("-", 1)
            try:
                start_sec = float(left.strip())
                end_sec = float(right.strip())
            except ValueError:
                pass
        structure.append(
            {
                "id": text_of(first_matching(row, "段落ID", "id", default=f"section_{index + 1:02d}")),
                "start_sec": float(start_sec or 0),
                "end_sec": float(end_sec or max(1, float(start_sec or 0) + 10)),
                "label": text_of(first_matching(row, "段落名称", "label", "名称")),
                "purpose": text_of(first_matching(row, "目的", "purpose")),
                "summary": text_of(first_matching(row, "内容摘要", "summary", "拆解结果")),
                "transition_to_next": text_of(first_matching(row, "转场", "transition_to_next", "前后变化")),
                "information_density": text_of(first_matching(row, "信息密度", "information_density", default="medium")),
                "confidence": 0.72,
            }
        )
    if structure:
        draft["structure_analysis"] = structure
        draft["global_structure_pattern"] = "table-first: " + " -> ".join(item["label"] or item["id"] for item in structure)

    if script_row:
        draft["script_analysis"].update(
            {
                "tone": text_of(first_matching(script_row, "语气", "tone", "拆解结果")),
                "sentence_style": text_of(first_matching(script_row, "句式", "sentence_style")),
                "density_pattern": text_of(first_matching(script_row, "密度", "density_pattern")),
                "rule_candidates": [text_of(first_matching(script_row, "可复用规则", "模板推断", "规则"))],
                "confidence": 0.72,
            }
        )

    visual_analysis = []
    for index, row in enumerate(tables["visual_structure"]):
        section_id = text_of(first_matching(row, "section", "段落ID", "id", default=f"section_{index + 1:02d}"))
        visual_analysis.append(
            {
                "section_id": section_id,
                "visual_type": text_of(first_matching(row, "画面类型", "visual_type")),
                "layout": text_of(first_matching(row, "布局结构", "layout")),
                "layout_archetype": text_of(first_matching(row, "页面母版", "layout_archetype", "布局结构")),
                "asset_types": [text_of(first_matching(row, "主要素材", "asset_types"))],
                "style_markers": [text_of(first_matching(row, "风格标记", "style_markers", "画面类型"))],
                "fixed_elements": [text_of(first_matching(row, "固定元素", "fixed_elements"))],
                "variable_elements": [text_of(first_matching(row, "可替换元素", "variable_elements"))],
                "preserve_rules": [text_of(first_matching(row, "保留规则", "固定元素"))],
                "innovation_rules": [text_of(first_matching(row, "创新规则", "可替换元素"))],
                "recreation_difficulty": text_of(first_matching(row, "复刻难度", "recreation_difficulty", default="medium")),
                "confidence": 0.74,
            }
        )
    if visual_analysis:
        draft["visual_analysis"] = visual_analysis

    scene_changes = []
    for row in tables["visual_rhythm"]:
        scene_changes.append(
            {
                "time_sec": float(first_matching(row, "时间点", "time_sec", default=0) or 0),
                "approximate": True,
                "change_strength": text_of(first_matching(row, "切换类型", "change_strength", default="soft_change")),
                "change_type": text_of(first_matching(row, "切换类型", "change_type")),
                "from_visual": text_of(first_matching(row, "前后变化", "from_visual")),
                "to_visual": text_of(first_matching(row, "to_visual", "前后变化")),
                "purpose": text_of(first_matching(row, "切换目的", "purpose")),
                "linked_to_audio_emphasis": "音频" in text_of(row) or "重音" in text_of(row),
            }
        )
    if scene_changes:
        draft["rhythm_analysis"]["scene_changes"] = scene_changes
        draft["rhythm_analysis"]["rhythm_rule_candidates"] = [
            text_of(first_matching(row, "特征", "模板推断", "切换目的")) for row in tables["section_rhythm"]
        ]
        draft["rhythm_analysis"]["confidence"] = 0.72

    if subtitle_row:
        draft["subtitle_analysis"].update(
            {
                "position": text_of(first_matching(subtitle_row, "位置", "position", "拆解结果")),
                "line_count_pattern": text_of(first_matching(subtitle_row, "行数", "line_count_pattern")),
                "line_length_pattern": text_of(first_matching(subtitle_row, "长度", "line_length_pattern")),
                "highlight_strategy": text_of(first_matching(subtitle_row, "高亮", "highlight_strategy", "模板推断")),
                "timing_pattern": text_of(first_matching(subtitle_row, "节奏", "timing_pattern")),
                "confidence": 0.72,
            }
        )

    if audio_row:
        draft["audio_analysis"].update(
            {
                "voice_style": text_of(first_matching(audio_row, "口播", "voice_style", "拆解结果")),
                "bgm_style": text_of(first_matching(audio_row, "BGM", "bgm_style")),
                "sync_pattern": text_of(first_matching(audio_row, "同步", "sync_pattern", "模板推断")),
                "confidence": 0.68,
            }
        )

    draft["reproduction_visual_analysis"] = {
        "shot_visuals": [
            {
                "shot_id": text_of(first_matching(row, "镜头ID", "shot_id", "id", default=f"shot_{index + 1:03d}")),
                "time_range": text_of(first_matching(row, "时间范围", "time_range", "时间段")),
                "section_id": text_of(first_matching(row, "所属段落", "section_id", "段落ID")),
                "visual_purpose": text_of(first_matching(row, "画面目的", "visual_purpose", "目的")),
                "screen_description": text_of(first_matching(row, "画面描述", "screen_description", "描述")),
                "main_focus": text_of(first_matching(row, "主视觉焦点", "main_focus", "焦点")),
                "on_screen_text": text_of(first_matching(row, "文字信息", "on_screen_text", "文字")),
                "reproduction_priority": text_of(first_matching(row, "复刻优先级", "reproduction_priority", default="medium")),
                "confidence": 0.74,
            }
            for index, row in enumerate(tables["shot_visuals"])
        ],
        "shot_layout": [
            {
                "shot_id": text_of(first_matching(row, "镜头ID", "shot_id", "id", default=f"shot_{index + 1:03d}")),
                "time_range": text_of(first_matching(row, "时间范围", "time_range", "时间段")),
                "layout_type": text_of(first_matching(row, "布局类型", "layout_type")),
                "screen_regions": text_of(first_matching(row, "画面分区", "screen_regions")),
                "main_subject_position_size": text_of(first_matching(row, "主体位置与尺寸", "main_subject_position_size")),
                "secondary_asset_position_size": text_of(first_matching(row, "第二层素材位置与尺寸", "secondary_asset_position_size")),
                "text_position_density": text_of(first_matching(row, "文字位置与密度", "text_position_density")),
                "subtitle_safe_area": text_of(first_matching(row, "字幕安全区", "subtitle_safe_area")),
                "visual_attention_path": text_of(first_matching(row, "视觉动线", "visual_attention_path")),
                "reproduction_execution_rule": text_of(first_matching(row, "复刻执行规则", "reproduction_execution_rule")),
            }
            for index, row in enumerate(tables["shot_layout"])
        ],
        "layer_layout": [
            {
                "shot_id": text_of(first_matching(row, "镜头ID", "shot_id", "id", default=f"shot_{index + 1:03d}")),
                "background_layer": text_of(first_matching(row, "背景层", "background_layer")),
                "primary_subject_layer": text_of(first_matching(row, "主体层", "primary_subject_layer")),
                "secondary_asset_layer": text_of(first_matching(row, "第二层素材", "secondary_asset_layer")),
                "text_layer": text_of(first_matching(row, "文字层", "text_layer")),
                "subtitle_layer": text_of(first_matching(row, "字幕层", "subtitle_layer")),
                "decoration_layer": text_of(first_matching(row, "装饰/HUD层", "decoration_or_hud_layer", "decoration_layer")),
                "z_order": text_of(first_matching(row, "层级关系", "z_order")),
                "safe_area_notes": text_of(first_matching(row, "安全区注意", "safe_area_notes")),
            }
            for index, row in enumerate(tables["layer_layout"])
        ],
        "secondary_assets": [
            {
                "shot_id": text_of(first_matching(row, "镜头ID", "shot_id", "id", default=f"shot_{index + 1:03d}")),
                "asset_type": text_of(first_matching(row, "第二层素材类型", "asset_type", "素材类型")),
                "asset_count": text_of(first_matching(row, "素材数量", "asset_count")),
                "position_size": text_of(first_matching(row, "位置/尺寸", "position_size")),
                "attention_role": text_of(first_matching(row, "观众注意力作用", "attention_role")),
                "animation": text_of(first_matching(row, "动画方式", "animation")),
                "replacement_rule": text_of(first_matching(row, "可替换规则", "replacement_rule")),
            }
            for index, row in enumerate(tables["secondary_assets"])
        ],
        "asset_prompts": [
            {
                "asset_id": text_of(first_matching(row, "素材ID", "asset_id", default=f"asset_{index + 1:03d}")),
                "shot_id": text_of(first_matching(row, "对应镜头", "shot_id")),
                "asset_type": text_of(first_matching(row, "素材类型", "asset_type")),
                "positive_prompt": text_of(first_matching(row, "正向提示词", "positive_prompt")),
                "style_constraints": text_of(first_matching(row, "风格约束", "style_constraints")),
                "negative_prompt": text_of(first_matching(row, "负向提示词", "negative_prompt")),
                "size_or_alpha_requirement": text_of(first_matching(row, "尺寸/透明背景要求", "size_or_alpha_requirement")),
                "variable_slots": text_of(first_matching(row, "可替换变量", "variable_slots")),
            }
            for index, row in enumerate(tables["asset_prompts"])
        ],
        "remotion_mapping": [
            {
                "shot_id": text_of(first_matching(row, "镜头ID", "shot_id", "id", default=f"shot_{index + 1:03d}")),
                "composition_or_scene": text_of(first_matching(row, "composition/scene", "composition_or_scene")),
                "component_suggestion": text_of(first_matching(row, "组件建议", "component_suggestion")),
                "input_data_fields": text_of(first_matching(row, "输入数据字段", "input_data_fields")),
                "animation_implementation": text_of(first_matching(row, "动画实现", "animation_implementation")),
                "asset_path_or_generation_need": text_of(first_matching(row, "资产路径/生成需求", "asset_path_or_generation_need")),
                "risk_notes": text_of(first_matching(row, "风险点", "risk_notes")),
            }
            for index, row in enumerate(tables["remotion_mapping"])
        ],
        "similarity_boundary": [row for row in tables["similarity_boundary"]],
    }

    template_rules = [text_of(row) for row in tables["template_rules"] if text_of(row)]
    fixed_rules = [text_of(row) for row in tables["fixed_variable"] if "固定" in text_of(row)]
    variable_rules = [text_of(row) for row in tables["fixed_variable"] if "变量" in text_of(row) or "可替换" in text_of(row)]
    draft["summary"] = {
        "top_template_rules": template_rules[:5] or draft.get("summary", {}).get("top_template_rules", []),
        "key_packaging_features": [text_of(row) for row in tables["title_packaging"][:3]],
        "best_variable_candidates": variable_rules[:8],
        "best_fixed_rules": fixed_rules[:8],
    }
    draft["table_first_source"] = {
        "tables_artifact": "analysis_tables.json",
        "compiled_at": now_iso(),
        "source": tables_doc.get("artifact", {}).get("source", ""),
    }
    draft["review"] = {"mode": mode, "reviewed": False, "notes": "Generated by table-first analysis workflow."}
    return draft


def main() -> int:
    if len(sys.argv) != 5:
        print("Usage: python scripts/run_table_first_analysis.py <job_id> <source_id> <mode> <data_root>", file=sys.stderr)
        return 1

    job_id, source_id, mode, data_root_raw = sys.argv[1:5]
    data_root = Path(data_root_raw)
    source_root = data_root / "source_videos" / source_id
    preprocess_root = data_root / "preprocess" / source_id
    job_root = data_root / "jobs" / job_id
    analysis_root = data_root / "analyses"

    source_meta_path = source_root / "meta.json"
    source_video_path = source_root / "source.mp4"
    status_path = job_root / "status.json"
    analysis_path = analysis_root / f"{source_id}.analysis.json"
    summary_path = analysis_root / f"{source_id}.summary.json"
    job_analysis_path = job_root / "analysis.json"
    job_summary_path = job_root / "summary.json"
    tables_json_path = job_root / "analysis_tables.json"
    tables_md_path = job_root / "analysis_tables.md"
    transcript_path = preprocess_root / "transcript.json"
    audio_path = preprocess_root / "audio.wav"
    frames_dir = preprocess_root / "frames"
    frame_index_path = preprocess_root / "frame_index.json"
    frame_summaries_path = preprocess_root / "frame_summaries.json"

    source_meta = read_json(source_meta_path)
    if source_meta is None:
        print(f"Source meta not found: {source_meta_path}", file=sys.stderr)
        return 2

    job_root.mkdir(parents=True, exist_ok=True)
    preprocess_root.mkdir(parents=True, exist_ok=True)
    analysis_root.mkdir(parents=True, exist_ok=True)

    write_status(status_path, job_id, source_id, "extracting_evidence", 12, "Extracting audio, transcript, and key visual evidence")
    if source_video_path.exists():
        run_ffmpeg_extract_audio(source_video_path, audio_path)
        frame_index = run_ffmpeg_extract_frames(source_video_path, frames_dir, frame_index_path)
    else:
        frame_index = read_json(frame_index_path, {"frames": []})
    source_meta["duration_sec"] = infer_duration(source_meta, frame_index)

    transcript = transcribe_audio(audio_path, source_meta) if audio_path.exists() else default_transcript(source_meta)
    write_json(transcript_path, transcript)

    write_status(status_path, job_id, source_id, "summarizing_keyframes", 28, "Summarizing representative frames for table-first decomposition")
    selected_frames = select_representative_frames(frame_index)
    frame_summaries = [analyze_image_frame(source_meta, frame) for frame in selected_frames]
    write_json(frame_summaries_path, {"frames": frame_summaries})
    source_meta["_frame_index"] = frame_index
    source_meta["_frame_summaries"] = frame_summaries

    write_status(status_path, job_id, source_id, "building_analysis_tables", 58, "Building human-readable video-analysis-table artifact")
    tables_doc = generate_tables(source_meta, transcript, frame_summaries)
    write_json(tables_json_path, tables_doc)
    tables_md_path.write_text(tables_to_markdown(tables_doc), encoding="utf-8")

    write_status(status_path, job_id, source_id, "compiling_analysis_json", 84, "Compiling table artifact into template-video-2 analysis.json")
    analysis = compile_analysis_from_tables(source_id, source_meta, transcript, tables_doc, mode)
    summary = {"summary": analysis.get("summary", {})}
    summary_engine = build_summary_payload(analysis)
    if summary_engine.get("summary"):
        analysis["summary"] = summary_engine["summary"]
        summary = summary_engine

    write_json(analysis_path, analysis)
    write_json(summary_path, summary)
    write_json(job_analysis_path, analysis)
    write_json(job_summary_path, summary)

    write_status(status_path, job_id, source_id, "awaiting_review", 100, "Table-first analysis and compiled analysis.json are ready for review")
    print("Table-first analysis completed.")
    print(f"Tables JSON: {tables_json_path}")
    print(f"Tables Markdown: {tables_md_path}")
    print(f"Analysis JSON: {analysis_path}")
    print(f"Summary JSON: {summary_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
