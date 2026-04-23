import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const mcpVerticalAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/ai-concept-analyse/mcp-vertical-voiceover.mp3",
  voiceoverEnabled: true,
  subtitles: [
    {
      startFrame: 0,
      endFrame: 89,
      text: "MCP 给 AI 的，\n不是更多废话，而是真正可执行的连接方式。",
      emphasisWords: ["真正可执行"],
    },
    {
      startFrame: 90,
      endFrame: 224,
      text: "它让模型可以标准化地连接工具、资源和动作，\n适合工作流编排。",
      emphasisWords: ["标准化", "工作流编排"],
    },
    {
      startFrame: 225,
      endFrame: 314,
      text: "所以它不是一个花哨概念，\n而是 AI 接入外部系统的重要桥梁。",
      emphasisWords: ["重要桥梁"],
    },
  ],
});
