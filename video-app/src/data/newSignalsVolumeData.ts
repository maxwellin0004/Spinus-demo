import { staticFile } from "remotion";

const chartRef1 = staticFile("images/new-signals-volume-web/aapl-time-price-chart.png");
const chartRef2 = staticFile("images/new-signals-volume-web/us-stock-market-investing.jpg");
const chartRef3 = staticFile("images/new-signals-volume-web/candlestick-chart.png");
const marketCrowd = staticFile("images/new-signals-volume-web/stock-exchange-trading-floor.jpg");
const crisisStore = staticFile("images/new-signals-volume-web/stock-market-charts-illustration.jpg");
const analystPortrait = staticFile("images/new-signals-volume-web/us-stock-market-investing.jpg");

export const newSignalsVolumeData = {
  variant: "dark" as const,
  newsContext: {
    kicker: "MARKET SIGNAL / VOLUME",
    title: "价格还在冲高，真正要看的不是情绪有多热，而是成交量有没有跟上",
    quote:
      "当上涨只剩价格在走，而参与的人越来越少，突破就可能从趋势确认变成诱多信号。",
    sourceLabel: "new_signals / volume divergence",
    bullets: [
      "热门行情会放大“还会继续涨”的叙事，让人忽略内部动能变化",
      "成交量不跟随价格放大，说明新买盘可能正在减少",
      "背离本身不等于反转，但它会提醒你降低追高和加仓冲动",
    ],
    tags: ["成交量背离", "突破验证", "诱多风险", "趋势衰减"],
    mediaCards: [
      {
        imageSrc: marketCrowd,
        label: "情绪扩散",
        caption: "越多人只讨论涨幅，越容易忽略真正支撑价格的买盘是否还在增加。",
      },
      {
        imageSrc: analystPortrait,
        label: "交易视角",
        caption: "成熟交易者不会只看价格新高，还会看这次新高是不是有成交量确认。",
      },
      {
        imageSrc: crisisStore,
        label: "风险后果",
        caption: "当假突破回落，最容易受伤的通常是最后一批追高进场的人。",
      },
    ],
  },
  hook: {
    kicker: "new_signals / volume",
    headline: "成交量背离",
    subheadline:
      "如果价格继续创新高，但成交量一波比一波低，这不一定是马上反转，却说明这段上涨可能已经开始缺少新的推动力。",
    stat: "价涨量缩",
    statLabel: "不是看到新高就追，而是先判断这次突破有没有真实买盘确认。",
    dateLabel: "先看风险信号，再判断是否执行",
    insetImageSrc: chartRef1,
    sourceLabel: "信号重点：价格新高 + 量能衰减 + 回踩确认",
    boardLines: ["PRICE", "UP", "VOLUME", "DOWN"],
  },
  mechanism: {
    tag: "指标机制",
    title: "成交量背离看的不是涨跌本身，而是价格推进背后的参与强度",
    formula: "价格方向 + 成交量变化 + 突破位置 + 回踩确认",
    description:
      "价格可以继续创新高，但如果成交量没有同步放大，说明推动价格继续上行的新增力量可能在变弱。它不是独立交易命令，而是风险预警和突破质量过滤器。",
    cards: [
      {
        title: "先看价格",
        body: "价格是否真的突破前高，还是只是在高位窄幅拉扯。没有结构突破，背离意义会变弱。",
      },
      {
        title: "再看量能",
        body: "健康突破通常伴随量能扩张；如果价格走高但量能萎缩，说明追随买盘不足。",
      },
      {
        title: "看回踩",
        body: "突破后的回踩能否守住关键位，决定这次新高是趋势延续，还是短暂诱多。",
      },
      {
        title: "看执行",
        body: "背离只提示风险，不直接替代止损、仓位和入场确认。",
      },
    ],
    imageSrc: chartRef2,
  },
  cases: [
    {
      badge: "案例 1",
      title: "价格创新高，但成交量没有创新高",
      takeaway:
        "这是最典型的量价背离。它不代表马上下跌，但说明新高背后的买盘强度不足，继续追高的性价比开始下降。",
      bullets: [
        "价格突破前高",
        "成交量低于上一波上涨",
        "先降低追高冲动，而不是立刻反手做空",
      ],
      imageSrc: chartRef1,
    },
    {
      badge: "案例 2",
      title: "突破后缩量横盘，风险开始集中在回踩",
      takeaway:
        "如果突破之后没有继续放量，说明市场还没有给出强确认。真正关键的是回踩时能不能守住突破位。",
      bullets: [
        "缩量横盘说明分歧还没解决",
        "守住突破位才算初步确认",
        "跌回突破位下方要重新评估信号",
      ],
      imageSrc: chartRef2,
    },
    {
      badge: "案例 3",
      title: "放量跌回突破位，假突破概率上升",
      takeaway:
        "价格跌回突破位并伴随放量，说明前面的突破可能吸引了追高资金，随后被更强的卖盘反向吞没。",
      bullets: [
        "跌回突破位下方",
        "下跌量能明显放大",
        "优先控制风险，而不是继续解释为洗盘",
      ],
      imageSrc: chartRef3,
    },
  ],
  checklist: {
    title: "更稳的成交量背离判断，是先确认新高，再确认量能，最后等回踩给答案",
    subtitle:
      "不要把成交量背离当成单独的买卖按钮。它最适合用来过滤假突破、提醒追高风险，并帮助你决定是否要收紧仓位。",
    steps: [
      {
        title: "先确认价格结构",
        body: "没有突破前高，就不要急着谈背离。先确认价格是否真的走到了需要验证的位置。",
      },
      {
        title: "再比较成交量",
        body: "看这一波上涨的成交量，是否低于上一波同级别上涨。如果量能没跟上，风险灯开始亮起。",
      },
      {
        title: "最后等回踩验证",
        body: "回踩守住突破位，信号可以继续观察；跌回突破位下方，就要优先考虑假突破风险。",
      },
    ],
  },
  close: {
    title: "成交量背离真正提醒你的，不是马上反转，而是这段上涨可能没有看起来那么强",
    body:
      "价格新高会让人兴奋，但量能衰减会告诉你：参与者可能正在减少。把它当成风险灯，而不是交易按钮，你就更容易在最热的时候少追一点，在最危险的位置多等一个确认。",
    tags: ["量价关系", "假突破过滤", "追高风险", "回踩确认"],
  },
} as const;
