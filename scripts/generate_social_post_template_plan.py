import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = ROOT / "data" / "templates" / "social_post_overlay_card"
DEFAULT_TEMPLATE_DATA = TEMPLATE_DIR / "example_data.json"
DEFAULT_PROMPTS = TEMPLATE_DIR / "prompt_variants.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def slugify(value: str) -> str:
    lowered = value.strip().lower().encode("ascii", "ignore").decode("ascii")
    lowered = re.sub(r"[^\w\s-]", "", lowered, flags=re.UNICODE)
    lowered = re.sub(r"[\s_-]+", "-", lowered)
    return lowered.strip("-") or "social-post-preview"


def select_prompt(prompt_data: dict, prompt_group: str, prompt_id: str) -> dict:
    prompts = prompt_data.get(prompt_group)
    if not isinstance(prompts, list):
      raise KeyError(f"Prompt group not found: {prompt_group}")
    for item in prompts:
        if item.get("id") == prompt_id:
            return item
    raise KeyError(f"Prompt id not found in {prompt_group}: {prompt_id}")


def build_plan(template_data: dict, prompt_group: str, prompt_item: dict, output_name: str | None) -> dict:
    topic = template_data["meta"]["topic"]
    duration_sec = template_data["meta"]["durationSec"]
    orientation = template_data["meta"]["orientation"]
    style_variant = template_data["meta"]["styleVariant"]
    base_name = output_name or slugify(f"{template_data['meta']['templateId']}-{style_variant}")
    background_src = template_data["background"]["imageSrc"]
    background_name = Path(background_src).stem
    suggested_background_file = f"{base_name}-background.png"
    output_video = f"{base_name}.mp4"

    return {
        "template_id": template_data["meta"]["templateId"],
        "topic": topic,
        "orientation": orientation,
        "duration_sec": duration_sec,
        "style_variant": style_variant,
        "selected_prompt": {
            "group": prompt_group,
            "id": prompt_item["id"],
            "label": prompt_item.get("label"),
            "goal": prompt_item.get("goal"),
            "prompt": prompt_item["prompt"],
        },
        "assets": {
            "current_background_src": background_src,
            "current_background_name": background_name,
            "suggested_background_output": f"video-app/public/images/social-post-preview/{suggested_background_file}",
            "suggested_video_output": f"video-app/out/{output_video}",
        },
        "render": {
            "composition_id": "social-post-preview",
            "command": f"Set-Location ./video-app; npx.cmd remotion render src/index.ts social-post-preview out/{output_video}",
            "silent_video": True,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build a prompt + render plan for the social_post_overlay_card template."
    )
    parser.add_argument(
        "--template-data",
        type=Path,
        default=DEFAULT_TEMPLATE_DATA,
        help="Path to a template JSON data file.",
    )
    parser.add_argument(
        "--prompt-file",
        type=Path,
        default=DEFAULT_PROMPTS,
        help="Path to prompt_variants.json.",
    )
    parser.add_argument(
        "--prompt-group",
        default="background_prompts",
        choices=["background_prompts", "post_style_prompts", "cover_scene_prompts"],
        help="Prompt group to select from.",
    )
    parser.add_argument(
        "--prompt-id",
        required=True,
        help="Prompt id inside the selected prompt group.",
    )
    parser.add_argument(
        "--output-name",
        help="Optional base name for suggested output files.",
    )
    parser.add_argument(
        "--write",
        type=Path,
        help="Optional path to write the generated plan JSON.",
    )
    args = parser.parse_args()

    template_data = load_json(args.template_data)
    prompt_data = load_json(args.prompt_file)
    prompt_item = select_prompt(prompt_data, args.prompt_group, args.prompt_id)
    plan = build_plan(template_data, args.prompt_group, prompt_item, args.output_name)

    output = json.dumps(plan, ensure_ascii=False, indent=2)
    if args.write:
        args.write.write_text(output + "\n", encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
