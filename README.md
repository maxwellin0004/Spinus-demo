# Workflow

`workflow` 是一个面向 AI 视频生产的本地工作区，主要由三部分组成：

- Python 工作流层：负责视频样本分析、抽帧、音频提取、转写、模型调用、TTS 生成与时间轴对齐。
- Remotion 渲染层：位于 `video-app/`，负责将模板数据、字幕、音频和静态素材渲染为视频。
- 数据与模板层：位于 `data/`、`assets/`、`video-app/public/`，负责输入视频、模板协议、字体、图片、音频和中间产物。

本文档统一使用仓库相对路径。

## 目录结构

根目录关键内容如下。

### 根目录文件

- `README.md`：仓库总说明与新电脑安装入口。
- `QUICKSTART.md`：快速接手流程。
- `INSTALL_FOR_NEW_MACHINE.md`：新电脑迁移和安装清单。
- `AGENTS.md`：给 Codex/代理阅读的仓库工作指南。
- `.gitignore`：Git 忽略规则，主要排除依赖、缓存、构建产物、本地密钥和本地工具。
- `.env.example`：环境变量示例，不包含真实密钥。
- `requirements.txt`：Python 依赖清单。
- `config.py`：顶层模型配置与本地配置读取入口。
- `config.local.json`：本地运行配置文件，可能包含真实 API key，不应上传公开仓库。
- `elevenlabs_config.py`：ElevenLabs TTS 配置入口。

### 根目录文件夹

- `scripts/`：Python 主工作流脚本目录，负责视频分析、抽帧、转写、模型调用、TTS 生成和批量音频生成。
- `data/`：工作流数据目录，包含输入视频、预处理产物、分析结果、模板协议、任务目录和音频脚本文本。
- `assets/`：仓库共享静态资源目录，当前主要包含 `fonts/` 和 `images/`。
- `video-app/`：Remotion + React + TypeScript 视频模板工程，负责预览、构建和渲染视频。
- `web-video-console/`：静态 Web 控制台原型，用于工作流界面设计和 mock，不是正式后端。
- `monitor/`：社媒数据监控和 Web 看板相关代码。
- `project-skills/`：仓库附带的 Codex skills，用于视频分析、脚本生成、TTS、Remotion 渲染等专项流程。
- `docs/`：项目补充文档目录。
- `tools/`：本地工具目录，例如可放置本机使用的 `ffmpeg.exe`，通常不建议把大型二进制提交到 GitHub。

## 核心工作流

### 1. 样本分析

典型路径：

1. 准备 `data/source_videos/<source_id>/source.mp4`
2. 准备 `data/source_videos/<source_id>/meta.json`
3. 运行 `scripts/analyze_video.py`
4. 生成 `data/preprocess/<source_id>/...`、`data/jobs/<job_id>/...` 和 `data/analyses/...`

命令格式：

```powershell
python ./scripts/analyze_video.py <job_id> <source_id> <mode> <data_root>
```

示例：

```powershell
python ./scripts/analyze_video.py job_demo manual_download4 auto data
```

### 2. 语音与字幕时间轴

典型路径：

1. 准备模板 voiceover 文本或 TS voiceover units。
2. 使用 ElevenLabs 脚本生成音频。
3. 生成字幕时间轴 JSON 或 TS audio config。
4. 将产物用于 `video-app/src/data/` 或 `video-app/public/audio/`。

相关入口：

- `scripts/generate_elevenlabs_tts.py`
- `scripts/generate_elevenlabs_tts_with_timestamps.py`
- `scripts/generate_job_tts.py`

### 3. 视频预览与渲染

典型路径：

1. 进入 `video-app/`。
2. 安装 npm 依赖。
3. 运行 Remotion 预览或构建。
4. 选择对应 composition 输出视频。

## 新电脑安装

把仓库上传到 GitHub 后，另一台电脑不需要同步 `node_modules/`、构建产物、临时目录、本地日志或本地工具二进制文件。克隆仓库后按下面步骤恢复运行环境。

### 1. 克隆仓库

```powershell
git clone git@github.com:maxwellin0004/Spinus-demo.git
Set-Location ./Spinus-demo
```

如果使用 HTTPS 地址，则把上面的仓库地址替换为 GitHub 页面里的 HTTPS clone 地址。

### 2. 检查系统软件

新电脑需要先安装并能直接调用这些命令：

```powershell
git --version
python --version
node --version
npm --version
ffmpeg -version
```

推荐版本：

- Python 3.10 或更高版本。
- Node.js 20 或更高版本。
- npm 使用 Node.js 自带版本即可。
- ffmpeg 需要加入系统 `PATH`，因为 `scripts/analyze_video.py` 会通过系统 PATH 查找 `ffmpeg`。

如果 `ffmpeg -version` 不可用，需要在目标电脑安装 ffmpeg，并把 `ffmpeg.exe` 所在目录加入系统 `PATH`。`tools/ffmpeg.exe` 属于本地工具，不建议上传 GitHub。

### 3. 创建 Python 虚拟环境

推荐在仓库根目录创建虚拟环境，避免污染系统 Python：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

如果 PowerShell 阻止激活脚本，可以在当前窗口临时放开执行策略：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 4. 安装 Python 依赖

仓库根目录提供 `requirements.txt`。安装命令：

```powershell
python -m pip install -r requirements.txt
```

说明：

- `scripts/` 下的核心视频分析和 TTS 脚本目前主要使用 Python 标准库。
- `requirements.txt` 中的第三方包主要服务于 `monitor/` 监控看板和社媒数据采集。
- 如果需要运行 TikTok 或浏览器相关采集，还要安装 Playwright 浏览器驱动。

安装 Playwright 浏览器驱动：

```powershell
python -m playwright install
```

当前 `requirements.txt` 包含：

- `google-api-python-client`：YouTube Data API 客户端。
- `google-auth`：Google API 鉴权。
- `PyYAML`：读取 `monitor/config.yaml` 等 YAML 配置。
- `httpx`：HTTP 请求客户端。
- `yt-dlp`：视频平台元数据抓取辅助。
- `TikTokApi`：TikTok 数据采集。
- `playwright`：浏览器自动化能力。
- `fastapi`：监控看板后端。
- `uvicorn[standard]`：FastAPI 本地服务运行器。

### 5. 安装 npm 依赖

`video-app/node_modules/` 不上传 GitHub。新电脑需要在 `video-app/` 目录根据 `package-lock.json` 重新安装：

```powershell
Set-Location ./video-app
npm ci
```

如果 `npm ci` 因 lockfile 或 npm 版本问题失败，可以改用：

```powershell
npm install
```

当前 `video-app/package.json` 的运行依赖包括：

- `@react-three/drei`：Three.js/React Three Fiber 辅助组件。
- `@react-three/fiber`：在 React 中渲染 Three.js 场景。
- `@react-three/postprocessing`：React Three Fiber 后处理。
- `@remotion/cli`：Remotion 命令行工具。
- `@remotion/tailwind-v4`：Remotion Tailwind v4 集成。
- `@remotion/transitions`：Remotion 转场组件。
- `clsx`：className 条件组合。
- `gsap`：动画时间轴。
- `lucide-react`：图标组件。
- `motion`：React 动效库。
- `postprocessing`：Three.js 后处理底层库。
- `react`：React 运行时。
- `react-dom`：React DOM 渲染。
- `remotion`：视频渲染核心框架。
- `tailwindcss`：样式工具。
- `three`：3D 渲染库。
- `zod`：运行时数据校验。

当前开发依赖包括：

- `@remotion/eslint-config-flat`：Remotion ESLint 配置。
- `@types/react`：React TypeScript 类型。
- `@types/web`：Web API TypeScript 类型。
- `eslint`：代码检查。
- `prettier`：代码格式化。
- `typescript`：TypeScript 编译器。

安装完成后验证：

```powershell
npm run build
npm run lint
```

启动 Remotion 预览：

```powershell
npm run dev
```

执行完后如果要回到仓库根目录：

```powershell
Set-Location ..
```

### 6. 配置本地密钥

不要把真实 API key 提交到 GitHub。新电脑需要自行准备本地配置：

```powershell
Copy-Item .env.example .env
```

然后根据需要填写 `.env` 或 `config.local.json`。`config.local.json`、`.env`、`.env.local` 都应作为本地文件处理，不建议上传公开仓库。

如果需要使用模型 API，需要至少配置：

- `MODEL_PROVIDER`
- `BLTCY_API_KEY`
- `BLTCY_CHAT_COMPLETIONS_URL`
- `BLTCY_AUDIO_TRANSCRIPTIONS_URL`
- 各类 `MODEL_*` 路由配置

如果只想先验证本地流程，可以在 `.env` 中保持：

```dotenv
MOCK_ANALYSIS=true
```

### 7. 验证 Python 工作流

从仓库根目录执行：

```powershell
python -m py_compile config.py elevenlabs_config.py scripts/analyze_video.py scripts/api_client.py
```

如需实际跑视频分析，需要确保存在：

- `data/source_videos/<source_id>/source.mp4`
- `data/source_videos/<source_id>/meta.json`

然后执行：

```powershell
python ./scripts/analyze_video.py job_demo <source_id> auto data
```

### 8. 验证监控看板，可选

如果需要使用 `monitor/`：

```powershell
Set-Location ./monitor
Copy-Item config.example.yaml config.yaml
python ./main.py --help
python ./web_app.py
```

`monitor/config.yaml` 是本地配置文件，不应提交真实密钥或账号信息。

## GitHub 上传前检查

提交前建议运行：

```powershell
git status --short
git ls-files config.local.json data/jobs video-app/public/generated-jobs web-video-console/session-catalog-cache.json
```

如果这些本地文件已经被 Git 跟踪过，需要从版本管理中移除，但保留本地文件：

```powershell
git rm --cached config.local.json
git rm --cached web-video-console/session-catalog-cache.json
git rm -r --cached data/jobs
git rm -r --cached video-app/public/generated-jobs
```

然后提交：

```powershell
git add .gitignore README.md requirements.txt video-app/package.json video-app/package-lock.json
git commit -m "Document project setup dependencies"
git push
```

## `.gitignore` 中忽略内容的处理方式

这些内容需要在新电脑本地重新生成或安装：

- `video-app/node_modules/`：进入 `video-app/` 后执行 `npm ci` 或 `npm install` 生成。
- `video-app/build/`：Remotion bundle 构建产物，需要时重新执行 `npm run build`。
- `video-app/renders/`：Remotion 渲染输出目录，需要时重新渲染。
- `video-app/public/generated-jobs/`：任务生成的音频等本地产物，需要时重新生成。
- `data/jobs/`：任务运行状态、日志、导出视频和中间结果，需要时重新跑工作流。
- `tools/ffmpeg.exe`：在目标电脑本地安装 ffmpeg，或手动放置但不提交。
- `temp/`、`tmp/`、`tmp_video_analysis/`：运行工作流时自动生成。
- `.env`、`.env.local`、`config.local.json`：本地密钥配置，需要手动填写。
- `.playwright-mcp/`：本地浏览器调试日志和页面快照。
- `__pycache__/`、`dist/`：缓存或构建产物，不需要同步。

## 常用命令

### 安装 Python 依赖

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### 安装 `video-app` 依赖

```powershell
Set-Location ./video-app
npm ci
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
