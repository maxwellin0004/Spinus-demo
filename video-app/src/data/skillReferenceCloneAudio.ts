import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const skillReferenceCloneAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/ai-concept-analyse/skill-horizontal-voiceover.mp3",
  voiceoverEnabled: true,
  subtitles: [
    {
      startFrame: 0,
      endFrame: 359,
      text: "Skill 不是一句 prompt 风格，\n而是把一类任务的经验固化成可重复调用的能力模块。",
      emphasisWords: ["可重复调用", "能力模块"],
    },
    {
      startFrame: 360,
      endFrame: 809,
      text: "它把结构、规则、输入输出、注意事项打包起来，\n让模型在同类任务上更稳定。",
      emphasisWords: ["结构", "输入输出", "更稳定"],
    },
    {
      startFrame: 810,
      endFrame: 1259,
      text: "所以 Skill 特别适合内容生产、分析拆解、代码流程这类\n会重复发生、又希望质量一致的场景。",
      emphasisWords: ["重复发生", "质量一致"],
    },
    {
      startFrame: 1260,
      endFrame: 1619,
      text: "如果 Prompt 负责单次表达，\nSkill 更像把一整套做事方法沉淀下来。",
      emphasisWords: ["单次表达", "做事方法"],
    },
    {
      startFrame: 1620,
      endFrame: 1949,
      text: "真正的价值，不是让模型更有灵感，\n而是让你反复做同类任务时，速度更快、结果更稳。",
      emphasisWords: ["速度更快", "结果更稳"],
    },
  ],
});
