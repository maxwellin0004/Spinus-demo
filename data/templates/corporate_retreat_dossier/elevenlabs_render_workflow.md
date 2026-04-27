# ElevenLabs 音频生成与成片渲染流程

## 当前已实现版本

| 项 | 内容 |
|---|---|
| 口播供应商 | ElevenLabs |
| 使用脚本 | `scripts/generate_elevenlabs_tts.py` |
| 口播文案 | `data/templates/corporate_retreat_dossier/final_voiceover_zh.txt` |
| 生成音频 | `video-app/public/audio/corporate-retreat-dossier/elevenlabs-voiceover.mp3` |
| 音频时长 | 38.77 秒 |
| BGM | `video-app/public/audio/corporate-retreat-dossier/documentary-pulse.wav` |
| 字幕时间轴 | `data/templates/corporate_retreat_dossier/subtitle_timeline.elevenlabs.estimated.horizontal.json` |
| 字幕状态 | `estimated_after_audio_duration_fit` |
| 成片 | `temp/corporate-retreat-dossier-elevenlabs.mp4` |

## 命令

```powershell
python ./scripts/generate_elevenlabs_tts.py `
  --text-file ./data/templates/corporate_retreat_dossier/final_voiceover_zh.txt `
  --output ./video-app/public/audio/corporate-retreat-dossier/elevenlabs-voiceover.mp3
```

```powershell
Set-Location ./video-app
npx.cmd remotion render src/index.ts corporate-retreat-dossier-preview ../temp/corporate-retreat-dossier-elevenlabs.mp4 --overwrite
```

## Remotion 接入点

| 文件 | 作用 |
|---|---|
| `video-app/src/compositions/CorporateRetreatDossierComposition.tsx` | 接入 ElevenLabs MP3 和 BGM |
| `video-app/src/data/corporateRetreatDossierData.ts` | 保存 scene 起止帧和估算字幕 cue |
| `video-app/public/audio/corporate-retreat-dossier/elevenlabs-voiceover.mp3` | 口播音频 |
| `video-app/public/audio/corporate-retreat-dossier/documentary-pulse.wav` | 低频 BGM |

## 发布级要求

当前版本是可预览成片，但不是逐字强制对齐版本。发布级流程必须改为：

1. 用 `example_voiceover_units.json` 中的 `voice_id` 作为最小口播单元。
2. 调用 ElevenLabs `with-timestamps` endpoint，或在生成 MP3 后运行强制对齐。
3. 把 character/word timestamps 转换成 Remotion frame cue。
4. 写入 `subtitle_timeline.generated.horizontal.json`，并标记 `timing_status=audio_aligned`。
5. 渲染时以 aligned timeline 为准，而不是估算 cue。
