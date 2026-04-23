import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const mcpReferenceCloneAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/ai-concept-analyse/mcp-horizontal-voiceover.mp3",
  voiceoverEnabled: true,
  subtitles: [
    {
      startFrame: 0,
      endFrame: 359,
      text: "MCP 的重点，不是多一个 AI 名词，\n而是给模型一层稳定的工具连接方式。",
      emphasisWords: ["工具连接方式"],
    },
    {
      startFrame: 360,
      endFrame: 809,
      text: "它让模型不只是会说，\n而是能更规范地接资源、调工具、拿结果。",
      emphasisWords: ["接资源", "调工具", "拿结果"],
    },
    {
      startFrame: 810,
      endFrame: 1259,
      text: "所以 MCP 更像连接层，\n适合把搜索、文件、数据库和外部服务串起来。",
      emphasisWords: ["连接层", "串起来"],
    },
    {
      startFrame: 1260,
      endFrame: 1649,
      text: "如果 Prompt 负责发指令，Agent 负责持续执行，\n那 MCP 负责把这些能力真正接到外部系统。",
      emphasisWords: ["Prompt", "Agent", "MCP"],
    },
    {
      startFrame: 1650,
      endFrame: 1949,
      text: "它最有价值的地方，是让 AI 工作流从零散调用，\n走向可复用、可扩展、可维护的系统连接。",
      emphasisWords: ["可复用", "可扩展", "可维护"],
    },
  ],
});
