# 企业撤退档案片 Workflow Report

## 模板判断

- 参考视频属于横屏企业/财经纪录片式案例拆解：真实地点素材、低位白色字幕、少量数据卡、城市/工厂/会议室蒙太奇。
- 不适合归入现有模板：现有模板多为 AI 概念解释、漫画心理、交易指标、文学蒙太奇或哲学图像蒙太奇；页面结构、镜头语法和视觉风格都不一致。
- 必须新建模板：是。
- 必须新建 scene 系统：是。
- 只能复用基础能力：字幕组件、音频组件、字体、图片加载、Remotion 基础动画。

## 新模板核心语法

- 风格语法：冷调真实影像 + 档案卡 + 底部强描边字幕 + 企业风险叙事。
- 页面系统：暗场大标题、统计档案卡、证据蒙太奇、会议决策蒙太奇、最终结论账本。
- 动画/转场：暗场标题压入、横向慢移、短闪切、证据标签逐条显现、结论卡推进。

## 当前实现

| 模块 | 状态 | 文件 |
|---|---|---|
| Remotion composition | 已实现 | `video-app/src/compositions/CorporateRetreatDossierComposition.tsx` |
| 新 scene 系统 | 已实现 | `video-app/src/scenes/corporateRetreatDossier/DossierScenes.tsx` |
| 分镜数据 | 已实现 | `video-app/src/data/corporateRetreatDossierData.ts` |
| AI 图片素材 | 已生成并接入 | `video-app/public/images/corporate-retreat-dossier/` |
| ElevenLabs 口播 | 已生成并接入 | `video-app/public/audio/corporate-retreat-dossier/elevenlabs-voiceover.mp3` |
| BGM | 已生成并接入 | `video-app/public/audio/corporate-retreat-dossier/documentary-pulse.wav` |
| 带音频成片 | 已渲染 | `temp/corporate-retreat-dossier-elevenlabs.mp4` |

## ElevenLabs 口播流程

| 步骤 | 执行 |
|---|---|
| 1. 写入口播文案 | `data/templates/corporate_retreat_dossier/final_voiceover_zh.txt` |
| 2. 调用 ElevenLabs | `python ./scripts/generate_elevenlabs_tts.py --text-file ./data/templates/corporate_retreat_dossier/final_voiceover_zh.txt --output ./video-app/public/audio/corporate-retreat-dossier/elevenlabs-voiceover.mp3` |
| 3. 读取音频时长 | ffmpeg 检测为 `38.77s` |
| 4. 回填字幕 | `subtitle_timeline.elevenlabs.estimated.horizontal.json` |
| 5. 渲染成片 | `npx.cmd remotion render src/index.ts corporate-retreat-dossier-preview ../temp/corporate-retreat-dossier-elevenlabs.mp4 --overwrite` |

## 音频同步状态

- 当前成片是带 ElevenLabs 口播和 BGM 的可预览版本。
- 当前字幕时间轴状态为 `estimated_after_audio_duration_fit`：已根据真实音频总时长适配，但不是逐字/逐句强制对齐。
- 发布级版本应使用 ElevenLabs `with-timestamps` endpoint 或强制对齐工具生成 `subtitle_timeline.generated.horizontal.json`，并标记 `audio_aligned`。

## 仍需注意

- 当前图片为 AI 生成素材，不是网络公开素材或真实新闻素材；用于模板验证和可视化预览。
- 如果未来制作事实类发布视频，需要替换为有来源记录的真实素材，并在模板资产中补充 `asset_sources.md`。
