export const minimalPsychExplainerData = {
  title: {
    seriesLabel: "常见心理系列",
    title: "心理学中的",
    accent: "反刍思维",
    footer: "喵的心理课",
  },
  reelWords: ["反复回想", "停不下来", "内耗循环"],
  scenes: [
    {
      header: "你不是不知道别想了",
      zh: "为什么一件事已经过去了 / 你的脑子里却还在一遍遍 replay",
      en: "Why does your mind keep replaying / something that already ended?",
      icon: "replay",
      bubble: "再想一遍",
    },
    {
      header: "看起来像在分析",
      zh: "你会不断回想一句话、一个表情、一次失误 / 像在脑海里反复倒带",
      en: "You keep replaying a sentence, a look, or a mistake / as if your brain is constantly rewinding it.",
      icon: "desk",
      bubble: "我是不是说错了",
    },
    {
      header: "其实还停在原地",
      zh: "反刍更像一台跑步机 / 看起来在前进 实际上还停在原地",
      en: "Rumination is more like a treadmill / it feels active, but you are still stuck in place.",
      icon: "treadmill",
    },
    {
      header: "越拉越紧",
      zh: "你越想一次性把它想透 / 它反而会像绳结一样越拉越紧",
      en: "The more you try to solve it in one go / the tighter it becomes, like a knot.",
      icon: "knot",
    },
  ],
  method: {
    title: "打断反刍的 3 个更小动作",
    zh: "不要要求自己一次想透 / 先让脑子离开循环 再回到现实",
    en: "Do not force one perfect insight / first break the loop, then return to reality.",
    steps: [
      {
        label: "动作 1",
        body: "先暂停追问为什么",
        icon: "person",
      },
      {
        label: "动作 2",
        body: "把循环内容写下来",
        icon: "write",
      },
      {
        label: "动作 3",
        body: "只做一个现实里的小动作",
        icon: "step",
      },
    ],
  },
  close: {
    header: "不是逼自己立刻想明白",
    zh: "当你不再逼自己立刻想明白 / 脑子反而会慢慢安静下来",
    en: "When you stop forcing instant clarity / your mind can finally begin to settle.",
    icon: "calm",
  },
} as const;
