# Install For New Machine

本文件是给另一台电脑上的 Codex 或人工用户执行安装时使用的清单。

所有路径默认都以当前仓库根目录为基准，统一使用相对路径。

## 1. 目标

让目标机器能够：

- 使用 `workflow` 仓库
- 运行 `scripts/` 中的 Python 工作流
- 运行 `video-app/` 中的 Remotion 工程
- 安装并使用仓库附带的 skills

## 2. 系统需要的软件

必须安装并可直接调用：

- Python
- Node.js
- npm
- ffmpeg

验证命令：

```powershell
python --version
npm --version
ffmpeg -version
```

## 3. 必须准备的配置

检查以下内容：

- `config.local.json`
- `config.py`
- `elevenlabs_config.py`

确认这些参数可用：

- 模型 API key
- 模型 API URL
- mock 开关
- ElevenLabs key、voice id、model id

## 4. 安装 `video-app` 依赖

必须在指定目录安装：

```powershell
Set-Location ./video-app
npm install
```

不要在以下目录执行：

```text
.
```

安装结果应位于：

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

安装完成后验证：

```powershell
Set-Location ./video-app
npm run build
```

## 5. 验证 Python 工作流

从仓库根目录执行：

```powershell
python ./scripts/analyze_video.py job_demo manual_download4 auto data
```

## 6. 安装仓库附带的 skills

把以下目录复制到目标机器本地 Codex skill 目录：

```text
project-skills/workflow-codex
project-skills/workflow-video-analysis-table
project-skills/workflow-template-video-2
project-skills/workflow-short-video-script-creator
project-skills/workflow-video-script-maker
project-skills/workflow-video-maker
project-skills/workflow-remotion-render
project-skills/workflow-tts-pipeline
```

目标目录示例：

```text
~/.codex/skills/
```

每个 skill 目录至少应包含：

- `SKILL.md`
- `agents/openai.yaml`

## 7. 推荐给另一台机器上的 Codex 的指令

```text
请打开当前仓库根目录，先阅读 INSTALL_FOR_NEW_MACHINE.md、QUICKSTART.md、README.md 和 AGENTS.md。然后根据文档检查 Python、Node.js、npm、ffmpeg 是否可用；进入 ./video-app 执行 npm install；检查 config.local.json、config.py、elevenlabs_config.py 中的本地配置；把 project-skills/ 目录中的 skills 复制到本地 ~/.codex/skills/；最后执行一次 npm run build，并按文档验证一次 scripts/analyze_video.py。
```

## 8. 完成标准

当以下条件都满足时，说明迁移安装完成：

- Python、npm、ffmpeg 可用
- `video-app/node_modules/` 已安装
- `video-app/` 可执行 `npm run build`
- 相关 skills 已复制到目标机器的 Codex skill 目录
- 本地配置已补齐
- Python 分析脚本能运行验证
