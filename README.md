# Workflow

`workflow` 是一个面向 AI 视频生产的本地工作区，主要由三部分组成：

- Python 脚本层：负责视频样本分析、抽帧、音频提取、转写、TTS 生成与时间轴对齐。
- Remotion 渲染层：位于 `video-app/`，负责将模板数据、字幕、音频和静态素材渲染为视频。
- 数据与模板层：位于 `data/`、`assets/`、`video-app/public/`，负责输入视频、模板协议、字体、图片、音频和中间产物。

本文档统一使用仓库相对路径。

## 目录结构

根目录关键内容如下。

### 根目录文件

- `README.md`
  - 仓库总说明与新电脑安装入口。
- `QUICKSTART.md`
  - 快速接手流程。
- `INSTALL_FOR_NEW_MACHINE.md`
  - 新电脑迁移和安装清单。
- `AGENTS.md`
  - 给 Codex/代理阅读的仓库工作指南。
- `.gitignore`
  - Git 忽略规则，主要排除依赖、缓存、构建产物、本地密钥和本地工具。
- `.env.example`
  - 环境变量示例，不包含真实密钥。
- `config.py`
  - 顶层模型配置与本地配置读取入口。
- `config.local.json`
  - 本地运行配置文件，可能包含真实 API key，不建议上传公开仓库。
- `elevenlabs_config.py`
  - ElevenLabs TTS 配置入口。

### 根目录文件夹

- `scripts/`
  - Python 主工作流脚本目录，负责视频分析、抽帧、转写、模型调用、TTS 生成和批量音频生成。
- `data/`
  - 工作流数据目录，包含输入视频、预处理产物、分析结果、模板协议、任务目录和音频脚本文本。
- `assets/`
  - 仓库共享静态资源目录，当前主要包含 `fonts/` 和 `images/`。
- `video-app/`
  - Remotion + React + TypeScript 视频模板工程，负责预览、构建和渲染视频。
- `web-video-console/`
  - 静态 Web 控制台原型，用于工作流界面设计和 mock，不是正式后端。
- `project-skills/`
  - 仓库附带的 Codex skills，用于视频分析、脚本生成、TTS、Remotion 渲染等专项流程。
- `docs/`
  - 项目补充文档目录。
- `tools/`
  - 本地工具目录，例如可放置本机使用的 `ffmpeg.exe`，通常不建议把大型二进制提交到 GitHub。
- `.analysis/`
  - 临时分析输出目录，通常保存抽帧和 montage 等中间产物，不应优先作为稳定输入。
- `.playwright-mcp/`
  - Playwright/MCP 调试日志和页面快照目录，属于本地调试产物。
- `temp/`
  - 临时文件目录。
- `tmp_video_analysis/`
  - 视频分析临时目录。
- `__pycache__/`
  - Python 字节码缓存目录。

### `data/` 子目录

- `data/source_videos/`
  - 原始参考视频输入目录，通常按 `<source_id>/source.mp4` 和 `<source_id>/meta.json` 组织。
- `data/preprocess/`
  - 预处理产物目录，包含抽帧、音频、转写、帧索引和帧摘要等。
- `data/jobs/`
  - 分析任务运行目录，保存 job 配置、状态、日志、partial 结果和部分导出产物。
- `data/analyses/`
  - 已完成的视频分析结果目录，通常包含 `.analysis.json` 和 `.summary.json`。
- `data/templates/`
  - 模板协议和模板数据目录，用于沉淀可复用的视频结构。
- `data/audio_scripts/`
  - 配音脚本、voiceover units、字幕时间轴和音频 manifest 等文本数据。

### `video-app/` 子目录

- `video-app/src/`
  - Remotion 源码目录。
- `video-app/src/compositions/`
  - Remotion composition 入口，每个文件通常对应一个可预览或渲染的视频成片。
- `video-app/src/scenes/`
  - 场景组件目录，按题材或模板类型拆分画面结构。
- `video-app/src/components/`
  - 通用 React/Remotion 组件目录，例如字幕轨、音频轨和画面基础组件。
- `video-app/src/data/`
  - 视频模板使用的结构化数据、音频配置和字幕数据。
- `video-app/src/lib/`
  - 通用工具函数和类型辅助。
- `video-app/src/theme/`
  - 视觉主题、设计 token 和视频规格配置。
- `video-app/public/`
  - Remotion 可直接引用的公开静态资源目录，包含音频、图片和生成素材。
- `video-app/skills/`
  - Remotion 相关本地 skill 资料。
- `video-app/build/`
  - Remotion bundle 构建产物，可重新生成，不建议提交。
- `video-app/out/`
  - 本地视频预览或导出产物目录，不建议提交。
- `video-app/renders/`
  - Remotion 渲染输出目录，不建议提交。
- `video-app/node_modules/`
  - npm 安装的依赖目录，应通过 `npm ci` 或 `npm install` 在本地生成，不应提交。

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

## 新电脑安装依赖

把仓库上传到 GitHub 后，另一台电脑不需要同步 `node_modules/`、构建产物、临时目录或本地工具二进制文件。克隆仓库后按下面步骤恢复运行环境。

### 1. 克隆仓库

```powershell
git clone git@github.com:maxwellin0004/Spinus-demo.git
Set-Location ./Spinus-demo
```

如果使用 HTTPS 地址，则把上面的仓库地址替换为 GitHub 页面里的 HTTPS clone 地址。

### 2. 检查系统软件

目标电脑需要能直接调用这些命令：

```powershell
python --version
node --version
npm --version
ffmpeg -version
```

如果 `ffmpeg -version` 不可用，需要在目标电脑安装 ffmpeg，并把 `ffmpeg.exe` 所在目录加入系统 `PATH`。仓库中的 `tools/ffmpeg.exe` 不建议上传 GitHub，应在每台电脑本地安装或单独放置。

### 3. 安装 Remotion / 前端依赖

`video-app/node_modules/` 不上传 GitHub。新电脑需要在 `video-app/` 目录根据 `package-lock.json` 重新安装：

```powershell
Set-Location ./video-app
npm ci
```

如果 `npm ci` 因 lockfile 或 npm 版本问题失败，可以改用：

```powershell
npm install
```

安装完成后验证：

```powershell
npm run build
npm run dev
```

### 4. Python 依赖

当前 `scripts/` 下的 Python 工作流主要使用 Python 标准库，通常不需要额外安装 pip 包。先确认 Python 可用：

```powershell
python --version
```

如果后续脚本新增第三方库，建议在仓库根目录维护 `requirements.txt`，目标电脑执行：

```powershell
python -m pip install -r requirements.txt
```

### 5. 本地配置与密钥

不要把真实 API key 提交到 GitHub。新电脑需要自行准备本地配置：

```powershell
Copy-Item .env.example .env
```

然后根据需要填写 `.env` 或 `config.local.json`。`config.local.json`、`.env`、`.env.local` 都应作为本地文件处理，不建议上传公开仓库。

### 6. `.gitignore` 中忽略内容的处理方式

当前 `.gitignore` 中的这些内容需要在新电脑本地重新生成或安装：

- `video-app/node_modules/`：进入 `video-app/` 后执行 `npm ci` 或 `npm install` 生成。
- `tools/ffmpeg.exe`：在目标电脑本地安装 ffmpeg，或手动放置但不提交。
- `temp/`、`tmp/`、`tmp_video_analysis/`：运行工作流时自动生成。
- `video-app/renders/`：Remotion 渲染输出目录，需要时重新渲染。
- `.env`、`.env.local`：本地密钥配置，需要手动填写。
- `__pycache__/`、`dist/`：缓存或构建产物，不需要同步。

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
