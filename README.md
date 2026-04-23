# Workflow

`workflow` 是一个面向 AI 视频生产的本地工作区，主要由三部分组成：

- Python 脚本层：负责视频样本分析、抽帧、音频提取、转写、TTS 生成与时间轴对齐。
- Remotion 渲染层：位于 `video-app/`，负责将模板数据、字幕、音频和静态素材渲染为视频。
- 数据与模板层：位于 `data/`、`assets/`、`video-app/public/`，负责输入视频、模板协议、字体、图片、音频和中间产物。

本文档统一使用仓库相对路径。

## 目录结构

根目录关键内容如下：

- `config.py`
  - 顶层模型配置与本地配置读取入口。
- `config.local.json`
  - 本地运行配置文件。
- `elevenlabs_config.py`
  - ElevenLabs TTS 配置。
- `scripts/`
  - Python 主工作流脚本目录。
- `data/`
  - 输入数据、预处理产物、分析结果、模板协议、任务目录。
- `assets/`
  - 仓库共享字体和图片资源。
- `video-app/`
  - Remotion + React + TypeScript 视频模板工程。
- `web-video-console/`
  - 静态控制台原型，目前不是正式后端。
- `tools/`
  - 本地工具目录。

## 核心工作流

### 1. 样本分析

典型路径：

1. 准备 `data/source_videos/<source_id>/source.mp4`
2. 准备 `data/source_videos/<source_id>/meta.json`
3. 运行 `scripts/analyze_video.py`
4. 生成：
   - `data/preprocess/<source_id>/...`
   - `data/jobs/<job_id>/...`
   - `data/analyses/...`

### 2. 语音与字幕时间轴

典型路径：

1. 准备模板 voiceover 文本或 TS voiceover units
2. 使用 ElevenLabs 脚本生成音频
3. 生成字幕时间轴 JSON 或 TS audio config
4. 将产物用于 `video-app/src/data/` 或 `video-app/public/audio/`

### 3. 视频预览与渲染

典型路径：

1. 进入 `video-app/`
2. 安装依赖
3. 运行 Remotion 预览或构建
4. 选择对应 composition 输出视频

## 环境依赖

通常需要：

- Python
- Node.js
- npm
- ffmpeg

## 常用命令

### 安装 `video-app` 依赖

```powershell
Set-Location ./video-app
npm install
```

### 启动 Remotion 预览

```powershell
Set-Location ./video-app
npm run dev
```

### 构建 Remotion 工程

```powershell
Set-Location ./video-app
npm run build
```

### 运行视频分析脚本

```powershell
python ./scripts/analyze_video.py <job_id> <source_id> <mode> <data_root>
```

示例：

```powershell
python ./scripts/analyze_video.py job_demo manual_download4 auto data
```

## 仓库附带的 Skills

此仓库在 `project-skills/` 中附带了一组项目内 skill，用于让另一台电脑上的 Codex 更快接住当前工作流。

当前附带的 skill 有：

- `workflow-codex`
- `workflow-video-analysis-table`
- `workflow-template-video-2`
- `workflow-short-video-script-creator`
- `workflow-video-script-maker`
- `workflow-video-maker`
- `workflow-remotion-render`
- `workflow-tts-pipeline`

推荐使用阶段：

- 上传视频并拆解分析：
  - `workflow-codex`
  - `workflow-video-analysis-table`
  - `workflow-template-video-2`
- 生成短视频试拍脚本：
  - `workflow-short-video-script-creator`
- 生成完整生产脚本包：
  - `workflow-video-script-maker`
- 把脚本包落成仓库内实现方案：
  - `workflow-video-maker`
- 生成配音、字幕时间轴和音频配置：
  - `workflow-tts-pipeline`
- 在 `video-app/` 中完成预览、构建和渲染：
  - `workflow-remotion-render`

推荐整体顺序：

1. `workflow-codex`
2. `workflow-video-analysis-table`
3. `workflow-template-video-2`
4. `workflow-short-video-script-creator`
5. `workflow-video-script-maker`
6. `workflow-video-maker`
7. `workflow-tts-pipeline`
8. `workflow-remotion-render`

## 建议先读

如果是在 Codex 中打开此仓库，建议优先阅读：

1. `AGENTS.md`
2. `QUICKSTART.md`
3. `INSTALL_FOR_NEW_MACHINE.md`
4. `config.py`
5. `scripts/analyze_video.py`
6. `video-app/package.json`
