import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const philosophyMontageSubtitleCues = [
  {
    startFrame: 0,
    endFrame: 101,
    text: "\u4eca\u5929\u6211\u4eec\u8981\u8bb2\u7684\u662f\n\u6570\u5b57\u6781\u7b80\u4e3b\u4e49\u3002",
    emphasisWords: ["\u6570\u5b57\u6781\u7b80\u4e3b\u4e49"],
  },
  {
    startFrame: 102,
    endFrame: 226,
    text: "\u4f60\u4e0d\u662f\u6ca1\u65f6\u95f4\uff0c\n\u4f60\u662f\u88ab\u566a\u97f3\u5077\u8d70\u4e86\u6ce8\u610f\u529b\u3002",
    emphasisWords: ["\u566a\u97f3", "\u6ce8\u610f\u529b"],
  },
  {
    startFrame: 230,
    endFrame: 319,
    text: "\u5237\u5230\u5f88\u591a\uff0c\n\u4e0d\u7b49\u4e8e\u601d\u8003\u5f88\u591a\u3002",
    emphasisWords: ["\u4e0d\u7b49\u4e8e", "\u601d\u8003"],
  },
  {
    startFrame: 324,
    endFrame: 442,
    text: "\u901a\u77e5\u6bcf\u54cd\u4e00\u6b21\uff0c\n\u4f60\u7684\u5927\u8111\u5c31\u8981\u91cd\u542f\u4e00\u6b21\u3002",
    emphasisWords: ["\u901a\u77e5", "\u91cd\u542f"],
  },
  {
    startFrame: 444,
    endFrame: 535,
    text: "\u8fd9\u4e0d\u662f\u653e\u677e\uff0c\n\u662f\u5207\u6362\u6210\u672c\u3002",
    emphasisWords: ["\u5207\u6362\u6210\u672c"],
  },
  {
    startFrame: 539,
    endFrame: 679,
    text: "\u53ef\u63a7\u7684\u662f\u6253\u5f00\u9891\u6b21\u3001\n\u505c\u7559\u65f6\u957f\u3001\u63d0\u9192\u5f00\u5173\u3002",
    emphasisWords: ["\u53ef\u63a7", "\u505c\u7559\u65f6\u957f", "\u63d0\u9192\u5f00\u5173"],
  },
  {
    startFrame: 682,
    endFrame: 797,
    text: "\u4e0d\u53ef\u63a7\u7684\u662f\n\u63a8\u8350\u673a\u5236\u3001\u70ed\u70b9\u8282\u594f\u3002",
    emphasisWords: ["\u4e0d\u53ef\u63a7", "\u63a8\u8350\u673a\u5236", "\u70ed\u70b9\u8282\u594f"],
  },
  {
    startFrame: 800,
    endFrame: 917,
    text: "\u5148\u95ee\u4e00\u53e5\uff0c\n\u6211\u73b0\u5728\u6253\u5f00\u5b83\u662f\u4e3a\u4e86\u4ec0\u4e48\uff1f",
    emphasisWords: ["\u4e3a\u4e86\u4ec0\u4e48"],
  },
  {
    startFrame: 920,
    endFrame: 1006,
    text: "\u76ee\u7684\u4e0d\u6e05\uff0c\n\u5c31\u5148\u522b\u6253\u5f00\u3002",
    emphasisWords: ["\u76ee\u7684\u4e0d\u6e05"],
  },
  {
    startFrame: 1008,
    endFrame: 1118,
    text: "\u6bcf\u5929\u7ed9\u9ad8\u4ef7\u503c\u4fe1\u606f\n\u4e5d\u5341\u5206\u949f\u9884\u7b97\u3002",
    emphasisWords: ["\u9ad8\u4ef7\u503c\u4fe1\u606f", "\u4e5d\u5341\u5206\u949f"],
  },
  {
    startFrame: 1126,
    endFrame: 1188,
    text: "\u5a31\u4e50\u5ef6\u540e\uff0c\n\u4e0d\u662f\u7981\u6b62\u3002",
    emphasisWords: ["\u5a31\u4e50\u5ef6\u540e"],
  },
  {
    startFrame: 1190,
    endFrame: 1291,
    text: "\u5f53\u4f60\u638c\u63a7\u5165\u53e3\uff0c\n\u7126\u8651\u5148\u4e0b\u964d\u3002",
    emphasisWords: ["\u638c\u63a7\u5165\u53e3", "\u7126\u8651"],
  },
  {
    startFrame: 1301,
    endFrame: 1339,
    text: "\u6548\u7387\u624d\u4f1a\u4e0a\u5347\u3002",
    emphasisWords: ["\u6548\u7387"],
  },
];

export const philosophyMontageAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/philosophy-montage/digital-minimalism-elevenlabs-cn.mp3",
  subtitles: philosophyMontageSubtitleCues,
  voiceoverEnabled: true,
});
