import { staticFile } from "remotion";

const scenarioBatchContent = staticFile("images/shared/scenario_batch_content.jpg");
const scenarioPpt = staticFile("images/shared/scenario_ppt.jpg");
const scenarioVideoBreakdown = staticFile("images/shared/scenario_video_breakdown.jpg");

export const skillHorizontalSample = {
  hook: {
    eyebrow: "AI Workflow Packaging",
    headline: "为什么同样的 Claude，别人越用越顺，你越用越乱？",
    supportingText:
      "差别不一定在模型本身，而在你有没有把任务经验沉淀成可复用的 skill。",
    accentWords: ["Claude", "skill"],
    rightPanelTitle: "Skill Snapshot",
    rightPanelLines: [
      "它不是一句 prompt。",
      "它是任务说明、风格规则、输入输出约束和步骤经验的打包层。",
      "同一个模型，因此开始稳定、像你、能批量。",
    ],
  },
  definition: {
    eyebrow: "Core Definition",
    term: "Skill = 给智能体装上的任务模块",
    definition:
      "你可以把它理解成一个可重复加载的小工作单元。模型不用每次从零理解你的要求，而是直接套用你已经整理好的经验。",
    bullets: [
      "存储做事方式，而不是只存一句指令",
      "把步骤、风格、限制和输出格式固化下来",
      "让同类任务反复执行时更稳、更快、更一致",
    ],
  },
  valueCards: {
    eyebrow: "Why It Matters",
    headline: "真正有用的地方，不是更炫，而是更稳定地复现结果",
    cards: [
      {
        title: "稳定输出",
        description:
          "相同类型的任务重复执行时，结构和表达不会每次都飘。",
      },
      {
        title: "减少重教",
        description:
          "不用每次重新解释语气、格式、步骤和边界，节省来回调教成本。",
      },
      {
        title: "方便批量化",
        description:
          "一旦主题换掉，底层做法还能保留，适合系列内容和工作流跑量。",
      },
    ],
  },
  flow: {
    eyebrow: "How It Works",
    headline: "一个 skill，通常把这四层东西打包在一起",
    steps: [
      "任务目标: 这次到底要做什么，成功标准是什么。",
      "执行步骤: 先分析什么，再产出什么，顺序怎样安排。",
      "风格规则: 用词、语气、结构、重点突出方式如何统一。",
      "输出约束: 最终交付成什么格式，哪些字段必须给全。",
    ],
    footer:
      "当这四层固定下来，模型就不再像临场发挥，而更像进入了你定义好的工作模式。",
  },
  scenarios: {
    eyebrow: "Use Cases",
    headline: "它最适合出现在这些高重复、强结构的工作里",
    cards: [
      {
        title: "PPT 动画页制作",
        description:
          "固定页面结构、动效节奏和文案密度，换主题后还能稳定套版。",
        imageSrc: scenarioPpt,
      },
      {
        title: "视频拆解分析",
        description:
          "统一标题、结构、节奏、字幕和包装的拆解方式，分析结果更可比较。",
        imageSrc: scenarioVideoBreakdown,
      },
      {
        title: "批量内容生产",
        description:
          "保留固定框架，只替换 topic、outcome 和场景块，快速生成系列化内容。",
        imageSrc: scenarioBatchContent,
      },
    ],
  },
  close: {
    eyebrow: "Closing",
    headline: "skill 的本质，不是让 AI 更聪明，而是让它更像同一个团队成员。",
    subheadline:
      "当你把经验沉淀成模块，后面换主题、换任务、换平台，依然能沿着同一套方法稳定产出。",
  },
} as const;
