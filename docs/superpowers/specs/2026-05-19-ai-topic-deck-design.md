# AI Topic Deck Design

## Goal

Make the creator hot-trends "AI 选题推荐" area show real AI-generated topic cards instead of lightly rewritten hot-post cards. Hot posts are only evidence. The final visible card uses an AI title, AI reason, and AI-generated cover.

## Decisions

- Generate 12 AI topic cards for each direction, platform, keyword, and hot-post sample signature.
- Display the 12 cards as 4 batches of 3 cards.
- Cache the 12-card deck. Reuse it unless the hot-post sample signature changes or the user clicks "重新生成 AI 选题".
- Generate cover images with `gpt-image-2` per visible batch. Cache every generated image by prompt/model.
- Do not fall back to hot-post images on AI cover loading or failure. Show an AI placeholder instead.
- If AI topic generation fails, show a clear failure state with a "重新生成 AI 选题" button.

## Data Flow

1. Detail API loads current hot posts and comments.
2. It computes a sample signature from the selected hot-post ids.
3. It reads the AI topic deck cache for that signature.
4. On cache miss, it asks the text model for 12 new topic cards.
5. The frontend renders the current 3-card batch and requests generated covers for those cards.
6. The regenerate API forces a new 12-card deck and returns updated detail data.

## Error Handling

- Text AI failure stores a failed deck row and returns no fake AI cards.
- Image AI failure stores a failed image row and the UI keeps an AI failure placeholder.
- Existing rule/snapshot data remains available for other panels, but does not masquerade as AI topic cards.
