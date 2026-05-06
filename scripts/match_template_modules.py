#!/usr/bin/env python
"""Match viral_breakdown segments to modules from data/module_registry.json."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from replication_artifact_utils import artifact_meta, load_json, style_tags_for_domain, write_json


WEIGHTS = {
    "sceneRole": 0.30,
    "contentDomain": 0.20,
    "layoutTags": 0.24,
    "retentionTags": 0.15,
    "styleTags": 0.10,
    "aspectRatio": 0.05,
}
ADJACENT_ROLES = {
    ("problem", "setup"),
    ("setup", "problem"),
    ("method", "checklist"),
    ("checklist", "method"),
    ("case", "evidence"),
    ("evidence", "case"),
    ("close", "cta"),
    ("cta", "close"),
}


def overlap_score(left: list[str], right: list[str], weight: float) -> float:
    if not left or not right:
        return 0.0
    left_set = set(left)
    right_set = set(right)
    return weight * (len(left_set & right_set) / max(1, len(left_set)))


def role_score(segment_role: str, module_role: str) -> float:
    if segment_role == module_role:
        return WEIGHTS["sceneRole"]
    if (segment_role, module_role) in ADJACENT_ROLES:
        return WEIGHTS["sceneRole"] * 0.55
    return 0.0


def candidate_score(segment: dict[str, Any], module: dict[str, Any], breakdown: dict[str, Any]) -> tuple[float, dict[str, float]]:
    domain = breakdown.get("meta", {}).get("contentDomain", "")
    aspect = breakdown.get("meta", {}).get("aspectRatio", "")
    style_tags = breakdown.get("style", {}).get("styleTags") or style_tags_for_domain(domain)
    layout_profile = breakdown.get("layoutProfile") if isinstance(breakdown.get("layoutProfile"), dict) else {}
    preferred_template = layout_profile.get("recommendedTemplateId")
    archetype = layout_profile.get("layoutArchetype")
    score_breakdown = {
        "sceneRole": round(role_score(str(segment.get("role", "")), str(module.get("sceneRole", ""))), 4),
        "contentDomain": WEIGHTS["contentDomain"] if domain in (module.get("contentDomains") or []) else 0.0,
        "layoutTags": round(overlap_score(segment.get("layoutTags") or [], module.get("layoutTags") or [], WEIGHTS["layoutTags"]), 4),
        "retentionTags": round(overlap_score(segment.get("retentionTags") or [], module.get("retentionTags") or [], WEIGHTS["retentionTags"]), 4),
        "styleTags": round(overlap_score(style_tags, module.get("styleTags") or [], WEIGHTS["styleTags"]), 4),
        "aspectRatio": WEIGHTS["aspectRatio"] if aspect in (module.get("supportedAspectRatios") or []) else 0.0,
    }
    if preferred_template and preferred_template != "auto" and module.get("templateId") == preferred_template:
        score_breakdown["layoutTags"] = round(score_breakdown["layoutTags"] + 0.32, 4)
    elif archetype == "cinematic_quote_full_bleed" and module.get("templateId") not in {"cinematic_quote_full_bleed"}:
        score_breakdown["layoutTags"] = round(max(0.0, score_breakdown["layoutTags"] - 0.18), 4)
    total = round(sum(score_breakdown.values()), 4)
    return total, score_breakdown


def reason_for(segment: dict[str, Any], module: dict[str, Any], score: float) -> str:
    parts = []
    if segment.get("role") == module.get("sceneRole"):
        parts.append(f"matches {segment.get('role')} role")
    shared_layout = sorted(set(segment.get("layoutTags") or []) & set(module.get("layoutTags") or []))
    if shared_layout:
        parts.append(f"layout overlap: {', '.join(shared_layout)}")
    shared_retention = sorted(set(segment.get("retentionTags") or []) & set(module.get("retentionTags") or []))
    if shared_retention:
        parts.append(f"retention overlap: {', '.join(shared_retention)}")
    parts.append(f"risk={module.get('riskLevel', 'unknown')}")
    return "; ".join(parts) + f"; score={score:.2f}"


def match(breakdown: dict[str, Any], registry: dict[str, Any], top_k: int = 3) -> dict[str, Any]:
    modules = registry.get("modules") or []
    matches = []
    for segment in breakdown.get("segments") or []:
        candidates = []
        for module in modules:
            score, score_breakdown = candidate_score(segment, module, breakdown)
            if score <= 0:
                continue
            candidates.append(
                {
                    "moduleId": module["moduleId"],
                    "score": round(score, 4),
                    "scoreBreakdown": score_breakdown,
                    "reason": reason_for(segment, module, score),
                }
            )
        candidates.sort(key=lambda item: item["score"], reverse=True)
        candidates = candidates[:top_k]
        selected = candidates[0]["moduleId"] if candidates else None
        top_score = candidates[0]["score"] if candidates else 0.0
        if top_score >= 0.55:
            status = "matched"
            fallback = None
            requires_review = False
        elif top_score >= 0.35:
            status = "weak_match"
            fallback = "manual_review"
            requires_review = True
        else:
            status = "no_match"
            fallback = "require_new_module"
            requires_review = True
        matches.append(
            {
                "sourceSegmentId": segment.get("id"),
                "selectedModuleId": selected,
                "matchStatus": status,
                "fallbackRecommendation": fallback,
                "candidates": candidates,
                "requiresReview": requires_review,
            }
        )
    return {
        "schemaVersion": "1.0",
        "artifact": artifact_meta("module_match_report"),
        "jobId": breakdown.get("meta", {}).get("sourceVideoId", "replication_job"),
        "matches": matches,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Match viral breakdown segments to local modules.")
    parser.add_argument("--viral-breakdown", required=True, help="Path to viral_breakdown.json.")
    parser.add_argument("--registry", default="data/module_registry.json", help="Path to module_registry.json.")
    parser.add_argument("--output", required=True, help="Output module_match_report.json path.")
    parser.add_argument("--top-k", type=int, default=3)
    args = parser.parse_args()

    payload = match(load_json(Path(args.viral_breakdown)), load_json(Path(args.registry)), args.top_k)
    write_json(Path(args.output), payload)
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
