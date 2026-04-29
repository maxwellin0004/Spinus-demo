# Production Plan

## Input Summary

| 项 | 值 |
|---|---|
| 模板 | `sleep_posture_taxonomy_card` |
| 验证主题 | 你是哪种刷手机姿势？ |
| 方向 | 横屏 16:9 |
| 目标时长 | 42 秒 |
| 口播 | 已生成 ElevenLabs 中文口播 |
| BGM | 已生成轻背景音 |
| 旧模板骨架 | 不复用 |

## Scene Build Plan

| scene | 新建组件 | 页面母版 | 说明 |
|---|---|---|---|
| 0-5 秒 | `TaxonomyOpenerScene` | `WhiteBoardTaxonomyMaster` | 建立白底分类测试题 |
| 5-10 秒 | `PostureStripScene` | `IconRowComparisonMaster` | 主体不切换，字幕推进 |
| 10-37 秒 | `CaptionRevealScene` | `BottomNarrationBandMaster` | 逐个蓝圈高亮并解释 |
| 37-42 秒 | `ResultPromptScene` | `BottomNarrationBandMaster` | 评论区 CTA |

## Asset Mapping Plan

| asset | 状态 | 映射 |
|---|---|---|
| 6 张动漫人物 PNG | 已生成 | `video-app/public/images/sleep-posture-taxonomy/` |
| 字体 | already local | `THEME.fonts.bodyZh` fallback |
| BGM | 已生成 | `audio/sleep-posture-taxonomy/soft-pulse.wav` |
| 口播音频 | 已生成 | `audio/sleep-posture-taxonomy/voiceover.mp3` |
| 字幕时间轴 | 已按音频预览回填 | `subtitle_timeline.generated.horizontal.json` |

## Timeline and Animation Plan

| 时间段 | 页面转场 | 元素动效 | 字幕 |
|---|---|---|---|
| 0-5 秒 | 无切页 | 整页淡入 + 慢推 | Hook 字幕淡入 |
| 5-10 秒 | 无切页 | 人物行常驻 | 字幕替换 |
| 10-37 秒 | 无切页 | 当前分类蓝圈 + 微上浮 | 每类一句 |
| 37-42 秒 | 无切页 | 高亮消失 | CTA 停留 |

## Subtitle and Voice Sync Plan

| 步骤 | 要求 |
|---|---|
| 粗预览 | 当前使用 `estimated_after_audio_duration_fit` |
| 正式渲染 | 如更换口播，必须重新回填字幕时间轴 |
| 回填 | 每条 cue 必须有 `voiceId` 和 `visualSectionId` |
| 校验 | MP4 必须包含音轨；字幕不能遮挡人物行 |

## Audio Track Plan

| 层 | 策略 |
|---|---|
| voiceover | ElevenLabs 中文口播，音量 1 |
| BGM | 轻氛围底噪，音量 0.08 |
| SFX | 当前关闭，后续可加高亮 tick |
| ducking | 口播时 BGM 降到 35%，当前由配置保留规则 |

## Review Checklist

| 检查项 | 标准 |
|---|---|
| 风格隔离 | 不导入旧模板 scenes |
| 参考贴近度 | 白底、蓝题、分类插画、底部黑字 |
| 人物质量 | 使用动漫人像 PNG，不再使用火柴人 |
| 节奏 | 主要靠字幕推进 |
| 可复用性 | 替换 topic/items/images/timeline/audio 即可生成新主题 |
| 音频 | MP4 包含 AAC stereo 48kHz 音轨 |

## Render Execution Notes

```powershell
Set-Location .\video-app
npx remotion render src/index.ts sleep-posture-taxonomy-validation-preview ..\data\jobs\sleep-posture-taxonomy-validation-preview.mp4
```

已验证输出：

- `data/jobs/sleep-posture-taxonomy-validation-preview.mp4`
- 时长约 `42.05s`
- 音轨：AAC stereo 48kHz
