| scene_id | component_name | input_fields | layout_structure | animation_presets | asset_slots | responsive_rules |
| --- | --- | --- | --- | --- | --- | --- |
| hook | `ReferenceHookScene` | `hook_frames[]` | 全屏大字层叠 | `title_snap_in`, `ghost_rise`, `hard_cut_flash` | 无外部图 | 标题宽度控制在 70% 内 |
| document_definition | `ReferenceDocScene` | `path`, `filename`, `headline`, `cards[]` | 左图标右四卡 | `panel_slide_left`, `card_cascade` | `icon_skill_file` | 右区固定 2x2 卡片 |
| compare_basic | `ReferenceCompareScene` | `left_title`, `right_title`, `left_points[]`, `right_points[]`, `footer` | 左右双栏 | `split_reveal`, `arrow_fade_in` | 无外部图 | 适合横屏，竖屏需改版 |
| scenario_1_3 | `ReferenceScenarioScene` | `badge`, `title`, `description`, `bullets[]`, `imageSrc` | 左图右信息 | `panel_slide_up`, `image_hold` | `scenario_*` | 每场景都复用同组件 |
| flow | `ReferenceFlowScene` | `title`, `steps[]` | 三节点链路 | `card_cascade`, `line_draw` | 无外部图 | 节点默认 3 个 |
| concept_compare | `ReferenceCompareScene` | `title`, `left_label`, `right_label`, `left_points[]`, `right_points[]`, `footer` | 左右双栏 + 顶部标题 | `split_reveal`, `arrow_fade_in` | 无外部图 | 与 compare_basic 复用 |
| close | `ReferenceCloseScene` | `headline`, `subheadline` | 居中收束 | `dim_fade`, `slow_fade_up` | 无外部图 | 留白更多 |
