import { staticFile } from "remotion";

const chartRef1 = staticFile("images/shared/macd_ref_chart_1.jpg");
const chartRef2 = staticFile("images/shared/macd_ref_chart_2.jpg");
const chartRef3 = staticFile("images/shared/macd_ref_chart_3.jpg");

export const macdIndicatorData = {
  hookFrames: [
    {
      label: "指标拆解 01",
      title: "MACD",
      ghost: "背离",
      subtitle: "不是看到金叉就冲，而是先看动能有没有先衰减",
    },
    {
      label: "指标拆解 01",
      title: "背离先出现",
      ghost: "动能",
      subtitle: "价格还在冲高，但柱体和快慢线已经没跟上",
    },
    {
      label: "指标拆解 01",
      title: "先看衰竭",
      ghost: "拐点",
      subtitle: "MACD 背离更像提前提醒，不是单独开仓按钮",
    },
  ],
  docScene: {
    path: "~/indicator/macd/",
    filename: "MACD.signal",
    headline: "MACD 背离的核心，不是预测顶部底部，而是提前发现趋势动能开始变弱",
    cards: [
      {
        title: "价格",
        description: "先看价格是否继续创新高或创新低，这是背离成立的前提。",
      },
      {
        title: "柱体",
        description: "价格继续走，但红绿柱没有同步放大，说明动能开始衰减。",
      },
      {
        title: "快慢线",
        description: "DIF 和 DEA 的扩张速度放缓，往往比价格更早暴露疲态。",
      },
      {
        title: "确认",
        description: "背离只能算预警，最好结合结构位、成交量或趋势线再确认。",
      },
    ],
  },
  compareScene: {
    leftTitle: "只看金叉死叉",
    rightTitle: "看 MACD 背离",
    leftPoints: [
      "更像滞后的信号反应",
      "容易在震荡里反复被假动作干扰",
      "看到了拐点，但常常已经走了一段",
    ],
    rightPoints: [
      "先从动能衰减里看风险",
      "更适合辅助判断趋势拐点",
      "适合和结构位一起做二次确认",
    ],
    footer: "MACD 背离最有价值的地方，不是替你下单，而是让你更早发现上涨或下跌已经没那么健康。",
  },
  scenarios: [
    {
      badge: "MACD 用法 1",
      title: "趋势末端预警",
      description: "当价格还在新高附近，但红柱一波比一波弱时，先把它当成风险提示，而不是立刻做空。",
      bullets: ["价格创新高", "动能没跟上", "先识别风险再等确认"],
      imageSrc: chartRef1,
    },
    {
      badge: "MACD 用法 2",
      title: "和结构位一起确认",
      description: "如果背离刚好出现在前高、前低、压力位或支撑位附近，它的参考价值会更高。",
      bullets: ["不脱离结构单独看", "结合支撑压力位", "确认后再做动作"],
      imageSrc: chartRef2,
    },
    {
      badge: "MACD 用法 3",
      title: "过滤假突破",
      description: "价格表面上还在冲，但动能明显衰竭时，很多突破就不再值得追。",
      bullets: ["表面突破", "内部动能转弱", "避免高位追单"],
      imageSrc: chartRef3,
    },
  ],
  flowScene: {
    title: "一个最稳的 MACD 背离判断顺序，是先看价格，再看动能，最后等确认",
    steps: [
      {
        title: "先看价格结构",
        body: "价格有没有继续创新高或创新低，先把结构前提确定下来。",
      },
      {
        title: "再看 MACD 动能",
        body: "柱体和快慢线是否同步加强，还是已经明显跟不上价格。",
      },
      {
        title: "最后等确认动作",
        body: "等关键位失守、趋势线破坏或量价配合后，再把它当成交易信号。",
      },
    ],
  },
  conceptCompare: {
    title: "MACD 背离 和 RSI 超买超卖的区别",
    leftLabel: "MACD 背离",
    rightLabel: "RSI 超买超卖",
    leftBody: "更偏动能变化与趋势衰减，适合看拐点风险",
    rightBody: "更偏强弱状态与区间极值，适合看是否进入过热区",
    footer: "MACD 背离更像动能疲态，RSI 更像强弱温度计。两者能配合，但不要混成一个信号。",
  },
  closeScene: {
    headline: "MACD 背离的本质，是提前发现趋势动能正在变弱。",
    subheadline:
      "真正要学会的不是背公式，而是看到价格和动能开始不同步时，先把风险意识提起来。",
  },
} as const;
