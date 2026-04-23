# Codex Video Console

本目录是一个独立的网页端原型，目标是把 Codex 本地能力包装成视频生成工作台。

当前版本是纯静态前端：

- `index.html`：三栏工作台界面
- `styles.css`：响应式布局和视觉样式
- `app.js`：mock 对话、任务流、日志和预览状态

## 本地打开

直接打开：

```text
D:\program\ai_video\workflow\web-video-console\index.html
```

如果后续需要接真实 API，建议从本地服务托管：

```text
http://127.0.0.1:3008
```

## 后续后端接口

第一阶段可以让前端保持不变，把 `app.js` 里的 mock 行为替换成以下接口。

```text
GET  /api/projects
GET  /api/templates
GET  /api/assets
GET  /api/jobs
POST /api/jobs
GET  /api/jobs/:id
GET  /api/jobs/:id/events
POST /api/jobs/:id/codex/message
POST /api/jobs/:id/tts
POST /api/jobs/:id/render
GET  /api/jobs/:id/artifacts
```

## Codex Bridge 职责

网页端只负责展示和提交用户意图，本地后端负责执行受控动作：

- 调用 Codex 生成或修改 `data/jobs/<job_id>/video_plan.json`
- 调用现有 TTS 脚本生成音频和字幕时间轴
- 调用 Remotion 渲染 `video-app` 里的 composition
- 把日志通过 SSE 推送给网页端
- 把输出 MP4、字幕、封面和 JSON 作为 artifacts 返回

## 建议安全边界

- 仅监听 `127.0.0.1`
- 工作区固定为 `D:\program\ai_video\workflow`
- 写入限制在 `data/jobs`、`assets/generated` 和明确允许的模板目录
- 命令使用白名单
- Codex 修改代码时先返回 diff，再由用户确认执行
