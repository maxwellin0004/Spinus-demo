# One-Click Pipeline - literary_embers_quote_montage

## 目标
把“换主题”变成标准化流水：
`换数据 -> 生成图 -> 生成音频 -> 回填字幕 -> 渲染`。

## 输入
- 模板目录：`data/templates/literary_embers_quote_montage/`
- 主题数据：`example_data.json` 或 `theme_pack_examples/*.json`

## Step 1: 选择主题数据
1. 复制一个样例到工作文件，例如：
   - `theme_pack_examples/example_data.theme_1984.json`
2. 替换书名、文案、scene_image 路径。

## Step 2: 生成/更新图片
1. 读取 `image_prompt_library.json` + `prompt_variants.json`。
2. 每个场景生成候选图（建议每场 4 张）。
3. 使用 `image_qc_checklist.json` 做筛选。
4. 落盘到：`video-app/public/images/literary-embers/`。

## Step 3: 生成 ElevenLabs 音频
1. 准备 voiceover units。
2. 运行 ElevenLabs 生成脚本（项目现有流程）。
3. 产出 mp3 到：
   - `video-app/public/audio/literary-embers/`

## Step 4: 回填字幕时间轴
1. 根据音频时间戳生成 `subtitle_timeline.generated.vertical.json`。
2. 更新 `video-app/src/data/LiteraryEmbersValidationAudio.ts` 对应 cue。
3. 确认 timing_status = `aligned`。

## Step 5: 渲染预览
在 `video-app/` 执行：
```powershell
npx remotion render literary-embers-validation-preview out/literary-embers-validation-preview.mp4
```

## Step 6: 出片前复核
- 用 `image_qc_checklist.json` 全量复核。
- 确认 bridge 使用真实书封。
- 确认音频语言、字幕语言、文稿语言一致。

## 推荐自动化封装（后续可加）
可新增脚本 `scripts/run_literary_embers_pipeline.py`，把上述 6 步串起来。
