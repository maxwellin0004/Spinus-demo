# literary_embers_quote_montage Workflow Report

## 模板结论
- 模板 ID: `literary_embers_quote_montage`
- 模板定位: 文学书摘情绪蒙太奇（竖屏）
- 参考视频: `D:/document/google/download (15).mp4`
- 输出方向: 720x960, 30fps, 36-50 秒

## 最新封装更新（2026-04-26）
- 已完成模板封装与验证包同步，基于当前最新版成片。
- 书封过门改为真实书籍封面（Douban 页面抓取后本地化）。
- 正文改为图片驱动场景（每段 1 张主图 + 慢移镜头），不再使用程序化占位面板描述。
- 口播沿用 ElevenLabs 对齐流程，字幕时间轴保持“音频生成后回填”。

## 参考视频拆解摘要
- 开头不是直接上书名，而是先用象征性痛感画面抓注意力。
- 约 5 秒切入多书封快速闪现，再锁定主书氛围。
- 正文以单幅情绪图慢移为主，顶部固定书名，底部双语字幕承载信息。
- 场景切换频率约 4-6 秒一段，动效克制，重点靠画面情绪和文案锋利度。

## 新模板抽象
- 固定：痛感 Hook、真实书封过门、顶部书名锁定、图片驱动正文、双语字幕。
- 变量：书名、作者、核心观点、Hook 文案、书封列表、每段背景图、字幕与英文 gloss。
- 复用范围：仅复用字幕轨、音频轨、字体加载、Remotion 基础动效函数，不复用旧模板页面系统。

## 当前实现映射
- Composition: `video-app/src/compositions/LiteraryEmbersValidationComposition.tsx`
- Scenes: `video-app/src/scenes/literaryEmbers/LiteraryEmbersScenes.tsx`
- Data: `video-app/src/data/LiteraryEmbersValidationData.ts`
- Audio/Subtitles: `video-app/src/data/LiteraryEmbersValidationAudio.ts`
- Template assets: `data/templates/literary_embers_quote_montage/`

## 预览输出
- 预览视频: `video-app/out/literary-embers-validation-preview.mp4`

## 图片提示词资产
- `image_prompt_library.json`：按场景给出详细正向/负向提示词、构图和光影约束、质量门槛。
- `image_generation_rules.md`：统一风格规则、禁用项、生成流程、验收清单。
- 在 `validation_pack/asset_script.json` 中新增 `prompt_ref` 字段，可直接追溯到对应场景提示词。

## 批量复用增强资产
- `prompt_variants.json`：同一场景三档提示词（写实/厚涂/胶片 noir）。
- `asset_sources.md`：素材来源台账与替代策略。
- `image_qc_checklist.json`：机器可读质检项。
- `template_render_profile.json`：固定渲染参数与命令。
- `theme_pack_examples/`：2 套可复用主题样例。
- `one_click_pipeline.md`：标准化一键流程说明。
