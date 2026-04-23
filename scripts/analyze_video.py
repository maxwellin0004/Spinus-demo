from __future__ import annotations

import json
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config import API_CONFIG, MODEL_ROUTING
from scripts.api_client import ApiClientError, image_file_to_data_url, post_json, post_multipart


ANALYSIS_STAGES = [
    ("extracting_basic_meta", 8, "Collecting base metadata and source text surfaces"),
    ("extracting_audio", 14, "Extracting audio track from the uploaded sample"),
    ("extracting_keyframes", 18, "Extracting one frame per second for visual evidence"),
    ("transcribing_audio", 22, "Transcribing narration into timeline segments"),
    ("analyzing_title", 36, "Analyzing title, cover text, and first-frame text"),
    ("analyzing_description", 48, "Analyzing description formula and hashtag strategy"),
    ("analyzing_hook", 58, "Generating hook analysis from current evidence"),
    ("analyzing_structure", 68, "Breaking the video into narrative structure segments"),
    ("analyzing_script_style", 76, "Extracting script style, tone, and density rules"),
    ("analyzing_visual_rhythm", 84, "Recording hard and soft visual changes across the timeline"),
    ("analyzing_visual_style", 90, "Extracting scene layouts, asset types, and recreation difficulty"),
    ("analyzing_subtitle_audio", 96, "Summarizing subtitle timing and audio sync behavior"),
    ("building_summary", 99, "Building the reusable analysis summary"),
]


def read_json(path: Path, fallback=None):
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def append_log(log_path: Path, message: str) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(f"[{now_iso()}] {message}\n")


def load_prompt_config() -> dict[str, Any]:
    return read_json(Path(__file__).with_name("prompt_config.json"), {})


def run_ffmpeg_extract_audio(source_video: Path, target_audio: Path) -> bool:
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        return False

    target_audio.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i",
        str(source_video),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        str(target_audio),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0 and target_audio.exists()


def run_ffmpeg_extract_frames(source_video: Path, frames_dir: Path, frame_index_path: Path) -> dict[str, Any]:
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        return {
            "success": False,
            "source": "missing_ffmpeg",
            "frames": [],
        }

    frames_dir.mkdir(parents=True, exist_ok=True)
    for existing in frames_dir.glob("frame_*.jpg"):
        existing.unlink()

    output_pattern = frames_dir / "frame_%04d.jpg"
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i",
        str(source_video),
        "-vf",
        "fps=1",
        str(output_pattern),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    frame_files = sorted(frames_dir.glob("frame_*.jpg"))
    if result.returncode != 0 or not frame_files:
        payload = {
            "success": False,
            "source": "ffmpeg_failed",
            "stderr": result.stderr,
            "frames": [],
        }
        write_json(frame_index_path, payload)
        return payload

    frames = []
    for index, frame_path in enumerate(frame_files):
        frames.append(
            {
                "index": index,
                "time_sec": float(index),
                "path": str(frame_path),
                "name": frame_path.name,
            }
        )

    payload = {
        "success": True,
        "source": "ffmpeg_fps_1",
        "count": len(frames),
        "frames": frames,
    }
    write_json(frame_index_path, payload)
    return payload


def default_transcript(source_meta: dict[str, Any]) -> dict[str, Any]:
    text = "。".join(
        [part for part in [source_meta.get("title", ""), source_meta.get("description", "")] if part]
    ) or "系统占位转写，用于驱动第二阶段分析工作流。"
    return {
        "full_text": text,
        "segments": [
            {
                "start": 0.0,
                "end": max(3.0, float(source_meta.get("duration_sec") or 6)),
                "text": text,
            }
        ],
        "generated": True,
        "source": "mock",
    }


def transcribe_audio(audio_path: Path, source_meta: dict[str, Any]) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key or not audio_path.exists():
        return default_transcript(source_meta)

    try:
        response = post_multipart(
            API_CONFIG.audio_transcriptions_url,
            API_CONFIG.api_key,
            {"model": MODEL_ROUTING.by_task("transcribe_audio").model},
            "file",
            audio_path,
            API_CONFIG.timeout_seconds,
        )
        text = response.get("text") or response.get("transcript") or ""
        if not text:
            return default_transcript(source_meta)
        return {
            "full_text": text,
            "segments": response.get("segments", []),
            "generated": False,
            "source": "api",
            "raw_response": response,
        }
    except ApiClientError as exc:
        return {
            **default_transcript(source_meta),
            "source": "mock_fallback",
            "fallback_reason": str(exc),
        }


def extract_json_object(raw_text: str) -> dict[str, Any]:
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def run_chat_module(task_name: str, prompt_text: str) -> dict[str, Any]:
    profile = MODEL_ROUTING.by_task(task_name)
    payload = {
        "model": profile.model,
        "stream": profile.stream,
        "temperature": profile.temperature,
        "max_tokens": profile.max_tokens,
        "messages": [
            {"role": "system", "content": load_prompt_config()[task_name]["system_prompt"]},
            {"role": "user", "content": prompt_text},
        ],
    }
    response = post_json(
        API_CONFIG.chat_completions_url,
        API_CONFIG.api_key,
        payload,
        API_CONFIG.timeout_seconds,
    )
    content = response["choices"][0]["message"]["content"]
    parsed = extract_json_object(content)
    return {
        "parsed": parsed,
        "raw_response": response,
        "model": profile.model,
    }


def mock_title_analysis(source_meta: dict[str, Any]) -> dict[str, Any]:
    return {
        "title_analysis": {
            "raw_title": source_meta.get("title", ""),
            "cover_text": source_meta.get("cover_text", ""),
            "first_frame_text": source_meta.get("first_frame_text", ""),
            "title_type": "risk-warning",
            "formula": "negative-judgment + danger-result",
            "conclusion_first": True,
            "contains": {
                "risk": True,
                "benefit": False,
                "conflict": True,
                "number": False,
                "contrast": True,
                "promise": False,
            },
            "relationship_between_surfaces": {
                "title_vs_cover": "reinforcing",
                "title_vs_first_frame": "supplementary",
            },
            "keyword_slots": [source_meta.get("title", "")] if source_meta.get("title") else [],
            "variable_candidates": ["topic", "risk_phrase"],
            "confidence": 0.62,
        }
    }


def mock_description_analysis(source_meta: dict[str, Any]) -> dict[str, Any]:
    tags = source_meta.get("tags", [])
    return {
        "description_analysis": {
            "raw_description": source_meta.get("description", ""),
            "description_type": "insight-plus-hashtags",
            "description_formula": "thesis + reinforcement + hashtags",
            "opening_role": "thesis",
            "has_call_to_action": False,
            "call_to_action_type": None,
            "tone": "warning",
            "title_relation": "reinforcement",
            "keyword_clusters": tags[:5],
            "hashtag_strategy": {
                "count": len(tags),
                "hashtags": [f"#{str(tag).replace(' ', '')}" for tag in tags],
                "language_mix": "zh + en",
                "mix_type": "broad + niche",
                "broad_tags": tags[:2],
                "niche_tags": tags[2:5],
                "brand_or_account_tags": [],
            },
            "variable_candidates": ["hashtags", "insight_sentence"],
            "confidence": 0.58,
        }
    }


def mock_structure_analysis(source_meta: dict[str, Any], transcript: dict[str, Any]) -> dict[str, Any]:
    duration = float(source_meta.get("duration_sec") or 36)
    full_text = transcript.get("full_text", "")
    body_end = max(18, duration - 8)
    outro_start = max(18, duration - 8)

    summary_setup = "Frames the common misunderstanding or problem"
    if full_text:
        summary_setup = "Uses the transcript opening to establish the problem context"

    return {
        "structure_analysis": [
            {
                "id": "hook",
                "start_sec": 0,
                "end_sec": min(4, duration),
                "label": "hook",
                "purpose": "Capture attention with a strong corrective statement",
                "summary": "States the core warning before any explanation",
                "transition_to_next": "Move from warning into quick setup",
                "information_density": "high",
                "confidence": 0.71,
            },
            {
                "id": "setup",
                "start_sec": min(4, duration),
                "end_sec": min(12, duration),
                "label": "setup",
                "purpose": "Frame the common misunderstanding or problem",
                "summary": summary_setup,
                "transition_to_next": "Pivot into evidence or explanation",
                "information_density": "medium",
                "confidence": 0.68,
            },
            {
                "id": "body",
                "start_sec": min(12, duration),
                "end_sec": body_end,
                "label": "body",
                "purpose": "Provide the main evidence or explanation",
                "summary": "Expands the core idea with examples or criteria",
                "transition_to_next": "Condense into takeaway",
                "information_density": "medium-high",
                "confidence": 0.64,
            },
            {
                "id": "outro",
                "start_sec": outro_start,
                "end_sec": max(24, duration),
                "label": "outro",
                "purpose": "Deliver takeaway and optional soft CTA",
                "summary": "Restates the key lesson and closes the short",
                "transition_to_next": "end",
                "information_density": "medium",
                "confidence": 0.57,
            },
        ],
        "global_structure_pattern": "warning -> setup -> evidence -> takeaway",
    }


def mock_visual_rhythm_analysis(
    source_meta: dict[str, Any],
    structure_payload: dict[str, Any],
    frame_index: dict[str, Any],
) -> dict[str, Any]:
    duration = float(source_meta.get("duration_sec") or 36)
    frame_times = [frame["time_sec"] for frame in frame_index.get("frames", [])]
    if not frame_times:
        frame_times = [0.0, 1.0, 2.0]

    scene_changes = [
        {
            "time_sec": frame_times[0],
            "approximate": False,
            "change_strength": "hard_change",
            "change_type": "opening-frame",
            "from_visual": "intro",
            "to_visual": "hook frame",
            "purpose": "start with a decisive opening visual",
            "linked_to_audio_emphasis": True,
        }
    ]

    if len(frame_times) > 2:
        scene_changes.append(
            {
                "time_sec": frame_times[min(3, len(frame_times) - 1)],
                "approximate": True,
                "change_strength": "soft_change",
                "change_type": "supporting-layout-shift",
                "from_visual": "hook frame",
                "to_visual": "setup frame",
                "purpose": "move from hook into explanation",
                "linked_to_audio_emphasis": True,
            }
        )

    if len(frame_times) > 5:
        scene_changes.append(
            {
                "time_sec": frame_times[min(8, len(frame_times) - 1)],
                "approximate": True,
                "change_strength": "hard_change",
                "change_type": "evidence-cut",
                "from_visual": "setup frame",
                "to_visual": "body evidence frame",
                "purpose": "introduce proof or demonstration",
                "linked_to_audio_emphasis": False,
            }
        )

    hook_interval = 1.0 if len(frame_times) > 3 else 1.5
    body_interval = 2.0 if duration <= 30 else 3.0
    outro_interval = 2.5

    return {
        "rhythm_analysis": {
            "scene_changes": scene_changes,
            "section_rhythm": {
                "hook": {"avg_change_interval_sec": hook_interval, "rhythm_level": "high"},
                "body": {"avg_change_interval_sec": body_interval, "rhythm_level": "medium"},
                "outro": {"avg_change_interval_sec": outro_interval, "rhythm_level": "medium"},
            },
            "peak_moments": [f"{change['time_sec']}s {change['change_type']}" for change in scene_changes[:2]],
            "rhythm_rule_candidates": [
                "Use a harder visual change at the opening than in the middle section",
                "Keep body rhythm slower than hook rhythm while maintaining steady motion",
            ],
            "confidence": 0.59,
        }
    }


def select_representative_frames(frame_index: dict[str, Any]) -> list[dict[str, Any]]:
    frames = frame_index.get("frames", [])
    if not frames:
        return []

    candidate_indexes = {
        0,
        len(frames) - 1,
        max(0, round((len(frames) - 1) * 0.25)),
        max(0, round((len(frames) - 1) * 0.5)),
        max(0, round((len(frames) - 1) * 0.75)),
    }
    return [frames[index] for index in sorted(candidate_indexes)]


def analyze_image_frame(source_meta: dict[str, Any], frame: dict[str, Any]) -> dict[str, Any]:
    frame_path = Path(frame["path"])
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key or not frame_path.exists():
        return {
            "time_sec": frame.get("time_sec", 0),
            "name": frame.get("name", ""),
            "summary": "Mock frame summary: likely contains title card, chart, or supporting visual.",
            "visible_text": [],
            "layout_guess": "single-focus",
            "visual_type_guess": "headline-or-evidence-frame",
            "source": "mock",
        }

    profile = MODEL_ROUTING.by_task("analyze_image")
    payload = {
        "model": profile.model,
        "stream": profile.stream,
        "temperature": profile.temperature,
        "max_tokens": profile.max_tokens,
        "messages": [
            {
                "role": "system",
                "content": "你是一个短视频关键帧分析器。请简洁描述这一帧的画面类型、布局、可见文字和主要视觉功能。输出 JSON。",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"平台: {source_meta.get('platform', '')}\n"
                            f"赛道: {source_meta.get('track', '')}\n"
                            f"标题: {source_meta.get('title', '')}\n"
                            "请分析这一关键帧，并只输出 JSON，格式为："
                            '{"summary":"","visible_text":[],"layout_guess":"","visual_type_guess":""}'
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_file_to_data_url(frame_path),
                        },
                    },
                ],
            },
        ],
    }

    try:
        response = post_json(
            API_CONFIG.chat_completions_url,
            API_CONFIG.api_key,
            payload,
            API_CONFIG.timeout_seconds,
        )
        content = response["choices"][0]["message"]["content"]
        parsed = extract_json_object(content)
        return {
            "time_sec": frame.get("time_sec", 0),
            "name": frame.get("name", ""),
            "summary": parsed.get("summary", ""),
            "visible_text": parsed.get("visible_text", []),
            "layout_guess": parsed.get("layout_guess", ""),
            "visual_type_guess": parsed.get("visual_type_guess", ""),
            "source": "api",
            "model": profile.model,
        }
    except Exception as exc:
        return {
            "time_sec": frame.get("time_sec", 0),
            "name": frame.get("name", ""),
            "summary": "Mock fallback frame summary due to API error.",
            "visible_text": [],
            "layout_guess": "single-focus",
            "visual_type_guess": "headline-or-evidence-frame",
            "source": "mock_fallback",
            "reason": str(exc),
            "model": profile.model,
        }


def mock_visual_style_analysis(
    source_meta: dict[str, Any],
    structure_payload: dict[str, Any],
    frame_summaries: list[dict[str, Any]],
) -> dict[str, Any]:
    sections = structure_payload.get("structure_analysis", [])
    if not sections:
        sections = [
            {"id": "hook"},
            {"id": "body"},
        ]

    visuals = []
    for section in sections:
        section_id = section.get("id", "section")
        if section_id == "hook":
            visuals.append(
                {
                    "section_id": section_id,
                    "visual_type": "headline overlay",
                    "layout": "center headline with supporting subtitle",
                    "asset_types": ["text", "background image"],
                    "style_markers": ["high contrast", "center focus"],
                    "fixed_elements": ["large headline", "subtitle emphasis"],
                    "variable_elements": ["background asset", "accent color"],
                    "recreation_difficulty": "easy",
                    "confidence": 0.67,
                }
            )
        elif section_id == "body":
            visuals.append(
                {
                    "section_id": section_id,
                    "visual_type": "evidence scene",
                    "layout": "left visual right text",
                    "asset_types": ["chart", "caption"],
                    "style_markers": ["data-led", "clean panels"],
                    "fixed_elements": ["two-column evidence layout"],
                    "variable_elements": ["chart asset", "support text"],
                    "recreation_difficulty": "medium",
                    "confidence": 0.6,
                }
            )
        else:
            visuals.append(
                {
                    "section_id": section_id,
                    "visual_type": "supporting explainer scene",
                    "layout": "single focus",
                    "asset_types": ["text", "image"],
                    "style_markers": ["informational"],
                    "fixed_elements": ["subtitle emphasis"],
                    "variable_elements": ["supporting image", "highlight word"],
                    "recreation_difficulty": "easy",
                    "confidence": 0.55,
                }
            )

    return {"visual_analysis": visuals}


def mock_subtitle_audio_analysis(
    source_meta: dict[str, Any],
    transcript: dict[str, Any],
    rhythm_payload: dict[str, Any],
) -> dict[str, Any]:
    transcript_text = transcript.get("full_text", "")
    word_count = len(transcript_text.split()) if transcript_text else 0
    pace = 150
    duration = float(source_meta.get("duration_sec") or 1)
    if transcript_text and duration > 0:
        approx_cjk_chars = len(transcript_text.replace(" ", ""))
        if approx_cjk_chars > 0:
            pace = max(110, min(220, int((approx_cjk_chars / duration) * 60 / 2)))

    return {
        "subtitle_analysis": {
            "position": "bottom center",
            "line_count_pattern": "1-2 lines",
            "line_length_pattern": "short to medium",
            "highlight_strategy": "keyword emphasis on conclusion and risk words",
            "timing_pattern": "faster in hook, steadier in body, slightly compressed near outro",
            "confidence": 0.58 if word_count else 0.5,
        },
        "audio_analysis": {
            "voice_style": "confident concise narration",
            "pace_wpm_estimate": pace,
            "pause_pattern": "short pause after hook and before final takeaway",
            "bgm_style": "tense tech underscore",
            "hook_sfx_likely": ["impact-hit"],
            "sync_pattern": "subtitle emphasis aligns with phrase endings and rhythm peaks",
            "confidence": 0.56 if word_count else 0.48,
        },
    }


def mock_hook_analysis(source_meta: dict[str, Any], transcript: dict[str, Any], rhythm_payload: dict[str, Any]) -> dict[str, Any]:
    hook_text = source_meta.get("first_frame_text") or source_meta.get("cover_text") or source_meta.get("title", "")
    transcript_text = transcript.get("full_text", "")
    if transcript_text:
        hook_text = transcript_text[:40]

    return {
        "hook_analysis": {
            "time_range_sec": [0, 5],
            "hook_text": hook_text,
            "hook_type": "warning-hook",
            "core_mechanism": "lead with a strong corrective statement before explanation",
            "conclusion_first": True,
            "devices": {
                "risk": True,
                "conflict": True,
                "promise": False,
                "question": False,
                "surprise": True,
                "contrarian": True,
            },
            "visual_support": "headline overlay paired with fast opening rhythm",
            "surface_dependency": "title-cover-first-frame bundle",
            "template_rule_candidates": [
                "Make the first spoken sentence feel like a correction or warning",
                "Keep the hook visually aligned with the first strong subtitle moment",
            ],
            "confidence": 0.64,
        }
    }


def mock_script_style_analysis(source_meta: dict[str, Any], transcript: dict[str, Any]) -> dict[str, Any]:
    transcript_text = transcript.get("full_text", "")
    return {
        "script_analysis": {
            "tone": "urgent and corrective",
            "sentence_style": "short spoken sentences",
            "sentence_length_pattern": "mostly short with occasional medium explanation",
            "conclusion_first": True,
            "dominant_modes": ["warning", "explanation", "correction"],
            "density_pattern": "high upfront, moderate in the middle",
            "paragraph_organization": "claim first, explanation second",
            "rule_candidates": [
                "Lead each section with the strongest claim",
                "Keep each spoken line short enough for hard subtitle emphasis",
            ],
            "confidence": 0.63 if transcript_text else 0.5,
        }
    }


def analyze_title(source_meta: dict[str, Any]) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return {**mock_title_analysis(source_meta), "_engine": {"mode": "mock", "model": MODEL_ROUTING.by_task("analyze_title").model}}

    prompt = load_prompt_config()["analyze_title"]["user_template"].format(
        platform=source_meta.get("platform", ""),
        track=source_meta.get("track", ""),
        title=source_meta.get("title", ""),
        cover_text=source_meta.get("cover_text", ""),
        first_frame_text=source_meta.get("first_frame_text", ""),
    )
    try:
        result = run_chat_module("analyze_title", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        fallback = mock_title_analysis(source_meta)
        fallback["_engine"] = {"mode": "mock_fallback", "model": MODEL_ROUTING.by_task("analyze_title").model, "reason": str(exc)}
        return fallback


def analyze_description(source_meta: dict[str, Any]) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return {
            **mock_description_analysis(source_meta),
            "_engine": {"mode": "mock", "model": MODEL_ROUTING.by_task("analyze_description").model},
        }

    prompt = load_prompt_config()["analyze_description"]["user_template"].format(
        platform=source_meta.get("platform", ""),
        track=source_meta.get("track", ""),
        title=source_meta.get("title", ""),
        cover_text=source_meta.get("cover_text", ""),
        description=source_meta.get("description", ""),
        tags=", ".join(source_meta.get("tags", [])),
    )
    try:
        result = run_chat_module("analyze_description", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        fallback = mock_description_analysis(source_meta)
        fallback["_engine"] = {"mode": "mock_fallback", "model": MODEL_ROUTING.by_task("analyze_description").model, "reason": str(exc)}
        return fallback


def analyze_structure(source_meta: dict[str, Any], transcript: dict[str, Any]) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return {
            **mock_structure_analysis(source_meta, transcript),
            "_engine": {"mode": "mock", "model": MODEL_ROUTING.by_task("analyze_structure").model},
        }

    prompt = load_prompt_config()["analyze_structure"]["user_template"].format(
        platform=source_meta.get("platform", ""),
        track=source_meta.get("track", ""),
        title=source_meta.get("title", ""),
        cover_text=source_meta.get("cover_text", ""),
        first_frame_text=source_meta.get("first_frame_text", ""),
        description=source_meta.get("description", ""),
        duration_sec=source_meta.get("duration_sec", 0),
        transcript=transcript.get("full_text", ""),
    )
    try:
        result = run_chat_module("analyze_structure", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        fallback = mock_structure_analysis(source_meta, transcript)
        fallback["_engine"] = {
            "mode": "mock_fallback",
            "model": MODEL_ROUTING.by_task("analyze_structure").model,
            "reason": str(exc),
        }
        return fallback


def analyze_visual_rhythm(
    source_meta: dict[str, Any],
    transcript: dict[str, Any],
    structure_payload: dict[str, Any],
    frame_index: dict[str, Any],
) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return {
            **mock_visual_rhythm_analysis(source_meta, structure_payload, frame_index),
            "_engine": {"mode": "mock", "model": MODEL_ROUTING.by_task("analyze_visual_rhythm").model},
        }

    structure_lines = []
    for item in structure_payload.get("structure_analysis", []):
        structure_lines.append(
            f"{item.get('id')} {item.get('start_sec')}->{item.get('end_sec')} {item.get('purpose')}: {item.get('summary')}"
        )
    frame_times = ", ".join(str(frame["time_sec"]) for frame in frame_index.get("frames", [])) or "0,1,2"

    prompt = load_prompt_config()["analyze_visual_rhythm"]["user_template"].format(
        platform=source_meta.get("platform", ""),
        track=source_meta.get("track", ""),
        duration_sec=source_meta.get("duration_sec", 0),
        global_structure_pattern=structure_payload.get("global_structure_pattern", ""),
        structure_lines="\n".join(structure_lines),
        transcript=transcript.get("full_text", ""),
        frame_times=frame_times,
    )

    try:
        result = run_chat_module("analyze_visual_rhythm", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        fallback = mock_visual_rhythm_analysis(source_meta, structure_payload, frame_index)
        fallback["_engine"] = {
            "mode": "mock_fallback",
            "model": MODEL_ROUTING.by_task("analyze_visual_rhythm").model,
            "reason": str(exc),
        }
        return fallback


def analyze_visual_style(
    source_meta: dict[str, Any],
    structure_payload: dict[str, Any],
    frame_summaries: list[dict[str, Any]],
) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return {
            **mock_visual_style_analysis(source_meta, structure_payload, frame_summaries),
            "_engine": {"mode": "mock", "model": MODEL_ROUTING.by_task("analyze_visual_style").model},
        }

    structure_lines = []
    for item in structure_payload.get("structure_analysis", []):
        structure_lines.append(
            f"{item.get('id')} {item.get('start_sec')}->{item.get('end_sec')} {item.get('purpose')}: {item.get('summary')}"
        )
    frame_summary_lines = []
    for item in frame_summaries:
        frame_summary_lines.append(
            f"{item.get('time_sec')}s {item.get('name')}: {item.get('summary')} | layout={item.get('layout_guess')} | visual={item.get('visual_type_guess')}"
        )

    prompt = load_prompt_config()["analyze_visual_style"]["user_template"].format(
        platform=source_meta.get("platform", ""),
        track=source_meta.get("track", ""),
        title=source_meta.get("title", ""),
        global_structure_pattern=structure_payload.get("global_structure_pattern", ""),
        structure_lines="\n".join(structure_lines),
        frame_summaries="\n".join(frame_summary_lines),
    )

    try:
        result = run_chat_module("analyze_visual_style", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        fallback = mock_visual_style_analysis(source_meta, structure_payload, frame_summaries)
        fallback["_engine"] = {
            "mode": "mock_fallback",
            "model": MODEL_ROUTING.by_task("analyze_visual_style").model,
            "reason": str(exc),
        }
        return fallback


def analyze_hook(
    source_meta: dict[str, Any],
    transcript: dict[str, Any],
    rhythm_payload: dict[str, Any],
) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return {
            **mock_hook_analysis(source_meta, transcript, rhythm_payload),
            "_engine": {"mode": "mock", "model": MODEL_ROUTING.by_task("analyze_hook").model},
        }

    segments = transcript.get("segments") or []
    hook_text = segments[0].get("text", transcript.get("full_text", "")) if segments else transcript.get("full_text", "")
    prompt = load_prompt_config()["analyze_hook"]["user_template"].format(
        platform=source_meta.get("platform", ""),
        track=source_meta.get("track", ""),
        title=source_meta.get("title", ""),
        cover_text=source_meta.get("cover_text", ""),
        first_frame_text=source_meta.get("first_frame_text", ""),
        hook_transcript=hook_text,
        rhythm_summary=json.dumps(rhythm_payload.get("rhythm_analysis", {}), ensure_ascii=False, indent=2),
    )

    try:
        result = run_chat_module("analyze_hook", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        fallback = mock_hook_analysis(source_meta, transcript, rhythm_payload)
        fallback["_engine"] = {
            "mode": "mock_fallback",
            "model": MODEL_ROUTING.by_task("analyze_hook").model,
            "reason": str(exc),
        }
        return fallback


def analyze_script_style(source_meta: dict[str, Any], transcript: dict[str, Any], structure_payload: dict[str, Any]) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return {
            **mock_script_style_analysis(source_meta, transcript),
            "_engine": {"mode": "mock", "model": MODEL_ROUTING.by_task("analyze_script_style").model},
        }

    prompt = load_prompt_config()["analyze_script_style"]["user_template"].format(
        platform=source_meta.get("platform", ""),
        track=source_meta.get("track", ""),
        title=source_meta.get("title", ""),
        global_structure_pattern=structure_payload.get("global_structure_pattern", ""),
        transcript=transcript.get("full_text", ""),
    )

    try:
        result = run_chat_module("analyze_script_style", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        fallback = mock_script_style_analysis(source_meta, transcript)
        fallback["_engine"] = {
            "mode": "mock_fallback",
            "model": MODEL_ROUTING.by_task("analyze_script_style").model,
            "reason": str(exc),
        }
        return fallback


def analyze_subtitle_audio(
    source_meta: dict[str, Any],
    transcript: dict[str, Any],
    structure_payload: dict[str, Any],
    rhythm_payload: dict[str, Any],
) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        return {
            **mock_subtitle_audio_analysis(source_meta, transcript, rhythm_payload),
            "_engine": {"mode": "mock", "model": MODEL_ROUTING.by_task("analyze_subtitle_audio").model},
        }

    rhythm_summary = json.dumps(rhythm_payload.get("rhythm_analysis", {}), ensure_ascii=False, indent=2)
    prompt = load_prompt_config()["analyze_subtitle_audio"]["user_template"].format(
        platform=source_meta.get("platform", ""),
        track=source_meta.get("track", ""),
        title=source_meta.get("title", ""),
        transcript=transcript.get("full_text", ""),
        global_structure_pattern=structure_payload.get("global_structure_pattern", ""),
        rhythm_summary=rhythm_summary,
    )

    try:
        result = run_chat_module("analyze_subtitle_audio", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        fallback = mock_subtitle_audio_analysis(source_meta, transcript, rhythm_payload)
        fallback["_engine"] = {
            "mode": "mock_fallback",
            "model": MODEL_ROUTING.by_task("analyze_subtitle_audio").model,
            "reason": str(exc),
        }
        return fallback


def mock_summary_payload(analysis: dict[str, Any]) -> dict[str, Any]:
    title_type = analysis.get("title_analysis", {}).get("title_type", "risk-warning")
    return {
        "summary": {
            "top_template_rules": [
                "Lead with a corrective warning in the first 3 seconds",
                "Keep the first visual change hard and high contrast",
                "Use claim-first script organization before explanation",
                "Tie description hashtags to both broad and niche discovery terms",
                "Keep hard subtitle rhythm faster in the hook than in the body",
            ],
            "key_packaging_features": [
                f"Primary title pattern centers on {title_type}",
                "Description acts as a short thesis plus discovery hashtags",
                "Hard subtitles support the spoken hook with compressed pacing",
            ],
            "best_variable_candidates": ["topic", "risk_phrase", "background_asset", "hashtags"],
            "best_fixed_rules": ["warning-first hook", "high-contrast headline opening", "claim-first structure"],
        }
    }


def build_summary_payload(analysis: dict[str, Any]) -> dict[str, Any]:
    if API_CONFIG.mock_analysis or not API_CONFIG.api_key:
        payload = mock_summary_payload(analysis)
        payload["_engine"] = {"mode": "mock", "model": MODEL_ROUTING.by_task("build_summary").model}
        return payload

    prompt = load_prompt_config()["build_summary"]["user_template"].format(
        title_analysis=json.dumps(analysis.get("title_analysis", {}), ensure_ascii=False, indent=2),
        description_analysis=json.dumps(analysis.get("description_analysis", {}), ensure_ascii=False, indent=2),
        structure_analysis=json.dumps(analysis.get("structure_analysis", []), ensure_ascii=False, indent=2),
        rhythm_analysis=json.dumps(analysis.get("rhythm_analysis", {}), ensure_ascii=False, indent=2),
        visual_analysis=json.dumps(analysis.get("visual_analysis", []), ensure_ascii=False, indent=2),
        subtitle_analysis=json.dumps(analysis.get("subtitle_analysis", {}), ensure_ascii=False, indent=2),
        audio_analysis=json.dumps(analysis.get("audio_analysis", {}), ensure_ascii=False, indent=2),
    )
    try:
        result = run_chat_module("build_summary", prompt)
        parsed = result["parsed"]
        parsed["_engine"] = {"mode": "api", "model": result["model"]}
        return parsed
    except Exception as exc:
        payload = mock_summary_payload(analysis)
        payload["_engine"] = {
            "mode": "mock_fallback",
            "model": MODEL_ROUTING.by_task("build_summary").model,
            "reason": str(exc),
        }
        return payload


def build_mock_analysis(source_id: str, source_meta: dict[str, Any], mode: str, transcript: dict[str, Any]) -> dict[str, Any]:
    duration = float(source_meta.get("duration_sec") or 36)
    title_payload = analyze_title(source_meta)
    description_payload = analyze_description(source_meta)
    structure_payload = analyze_structure(source_meta, transcript)
    frames = source_meta.get("_frame_index", {"frames": []})
    rhythm_payload = analyze_visual_rhythm(source_meta, transcript, structure_payload, frames)
    hook_payload = analyze_hook(source_meta, transcript, rhythm_payload)
    script_style_payload = analyze_script_style(source_meta, transcript, structure_payload)
    frame_summaries = source_meta.get("_frame_summaries", [])
    visual_payload = analyze_visual_style(source_meta, structure_payload, frame_summaries)
    subtitle_audio_payload = analyze_subtitle_audio(source_meta, transcript, structure_payload, rhythm_payload)

    return {
        "source_video_id": source_id,
        "status": "draft",
        "engine": {
            "provider": API_CONFIG.provider,
            "mock_analysis": API_CONFIG.mock_analysis,
            "models": {
                "analyze_title": MODEL_ROUTING.by_task("analyze_title").model,
                "analyze_description": MODEL_ROUTING.by_task("analyze_description").model,
                "analyze_hook": MODEL_ROUTING.by_task("analyze_hook").model,
                "analyze_structure": MODEL_ROUTING.by_task("analyze_structure").model,
                "analyze_script_style": MODEL_ROUTING.by_task("analyze_script_style").model,
                "analyze_visual_rhythm": MODEL_ROUTING.by_task("analyze_visual_rhythm").model,
                "analyze_visual_style": MODEL_ROUTING.by_task("analyze_visual_style").model,
                "analyze_subtitle_audio": MODEL_ROUTING.by_task("analyze_subtitle_audio").model,
                "build_summary": MODEL_ROUTING.by_task("build_summary").model,
                "transcribe_audio": MODEL_ROUTING.by_task("transcribe_audio").model,
            },
        },
        "meta": {
            "title": source_meta.get("title", ""),
            "description": source_meta.get("description", ""),
            "cover_text": source_meta.get("cover_text", ""),
            "first_frame_text": source_meta.get("first_frame_text", ""),
            "platform": source_meta.get("platform", ""),
            "track": source_meta.get("track", ""),
            "duration_sec": duration,
            "language": source_meta.get("language", "zh"),
        },
        "transcript": transcript,
        "title_analysis": title_payload["title_analysis"],
        "description_analysis": description_payload["description_analysis"],
        "hook_engine": hook_payload.get("_engine"),
        "structure_engine": structure_payload.get("_engine"),
        "script_style_engine": script_style_payload.get("_engine"),
        "rhythm_engine": rhythm_payload.get("_engine"),
        "visual_engine": visual_payload.get("_engine"),
        "subtitle_audio_engine": subtitle_audio_payload.get("_engine"),
        "hook_analysis": hook_payload["hook_analysis"],
        "structure_analysis": structure_payload["structure_analysis"],
        "global_structure_pattern": structure_payload["global_structure_pattern"],
        "script_analysis": script_style_payload["script_analysis"],
        "rhythm_analysis": rhythm_payload["rhythm_analysis"],
        "visual_analysis": visual_payload["visual_analysis"],
        "subtitle_analysis": subtitle_audio_payload["subtitle_analysis"],
        "audio_analysis": subtitle_audio_payload["audio_analysis"],
        "review": {"mode": mode, "reviewed": False, "notes": ""},
    }


def write_status(status_path: Path, job_id: str, source_id: str, status: str, progress: int, message: str) -> None:
    write_json(
        status_path,
        {
            "job_id": job_id,
            "source_video_id": source_id,
            "status": status,
            "progress": progress,
            "message": message,
            "updated_at": now_iso(),
            "engine": {
                "api": API_CONFIG.masked(),
                "routing": MODEL_ROUTING.masked(),
            },
        },
    )


def main() -> int:
    if len(sys.argv) != 5:
        print("Usage: python scripts/analyze_video.py <job_id> <source_id> <mode> <data_root>", file=sys.stderr)
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
    partial_path = job_root / "analysis.partial.json"
    job_meta_path = job_root / "job.json"
    analysis_path = analysis_root / f"{source_id}.analysis.json"
    summary_path = analysis_root / f"{source_id}.summary.json"
    transcript_path = preprocess_root / "transcript.json"
    audio_path = preprocess_root / "audio.wav"
    frames_dir = preprocess_root / "frames"
    frame_index_path = preprocess_root / "frame_index.json"
    frame_summaries_path = preprocess_root / "frame_summaries.json"
    log_path = job_root / "runner.log"

    source_meta = read_json(source_meta_path)
    if source_meta is None:
        print(f"Source meta not found: {source_meta_path}", file=sys.stderr)
        return 2

    append_log(log_path, f"Runner started for source={source_id}, mode={mode}, provider={API_CONFIG.provider}, mock={API_CONFIG.mock_analysis}")

    preprocess_root.mkdir(parents=True, exist_ok=True)
    partial = read_json(partial_path, {}) or {}

    for status, progress, message in ANALYSIS_STAGES:
        write_status(status_path, job_id, source_id, status, progress, message)
        partial.update({"status": "draft", "current_stage": status, "updated_at": now_iso()})
        write_json(partial_path, partial)
        append_log(log_path, f"Stage entered: {status}")

        if status == "extracting_audio":
            extracted = run_ffmpeg_extract_audio(source_video_path, audio_path)
            partial["audio_extracted"] = extracted
            partial["audio_path"] = str(audio_path) if extracted else None
            write_json(partial_path, partial)
            append_log(log_path, f"Audio extraction {'succeeded' if extracted else 'failed'}; path={audio_path if extracted else 'n/a'}")
        elif status == "extracting_keyframes":
            frame_index = run_ffmpeg_extract_frames(source_video_path, frames_dir, frame_index_path)
            partial["frame_index"] = frame_index
            write_json(partial_path, partial)
            append_log(
                log_path,
                f"Keyframe extraction source={frame_index.get('source')} success={frame_index.get('success')} count={frame_index.get('count', 0)}",
            )
        elif status == "transcribing_audio":
            transcript = transcribe_audio(audio_path, source_meta)
            write_json(transcript_path, transcript)
            partial["transcript"] = transcript
            write_json(partial_path, partial)
            append_log(log_path, f"Transcription source={transcript.get('source')} segments={len(transcript.get('segments', []))}")
        elif status == "analyzing_title":
            title_payload = analyze_title(source_meta)
            partial["title_analysis"] = title_payload["title_analysis"]
            partial["title_engine"] = title_payload.get("_engine")
            write_json(partial_path, partial)
            append_log(log_path, f"Title analysis mode={title_payload.get('_engine', {}).get('mode')} model={title_payload.get('_engine', {}).get('model')}")
        elif status == "analyzing_description":
            description_payload = analyze_description(source_meta)
            partial["description_analysis"] = description_payload["description_analysis"]
            partial["description_engine"] = description_payload.get("_engine")
            write_json(partial_path, partial)
            append_log(log_path, f"Description analysis mode={description_payload.get('_engine', {}).get('mode')} model={description_payload.get('_engine', {}).get('model')}")
        elif status == "analyzing_hook":
            transcript = read_json(transcript_path, default_transcript(source_meta))
            rhythm_payload = {"rhythm_analysis": partial.get("rhythm_analysis", {})}
            hook_payload = analyze_hook(source_meta, transcript, rhythm_payload)
            partial["hook_analysis"] = hook_payload["hook_analysis"]
            partial["hook_engine"] = hook_payload.get("_engine")
            write_json(partial_path, partial)
            append_log(log_path, f"Hook analysis mode={hook_payload.get('_engine', {}).get('mode')} model={hook_payload.get('_engine', {}).get('model')}")
        elif status == "analyzing_structure":
            transcript = read_json(transcript_path, default_transcript(source_meta))
            structure_payload = analyze_structure(source_meta, transcript)
            partial["structure_analysis"] = structure_payload["structure_analysis"]
            partial["global_structure_pattern"] = structure_payload["global_structure_pattern"]
            partial["structure_engine"] = structure_payload.get("_engine")
            write_json(partial_path, partial)
            append_log(log_path, f"Structure analysis mode={structure_payload.get('_engine', {}).get('mode')} model={structure_payload.get('_engine', {}).get('model')}")
        elif status == "analyzing_script_style":
            transcript = read_json(transcript_path, default_transcript(source_meta))
            structure_payload = {
                "structure_analysis": partial.get("structure_analysis", []),
                "global_structure_pattern": partial.get("global_structure_pattern", ""),
            }
            script_style_payload = analyze_script_style(source_meta, transcript, structure_payload)
            partial["script_analysis"] = script_style_payload["script_analysis"]
            partial["script_style_engine"] = script_style_payload.get("_engine")
            write_json(partial_path, partial)
            append_log(log_path, f"Script style analysis mode={script_style_payload.get('_engine', {}).get('mode')} model={script_style_payload.get('_engine', {}).get('model')}")
        elif status == "analyzing_visual_rhythm":
            transcript = read_json(transcript_path, default_transcript(source_meta))
            structure_payload = {
                "structure_analysis": partial.get("structure_analysis", []),
                "global_structure_pattern": partial.get("global_structure_pattern", ""),
            }
            frame_index = read_json(frame_index_path, {"frames": []})
            rhythm_payload = analyze_visual_rhythm(source_meta, transcript, structure_payload, frame_index)
            partial["rhythm_analysis"] = rhythm_payload["rhythm_analysis"]
            partial["rhythm_engine"] = rhythm_payload.get("_engine")
            write_json(partial_path, partial)
            append_log(log_path, f"Visual rhythm analysis mode={rhythm_payload.get('_engine', {}).get('mode')} model={rhythm_payload.get('_engine', {}).get('model')}")
        elif status == "analyzing_visual_style":
            frame_index = read_json(frame_index_path, {"frames": []})
            selected_frames = select_representative_frames(frame_index)
            append_log(log_path, f"Visual style selected_frames={len(selected_frames)}")
            frame_summaries = [analyze_image_frame(source_meta, frame) for frame in selected_frames]
            write_json(frame_summaries_path, {"frames": frame_summaries})
            structure_payload = {
                "structure_analysis": partial.get("structure_analysis", []),
                "global_structure_pattern": partial.get("global_structure_pattern", ""),
            }
            visual_payload = analyze_visual_style(source_meta, structure_payload, frame_summaries)
            partial["frame_summaries"] = frame_summaries
            partial["visual_analysis"] = visual_payload["visual_analysis"]
            partial["visual_engine"] = visual_payload.get("_engine")
            write_json(partial_path, partial)
            image_sources = [item.get("source") for item in frame_summaries]
            append_log(
                log_path,
                f"Visual style analysis mode={visual_payload.get('_engine', {}).get('mode')} model={visual_payload.get('_engine', {}).get('model')} frame_sources={image_sources}",
            )
        elif status == "analyzing_subtitle_audio":
            transcript = read_json(transcript_path, default_transcript(source_meta))
            structure_payload = {
                "structure_analysis": partial.get("structure_analysis", []),
                "global_structure_pattern": partial.get("global_structure_pattern", ""),
            }
            rhythm_payload = {
                "rhythm_analysis": partial.get("rhythm_analysis", {}),
            }
            subtitle_audio_payload = analyze_subtitle_audio(source_meta, transcript, structure_payload, rhythm_payload)
            partial["subtitle_analysis"] = subtitle_audio_payload["subtitle_analysis"]
            partial["audio_analysis"] = subtitle_audio_payload["audio_analysis"]
            partial["subtitle_audio_engine"] = subtitle_audio_payload.get("_engine")
            write_json(partial_path, partial)
            append_log(log_path, f"Subtitle/audio analysis mode={subtitle_audio_payload.get('_engine', {}).get('mode')} model={subtitle_audio_payload.get('_engine', {}).get('model')}")
        elif status == "building_summary":
            append_log(log_path, "Preparing summary payload from accumulated analysis modules")

        time.sleep(0.1)

    transcript = read_json(transcript_path, default_transcript(source_meta))
    source_meta["_frame_index"] = read_json(frame_index_path, {"frames": []})
    source_meta["_frame_summaries"] = read_json(frame_summaries_path, {"frames": []}).get("frames", [])
    draft = build_mock_analysis(source_id, source_meta, mode, transcript)
    if "title_analysis" in partial:
        draft["title_analysis"] = partial["title_analysis"]
    if "description_analysis" in partial:
        draft["description_analysis"] = partial["description_analysis"]
    if "hook_analysis" in partial:
        draft["hook_analysis"] = partial["hook_analysis"]
    if "hook_engine" in partial:
        draft["hook_engine"] = partial["hook_engine"]
    if "structure_analysis" in partial:
        draft["structure_analysis"] = partial["structure_analysis"]
        draft["global_structure_pattern"] = partial.get("global_structure_pattern", draft["global_structure_pattern"])
    if "structure_engine" in partial:
        draft["structure_engine"] = partial["structure_engine"]
    if "script_analysis" in partial:
        draft["script_analysis"] = partial["script_analysis"]
    if "script_style_engine" in partial:
        draft["script_style_engine"] = partial["script_style_engine"]
    if "rhythm_analysis" in partial:
        draft["rhythm_analysis"] = partial["rhythm_analysis"]
    if "rhythm_engine" in partial:
        draft["rhythm_engine"] = partial["rhythm_engine"]
    if "visual_analysis" in partial:
        draft["visual_analysis"] = partial["visual_analysis"]
    if "visual_engine" in partial:
        draft["visual_engine"] = partial["visual_engine"]
    if "subtitle_analysis" in partial:
        draft["subtitle_analysis"] = partial["subtitle_analysis"]
    if "audio_analysis" in partial:
        draft["audio_analysis"] = partial["audio_analysis"]
    if "subtitle_audio_engine" in partial:
        draft["subtitle_audio_engine"] = partial["subtitle_audio_engine"]

    summary = build_summary_payload(draft)
    draft["summary"] = summary["summary"]
    if "_engine" in summary:
        draft["summary_engine"] = summary["_engine"]
    append_log(log_path, f"Summary build mode={summary.get('_engine', {}).get('mode')} model={summary.get('_engine', {}).get('model')}")

    write_json(analysis_path, draft)
    write_json(summary_path, summary)
    append_log(log_path, f"Analysis written to {analysis_path.name} and {summary_path.name}")

    partial.update(
        {
            **draft,
            "current_stage": "completed",
            "updated_at": now_iso(),
        }
    )
    write_json(partial_path, partial)

    write_status(status_path, job_id, source_id, "awaiting_review", 100, "Analysis draft is ready for review")

    job_meta = read_json(job_meta_path, {}) or {}
    job_meta["status"] = "awaiting_review"
    job_meta["updated_at"] = now_iso()
    write_json(job_meta_path, job_meta)

    source_meta["status"] = "analysis_ready"
    source_meta["updated_at"] = now_iso()
    write_json(source_meta_path, source_meta)
    append_log(log_path, "Runner completed successfully")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
