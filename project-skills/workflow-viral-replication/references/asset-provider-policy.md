# Asset Provider Policy

Use this reference when a replication plan needs generated or replacement visuals.

## Provider Values

- `local_asset`: bind existing files from `assets/images` or `video-app/public`.
- `local_api`: call a local image generation API.
- `openai_image`: call the configured OpenAI image model.
- `svg_fallback`: generate a local placeholder SVG so render can continue.
- `auto`: try providers in a configured order.

Default `auto` order:

```text
local_asset -> local_api -> openai_image -> svg_fallback
```

## Local API Contract

Recommended request:

```json
{
  "prompt": "cinematic educational still...",
  "negativePrompt": "text, watermark, logo, blurry",
  "width": 1280,
  "height": 720,
  "styleVariant": "warm_paper",
  "seed": 12345,
  "outputFormat": "png"
}
```

Recommended response:

```json
{
  "imageBase64": "...",
  "mimeType": "image/png",
  "model": "local-sdxl",
  "seed": 12345
}
```

`imagePath` is also acceptable if the server returns an accessible local path.

## Manifest Rule

Regardless of provider, normalize output into the job asset manifest:

```json
{
  "slotId": "hook_inset",
  "source": "local_api",
  "path": "data/jobs/<job_id>/assets/hook_inset.png",
  "renderSrc": "/generated-jobs/<job_id>/assets/hook_inset.png",
  "promptPath": "data/jobs/<job_id>/assets/prompts/hook_inset.txt",
  "status": "generated"
}
```

Remotion should not need to know the provider.

If the job is running a non-default style variant, keep the style suffix consistent in the generated asset folder and manifest paths, for example `generated-jobs/<job_id>/<variant>.<style>/...`.

## Failure Behavior

Image generation failure should not block the whole pipeline unless the user explicitly requests strict mode.

On failure:

1. log provider, slot id, and error
2. mark the slot `failed_fallback`
3. generate `svg_fallback`
4. keep renderable output
5. surface the slot for human replacement
