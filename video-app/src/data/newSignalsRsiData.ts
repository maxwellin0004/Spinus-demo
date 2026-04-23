import { staticFile } from "remotion";

const chartRef1 = staticFile("images/shared/macd_ref_chart_1.jpg");
const chartRef2 = staticFile("images/shared/macd_ref_chart_2.jpg");
const chartRef3 = staticFile("images/shared/macd_ref_chart_3.jpg");
const paulTudorJones = staticFile("images/shared/hook_paul_tudor_jones.jpg");
const occupyWallStreet = staticFile("images/shared/hook_occupy_wall_street.jpg");
const crisisStore = staticFile("images/shared/hook_financial_crisis_store.jpg");

export const newSignalsRsiData = {
  variant: "light" as const,
  newsContext: {
    kicker: "热点 / 新闻引用",
    title: "市场最热的时候，新闻、名人观点和社交情绪往往会一起放大“还会继续涨”的错觉",
    quote:
      "RSI 最有用的时刻，不是在行情已经跌下来以后解释原因，而是在价格仍然很强的时候，先提醒你：这段涨势可能已经过热。",
    sourceLabel: "新闻感 Hook：人物观点 + 情绪画面 + 风险后果",
    bullets: [
      "热点新闻会放大“现在最强”的叙事",
      "人物观点会强化“这一轮还没结束”的预期",
      "RSI 真正有价值的地方，是更早提醒你过热和钝化风险",
    ],
    tags: ["新闻语境", "市场情绪", "过热提示", "策略判断"],
    mediaCards: [
      {
        imageSrc: paulTudorJones,
        label: "人物引用",
        caption: "最危险的往往不是坏消息，而是所有人都觉得还会继续涨的时候。",
      },
      {
        imageSrc: occupyWallStreet,
        label: "情绪扩散",
        caption: "情绪越一致，追高交易越容易忽视动能已经开始衰减。",
      },
      {
        imageSrc: crisisStore,
        label: "现实后果",
        caption: "当过热转成回撤，真正留下来的不是观点，而是账户回撤。",
      },
    ],
  },
  hook: {
    kicker: "new_signals / RSI",
    headline: "RSI 信号和策略",
    subheadline:
      "多数人只会在 RSI 超买以后紧张，但更成熟的做法不是看见 70 就立刻做空，而是先判断它是在提示过热、钝化，还是和趋势共振。",
    stat: "70+",
    statLabel: "不是看到数值就交易，而是先判断当前 RSI 所处的趋势语境和风险阶段。",
    dateLabel: "先案例冲击，再切回策略解读",
    insetImageSrc: chartRef1,
    sourceLabel: "浅色版策略 Hook：风险数字 + 图表证据",
    boardLines: ["RSI", "SIGNAL", "THEN", "STRATEGY"],
  },
  mechanism: {
    tag: "指标机制",
    title: "RSI 先回答的不是买还是卖，而是这段趋势现在到底热不热、强不强、还能不能追",
    formula: "趋势方向 + RSI 区间 + 是否钝化 + 价格结构确认",
    description:
      "RSI 本质上是动能强弱的刻度。它单独看意义有限，但一旦放进趋势方向、关键位置和价格结构里，才会变成真正能执行的信号和策略。",
    cards: [
      {
        title: "看趋势方向",
        body: "上升趋势中的 RSI 超买，很多时候不是做空信号，而是强势延续的表现。",
      },
      {
        title: "看区间位置",
        body: "50 上方和 50 下方往往对应多空主导权，不同区间里的信号意义完全不同。",
      },
      {
        title: "看是否钝化",
        body: "连续高位钝化说明趋势很强，真正危险的是价格继续冲高，但 RSI 已经开始跟不上。",
      },
      {
        title: "看价格确认",
        body: "关键位破坏、背离确认、结构失守，才是把 RSI 从观察指标升级为执行依据的关键。",
      },
    ],
    imageSrc: chartRef2,
  },
  cases: [
    {
      badge: "策略 1",
      title: "趋势里别把超买当成自动反手信号",
      takeaway:
        "强势上涨中，RSI 上 70 往往只是热度高，并不等于立刻见顶。更稳的做法是先把它当作风险升温提示，而不是直接逆势开仓。",
      bullets: [
        "先确认趋势是否仍在延续",
        "再看 RSI 是单次超买还是持续高位钝化",
        "如果价格结构没破，不要把超买误当成做空按钮",
      ],
      imageSrc: chartRef1,
    },
    {
      badge: "策略 2",
      title: "RSI 背离更适合做风险预警，不适合孤立下结论",
      takeaway:
        "真正有价值的不是看到 RSI 变弱，而是价格还在冲高时，你已经知道内部动能在衰减。接下来该减少的是追高和加杠杆的冲动。",
      bullets: [
        "价格创新高，RSI 不创新高",
        "优先当成预警，而不是单独开仓理由",
        "结合关键位和成交结构，再决定是否行动",
      ],
      imageSrc: chartRef2,
    },
    {
      badge: "策略 3",
      title: "50 轴附近的回踩和重返，更适合做趋势延续判断",
      takeaway:
        "很多实战策略并不盯着极端超买超卖，而是看 RSI 在 50 轴附近的企稳、回踩和重新站上，用来过滤趋势是否仍然健康。",
      bullets: [
        "50 上方优先理解为多头主导",
        "跌破 50 再弱反弹，往往说明趋势开始降级",
        "用 50 轴配合价格结构，比只盯 70/30 更稳",
      ],
      imageSrc: chartRef3,
    },
  ],
  checklist: {
    title: "更稳的 RSI 使用顺序，是先看趋势，再看区间，再看是否钝化，最后等价格确认",
    subtitle:
      "这套模板讲的不是孤立指标，而是 RSI 放进完整决策链路以后，怎样帮助你少追高、少抄底、少在最热的时候做最冲动的动作。",
    steps: [
      {
        title: "先判断市场是趋势还是震荡",
        body: "同样一个超买，在趋势市和震荡市里，意义完全不一样。第一步永远先判断环境。",
      },
      {
        title: "再判断 RSI 在什么区间和状态",
        body: "看它是短暂触顶，还是持续钝化；是围绕 50 震荡，还是已经跌回弱势区。",
      },
      {
        title: "最后等价格给确认动作",
        body: "关键位破坏、趋势线失守、结构转弱，才是把 RSI 观察升级为策略执行的最后一步。",
      },
    ],
  },
  close: {
    title: "RSI 真正的价值，不是替你按买卖按钮，而是更早告诉你这段行情还敢不敢放心地追",
    body:
      "把 RSI 当成环境判断和风险提示工具，你会更少在最热的时候冲进去，也更少在强趋势里过早逆势。成熟策略不是看到一个数值就行动，而是把 RSI 放回趋势和结构里一起看。",
    tags: ["趋势判断", "区间识别", "过热预警", "策略执行"],
  },
} as const;
