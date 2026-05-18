import { requireAdminPermission } from "@/lib/admin";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { requestInsightAiJsonDetailed } from "@/lib/insights/recommendation-ai";
import { findTablesPayload, normalizeScriptTables, validateScriptTables, type ScriptTableGroupKey } from "@/lib/insights/script-tables";
import { prisma } from "@/lib/prisma";

type PromptTestType = "topicRewrite" | "topicGraphic" | "topicVideo" | "caseAnalysis" | "caseGraphic" | "caseVideo";

type PromptTestBody = {
  promptType?: PromptTestType;
  systemPrompt?: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  enabled?: boolean;
};

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function sampleInput(promptType: PromptTestType) {
  const common = {
    directionLabel: "生活方式 / 职场通勤",
    platformLabel: "小红书",
    sourceTitle: "新手别急着买这类通勤包",
    commentSnippets: ["每天背电脑真的肩膀很累", "容量大但是找东西很麻烦", "想看真实通勤场景，不想看广告"],
    userInstruction: "测试用：结果要更详细，图文要包含图片生成提示词，视频要适合 60 秒以内。",
    tableContract: {
      format: "strict_json",
      tableShape: { id: "string", title: "string", columns: ["string"], rows: [["string"]] },
      minimumDetail: "核心字段必须是完整可执行句子，不允许只写短词或占位词。",
      noMarkdown: true,
    },
  };

  if (promptType === "topicRewrite") {
    return {
      items: [
        {
          itemIndex: 0,
          sampleSourceContentId: "demo_001",
          platform: "xiaohongshu",
          platformLabel: "小红书",
          platformTitleGuide: "关键词 + 人群/场景/痛点/结果，适合搜索和收藏。",
          candidateTitle: "通勤包别只看颜值",
          candidateReason: "评论里高频提到容量、重量和分区。",
          sampleTitle: "新手买通勤包，别先看颜值",
          metrics: { likes: 18000, comments: 960, collects: 7600, shares: 1200 },
          tags: ["通勤包", "新手避坑", "真实测评"],
          angles: ["真实通勤一周体验", "同价位容量对比", "适合和不适合人群"],
          commentSnippets: common.commentSnippets,
        },
        {
          itemIndex: 1,
          sampleSourceContentId: "demo_002",
          platform: "douyin",
          platformLabel: "抖音",
          platformTitleGuide: "短、强钩子、强结论，适合首屏停留。",
          candidateTitle: "通勤包怎么选不踩坑",
          candidateReason: "样本里有明显错误选择和结果对比。",
          sampleTitle: "通勤包别只看颜值",
          metrics: { likes: 92000, comments: 3100, collects: 14000, shares: 5500 },
          tags: ["通勤", "避坑", "对比"],
          angles: ["开场展示肩膀累的真实画面", "用两个包对比重量和分区", "结尾给 3 秒自测标准"],
          commentSnippets: ["看完才知道容量大不一定好用", "我就是每天背到肩膀疼", "想看 60 秒讲清楚怎么选"],
        },
      ],
    };
  }

  if (promptType === "caseAnalysis" || promptType === "caseGraphic" || promptType === "caseVideo") {
    return {
      ...common,
      sourceType: "CASE_STUDY",
      caseStudy: {
        title: "通勤包别只看颜值",
        likes: "1.8w",
        stats: ["点赞 1.8w", "收藏 7600", "评论 960"],
        rows: [
          ["标题钩子", "新手买通勤包，别先看颜值"],
          ["核心痛点", "容量大不代表好背，肩带、重量、分区才决定体验"],
          ["内容结构", "反常识开场 -> 痛点放大 -> 三步判断 -> 总结互动"],
        ],
      },
    };
  }

  return {
    ...common,
    sourceType: "TOPIC_RECOMMENDATION",
    topic: {
      title: "新手别急着买这类通勤包",
      keyword: "通勤包",
      reason: "评论痛点集中在容量、重量、分区和真实通勤场景。",
      platform: "xiaohongshu",
      tags: ["通勤包", "职场通勤", "新手避坑"],
      metrics: { likes: 18000, comments: 960, collects: 7600, shares: 580 },
      angles: ["真实通勤一周体验", "容量和重量对比", "适合与不适合人群"],
    },
  };
}

function promptSpec(promptType: PromptTestType) {
  if (promptType === "topicRewrite") {
    return {
      instruction:
        '请基于样本改写平台化中文选题，必须分别符合每条 item 的 platform、SEO 或推荐流机制。返回严格 JSON：{"items":[{"itemIndex":0,"sampleSourceContentId":"string","title":"string","reason":"string","angles":["string","string","string"]}]}。title 不要照抄 candidateTitle/sampleTitle，reason 必须结合互动数据、评论痛点和平台分发逻辑，angles 必须是 3 条可直接创作的方向。',
      groupKey: null,
      maxTokens: 2600,
    };
  }
  if (promptType === "topicGraphic" || promptType === "caseGraphic") {
    return {
      instruction:
        "请输出 graphicTables，必须包含选题策略、封面包装、图文分页、图片生成提示词、发布包装、合规避坑 6 张表。图文分页至少 6 页，图片提示词要写清正向、负向、画幅和文字叠加说明。只返回严格 JSON。",
      groupKey: "graphicTables" as ScriptTableGroupKey,
      maxTokens: 8200,
    };
  }
  if (promptType === "topicVideo" || promptType === "caseVideo") {
    return {
      instruction:
        "请输出 videoTables，必须包含视频结构、口播、分镜画面、素材需求、字幕屏幕文字、音频节奏、动画转场、Remotion 映射、发布包装、合规风险 10 张表。口播必须是可直接录音/TTS 的完整句子，分镜和 Remotion 表必须具体可执行。只返回严格 JSON。",
      groupKey: "videoTables" as ScriptTableGroupKey,
      maxTokens: 10000,
    };
  }
  return {
    instruction:
      "请输出 caseAnalysisTables，必须包含基础信息、标题包装、Hook、内容结构、逐镜头视觉、逐镜头布局、图层、动画特效、字幕音频、素材提示词与复用规则 10 张表。必须区分观察事实、模板推断和证据等级。只返回严格 JSON。",
    groupKey: "caseAnalysisTables" as ScriptTableGroupKey,
    maxTokens: 7600,
  };
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  await requireAdminPermission("compliance.manage");

  const body = (await request.json().catch(() => ({}))) as PromptTestBody;
  const promptType = body.promptType ?? "topicGraphic";
  const systemPrompt = text(body.systemPrompt, 20000);
  if (!systemPrompt) {
    return timedJson({ error: "missing-prompt" }, { status: 400, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "admin-prompt-test" }] });
  }

  const savedSettings = await prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } });
  const settings = {
    insightAiEnabled: body.enabled ?? savedSettings.insightAiEnabled,
    insightAiBaseUrl: text(body.baseUrl, 300) || savedSettings.insightAiBaseUrl,
    insightAiApiKey: text(body.apiKey, 4000) || savedSettings.insightAiApiKey,
    insightAiModel: text(body.model, 120) || savedSettings.insightAiModel,
  };
  const spec = promptSpec(promptType);
  const result = await requestInsightAiJsonDetailed<Record<string, unknown>>({
    settings,
    systemPrompt,
    instruction: spec.instruction,
    input: sampleInput(promptType),
    maxTokens: spec.maxTokens,
  });

  if (!spec.groupKey) {
    const parsed = result.parsed;
    const items = parsed && Array.isArray(parsed.items) ? parsed.items : [];
    return timedJson(
      {
        ok: Boolean(items.length),
        status: result.status,
        errorMessage: result.errorMessage,
        rawContent: result.rawContent,
        parsed,
        validation: {
          ok: Boolean(items.length),
          issues: items.length ? [] : ["缺少 items 数组。"],
          tableCount: 0,
          rowCount: items.length,
        },
        tables: [],
      },
      { metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "admin-prompt-test" }] },
    );
  }

  const tables = normalizeScriptTables(findTablesPayload(result.parsed, spec.groupKey));
  const validation = validateScriptTables(spec.groupKey, tables);
  return timedJson(
    {
      ok: validation.ok,
      status: result.status,
      errorMessage: result.errorMessage,
      rawContent: result.rawContent,
      parsed: result.parsed,
      validation,
      tables,
    },
    { metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "admin-prompt-test" }] },
  );
}
