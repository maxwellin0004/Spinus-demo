# Image Generation Rules - philosophy_montage_doctrine

## Core
- 画幅固定 16:9（1920x1080）。
- 图片内禁止可读文字、logo、水印、UI 截图。
- 每个概念词一张独立背景图，不能复用同底图。
- 斯多葛主义画面必须体现“外界风暴 + 内在稳定”。

## Opener Rules
- 先单独 intro card，再切概念词。
- 概念图切换节奏快，但每张图都要语义明确。
- 不做廉价抽象纹理底图，必须有人物/场景语义锚点。

## Body Rules
- 每段 1 张 hero 图，字幕承载解释，不在图上堆字。
- 镜头慢移下仍要保证主体稳定可读。
- 底部字幕区（约 15% 高度）不得放关键脸部和手势细节。

## Quality Checklist
- 人物解剖正常（眼睛、手部、肢体）。
- 明度足够，移动端不发灰。
- 语义吻合该段文稿（不是随机美图）。
- 无文字污染。

## Generation Workflow
1. 按 `image_prompt_library.json` 挑对应场景 prompt。
2. 每场至少生成 4 张候选。
3. 用本规则筛选 1 张最终图。
4. 写入 `example_data.json` 对应 `scenes[].image`。
