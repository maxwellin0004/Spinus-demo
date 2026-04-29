# Future Income Tracks Card

这是一个竖版 9:16 的「五层透视阶梯信息图」模板，适合做趋势、行业、赛道、机会清单类短视频封面或 5 秒动态卡片。

## 核心文件

- `template_manifest.json`: 模板身份、渲染入口、可编辑字段。
- `template_data_schema.json`: 模板输入数据结构。
- `example_data.json`: 当前验证样例。
- `render_mapping.json`: JSON 字段到 Remotion 组件的映射。
- `style_variants.json`: 可复用色调方案。
- `image_prompt_pack.md`: 如果先用 AI 出静态图，可直接使用的详细提示词。

## 使用方式

1. 复制 `example_data.json` 的结构，替换 `header` 和 5 个 `tracks`。
2. 如果只换内容，优先同步到 `video-app/src/data/futureIncomeTracksData.ts` 的 `defaultFutureIncomeTracksProps`。
3. 如果需要换色调，替换 `visual`，或从 `style_variants.json` 选择一个方案。
4. 渲染：

```powershell
Set-Location .\video-app
npm run render:future-income
```

## 模板规则

- 顶部标题区不使用外层框，只保留小标签和大标题。
- 默认固定 5 层；如果改为 3 层或 7 层，需要同步调整 `tierLayout`。
- 每层关键词建议 3-5 个，每个 2-6 个汉字，避免移动端溢出。
- 当前模板默认无音频，适合做 5 秒动态信息图。
