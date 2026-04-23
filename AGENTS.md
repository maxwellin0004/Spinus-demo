# Agents Guide

本文档面向进入该仓库工作的 Codex/代理。

目标是尽快让代理理解：

- 这个仓库的核心职责
- 优先阅读哪些文件
- 哪些目录是源码，哪些目录是产物
- 常见任务应该从哪里开始

全文统一使用仓库相对路径。

## 1. 仓库定位

这是一个 AI 视频工作流仓库，核心由三层组成：

- Python 工作流层
  - 负责样本视频分析、抽帧、音频提取、转写、模型调用、TTS 生成与时间轴对齐
- Remotion 渲染层
  - 位于 `video-app/`
- 数据与模板层
  - 位于 `data/`、`assets/`、`video-app/public/`

## 2. 首次探索顺序

推荐按这个顺序理解项目：

1. `README.md`
2. `QUICKSTART.md`
3. `config.py`
4. `scripts/analyze_video.py`
5. `scripts/api_client.py`
6. `video-app/package.json`
7. `video-app/src/Root.tsx`
8. `video-app/src/compositions/`
9. `video-app/src/scenes/`
10. `data/templates/`

如果任务涉及配音或字幕时间轴，再继续看：

1. `scripts/generate_elevenlabs_tts.py`
2. `scripts/generate_elevenlabs_tts_with_timestamps.py`
3. `video-app/src/data/`

## 3. 目录职责

### 核心源码目录

- `scripts/`
- `video-app/src/`
- `video-app/public/`
- `assets/`
- `data/templates/`

### 输入/输出数据目录

- `data/source_videos/`
- `data/preprocess/`
- `data/jobs/`
- `data/analyses/`
- `data/audio_scripts/`

### 原型目录

- `web-video-console/`
  - 静态 mock 控制台，不是正式后端

### 缓存/中间目录

通常无需优先关注：

- `temp/`
- `tmp/`
- `tmp_video_analysis/`
- `__pycache__/`
- `video-app/build/`

## 4. 关键入口

### 视频分析主入口

- `scripts/analyze_video.py`

命令格式：

```powershell
python ./scripts/analyze_video.py <job_id> <source_id> <mode> <data_root>
```

### Remotion 工程入口

- `video-app/package.json`
- `video-app/src/Root.tsx`

常用命令：

```powershell
Set-Location ./video-app
npm install
npm run dev
npm run build
```

### TTS / 时间轴入口

- `scripts/generate_elevenlabs_tts.py`
- `scripts/generate_elevenlabs_tts_with_timestamps.py`

## 5. 常见任务与推荐路径

### 任务：分析参考视频

优先阅读：

1. `scripts/analyze_video.py`
2. `config.py`
3. `data/source_videos/`
4. `data/preprocess/`
5. `data/analyses/`

### 任务：修改视频模板或画面结构

优先阅读：

1. `video-app/src/compositions/`
2. `video-app/src/scenes/`
3. `video-app/src/data/`
4. `video-app/public/`
5. `assets/`

### 任务：修改字幕、音轨、配音对齐

优先阅读：

1. `video-app/src/components/video/SubtitleTrack.tsx`
2. `video-app/src/components/video/AudioTrackLayer.tsx`
3. `video-app/src/lib/audioTypes.ts`
4. `scripts/generate_elevenlabs_tts_with_timestamps.py`
5. `video-app/src/data/*Audio.ts`

## 6. 修改约束

- 优先修改源码，不修改构建产物
- 不要优先编辑 `video-app/build/`
- 不要把真实密钥写入仓库文件
- 不要依赖 `tmp/`、`temp/`、`tmp_video_analysis/` 作为稳定输入
- 对 `data/jobs/` 和 `data/analyses/` 的改动要谨慎

## 7. 环境与运行提醒

依赖以下运行环境：

- Python
- Node.js
- npm
- ffmpeg

注意：

- `scripts/analyze_video.py` 当前通过系统 PATH 查找 `ffmpeg`
- `video-app/` 需要先执行 `npm install`

## 8. 如果在新电脑上继续工作

建议先做：

1. 阅读 `QUICKSTART.md`
2. 阅读 `INSTALL_FOR_NEW_MACHINE.md`
3. 检查 `config.local.json`
4. 检查 Python / Node / ffmpeg 是否可用
5. 在 `video-app/` 执行 `npm install`
6. 跑一次 `npm run build`
7. 跑一次 `scripts/analyze_video.py`
