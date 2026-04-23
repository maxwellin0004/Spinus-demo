import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const comicEmotionalScrollAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/comic-emotional-insight/emotional-scroll-voiceover.mp3",
  voiceoverEnabled: true,
  subtitles: [
    {
      startFrame: 0,
      endFrame: 329,
      text: "你不是离不开手机，\n你是在借它止痛。",
      emphasisWords: ["借它止痛"],
    },
    {
      startFrame: 330,
      endFrame: 689,
      text: "一条消息、一次空下来、一次不舒服，\n手就会先去碰手机，因为那是最快的情绪缓冲。",
      emphasisWords: ["最快的情绪缓冲"],
    },
    {
      startFrame: 690,
      endFrame: 1139,
      text: "问题是，刷完以后情绪没有真正被接住，\n你只会更空、更累，也更难停下来。",
      emphasisWords: ["没有真正被接住", "更空", "更累"],
    },
    {
      startFrame: 1140,
      endFrame: 1499,
      text: "改变不是立刻戒掉手机，\n而是先打断‘难受就刷’这个自动动作。",
      emphasisWords: ["打断", "自动动作"],
    },
    {
      startFrame: 1500,
      endFrame: 1799,
      text: "下一次先别急着刷，停一个呼吸，\n让自己先回到现实，再决定要不要拿起手机。",
      emphasisWords: ["停一个呼吸", "回到现实"],
    },
  ],
});
