import { staticFile } from "remotion";

const scenarioBatchContent = staticFile("images/shared/scenario_batch_content.jpg");
const scenarioPpt = staticFile("images/shared/scenario_ppt.jpg");
const scenarioVideoBreakdown = staticFile("images/shared/scenario_video_breakdown.jpg");

export const ragReferenceCloneData = {
  hookFrames: [
    {
      label: "AI 系列 33",
      title: "RAG",
      ghost: "检索增强",
      subtitle: "不是多塞一点资料，而是先检索，再回答",
    },
    {
      label: "AI 系列 33",
      title: "不是硬背知识",
      ghost: "引用",
      subtitle: "它先从外部知识库找证据，再组织成回答",
    },
    {
      label: "AI 系列 33",
      title: "是答案链路",
      ghost: "知识",
      subtitle: "让模型从会说，变成有依据地说",
    },
  ],
  docScene: {
    path: "~/workflow/rag/",
    filename: "RAG.flow",
    headline: "RAG 的核心不是多一个模型步骤，而是给回答接上一条可追溯的知识链路",
    cards: [
      {
        title: "检索",
        description: "先根据问题去知识库里找最相关的文档片段，而不是直接裸答。",
      },
      {
        title: "引用",
        description: "把检索到的片段带回上下文，让回答尽量有依据、有来源。",
      },
      {
        title: "生成",
        description: "最后再基于问题和资料一起生成，而不是只依赖模型记忆。",
      },
      {
        title: "更新",
        description: "知识变了，只需要更新资料库，不需要频繁重新训练模型。",
      },
    ],
  },
  compareScene: {
    leftTitle: "普通问答",
    rightTitle: "RAG",
    leftPoints: [
      "更多依赖模型原有记忆",
      "容易出现过时或凭空生成",
      "很难追溯答案来自哪里",
    ],
    rightPoints: [
      "先检索，再生成",
      "回答更容易贴近当前资料",
      "更适合要求依据和出处的场景",
    ],
    footer: "RAG 的价值，不是让模型变神，而是让回答更稳、更新、更能对齐资料来源。",
  },
  scenarios: [
    {
      badge: "RAG 应用场景 1",
      title: "企业知识库问答",
      description:
        "当答案必须贴着内部文档、操作手册或 FAQ 走时，RAG 比裸模型更靠谱。",
      bullets: ["先检索内部资料", "再组织成回答", "适合高频知识问答"],
      imageSrc: scenarioVideoBreakdown,
    },
    {
      badge: "RAG 应用场景 2",
      title: "内容写作引用资料",
      description:
        "写文章、做讲解、做方案时，RAG 可以先抓资料，再生成整理后的内容。",
      bullets: ["减少凭空乱写", "引用信息更集中", "更适合知识型内容生产"],
      imageSrc: scenarioPpt,
    },
    {
      badge: "RAG 应用场景 3",
      title: "多源资料搜索汇总",
      description:
        "当任务需要把多个来源的资料汇总成一个答案时，RAG 更像一条稳定的答案链路。",
      bullets: ["连接多个资料源", "统一整理上下文", "适合复杂检索型任务"],
      imageSrc: scenarioBatchContent,
    },
  ],
  flowScene: {
    title: "一个典型 RAG 链路，会先理解问题，再检索片段，最后结合资料生成答案",
    steps: [
      {
        title: "提出问题",
        body: "先明确用户在问什么，以及需要哪一类知识支持回答。",
      },
      {
        title: "检索资料",
        body: "从知识库或文档集合中找出最相关的片段和上下文。",
      },
      {
        title: "带资料生成",
        body: "基于问题与检索结果一起生成，让答案更贴近真实资料。",
      },
    ],
  },
  conceptCompare: {
    title: "RAG 和微调的区别",
    leftLabel: "RAG",
    rightLabel: "微调",
    leftBody: "先查资料，再回答；改资料比改模型更轻",
    rightBody: "把能力或偏好写进参数；更像长期行为改造",
    footer: "RAG 更像接知识，微调更像改模型习惯。两者不是替代关系，而是不同层的方案。",
  },
  closeScene: {
    headline: "RAG 的本质，是把外部知识接进回答流程。",
    subheadline:
      "理解 RAG 的关键，不是记住缩写，而是明白它让模型先看资料，再给答案。",
  },
} as const;
