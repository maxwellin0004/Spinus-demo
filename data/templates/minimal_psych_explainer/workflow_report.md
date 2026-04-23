# Minimal Psych Explainer

`minimal_psych_explainer` 是一套用于心理学、情绪认知、自我调节、行为模式解释类短视频的极简白底模板。

它的目标不是做强刺激包装，而是用克制、干净、低认知负担的画面，把一个心理机制讲清楚。

## 模板定位

| 项目 | 说明 |
| --- | --- |
| 模板 ID | `minimal_psych_explainer` |
| 中文名 | 极简心理解释模板 |
| 适用赛道 | 心理学、情绪教育、自我调节、行为解释、mental model |
| 推荐平台 | YouTube / TikTok / Bilibili / Xiaohongshu |
| 当前比例 | `16:9` |
| 推荐时长 | `35-60s` |
| 视频类型 | 极简心理科普、心理机制解释、温和行动建议 |
| 不适合内容 | 新闻热点、交易图表、AI 工具展示、强剧情漫画、复杂产品演示 |

## 核心风格

固定风格不是“白底随便放字”，而是：

- 顶部栏目条建立知识类身份
- 中心黑色极简图形承载隐喻
- 小气泡用于呈现内心独白或关键触发句
- 底部分割线建立字幕安全区
- 全局透明字幕承接口播
- 动画克制，以 reveal、symbol swap、bubble fade-in 为主

## 固定结构

标准结构是 8 段：

1. `series_title`
2. `keyword_reel`
3. `statement_1`
4. `statement_2`
5. `statement_3`
6. `statement_4`
7. `method`
8. `close`

其中固定的不是具体文案，而是叙事功能：

- 开场先点出概念
- 用关键词建立问题感
- 用 3-4 个判断拆开心理机制
- 用一个图形隐喻降低理解成本
- 最后收束成 3 个小动作
- 结尾用温和判断安抚，而不是制造焦虑

## 变量字段

| 字段 | 作用 |
| --- | --- |
| `topic_name` | 本期心理概念或行为模式 |
| `style_variant` | 风格变体 |
| `title` | 开场标题页 |
| `reelWords` | 关键词快速展示 |
| `scenes[]` | 主体解释段 |
| `scenes[].icon` | 中心隐喻图形 |
| `scenes[].bubble` | 可选内心气泡 |
| `method` | 3 个行动建议 |
| `close` | 结尾收束句 |
| `voiceover_units` | 可对齐的口播分句 |
| `subtitle_timeline` | TTS 后回填的字幕时间轴 |

## 模板文件

| 文件 | 作用 |
| --- | --- |
| [template_manifest.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/template_manifest.json) | 模板定位、固定规则、scene 模块、输出契约 |
| [template_data_schema.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/template_data_schema.json) | 模板数据结构约束 |
| [style_variants.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/style_variants.json) | 风格变体 |
| [example_data.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/example_data.json) | 反刍思维真实样例 |
| [render_mapping.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/render_mapping.json) | 模板字段到 React/Remotion 的映射 |
| [subtitle_timeline.horizontal.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/subtitle_timeline.horizontal.json) | 横屏字幕时间轴样例 |
| [audio_alignment_protocol.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/audio_alignment_protocol.json) | 音频优先对齐协议 |
| [template_data_audio_schema.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/template_data_audio_schema.json) | 口播、字幕、对齐字段约束 |
| [example_voiceover_units.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/example_voiceover_units.json) | 口播分句样例 |
| [render_mapping.audio_sync.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/render_mapping.audio_sync.json) | 音频到字幕到 Remotion 的映射 |

## 工程实现

当前工程实现位置：

- `video-app/src/compositions/MinimalPsychExplainerComposition.tsx`
- `video-app/src/data/minimalPsychExplainerData.ts`
- `video-app/src/data/minimalPsychExplainerAudio.ts`
- `video-app/src/scenes/psych`

当前 composition：

- `minimal-psych-explainer-preview`

当前参考成片：

- [minimal-psych-explainer-preview-v6-audio-aligned.mp4](/D:/program/ai_video/workflow/video-app/renders/minimal-psych-explainer-preview-v6-audio-aligned.mp4)

## 标准调用流程

### 1. 选择主题

适合的主题示例：

- 反刍思维
- 讨好型人格
- 情绪回避
- 习得性无助
- 完美主义拖延
- 灾难化思维
- 自我攻击
- 信息焦虑

不建议：

- 需要大量新闻素材的主题
- 需要复杂数据图表的主题
- 需要漫画角色连续剧情的主题
- 需要产品界面演示的主题

### 2. 使用 `$video-script-maker` 生成脚本包

推荐指令：

```text
使用 minimal_psych_explainer 模板制作一个心理科普视频。
主题：完美主义拖延
横屏，38-45 秒，风格 clean_white。

请基于 data/templates/minimal_psych_explainer 中的模板资产生成完整脚本包。
必须输出：
- content_script
- storyboard_script
- asset_script
- subtitle_voice_script
- voiceover_script
- audio_plan
- sfx_bgm_map
- visual_script.horizontal
- react_page_script.horizontal
- timeline_script.horizontal
- formal_script.horizontal

注意：
- 口播必须拆成 voiceover_units
- 每个 voiceover_unit 必须绑定 scene_id
- 字幕 timing 只能作为估算，最终需要 TTS 后回填
- 不要做成 ai_concept_analyse、new_signals 或漫画模板风格
```

### 3. 生成 TTS 音频

默认使用 ElevenLabs。

生成后保存到：

```text
video-app/public/audio/minimal-psych/{topic_slug}-voiceover.mp3
```

### 4. 回填字幕时间轴

必须读取真实音频长度。

如果有 forced alignment 或转写时间戳，优先使用它们。

如果没有，可以先按 `voiceover_units[].target_duration_sec` 和文本长度比例分配，再按真实音频总时长缩放。

最终输出：

```text
subtitle_timeline.horizontal.json
```

并同步更新：

```text
video-app/src/data/minimalPsychExplainerAudio.ts
```

### 5. 映射到 Remotion

字段映射规则见：

- [render_mapping.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/render_mapping.json)
- [render_mapping.audio_sync.json](/D:/program/ai_video/workflow/data/templates/minimal_psych_explainer/render_mapping.audio_sync.json)

### 6. 渲染

在 `video-app` 下执行：

```powershell
npx.cmd remotion render src/index.ts minimal-psych-explainer-preview renders\{topic_slug}.mp4
```

## 质量检查

渲染前检查：

- 所有 scene-local 文字不能进入底部字幕安全区
- 气泡必须相对整张画布定位，不能被动画容器 transform 带偏
- 字幕必须透明背景，不要恢复黑色底框
- composition 时长必须覆盖真实音频长度
- 字幕最后一条不能晚于音频太多，也不能提前消失太多
- 图标必须是极简符号，不要变成复杂插画或漫画图

## 复用边界

可以复用：

- `PsychBaseScene`
- `PsychIconFigure`
- `PsychStatementScene`
- `PsychMethodScene`
- `SubtitleTrack`
- `AudioTrackLayer`
- 当前音频对齐协议

不要复用：

- `Reference*Scene` 页面系统
- `Trading*Scene` 图表新闻系统
- `Comic*Scene` 漫画叙事系统

这个模板的辨识度来自极简、留白、符号隐喻和温和解释。如果加入大量卡片、复杂 HUD、新闻图片、漫画主图，就会偏离模板本身。
