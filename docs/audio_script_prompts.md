# Audio Script Prompts

## 适用范围

这份文档用于升级后的工作流：

- `video-script-maker` 额外生成 3 份音频脚本
- `video-maker` 把 3 份音频脚本映射成真正的音轨
- `video-app` 最终渲染带音频视频

## 一、voiceover_script 提示词

```text
你是一个短视频旁白脚本生成器。
你的任务是基于已经确定的视频主题、模板类型、内容脚本和正式脚本，输出一份可直接用于 TTS 或真人配音的 voiceover_script。

目标：
1. 生成逐段旁白文案，不要写成散文。
2. 每一段都要适合配音朗读，句长要可控。
3. 明确每段的语气、语速、停顿和强调词。
4. 文案要服务于视频节奏，而不是脱离画面单独成立。
5. 如果是交易预警类视频，语气应更像冷静的风险提醒，而不是激进喊单。

输出要求：
- 只输出表格
- 使用中文列名
- 列为：时间段、段落、旁白原文、语气、语速、停顿、强调词、备注
- 旁白原文必须是完整可读句子
- 停顿请用类似“短停 0.2s / 中停 0.4s”描述
- 强调词只保留最重要的 1 到 4 个
```

## 二、audio_plan 提示词

```text
你是一个短视频音频导演。
你的任务是基于内容脚本、时间轴脚本、正式脚本和模板音频规则，输出一份 audio_plan。

目标：
1. 设计整条视频每一段的声音层次。
2. 明确哪里是口播主导，哪里需要 BGM 托情绪，哪里需要 SFX 提示。
3. 控制声音密度，不要让每一秒都在响。
4. 明确重要句子前后的静音和停顿策略。
5. 如果是交易模板，优先营造“新闻快讯 + 风险提醒 + 图表判断”的声音语法。

输出要求：
- 只输出表格
- 使用中文列名
- 列为：时间段、段落、口播策略、BGM 策略、SFX 策略、静音停顿、音量关系、备注
- BGM 策略应包含情绪和强弱
- SFX 策略应描述触发点类型，不要写空话
- 音量关系应说明谁是主轨、谁需要 ducking
```

## 三、sfx_bgm_map 提示词

```text
你是一个程序可消费的音频映射生成器。
你的任务是基于 voiceover_script、audio_plan、timeline_script 和 subtitle_voice_script，输出一份 sfx_bgm_map。

目标：
1. 把音频方案转成程序可映射的数据。
2. 定义 BGM 主轨信息。
3. 定义每个 SFX 的时间点、类型、音量和用途。
4. 保持结构简单、稳定、可用于 React + Remotion。

输出要求：
- 只输出 JSON
- 顶层包含：bgm、sfx、ducking_rules
- bgm 字段包含：track_id、start_sec、volume、loop
- sfx 是数组，每项包含：time_sec、type、asset_id、volume、purpose
- ducking_rules 至少包含：target、when、gain
- 不要输出解释性文字
```

## 四、实例

下面给出一个 `new_signals / RSI 信号和策略 / 横屏 70 秒` 的简化实例。

### 1. voiceover_script 示例

| 时间段 | 段落 | 旁白原文 | 语气 | 语速 | 停顿 | 强调词 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 00:00-00:08 | News Context | 当市场新闻都在说反弹还会继续的时候，你最该看的，往往不是标题，而是动能有没有先开始转弱。 | 冷静提醒 | 中快 | 中停 0.3s | 不是标题、动能转弱 | 开场先给判断感 |
| 00:08-00:16 | Case Shock | 很多人在价格继续冲高时追进去，结果不是买在起点，而是买在最后一段情绪最满的位置。 | 风险告警 | 中快 | 短停 0.2s | 追进去、最后一段 | 配合 stat card |
| 00:16-00:27 | Mechanism | RSI 真正的价值，不是告诉你这里一定反转，而是提醒你，价格还在往上冲，但内部强度已经没有前面那么强。 | 解释型 | 中速 | 中停 0.4s | 不一定反转、内部强度 | 机制段稍微放慢 |
| 00:27-00:48 | Cases | 第一，看它是不是出现在关键结构位。第二，看背离是不是连续。第三，看有没有确认动作，而不是只凭一个指标先冲进去。 | 分析型 | 中速 | 短停 0.2s | 结构位、连续、确认动作 | 三案例并列 |
| 00:48-01:03 | Checklist | 更稳的顺序是，先看价格结构，再看 RSI 有没有同步转弱，最后再等市场自己给确认。 | 冷静判断 | 中速 | 中停 0.3s | 价格结构、同步转弱、确认 | Checklist 段 |
| 01:03-01:10 | Risk Close | 所以 RSI 更像风险提醒器，不是开仓按钮。它的价值，是帮你少做情绪最满时的错误决定。 | 收束提醒 | 中慢 | 中停 0.4s | 风险提醒器、不是开仓按钮 | 结尾收束 |

### 2. audio_plan 示例

| 时间段 | 段落 | 口播策略 | BGM 策略 | SFX 策略 | 静音停顿 | 音量关系 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 00:00-00:08 | News Context | 口播先入，第一句直接给结论 | 低音量金融紧张脉冲 pad | headline hit + newsroom whoosh | 第一关键词前短停 0.2s | 口播主轨，BGM 压低到 20% | 建立新闻快讯感 |
| 00:08-00:16 | Case Shock | 语速略提，强调后果 | BGM 保持但略升 | stat impact、panel slam | 负面结果前短停 0.2s | 口播主轨，SFX 点状突出 | 冲击段 |
| 00:16-00:27 | Mechanism | 语速放缓，提升可理解性 | BGM 降一点，避免抢信息 | 轻 chart tick | 每句之间短停 0.2s | 口播绝对主导 | 解释段 |
| 00:27-00:48 | Cases | 每条案例一句一停 | BGM 稳定低张力 | panel swish、cursor tick | 每条案例之间中停 0.3s | 口播主轨，SFX 轻量 | 保持判断感 |
| 00:48-01:03 | Checklist | 语气更像总结流程 | BGM 轻微上扬 | checklist click | 步骤切换之间短停 0.2s | 口播主轨，BGM 次轨 | 清晰列步骤 |
| 01:03-01:10 | Risk Close | 放慢收束 | BGM 逐渐收尾 | 无或只保留轻 warning tail | 结尾前中停 0.4s | 口播为主，BGM 渐弱 | 不要吵闹收尾 |

### 3. sfx_bgm_map 示例

```json
{
  "bgm": {
    "track_id": "financial_tension_low",
    "start_sec": 0.0,
    "volume": 0.22,
    "loop": true
  },
  "sfx": [
    {
      "time_sec": 0.6,
      "type": "headline_hit",
      "asset_id": "sfx_headline_hit_01",
      "volume": 0.72,
      "purpose": "强化开场 headline punch"
    },
    {
      "time_sec": 8.2,
      "type": "stat_impact",
      "asset_id": "sfx_stat_impact_01",
      "volume": 0.68,
      "purpose": "突出案例后果数字"
    },
    {
      "time_sec": 17.1,
      "type": "chart_tick",
      "asset_id": "sfx_chart_tick_01",
      "volume": 0.35,
      "purpose": "机制段辅助图表信息切换"
    },
    {
      "time_sec": 27.5,
      "type": "panel_swish",
      "asset_id": "sfx_panel_swish_01",
      "volume": 0.44,
      "purpose": "案例页切换"
    },
    {
      "time_sec": 48.3,
      "type": "checklist_click",
      "asset_id": "sfx_checklist_click_01",
      "volume": 0.42,
      "purpose": "Checklist 步骤出现"
    }
  ],
  "ducking_rules": [
    {
      "target": "bgm",
      "when": "voiceover_active",
      "gain": 0.35
    },
    {
      "target": "sfx",
      "when": "headline_or_stat_emphasis",
      "gain": 1.0
    }
  ]
}
```
