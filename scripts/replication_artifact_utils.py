"""Shared helpers for viral replication artifact scripts."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any


GENERATOR = "workflow-viral-replication"
SCENE_ROLES = {
    "hook",
    "problem",
    "setup",
    "mechanism",
    "case",
    "evidence",
    "contrast",
    "method",
    "checklist",
    "close",
    "cta",
}
CONTENT_DOMAINS = {
    "psychology",
    "behavior",
    "trading",
    "finance",
    "ai",
    "technology",
    "business",
    "self_growth",
    "education",
    "literature",
    "math",
    "social_commentary",
}
HOOK_TYPES = {
    "reverse_claim",
    "pain_point",
    "big_number",
    "curiosity_gap",
    "conflict_setup",
    "mistake_warning",
    "result_first",
    "question_open",
    "identity_callout",
}
STYLE_FALLBACKS = {
    "psychology": "warm_paper",
    "behavior": "warm_paper",
    "self_growth": "warm_paper",
    "trading": "dark_warning_orange",
    "finance": "dark_warning_orange",
    "ai": "dark_warning_orange",
    "technology": "dark_archive_green",
    "business": "cold_newsroom",
    "math": "cinematic_amber_noir",
    "education": "clean_white",
}


def now_iso() -> str:
    return datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")


def artifact_meta(kind: str, status: str = "draft") -> dict[str, str]:
    now = now_iso()
    return {
        "type": kind,
        "status": status,
        "createdAt": now,
        "updatedAt": now,
        "generator": GENERATOR,
    }


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    return [value]


def str_list(value: Any) -> list[str]:
    result: list[str] = []
    for item in as_list(value):
        if item is None:
            continue
        text = str(item).strip()
        if text:
            result.append(text)
    return result


def safe_text(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback
    text = str(value).strip()
    return text if text else fallback


def slug_text(value: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "_", value.lower()).strip("_")
    return text or "unknown"


def parse_time_range(value: Any, fallback_start: float = 0.0, fallback_duration: float = 5.0) -> tuple[float, float]:
    if isinstance(value, list) and len(value) >= 2:
        try:
            start = float(value[0])
            end = float(value[1])
            return max(0.0, start), max(0.1, end - start)
        except (TypeError, ValueError):
            pass
    if isinstance(value, str):
        numbers = [float(match) for match in re.findall(r"\d+(?:\.\d+)?", value)]
        if len(numbers) >= 2:
            return max(0.0, numbers[0]), max(0.1, numbers[1] - numbers[0])
    return fallback_start, fallback_duration


def normalize_content_domain(*values: Any) -> str:
    text = " ".join(str_list(values)).lower()
    checks = [
        ("trading", ["trading", "market", "chart", "indicator", "stock", "crypto", "finance"]),
        ("finance", ["finance", "financial"]),
        ("ai", ["ai", "agent", "mcp", "workflow", "llm", "openai"]),
        ("technology", ["technology", "tech", "archive", "product", "standard"]),
        ("business", ["business", "corporate", "company", "industry"]),
        ("math", ["math", "probability", "paradox", "combinatorial"]),
        ("psychology", ["psychology", "emotion", "mental", "self", "habit", "behavior"]),
        ("self_growth", ["self-growth", "self_growth", "growth", "discipline"]),
        ("literature", ["literature", "book", "quote"]),
        ("social_commentary", ["social", "society", "commentary"]),
    ]
    for domain, needles in checks:
        if any(needle in text for needle in needles):
            return domain
    return "education"


def normalize_role(value: Any, index: int = 0, total: int = 1) -> str:
    text = safe_text(value).lower()
    role_map = [
        ("hook", ["hook", "opening", "cold open", "intro"]),
        ("problem", ["problem", "pain", "setup_problem"]),
        ("setup", ["setup", "context", "background", "news"]),
        ("mechanism", ["mechanism", "definition", "explain", "why", "rule"]),
        ("case", ["case", "story", "example"]),
        ("evidence", ["evidence", "proof", "data", "archive"]),
        ("contrast", ["contrast", "compare", "versus", "before_after"]),
        ("method", ["method", "action", "solution", "steps"]),
        ("checklist", ["checklist", "list"]),
        ("close", ["close", "ending", "outro", "summary"]),
        ("cta", ["cta", "call to action"]),
    ]
    for role, needles in role_map:
        if any(needle in text for needle in needles):
            return role
    if index == 0:
        return "hook"
    if index >= total - 1:
        return "close"
    if index == 1:
        return "problem"
    return "mechanism"


def normalize_hook_type(value: Any, text_context: str = "") -> str:
    text = f"{safe_text(value)} {text_context}".lower()
    if any(item in text for item in ["reverse", "contrarian", "not ", "myth"]):
        return "reverse_claim"
    if any(item in text for item in ["pain", "problem", "fail", "anxiety"]):
        return "pain_point"
    if any(item in text for item in ["number", "%", "percent", "million", "billion"]):
        return "big_number"
    if any(item in text for item in ["mistake", "warning", "wrong"]):
        return "mistake_warning"
    if "?" in text or "question" in text:
        return "question_open"
    if any(item in text for item in ["identity", "you are", "people who"]):
        return "identity_callout"
    if "result" in text or "conclusion" in text:
        return "result_first"
    if "conflict" in text:
        return "conflict_setup"
    return "curiosity_gap"


def infer_tags(text: str, role: str, domain: str) -> tuple[list[str], list[str], list[str]]:
    lower = text.lower()
    layout_tags: set[str] = set()
    retention_tags: set[str] = set()
    visual_tags: set[str] = set()

    if role == "hook":
        layout_tags.add("large_text_center")
        retention_tags.add("curiosity_gap")
    if role in {"method", "checklist"}:
        layout_tags.add("method_cards")
        retention_tags.add("step_by_step")
    if role in {"case", "evidence"}:
        layout_tags.add("case_card")
        retention_tags.add("evidence_drop")
    if role == "mechanism":
        layout_tags.add("progressive_reveal")
        retention_tags.add("step_by_step")
    if domain in {"trading", "finance"}:
        layout_tags.add("chart_board")
        visual_tags.add("chart_visual")
        retention_tags.add("risk_warning")
    elif domain in {"technology", "ai"}:
        layout_tags.add("document_panel")
        visual_tags.add("ui_like_panel" if domain == "ai" else "archival_material")
    elif domain in {"psychology", "behavior", "self_growth"}:
        layout_tags.add("minimal_background")
        visual_tags.add("text_driven")
        retention_tags.add("self_identification")
    elif domain == "math":
        layout_tags.add("number_dashboard")
        visual_tags.add("cinematic_still")
        retention_tags.add("big_number")
    elif domain == "business":
        layout_tags.add("evidence_wall")
        visual_tags.add("documentary_broll")
        retention_tags.add("risk_warning")

    if any(item in lower for item in ["split", "compare", "versus"]):
        layout_tags.add("split_screen")
        retention_tags.add("before_after")
    if any(item in lower for item in ["number", "%", "stat"]):
        layout_tags.add("number_dashboard")
        retention_tags.add("big_number")
    if any(item in lower for item in ["comic", "panel", "character"]):
        layout_tags.add("comic_panel")
        visual_tags.add("comic_illustration")
    if any(item in lower for item in ["document", "file", "archive"]):
        layout_tags.add("document_panel")
        visual_tags.add("archival_material")
    if any(item in lower for item in ["reverse", "contrarian", "wrong"]):
        retention_tags.add("reverse_claim")
    if any(item in lower for item in ["pain", "fail", "problem"]):
        retention_tags.add("pain_point")

    return sorted(layout_tags), sorted(retention_tags), sorted(visual_tags or {"text_driven"})


def style_tags_for_domain(domain: str) -> list[str]:
    if domain in {"trading", "finance"}:
        return ["dark_warning_orange", "dark_warning_red", "chart_blue_orange"]
    if domain in {"psychology", "behavior", "self_growth"}:
        return ["clean_white", "warm_paper", "soft_blue", "gray_academic"]
    if domain in {"technology"}:
        return ["dark_archive_green", "warm_retro_orange", "blue_lab_document"]
    if domain == "ai":
        return ["dark_warning_orange", "chart_blue_orange"]
    if domain == "math":
        return ["cinematic_amber_noir", "cool_probability_room"]
    if domain == "business":
        return ["cold_newsroom"]
    return ["clean_white"]


def choose_style_variant(domain: str, candidates: list[str] | None = None) -> str:
    if candidates:
        return candidates[0]
    return STYLE_FALLBACKS.get(domain, "clean_white")


def resolve_style_variant(target_style: str, requested_style: str | None = None) -> tuple[str, bool]:
    """Return the effective style variant and whether it was explicitly overridden."""
    requested = safe_text(requested_style, "auto")
    if requested and requested != "auto":
        return requested, True
    return safe_text(target_style, "clean_white"), False


def style_artifact_suffix(style_variant: str, explicit: bool) -> str:
    if not explicit:
        return ""
    return f".{slug_text(style_variant)}"


def confidence_from(value: Any, fallback: float = 0.55) -> float:
    if isinstance(value, dict):
        value = value.get("confidence", fallback)
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return fallback
