| asset_id | target_section | asset_type | asset_description | source_guidance | required | fallback_plan | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bg_grid_dark | 全片 | generated background | 黑底细网格 HUD 背景 | React/CSS 生成 | 是 | 纯黑渐变 | 全片统一母版 |
| icon_skill_file | Hook / Definition / Close | generated icon | `SKILL.md` 文件主图标 | React 组件生成 | 是 | 简化文件图标 | 主识别物 |
| compare_panels | Value / Compare | layout block | 双栏对比面板 | React 组件生成 | 是 | 两块纯文字面板 | 用于强调前后差异 |
| rule_cards | Definition | UI card | 目标、步骤、风格、输出四张卡 | React 组件生成 | 是 | 简化成列表 | 文档解释页核心 |
| scenario_video_breakdown | Scenario 1 | image | 视频拆解示意图 | 本地图片 | 是 | 程序占位面板 | 文件名需一致 |
| scenario_ppt | Scenario 2 | image | PPT 动画页示意图 | 本地图片 | 是 | 程序占位面板 | 文件名需一致 |
| scenario_batch_content | Scenario 3 | image | 批量内容生产示意图 | 本地图片 | 是 | 程序占位面板 | 文件名需一致 |
| flow_cards | Flow | process card | 三段流程卡片 | React 组件生成 | 是 | 纯文字流程图 | 适合模板复用 |
| compare_concept_labels | Compare | concept block | Skill 与 MCP 标签块 | React 组件生成 | 是 | 纯文字 | 用来做概念边界 |
