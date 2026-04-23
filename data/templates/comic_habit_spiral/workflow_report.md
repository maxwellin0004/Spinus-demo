# comic_habit_spiral

## 模板概述

`comic_habit_spiral` 是一套用于“心理循环 / 习惯循环 / 情绪逃避循环”题材的漫画叙事视频模板。

它的核心不是信息图，也不是普通口播说明，而是：

- 固定主角
- 固定生活场景
- 多张高质量漫画静帧
- 轻镜头运动
- 底部字幕叙事
- 少量画内大字和思维泡泡

最适合讲：

- 拖延症循环
- 情绪性刷手机
- 熬夜循环
- 完美主义拖延
- 焦虑性回避

不适合讲：

- 纯概念科普
- 交易指标分析
- 强数据表格说明
- 产品功能介绍

## 固定骨架

1. 分屏 Hook
2. 触发场景
3. 机制拆解
4. 代价场景
5. 转折场景
6. 三个动作建议
7. 收束结尾

## 固定美术语法

- 固定主角贯穿全片
- 夜景冷蓝紫 / 日景暖奶油色
- 单幅主图 + 局部 inset 图
- 轻微纸纹和柔和颗粒
- 底部字幕为主，画内大字为辅
- 动作建议段使用漫画翻页式卡组切换

## 可替换变量

- `topic_name`
- `hook_title`
- `hook_subtitle`
- `trigger_scene`
- `core_loop`
- `emotional_cost`
- `turning_point`
- `action_points`
- `close_statement`
- `style_variant`
- `art_assets`

## 标准调用链路

### 1. 新参考片分析
先用 [$video-analysis-table](C:/Users/81422/.codex/skills/video-analysis-table/SKILL.md) 判断：

- 是否属于漫画叙事类
- 是否依赖固定主角和房间场景
- 是否由多张静帧图推进
- 是否适合归入 `comic_habit_spiral`

### 2. 生成脚本
用 [$video-script-maker](C:/Users/81422/.codex/skills/video-script-maker/SKILL.md) 基于这个模板输出 8 个脚本。

重点说明：

- 主题
- 时长
- 平台
- 横屏或竖屏
- 风格变体
- 是否沿用固定主角

### 3. 生成画面展示脚本和制图 prompt
建议在 8 个脚本之外再补两份：

- `visual_direction_script`
- `image_prompt_pack`

因为这套模板强依赖 AI 制图质量。

### 4. 生成图片
优先生成：

- Hook 主图
- 触发场景
- 机制图
- 代价场景
- 转折场景
- 三个动作建议
- 结尾图

通常一条片准备 8 到 12 张关键图最稳。

### 5. 制作与渲染
用 [$video-maker](C:/Users/81422/.codex/skills/video-maker/SKILL.md) 把脚本和图片映射进 `video-app`：

- `ComicSplitHookScene`
- `ComicStoryScene`
- `ComicMechanismScene`
- `ComicTriptychScene`
- `ComicCloseScene`

再渲染成片。

## 示例包

### 1. 拖延症循环
- 路径：`examples/procrastination_loop`
- 说明：当前主示例，配有实际成片

### 2. 情绪性刷手机
- 路径：`examples/emotional_scroll`
- 说明：第二主题验证，用来证明模板可复用

## 当前工程映射

- 组件基础：`video-app/src/components/comic/ComicPrimitives.tsx`
- scene 系统：`video-app/src/scenes/comic`
- 主数据：`video-app/src/data/comicHabitSpiralData.ts`
- 第二主题数据：`video-app/src/data/comicEmotionalScrollData.ts`
- 主 composition：`video-app/src/compositions/ComicHabitSpiralComposition.tsx`
- 第二主题 composition：`video-app/src/compositions/ComicEmotionalScrollComposition.tsx`

## 复用边界

这个模板可以复用：

- scene 系统
- 主角风格
- 漫画分镜语法
- 字幕和镜头节奏
- 动作建议翻页结构

这个模板不应该复用到：

- AI 概念分析视频
- 交易信号视频
- 重图表、重数据可视化的视频

## 当前成熟度判断

现在它已经具备：

- 模板清单
- schema
- style variants
- workflow report
- 示例包
- 第二主题验证
- 已渲染成片

所以它已经不是概念，而是一个可持续复用的漫画叙事模板原型。
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
