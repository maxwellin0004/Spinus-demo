import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const agentReferenceCloneAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/ai-concept-analyse/agent-horizontal-voiceover.mp3",
  voiceoverEnabled: true,
  subtitles: [
    {
      startFrame: 0,
      endFrame: 389,
      text: "Agent 不是聊天框升级版，\n它更像一个会持续推进任务的 AI 执行体。",
      emphasisWords: ["不是聊天框升级版", "AI 执行体"],
    },
    {
      startFrame: 390,
      endFrame: 839,
      text: "它的关键，不只是回答问题，\n而是带着目标、状态和工具继续往下做。",
      emphasisWords: ["目标", "状态", "工具"],
    },
    {
      startFrame: 840,
      endFrame: 1289,
      text: "当任务需要搜集信息、拆步骤、串工具、交结果时，\nAgent 比普通问答模型更适合。",
      emphasisWords: ["拆步骤", "串工具", "交结果"],
    },
    {
      startFrame: 1290,
      endFrame: 1709,
      text: "一条典型的 Agent 链路，是先接收目标，\n再判断动作，调用工具，最后整合结果继续推进。",
      emphasisWords: ["接收目标", "调用工具", "继续推进"],
    },
    {
      startFrame: 1710,
      endFrame: 2099,
      text: "所以理解 Agent，重点不在它会不会说，\n而在它能不能围绕目标把事情一步步做完。",
      emphasisWords: ["围绕目标", "一步步做完"],
    },
  ],
});
