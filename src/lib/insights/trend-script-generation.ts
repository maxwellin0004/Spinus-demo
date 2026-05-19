import type { CreatorTrendScriptGeneration, CreatorTrendScriptImage, CreatorTrendScriptReview, PlatformSettings } from "@prisma/client";
import {
  DEFAULT_INSIGHT_AI_CASE_ANALYSIS_PROMPT,
  DEFAULT_INSIGHT_AI_CASE_GRAPHIC_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_CASE_VIDEO_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_GRAPHIC_TABLE_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_VIDEO_TABLE_SCRIPT_PROMPT,
  INSIGHT_SCRIPT_PROMPT_VERSION,
} from "@/lib/insights/ai-prompts";
import { isInsightAiConfigured, readInsightAiRuntimeConfig, requestInsightAiJsonDetailed } from "@/lib/insights/recommendation-ai";
import {
  findTablesPayload,
  normalizeScriptTables,
  validateScriptTables,
  validationSummary,
  type ScriptGenerationMode,
  type ScriptGenerationView,
  type ScriptImageView,
  type ScriptSourceType,
  type ScriptTable,
  type ScriptTableGroupKey,
  tablesToPlainText,
} from "@/lib/insights/script-tables";
import { prisma } from "@/lib/prisma";
import { buildScriptReviewInput, hashScriptReviewInput, scriptReviewToView } from "@/lib/insights/script-review";

export type ScriptTopicContext = {
  title: string;
  keyword?: string | null;
  reason?: string | null;
  platform?: string | null;
  tags?: string[];
  heat?: string | null;
  creator?: string | null;
  sampleTitle?: string | null;
  sampleContentUrl?: string | null;
  sampleSourceContentId?: string | null;
  metrics?: {
    likes?: number;
    comments?: number;
    collects?: number;
    shares?: number;
  } | null;
  angles?: string[];
};

export type ScriptCaseContext = {
  title: string;
  coverImageUrl?: string | null;
  likes?: string | null;
  stats?: string[];
  rows?: [string, string][];
  templateKeyword?: string | null;
};

export type TrendScriptGenerationInput = {
  sourceType: ScriptSourceType;
  sourceTitle: string;
  platformLabel: string;
  directionLabel: string;
  topic?: ScriptTopicContext | null;
  caseStudy?: ScriptCaseContext | null;
  userInstruction?: string | null;
};

type ScriptGenerationSettings = Pick<
  PlatformSettings,
  | "insightAiEnabled"
  | "insightAiBaseUrl"
  | "insightAiApiKey"
  | "insightAiModel"
  | "insightAiGraphicScriptSystemPrompt"
  | "insightAiVideoScriptSystemPrompt"
  | "insightAiCaseAnalysisSystemPrompt"
  | "insightAiCaseGraphicScriptSystemPrompt"
  | "insightAiCaseVideoScriptSystemPrompt"
  | "insightAiGraphicTablePromptsJson"
  | "insightAiVideoTablePromptsJson"
  | "insightAiCaseAnalysisTablePromptsJson"
>;

type AiTablesPayload = {
  graphicTables?: unknown;
  videoTables?: unknown;
  caseAnalysisTables?: unknown;
};

type TableSpec = {
  id: string;
  title: string;
  purpose: string;
  minRows: number;
  columns: string[];
  prompt: string;
};

type TablePromptMap = Record<string, string>;

type RegenerateTrendScriptTableInput = {
  groupKey: ScriptTableGroupKey;
  tableId: string;
  userInstruction?: string | null;
};

export type GeneratedTrendScriptTables = {
  generationMode: ScriptGenerationMode;
  model: string | null;
  errorMessage: string | null;
  aiDebug: Record<string, unknown> | null;
  graphicTables: ScriptTable[];
  videoTables: ScriptTable[];
  caseAnalysisTables: ScriptTable[];
  plainText: string;
};

function trimText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function tablePrompt(value: string | null | undefined, fallback: string, marker: string) {
  const prompt = value?.trim();
  return prompt && prompt.includes(marker) && prompt.includes(INSIGHT_SCRIPT_PROMPT_VERSION) ? prompt : fallback;
}

export const DEFAULT_GRAPHIC_TABLE_PROMPTS: TablePromptMap = {
  graphic_strategy: "生成选题策略表。必须把标题方向、核心痛点、内容角度、证据表达和执行目标写具体；不要泛泛写“评论引导”或“痛点图”。",
  graphic_cover: "生成封面包装表。必须写封面主标题、副标题、画面主体、点击理由和留白位置；画面要求要能直接给设计或生图模型执行。",
  graphic_pages: "生成图文分页脚本表。至少 7 行，覆盖封面、痛点、核心观点、步骤/体验、证据、避坑、总结互动；每行写清页面目标、画面建议、页面文案、排版建议和互动目的。",
  graphic_image_prompts: "生成图片生成提示词表。至少 6 行，与图文主要页面对齐；正向提示词必须包含主体、场景、构图、光线、镜头、风格和留白；负向提示词必须限制文字乱码、水印、品牌 logo、低清晰度和畸形。",
  graphic_publish: "生成发布包装表。必须包含标题备选、正文开头、正文主体、话题标签、CTA、发布时间建议；文案像真实创作者，不要营销腔。",
  graphic_risk: "生成合规与避坑表。必须指出绝对化承诺、虚假背书、功效保证、贬低品牌、制造焦虑等风险，并给出替代表达。",
};

export const DEFAULT_VIDEO_TABLE_PROMPTS: TablePromptMap = {
  video_structure: "生成视频结构总览表。至少 6 段，覆盖 hook、痛点、判断、步骤、证据和 CTA；每段写时间范围、段落目标、核心信息和停留理由。",
  video_voiceover: "生成口播脚本表。至少 6 段，text 必须是可直接 TTS/录音的完整中文口播句；包含 timeRange、voiceId、section、text、targetDurationSec、pauseAfterSec、visualSectionId、emphasisWords、timingStatus。",
  video_storyboard: "生成分镜画面表。至少 6 个镜头；每行写画面主体、构图/机位、屏幕文字、运动方式、转场和素材 slot，不能只写“痛点图”。",
  video_assets: "生成素材需求表。列出每个素材 slot 的用途、规格、生成/拍摄提示和备注；素材必须能被 Remotion 或剪辑流程引用。",
  video_caption: "生成字幕与屏幕文字表。覆盖每个主要时间段；写清字幕、屏幕大字、位置和样式，避免遮挡底部安全区。",
  video_audio: "生成音频节奏表。覆盖 hook、过程、证据、CTA；写清 BGM、音效、音量关系、卡点和静音停顿。",
  video_motion: "生成动画与转场表。写清 sceneId、元素、动画、参数和目的；动画名称要能映射到前端实现。",
  video_remotion: "生成 Remotion 映射表。至少 5 行；包含 sceneId、组件名、输入字段、动画 preset 和素材 slot，字段名要稳定可读。",
  video_publish: "生成发布包装表。必须包含标题备选、封面文案、简介、话题、CTA 和发布时间建议。",
  video_risk: "生成合规风险表。指出效果保证、夸大结论、虚假背书、数据误读、医疗/金融等越界表达，并给出替代表达。",
};

export const DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS: TablePromptMap = {
  case_basic: "生成基础信息表。只写可从输入观察到的信息；证据不足写 estimated 或 none。",
  case_title: "生成标题包装拆解表。区分观察事实、模板推断和可迁移变量，不要直接照抄。",
  case_hook: "生成 Hook 拆解表。说明首屏/开头如何制造停留、冲突和点击预期。",
  case_structure: "生成内容结构拆解表。按段落拆出目标、观察事实、模板推断和复用规则。",
  case_visual: "生成逐镜头视觉表。至少 4 行；没有视频帧时必须标记 estimated，不要假装看过。",
  case_layout: "生成逐镜头布局表。至少 4 行；写清画面分区、主体位置、文字位置、字幕安全区和复刻规则。",
  case_layers: "生成图层拆解表。拆出背景层、主体层、文字层、字幕层、动效层和注意力路径。",
  case_motion: "生成动画特效表。写清元素、入场、持续时间、强度、同步点和可复用规则。",
  case_subtitle_audio: "生成字幕音频表。区分字幕规则、屏幕文字、音频推断和证据等级。",
  case_asset_prompts: "生成素材提示词与复用规则表。写正向提示、负向限制、固定规则和可替换变量。",
};

const GRAPHIC_TABLE_SPECS: TableSpec[] = [
  { id: "graphic_strategy", title: "选题策略表", purpose: "确定图文内容的标题、痛点、角度、证据和执行目标。", minRows: 5, columns: ["字段", "具体内容", "依据", "执行要求"], prompt: DEFAULT_GRAPHIC_TABLE_PROMPTS.graphic_strategy },
  { id: "graphic_cover", title: "封面包装表", purpose: "产出可点击、可设计、可叠字的封面方案。", minRows: 5, columns: ["元素", "具体内容", "画面要求", "转化目的"], prompt: DEFAULT_GRAPHIC_TABLE_PROMPTS.graphic_cover },
  { id: "graphic_pages", title: "图文分页脚本表", purpose: "产出逐页图文脚本。", minRows: 7, columns: ["页码", "页面目标", "画面建议", "页面文案", "排版建议", "互动目的"], prompt: DEFAULT_GRAPHIC_TABLE_PROMPTS.graphic_pages },
  { id: "graphic_image_prompts", title: "图片生成提示词表", purpose: "产出可直接给生图模型使用的逐页提示词。", minRows: 6, columns: ["页码", "正向提示词", "负向提示词", "画幅", "文字叠加说明", "可替换元素"], prompt: DEFAULT_GRAPHIC_TABLE_PROMPTS.graphic_image_prompts },
  { id: "graphic_publish", title: "发布包装表", purpose: "产出标题、正文、标签、CTA 和发布时间建议。", minRows: 6, columns: ["模块", "内容", "目的", "注意事项"], prompt: DEFAULT_GRAPHIC_TABLE_PROMPTS.graphic_publish },
  { id: "graphic_risk", title: "合规与避坑表", purpose: "识别内容表达风险并给替代表达。", minRows: 5, columns: ["风险点", "容易出错写法", "建议写法", "原因"], prompt: DEFAULT_GRAPHIC_TABLE_PROMPTS.graphic_risk },
];

const VIDEO_TABLE_SPECS: TableSpec[] = [
  { id: "video_structure", title: "视频结构总览表", purpose: "确定短视频段落结构和停留逻辑。", minRows: 6, columns: ["段落", "时间范围", "段落目标", "核心信息", "停留理由"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_structure },
  { id: "video_voiceover", title: "口播脚本表", purpose: "产出可直接录音或 TTS 的完整口播。", minRows: 6, columns: ["timeRange", "voiceId", "section", "text", "targetDurationSec", "pauseAfterSec", "visualSectionId", "emphasisWords", "timingStatus"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_voiceover },
  { id: "video_storyboard", title: "分镜画面表", purpose: "产出逐镜头画面、运动和转场。", minRows: 6, columns: ["shotId", "timeRange", "画面主体", "构图/机位", "屏幕文字", "运动方式", "转场", "素材slot"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_storyboard },
  { id: "video_assets", title: "素材需求表", purpose: "列出拍摄/生成素材 slots。", minRows: 4, columns: ["assetSlot", "用途", "规格", "生成/拍摄提示", "备注"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_assets },
  { id: "video_caption", title: "字幕与屏幕文字表", purpose: "规划字幕、屏幕大字和位置。", minRows: 6, columns: ["timeRange", "字幕", "屏幕大字", "位置", "样式"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_caption },
  { id: "video_audio", title: "音频节奏表", purpose: "规划 BGM、音效、停顿和卡点。", minRows: 4, columns: ["段落", "BGM", "音效", "音量关系", "卡点", "静音停顿"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_audio },
  { id: "video_motion", title: "动画与转场表", purpose: "规划前端/剪辑动画参数。", minRows: 4, columns: ["sceneId", "元素", "动画", "参数", "目的"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_motion },
  { id: "video_remotion", title: "Remotion 映射表", purpose: "把脚本映射到 React/Remotion 组件。", minRows: 5, columns: ["sceneId", "组件名", "输入字段", "动画preset", "素材slot"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_remotion },
  { id: "video_publish", title: "发布包装表", purpose: "产出发布标题、简介、话题和 CTA。", minRows: 5, columns: ["模块", "内容", "目的", "注意事项"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_publish },
  { id: "video_risk", title: "合规风险表", purpose: "识别视频表达风险并给替代表达。", minRows: 4, columns: ["风险点", "风险写法", "建议写法", "处理原因"], prompt: DEFAULT_VIDEO_TABLE_PROMPTS.video_risk },
];

const CASE_ANALYSIS_TABLE_SPECS: TableSpec[] = [
  { id: "case_basic", title: "基础信息表", purpose: "整理案例基础事实。", minRows: 4, columns: ["字段", "内容", "证据等级"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_basic },
  { id: "case_title", title: "标题包装拆解表", purpose: "拆解标题钩子和可迁移变量。", minRows: 4, columns: ["模块", "观察事实", "模板推断", "可迁移变量"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_title },
  { id: "case_hook", title: "Hook 拆解表", purpose: "拆解开头停留机制。", minRows: 4, columns: ["位置", "观察事实", "停留机制", "可复用写法"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_hook },
  { id: "case_structure", title: "内容结构拆解表", purpose: "拆解内容段落结构。", minRows: 4, columns: ["段落", "目标", "观察事实", "模板推断"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_structure },
  { id: "case_visual", title: "逐镜头视觉表", purpose: "拆解镜头视觉主体。", minRows: 4, columns: ["镜头ID", "时间范围", "观察事实", "画面主体", "模板推断"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_visual },
  { id: "case_layout", title: "逐镜头布局表", purpose: "拆解画面布局规则。", minRows: 4, columns: ["镜头ID", "画面分区", "主体位置", "文字位置", "字幕安全区", "复刻规则"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_layout },
  { id: "case_layers", title: "图层拆解表", purpose: "拆解可复刻图层。", minRows: 4, columns: ["镜头ID", "背景层", "主体层", "文字层", "辅助层", "注意力路径"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_layers },
  { id: "case_motion", title: "动画特效表", purpose: "拆解动画和特效参数。", minRows: 4, columns: ["元素", "动画", "参数", "触发点", "可复用规则"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_motion },
  { id: "case_subtitle_audio", title: "字幕音频表", purpose: "拆解字幕和音频节奏。", minRows: 4, columns: ["段落", "字幕规则", "屏幕文字", "音频观察", "证据等级"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_subtitle_audio },
  { id: "case_asset_prompts", title: "素材提示词与复用规则表", purpose: "拆解素材生成提示词和复用变量。", minRows: 4, columns: ["用途", "正向提示词", "负向限制", "可替换变量"], prompt: DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS.case_asset_prompts },
];

type TableRequestDebug = {
  groupKey: ScriptTableGroupKey;
  initialStatus: number | null;
  initialError: string | null;
  initialRawContent: string;
  initialValidation: ReturnType<typeof validateScriptTables>;
  repairStatus?: number | null;
  repairError?: string | null;
  repairRawContent?: string;
  repairValidation?: ReturnType<typeof validateScriptTables>;
  usedRepair: boolean;
  finalMode: "ai" | "repaired" | "invalid";
};

function promptMapFromJson(value: unknown, defaults: TablePromptMap) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const custom = record[key];
      return [key, typeof custom === "string" && custom.trim() ? custom.trim() : fallback];
    }),
  ) as TablePromptMap;
}

export function stringifyTablePrompts(value: unknown, defaults: TablePromptMap) {
  return JSON.stringify(promptMapFromJson(value, defaults), null, 2);
}

function validatePromptJson(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

export function isValidTablePromptJson(value: string) {
  return validatePromptJson(value);
}

function firstValidTable(groupKey: ScriptTableGroupKey, payload: AiTablesPayload, spec: TableSpec) {
  const tables = normalizeScriptTables(findTablesPayload(payload, groupKey));
  const exact = tables.find((table) => table.id === spec.id);
  const table = exact ?? tables[0];
  if (!table) return null;
  if (table.rows.length < spec.minRows) return null;
  return {
    ...table,
    id: spec.id,
    title: table.title || spec.title,
  };
}

function fallbackTableForSpec(fallbackTables: ScriptTable[], spec: TableSpec) {
  const existingTable = fallbackTables.find((item) => item.id === spec.id);
  if (existingTable) return existingTable;

  return table(spec.id, spec.title, spec.columns, [["规则兜底", `${spec.title} 暂未由 AI 成功生成，请稍后重新生成。`]]);
}

function buildSingleTableInstruction(groupKey: ScriptTableGroupKey, spec: TableSpec, tableSpecificPrompt: string) {
  const outputShape = JSON.stringify({
    [groupKey]: [
      {
        id: spec.id,
        title: spec.title,
        columns: [],
        rows: [],
      },
    ],
  });

  return [
    tableInstruction,
    `本次只生成 1 张表：${spec.title}。`,
    `顶层 JSON 必须是 ${outputShape}，数组里只能有这一张表。`,
    `表 id 必须是 "${spec.id}"，title 必须是 "${spec.title}"。`,
    `columns 必须优先使用：${spec.columns.join(" / ")}。`,
    `rows 至少 ${spec.minRows} 行。`,
    `这张表的用途：${spec.purpose}`,
    `专项要求：${tableSpecificPrompt}`,
  ].join("\n");
}

function specsForGroup(groupKey: ScriptTableGroupKey) {
  if (groupKey === "graphicTables") return GRAPHIC_TABLE_SPECS;
  if (groupKey === "videoTables") return VIDEO_TABLE_SPECS;
  return CASE_ANALYSIS_TABLE_SPECS;
}

function promptMapForGroup(settings: ScriptGenerationSettings, groupKey: ScriptTableGroupKey) {
  if (groupKey === "graphicTables") return promptMapFromJson(settings.insightAiGraphicTablePromptsJson, DEFAULT_GRAPHIC_TABLE_PROMPTS);
  if (groupKey === "videoTables") return promptMapFromJson(settings.insightAiVideoTablePromptsJson, DEFAULT_VIDEO_TABLE_PROMPTS);
  return promptMapFromJson(settings.insightAiCaseAnalysisTablePromptsJson, DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS);
}

function systemPromptForGroup(settings: ScriptGenerationSettings, input: TrendScriptGenerationInput, groupKey: ScriptTableGroupKey) {
  if (groupKey === "caseAnalysisTables") {
    return tablePrompt(settings.insightAiCaseAnalysisSystemPrompt, DEFAULT_INSIGHT_AI_CASE_ANALYSIS_PROMPT, "caseAnalysisTables");
  }
  if (groupKey === "graphicTables") {
    return input.sourceType === "CASE_STUDY"
      ? tablePrompt(settings.insightAiCaseGraphicScriptSystemPrompt, DEFAULT_INSIGHT_AI_CASE_GRAPHIC_SCRIPT_PROMPT, "graphicTables")
      : tablePrompt(settings.insightAiGraphicScriptSystemPrompt, DEFAULT_INSIGHT_AI_GRAPHIC_TABLE_SCRIPT_PROMPT, "graphicTables");
  }
  return input.sourceType === "CASE_STUDY"
    ? tablePrompt(settings.insightAiCaseVideoScriptSystemPrompt, DEFAULT_INSIGHT_AI_CASE_VIDEO_SCRIPT_PROMPT, "videoTables")
    : tablePrompt(settings.insightAiVideoScriptSystemPrompt, DEFAULT_INSIGHT_AI_VIDEO_TABLE_SCRIPT_PROMPT, "videoTables");
}

function maxTokensForGroup(groupKey: ScriptTableGroupKey) {
  if (groupKey === "caseAnalysisTables") return 1800;
  if (groupKey === "graphicTables") return 2200;
  return 2400;
}

async function requestSingleTableWithRepair({
  settings,
  systemPrompt,
  input,
  groupKey,
  spec,
  tableSpecificPrompt,
  maxTokens,
}: {
  settings: ScriptGenerationSettings;
  systemPrompt: string;
  input: unknown;
  groupKey: ScriptTableGroupKey;
  spec: TableSpec;
  tableSpecificPrompt: string;
  maxTokens: number;
}) {
  const instruction = buildSingleTableInstruction(groupKey, spec, tableSpecificPrompt);
  const first = await requestInsightAiJsonDetailed<AiTablesPayload>({
    settings,
    systemPrompt,
    instruction,
    input,
    maxTokens,
  }).catch((error) => ({
    parsed: null,
    rawContent: "",
    status: null,
    errorMessage: error instanceof Error ? error.message : "AI 请求失败。",
  }));

  const initialTable = first.parsed ? firstValidTable(groupKey, first.parsed, spec) : null;
  const initialTables = initialTable ? [initialTable] : [];
  const initialValidation = validateScriptTables(groupKey, initialTables);
  const debug: TableRequestDebug = {
    groupKey,
    initialStatus: first.status,
    initialError: first.errorMessage,
    initialRawContent: first.rawContent,
    initialValidation,
    usedRepair: false,
    finalMode: initialTable ? "ai" : "invalid",
  };

  if (initialTable) {
    return { table: initialTable, ok: true, debug };
  }

  const repair = await requestInsightAiJsonDetailed<AiTablesPayload>({
    settings,
    systemPrompt: "你是严格 JSON 表格修复器。只返回 JSON，不输出 Markdown。请把输入里的 AI 原始返回修复成指定的单张表；不要输出多张表。",
    instruction,
    input: {
      originalInput: input,
      tableSpec: spec,
      previousError: first.errorMessage,
      rawContent: first.rawContent,
      parsedContent: first.parsed,
    },
    maxTokens,
  }).catch((error) => ({
    parsed: null,
    rawContent: "",
    status: null,
    errorMessage: error instanceof Error ? error.message : "AI 修复请求失败。",
  }));

  const repairedTable = repair.parsed ? firstValidTable(groupKey, repair.parsed, spec) : null;
  const repairValidation = validateScriptTables(groupKey, repairedTable ? [repairedTable] : []);
  debug.usedRepair = true;
  debug.repairStatus = repair.status;
  debug.repairError = repair.errorMessage;
  debug.repairRawContent = repair.rawContent;
  debug.repairValidation = repairValidation;
  debug.finalMode = repairedTable ? "repaired" : "invalid";

  return { table: repairedTable, ok: Boolean(repairedTable), debug };
}

async function requestTablesBySpec({
  settings,
  systemPrompt,
  input,
  groupKey,
  specs,
  promptMap,
  fallbackTables,
  maxTokens,
}: {
  settings: ScriptGenerationSettings;
  systemPrompt: string;
  input: unknown;
  groupKey: ScriptTableGroupKey;
  specs: TableSpec[];
  promptMap: TablePromptMap;
  fallbackTables: ScriptTable[];
  maxTokens: number;
}) {
  const results = await Promise.all(
    specs.map((spec) =>
      requestSingleTableWithRepair({
        settings,
        systemPrompt,
        input,
        groupKey,
        spec,
        tableSpecificPrompt: promptMap[spec.id] ?? spec.prompt,
        maxTokens,
      }),
    ),
  );
  const tables = results.map((result, index) => result.table ?? fallbackTableForSpec(fallbackTables, specs[index]));
  const fallbackIds = results.map((result, index) => (result.ok ? null : specs[index].id)).filter((id): id is string => Boolean(id));
  return {
    tables,
    fallbackIds,
    aiCount: results.filter((result) => result.ok).length,
    validation: validateScriptTables(groupKey, tables),
    debug: Object.fromEntries(results.map((result, index) => [specs[index].id, result.debug])),
  };
}

function topCaseRows(caseStudy: ScriptCaseContext | null | undefined) {
  const rows = caseStudy?.rows?.length ? caseStudy.rows : [["核心看点", "围绕标题、痛点、步骤、证据和互动引导做内容迁移。"]];
  return rows.slice(0, 8).map(([label, value]) => [label, value]);
}

function table(id: string, title: string, columns: string[], rows: string[][]): ScriptTable {
  return { id, title, columns, rows: rows.slice(0, 8) };
}

function cleanScriptText(value: unknown, fallback = "") {
  const raw = trimText(value, fallback);
  return raw
    .replace(/#[^\s#]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[，,。；;、]+$/g, "")
    .trim() || fallback;
}

function formatMetricValue(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return "0";
  return new Intl.NumberFormat("zh-CN").format(value ?? 0);
}

function scriptKeyword(input: TrendScriptGenerationInput) {
  const explicit = cleanScriptText(input.topic?.keyword, "");
  if (explicit && explicit.length <= 12) return explicit;

  const sourceText = [
    input.sourceTitle,
    input.topic?.title,
    input.topic?.sampleTitle,
    input.caseStudy?.title,
    input.caseStudy?.rows?.map(([label, value]) => `${label} ${value}`).join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  const knownKeywords = ["底妆", "粉底", "油皮", "持妆", "防晒", "敏感肌", "学生党", "平价替代", "通勤包", "穿搭", "低卡", "早餐"];
  const matched = knownKeywords.find((keyword) => sourceText.includes(keyword));
  if (matched) return matched;

  return cleanScriptText(input.sourceTitle, "这个选题").slice(0, 12);
}

function scriptTitle(input: TrendScriptGenerationInput) {
  return cleanScriptText(input.topic?.title || input.sourceTitle, input.sourceTitle).slice(0, 48);
}

function metricSummary(input: TrendScriptGenerationInput) {
  const metrics = input.topic?.metrics;
  if (metrics) {
    return `样本互动：点赞 ${formatMetricValue(metrics.likes)}、评论 ${formatMetricValue(metrics.comments)}、收藏 ${formatMetricValue(metrics.collects)}、分享 ${formatMetricValue(metrics.shares)}。`;
  }
  if (input.caseStudy?.stats?.length) return `案例互动：${input.caseStudy.stats.slice(0, 4).join(" / ")}。`;
  if (input.caseStudy?.likes) return `案例点赞：${input.caseStudy.likes}。`;
  return "当前缺少完整互动数据，表格中的证据表达需标记为评论洞察或样本观察。";
}

function fallbackPainPoint(input: TrendScriptGenerationInput, comments: string[], keyword: string) {
  const comment = comments.map((item) => cleanScriptText(item)).find(Boolean);
  if (comment) return `评论里高频出现的问题是：${comment}`;
  const reason = cleanScriptText(input.topic?.reason, "");
  if (reason) return reason;
  const row = input.caseStudy?.rows?.find(([label, value]) => /痛点|需求|评论|Hook|结构/.test(`${label}${value}`));
  if (row) return `${row[0]}：${cleanScriptText(row[1])}`;
  return `${keyword}的核心问题不是“要不要跟热点”，而是用户具体卡在哪一步，以及创作者能不能给出可验证步骤。`;
}

function fallbackAngles(input: TrendScriptGenerationInput) {
  const angles = input.topic?.angles?.map((item) => cleanScriptText(item)).filter(Boolean);
  if (angles?.length) return angles.slice(0, 3).join("；");
  const rows = input.caseStudy?.rows?.slice(0, 3).map(([label, value]) => `${label}：${cleanScriptText(value)}`).filter(Boolean);
  if (rows?.length) return rows.join("；");
  return "问题拆解；半边对比；步骤清单";
}

function coverHook(keyword: string) {
  return `${keyword}老翻车？先查3点`;
}

function fallbackGraphicTables(input: TrendScriptGenerationInput, comments: string[]): ScriptTable[] {
  const title = scriptTitle(input);
  const keyword = scriptKeyword(input);
  const painPoint = fallbackPainPoint(input, comments, keyword);
  const metrics = metricSummary(input);
  const hook = coverHook(keyword);
  const angles = fallbackAngles(input);

  return [
    table("graphic_strategy", "选题策略表", ["模块", "具体内容", "依据", "执行要点"], [
      ["改写标题", title, `${input.platformLabel} / ${input.directionLabel}`, "标题必须保留具体人群、具体问题或具体场景，不要只写热点词。"],
      ["核心痛点", painPoint, metrics, "正文第一屏先讲用户卡点，再给判断标准。"],
      ["内容角度", angles, "来自选题角度、案例拆解或评论洞察。", "每页只讲一个判断点，避免写成泛泛心得。"],
      ["内容目标", "让用户能按清单检查自己的情况，并愿意收藏。", "图文适合做可复查步骤。", "每页文案控制在 1 个结论 + 1 个动作。"],
      ["证据表达", metrics, "互动数据只能作为样本信号。", "不要写成绝对结论，用“评论里高频提到/样本里集中出现”。"],
    ]),
    table("graphic_cover", "封面包装表", ["字段", "内容", "画面要求", "转化目的"], [
      ["封面主标题", hook, "大字不超过两行，放在上方留白区。", "让用户一眼知道这是避坑/检查清单。"],
      ["封面副标题", `别急着换产品，先看${keyword}卡在哪一步`, "副标题放在主标题下方，用较小字号。", "把泛热点变成具体问题。"],
      ["封面画面", `${keyword}前后状态或错误步骤与正确步骤对比`, "左右对比或上下对比，主体清晰，背景干净。", "制造可理解的反差。"],
      ["点击理由", painPoint, "不要堆关键词，直接呈现用户困扰。", "让用户觉得“这说的是我”。"],
      ["留白位置", "顶部 30% 或中间 25% 保持干净。", "用于前端叠加中文标题和标签。", "避免图片生成模型直接生成乱码文字。"],
    ]),
    table("graphic_pages", "图文分页脚本表", ["页码", "页面目标", "画面建议", "页面文案", "排版建议", "互动目的"], [
      ["封面", "制造点击", `${keyword}错误状态和更稳状态同框对比`, hook, "大标题居中，底部加“新手检查清单”标签", "让用户停下来看"],
      ["第2页", "放大痛点", "展示用户真实遇到的翻车场景或评论痛点卡片", painPoint, "左上编号 01，痛点句加粗，保留证据感", "引发共鸣"],
      ["第3页", "给出判断1", `${keyword}常见错误步骤或错误判断的特写`, `先别急着换产品，先确认${keyword}到底卡在“手法、用量、顺序、场景”哪一项。`, "四象限或 checklist，关键词加粗", "建立判断框架"],
      ["第4页", "给出判断2", "半边对比或步骤对比图", `一次只改一个变量：先固定工具，再调用量，最后看持久度。`, "左错右对，箭头标出差异", "让用户能照着排查"],
      ["第5页", "补充证据", "把互动数据或评论洞察做成证据卡", metrics, "三张小卡：评论/收藏/高频问题", "增强可信度"],
      ["第6页", "避坑总结", "干净背景 + 三条避坑清单", `${keyword}不是不能做，是别把所有问题都归因到一个产品或一个技巧。`, "清单式排版，底部放提醒", "降低夸大感"],
      ["第7页", "评论互动", "总结卡 + 问题贴纸", `你做${keyword}最容易卡在哪一步？把你的场景发评论区，我按场景拆。`, "问题句放大，留评论引导", "引导评论"],
    ]),
    table("graphic_image_prompts", "图片生成提示词表", ["页码", "正向提示词", "负向提示词", "画幅", "文字叠加说明", "可替换元素"], [
      ["封面", `竖版小红书封面图，主题是${keyword}避坑检查，左右对比构图，一侧是常见错误状态，一侧是更干净稳定的状态，上方保留 30% 干净留白用于叠加标题，自然柔光，真实生活方式摄影，高质感但不广告化`, "不要生成中文文字、水印、品牌 logo、夸张广告海报、过度磨皮、杂乱背景、低清晰度", "3:4", "标题、副标题和标签由前端叠加", "主体产品/道具可替换为无品牌通用占位"],
      ["痛点页", `竖版真实场景图，展示${keyword}翻车或使用困扰的近景，主体清晰，旁边留出文字区，光线自然，画面像真实创作者记录，不要棚拍广告感`, "不要文字乱码、不要水印、不要品牌 logo、不要过度摆拍、不要手部畸形、不要强滤镜", "3:4", "左侧叠加 01 和痛点句", "场景、道具、人群可替换"],
      ["对比页", `竖版对比教程图，同一场景下展示${keyword}错误做法和修正做法，左右分区，主体一致，差异清晰，画面中间留出箭头和编号空间`, "不要生成文字、不要夸张特效、不要品牌露出、不要混乱构图", "3:4", "前端叠加“错误/修正”和箭头", "左右主体可替换"],
      ["步骤页", `竖版教程步骤图，展示一个关键动作或一个检查步骤，手部动作清晰，道具摆放有序，背景干净，画面留白适合加编号和说明`, "不要复杂背景、不要多人抢主体、不要水印、不要品牌 logo、不要动作模糊", "3:4", "前端叠加步骤编号和短句", "动作和道具可替换"],
      ["总结页", `竖版清单背景图，浅色干净背景，主体物品整齐摆放，中央保留大面积空白用于 checklist 文案，真实摄影风格`, "不要深色压抑背景、不要错误文字、不要低质感拼贴、不要品牌 logo", "3:4", "清单文案由前端叠加", "主体物品可替换"],
    ]),
    table("graphic_publish", "发布包装表", ["模块", "内容", "目的", "注意事项"], [
      ["标题备选1", hook, "承接封面点击", "不要夸大效果。"],
      ["标题备选2", `新手做${keyword}，先别跳过这3个检查`, "点名新手人群", "适合教程/避坑语气。"],
      ["正文开头", `最近看到很多人聊「${keyword}」，但我更建议先按真实场景倒推：你到底卡在手法、用量、顺序，还是场景不匹配。`, "建立经验感", "不要写成硬广。"],
      ["话题标签", `#${keyword} #新手避坑 #真实测评 #小红书图文 #经验分享`, "覆盖搜索词", "标签不要堆太多。"],
      ["评论引导", `你做${keyword}最容易翻车的是哪一步？评论区给我一个真实场景。`, "引导具体评论", "问题必须具体。"],
    ]),
    table("graphic_risk", "合规与避坑表", ["风险点", "原因", "替代表达"], [
      ["绝对化效果", "容易形成夸大承诺", "可以写成“更适合某类场景”"],
      ["虚假背书", "不能编造官方、专家或用户证明", "用“评论里高频提到”替代"],
      ["过度营销", "降低真实感和平台推荐友好度", "用真实体验、对比和步骤表达"],
    ]),
  ];
}

function fallbackVideoTables(input: TrendScriptGenerationInput, comments: string[]): ScriptTable[] {
  const title = scriptTitle(input);
  const keyword = scriptKeyword(input);
  const painPoint = fallbackPainPoint(input, comments, keyword);
  const metrics = metricSummary(input);
  const hook = `${keyword}做不好，先别怪产品`;

  return [
    table("video_structure", "视频结构总览表", ["段落", "时间范围", "段落目标", "核心信息", "停留理由"], [
      ["hook", "0-4s", "制造停留", hook, "把用户默认归因打断，制造继续看的理由"],
      ["pain", "4-12s", "放大痛点", painPoint, "让用户觉得说的是自己"],
      ["point", "12-22s", "给出判断", `先拆${keyword}卡点：手法、用量、顺序、场景，只能一次改一个变量。`, "提供明确判断框架"],
      ["process", "22-44s", "展示步骤", "用三步检查法演示：先找卡点，再做半边对比，最后补证据。", "可执行、可复拍"],
      ["proof", "44-56s", "补充证据", metrics, "增强可信度，但不夸大"],
      ["cta", "56-65s", "引导互动", `让用户评论自己做${keyword}最容易卡住的一步。`, "推动评论和二次选题"],
    ]),
    table("video_voiceover", "口播脚本表", ["时间", "段落", "口播内容", "重读词", "停顿", "语气"], [
      ["0-4s", "hook", `如果你做${keyword}总是翻车，先别急着怪产品。很多人真正错在第一步。`, "先别怪产品", "0.2s", "短促、有反差"],
      ["4-12s", "pain", painPoint, "高频", "0.2s", "真实共情"],
      ["12-22s", "point", `我的建议是：先把${keyword}拆成四个变量，手法、用量、顺序、场景。一次只改一个。`, "一次只改一个", "0.2s", "理性判断"],
      ["22-36s", "process_1", "第一步，先复现你最常翻车的场景，不要只拍最好看的结果。", "复现翻车场景", "0.2s", "教程感"],
      ["36-48s", "process_2", "第二步，做半边对比，左边保持原做法，右边只改一个变量。", "半边对比", "0.2s", "实操感"],
      ["48-58s", "proof", `第三步，把结果和评论问题放在一起看。${metrics}`, "评论问题", "0.2s", "证据感"],
      ["58-65s", "cta", `你做${keyword}最容易卡在手法、用量还是顺序？评论区告诉我。`, "手法/用量/顺序", "0.3s", "轻互动"],
    ]),
    table("video_storyboard", "分镜画面表", ["镜头ID", "时间", "画面内容", "主体", "构图", "运动方式"], [
      ["S01", "0-4s", `${keyword}翻车结果和更稳结果快速对比，标题大字弹出`, `${keyword}对比画面`, "上标题下主体，主体占下半区", "轻微推近 + 标题 pop"],
      ["S02", "4-12s", "痛点卡片或评论问题卡片上滑", "痛点文字卡", "中间主卡片，背景保持干净", "卡片上滑"],
      ["S03", "12-22s", "四个变量卡片依次出现：手法、用量、顺序、场景", "变量清单", "2x2 卡片", "逐条 pop"],
      ["S04", "22-36s", "复现翻车场景或错误步骤", "错误步骤", "近景特写", "hard cut"],
      ["S05", "36-48s", "半边对比或单变量对比", "对比结果", "左右分区", "match cut"],
      ["S06", "48-58s", "互动数据和评论洞察做成证据板", "数据卡", "三列卡片", "数字滚动"],
      ["S07", "58-65s", "总结清单 + 评论问题", "结论卡", "居中 checklist", "淡入"],
    ]),
    table("video_assets", "素材需求表", ["素材ID", "类型", "用途", "获取方式", "是否必须", "替代方案"], [
      ["asset_01", "real_shoot", "展示翻车/修正对比", "创作者实拍", "是", "用无品牌通用场景生图"],
      ["asset_02", "comment_card", "展示痛点", "评论文本转卡片", "是", "用提炼痛点替代"],
      ["asset_03", "step_cards", "展示四个变量", "前端渲染卡片", "是", "用纯文字卡片"],
      ["asset_04", "comparison_shot", "半边对比或单变量对比", "创作者实拍", "是", "用模拟示意图"],
      ["asset_05", "data_card", "互动证据", "页面数据生成", "否", "用“评论高频提到”表达"],
    ]),
    table("video_subtitle", "字幕与屏幕文字表", ["段落", "字幕切分", "屏幕大字", "出现时机", "安全区"], [
      ["hook", `如果你做${keyword}总翻车 / 先别急着怪产品`, hook, "0.3s", "底部 18% 留字幕"],
      ["pain", painPoint, "评论区都在问", "4s", "文字不挡主体"],
      ["point", "手法 / 用量 / 顺序 / 场景", "一次只改一个变量", "12s", "中部卡片区域"],
      ["process", "复现翻车 / 半边对比 / 补证据", "三步检查法", "22s", "中部卡片区域"],
      ["cta", `你做${keyword}卡在哪一步？`, "评论区告诉我", "58s", "底部安全区上方"],
    ]),
    table("video_audio", "音频节奏表", ["段落", "BGM", "音效", "音量关系", "卡点", "静音停顿"], [
      ["hook", "轻快节奏 18%", "标题 pop click", "人声优先，BGM duck 到 12%", "标题出现", "0.2s"],
      ["process", "保持低音量", "步骤切换 whoosh", "不盖过口播", "每条步骤出现", "0.1s"],
      ["cta", "BGM 渐弱", "轻提示音", "结尾人声突出", "CTA 出现", "0.3s"],
    ]),
    table("video_motion", "动画与转场表", ["元素", "入场方式", "持续时间", "强度", "触发点", "适合组件"], [
      ["标题", "pop + zoom-in", "0.25s", "中", "hook 第一个重读词", "TitlePop"],
      ["清单", "slide-up", "0.35s", "低", "步骤口播开始", "ChecklistPanel"],
      ["证据卡", "number-count + fade", "0.5s", "中", "proof 段落开始", "MetricCards"],
    ]),
    table("video_remotion", "Remotion 映射表", ["sceneId", "组件名", "输入字段", "动画 preset", "素材 slot"], [
      ["scene_01", "HookCompareScene", "title, keyword, beforeAsset, afterAsset", "titlePop, slowZoom", "heroCompare"],
      ["scene_02", "PainPointScene", "painText, commentCards", "cardSlideUp", "commentCards"],
      ["scene_03", "VariableChecklistScene", "variables, keyword", "stepPop", "stepCards"],
      ["scene_04", "ComparisonScene", "beforeAsset, afterAsset, changedVariable", "matchCut", "comparisonShot"],
      ["scene_05", "SummaryScene", "checklist, cta", "fadeIn", "none"],
    ]),
    table("video_publish", "发布包装表", ["字段", "内容"], [
      ["标题", title],
      ["封面文案", hook],
      ["简介", `把「${keyword}」拆成手法、用量、顺序、场景四个变量，先复现问题，再做半边对比。`],
      ["话题", `#${keyword} #短视频脚本 #小红书运营 #抖音选题`],
      ["CTA", `你做${keyword}最容易卡在哪一步？`],
    ]),
    table("video_risk", "合规风险表", ["风险点", "原因", "建议替代表达"], [
      ["结果承诺", "不能保证效果或收益", "改成“更适合/更容易表达”"],
      ["编造事实", "没有证据的指标不能写死", "标注为评论洞察或平台样本"],
      ["广告腔", "影响真实感", "用体验、对比、避坑替代硬卖点"],
    ]),
  ];
}

function fallbackCaseAnalysisTables(input: TrendScriptGenerationInput): ScriptTable[] {
  const caseStudy = input.caseStudy;
  const title = input.sourceTitle;
  const rows = topCaseRows(caseStudy);

  return [
    table("case_basic", "基础信息", ["字段", "内容", "证据等级"], [
      ["案例标题", title, "observed"],
      ["平台/方向", `${input.platformLabel} / ${input.directionLabel}`, "observed"],
      ["互动概览", caseStudy?.stats?.join(" / ") || caseStudy?.likes || "暂无", "observed"],
      ["证据状态", "当前基于页面采集字段、标题、互动和案例 rows 生成；缺少视频帧/ASR/OCR 时镜头信息标记 estimated。", "observed"],
    ]),
    table("case_title", "标题包装拆解", ["元素", "观察事实", "模板推断", "可替换变量"], [
      ["标题钩子", title, "用具体痛点或反差结果做点击入口", "行业关键词/人群/场景"],
      ["内容承诺", rows[0]?.[1] ?? "围绕热点给出可复用结构", "承诺要可验证，不做绝对化效果", "痛点程度/步骤数量"],
      ["平台语气", input.platformLabel, "保持真实体验和可收藏表达", "平台风格词"],
    ]),
    table("case_hook", "Hook 拆解", ["位置", "观察事实", "模板推断", "迁移建议"], [
      ["首屏", title, "前 3 秒需要明确冲突或结果", "先抛反常识，再补原因"],
      ["痛点", rows[1]?.[1] ?? "评论或样本痛点", "把用户正在纠结的问题放在前 10 秒", "用评论式语言表达"],
    ]),
    table("case_structure", "内容结构拆解", ["模块", "观察事实", "模板推断", "复用规则"], rows.map(([label, value]) => [label, value, "该模块可作为脚本段落", "保留顺序，替换为新选题证据"])),
    table("case_visual", "逐镜头视觉拆解", ["镜头ID", "时间范围", "观察事实", "视觉推断", "复刻优先级"], [
      ["S01", "0-4s", "缺少视频帧", "estimated：强标题 + 主题场景", "高"],
      ["S02", "4-12s", "缺少视频帧", "estimated：痛点卡片或评论卡片", "高"],
      ["S03", "12-28s", "缺少视频帧", "estimated：步骤/对比/清单切换", "中"],
      ["S04", "28-50s", "缺少视频帧", "estimated：证据与细节补充", "中"],
      ["S05", "50-65s", "缺少视频帧", "estimated：总结清单 + CTA", "高"],
    ]),
    table("case_layout", "逐镜头布局分析", ["镜头ID", "画面分区", "主体位置与尺寸", "文字位置", "字幕安全区", "复刻规则"], [
      ["S01", "上文下图", "主体占下半区 60%-70%", "大标题在上三分之一", "底部 18%", "首屏不要堆满，保留强标题"],
      ["S02", "中间卡片", "痛点卡占画面 70% 宽", "关键词加粗", "底部 18%", "先让痛点可读"],
      ["S03", "左右或上下对比", "主体图占 55%-65%", "步骤编号贴近动作", "底部 18%", "每屏只讲一个动作"],
      ["S04", "数据卡", "三张卡并列或纵向堆叠", "数字最大", "底部 18%", "证据不要夸大"],
      ["S05", "清单总结", "checklist 居中", "CTA 在下方", "底部 18%", "结尾适合截图收藏"],
    ]),
    table("case_layers", "图层拆解", ["镜头ID", "背景层", "主体层", "文字层", "字幕层", "动效层"], [
      ["S01", "真实场景/浅色背景", "主题物或结果对比", "标题 + 标签", "底部双行", "轻推近"],
      ["S02", "干净底色", "评论卡/痛点卡", "痛点关键词", "底部双行", "卡片上滑"],
      ["S03", "步骤场景", "手部动作/物品", "编号箭头", "底部双行", "逐条弹出"],
      ["S04", "浅色面板", "数据卡", "指标文字", "底部双行", "数字滚动"],
      ["S05", "清单背景", "checklist", "总结句", "底部双行", "淡入"],
    ]),
    table("case_motion", "动画/特效参数", ["元素", "入场", "持续时间", "强度", "同步点"], [
      ["首屏标题", "pop + zoom-in", "0.2-0.35s", "中", "开场重读词"],
      ["评论卡", "slide-up", "0.3s", "低", "痛点句开始"],
      ["步骤编号", "pop", "0.2s", "中", "每个步骤词"],
      ["数据卡", "count-up", "0.4-0.6s", "低", "证据段开始"],
    ]),
    table("case_subtitle_audio", "字幕与音频拆解", ["模块", "字幕规则", "屏幕文字", "音频推断", "证据等级"], [
      ["hook", "短句切分，每行不超过 14 字", "大标题必须强", "estimated：轻快节奏 + click", "estimated"],
      ["process", "按步骤切分", "编号和关键词加粗", "estimated：低音量 BGM", "estimated"],
      ["cta", "结尾问题单独一屏", "评论问题清晰", "estimated：BGM 渐弱", "estimated"],
    ]),
    table("case_asset_prompts", "素材生成提示词与复用规则", ["用途", "正向提示词", "负向提示词", "可替换变量"], [
      ["封面背景", `竖版真实生活方式场景，围绕${title}的核心主题，主体清晰，上方留白，自然柔光`, "不要中文文字、水印、品牌 logo、夸张广告感、低清晰度", "主题物/场景/人群"],
      ["痛点页", "竖版评论痛点场景图，主体清晰，中间留白用于叠加文字", "不要乱码文字、杂乱背景、畸形手部", "痛点文案/道具"],
      ["总结页", "竖版清单背景图，浅色干净背景，大面积留白，适合叠加 checklist", "不要复杂纹理、错误文字、低质感", "清单项目"],
    ]),
  ];
}

async function loadCommentSnippets(topic: ScriptTopicContext | null | undefined) {
  const sourceContentId = topic?.sampleSourceContentId?.trim();
  if (!sourceContentId) return [];
  const content = await prisma.insightContent.findFirst({
    where: {
      OR: [{ id: sourceContentId }, { sourceContentId }],
    },
    include: {
      comments: {
        orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
        take: 6,
      },
    },
  });
  return (content?.comments ?? []).map((comment) => comment.text.trim()).filter(Boolean).slice(0, 6);
}

function buildAiInput(input: TrendScriptGenerationInput, comments: string[]) {
  return {
    sourceType: input.sourceType,
    directionLabel: input.directionLabel,
    platformLabel: input.platformLabel,
    sourceTitle: input.sourceTitle,
    topic: input.topic,
    caseStudy: input.caseStudy,
    commentSnippets: comments,
    userInstruction: input.userInstruction?.trim() || "",
    tableContract: {
      format: "strict_json",
      tableShape: { id: "string", title: "string", columns: ["string"], rows: [["string"]] },
      rowLimit: 8,
      noMarkdown: true,
    },
  };
}

const tableInstruction = [
  "只返回严格 JSON，不输出 Markdown，不解释过程。",
  "所有表格都必须使用 {id,title,columns,rows}，rows 必须是二维字符串数组。",
  "核心表不要为了简短而省略信息；图文分页、图片提示词、视频口播、分镜和 Remotion 映射必须写到可直接执行。",
  "禁止使用 string、todo、待补充、评论引导、痛点图、素材图等占位词或短泛词。",
  "图文分页表至少 6 页；视频口播和分镜至少 6 段；爆款拆解必须区分观察事实、模板推断和证据等级。",
  "如果 userInstruction 非空，优先按用户要求重新生成，但不能违反合规、事实和 JSON 结构。",
].join("\n");

export async function generateTrendScriptTables(settings: ScriptGenerationSettings, input: TrendScriptGenerationInput): Promise<GeneratedTrendScriptTables> {
  const comments = await loadCommentSnippets(input.topic);
  const fallbackGraphic = fallbackGraphicTables(input, comments);
  const fallbackVideo = fallbackVideoTables(input, comments);
  const fallbackCase = input.sourceType === "CASE_STUDY" ? fallbackCaseAnalysisTables(input) : [];
  const fallbackPlainText = tablesToPlainText([
    { title: "案例拆解", tables: fallbackCase },
    { title: "图文脚本", tables: fallbackGraphic },
    { title: "视频脚本", tables: fallbackVideo },
  ]);
  const runtime = readInsightAiRuntimeConfig(settings);

  if (!isInsightAiConfigured(settings)) {
    return {
      generationMode: "FALLBACK",
      model: runtime.model,
      errorMessage: "AI 未配置，已生成规则兜底结果。",
      aiDebug: { configured: false },
      graphicTables: fallbackGraphic,
      videoTables: fallbackVideo,
      caseAnalysisTables: fallbackCase,
      plainText: fallbackPlainText,
    };
  }

  const aiInput = buildAiInput(input, comments);

  try {
    const graphicPromptMap = promptMapFromJson(settings.insightAiGraphicTablePromptsJson, DEFAULT_GRAPHIC_TABLE_PROMPTS);
    const videoPromptMap = promptMapFromJson(settings.insightAiVideoTablePromptsJson, DEFAULT_VIDEO_TABLE_PROMPTS);
    const casePromptMap = promptMapFromJson(settings.insightAiCaseAnalysisTablePromptsJson, DEFAULT_CASE_ANALYSIS_TABLE_PROMPTS);
    const [caseResult, graphicResult, videoResult] = await Promise.all([
      input.sourceType === "CASE_STUDY"
        ? requestTablesBySpec({
            settings,
            systemPrompt: tablePrompt(settings.insightAiCaseAnalysisSystemPrompt, DEFAULT_INSIGHT_AI_CASE_ANALYSIS_PROMPT, "caseAnalysisTables"),
            input: aiInput,
            groupKey: "caseAnalysisTables",
            specs: CASE_ANALYSIS_TABLE_SPECS,
            promptMap: casePromptMap,
            fallbackTables: fallbackCase,
            maxTokens: 1800,
          })
        : Promise.resolve(null),
      requestTablesBySpec({
        settings,
        systemPrompt:
          input.sourceType === "CASE_STUDY"
            ? tablePrompt(settings.insightAiCaseGraphicScriptSystemPrompt, DEFAULT_INSIGHT_AI_CASE_GRAPHIC_SCRIPT_PROMPT, "graphicTables")
            : tablePrompt(settings.insightAiGraphicScriptSystemPrompt, DEFAULT_INSIGHT_AI_GRAPHIC_TABLE_SCRIPT_PROMPT, "graphicTables"),
        input: aiInput,
        groupKey: "graphicTables",
        specs: GRAPHIC_TABLE_SPECS,
        promptMap: graphicPromptMap,
        fallbackTables: fallbackGraphic,
        maxTokens: 2200,
      }),
      requestTablesBySpec({
        settings,
        systemPrompt:
          input.sourceType === "CASE_STUDY"
            ? tablePrompt(settings.insightAiCaseVideoScriptSystemPrompt, DEFAULT_INSIGHT_AI_CASE_VIDEO_SCRIPT_PROMPT, "videoTables")
            : tablePrompt(settings.insightAiVideoScriptSystemPrompt, DEFAULT_INSIGHT_AI_VIDEO_TABLE_SCRIPT_PROMPT, "videoTables"),
        input: aiInput,
        groupKey: "videoTables",
        specs: VIDEO_TABLE_SPECS,
        promptMap: videoPromptMap,
        fallbackTables: fallbackVideo,
        maxTokens: 2400,
      }),
    ]);

    const caseAnalysisTables = caseResult?.tables ?? [];
    const graphicTables = graphicResult.tables;
    const videoTables = videoResult.tables;
    const aiTableCount = graphicResult.aiCount + videoResult.aiCount + (caseResult?.aiCount ?? 0);
    const totalTableCount = GRAPHIC_TABLE_SPECS.length + VIDEO_TABLE_SPECS.length + (input.sourceType === "CASE_STUDY" ? CASE_ANALYSIS_TABLE_SPECS.length : 0);
    const aiDebug = {
      splitByTable: true,
      caseAnalysis: caseResult?.debug ?? null,
      graphic: graphicResult.debug,
      video: videoResult.debug,
    };

    if (aiTableCount === 0) {
      const issues = [
        caseResult?.validation ? validationSummary(caseResult.validation) : null,
        validationSummary(graphicResult.validation),
        validationSummary(videoResult.validation),
      ].filter(Boolean);
      return {
        generationMode: "FALLBACK",
        model: runtime.model,
        errorMessage: `AI 返回结果未通过表格校验，已生成规则兜底结果。${issues.length ? ` ${issues.join("；")}` : ""}`.slice(0, 900),
        aiDebug,
        graphicTables: fallbackGraphic,
        videoTables: fallbackVideo,
        caseAnalysisTables: fallbackCase,
        plainText: fallbackPlainText,
      };
    }

    const fallbackIds = [...graphicResult.fallbackIds, ...videoResult.fallbackIds, ...(caseResult?.fallbackIds ?? [])];
    return {
      generationMode: "AI",
      model: runtime.model,
      errorMessage: fallbackIds.length > 0 ? `AI 已生成 ${aiTableCount}/${totalTableCount} 张表；以下表使用规则兜底：${fallbackIds.join("、")}。` : null,
      aiDebug,
      graphicTables,
      videoTables,
      caseAnalysisTables,
      plainText: tablesToPlainText([
        { title: "案例拆解", tables: caseAnalysisTables },
        { title: "图文脚本", tables: graphicTables },
        { title: "视频脚本", tables: videoTables },
      ]),
    };
  } catch (error) {
    return {
      generationMode: "FALLBACK",
      model: runtime.model,
      errorMessage: error instanceof Error ? error.message.slice(0, 240) : "AI 调用失败，已生成规则兜底结果。",
      aiDebug: { exception: error instanceof Error ? error.stack ?? error.message : String(error) },
      graphicTables: fallbackGraphic,
      videoTables: fallbackVideo,
      caseAnalysisTables: fallbackCase,
      plainText: fallbackPlainText,
    };
  }
}

export async function regenerateTrendScriptTable(settings: ScriptGenerationSettings, input: TrendScriptGenerationInput, target: RegenerateTrendScriptTableInput) {
  const runtime = readInsightAiRuntimeConfig(settings);
  if (!isInsightAiConfigured(settings)) {
    throw new Error("AI 未配置，无法重新生成单表。");
  }

  const specs = specsForGroup(target.groupKey);
  const spec = specs.find((item) => item.id === target.tableId);
  if (!spec) {
    throw new Error("未找到要重新生成的表格配置。");
  }

  const nextInput = {
    ...input,
    userInstruction: [input.userInstruction, target.userInstruction].filter(Boolean).join("；") || null,
  };
  const comments = await loadCommentSnippets(nextInput.topic);
  const promptMap = promptMapForGroup(settings, target.groupKey);
  const result = await requestSingleTableWithRepair({
    settings,
    systemPrompt: systemPromptForGroup(settings, nextInput, target.groupKey),
    input: buildAiInput(nextInput, comments),
    groupKey: target.groupKey,
    spec,
    tableSpecificPrompt: promptMap[spec.id] ?? spec.prompt,
    maxTokens: maxTokensForGroup(target.groupKey),
  });

  if (!result.table) {
    const issueText = result.debug.repairValidation?.issues.join("；") || result.debug.initialValidation.issues.join("；") || result.debug.repairError || result.debug.initialError || "AI 未返回有效表格。";
    throw new Error(issueText.slice(0, 240));
  }

  return {
    table: result.table,
    model: runtime.model,
    debug: result.debug,
  };
}

type ScriptGenerationRecord = CreatorTrendScriptGeneration & {
  scriptImages?: CreatorTrendScriptImage[];
  scriptReviews?: CreatorTrendScriptReview[];
};

function scriptImageToView(image: CreatorTrendScriptImage): ScriptImageView {
  return {
    id: image.id,
    pageKey: image.pageKey,
    pageLabel: image.pageLabel,
    pageOrder: image.pageOrder,
    model: image.model,
    promptHash: image.promptHash,
    prompt: image.prompt,
    negativePrompt: image.negativePrompt,
    aspectRatio: image.aspectRatio,
    size: image.size,
    imageUrl: image.imageUrl,
    status: image.status === "READY" || image.status === "FAILED" ? image.status : "GENERATING",
    errorMessage: image.errorMessage,
    generatedAt: image.generatedAt?.toISOString() ?? null,
    updatedAt: image.updatedAt.toISOString(),
  };
}

export function scriptGenerationToView(record: ScriptGenerationRecord): ScriptGenerationView {
  const scriptImages = (record.scriptImages ?? []).sort((a, b) => a.pageOrder - b.pageOrder);
  const reviewModel = record.model ?? "unknown";
  const reviewInputHash = hashScriptReviewInput(buildScriptReviewInput(record, scriptImages), reviewModel);
  return {
    id: record.id,
    sourceType: record.sourceType === "CASE_STUDY" ? "CASE_STUDY" : "TOPIC_RECOMMENDATION",
    sourceKey: record.sourceKey,
    sourceTitle: record.sourceTitle,
    platform: record.platform,
    status: record.status === "READY" || record.status === "FAILED" ? record.status : "GENERATING",
    generationMode: record.generationMode === "AI" ? "AI" : "FALLBACK",
    model: record.model,
    userInstruction: record.userInstruction,
    errorMessage: record.errorMessage,
    generatedAt: record.generatedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
    graphicTables: normalizeScriptTables(record.graphicTablesJson),
    videoTables: normalizeScriptTables(record.videoTablesJson),
    caseAnalysisTables: normalizeScriptTables(record.caseAnalysisTablesJson),
    scriptImages: scriptImages.map(scriptImageToView),
    scriptReviews: (record.scriptReviews ?? [])
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((review) => scriptReviewToView(review, reviewInputHash)),
    plainText: record.plainText ?? "",
  };
}
