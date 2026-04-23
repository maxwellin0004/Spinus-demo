import type { AudioLayerConfig } from "../lib/audioTypes";

export const newSignalsVolumeVoiceoverUnits = [
  {
    "voiceId": "v01",
    "visualSectionId": "news_context",
    "text": "一段行情最容易让人误判的时候，往往不是下跌之后。",
    "emphasisWords": [
      "误判"
    ]
  },
  {
    "voiceId": "v02",
    "visualSectionId": "news_context",
    "text": "而是价格还在创新高的时候。",
    "emphasisWords": [
      "创新高"
    ]
  },
  {
    "voiceId": "v03",
    "visualSectionId": "case_shock",
    "text": "如果价格继续往上走，但成交量却一波比一波低。",
    "emphasisWords": [
      "价格",
      "成交量"
    ]
  },
  {
    "voiceId": "v04",
    "visualSectionId": "case_shock",
    "text": "这通常不是健康加速，而是推动行情的人正在变少。",
    "emphasisWords": [
      "不是健康加速",
      "正在变少"
    ]
  },
  {
    "voiceId": "v05",
    "visualSectionId": "indicator_mechanism",
    "text": "成交量背离真正有用的地方，不是让你立刻做空。",
    "emphasisWords": [
      "成交量背离",
      "不是立刻做空"
    ]
  },
  {
    "voiceId": "v06",
    "visualSectionId": "indicator_mechanism",
    "text": "而是提醒你先暂停追高。",
    "emphasisWords": [
      "暂停追高"
    ]
  },
  {
    "voiceId": "v07",
    "visualSectionId": "indicator_mechanism",
    "text": "观察突破是不是还有真实买盘支撑。",
    "emphasisWords": [
      "真实买盘支撑"
    ]
  },
  {
    "voiceId": "v08",
    "visualSectionId": "chart_case_1",
    "text": "更稳的顺序是，先看价格有没有新高。",
    "emphasisWords": [
      "先看价格"
    ]
  },
  {
    "voiceId": "v09",
    "visualSectionId": "chart_case_1",
    "text": "再看成交量有没有同步放大。",
    "emphasisWords": [
      "成交量",
      "同步放大"
    ]
  },
  {
    "voiceId": "v10",
    "visualSectionId": "chart_case_2",
    "text": "然后看回踩时能不能守住关键位置。",
    "emphasisWords": [
      "回踩",
      "关键位置"
    ]
  },
  {
    "voiceId": "v11",
    "visualSectionId": "chart_case_2",
    "text": "如果价格创新高，量能缩小。",
    "emphasisWords": [
      "价格创新高",
      "量能缩小"
    ]
  },
  {
    "voiceId": "v12",
    "visualSectionId": "chart_case_3",
    "text": "回踩又跌回突破位下方。",
    "emphasisWords": [
      "跌回突破位"
    ]
  },
  {
    "voiceId": "v13",
    "visualSectionId": "chart_case_3",
    "text": "这种突破就更像诱多，而不是趋势确认。",
    "emphasisWords": [
      "诱多",
      "不是趋势确认"
    ]
  },
  {
    "voiceId": "v14",
    "visualSectionId": "checklist",
    "text": "所以成交量背离不是买卖按钮。",
    "emphasisWords": [
      "不是买卖按钮"
    ]
  },
  {
    "voiceId": "v15",
    "visualSectionId": "checklist",
    "text": "它更像一个风险灯。",
    "emphasisWords": [
      "风险灯"
    ]
  },
  {
    "voiceId": "v16",
    "visualSectionId": "risk_close",
    "text": "当价格很漂亮，但参与的人越来越少。",
    "emphasisWords": [
      "价格很漂亮",
      "参与的人越来越少"
    ]
  },
  {
    "voiceId": "v17",
    "visualSectionId": "risk_close",
    "text": "你就需要把仓位、止损和追高冲动重新检查一遍。",
    "emphasisWords": [
      "仓位",
      "止损",
      "追高冲动"
    ]
  }
];

export const newSignalsVolumeVoiceoverText = newSignalsVolumeVoiceoverUnits
  .map((unit) => unit.text)
  .join(" ");

export const newSignalsVolumeAudio: AudioLayerConfig = {
  voiceover: {
    src: "/audio/new-signals/volume-divergence-voiceover-aligned.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  bgm: {
    src: "/audio/new-signals/financial-tension-low.mp3",
    startFrame: 0,
    volume: 0.18,
    loop: true,
    enabled: false,
  },
  sfx: [
    {
      src: "/audio/sfx/headline-hit-01.mp3",
      startFrame: 16,
      volume: 0.62,
      enabled: false,
    },
    {
      src: "/audio/sfx/chart-tick-01.mp3",
      startFrame: 420,
      volume: 0.32,
      enabled: false,
    },
  ],
  subtitles: [
  {
    "startFrame": 0,
    "endFrame": 120,
    "text": "一段行情最容易让人误判的时候，\n往往不是下跌之后。",
    "emphasisWords": [
      "误判"
    ]
  },
  {
    "startFrame": 124,
    "endFrame": 204,
    "text": "而是价格还在创新高的时候。",
    "emphasisWords": [
      "创新高"
    ]
  },
  {
    "startFrame": 206,
    "endFrame": 326,
    "text": "如果价格继续往上走，\n但成交量却一波比一波低。",
    "emphasisWords": [
      "价格",
      "成交量"
    ]
  },
  {
    "startFrame": 329,
    "endFrame": 468,
    "text": "这通常不是健康加速，\n而是推动行情的人正在变少。",
    "emphasisWords": [
      "不是健康加速",
      "正在变少"
    ]
  },
  {
    "startFrame": 470,
    "endFrame": 583,
    "text": "成交量背离真正有用的地方，\n不是让你立刻做空。",
    "emphasisWords": [
      "成交量背离",
      "不是立刻做空"
    ]
  },
  {
    "startFrame": 586,
    "endFrame": 660,
    "text": "而是提醒你先暂停追高。",
    "emphasisWords": [
      "暂停追高"
    ]
  },
  {
    "startFrame": 665,
    "endFrame": 754,
    "text": "观察突破是不是还有真实买盘支撑。",
    "emphasisWords": [
      "真实买盘支撑"
    ]
  },
  {
    "startFrame": 757,
    "endFrame": 852,
    "text": "更稳的顺序是，先看价格有没有新高。",
    "emphasisWords": [
      "先看价格"
    ]
  },
  {
    "startFrame": 857,
    "endFrame": 929,
    "text": "再看成交量有没有同步放大。",
    "emphasisWords": [
      "成交量",
      "同步放大"
    ]
  },
  {
    "startFrame": 934,
    "endFrame": 1032,
    "text": "然后看回踩时能不能守住关键位置。",
    "emphasisWords": [
      "回踩",
      "关键位置"
    ]
  },
  {
    "startFrame": 1035,
    "endFrame": 1111,
    "text": "如果价格创新高，量能缩小。",
    "emphasisWords": [
      "价格创新高",
      "量能缩小"
    ]
  },
  {
    "startFrame": 1115,
    "endFrame": 1186,
    "text": "回踩又跌回突破位下方。",
    "emphasisWords": [
      "跌回突破位"
    ]
  },
  {
    "startFrame": 1188,
    "endFrame": 1303,
    "text": "这种突破就更像诱多，\n而不是趋势确认。",
    "emphasisWords": [
      "诱多",
      "不是趋势确认"
    ]
  },
  {
    "startFrame": 1304,
    "endFrame": 1373,
    "text": "所以成交量背离不是买卖按钮。",
    "emphasisWords": [
      "不是买卖按钮"
    ]
  },
  {
    "startFrame": 1378,
    "endFrame": 1428,
    "text": "它更像一个风险灯。",
    "emphasisWords": [
      "风险灯"
    ]
  },
  {
    "startFrame": 1430,
    "endFrame": 1529,
    "text": "当价格很漂亮，但参与的人越来越少。",
    "emphasisWords": [
      "价格很漂亮",
      "参与的人越来越少"
    ]
  },
  {
    "startFrame": 1530,
    "endFrame": 1654,
    "text": "你就需要把仓位、\n止损和追高冲动重新检查一遍。",
    "emphasisWords": [
      "仓位",
      "止损",
      "追高冲动"
    ]
  }
],
};
