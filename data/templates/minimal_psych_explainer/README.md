# minimal_psych_explainer

极简心理解释模板。

用于把一个心理概念、情绪机制或行为模式，用白底、黑色极简图形、气泡提示和透明字幕讲清楚。

当前工程已跑通：

- Remotion composition: `minimal-psych-explainer-preview`
- Scene system: `video-app/src/scenes/psych`
- Example topic: `反刍思维`
- Preview render: `video-app/renders/minimal-psych-explainer-preview-v6-audio-aligned.mp4`

使用时优先阅读：

1. `workflow_report.md`
2. `template_manifest.json`
3. `example_data.json`
4. `render_mapping.json`
5. `audio_alignment_protocol.json`

关键规则：

- 不要套用其他旧模板的页面系统。
- 最终成片必须基于真实 TTS 音频回填字幕时间轴。
- 底部字幕区域只允许全局字幕使用。
- 场景内气泡和标题要留在中上部，避免与字幕重合。
