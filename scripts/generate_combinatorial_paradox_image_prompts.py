import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = ROOT / "data" / "templates" / "combinatorial_paradox_cinematic"


SCENE_BLUEPRINTS = [
    {
        "scene_id": "scene_01",
        "scene_type": "ParadoxColdOpenScene",
        "prompt_id": "cpc_cold_open_evidence",
        "default_style": "amber_lab_noir",
        "suffix": "cold-open",
        "fallback_asset": "assets/images/panel-1-cold-open.png",
        "claim_default": "The opening should make the answer feel counterintuitive before any explanation begins.",
        "metaphor_default": "a dark evidence table where the core question is presented like a sealed piece of proof",
        "relationship_object_default": "numbered markers or tokens that stand for the key actors in the puzzle",
        "comparison_unit_default": "the hidden structural comparison inside the puzzle"
    },
    {
        "scene_id": "scene_02",
        "scene_type": "RuleTheaterScene",
        "prompt_id": "cpc_wrong_path_tableau",
        "default_style": "velvet_stage_math",
        "suffix": "wrong-path",
        "fallback_asset": "assets/images/panel-2-wrong-path.png",
        "claim_default": "The obvious intuition looks reasonable because it focuses on the wrong unit of counting.",
        "metaphor_default": "a staged arrangement of puzzle objects where a few elegant wrong paths are visible in muted warning accents",
        "relationship_object_default": "puzzle objects arranged in a structured array",
        "comparison_unit_default": "the tempting but incomplete counting logic"
    },
    {
        "scene_id": "scene_03",
        "scene_type": "MechanismGridScene",
        "prompt_id": "cpc_hidden_mechanism_reveal",
        "default_style": "amber_lab_noir",
        "suffix": "mechanism-reveal",
        "fallback_asset": "assets/images/panel-3-mechanism.png",
        "claim_default": "The true mechanism is a hidden growth in relationships or constraints.",
        "metaphor_default": "one highlighted object linking outward into a larger structured field of related objects",
        "relationship_object_default": "tokens, cards, doors, hats, seats, or other puzzle objects relevant to the topic",
        "comparison_unit_default": "the relational structure created as new choices interact with prior ones"
    },
    {
        "scene_id": "scene_04",
        "scene_type": "ProbabilityBoardScene",
        "prompt_id": "cpc_probability_compression_board",
        "default_style": "graphite_editorial",
        "suffix": "probability-board",
        "fallback_asset": "assets/images/panel-4-probability.png",
        "claim_default": "Once the hidden mechanism is counted correctly, the result moves fast and becomes visually decisive.",
        "metaphor_default": "compressed curves, dense traces, or shrinking safe-space regions converging into one dominant result marker",
        "relationship_object_default": "probability traces, grouped comparisons, or structured counters",
        "comparison_unit_default": "the cumulative result of all group-level interactions"
    },
    {
        "scene_id": "scene_05",
        "scene_type": "ReflectiveCloseScene",
        "prompt_id": "cpc_reflective_close_resolution",
        "default_style": "amber_lab_noir",
        "suffix": "reflective-close",
        "fallback_asset": "assets/images/panel-4-probability.png",
        "claim_default": "The ending should elevate the puzzle into a reusable way of thinking.",
        "metaphor_default": "two contrasting note cards or boards that reconcile into one calm final insight",
        "relationship_object_default": "paired conceptual note cards with annotations",
        "comparison_unit_default": "the deeper reasoning frame"
    }
]


def slugify(value: str) -> str:
    lowered = value.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", lowered)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug or "topic"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def parse_scene_config(path):
    if path is None:
        return {}
    payload = load_json(path)
    return payload.get("scenes", payload)


def build_prompt(prompt_template: str, replacements):
    text = prompt_template
    for key, value in replacements.items():
        text = text.replace(f"{{{{{key}}}}}", value)
    return text


def main():
    parser = argparse.ArgumentParser(
        description="Generate per-topic prompt packs and asset plans for the combinatorial paradox cinematic template."
    )
    parser.add_argument("--topic", required=True, help="Topic name for the new puzzle or explainer.")
    parser.add_argument("--slug", help="ASCII slug for output folders. Defaults to a slugified topic.")
    parser.add_argument("--question-hook", required=True, help="Opening question for the new topic.")
    parser.add_argument("--style-variant", help="Optional global style variant override for all scenes.")
    parser.add_argument("--key-number", default="", help="Main numeric anchor, if any.")
    parser.add_argument(
        "--relationship-object",
        default="structured puzzle objects",
        help="Generic object family used across scenes."
    )
    parser.add_argument(
        "--comparison-unit",
        default="the hidden relational structure inside the puzzle",
        help="What the puzzle is really counting."
    )
    parser.add_argument(
        "--closing-takeaway",
        default="The right answer appears when you count relationships instead of isolated points.",
        help="Final reflective takeaway."
    )
    parser.add_argument(
        "--scene-config",
        help="Optional JSON file with per-scene overrides keyed by scene_id or inside a top-level scenes object."
    )
    parser.add_argument(
        "--output-root",
        default=str(TEMPLATE_DIR / "generated"),
        help="Directory for generated prompt pack outputs."
    )
    args = parser.parse_args()

    slug = args.slug or slugify(args.topic)
    template_manifest = load_json(TEMPLATE_DIR / "template_manifest.json")
    prompt_library = load_json(TEMPLATE_DIR / "image_prompt_library.json")
    style_mapping = load_json(TEMPLATE_DIR / "style_to_prompt_mapping.json")
    scene_overrides = parse_scene_config(Path(args.scene_config)) if args.scene_config else {}

    prompt_templates = {item["prompt_id"]: item for item in prompt_library["prompt_templates"]}
    style_variants = style_mapping["style_variants"]
    negative_base = style_mapping["negative_base"]

    output_root = Path(args.output_root)
    plan_dir = output_root / slug
    public_base_dir = f"video-app/public/generated/combinatorial-paradox-cinematic/{slug}"

    assets = []
    rendered_prompts = []

    for blueprint in SCENE_BLUEPRINTS:
        override = scene_overrides.get(blueprint["scene_id"], {})
        style_variant = override.get("style_variant", args.style_variant or blueprint["default_style"])
        if style_variant not in style_variants:
            raise ValueError(f"Unknown style_variant: {style_variant}")

        prompt_template = prompt_templates[blueprint["prompt_id"]]
        scene_claim = override.get("section_claim", blueprint["claim_default"])
        visual_metaphor = override.get("visual_metaphor", blueprint["metaphor_default"])
        relationship_object = override.get("relationship_object", args.relationship_object or blueprint["relationship_object_default"])
        comparison_unit = override.get("comparison_unit", args.comparison_unit or blueprint["comparison_unit_default"])
        key_number = override.get("key_number", args.key_number)
        closing_takeaway = override.get("closing_takeaway", args.closing_takeaway)
        question_hook = override.get("question_hook", args.question_hook)

        replacements = {
            "topic": args.topic,
            "question_hook": question_hook,
            "section_claim": scene_claim,
            "visual_metaphor": visual_metaphor,
            "relationship_object": relationship_object,
            "comparison_unit": comparison_unit,
            "key_number": key_number,
            "closing_takeaway": closing_takeaway,
            "style_modifier": style_variants[style_variant]["prompt_modifier"],
            "negative_base": negative_base
        }

        rendered_prompt = build_prompt(prompt_template["prompt_template"], replacements)
        negative_prompt = build_prompt(prompt_template["negative_prompt"], replacements)
        save_path = f"{public_base_dir}/{blueprint['scene_id']}-{blueprint['suffix']}.png"

        assets.append(
            {
                "scene_id": blueprint["scene_id"],
                "scene_type": blueprint["scene_type"],
                "prompt_id": blueprint["prompt_id"],
                "style_variant": style_variant,
                "question_hook": question_hook,
                "section_claim": scene_claim,
                "visual_metaphor": visual_metaphor,
                "relationship_object": relationship_object,
                "comparison_unit": comparison_unit,
                "key_number": key_number,
                "closing_takeaway": closing_takeaway,
                "save_path": save_path,
                "fallback_asset": blueprint["fallback_asset"],
                "status": "prompt_ready"
            }
        )

        rendered_prompts.append(
            {
                "scene_id": blueprint["scene_id"],
                "scene_type": blueprint["scene_type"],
                "prompt_id": blueprint["prompt_id"],
                "style_variant": style_variant,
                "prompt": rendered_prompt,
                "negative_prompt": negative_prompt,
                "output": {
                    "width": 1920,
                    "height": 1080,
                    "format": "png",
                    "save_path": save_path
                },
                "remotion_mapping": {
                    "scene_id": blueprint["scene_id"],
                    "visual.asset": save_path.replace("video-app/public/", ""),
                    "visual.assetMode": "generated",
                    "visual.fallbackAsset": blueprint["fallback_asset"]
                }
            }
        )

    asset_plan = {
        "template_id": template_manifest["template_id"],
        "example_id": slug,
        "topic": args.topic,
        "orientation": template_manifest["orientation"],
        "default_output": {
            "width": 1920,
            "height": 1080,
            "format": "png",
            "base_dir": public_base_dir
        },
        "assets": assets,
        "remotion_update_rule": "After image generation, write the generated relative path into scene.visual.asset or scene.visual.generatedAssetPath, keep scene.visual.assetMode as generated, and retain the bundled validation panel as fallback only."
    }

    prompt_pack = {
        "template_id": template_manifest["template_id"],
        "topic": args.topic,
        "slug": slug,
        "style_variant_default": args.style_variant,
        "global_prompt_rules": prompt_library["global_prompt_rules"],
        "rendered_prompts": rendered_prompts
    }

    save_json(plan_dir / "asset_generation_plan.json", asset_plan)
    save_json(plan_dir / "scene_prompt_pack.json", prompt_pack)
    save_json(
        plan_dir / "topic_payload.json",
        {
            "topic": args.topic,
            "slug": slug,
            "question_hook": args.question_hook,
            "style_variant": args.style_variant,
            "key_number": args.key_number,
            "relationship_object": args.relationship_object,
            "comparison_unit": args.comparison_unit,
            "closing_takeaway": args.closing_takeaway,
            "scene_overrides_used": bool(scene_overrides)
        }
    )

    print(f"Wrote asset plan: {plan_dir / 'asset_generation_plan.json'}")
    print(f"Wrote prompt pack: {plan_dir / 'scene_prompt_pack.json'}")


if __name__ == "__main__":
    main()
