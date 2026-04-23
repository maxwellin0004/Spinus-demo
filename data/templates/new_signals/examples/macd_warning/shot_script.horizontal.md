| shot_id | time_range | target_section | shot_goal | visual_description | on_screen_text | motion_and_transition | asset_dependency | editable_fields |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | 00:00-00:02.5 | News Context | 先打新闻 headline | 深色背景上大标题 punch in，右上 sourceLabel 出现 | 最危险的时候… | headline_punch_in | none | title |
| S02 | 00:02.5-00:05.5 | News Context | 建立新闻素材厚度 | 三张图依次浮现：人物、市场情绪、现实后果 | 人物引用 / 市场情绪 / 现实后果 | media_stagger + soft zoom | 3 张新闻图 | mediaCards |
| S03 | 00:05.5-00:08 | News Context | 让技术转折入场 | 右侧 bullet 卡逐条显现，底部 tags 出现 | 动能已经先掉队 | bullet_reveal | none | bullets, tags |
| S04 | 00:08-00:11 | Case Shock | 结果冲击 | 大 headline 与 -16% stat card 同时到位 | MACD 背离 / -16% | hard_cut + stat_pulse | chart inset optional | headline, stat |
| S05 | 00:11-00:16 | Case Shock | 完整交代误判后果 | 右卡中的图表 inset 放大，dateLabel 和 statLabel 补完 | 三天回撤 16% | inset_hold | chartRef1 | statLabel, dateLabel |
| S06 | 00:16-00:20 | Mechanism | 给定义 | 标题、公式 chip 先出现，右图稍后推入 | 不是开仓按钮 | panel_slide | chartRef2 | title, formula |
| S07 | 00:20-00:26 | Mechanism | 解释四个判断层 | 四卡依次亮起 | 价格结构 / 柱体变化 / 快慢线 / 确认动作 | card_cascade | none | cards |
| S08 | 00:26-00:33 | Case 1 | 讲第一个风险用法 | 图表固定，右侧 bullet 三条依次出现 | 趋势末端预警 | bullet_reveal | chartRef1 | title, bullets |
| S09 | 00:33-00:40 | Case 2 | 讲结构位配合 | 硬切到第二张图表和新文案 | 结构位会放大价值 | hard_cut | chartRef2 | title, bullets |
| S10 | 00:40-00:47 | Case 3 | 讲最常见误用 | 硬切到第三张图表和追高提醒 | 最危险的追高 | hard_cut + emphasis_dot | chartRef3 | title, bullets |
| S11 | 00:47-00:52 | Checklist | 打出判断顺序 | checklist 标题和 subtitle 出现 | 结构 -> 动能 -> 确认 | title_hold | none | title, subtitle |
| S12 | 00:52-00:58 | Checklist | 三步具体化 | 3 张步骤卡 cascade | 01 / 02 / 03 | step_cascade | none | steps |
| S13 | 00:58-01:07 | Close | 留结论 | 大结论淡入，body 稍后进入 | 风险提醒，不是交易命令 | slow_fade_up | none | title, body |
| S14 | 01:07-01:15 | Close | 用 tags 做边界钉牢 | tags 和边框最后进入 | 趋势动能 / 结构确认 / 风险预警 | tag_float | none | tags |
