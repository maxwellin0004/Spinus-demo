import { createVoiceOnlyAudioConfig } from "./audioPresets";
import type { BilingualQuoteCue } from "../components/video/BilingualQuoteTrack";

export const literaryEmbersSubtitleCues: BilingualQuoteCue[] = [
  {
    "voiceId": "le_v01",
    "startFrame": 0,
    "endFrame": 139,
    "textZh": "\u8fd9\u53e5\u8bdd\u4f1a\u523a\u75db\u6240\u6709\n\u4e0d\n\u7518\u5fc3\u5374\u4e00\u76f4\u66ff\u522b\u4eba\u6d3b\u7684\u4eba",
    "textEn": "This line hits everyone\nwho keeps living for other eyes.",
    "emphasisWords": [
      "\u66ff\u522b\u4eba\u6d3b"
    ]
  },
  {
    "voiceId": "le_v02",
    "startFrame": 144,
    "endFrame": 233,
    "textZh": "\u4eca\u5929\u5206\u4eab\u300a\u6708\u4eae\u4e0e\u516d\u4fbf\u58eb\u300b",
    "textEn": "Today: The Moon and Sixpence.",
    "emphasisWords": [
      "\u300a\u6708\u4eae\u4e0e\u516d\u4fbf\u58eb\u300b"
    ]
  },
  {
    "voiceId": "le_v03",
    "startFrame": 238,
    "endFrame": 360,
    "textZh": "\u5f88\u591a\u4eba\u4e0d\u662f\u6ca1\u6709\u5929\u8d4b\uff0c\n\n\u53ea\u662f\u4ece\u6765\u6ca1\u66ff\u81ea\u5df1\u6d3b\u8fc7",
    "textEn": "Many people lack not talent,\nbut the courage to live for themselves.",
    "emphasisWords": [
      "\u66ff\u81ea\u5df1\u6d3b\u8fc7"
    ]
  },
  {
    "voiceId": "le_v04",
    "startFrame": 362,
    "endFrame": 516,
    "textZh": "\u4f60\u62b1\u6028\u751f\u6d3b\u6c89\u95f7\uff0c\n\n\u5374\u628a\u6bcf\u6b21\u9009\u62e9\u90fd\u4ea4\u7ed9\u4f53\u9762\u548c\u76ee\u5149",
    "textEn": "You resent a dull life,\nyet hand every choice to approval and safety.",
    "emphasisWords": [
      "\u4f53\u9762",
      "\u76ee\u5149"
    ]
  },
  {
    "voiceId": "le_v05",
    "startFrame": 518,
    "endFrame": 641,
    "textZh": "\u4e8e\u662f\u5de5\u4f5c\u662f\u4e3a\u4e86\u4ea4\u4ee3\uff0c\n\n\u52aa\u529b\u662f\u4e3a\u4e86\u6bd4\u8f83",
    "textEn": "Work becomes explanation,\nand effort becomes comparison.",
    "emphasisWords": [
      "\u4ea4\u4ee3",
      "\u6bd4\u8f83"
    ]
  },
  {
    "voiceId": "le_v06",
    "startFrame": 646,
    "endFrame": 799,
    "textZh": "\u771f\u6b63\u56f0\u4f4f\u4eba\u7684\u4e0d\u662f\u8d77\u70b9\uff0c\n\n\u800c\u662f\u542c\u89c1\u5185\u5fc3\u540e\u53c8\u628a\u5b83\u6309\u56de\u53bb",
    "textEn": "What traps you is not the start,\nbut silencing what you already heard inside.",
    "emphasisWords": [
      "\u6309\u56de\u53bb"
    ]
  },
  {
    "voiceId": "le_v07",
    "startFrame": 802,
    "endFrame": 972,
    "textZh": "\u4e0d\u662f\u6bcf\u4e2a\u4eba\u90fd\u8981\u79bb\u5f00\u73b0\u5b9e\uff0c\n\n\u4f46\u6bcf\u4e2a\u4eba\u90fd\u8be5\u6709\u4e00\u6b21\u4e3a\u81ea\u5df1\u8d1f\u8d23\u7684\u51b3\u5b9a",
    "textEn": "Not everyone must flee reality,\nbut everyone deserves one decision owned by the self.",
    "emphasisWords": [
      "\u4e3a\u81ea\u5df1\u8d1f\u8d23"
    ]
  },
  {
    "voiceId": "le_v08",
    "startFrame": 975,
    "endFrame": 1104,
    "textZh": "\u5982\u679c\u4f60\u603b\u6015\u5931\u53bb\u638c\u58f0\uff0c\n\n\u6700\u540e\u5931\u53bb\u7684\u5f80\u5f80\u5c31\u662f\u81ea\u5df1",
    "textEn": "If you fear losing applause,\nyou may end up losing yourself.",
    "emphasisWords": [
      "\u81ea\u5df1"
    ]
  }
];

export const literaryEmbersAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/literary-embers/moon-sixpence-elevenlabs-cn.mp3",
  subtitles: [
  {
    "startFrame": 0,
    "endFrame": 139,
    "text": "\u8fd9\u53e5\u8bdd\u4f1a\u523a\u75db\u6240\u6709\n\u4e0d\n\u7518\u5fc3\u5374\u4e00\u76f4\u66ff\u522b\u4eba\u6d3b\u7684\u4eba",
    "emphasisWords": [
      "\u66ff\u522b\u4eba\u6d3b"
    ]
  },
  {
    "startFrame": 144,
    "endFrame": 233,
    "text": "\u4eca\u5929\u5206\u4eab\u300a\u6708\u4eae\u4e0e\u516d\u4fbf\u58eb\u300b",
    "emphasisWords": [
      "\u300a\u6708\u4eae\u4e0e\u516d\u4fbf\u58eb\u300b"
    ]
  },
  {
    "startFrame": 238,
    "endFrame": 360,
    "text": "\u5f88\u591a\u4eba\u4e0d\u662f\u6ca1\u6709\u5929\u8d4b\uff0c\n\n\u53ea\u662f\u4ece\u6765\u6ca1\u66ff\u81ea\u5df1\u6d3b\u8fc7",
    "emphasisWords": [
      "\u66ff\u81ea\u5df1\u6d3b\u8fc7"
    ]
  },
  {
    "startFrame": 362,
    "endFrame": 516,
    "text": "\u4f60\u62b1\u6028\u751f\u6d3b\u6c89\u95f7\uff0c\n\n\u5374\u628a\u6bcf\u6b21\u9009\u62e9\u90fd\u4ea4\u7ed9\u4f53\u9762\u548c\u76ee\u5149",
    "emphasisWords": [
      "\u4f53\u9762",
      "\u76ee\u5149"
    ]
  },
  {
    "startFrame": 518,
    "endFrame": 641,
    "text": "\u4e8e\u662f\u5de5\u4f5c\u662f\u4e3a\u4e86\u4ea4\u4ee3\uff0c\n\n\u52aa\u529b\u662f\u4e3a\u4e86\u6bd4\u8f83",
    "emphasisWords": [
      "\u4ea4\u4ee3",
      "\u6bd4\u8f83"
    ]
  },
  {
    "startFrame": 646,
    "endFrame": 799,
    "text": "\u771f\u6b63\u56f0\u4f4f\u4eba\u7684\u4e0d\u662f\u8d77\u70b9\uff0c\n\n\u800c\u662f\u542c\u89c1\u5185\u5fc3\u540e\u53c8\u628a\u5b83\u6309\u56de\u53bb",
    "emphasisWords": [
      "\u6309\u56de\u53bb"
    ]
  },
  {
    "startFrame": 802,
    "endFrame": 972,
    "text": "\u4e0d\u662f\u6bcf\u4e2a\u4eba\u90fd\u8981\u79bb\u5f00\u73b0\u5b9e\uff0c\n\n\u4f46\u6bcf\u4e2a\u4eba\u90fd\u8be5\u6709\u4e00\u6b21\u4e3a\u81ea\u5df1\u8d1f\u8d23\u7684\u51b3\u5b9a",
    "emphasisWords": [
      "\u4e3a\u81ea\u5df1\u8d1f\u8d23"
    ]
  },
  {
    "startFrame": 975,
    "endFrame": 1104,
    "text": "\u5982\u679c\u4f60\u603b\u6015\u5931\u53bb\u638c\u58f0\uff0c\n\n\u6700\u540e\u5931\u53bb\u7684\u5f80\u5f80\u5c31\u662f\u81ea\u5df1",
    "emphasisWords": [
      "\u81ea\u5df1"
    ]
  }
],
  voiceoverEnabled: true,
});
