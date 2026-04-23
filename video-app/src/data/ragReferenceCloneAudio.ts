import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const ragReferenceCloneAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/ai-concept-analyse/rag-horizontal-voiceover.mp3",
  voiceoverEnabled: true,
  subtitles: [
    {
      startFrame: 0,
      endFrame: 329,
      text: "RAG 的价值，不是给模型多塞一点资料，\n而是让回答建立在可取回的上下文之上。",
      emphasisWords: ["可取回的上下文"],
    },
    {
      startFrame: 330,
      endFrame: 719,
      text: "没有 RAG，模型更容易只靠参数记忆组织答案；\n有了 RAG，答案可以先查，再答，再引用。",
      emphasisWords: ["先查，再答，再引用"],
    },
    {
      startFrame: 720,
      endFrame: 1139,
      text: "它适合知识库问答、文档检索、内部资料助手，\n尤其适合需要更稳和更新鲜信息的场景。",
      emphasisWords: ["知识库问答", "更稳", "更新鲜信息"],
    },
    {
      startFrame: 1140,
      endFrame: 1499,
      text: "真正成熟的做法，不是只加一个检索步骤，\n而是把召回、筛选、压缩和回答串成完整链路。",
      emphasisWords: ["召回", "筛选", "完整链路"],
    },
    {
      startFrame: 1500,
      endFrame: 1799,
      text: "所以 RAG 讲的不是模型更聪明，\n而是让答案更可追溯、更贴近真实资料。",
      emphasisWords: ["可追溯", "真实资料"],
    },
  ],
});
