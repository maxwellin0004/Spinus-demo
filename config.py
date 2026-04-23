from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _to_int(name: str, default: int) -> int:
    return int(os.getenv(name, str(default)))


def _to_float(name: str, default: float) -> float:
    return float(os.getenv(name, str(default)))


ROOT = Path(__file__).resolve().parent
LOCAL_CONFIG_PATH = ROOT / "config.local.json"


def _load_local_config() -> dict:
    if not LOCAL_CONFIG_PATH.exists():
        return {}
    try:
        return json.loads(LOCAL_CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


LOCAL_CONFIG = _load_local_config()


def _cfg(name: str, default: str = "") -> str:
    return str(LOCAL_CONFIG.get(name, os.getenv(name, default)))


@dataclass
class ApiConfig:
    provider: str = _cfg("MODEL_PROVIDER", "bltcy")
    api_key: str = _cfg("BLTCY_API_KEY", "")
    chat_completions_url: str = _cfg("BLTCY_CHAT_COMPLETIONS_URL", "https://api.bltcy.ai/v1/chat/completions")
    audio_transcriptions_url: str = _cfg("BLTCY_AUDIO_TRANSCRIPTIONS_URL", "https://api.bltcy.ai/v1/audio/transcriptions")
    timeout_seconds: int = _to_int("MODEL_TIMEOUT_SECONDS", 180)
    mock_analysis: bool = _to_bool(str(LOCAL_CONFIG.get("MOCK_ANALYSIS", os.getenv("MOCK_ANALYSIS"))) if LOCAL_CONFIG.get("MOCK_ANALYSIS", os.getenv("MOCK_ANALYSIS")) is not None else None, default=True)

    def masked(self) -> dict[str, object]:
        payload = asdict(self)
        api_key = payload["api_key"]
        if isinstance(api_key, str) and api_key:
            payload["api_key"] = f"{api_key[:4]}***{api_key[-4:]}" if len(api_key) > 8 else "***"
        return payload


@dataclass
class ModelProfile:
    name: str
    model: str
    temperature: float
    max_tokens: int
    stream: bool = False
    notes: str = ""


@dataclass
class ModelRouting:
    video_understanding: ModelProfile = field(
        default_factory=lambda: ModelProfile(
            name="video_understanding",
            model=_cfg("MODEL_VIDEO_UNDERSTANDING", "gemini-3.1-flash-lite-preview-thinking-minimal"),
            temperature=_to_float("MODEL_VIDEO_UNDERSTANDING_TEMPERATURE", 0.1),
            max_tokens=_to_int("MODEL_VIDEO_UNDERSTANDING_MAX_TOKENS", 4000),
            stream=_to_bool(os.getenv("MODEL_VIDEO_UNDERSTANDING_STREAM"), default=False),
            notes="用于视频内容理解、逐段节奏分析、视觉时间轴理解。",
        )
    )
    copy_analysis: ModelProfile = field(
        default_factory=lambda: ModelProfile(
            name="copy_analysis",
            model=_cfg("MODEL_COPY_ANALYSIS", "gpt-5.4-nano"),
            temperature=_to_float("MODEL_COPY_ANALYSIS_TEMPERATURE", 0.2),
            max_tokens=_to_int("MODEL_COPY_ANALYSIS_MAX_TOKENS", 2200),
            stream=_to_bool(os.getenv("MODEL_COPY_ANALYSIS_STREAM"), default=False),
            notes="用于标题、简介、Hook、脚本风格分析。",
        )
    )
    structure_analysis: ModelProfile = field(
        default_factory=lambda: ModelProfile(
            name="structure_analysis",
            model=_cfg("MODEL_STRUCTURE_ANALYSIS", "gpt-5.4-nano"),
            temperature=_to_float("MODEL_STRUCTURE_ANALYSIS_TEMPERATURE", 0.1),
            max_tokens=_to_int("MODEL_STRUCTURE_ANALYSIS_MAX_TOKENS", 2600),
            stream=_to_bool(os.getenv("MODEL_STRUCTURE_ANALYSIS_STREAM"), default=False),
            notes="用于叙事结构拆分与段落归纳。",
        )
    )
    subtitle_audio_analysis: ModelProfile = field(
        default_factory=lambda: ModelProfile(
            name="subtitle_audio_analysis",
            model=_cfg("MODEL_SUBTITLE_AUDIO_ANALYSIS", "gpt-5.4-nano"),
            temperature=_to_float("MODEL_SUBTITLE_AUDIO_ANALYSIS_TEMPERATURE", 0.15),
            max_tokens=_to_int("MODEL_SUBTITLE_AUDIO_ANALYSIS_MAX_TOKENS", 1800),
            stream=_to_bool(os.getenv("MODEL_SUBTITLE_AUDIO_ANALYSIS_STREAM"), default=False),
            notes="用于字幕节奏、配音风格、音频同步分析。",
        )
    )
    summary_generation: ModelProfile = field(
        default_factory=lambda: ModelProfile(
            name="summary_generation",
            model=_cfg("MODEL_SUMMARY_GENERATION", "gpt-5.4-nano"),
            temperature=_to_float("MODEL_SUMMARY_GENERATION_TEMPERATURE", 0.2),
            max_tokens=_to_int("MODEL_SUMMARY_GENERATION_MAX_TOKENS", 1600),
            stream=_to_bool(os.getenv("MODEL_SUMMARY_GENERATION_STREAM"), default=False),
            notes="用于 summary 归纳、模板规则压缩。",
        )
    )
    image_analysis: ModelProfile = field(
        default_factory=lambda: ModelProfile(
            name="image_analysis",
            model=_cfg("MODEL_IMAGE_ANALYSIS", "gpt-5.4-nano"),
            temperature=_to_float("MODEL_IMAGE_ANALYSIS_TEMPERATURE", 0.1),
            max_tokens=_to_int("MODEL_IMAGE_ANALYSIS_MAX_TOKENS", 1800),
            stream=_to_bool(os.getenv("MODEL_IMAGE_ANALYSIS_STREAM"), default=False),
            notes="用于关键帧、截图、封面和图片内容理解。",
        )
    )
    transcription: ModelProfile = field(
        default_factory=lambda: ModelProfile(
            name="transcription",
            model=_cfg("MODEL_TRANSCRIPTION", "gpt-5.4-nano"),
            temperature=_to_float("MODEL_TRANSCRIPTION_TEMPERATURE", 0.0),
            max_tokens=_to_int("MODEL_TRANSCRIPTION_MAX_TOKENS", 0),
            stream=False,
            notes="用于音频转录。",
        )
    )
    template_generation: ModelProfile = field(
        default_factory=lambda: ModelProfile(
            name="template_generation",
            model=_cfg("MODEL_TEMPLATE_GENERATION", "gpt-5.4-nano"),
            temperature=_to_float("MODEL_TEMPLATE_GENERATION_TEMPERATURE", 0.2),
            max_tokens=_to_int("MODEL_TEMPLATE_GENERATION_MAX_TOKENS", 3000),
            stream=_to_bool(os.getenv("MODEL_TEMPLATE_GENERATION_STREAM"), default=False),
            notes="预留给第三阶段 template draft 生成。",
        )
    )

    def by_task(self, task_name: str) -> ModelProfile:
        task_map = {
            "analyze_title": self.copy_analysis,
            "analyze_description": self.copy_analysis,
            "analyze_hook": self.copy_analysis,
            "analyze_script_style": self.copy_analysis,
            "analyze_structure": self.structure_analysis,
            "analyze_visual_rhythm": self.video_understanding,
            "analyze_visual_style": self.video_understanding,
            "analyze_subtitle_audio": self.subtitle_audio_analysis,
            "build_summary": self.summary_generation,
            "build_template_draft": self.template_generation,
            "analyze_image": self.image_analysis,
            "transcribe_audio": self.transcription,
        }
        return task_map.get(task_name, self.copy_analysis)

    def masked(self) -> dict[str, object]:
        return asdict(self)


API_CONFIG = ApiConfig()
MODEL_ROUTING = ModelRouting()
