# comic_emotional_insight

## 模板概述

`comic_emotional_insight` 是一套用于“情绪循环 / 回避行为 / 心理洞察 / 小动作修复建议”类内容的漫画叙事视频模板。

它的核心不是图表，不是纯口播，也不是 AI 概念分析，而是：

- 固定漫画主角和生活场景
- 用高分辨率单图承接每一个叙事节点
- 用底部字幕讲完整逻辑
- 用画内大字和思维气泡承接情绪瞬间
- 用 3 卡翻页段给出具体可执行动作

最适合的话题：

- 情绪性刷手机
- 焦虑型拖延
- 熬夜回避
- 自我否定循环
- 一难受就想逃
- 情绪先上来、行为后自动跟上的心理机制

不适合的话题：

- 纯概念型 AI 科普
- 交易指标分析
- 强数据图表说明
- 产品功能演示

## 固定骨架

1. 分屏 Hook
2. 触发场景
3. 机制拆解
4. 代价场景
5. 转折场景
6. 三个动作建议
7. 收束结尾

## 固定视觉规则

- 统一漫画画风，避免每段像不同作者的图
- 主图必须是单图级高分辨率画面，不允许再用裁切图硬撑全屏
- 标题大字负责 punch，底部字幕负责完整叙事
- 白色思维气泡要延迟浮现，不允许生硬常驻
- 夜间、书桌、窗边、手机、台灯、床铺这类元素优先保留，用于提升代入感
- Triptych 段固定使用漫画翻页式卡组切换，而不是普通三栏排版

## 可替换变量

- `topic_name`
- `hook_title`
- `hook_subtitle`
- `trigger_scene`
- `mechanism_steps`
- `emotional_cost`
- `turning_point`
- `action_points`
- `close_statement`
- `style_variant`
- `art_asset_plan`

## 当前工程映射

- 组件基础：[ComicPrimitives.tsx](D:/program/ai_video/workflow/video-app/src/components/comic/ComicPrimitives.tsx)
- scene 系统：`D:/program/ai_video/workflow/video-app/src/scenes/comic`
- 示例数据：[comicEmotionalScrollData.ts](D:/program/ai_video/workflow/video-app/src/data/comicEmotionalScrollData.ts)
- composition：[ComicEmotionalScrollComposition.tsx](D:/program/ai_video/workflow/video-app/src/compositions/ComicEmotionalScrollComposition.tsx)
- 当前预览视频：[comic-emotional-scroll-preview-v3.mp4](D:/program/ai_video/workflow/video-app/renders/comic-emotional-scroll-preview-v3.mp4)

## 标准调用步骤

### 1. 先定主题

明确下面几项：

- 主题是什么
- 时长多少秒
- 横屏还是竖屏
- 风格变体选哪一个
- 这次保留哪些固定规则
- 这次允许替换哪些变量

### 2. 生成脚本

使用 [$video-script-maker](C:/Users/81422/.codex/skills/video-script-maker/SKILL.md) 输出完整脚本包。

建议至少明确：

- 使用 `comic_emotional_insight` 模板
- 主题
- 时长
- 横屏
- 风格变体
- 参考这套模板的页面系统，但不要机械复读示例文案

### 3. 生成视觉脚本和制图提示

这套模板强依赖图片质量，所以脚本后建议补两份材料：

- `visual_direction_script`
- `image_prompt_pack`

如果主图不强，这套模板会直接掉档次。

### 4. 生成主图素材

优先准备：

- Hook 左图
- Hook 右图
- trigger 主图
- mechanism 主图
- cost 主图
- turning 主图
- action 1 / 2 / 3 主图
- close 主图

通常一条片最少 8 到 10 张主图。

### 5. 映射到 video-app 渲染

使用 [$video-maker](C:/Users/81422/.codex/skills/video-maker/SKILL.md) 将脚本和主图映射到：

- `ComicSplitHookScene`
- `ComicStoryScene`
- `ComicMechanismScene`
- `ComicTriptychScene`
- `ComicCloseScene`

然后进入 Remotion 渲染。

## 示例包

当前模板内置 1 份主示例：

- `examples/emotional_scroll`

这份示例用于说明：

- 模板如何承接“情绪洞察”类主题
- 主图应该如何拆
- 文案和画面如何配合
- 动作建议如何落到翻页卡组里

## 成熟度判断

这套模板目前已经具备：

- 模板 manifest
- 数据 schema
- 风格 variants
- example data
- workflow report
- 可运行的工程实现
- 已渲染预览视频

所以它已经不是概念，而是一套可以继续复用的正式模板资产。
---

## Audio Alignment Addendum

This template is now audio-alignment aware.

Standard execution order:

1. Generate the 11-script pack with `$video-script-maker`.
2. Ensure `voiceover_script` is split into stable `voiceover_units`.
3. Generate final TTS audio from `voiceover_units`.
4. Read the real audio duration and run forced alignment or transcription timestamps when available.
5. Rebuild `subtitle_timeline.horizontal.json` from real audio timing.
6. Render `video-app` from the aligned subtitle timeline.

Important rule:

- Estimated script timing is allowed for rough previews only.
- Final voiceover videos should not use hand-estimated subtitle frames.
- `render_mapping.audio_sync.json` defines the mapping between `voiceover_units`, final audio, subtitle timeline, and Remotion render data.

Relevant files:

- `audio_alignment_protocol.json`
- `template_data_audio_schema.json`
- `example_voiceover_units.json`
- `render_mapping.audio_sync.json`
