| scene_id | component_name | input_fields | layout_structure | animation_presets | asset_slots | responsive_rules |
| --- | --- | --- | --- | --- | --- | --- |
| news_context | `TradingNewsContextScene` | `kicker,title,quote,sourceLabel,bullets,tags,mediaCards[]` | headline + montage + bullet cards | `headline_punch`, `media_stagger`, `quote_hold` | 3-4 news images | 横屏下保持 3 联图，不压成单列 |
| case_shock | `TradingCaseShockScene` | `kicker,headline,subheadline,stat,statLabel,dateLabel,imageSrc?,insetImageSrc?,sourceLabel?,boardLines?` | 左大标题右 stat card | `hard_cut`, `stat_pulse`, `board_snap` | background image optional, inset chart | 右卡宽度不要过窄 |
| mechanism | `TradingIndicatorMechanismScene` | `tag,title,formula,description,cards[],imageSrc?` | 左文右图，底部四卡 | `panel_slide`, `card_cascade` | mechanism chart | 四卡固定 2x2 或 4 列 |
| chart_case_1_3 | `TradingChartCaseScene` | `badge,title,takeaway,bullets,imageSrc?` | 左 chart 右 takeaway | `bullet_reveal`, `case_hold` | chart screenshot | 三案例统一布局 |
| checklist | `TradingChecklistScene` | `title,subtitle,steps[]` | 顶部说明，下方三列步骤卡 | `step_cascade`, `glow_hold` | no external asset required | 默认 3 步 |
| risk_close | `TradingRiskCloseScene` | `title,body,tags[]` | centered statement | `slow_fade_up`, `tag_float` | no external asset required | 留白偏大 |
