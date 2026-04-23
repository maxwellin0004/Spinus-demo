import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const comicHabitSpiralAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/comic-habit-spiral/procrastination-loop-voiceover.mp3",
  voiceoverEnabled: true,
  subtitles: [
    {
      startFrame: 0,
      endFrame: 329,
      text: "你真正要打断的，不是拖延本身，\n而是压力一来就先逃的默认反应。",
      emphasisWords: ["不是拖延本身", "默认反应"],
    },
    {
      startFrame: 330,
      endFrame: 689,
      text: "很多拖延不是因为你没有目标，\n而是因为身体先学会了：先躲开，马上会舒服一点。",
      emphasisWords: ["先躲开", "舒服一点"],
    },
    {
      startFrame: 690,
      endFrame: 1139,
      text: "问题在于，短暂轻松之后，任务还在，\n罪恶感更重，下次只会更难开始。",
      emphasisWords: ["罪恶感更重", "更难开始"],
    },
    {
      startFrame: 1140,
      endFrame: 1499,
      text: "真正有效的改变，不是靠更狠的决心，\n而是让开始这件事变得更小、更容易。",
      emphasisWords: ["更小", "更容易"],
    },
    {
      startFrame: 1500,
      endFrame: 1799,
      text: "下一次别要求自己立刻变强，\n只要先别自动逃开，从一个小动作重新训练自己。",
      emphasisWords: ["别自动逃开", "小动作"],
    },
  ],
});
