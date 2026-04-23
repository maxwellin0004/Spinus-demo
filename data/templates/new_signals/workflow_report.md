**Trading Indicator Warning Board**

`new_signals` 是一套用于交易指标预警、图表案例拆解、趋势衰减判断和风险边界说明的模板。
它不属于 `ai_concept_analyse`，因为它的核心不是概念解释，而是：

- 新闻或热点引入
- 后果先行的案例冲击
- 图表和指标机制说明
- 多案例对照
- 风险边界收束

---

**模板定位**

| 项目 | 说明 |
| --- | --- |
| 模板 ID | `new_signals` |
| 适用赛道 | 交易教育、技术指标、市场预警、图表复盘 |
| 适用平台 | YouTube / TikTok / Bilibili |
| 推荐比例 | `16:9` |
| 推荐时长 | `60-90s` |
| 适用内容 | `MACD 背离`、`RSI 顶背离`、`假突破`、`布林带收口`、`趋势衰减` |
| 不适合内容 | AI 概念解释、工具科普、产品介绍、人物故事 |

---

**固定骨架**

这套模板的固定结构是：

1. `News Context`
2. `Case Shock`
3. `Indicator Mechanism`
4. `Chart Case 1`
5. `Chart Case 2`
6. `Chart Case 3`
7. `Checklist`
8. `Risk Close`

固定的不是具体文案，而是：

- 新闻或热点引入逻辑
- 后果先于定义
- 图表证据主导
- 三案例展开
- 判断顺序页
- 风险边界收束

---

**变量字段**

| 字段 | 作用 |
| --- | --- |
| `topic_name` | 指标或交易主题 |
| `topic_alias` | 更口语化的辅助定义 |
| `style_variant` | 风格变体 |
| `news_pack` | Codex 先抓到的新闻素材包 |
| `news_context` | 映射后的新闻开场页面数据 |
| `hook` | 案例冲击页 |
| `mechanism` | 指标机制页 |
| `cases` | 3 个图表案例 |
| `checklist` | 判断顺序 |
| `close` | 风险边界结论 |
| `audio_profile` | 口播、BGM、SFX 和字幕同步偏好 |

---

**模板文件结构**

| 文件 | 作用 |
| --- | --- |
| [template_manifest.json](/D:/program/ai_video/workflow/data/templates/new_signals/template_manifest.json) | 模板说明、场景模块定义、固定规则 |
| [template_data_schema.json](/D:/program/ai_video/workflow/data/templates/new_signals/template_data_schema.json) | 模板输入数据结构 |
| [style_variants.json](/D:/program/ai_video/workflow/data/templates/new_signals/style_variants.json) | 风格变体 |
| [subtitle_timeline.horizontal.json](/D:/program/ai_video/workflow/data/templates/new_signals/subtitle_timeline.horizontal.json) | 模板级字幕规则 |
| [examples/macd_warning](/D:/program/ai_video/workflow/data/templates/new_signals/examples/macd_warning) | 完整生产级示例 |
| [examples/rsi_warning/example_data.json](/D:/program/ai_video/workflow/data/templates/new_signals/examples/rsi_warning/example_data.json) | 第二主题验证示例 |

---

**标准工作流**

这套模板推荐按 7 个阶段使用。

### 1. 先拆参考视频

先用 [$video-analysis-table](C:/Users/81422/.codex/skills/video-analysis-table/SKILL.md) 拆解参考视频。

重点看：

- 新闻或热点段怎么开
- 后果数字怎么打
- 图表案例怎么切
- 节奏如何从新闻过渡到指标机制
- 结尾如何做风险边界

### 2. 由 Codex 直接抓新闻素材

这一步非常重要，建议放在脚本之前。

Codex 应先获取与当前主题相关的新闻素材，并整理成 `news_pack`。

推荐至少输出：

- `headline`
- `source`
- `date`
- `quote`
- `event_summary`
- `why_it_matters`
- `image_leads`
- `image_urls`

### 3. 生成模板数据

根据 [template_data_schema.json](/D:/program/ai_video/workflow/data/templates/new_signals/template_data_schema.json) 填一份新的主题数据。

可以参考：

- [macd_warning/example_data.json](/D:/program/ai_video/workflow/data/templates/new_signals/examples/macd_warning/example_data.json)
- [rsi_warning/example_data.json](/D:/program/ai_video/workflow/data/templates/new_signals/examples/rsi_warning/example_data.json)

### 4. 生成 8 个视觉脚本 + 3 个音频脚本

再用 [$video-script-maker](C:/Users/81422/.codex/skills/video-script-maker/SKILL.md) 基于新的模板数据生成脚本。

建议输出：

- `content_script`
- `storyboard_script`
- `asset_script`
- `subtitle_voice_script`
- `voiceover_script`
- `audio_plan`
- `sfx_bgm_map`
- `visual_script.horizontal`
- `react_page_script.horizontal`
- `timeline_script.horizontal`
- `formal_script.horizontal`

### 5. 生成 ElevenLabs 口播音频

根据 `voiceover_script` 和 `audio_profile`，用 ElevenLabs 生成旁白音频。

建议至少明确：

- `voice_id`
- `model_id`
- `output_format`
- `voice_settings`

### 6. 制作方案与实现

再用 [$video-maker](C:/Users/81422/.codex/skills/video-maker/SKILL.md) 输出制作方案，或者直接落到 `video-app`。

制作阶段应优先复用：

- `video-app/src/scenes/trading`
- `video-app/src/compositions/NewSignalsComposition.tsx`
- `video-app/src/data/newSignalsData.ts`

### 7. 渲染预览

如果新闻图、人物图、图表截图、本地素材和音频都齐全，就直接在 `video-app` 渲染预览视频。

当前参考成片：

- [macd-warning-preview-v4.mp4](/D:/program/ai_video/workflow/video-app/renders/macd-warning-preview-v4.mp4)

---

**标准调用方式**

### 调用方式 1：先抓新闻，再做模板数据和视频

```text
使用 new_signals 模板制作一个视频。
主题：RSI 信号和策略
时长：70 秒
方向：横屏
风格：dark_warning_orange

要求：
- 先由 Codex 获取相关新闻素材，输出一份 news_pack
- 再基于这份 news_pack 生成 example_data
- 再使用 $video-script-maker 生成 8 个视觉脚本和 3 个音频脚本
- 口播使用 ElevenLabs
- 最后使用 $video-maker 输出制作方案，并尽量渲染预览视频
```

### 调用方式 2：先拆参考片，再判断是否归入模板

```text
请先使用 $video-analysis-table 拆解这条交易参考视频。
然后判断它是否适合归入 new_signals。
如果适合：
- 先由 Codex 获取与该主题相关的新闻素材并生成 news_pack
- 再按这个模板生成新的 example_data
- 再使用 $video-script-maker 生成 8 个视觉脚本和 3 个音频脚本
- 口播使用 ElevenLabs
- 最后使用 $video-maker 输出制作方案并尝试渲染预览
```

---

**最小调用链路**

1. 准备一个新主题
2. 先抓一份 `news_pack`
3. 再写一份 `example_data`
4. 生成 8 个视觉脚本和 3 个音频脚本
5. 用 ElevenLabs 生成口播
6. 输出制作方案
7. 渲染预览视频

一句话版本：

```text
使用 new_signals 模板，主题是假突破，横屏 70 秒。
先抓新闻素材生成 news_pack，再生成 data、8 个视觉脚本、3 个音频脚本、ElevenLabs 口播和制作方案，并尝试渲染预览。
```
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
