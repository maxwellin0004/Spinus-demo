#!/usr/bin/env python
"""Validate viral replication artifacts without external dependencies."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ALLOWED_PROVIDERS = {"local_asset", "local_api", "openai_image", "svg_fallback", "auto"}
ALLOWED_PROVIDER_ORDER = {"local_asset", "local_api", "openai_image", "svg_fallback"}
ALLOWED_MATCH_STATUS = {"matched", "weak_match", "no_match"}
ALLOWED_FALLBACKS = {
    None,
    "use_template_level_match",
    "require_new_module",
    "manual_review",
    "fallback_to_generic_scene",
}
REQUIRED_DO_NOT_REPLICATE = {
    "exact_words",
    "original_frames",
    "original_voice",
    "original_music",
    "logos",
    "watermarks",
}
SCORE_KEYS = {"sceneRole", "contentDomain", "layoutTags", "retentionTags", "styleTags", "aspectRatio"}
REQUIRED_BOUNDARY_TRUE = [
    "referenceOnlyForStructure",
    "doNotCopyExactWords",
    "doNotCopyOriginalFrames",
    "doNotCopyVoice",
    "doNotCopyMusic",
]


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"{path}: failed to read JSON: {exc}") from exc


def rel_template_dir(workspace: Path, template_id: str) -> Path:
    return workspace / "data" / "templates" / template_id


def require(condition: bool, issues: list[str], message: str) -> None:
    if not condition:
        issues.append(message)


def validate_artifact_meta(doc: dict[str, Any], expected_type: str, label: str, issues: list[str]) -> None:
    require(doc.get("schemaVersion"), issues, f"{label}: missing schemaVersion")
    artifact = doc.get("artifact")
    require(isinstance(artifact, dict), issues, f"{label}: missing artifact metadata")
    if isinstance(artifact, dict):
        require(artifact.get("type") == expected_type, issues, f"{label}: artifact.type must be {expected_type}")
        require(artifact.get("status") in {"draft", "partial", "ready", "stale", "failed"}, issues, f"{label}: invalid artifact.status")
        require(bool(artifact.get("createdAt")), issues, f"{label}: missing artifact.createdAt")
        require(bool(artifact.get("updatedAt")), issues, f"{label}: missing artifact.updatedAt")
        require(bool(artifact.get("generator")), issues, f"{label}: missing artifact.generator")


def validate_module_registry(doc: dict[str, Any], workspace: Path) -> tuple[dict[str, dict[str, Any]], list[str]]:
    issues: list[str] = []
    validate_artifact_meta(doc, "module_registry", "module_registry", issues)
    modules = doc.get("modules")
    require(isinstance(modules, list) and bool(modules), issues, "module_registry: modules must be a non-empty array")

    by_id: dict[str, dict[str, Any]] = {}
    if not isinstance(modules, list):
        return by_id, issues

    required = {
        "moduleId",
        "templateId",
        "displayName",
        "sceneRole",
        "supportedAspectRatios",
        "contentDomains",
        "layoutTags",
        "retentionTags",
        "styleTags",
        "inputFields",
        "assetSlots",
        "riskLevel",
        "notes",
    }
    for index, module in enumerate(modules):
        prefix = f"module_registry.modules[{index}]"
        require(isinstance(module, dict), issues, f"{prefix}: must be object")
        if not isinstance(module, dict):
            continue
        missing = sorted(required - set(module))
        require(not missing, issues, f"{prefix}: missing fields {missing}")
        module_id = str(module.get("moduleId", ""))
        require("." in module_id, issues, f"{prefix}: moduleId should be <family>.<name>")
        require(module_id not in by_id, issues, f"{prefix}: duplicate moduleId {module_id}")
        if module_id:
            by_id[module_id] = module
        template_id = str(module.get("templateId", ""))
        require(bool(template_id), issues, f"{prefix}: missing templateId")
        if template_id:
            require(rel_template_dir(workspace, template_id).exists(), issues, f"{prefix}: templateId not found in data/templates: {template_id}")
        require(module.get("riskLevel") in {"low", "medium", "high"}, issues, f"{prefix}: riskLevel must be low/medium/high")
        for field in ["supportedAspectRatios", "contentDomains", "layoutTags", "retentionTags", "styleTags", "inputFields", "assetSlots"]:
            require(isinstance(module.get(field), list), issues, f"{prefix}: {field} must be an array")
    return by_id, issues


def validate_viral_breakdown(doc: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    validate_artifact_meta(doc, "viral_breakdown", "viral_breakdown", issues)
    for field in [
        "meta",
        "packaging",
        "hook",
        "narrativeStructure",
        "segments",
        "rhythmRule",
        "visualLayouts",
        "subtitleRule",
        "audioRule",
        "style",
        "fixedRules",
        "variableCandidates",
        "sourceEvidence",
        "copyrightBoundary",
    ]:
        require(field in doc, issues, f"viral_breakdown: missing {field}")

    evidence = doc.get("sourceEvidence")
    evidence_ids = {item.get("id") for item in evidence if isinstance(item, dict)} if isinstance(evidence, list) else set()
    require(bool(evidence_ids), issues, "viral_breakdown: sourceEvidence should contain at least one evidence item")

    segments = doc.get("segments")
    require(isinstance(segments, list) and bool(segments), issues, "viral_breakdown: segments must be a non-empty array")
    if isinstance(segments, list):
        previous_end = -1.0
        for index, segment in enumerate(segments):
            prefix = f"viral_breakdown.segments[{index}]"
            require(isinstance(segment, dict), issues, f"{prefix}: must be object")
            if not isinstance(segment, dict):
                continue
            for field in ["id", "role", "startSec", "durationSec", "layoutTags", "retentionTags", "visualTags", "replicationPriority", "mustPreserve", "canChange", "sourceEvidenceIds", "confidence"]:
                require(field in segment, issues, f"{prefix}: missing {field}")
            start = float(segment.get("startSec", 0) or 0)
            duration = float(segment.get("durationSec", 0) or 0)
            require(start >= previous_end - 0.01, issues, f"{prefix}: segment overlaps or is out of order")
            previous_end = start + duration
            source_ids = segment.get("sourceEvidenceIds")
            require(isinstance(source_ids, list) and bool(source_ids), issues, f"{prefix}: sourceEvidenceIds must be non-empty")
            if isinstance(source_ids, list):
                missing = [item for item in source_ids if item not in evidence_ids]
                require(not missing, issues, f"{prefix}: sourceEvidenceIds not found: {missing}")

    boundary = doc.get("copyrightBoundary")
    require(isinstance(boundary, dict), issues, "viral_breakdown: copyrightBoundary must be object")
    if isinstance(boundary, dict):
        for field in REQUIRED_BOUNDARY_TRUE:
            require(boundary.get(field) is True, issues, f"viral_breakdown: copyrightBoundary.{field} must be true")

    hook = doc.get("hook")
    if isinstance(hook, dict):
        evidence_supports = []
        if isinstance(evidence, list):
            for item in evidence:
                if isinstance(item, dict):
                    evidence_supports.extend(item.get("supports", []) or [])
        require(any(str(item).startswith("hook.") for item in evidence_supports), issues, "viral_breakdown: hook claims should be supported by sourceEvidence")
    return issues


def validate_module_match_report(doc: dict[str, Any], modules: dict[str, dict[str, Any]]) -> list[str]:
    issues: list[str] = []
    validate_artifact_meta(doc, "module_match_report", "module_match_report", issues)
    matches = doc.get("matches")
    require(isinstance(matches, list), issues, "module_match_report: matches must be an array")
    if not isinstance(matches, list):
        return issues

    for index, match in enumerate(matches):
        prefix = f"module_match_report.matches[{index}]"
        require(isinstance(match, dict), issues, f"{prefix}: must be object")
        if not isinstance(match, dict):
            continue
        status = match.get("matchStatus")
        require(status in ALLOWED_MATCH_STATUS, issues, f"{prefix}: invalid matchStatus")
        fallback = match.get("fallbackRecommendation")
        require(fallback in ALLOWED_FALLBACKS, issues, f"{prefix}: invalid fallbackRecommendation")
        candidates = match.get("candidates")
        require(isinstance(candidates, list), issues, f"{prefix}: candidates must be array")
        selected = match.get("selectedModuleId")
        if selected is not None:
            require(selected in modules, issues, f"{prefix}: selectedModuleId not found in module_registry: {selected}")
        if isinstance(candidates, list):
            candidate_ids = [candidate.get("moduleId") for candidate in candidates if isinstance(candidate, dict)]
            if selected is not None:
                require(selected in candidate_ids, issues, f"{prefix}: selectedModuleId must appear in candidates")
            for cindex, candidate in enumerate(candidates):
                cp = f"{prefix}.candidates[{cindex}]"
                require(isinstance(candidate, dict), issues, f"{cp}: must be object")
                if not isinstance(candidate, dict):
                    continue
                module_id = candidate.get("moduleId")
                require(module_id in modules, issues, f"{cp}: moduleId not found in module_registry: {module_id}")
                breakdown = candidate.get("scoreBreakdown")
                require(isinstance(breakdown, dict), issues, f"{cp}: scoreBreakdown must be object")
                if isinstance(breakdown, dict):
                    require(set(breakdown) == SCORE_KEYS, issues, f"{cp}: scoreBreakdown keys must be {sorted(SCORE_KEYS)}")
                    total = sum(float(value or 0) for value in breakdown.values())
                    score = float(candidate.get("score", 0) or 0)
                    require(abs(total - score) <= 0.03, issues, f"{cp}: scoreBreakdown sum {total:.2f} differs from score {score:.2f}")
        if status in {"weak_match", "no_match"}:
            require(fallback is not None, issues, f"{prefix}: weak/no match must include fallbackRecommendation")
            require(match.get("requiresReview") is True, issues, f"{prefix}: weak/no match must require review")
    return issues


def validate_replication_plan(doc: dict[str, Any], modules: dict[str, dict[str, Any]]) -> list[str]:
    issues: list[str] = []
    validate_artifact_meta(doc, "replication_plan", "replication_plan", issues)
    for field in ["source", "target", "qualityTarget", "replicationStrategy", "sceneMapping", "subtitleRule", "audioRule", "assetRule", "layoutControls", "validationChecks", "reviewStatus"]:
        require(field in doc, issues, f"replication_plan: missing {field}")

    strategy = doc.get("replicationStrategy")
    if isinstance(strategy, dict):
        do_not = set(strategy.get("doNotReplicate", []) or [])
        require(REQUIRED_DO_NOT_REPLICATE.issubset(do_not), issues, f"replication_plan: doNotReplicate must include {sorted(REQUIRED_DO_NOT_REPLICATE)}")

    quality = doc.get("qualityTarget")
    if isinstance(quality, dict):
        require(quality.get("visualSimilarityLevel") in {"structure_only", "structure_and_rhythm", "structure_rhythm_style"}, issues, "replication_plan: invalid qualityTarget.visualSimilarityLevel")
        require(quality.get("originalityLevel") in {"medium", "high", "strict"}, issues, "replication_plan: invalid qualityTarget.originalityLevel")

    asset_rule = doc.get("assetRule")
    if isinstance(asset_rule, dict):
        require(asset_rule.get("provider") in ALLOWED_PROVIDERS, issues, "replication_plan: invalid assetRule.provider")
        provider_order = asset_rule.get("providerOrder")
        require(isinstance(provider_order, list) and bool(provider_order), issues, "replication_plan: assetRule.providerOrder must be non-empty")
        if isinstance(provider_order, list):
            invalid = [item for item in provider_order if item not in ALLOWED_PROVIDER_ORDER]
            require(not invalid, issues, f"replication_plan: invalid providerOrder values {invalid}")
        require(asset_rule.get("avoidCopyOriginalFrames") is True, issues, "replication_plan: assetRule.avoidCopyOriginalFrames must be true")

    mappings = doc.get("sceneMapping")
    require(isinstance(mappings, list) and bool(mappings), issues, "replication_plan: sceneMapping must be non-empty")
    if isinstance(mappings, list):
        for index, mapping in enumerate(mappings):
            prefix = f"replication_plan.sceneMapping[{index}]"
            require(isinstance(mapping, dict), issues, f"{prefix}: must be object")
            if not isinstance(mapping, dict):
                continue
            for field in ["sourceSegmentId", "targetRole", "moduleId", "durationSec", "sourcePattern", "adaptationInstruction", "avoidInstruction", "layoutIntent", "contentInstruction"]:
                require(field in mapping, issues, f"{prefix}: missing {field}")
            module_id = mapping.get("moduleId")
            require(module_id in modules, issues, f"{prefix}: moduleId not found in module_registry: {module_id}")

    review = doc.get("reviewStatus")
    if isinstance(review, dict):
        require(review.get("status") in {"draft", "needs_review", "approved", "rejected"}, issues, "replication_plan: invalid reviewStatus.status")
        require(isinstance(review.get("requiresHumanReview"), bool), issues, "replication_plan: reviewStatus.requiresHumanReview must be boolean")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate viral replication artifacts.")
    parser.add_argument("--workspace", default=".", help="Workspace root.")
    parser.add_argument("--registry", default="data/module_registry.json", help="Path to module_registry.json.")
    parser.add_argument("--viral-breakdown", help="Path to viral_breakdown.json.")
    parser.add_argument("--module-match-report", help="Path to module_match_report.json.")
    parser.add_argument("--replication-plan", help="Path to replication_plan.json.")
    args = parser.parse_args()

    workspace = Path(args.workspace).resolve()
    issues: list[str] = []

    registry_path = (workspace / args.registry).resolve() if not Path(args.registry).is_absolute() else Path(args.registry)
    registry = load_json(registry_path)
    modules, registry_issues = validate_module_registry(registry, workspace)
    issues.extend(registry_issues)

    if args.viral_breakdown:
        path = (workspace / args.viral_breakdown).resolve() if not Path(args.viral_breakdown).is_absolute() else Path(args.viral_breakdown)
        issues.extend(validate_viral_breakdown(load_json(path)))
    if args.module_match_report:
        path = (workspace / args.module_match_report).resolve() if not Path(args.module_match_report).is_absolute() else Path(args.module_match_report)
        issues.extend(validate_module_match_report(load_json(path), modules))
    if args.replication_plan:
        path = (workspace / args.replication_plan).resolve() if not Path(args.replication_plan).is_absolute() else Path(args.replication_plan)
        issues.extend(validate_replication_plan(load_json(path), modules))

    if issues:
        print("Replication artifact validation failed:")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print("Replication artifact validation passed.")
    print(f"Validated modules: {len(modules)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
