import { staticFile } from "remotion";

const chartRef1 = staticFile("images/shared/macd_ref_chart_1.jpg");
const chartRef2 = staticFile("images/shared/macd_ref_chart_2.jpg");
const chartRef3 = staticFile("images/shared/macd_ref_chart_3.jpg");
const paulTudorJones = staticFile("images/shared/hook_paul_tudor_jones.jpg");
const occupyWallStreet = staticFile("images/shared/hook_occupy_wall_street.jpg");
const crisisStore = staticFile("images/shared/hook_financial_crisis_store.jpg");

export const newSignalsData = {
  newsContext: {
    kicker: "市场热点 / 新闻引用",
    title: "最危险的时候，新闻、人物和街头情绪都会让你觉得行情还没结束",
    quote:
      "真正该警惕的，不是新闻在讲什么，而是价格还在涨的时候，内部动能有没有开始先掉队。",
    sourceLabel: "新闻型 Hook：人物引用 + 事件图像 + 市场后果，再切回技术证据",
    bullets: [
      "热点会放大“还在涨”这件事",
      "人物和媒体会强化“这次不一样”的叙事",
      "技术指标真正有用的地方，是先告诉你里面已经没那么强",
    ],
    tags: ["新闻叙事", "名人观点", "街头情绪", "技术证据"],
    mediaCards: [
      {
        imageSrc: paulTudorJones,
        label: "人物引用",
        caption: "人物和观点，会让市场更像“还有理由继续涨”。",
      },
      {
        imageSrc: occupyWallStreet,
        label: "市场情绪",
        caption: "情绪最热的时候，风险常常最容易被忽略。",
      },
      {
        imageSrc: crisisStore,
        label: "现实后果",
        caption: "一旦趋势开始掉速，后果往往比新闻标题来得更快。",
      },
    ],
  },
  hook: {
    kicker: "指标警报模板 01",
    headline: "MACD 背离",
    subheadline:
      "市场表面最热的时候，很多人只看见价格冲高，却没看见动能已经先掉队。这个时差，才是背离最有价值的地方。",
    stat: "-16%",
    statLabel: "不是先讲指标定义，而是先给“追高以后会发生什么”的现实后果。",
    dateLabel: "先案例冲击，再切到图表证据",
    insetImageSrc: chartRef1,
    sourceLabel: "Hook 板式灵感：金融危机报纸头版 / 新闻情绪面",
    boardLines: ["MARKET", "EUPHORIA", "THEN", "TUMBLE"],
  },
  mechanism: {
    tag: "指标机制",
    title: "MACD 背离不是单独开仓按钮，而是趋势动能衰减的提前预警",
    formula: "先看价格  再看柱体与 DIF/DEA  是否同步",
    description:
      "当价格继续创新高，但红柱、DIF、DEA 没有继续同步放大，这类不同步才是背离真正有价值的地方。它本质上是在告诉你：表面还在涨，里面已经没那么强。",
    cards: [
      {
        title: "价格结构",
        body: "先确认价格是不是还在延续原本方向，背离只在“继续创新高/新低”的前提下更有意义。",
      },
      {
        title: "柱体变化",
        body: "价格在冲，MACD 柱体却缩短，说明推进这段行情的力量已经开始减弱。",
      },
      {
        title: "快慢线",
        body: "DIF 与 DEA 的扩张速度放缓，往往会比价格更早暴露出疲态。",
      },
      {
        title: "确认动作",
        body: "背离只是预警。关键位失守、趋势线破坏、量价配合，才更接近能执行的信号。",
      },
    ],
    imageSrc: chartRef2,
  },
  cases: [
    {
      badge: "用法 1",
      title: "趋势末端预警，不是立刻反手",
      takeaway:
        "价格还在冲高，但红柱一波比一波弱时，先把它当作风险升温，而不是直接当成做空按钮。",
      bullets: [
        "先看“价格继续创新高”",
        "再看“柱体和快慢线没跟上”",
        "最后才决定是否减仓、等待确认",
      ],
      imageSrc: chartRef1,
    },
    {
      badge: "用法 2",
      title: "只有碰到结构位，背离价值才会放大",
      takeaway:
        "背离单独看很容易误伤趋势。真正有价值的是它刚好出现在前高、前低、支撑压力位附近。",
      bullets: [
        "不脱离结构单独理解",
        "和关键位配合，过滤噪音",
        "确认以后再把它升级成执行信号",
      ],
      imageSrc: chartRef2,
    },
    {
      badge: "用法 3",
      title: "它最适合过滤假突破和高位追单",
      takeaway:
        "表面上价格还在破位向上，但动能已经衰减时，很多所谓的强突破其实不再值得追。",
      bullets: ["表面是突破", "内部是动能衰减", "用来提醒自己别在高位追涨"],
      imageSrc: chartRef3,
    },
  ],
  checklist: {
    title: "一条更稳的判断顺序，是先看价格结构，再看动能，最后等确认",
    subtitle:
      "这套模板的核心不是“教你背公式”，而是把指标放回真实决策链路里：先识别风险，再等动作，不把预警错当信号。",
    steps: [
      {
        title: "先看价格有没有继续创新高/新低",
        body: "没有结构延续，背离本身就失去讨论价值。第一步永远是先看走势结构是不是还在推进。",
      },
      {
        title: "再看 MACD 是否已经先走弱",
        body: "柱体缩短、快慢线扩张放缓，都是“表面涨、内部弱”的信号。",
      },
      {
        title: "最后等确认，不把预警当开仓按钮",
        body: "关键位失守、趋势线破坏、量价配合，才是把它从提醒升级成动作的步骤。",
      },
    ],
  },
  close: {
    title: "MACD 背离真正的价值，是让你更早意识到这段趋势没表面看起来那么健康。",
    body:
      "它是风险提醒，不是交易命令。真正成熟的用法，是把它和结构位、确认动作放在一起看，而不是单独盯着一个金叉死叉。",
    tags: ["趋势动能", "结构确认", "风险预警", "不要单独开仓"],
  },
} as const;
