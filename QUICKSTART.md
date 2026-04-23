# Quickstart

本文档用于在新电脑上快速接手 `workflow` 仓库，并让 Codex 或人工用户尽快进入可工作状态。

所有路径默认都以“仓库根目录”为基准，统一使用相对路径。

## 1. 仓库根目录

以下文档中的相对路径，默认都相对于当前仓库根目录。

例如：

- `video-app/`
- `scripts/analyze_video.py`
- `project-skills/workflow-codex/`

## 2. 运行环境

目标机器需要可直接调用以下程序：

- Python
- Node.js
- npm
- ffmpeg

建议先验证：

```powershell
python --version
npm --version
ffmpeg -version
```

## 3. 本地配置

至少检查这些文件：

- `config.py`
- `config.local.json`
- `elevenlabs_config.py`

重点确认：

- 模型 API key
- 模型 API URL
- mock 开关
- ElevenLabs key、voice id、model id

注意：

- `config.local.json` 是本地配置，不建议上传公开仓库
- `elevenlabs_config.py` 当前仍然是硬编码配置

## 4. 安装 `video-app` 依赖

必须在 `video-app/` 目录中安装，不要在仓库根目录执行 `npm install`。

正确命令：

```powershell
Set-Location ./video-app
npm install
```

安装结果会写入：

```text
video-app/node_modules/
```

当前 `video-app/package.json` 中的主要依赖包括：

- `@react-three/drei`
- `@react-three/fiber`
- `@react-three/postprocessing`
- `@remotion/cli`
- `@remotion/tailwind-v4`
- `@remotion/transitions`
- `clsx`
- `gsap`
- `lucide-react`
- `motion`
- `postprocessing`
- `react`
- `react-dom`
- `remotion`
- `tailwindcss`
- `three`
- `zod`

当前主要开发依赖包括：

- `@remotion/eslint-config-flat`
- `@types/react`
- `@types/web`
- `eslint`
- `prettier`
- `typescript`

安装完成后建议验证：

```powershell
Set-Location ./video-app
npm run build
```

如果需要预览：

```powershell
Set-Location ./video-app
npm run dev
```

## 5. 验证 Python 分析链路

从仓库根目录执行：

```powershell
python ./scripts/analyze_video.py job_demo manual_download4 auto data
```

执行前提：

- `data/source_videos/manual_download4/source.mp4` 存在
- `data/source_videos/manual_download4/meta.json` 存在
- API 可用，或 mock 模式开启

## 6. 安装项目附带 skills

仓库附带的 project skills 位于：

```text
project-skills/
```

建议复制到目标机器的 Codex skill 目录，例如：

```text
~/.codex/skills/
```

当前应安装的 skills：

- `workflow-codex`
- `workflow-video-analysis-table`
- `workflow-template-video-2`
- `workflow-short-video-script-creator`
- `workflow-video-script-maker`
- `workflow-video-maker`
- `workflow-remotion-render`
- `workflow-tts-pipeline`

## 7. Skill 工作流映射

- `workflow-codex`
  - 仓库总导航，适合先理解目录和入口
- `workflow-video-analysis-table`
  - 适合参考视频表格式拆解
- `workflow-template-video-2`
  - 适合结构化 Stage 2 风格拆解与总结
- `workflow-short-video-script-creator`
  - 适合快速生成短视频脚本和提示词草稿
- `workflow-video-script-maker`
  - 适合生成完整生产脚本包
- `workflow-video-maker`
  - 适合把脚本包映射成仓库内实现计划
- `workflow-tts-pipeline`
  - 适合 ElevenLabs 配音、字幕时间轴和音频配置导出
- `workflow-remotion-render`
  - 适合 `video-app/` 中的预览、构建和渲染

推荐调用顺序：

1. `workflow-codex`
2. `workflow-video-analysis-table`
3. `workflow-template-video-2`
4. `workflow-short-video-script-creator`
5. `workflow-video-script-maker`
6. `workflow-video-maker`
7. `workflow-tts-pipeline`
8. `workflow-remotion-render`

## 8. 交给另一台电脑上的 Codex 的建议

建议先让目标机器上的 Codex 阅读：

1. `QUICKSTART.md`
2. `INSTALL_FOR_NEW_MACHINE.md`
3. `README.md`
4. `AGENTS.md`
5. `config.py`
6. `scripts/analyze_video.py`
7. `video-app/package.json`

## 9. 最小完成标准

当以下条件满足时，可认为新机器已基本可用：

- `python --version` 正常
- `npm --version` 正常
- `ffmpeg -version` 正常
- `video-app/node_modules/` 已生成
- `npm run build` 成功
- 目标机器已复制所需 skills
- `scripts/analyze_video.py` 可以完成一次验证运行
