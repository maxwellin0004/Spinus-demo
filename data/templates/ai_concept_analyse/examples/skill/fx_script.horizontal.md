| fx_id | fx_name | category | use_case | target_shots | trigger_condition | duration_frames | intensity | stackable | implementation_hint | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FX01 | `title_snap_in` | title motion | 巨字标题快速进入并形成记忆点 | H01, H02, H03, CL01 | 每个主标题首次出现时 | 10-14 | medium_high | 可与轻 glow 叠加 | 先从 0.88 scale 到 1.03 再回到 1.0 | 开场和结尾都能用 |
| FX02 | `ghost_rise` | background text motion | 底层大 ghost 字提供包装感 | H01, H02, H03 | Hook 场景固定使用 | 18-28 | low | 可叠加扫描线 | y 轴上移 50px 到 0，透明度 0.1 到 0.34 | 不要喧宾夺主 |
| FX03 | `hard_cut_flash` | transition | 强节奏场景切换 | H01->H02, H02->H03, Compare->Scenario, Scenario 间切换 | 当需要明显切场 | 3-5 | medium | 可与短 glitch 叠加 | 插 1 帧白橙闪或整体亮度抬高 20% | 不能全片滥用 |
| FX04 | `screen_push_up` | transition | 从一个主题页推到另一个结构页 | H03->D01, S32->F01 | 从概念页切到结构页时 | 12-18 | medium | 不建议叠加 flash | 整体容器 y 从 100% 到 0 | 用于阶段切换 |
| FX05 | `panel_slide_left` | panel motion | 左侧文件卡、左栏面板进入 | D01, C01 | 左侧大元素首次出现 | 12-16 | medium | 可叠加轻 scale | x 从 -40/-50 到 0 | 左主元素专用 |
| FX06 | `panel_slide_right` | panel motion | 右侧对比栏或卡片区进入 | C02 | 右侧大元素首次出现 | 12-16 | medium | 可叠加轻 fade | x 从 40 到 0 | 与左滑形成对称 |
| FX07 | `card_cascade` | sequence motion | 多卡片逐一出现 | D03, D04, S12, S22, S32, F02 | 同一组卡需要顺序建立时 | 单卡 6-8 帧间隔 | medium | 可叠加边框脉冲 | 按顺序依次 opacity 0 到 1，y 24 到 0 | 是模板重要语法 |
| FX08 | `border_glow_pulse` | emphasis | 当前重点卡片亮一下 | D03, D04, S12, S22, S32 | 每张卡出现后的前 8-12 帧 | 8-12 | low_medium | 可和 cascade 叠加 | 边框色从 frame 到 accent 再回落 | 用于强调，不是常驻 |
| FX09 | `line_draw` | diagram motion | 箭头、中轴线、流程线绘制 | F02, M01 | 流程页或概念对比页 | 10-18 | medium | 可与 fade 叠加 | width 或 mask 从 0 到 100% | 使流程更“科技化” |
| FX10 | `arrow_fade_in` | detail motion | 中间箭头补进 | C02, M02 | 左右对比内容到位后 | 6-10 | low | 可叠加 line_draw | opacity 0 到 1 + scale 0.92 到 1 | 箭头不宜抢眼 |
| FX11 | `dim_fade` | transition | 切入结尾或高认知页时压暗上一页 | M02->CL01 | 从中段信息页进入总结时 | 10-14 | low | 不建议叠加 flash | 上一页 opacity 1 到 0，整体亮度先降 | 用于收束 |
| FX12 | `scanline_idle` | ambient | 提供参考片的屏幕感 | 全片 | 全程基础环境特效 | 全程 | very_low | 可与所有效果共存 | 使用背景 repeating-linear-gradient | 已集成在 SceneFrame |
| FX13 | `grid_idle` | ambient | 提供 HUD 网格底 | 全片 | 全程基础环境特效 | 全程 | very_low | 可与所有效果共存 | 使用背景 grid overlay | 已集成在 SceneFrame |
| FX14 | `micro_scale_hold` | ambient motion | 图片或主卡片保持不死板 | S11-S32, D01 | 元素已经出现后 | 30-60 | very_low | 可和其他轻动画共存 | 1.00 到 1.02 极轻呼吸 | 防止页面太静 |
| FX15 | `footer_float_in` | text motion | footer / subheadline 最后一拍补进 | C03, M02, CL02 | 结论句需要延后出现时 | 10-16 | low | 可叠加 dim_fade | y 16 到 0，opacity 0 到 1 | 用于信息分层 |

## 使用原则

1. Hook 只允许重特效集中在前 6 秒，后面立刻收住。
2. 同一镜头最多叠加 2 到 3 个可见特效，避免变成花屏。
3. 场景页以结构复用为主，不靠复杂特效撑节奏。
4. 对比页的重点是“左右逻辑清晰”，不是炫技。
5. Ambient 特效全片常驻，但强度必须非常低。
