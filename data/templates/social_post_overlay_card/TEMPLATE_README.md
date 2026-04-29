# Social Post Overlay Card

这是一个竖屏静态背景 + 帖子卡片浮层模板。

适用场景：

- 小红书/微博风格的情绪帖、文案帖、观点帖预览
- 图文视频中的“帖子截图”段落
- 不依赖真实平台截图、而是用稳定模板批量出图或短视频

## 核心文件

- `template_manifest.json`：模板身份、渲染入口、可编辑字段
- `template_data_schema.json`：输入数据结构
- `example_data.json`：当前验证样例
- `render_mapping.json`：JSON 字段到 Remotion 组件的映射
- `prompt_variants.json`：提示词库，包含底图、帖子风格、整张封面场景三类提示词
- `video-app/src/data/socialPostPreviewData.ts`：当前 Remotion 实际使用的数据
- `video-app/src/compositions/SocialPostPreviewComposition.tsx`：渲染组件

## 使用方式

1. 准备底图，放到 `video-app/public/images/social-post-preview/`
2. 按 `example_data.json` 的结构填写新数据
3. 同步更新 `video-app/src/data/socialPostPreviewData.ts`
4. 渲染：

```powershell
Set-Location .\video-app
npx.cmd remotion render src/index.ts social-post-preview out\social-post-preview-10s.mp4
```

也可以先生成一份“提示词 + 资产命名 + 渲染命令”计划：

```powershell
python .\scripts\generate_social_post_template_plan.py --prompt-group background_prompts --prompt-id night_street_cafe_cn
```

如需写出 JSON 计划文件：

```powershell
python .\scripts\generate_social_post_template_plan.py --prompt-group background_prompts --prompt-id night_street_cafe_cn --write .\temp\social_post_plan.json
```

## 提示词分层

- `background_prompts`：只生成干净底图，不生成任何文字或 UI
- `post_style_prompts`：定义帖子卡片应呈现的视觉语言
- `cover_scene_prompts`：描述最终成片的整体气质和构图，用于创意探索或质检对齐

## 模板规则

- 默认无音频
- 默认无右侧交互按钮
- 默认无底部标签条
- 底图只负责环境，不在 AI 出图阶段生成任何帖子文字或 UI
- 帖子正文、作者、徽标、时间统一由模板数据控制
