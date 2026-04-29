# Scene Build Plan

| scene_id | target_section | recommended_component | reuse_or_create | input_props | local_asset_mapping | fallback_plan | implementation_notes |
|---|---|---|---|---|---|---|---|
| scene_01 | hook | `ParadoxColdOpenScene` | create | `headlineValue`, `badgeCount`, `accentPhrase` | pure programmatic background + optional paper texture | keep fully programmatic | 强闪开场，不能像现有 HUD 或档案模板 |
| scene_02 | setup | `RuleTheaterScene` | create | `nodeCount`, `pairCounterTarget` | pure programmatic nodes, paths, counters | none | 新模板核心 page master 之一 |
| scene_03 | mechanism | `MechanismGridScene` | create | `focusIndex`, `connectionTarget` | pure programmatic grid + line layers | none | 新模板核心机制 scene |
| scene_04 | evidence | `ProbabilityBoardScene` | create | `probabilityValue`, `curveCompression` | pure programmatic charts | static chart fallback | 右侧大数字要稳定占位 |
| scene_05 | close | `ReflectiveCloseScene` | create | `leftLabel`, `rightLabel`, `closingRule` | pure programmatic cards | text-only cards | 结尾要克制、像工具而不是口号 |

# Asset Mapping Plan

| asset_id | target_section | expected_asset_type | local_source_path | asset_status | use_strategy | fallback_plan | notes |
|---|---|---|---|---|---|---|---|
| a01 | all | paper texture | programmatic in scene code | already local | procedural noise + warm background | solid fill + vignette | 预览无需外部图 |
| a02 | hook | hero still | none | missing but replaceable | 用 prompt 生成或保持程序化 | 程序化实验台 | 不阻塞预览 |
| a03 | setup/mechanism | grid nodes and pair lines | scene code | already local | programmatic | none | 可换题复用价值最高 |
| a04 | evidence | chart layer | scene code | already local | programmatic | static screenshot | 用于所有概率题 |
| a05 | close | contrast cards | scene code | already local | programmatic | text-only layout | 简单但必须精致 |

# Timeline and Animation Plan

| time_range | scene_id | layer_target | action | animation_preset | transition_type | subtitle_sync | audio_sync | implementation_notes |
|---|---|---|---|---|---|---|---|---|
| 00:00-00:02 | scene_01 | hero number | 50.7% 强闪放大 | `flash-lock` | hard cut in | cue 1 | v01 | 第一拍必须足够狠 |
| 00:02-00:10 | scene_01 | badges | 23 个徽章缓慢漂移 | `slow-push` | none | cue 1-2 | v01-v02 | 维持张力 |
| 00:11-00:18 | scene_02 | pair lines | 配对线分组出现 | `pair-cascade` | page switch | cue 3 | v03 | 从稀到密 |
| 00:18-00:25 | scene_02 | counter | 计数器锁到 253 | `counter-rise` | none | cue 3 | v03 | 数字到位后留一拍 |
| 00:25-00:41 | scene_03 | focus node + lines | 第 23 节点与 22 条连线逐次点亮 | `step-reveal` | hard page change | cue 4 | v04 | 模板机械语法核心 |
| 00:41-00:50 | scene_04 | curve | 空白概率压缩 | `curve-sweep` | page switch | cue 5 | v05 | 体现“压扁” |
| 00:50-00:58 | scene_04 | hero number | 50.7% 锁定 | `number-hold` | none | cue 6 | v06 | 强化结论 |
| 00:58-01:06 | scene_05 | contrast cards | 左右对照卡入场 | `split-compare` | page switch | cue 7 | v07 | 给理解时间 |
| 01:06-01:12 | scene_05 | closing rule | 中央规则合并定格 | `merge-hold` | none | cue 8 | v08 | 末尾留白 |

# Subtitle and Voice Sync Plan

| section | subtitle_chunks | emphasis_words | pause_points | sync_target | notes |
|---|---|---|---|---|---|
| hook | `只要 23 个人 / 撞生日的概率就已经超过一半` | `23 个人`, `超过一半` | 句尾短停 | hero number flash | final timing must follow generated audio |
| setup | `你盯着 365 天 / 却漏掉了 253 组配对` | `365 天`, `253 组配对` | 对比词前后短停 | pair counter lock | 当前仅 rough preview |
| mechanism | `每多一个人 / 就会和前面所有人新增一次比较` | `所有人`, `新增一次比较` | 第二句前停顿 | line cascade | 与连线出现强绑定 |
| evidence | `概率上升不是线性 / 是组合数在把空间快速压扁` | `不是线性`, `组合数` | 转折短停 | curve compression | 口播确定后重建 |
| close | `很多看似不可能的事 / 只是你换错了计数框架` | `计数框架` | 结尾停顿 | center closing rule | 最终版字幕不能继续手估 |

# Review Checklist

| review_area | check_item | expected_state | risk_if_failed | notes |
|---|---|---|---|---|
| style | 是否与旧模板 page master 明显不同 | 是 | 会违反强约束 | 当前为全新 scene 体系 |
| layout | 字幕是否遮住核心数字或图表 | 否 | 关键信息损失 | scene_04 风险最高 |
| pacing | hook 是否显著快于 body | 是 | 开场抓力不足 | 需要看片复核 |
| mechanism | 关系线增长是否一眼可懂 | 是 | 模板失去教学价值 | scene_03 核心检查项 |
| audio | 最终版是否读取音频对齐字幕 | 是 | 口播与字幕错位 | 预览版暂未完成 |

# Render Execution Notes

| step | action | target_path | dependency | notes |
|---|---|---|---|---|
| 1 | 新建 `paradoxLab` scene 系统与 composition | `video-app/src/scenes/paradoxLab/*` | none | 已实现 |
| 2 | 新建预览数据源 | `video-app/src/data/combinatorialParadoxCinematicData.ts` | none | 已实现 |
| 3 | 把 composition 注册到 Root | `video-app/src/Root.tsx` | none | 已实现 |
| 4 | 本地渲染 rough preview | `video-app/renders/combinatorial-paradox-cinematic-preview.mp4` | npm dependencies | 如无音频则输出静音版 |
| 5 | 生成正式口播后重建字幕时间轴 | `data/templates/combinatorial_paradox_cinematic/subtitle_timeline.generated.horizontal.json` | TTS or human voice | 发布前必做 |
