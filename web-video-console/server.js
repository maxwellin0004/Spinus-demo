const http = require("node:http");
const https = require("node:https");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
const {spawn} = require("node:child_process");
const {URL} = require("node:url");

const PORT = Number(process.env.PORT || 3008);
const HOST = process.env.HOST || "127.0.0.1";
const WEB_ROOT = __dirname;
const WORKSPACE_ROOT = path.resolve(__dirname, "..");
const LOCAL_CONFIG_FILE = path.join(WORKSPACE_ROOT, "config.local.json");
const USER_HOME = process.env.USERPROFILE || process.env.HOME || os.homedir() || "";
const CODEX_HOME = path.join(USER_HOME, ".codex");
const TEMPLATE_ROOT = path.join(WORKSPACE_ROOT, "data", "templates");
const JOB_ROOT = path.join(WORKSPACE_ROOT, "data", "jobs");
const SOURCE_VIDEO_ROOT = path.join(WORKSPACE_ROOT, "data", "source_videos");
const ANALYSIS_ROOT = path.join(WORKSPACE_ROOT, "data", "analyses");
const VIDEO_APP_ROOT = path.join(WORKSPACE_ROOT, "video-app");
const VIDEO_PUBLIC_ROOT = path.join(VIDEO_APP_ROOT, "public");
const GENERATED_PUBLIC_ROOT = path.join(VIDEO_PUBLIC_ROOT, "generated-jobs");
const COMPOSITION_ROOT = path.join(WORKSPACE_ROOT, "video-app", "src", "compositions");
const ASSET_IMAGE_ROOT = path.join(WORKSPACE_ROOT, "assets", "images");
const MONITOR_ROOT = path.join(WORKSPACE_ROOT, "monitor", "monitor");
const MONITOR_WEB_ROOT = path.join(MONITOR_ROOT, "web");
const MONITOR_CONFIG_FILE = path.join(MONITOR_ROOT, "config.yaml");
const MONITOR_VENV_PYTHON = path.join(
  MONITOR_ROOT,
  ".venv",
  process.platform === "win32" ? "Scripts" : "bin",
  process.platform === "win32" ? "python.exe" : "python",
);
const ACCOUNT_FILE = path.join(WEB_ROOT, "accounts.json");
const CAMPAIGN_FILE = path.join(WEB_ROOT, "campaigns.json");
const ACTIVITY_FILE = path.join(WEB_ROOT, "activities.json");
const TOPIC_POOL_FILE = path.join(WEB_ROOT, "topic-pool.json");
const BATCH_FILE = path.join(WEB_ROOT, "batches.json");
const AUDIT_FILE = path.join(WEB_ROOT, "audit-events.json");
const SESSION_INDEX_FILE = path.join(CODEX_HOME, "session_index.jsonl");
const SESSION_ROOT = path.join(CODEX_HOME, "sessions");
const ARCHIVED_SESSION_ROOT = path.join(CODEX_HOME, "archived_sessions");
const POWERSHELL_COMMAND = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
const LOCAL_CODEX_EXE = path.join(process.env.LOCALAPPDATA || "", "OpenAI", "Codex", "bin", "codex.exe");
const CODEX_COMMAND = process.env.CODEX_COMMAND || "codex";
const PYTHON_COMMAND = process.env.PYTHON_COMMAND || "python";
const NPX_COMMAND = process.platform === "win32" ? "npx.cmd" : "npx";
const SESSION_CACHE_TTL_MS = Number(process.env.SESSION_CACHE_TTL_MS || 30000);
const SESSION_PATH_CACHE_TTL_MS = Number(process.env.SESSION_PATH_CACHE_TTL_MS || 300000);
const SESSION_PAGE_SIZE = Number(process.env.SESSION_PAGE_SIZE || 20);
const CODEX_PROCESS_TIMEOUT_MS = Number(process.env.CODEX_PROCESS_TIMEOUT_MS || 90000);
const DEFAULT_CODEX_MODEL = process.env.CODEX_MODEL || "gpt-5.4";
const DEFAULT_IMAGE_ASSET_MODEL = process.env.IMAGE_ASSET_MODEL || "gpt-image-2";
const CODEX_CONFIG_FILE = path.join(WEB_ROOT, "codex-console-config.json");
const CODEX_BYPASS_SANDBOX = process.env.CODEX_BYPASS_SANDBOX !== "0";
const SCREEN_QA_ENABLED = process.env.SCREEN_QA_ENABLED !== "0";
const SCREEN_QA_FRAMES = process.env.SCREEN_QA_FRAMES || "";
const SCREEN_QA_OCR_COMMAND = process.env.SCREEN_QA_OCR_COMMAND || "tesseract";
const SESSION_BOOTSTRAP_MARKER = "__CODEX_VIDEO_CONSOLE_BOOTSTRAP__";
const SESSION_BOOTSTRAP_READY = "__CODEX_VIDEO_CONSOLE_READY__";
const SESSION_BOOTSTRAP_PROMPT = `${SESSION_BOOTSTRAP_MARKER}\nReply with exactly ${SESSION_BOOTSTRAP_READY}.`;
const SESSION_CATALOG_CACHE_FILE = path.join(WEB_ROOT, "session-catalog-cache.json");
const REAL_PIPELINE_TIMELINE = {
  news: 240,
  hook: 240,
  mechanism: 300,
  case1: 210,
  case2: 210,
  case3: 210,
  checklist: 330,
  close: 510,
};

const TIMELINE_SECTION_ORDER = [
  ["news_context", "news"],
  ["case_shock", "hook"],
  ["indicator_mechanism", "mechanism"],
  ["chart_case_1", "case1"],
  ["chart_case_2", "case2"],
  ["chart_case_3", "case3"],
  ["checklist", "checklist"],
  ["risk_close", "close"],
];

const BATCH_ACTION_ESTIMATE_MS = {
  "generate-plan": CODEX_PROCESS_TIMEOUT_MS,
  tts: 300000,
  render: 900000,
};

const activeJobProcesses = new Map();
const jobTerminationRequests = new Map();
const codexRuntimeCache = {
  checkedAt: 0,
  payload: null,
};
let codexConsoleConfig = {
  model: DEFAULT_CODEX_MODEL,
};

const templateMeta = {
  ai_concept_analyse: "AI 概念分析 / 拆解",
  bikini_margin_theater: "戏剧化叙事 / 角色对撞",
  comic_emotional_insight: "漫画洞察 / 情绪视角",
  comic_habit_spiral: "漫画叙事 / 习惯机制",
  minimal_psych_explainer: "心理机制 / 方法讲解",
  new_signals: "交易信号 / 指标解释",
  tech_archive_explainer: "技术档案 / 资料考据",
};

const previewImages = [
  "/workspace/assets/images/macd_ref_chart_2.jpg",
  "/workspace/assets/images/macd_ref_chart_1.jpg",
  "/workspace/assets/images/scenario_video_breakdown.jpg",
  "/workspace/assets/images/hook_financial_crisis_newspaper.jpg",
];

const defaultAssetSlots = [
  {
    id: "hook_inset",
    label: "Hook 主视觉",
    type: "image",
    targetPath: "data.hook.insetImageSrc",
    required: true,
    aspectRatio: "16:9",
    preferredAssets: ["macd_ref_chart_1.jpg", "scenario_video_breakdown.jpg"],
    prompt: "适合开头三秒的强视觉图，能快速交代主题和风险。",
  },
  {
    id: "mechanism_image",
    label: "机制解释图",
    type: "image",
    targetPath: "data.mechanism.imageSrc",
    required: true,
    aspectRatio: "16:9",
    preferredAssets: ["macd_ref_chart_2.jpg", "scenario_ppt.jpg"],
    prompt: "用于解释核心机制的图表或结构画面。",
  },
  {
    id: "case_01_image",
    label: "案例 01 图",
    type: "image",
    targetPath: "data.cases.0.imageSrc",
    required: false,
    aspectRatio: "1:1",
    preferredAssets: ["hook_paul_tudor_jones.jpg", "macd_ref_chart_1.jpg"],
    prompt: "第一个案例或场景的辅助画面。",
  },
  {
    id: "case_02_image",
    label: "案例 02 图",
    type: "image",
    targetPath: "data.cases.1.imageSrc",
    required: false,
    aspectRatio: "1:1",
    preferredAssets: ["hook_occupy_wall_street.jpg", "macd_ref_chart_2.jpg"],
    prompt: "第二个案例或情绪转折的辅助画面。",
  },
  {
    id: "case_03_image",
    label: "案例 03 图",
    type: "image",
    targetPath: "data.cases.2.imageSrc",
    required: false,
    aspectRatio: "1:1",
    preferredAssets: ["hook_financial_crisis_store.jpg", "macd_ref_chart_3.jpg"],
    prompt: "第三个案例或结论确认的辅助画面。",
  },
];

const templateCatalog = {
  ai_concept_analyse: {
    title: "AI 概念拆解",
    compositionId: "AiConceptAnalyse",
    suitablePlatforms: ["xiaohongshu", "bilibili", "youtube"],
    defaultDurationSec: 75,
    aspectRatio: "9:16",
    summary: "适合概念解释、资料拆解和结论先行的知识类短视频。",
    tags: ["知识", "拆解", "AI"],
  },
  bikini_margin_theater: {
    title: "冲突戏剧叙事",
    compositionId: "BikiniMarginTheater",
    suitablePlatforms: ["douyin", "xiaohongshu"],
    defaultDurationSec: 45,
    aspectRatio: "9:16",
    summary: "适合强情节、角色冲突和情绪反差明显的短视频结构。",
    tags: ["戏剧化", "冲突", "节奏快"],
  },
  comic_emotional_insight: {
    title: "漫画情绪洞察",
    compositionId: "ComicEmotionalInsight",
    suitablePlatforms: ["xiaohongshu", "douyin"],
    defaultDurationSec: 50,
    aspectRatio: "9:16",
    summary: "适合情绪洞察、心理观察和轻故事化表达。",
    tags: ["漫画", "情绪", "观察"],
  },
  comic_habit_spiral: {
    title: "漫画习惯机制",
    compositionId: "ComicHabitSpiral",
    suitablePlatforms: ["xiaohongshu", "bilibili"],
    defaultDurationSec: 60,
    aspectRatio: "9:16",
    summary: "适合习惯、机制、方法论和强结构化讲述。",
    tags: ["漫画", "方法论", "结构化"],
  },
  minimal_psych_explainer: {
    title: "极简心理解释",
    compositionId: "MinimalPsychExplainer",
    suitablePlatforms: ["xiaohongshu", "youtube"],
    defaultDurationSec: 60,
    aspectRatio: "9:16",
    summary: "适合冷静、克制、文字驱动的解释型视频。",
    tags: ["极简", "解释", "心理"],
  },
  new_signals: {
    title: "交易信号教学",
    compositionId: "NewSignalsComposition",
    suitablePlatforms: ["xiaohongshu", "douyin", "bilibili"],
    defaultDurationSec: 60,
    aspectRatio: "9:16",
    summary: "适合交易教育、指标讲解和市场节奏判断的视频模板。",
    tags: ["交易", "教育", "信号"],
  },
  tech_archive_explainer: {
    title: "技术档案解读",
    compositionId: "TechArchiveExplainer",
    suitablePlatforms: ["bilibili", "youtube"],
    defaultDurationSec: 90,
    aspectRatio: "16:9",
    summary: "适合技术背景、资料引用和更长时长的说明型内容。",
    tags: ["技术", "档案", "资料"],
  },
};

function getTemplateAssetSlots(templateId) {
  const template = getTemplateCatalogEntry(templateId);
  const overrides = ensureArray(template?.assetSlots);
  const byId = new Map(defaultAssetSlots.map((slot) => [slot.id, {...slot}]));
  overrides.forEach((slot) => {
    if (!slot?.id) return;
    byId.set(slot.id, {...(byId.get(slot.id) || {}), ...slot});
  });
  return [...byId.values()].map((slot, index) => ({
    id: String(slot.id || `asset_${index + 1}`),
    label: String(slot.label || slot.id || `素材 ${index + 1}`),
    type: String(slot.type || "image"),
    targetPath: String(slot.targetPath || ""),
    required: slot.required !== false,
    aspectRatio: String(slot.aspectRatio || "9:16"),
    allowedSources: ensureArray(slot.allowedSources).length ? ensureArray(slot.allowedSources) : ["local", "ai", "web"],
    preferredAssets: ensureArray(slot.preferredAssets),
    prompt: String(slot.prompt || "为当前视频生成或选择一个匹配画面风格的素材。"),
  }));
}

const instructionPresets = [
  {
    id: "strong_hook",
    label: "强化 Hook",
    shortDescription: "前 3 秒先给结论或冲突。",
    prompt: "Strengthen the opening hook and put the sharpest claim in the first three seconds.",
  },
  {
    id: "more_conversational",
    label: "更口语化",
    shortDescription: "降低书面感，句子更短。",
    prompt: "Make the copy more conversational and less formal.",
  },
  {
    id: "xiaohongshu_style",
    label: "小红书风格",
    shortDescription: "更贴近小红书信息节奏。",
    prompt: "Adjust the script and pacing to fit Xiaohongshu style.",
  },
  {
    id: "rewrite_copy_only",
    label: "只改文案",
    shortDescription: "保留模板和镜头结构。",
    prompt: "Rewrite copy only and keep the current template and scene structure.",
  },
  {
    id: "faster_pacing",
    label: "节奏更快",
    shortDescription: "减少过渡，切换更快。",
    prompt: "Tighten pacing and reduce slow transitions.",
  },
  {
    id: "keep_template",
    label: "保留模板",
    shortDescription: "不要自动改模板。",
    prompt: "Keep the selected template locked unless explicitly requested otherwise.",
  },
];

const defaultAccounts = [
  {
    id: "trading_xhs",
    name: "交易教育-小红书",
    platform: "xiaohongshu",
    persona: "冷静交易老师",
    toneTags: ["强Hook", "口语化", "节奏快"],
    defaultTemplateId: "new_signals",
    defaultCompositionId: "NewSignalsComposition",
    defaultDurationSec: 60,
    aspectRatio: "9:16",
    ctaStyle: "行动建议型",
    constraints: ["不喊单", "不夸收益", "结尾给明确下一步动作"],
    subtitleStyle: "大字高亮",
    voiceProfile: "cn_female_fast",
  },
  {
    id: "trading_bili",
    name: "交易教育-B站",
    platform: "bilibili",
    persona: "结构化交易分析员",
    toneTags: ["更专业", "信息密度高", "解释型"],
    defaultTemplateId: "new_signals",
    defaultCompositionId: "NewSignalsComposition",
    defaultDurationSec: 90,
    aspectRatio: "16:9",
    ctaStyle: "延伸阅读型",
    constraints: ["避免夸张表达", "结论要有依据"],
    subtitleStyle: "标准字幕",
    voiceProfile: "cn_male_clear",
  },
  {
    id: "psych_xhs",
    name: "心理洞察-小红书",
    platform: "xiaohongshu",
    persona: "冷静洞察型讲述者",
    toneTags: ["克制", "洞察", "慢铺垫"],
    defaultTemplateId: "minimal_psych_explainer",
    defaultCompositionId: "MinimalPsychExplainer",
    defaultDurationSec: 60,
    aspectRatio: "9:16",
    ctaStyle: "评论互动型",
    constraints: ["不说教", "不要情绪绑架"],
    subtitleStyle: "轻高亮",
    voiceProfile: "cn_female_warm",
  },
];

const runtimeJobs = new Map();
const persistedJobs = new Map();
const sessionCatalog = new Map();
const sessionCatalogCache = new Map();
const sessionPathIndex = new Map();
const sseClients = new Map();
const sessionPathState = {
  loadedAt: 0,
  scanMs: 0,
};
const sessionCatalogState = {
  loadedAt: 0,
  scanMs: 0,
  pathScanMs: 0,
  totalCount: 0,
  workspaceCount: 0,
  cacheHits: 0,
  hydratedCount: 0,
  cacheLoaded: false,
  cacheDirty: false,
};
let accountCache = null;
let campaignCache = null;
let activityCache = null;
let topicPoolCache = null;
let batchCache = null;
let auditCache = null;

function resolveFfmpegBinary() {
  const candidates = [
    path.join(WORKSPACE_ROOT, "tools", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"),
    path.join(VIDEO_APP_ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe"),
    path.join(VIDEO_APP_ROOT, "node_modules", "ffmpeg-static", "ffmpeg.exe"),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
}

const FFMPEG_COMMAND = resolveFfmpegBinary();

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function safeParseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function readJsonLines(filePath) {
  return safeReadText(filePath)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => safeParseJsonLine(line))
    .filter(Boolean);
}

function loadSessionCatalogCache() {
  if (sessionCatalogState.cacheLoaded) return;
  sessionCatalogState.cacheLoaded = true;
  const cache = safeReadJson(SESSION_CATALOG_CACHE_FILE);
  if (!cache || typeof cache !== "object" || !cache.sessions || typeof cache.sessions !== "object") {
    return;
  }
  for (const [sessionId, entry] of Object.entries(cache.sessions)) {
    if (!entry || typeof entry !== "object") continue;
    sessionCatalogCache.set(sessionId, entry);
  }
}

function persistSessionCatalogCache() {
  if (!sessionCatalogState.cacheDirty) return;
  const sessions = {};
  for (const [sessionId, entry] of sessionCatalogCache.entries()) {
    sessions[sessionId] = entry;
  }
  safeWriteJson(SESSION_CATALOG_CACHE_FILE, {
    savedAt: nowIso(),
    sessions,
  });
  sessionCatalogState.cacheDirty = false;
}

function nowIso() {
  return new Date().toISOString();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureStringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeId(value, prefix = "item") {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `${prefix}-${Date.now()}`;
}

function normalizeCopyRewriteVariant(value) {
  return sanitizeId(value || "sharp_contrarian", "sharp_contrarian").replaceAll("-", "_");
}

function safeWriteJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function normalizeCodexModel(model) {
  const text = String(model || "").trim();
  return text || DEFAULT_CODEX_MODEL;
}

function loadCodexConsoleConfig() {
  const raw = safeReadJson(CODEX_CONFIG_FILE);
  const model = normalizeCodexModel(raw?.model);
  const next = {model};
  if (!raw || typeof raw !== "object" || raw.model !== model) {
    safeWriteJson(CODEX_CONFIG_FILE, next);
  }
  return next;
}

function saveCodexConsoleConfig(nextConfig = {}) {
  codexConsoleConfig = {
    model: normalizeCodexModel(nextConfig.model),
  };
  safeWriteJson(CODEX_CONFIG_FILE, codexConsoleConfig);
  return {...codexConsoleConfig};
}

function getCurrentCodexModel() {
  return normalizeCodexModel(codexConsoleConfig?.model);
}

codexConsoleConfig = loadCodexConsoleConfig();

function safeWriteText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, String(text || ""), "utf8");
}

function publicEntitySnapshot(job) {
  return {
    id: job.id,
    type: job.type || "video_generation",
    source: job.source,
    title: job.title,
    prompt: job.prompt,
    status: job.status,
    accountId: job.accountId || "",
    templateId: job.templateId || "",
    compositionId: job.compositionId || "",
    renderCompositionId: job.renderCompositionId || "",
    topicTitle: job.topicTitle || "",
    durationSec: Number(job.durationSec || 60),
    aspectRatio: job.aspectRatio || "9:16",
    subtitleFontSize: normalizeSubtitleFontSize(job.subtitleFontSize, 28),
    subtitleColor: normalizeSubtitleColor(job.subtitleColor, "#ffffff"),
    templateLocked: Boolean(job.templateLocked),
    activePresetIds: ensureArray(job.activePresetIds),
    openInstruction: job.openInstruction || "",
    instructionScope: job.instructionScope || "run",
    useAiImageAssets: Boolean(job.useAiImageAssets),
    imageAssetModel: normalizeImageAssetModel(job.imageAssetModel) || getImageApiConfig().model,
    replication: job.replication || null,
    outputDir: job.outputDir,
    codexSessionId: job.codexSessionId || null,
    planSource: job.planSource || "",
    planFallbackReason: job.planFallbackReason || "",
    stageIndex: Number(job.stageIndex || 0),
    pipelineRunning: Boolean(job.pipelineRunning),
    lastPipelineAction: job.lastPipelineAction || "",
    failedAction: job.failedAction || "",
    archived: Boolean(job.archived),
    archivedAt: job.archivedAt || "",
    campaignId: job.campaignId || "",
    activityId: job.activityId || "",
    topicId: job.topicId || "",
    batchId: job.batchId || "",
    batchIndex: Number(job.batchIndex || 0),
    messages: ensureArray(job.messages),
    steps: ensureArray(job.steps),
    logs: ensureArray(job.logs).slice(-120),
    preview: job.preview || null,
    scriptSections: ensureArray(job.scriptSections),
    updatedAt: job.updatedAt || nowIso(),
    createdAt: job.createdAt || "",
  };
}

function safeWriteText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, String(text || ""), "utf8");
}

function relativeWorkspacePath(targetPath) {
  return path.relative(WORKSPACE_ROOT, targetPath).replaceAll("\\", "/");
}

function getJobWorkspaceDir(job) {
  return path.join(JOB_ROOT, job.id);
}

function getJobPublicDir(job) {
  return path.join(GENERATED_PUBLIC_ROOT, job.id);
}

function ensureJobArtifactShape(job) {
  if (!job.artifacts || typeof job.artifacts !== "object") {
    job.artifacts = {};
  }

  const workspaceDir = getJobWorkspaceDir(job);
  const publicDir = getJobPublicDir(job);
  const copyVariant = normalizeCopyRewriteVariant(job.replication?.copyVariant || job.replication?.rewriteVariant);
  fs.mkdirSync(workspaceDir, {recursive: true});
  fs.mkdirSync(publicDir, {recursive: true});

  job.outputDir = relativeWorkspacePath(workspaceDir);
  job.artifacts.workspaceDir = workspaceDir;
  job.artifacts.publicDir = publicDir;
  job.artifacts.requestPath = path.join(workspaceDir, "request.json");
  job.artifacts.planBriefPath = path.join(workspaceDir, "plan-brief.json");
  job.artifacts.planPath = path.join(workspaceDir, "video_plan.json");
  job.artifacts.unitsPath = path.join(workspaceDir, "voiceover_units.json");
  job.artifacts.voiceoverTextPath = path.join(workspaceDir, "voiceover.txt");
  job.artifacts.subtitlesPath = path.join(workspaceDir, "subtitles.json");
  job.artifacts.alignmentPath = path.join(workspaceDir, "alignment.json");
  job.artifacts.renderPropsPath = path.join(workspaceDir, "render-props.json");
  job.artifacts.viralBreakdownPath = path.join(workspaceDir, "viral_breakdown.json");
  job.artifacts.moduleMatchReportPath = path.join(workspaceDir, "module_match_report.json");
  job.artifacts.replicationPlanPath = path.join(workspaceDir, "replication_plan.json");
  job.artifacts.replicationStatusPath = path.join(workspaceDir, "replication_status.json");
  job.artifacts.compileReportPath = path.join(workspaceDir, "compile_report.json");
  job.artifacts.replicationAssetPlanPath = path.join(workspaceDir, "asset_plan.json");
  job.artifacts.copyRewriteContextPath = path.join(workspaceDir, "copy_rewrite_context.json");
  job.artifacts.copyRewritePath = path.join(workspaceDir, `copy_rewrite.${copyVariant}.json`);
  job.artifacts.rewrittenPlanPath = path.join(workspaceDir, `video_plan.rewritten.${copyVariant}.json`);
  job.artifacts.assetPromptPlanPath = path.join(workspaceDir, `asset_prompt_plan.${copyVariant}.json`);
  job.artifacts.deliveryAssetManifestPath = path.join(workspaceDir, `asset_manifest.${copyVariant}.json`);
  job.artifacts.assetRenderPropsPath = path.join(workspaceDir, `render-props.assets.${copyVariant}.json`);
  job.artifacts.voiceoverPackagePath = path.join(workspaceDir, `voiceover_package.${copyVariant}.json`);
  job.artifacts.voiceoverAlignmentPath = path.join(workspaceDir, `voiceover_alignment.${copyVariant}.json`);
  job.artifacts.voiceoverSubtitlesPath = path.join(workspaceDir, `voiceover_subtitles.${copyVariant}.json`);
  job.artifacts.voiceoverRenderPropsPath = path.join(workspaceDir, `render-props.voiceover.${copyVariant}.json`);
  job.artifacts.finalRenderPropsPath = path.join(workspaceDir, `render-props.final.${copyVariant}.json`);
  job.artifacts.renderPackagePath = path.join(workspaceDir, `render_package.${copyVariant}.json`);
  job.artifacts.outputVideoPath = path.join(workspaceDir, "output.mp4");
  job.artifacts.posterPath = path.join(workspaceDir, "poster.jpg");
  job.artifacts.coverMetaPath = path.join(workspaceDir, "cover.json");
  job.artifacts.assetsDir = path.join(workspaceDir, "assets");
  job.artifacts.assetPlanPath = path.join(job.artifacts.assetsDir, "asset_plan.json");
  job.artifacts.assetManifestPath = path.join(job.artifacts.assetsDir, "manifest.json");
  job.artifacts.assetPromptDir = path.join(job.artifacts.assetsDir, "prompts");
  job.artifacts.screenQaDir = path.join(workspaceDir, "screen-qa");
  job.artifacts.screenQaReportPath = path.join(job.artifacts.screenQaDir, "report.json");
  job.artifacts.publicAssetsDir = path.join(publicDir, "assets");
  job.artifacts.publicVoiceoverPath = path.join(publicDir, "voiceover.mp3");
  job.artifacts.publicVoiceoverUrl = `/workspace/${relativeWorkspacePath(path.join(publicDir, "voiceover.mp3"))}`;
  return job.artifacts;
}

function toWorkspaceUrl(targetPath) {
  return `/workspace/${relativeWorkspacePath(targetPath)}`;
}

function buildArtifactManifest(job) {
  const artifacts = ensureJobArtifactShape(job);
  const coverMeta = safeReadJson(artifacts.coverMetaPath) || {};
  const defaultPosterPath = String(coverMeta.posterPath || "").replaceAll("\\", "/");
  const items = [
    ["request", "任务请求", artifacts.requestPath],
    ["planBrief", "计划摘要", artifacts.planBriefPath],
    ["plan", "视频计划", artifacts.planPath],
    ["voiceoverUnits", "口播单元", artifacts.unitsPath],
    ["voiceoverText", "口播全文", artifacts.voiceoverTextPath],
    ["subtitles", "字幕", artifacts.subtitlesPath],
    ["alignment", "对齐时间轴", artifacts.alignmentPath],
    ["renderProps", "渲染参数", artifacts.renderPropsPath],
    ["assetPlan", "素材需求", artifacts.assetPlanPath],
    ["assetManifest", "素材清单", artifacts.assetManifestPath],
    ["poster", "封面帧", artifacts.posterPath],
    ["screenQa", "Screen QA", artifacts.screenQaReportPath],
    ["audio", "配音音频", artifacts.publicVoiceoverPath],
    ["video", "渲染视频", artifacts.outputVideoPath],
  ];
  items.splice(
    8,
    0,
    ["viralBreakdown", "爆款拆解", artifacts.viralBreakdownPath],
    ["moduleMatchReport", "模块匹配", artifacts.moduleMatchReportPath],
    ["replicationPlan", "复刻计划", artifacts.replicationPlanPath],
    ["replicationStatus", "复刻状态", artifacts.replicationStatusPath],
    ["compileReport", "编译报告", artifacts.compileReportPath],
    ["replicationAssetPlan", "复刻素材计划", artifacts.replicationAssetPlanPath],
    ["copyRewriteContext", "文案重写上下文", artifacts.copyRewriteContextPath],
    ["copyRewrite", "文案重写", artifacts.copyRewritePath],
    ["rewrittenPlan", "改写视频计划", artifacts.rewrittenPlanPath],
    ["assetPromptPlan", "素材提示词计划", artifacts.assetPromptPlanPath],
    ["deliveryAssetManifest", "交付素材清单", artifacts.deliveryAssetManifestPath],
    ["assetRenderProps", "素材渲染参数", artifacts.assetRenderPropsPath],
    ["voiceoverPackage", "配音包", artifacts.voiceoverPackagePath],
    ["voiceoverAlignment", "配音对齐", artifacts.voiceoverAlignmentPath],
    ["voiceoverSubtitles", "配音字幕", artifacts.voiceoverSubtitlesPath],
    ["voiceoverRenderProps", "配音渲染参数", artifacts.voiceoverRenderPropsPath],
    ["finalRenderProps", "最终渲染参数", artifacts.finalRenderPropsPath],
    ["renderPackage", "最终渲染包", artifacts.renderPackagePath],
  );

  return items.reduce(
    (output, [key, label, filePath]) => {
      const exists = fs.existsSync(filePath);
      const relativePath = relativeWorkspacePath(filePath);
      output[key] = {
        key,
        label,
        exists,
        path: relativePath,
        url: exists ? toWorkspaceUrl(filePath) : "",
        fileName: path.basename(filePath),
      };
      if (key === "poster") {
        output[key].isDefaultCover = exists && (!defaultPosterPath || defaultPosterPath === relativePath);
      }
      return output;
    },
    {
      workspaceDir: {
        key: "workspaceDir",
        label: "输出目录",
        exists: true,
        path: relativeWorkspacePath(artifacts.workspaceDir),
        url: "",
      },
    },
  );
}

function getJobScreenQaStatus(job) {
  const artifacts = ensureJobArtifactShape(job);
  if (!fs.existsSync(artifacts.screenQaReportPath)) return "missing";
  const report = safeReadJson(artifacts.screenQaReportPath);
  return String(report?.status || "unknown");
}

function buildBatchArtifactStatus(job) {
  const manifest = buildArtifactManifest(job);
  return {
    plan: Boolean(manifest.plan?.exists),
    audio: Boolean(manifest.audio?.exists),
    subtitles: Boolean(manifest.subtitles?.exists),
    poster: Boolean(manifest.poster?.exists),
    video: Boolean(manifest.video?.exists),
    screenQa: Boolean(manifest.screenQa?.exists),
  };
}

function readJobAssetPlan(job) {
  const artifacts = ensureJobArtifactShape(job);
  return safeReadJson(artifacts.assetPlanPath) || null;
}

function readJobAssetManifest(job) {
  const artifacts = ensureJobArtifactShape(job);
  const manifest = safeReadJson(artifacts.assetManifestPath);
  return manifest && typeof manifest === "object"
    ? {
        version: manifest.version || "asset-manifest-v1",
        updatedAt: manifest.updatedAt || "",
        items: ensureArray(manifest.items),
      }
    : {
        version: "asset-manifest-v1",
        updatedAt: "",
        items: [],
      };
}

function writeJobAssetManifest(job, manifest) {
  const artifacts = ensureJobArtifactShape(job);
  const next = {
    version: "asset-manifest-v1",
    updatedAt: nowIso(),
    items: ensureArray(manifest?.items),
  };
  fs.mkdirSync(artifacts.assetsDir, {recursive: true});
  safeWriteJson(artifacts.assetManifestPath, next);
  return next;
}

function buildAssetPlan(job, plan = null) {
  const topic = getSafeTopicLabel(job, plan?.meta?.topic || job.topicTitle || inferJobTopic(job));
  const account = getAccount(job.accountId);
  const template = getTemplateCatalogEntry(job.templateId);
  const slots = getTemplateAssetSlots(job.templateId).map((slot) => ({
    ...slot,
    sceneId: slot.targetPath || slot.id,
    style: [template?.title, account?.persona, account?.toneTags?.join(" / "), job.aspectRatio].filter(Boolean).join(" / "),
    prompt: `${slot.prompt} 主题：${topic}。账号风格：${account?.persona || "默认"}。`,
  }));
  return {
    version: "asset-plan-v1",
    generatedAt: nowIso(),
    jobId: job.id,
    templateId: job.templateId,
    topic,
    mode: "local-first",
    enforceBeforeRender: true,
    slots,
  };
}

function getLocalAssetCandidates() {
  return listAssets().map((asset) => ({
    ...asset,
    absolutePath: path.resolve(WORKSPACE_ROOT, asset.path || ""),
  }));
}

function pickLocalAssetForSlot(slot) {
  const candidates = getLocalAssetCandidates().filter((asset) => fs.existsSync(asset.absolutePath));
  if (!candidates.length) return null;
  const preferred = ensureArray(slot.preferredAssets)
    .map((name) => candidates.find((asset) => asset.name === name))
    .find(Boolean);
  if (preferred) return preferred;
  if (/chart|图表|机制|交易/i.test(`${slot.label} ${slot.prompt}`)) {
    return candidates.find((asset) => asset.kind === "图表素材") || candidates[0];
  }
  if (/hook|主视觉/i.test(`${slot.label} ${slot.prompt}`)) {
    return candidates.find((asset) => asset.kind === "Hook 素材") || candidates[0];
  }
  return candidates[0];
}

function normalizeAssetFileName(slotId, sourcePath) {
  const ext = path.extname(sourcePath || "") || ".jpg";
  return `${safeArchiveName(slotId, "asset")}${ext}`;
}

function normalizeGeneratedAssetFileName(slotId, ext = ".svg") {
  const stamp = nowIso().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return `${safeArchiveName(slotId, "asset")}-ai-${stamp}${ext}`;
}

function normalizeImageAssetModel(model = "") {
  return String(model || "").trim();
}

function normalizeSubtitleFontSize(value, fallback = 28) {
  const number = Number(value || fallback);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(52, Math.max(20, Math.round(number)));
}

function normalizeSubtitleColor(value, fallback = "#ffffff") {
  const color = String(value || fallback).trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : fallback;
}

function getImageSizeForAsset(job, slot) {
  const ratio = String(slot?.aspectRatio || job?.aspectRatio || "16:9").trim();
  if (ratio === "9:16" || ratio === "3:4" || /portrait/i.test(ratio)) return "1024x1536";
  if (ratio === "1:1" || /square/i.test(ratio)) return "1024x1024";
  return "1536x1024";
}

function getImageExtFromFormat(format = "") {
  const normalized = String(format || "").toLowerCase();
  if (normalized === "jpeg" || normalized === "jpg") return ".jpg";
  if (normalized === "webp") return ".webp";
  return ".png";
}

function getImageApiConfig() {
  const localConfig = safeReadJson(LOCAL_CONFIG_FILE) || {};
  const apiKey =
    process.env.OPENAI_IMAGE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    localConfig.OPENAI_IMAGE_API_KEY ||
    localConfig.OPENAI_API_KEY ||
    "";
  const generationsUrl =
    process.env.OPENAI_IMAGES_GENERATIONS_URL ||
    localConfig.OPENAI_IMAGES_GENERATIONS_URL ||
    "https://api.openai.com/v1/images/generations";
  const model = normalizeImageAssetModel(process.env.IMAGE_ASSET_MODEL || localConfig.IMAGE_ASSET_MODEL) || DEFAULT_IMAGE_ASSET_MODEL;
  return {apiKey, generationsUrl, model};
}

function extractImageUrlFromContent(content) {
  const text = typeof content === "string" ? content : JSON.stringify(content || "");
  const markdownMatch = text.match(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/i);
  if (markdownMatch) return markdownMatch[1];
  const urlMatch = text.match(/https?:\/\/[^\s"'<>）)]+/i);
  return urlMatch ? urlMatch[0] : "";
}

function downloadRemoteImage(urlText) {
  const endpoint = new URL(urlText);
  const transport = endpoint.protocol === "http:" ? http : https;
  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        method: "GET",
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port || undefined,
        path: `${endpoint.pathname}${endpoint.search}`,
        timeout: Number(process.env.IMAGE_ASSET_DOWNLOAD_TIMEOUT_MS || 120000),
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadRemoteImage(new URL(res.headers.location, endpoint).toString()).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Image download failed with HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: String(res.headers["content-type"] || ""),
            url: endpoint.toString(),
          });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Image download timed out")));
    req.on("error", reject);
    req.end();
  });
}

function getImageExtFromContentType(contentType = "") {
  const normalized = String(contentType || "").toLowerCase();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return ".jpg";
  if (normalized.includes("webp")) return ".webp";
  if (normalized.includes("png")) return ".png";
  return "";
}

function requestOpenAiImageAsset({prompt, model, size, quality = "medium"}) {
  const imageApiConfig = getImageApiConfig();
  const apiKey = imageApiConfig.apiKey;
  if (!apiKey) {
    return Promise.reject(new Error("OPENAI_API_KEY or OPENAI_IMAGE_API_KEY is required in config.local.json for image asset generation"));
  }
  const endpoint = new URL(imageApiConfig.generationsUrl);
  if (/\/chat\/completions$/i.test(endpoint.pathname)) {
    const payload = JSON.stringify({
      model: normalizeImageAssetModel(model || imageApiConfig.model),
      messages: [{role: "user", content: prompt}],
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          method: "POST",
          protocol: endpoint.protocol,
          hostname: endpoint.hostname,
          port: endpoint.port || undefined,
          path: `${endpoint.pathname}${endpoint.search}`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
          timeout: Number(process.env.IMAGE_ASSET_TIMEOUT_MS || 180000),
        },
        (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", async () => {
            let parsed = null;
            try {
              parsed = JSON.parse(body || "{}");
            } catch {}
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(parsed?.error?.message || `Image chat generation failed with HTTP ${res.statusCode}`));
              return;
            }
            const content = parsed?.choices?.[0]?.message?.content || "";
            const imageUrl = extractImageUrlFromContent(content);
            if (!imageUrl) {
              reject(new Error("Image chat generation returned no image URL"));
              return;
            }
            try {
              const downloaded = await downloadRemoteImage(imageUrl);
              resolve({
                buffer: downloaded.buffer,
                outputFormat: getImageExtFromContentType(downloaded.contentType).replace(".", "") || path.extname(new URL(imageUrl).pathname).replace(".", "") || "png",
                revisedPrompt: imageUrl,
              });
            } catch (error) {
              reject(error);
            }
          });
        },
      );
      req.on("timeout", () => req.destroy(new Error("Image chat generation timed out")));
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
  }

  const payload = JSON.stringify({
    model: normalizeImageAssetModel(model || imageApiConfig.model),
    prompt,
    size,
    quality,
    n: 1,
    output_format: "png",
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: "POST",
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port || undefined,
        path: `${endpoint.pathname}${endpoint.search}`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: Number(process.env.IMAGE_ASSET_TIMEOUT_MS || 180000),
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body || "{}");
          } catch {}
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(parsed?.error?.message || `OpenAI image generation failed with HTTP ${res.statusCode}`));
            return;
          }
          const image = parsed?.data?.[0] || {};
          if (!image.b64_json) {
            reject(new Error("OpenAI image generation returned no base64 image data"));
            return;
          }
          resolve({
            buffer: Buffer.from(image.b64_json, "base64"),
            outputFormat: image.output_format || parsed.output_format || "png",
            revisedPrompt: image.revised_prompt || "",
          });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("OpenAI image generation timed out")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function escapeSvgText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTextLines(value, maxLength = 18, maxLines = 4) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const lines = [];
  let current = "";
  for (const char of text) {
    if ((current + char).length > maxLength) {
      lines.push(current);
      current = char;
      if (lines.length >= maxLines) break;
    } else {
      current += char;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function getSlotVisualIntent(slot) {
  const text = `${slot.id || ""} ${slot.label || ""} ${slot.prompt || ""}`.toLowerCase();
  if (/hook|主视觉|opening|开头/.test(text)) return "hook";
  if (/mechanism|机制|解释|chart|图表/.test(text)) return "mechanism";
  if (/case_?01|案例 01|第一/.test(text)) return "case1";
  if (/case_?02|案例 02|第二|转折/.test(text)) return "case2";
  if (/case_?03|案例 03|第三|结论/.test(text)) return "case3";
  return "general";
}

function getAspectSize(aspectRatio = "16:9") {
  const ratio = String(aspectRatio || "16:9");
  if (ratio === "1:1") return {width: 1200, height: 1200};
  if (ratio === "9:16") return {width: 1080, height: 1920};
  return {width: 1600, height: 900};
}

function composeAssetGenerationPrompt(job, slot, plan = null) {
  const account = getAccount(job.accountId);
  const template = getTemplateCatalogEntry(job.templateId);
  const topic = getSafeTopicLabel(job, plan?.meta?.topic || job.topicTitle || inferJobTopic(job));
  const hookText =
    plan?.data?.hook?.subheadline ||
    ensureArray(plan?.scriptSections).find((section) => section.label === "Hook")?.text ||
    job.prompt ||
    "";
  const scenePurposeByIntent = {
    hook: "strong opening visual for the first three seconds; communicate tension and risk immediately",
    mechanism: "teaching visual that explains structure, signals, or a decision framework",
    case1: "first case visual that supports a concrete market example",
    case2: "second case visual emphasizing reversal, hesitation, or risk confirmation",
    case3: "third case visual emphasizing conclusion, validation, or disciplined execution",
    general: "supporting video material that matches the current scene",
  };
  const intent = getSlotVisualIntent(slot);
  const lines = [
    "Use case: stylized-concept",
    `Asset type: fresh video material for ${slot.id}`,
    `Primary request: Create a brand-new image asset for this template slot. Do not reuse local assets.`,
    `Topic: ${topic}`,
    `Template: ${template?.title || job.templateId || "default video template"}`,
    `Account style: ${[account?.persona, ensureArray(account?.toneTags).join(" / "), account?.ctaStyle].filter(Boolean).join(" / ") || "clear educational voice"}`,
    `Platform and format: ${account?.platform || "short video"} / ${job.aspectRatio || "9:16"} / slot aspect ${slot.aspectRatio || "16:9"}`,
    `Scene purpose: ${scenePurposeByIntent[intent]}`,
    `Slot instruction: ${slot.prompt || "Generate a useful visual for this scene."}`,
    `Relevant script context: ${hookText}`,
    "Composition: center-safe, readable at mobile size, keep all important subjects inside the central 70% safe area, leave clean margin around every edge",
    "Style/medium: polished editorial digital illustration with realistic financial UI/chart mood, suitable for Remotion video compositing",
    "Lighting/mood: analytical, tense, modern, credible",
    "Constraints: no logos, no watermark, no readable brand names, no profit promises, no investment advice text",
    "Text policy: do not render any large title, caption, label, subtitle, Chinese characters, numbers, or UI text in the image; Remotion will add all copy later",
    "Avoid: cash piles, luxury cars, meme style, fake app brand UI, cluttered tiny text, poster typography, banners with words",
  ];
  return lines.join("\n");
}

function buildGeneratedAssetSvg(job, slot, promptText) {
  const intent = getSlotVisualIntent(slot);
  const {width, height} = getAspectSize(slot.aspectRatio || job.aspectRatio || "16:9");
  const topic = getSafeTopicLabel(job, inferJobTopic(job));
  const titleLines = wrapTextLines(slot.label || slot.id, width > height ? 20 : 12, 3);
  const topicLines = wrapTextLines(topic, width > height ? 24 : 14, 4);
  const colors = {
    hook: ["#071017", "#0c6b5a", "#f04f3f"],
    mechanism: ["#08111f", "#2563eb", "#16a34a"],
    case1: ["#10140f", "#7c9f35", "#eab308"],
    case2: ["#160f14", "#be3a5c", "#f97316"],
    case3: ["#0f1720", "#0f766e", "#60a5fa"],
    general: ["#0b1320", "#475569", "#14b8a6"],
  }[intent];
  const chartY = Math.round(height * 0.62);
  const chartLeft = Math.round(width * 0.08);
  const chartRight = Math.round(width * 0.92);
  const chartWidth = chartRight - chartLeft;
  const points = Array.from({length: 9}, (_, index) => {
    const x = chartLeft + Math.round((chartWidth / 8) * index);
    const wave = Math.sin(index * 1.15 + slot.id.length) * 0.5 + Math.cos(index * 0.7) * 0.5;
    const y = chartY - Math.round((height * 0.16) * wave) - (index > 5 ? Math.round(height * 0.05) : 0);
    return `${x},${y}`;
  }).join(" ");
  const bars = Array.from({length: 12}, (_, index) => {
    const barWidth = Math.max(12, Math.round(chartWidth / 26));
    const gap = Math.round((chartWidth - barWidth * 12) / 11);
    const x = chartLeft + index * (barWidth + gap);
    const barHeight = Math.round(height * (0.05 + ((index * 37 + slot.id.length * 11) % 100) / 900));
    const y = chartY + Math.round(height * 0.16) - barHeight;
    const fill = index % 3 === 0 ? colors[2] : "rgba(255,255,255,0.42)";
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="${Math.max(3, Math.round(barWidth / 4))}" fill="${fill}" opacity="0.82"/>`;
  }).join("");
  const titleSvg = titleLines
    .map((line, index) => `<text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.14) + index * Math.round(height * 0.055)}" class="title">${escapeSvgText(line)}</text>`)
    .join("");
  const topicSvg = topicLines
    .map((line, index) => `<text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.34) + index * Math.round(height * 0.04)}" class="topic">${escapeSvgText(line)}</text>`)
    .join("");
  const promptHash = Buffer.from(promptText).toString("base64").slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="58%" stop-color="${colors[1]}"/>
      <stop offset="100%" stop-color="#05070b"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="28%" r="55%">
      <stop offset="0%" stop-color="${colors[2]}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${colors[2]}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${Math.round(height * 0.012)}" stdDeviation="${Math.round(width * 0.012)}" flood-color="#000" flood-opacity="0.32"/>
    </filter>
    <style>
      .title{font-family:Arial, "Microsoft YaHei", sans-serif;font-size:${Math.round(width * 0.052)}px;font-weight:800;fill:#f8fafc;letter-spacing:0}
      .topic{font-family:Arial, "Microsoft YaHei", sans-serif;font-size:${Math.round(width * 0.03)}px;font-weight:700;fill:rgba(248,250,252,.82);letter-spacing:0}
      .meta{font-family:Arial, sans-serif;font-size:${Math.round(width * 0.018)}px;font-weight:700;fill:rgba(248,250,252,.58);letter-spacing:0}
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g opacity="0.18">
    ${Array.from({length: 8}, (_, index) => `<line x1="0" y1="${Math.round((height / 8) * index)}" x2="${width}" y2="${Math.round((height / 8) * index)}" stroke="#fff" stroke-width="1"/>`).join("")}
    ${Array.from({length: 8}, (_, index) => `<line x1="${Math.round((width / 8) * index)}" y1="0" x2="${Math.round((width / 8) * index)}" y2="${height}" stroke="#fff" stroke-width="1"/>`).join("")}
  </g>
  <g filter="url(#shadow)">
    <rect x="${Math.round(width * 0.055)}" y="${Math.round(height * 0.08)}" width="${Math.round(width * 0.58)}" height="${Math.round(height * 0.32)}" rx="${Math.round(width * 0.02)}" fill="rgba(2,6,23,.48)" stroke="rgba(255,255,255,.16)"/>
    ${titleSvg}
    ${topicSvg}
  </g>
  <g filter="url(#shadow)">
    <rect x="${chartLeft}" y="${Math.round(height * 0.48)}" width="${chartWidth}" height="${Math.round(height * 0.34)}" rx="${Math.round(width * 0.018)}" fill="rgba(2,6,23,.52)" stroke="rgba(255,255,255,.18)"/>
    ${bars}
    <polyline points="${points}" fill="none" stroke="${colors[2]}" stroke-width="${Math.max(5, Math.round(width * 0.008))}" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${points.split(" ").at(-1).split(",")[0]}" cy="${points.split(" ").at(-1).split(",")[1]}" r="${Math.round(width * 0.012)}" fill="${colors[2]}"/>
  </g>
  <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.9)}" class="meta">AI FRESH ASSET / ${escapeSvgText(slot.id)} / ${promptHash}</text>
</svg>
`;
}

async function generateFreshAssetForSlot(job, slotId, options = {}) {
  const artifacts = ensureJobArtifactShape(job);
  const plan = safeReadJson(artifacts.planPath);
  const bundle = ensureJobAssetPlan(job, plan, {autoBindLocal: false});
  const slot = findAssetSlot(bundle.assetPlan, slotId);
  if (!slot) throw new Error("Asset slot not found");
  const existing = bundle.assetManifest.items.find((item) => item.slotId === slotId);
  if (existing?.locked && !options.force) {
    throw new Error("Asset slot is locked");
  }

  const promptText = composeAssetGenerationPrompt(job, slot, plan);
  const useOpenAiImage = options.provider === "openai" || (options.provider !== "svg" && job.useAiImageAssets);
  let imageBuffer = null;
  let outputFormat = "svg";
  let revisedPrompt = "";
  if (useOpenAiImage) {
    try {
      const generated = await requestOpenAiImageAsset({
        prompt: promptText,
        model: options.model || job.imageAssetModel || getImageApiConfig().model,
        size: getImageSizeForAsset(job, slot),
        quality: options.quality || "medium",
      });
      imageBuffer = generated.buffer;
      outputFormat = generated.outputFormat || "png";
      revisedPrompt = generated.revisedPrompt || "";
    } catch (error) {
      pushLog(job, `assets: gpt-image fallback for ${slot.label} (${error.message})`);
      outputFormat = "svg";
    }
  }

  const fileName = normalizeGeneratedAssetFileName(slot.id, getImageExtFromFormat(outputFormat));
  const jobAssetPath = path.join(artifacts.assetsDir, fileName);
  const publicAssetPath = path.join(artifacts.publicAssetsDir, fileName);
  fs.mkdirSync(artifacts.assetsDir, {recursive: true});
  fs.mkdirSync(artifacts.publicAssetsDir, {recursive: true});
  safeWriteText(path.join(artifacts.assetPromptDir, `${safeArchiveName(slot.id, "asset")}.txt`), promptText);
  if (imageBuffer) {
    fs.writeFileSync(jobAssetPath, imageBuffer);
    fs.writeFileSync(publicAssetPath, imageBuffer);
  } else {
    const svg = buildGeneratedAssetSvg(job, slot, promptText);
    safeWriteText(jobAssetPath, svg);
    safeWriteText(publicAssetPath, svg);
  }

  const item = {
    slotId: slot.id,
    label: slot.label,
    type: slot.type || "image",
    source: imageBuffer ? "gpt-image" : "ai",
    model: imageBuffer ? normalizeImageAssetModel(options.model || job.imageAssetModel || getImageApiConfig().model) : "local-svg",
    sourcePath: relativeWorkspacePath(jobAssetPath),
    sourceName: fileName,
    path: relativeWorkspacePath(jobAssetPath),
    url: toWorkspaceUrl(jobAssetPath),
    renderSrc: `/generated-jobs/${encodeURIComponent(job.id)}/assets/${encodeURIComponent(fileName)}`,
    status: options.status || "suggested",
    locked: Boolean(options.locked ?? existing?.locked),
    prompt: promptText,
    revisedPrompt,
    promptPath: relativeWorkspacePath(path.join(artifacts.assetPromptDir, `${safeArchiveName(slot.id, "asset")}.txt`)),
    targetPath: slot.targetPath || "",
    usedInScenes: [slot.sceneId || slot.targetPath || slot.id].filter(Boolean),
    updatedAt: nowIso(),
  };
  const items = bundle.assetManifest.items.filter((entry) => entry.slotId !== slotId);
  items.push(item);
  const assetManifest = writeJobAssetManifest(job, {items});
  pushLog(job, imageBuffer ? `assets: generated ${slot.label} with ${item.model}` : `assets: generated fresh ${slot.label}`);
  persistJobSnapshot(job, "Fresh asset generated");
  broadcastSnapshot(job);
  return {assetPlan: bundle.assetPlan, assetManifest};
}

async function generateFreshAssetsForJob(job, options = {}) {
  const artifacts = ensureJobArtifactShape(job);
  const plan = safeReadJson(artifacts.planPath);
  const bundle = ensureJobAssetPlan(job, plan, {autoBindLocal: false});
  let assetManifest = bundle.assetManifest;
  for (const slot of ensureArray(bundle.assetPlan.slots)) {
    const existing = assetManifest.items.find((item) => item.slotId === slot.id);
    if (existing?.locked && !options.force) continue;
    const result = await generateFreshAssetForSlot(job, slot.id, {
      force: options.force,
      status: options.status || "suggested",
      locked: existing?.locked,
      provider: options.provider,
      model: options.model,
      quality: options.quality,
    });
    assetManifest = result.assetManifest;
  }
  pushLog(job, "assets: fresh generation completed");
  persistJobSnapshot(job, "Fresh assets generated");
  broadcastSnapshot(job);
  return {assetPlan: bundle.assetPlan, assetManifest};
}

function copyAssetIntoJob(job, slot, localAsset, options = {}) {
  const artifacts = ensureJobArtifactShape(job);
  const sourcePath = localAsset.absolutePath || path.resolve(WORKSPACE_ROOT, localAsset.path || "");
  const assetRoot = path.resolve(ASSET_IMAGE_ROOT);
  const resolved = path.resolve(sourcePath);
  if (resolved !== assetRoot && !resolved.startsWith(assetRoot + path.sep)) {
    throw new Error("Asset source must be inside assets/images");
  }
  if (!fs.existsSync(resolved)) {
    throw new Error("Asset source file not found");
  }

  fs.mkdirSync(artifacts.assetsDir, {recursive: true});
  fs.mkdirSync(artifacts.publicAssetsDir, {recursive: true});
  const fileName = normalizeAssetFileName(slot.id, resolved);
  const jobAssetPath = path.join(artifacts.assetsDir, fileName);
  const publicAssetPath = path.join(artifacts.publicAssetsDir, fileName);
  fs.copyFileSync(resolved, jobAssetPath);
  fs.copyFileSync(resolved, publicAssetPath);

  return {
    slotId: slot.id,
    label: slot.label,
    type: slot.type || "image",
    source: options.source || "local",
    sourcePath: relativeWorkspacePath(resolved),
    sourceName: path.basename(resolved),
    path: relativeWorkspacePath(jobAssetPath),
    url: toWorkspaceUrl(jobAssetPath),
    renderSrc: `/generated-jobs/${encodeURIComponent(job.id)}/assets/${encodeURIComponent(fileName)}`,
    status: options.status || "suggested",
    locked: Boolean(options.locked),
    prompt: slot.prompt || "",
    targetPath: slot.targetPath || "",
    usedInScenes: [slot.sceneId || slot.targetPath || slot.id].filter(Boolean),
    updatedAt: nowIso(),
  };
}

function ensureJobAssetPlan(job, plan = null, options = {}) {
  const artifacts = ensureJobArtifactShape(job);
  fs.mkdirSync(artifacts.assetsDir, {recursive: true});
  fs.mkdirSync(artifacts.publicAssetsDir, {recursive: true});

  const existingPlan = readJobAssetPlan(job);
  const assetPlan = existingPlan?.slots?.length ? existingPlan : buildAssetPlan(job, plan);
  safeWriteJson(artifacts.assetPlanPath, assetPlan);

  const manifest = readJobAssetManifest(job);
  const items = [...manifest.items];
  if (options.autoBindLocal === false) {
    return {assetPlan, assetManifest: manifest};
  }
  for (const slot of ensureArray(assetPlan.slots)) {
    const current = items.find((item) => item.slotId === slot.id);
    if (current?.locked || (current?.path && fs.existsSync(path.resolve(WORKSPACE_ROOT, current.path)))) {
      continue;
    }
    const localAsset = pickLocalAssetForSlot(slot);
    if (!localAsset) continue;
    const nextItem = copyAssetIntoJob(job, slot, localAsset, {status: "suggested", locked: false});
    const index = items.findIndex((item) => item.slotId === slot.id);
    if (index === -1) items.push(nextItem);
    else items[index] = {...items[index], ...nextItem, locked: Boolean(items[index].locked)};
  }

  const nextManifest = writeJobAssetManifest(job, {items});
  return {assetPlan, assetManifest: nextManifest};
}

function findAssetSlot(assetPlan, slotId) {
  return ensureArray(assetPlan?.slots).find((slot) => slot.id === slotId) || null;
}

function bindLocalAssetToJob(job, slotId, sourcePath, options = {}) {
  const bundle = ensureJobAssetPlan(job);
  const slot = findAssetSlot(bundle.assetPlan, slotId);
  if (!slot) throw new Error("Asset slot not found");
  const existing = bundle.assetManifest.items.find((item) => item.slotId === slotId);
  if (existing?.locked && !options.force) {
    throw new Error("Asset slot is locked");
  }
  const sourceRelative = String(sourcePath || "").replace(/^\/workspace\//, "");
  const absolutePath = path.resolve(WORKSPACE_ROOT, sourceRelative);
  const item = copyAssetIntoJob(
    job,
    slot,
    {absolutePath, path: sourceRelative, name: path.basename(sourceRelative), kind: classifyAsset(path.basename(sourceRelative))},
    {source: "local", status: options.status || "approved", locked: Boolean(options.locked ?? existing?.locked)},
  );
  const items = bundle.assetManifest.items.filter((entry) => entry.slotId !== slotId);
  items.push(item);
  const assetManifest = writeJobAssetManifest(job, {items});
  pushLog(job, `assets: bound ${slot.label} -> ${item.sourceName}`);
  persistJobSnapshot(job, "Asset bound");
  broadcastSnapshot(job);
  return {assetPlan: bundle.assetPlan, assetManifest};
}

function updateJobAssetSlot(job, slotId, patch = {}) {
  const bundle = ensureJobAssetPlan(job);
  const slot = findAssetSlot(bundle.assetPlan, slotId);
  if (!slot) throw new Error("Asset slot not found");
  const items = bundle.assetManifest.items.map((item) =>
    item.slotId === slotId
      ? {
          ...item,
          status: patch.status || item.status || "suggested",
          locked: Object.prototype.hasOwnProperty.call(patch, "locked") ? Boolean(patch.locked) : Boolean(item.locked),
          updatedAt: nowIso(),
        }
      : item,
  );
  const assetManifest = writeJobAssetManifest(job, {items});
  pushLog(job, `assets: updated ${slot.label}`);
  persistJobSnapshot(job, "Asset slot updated");
  broadcastSnapshot(job);
  return {assetPlan: bundle.assetPlan, assetManifest};
}

function resetUnlockedJobAssets(job) {
  const manifest = readJobAssetManifest(job);
  const lockedItems = ensureArray(manifest.items).filter((item) => item.locked);
  const assetManifest = writeJobAssetManifest(job, {items: lockedItems});
  pushLog(job, "assets: reset unlocked assets before image model generation");
  return assetManifest;
}

function setObjectPath(target, pathLabel, value) {
  const parts = String(pathLabel || "").split(".").filter(Boolean);
  if (!parts.length) return;
  let node = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = /^\d+$/.test(parts[index]) ? Number(parts[index]) : parts[index];
    if (node[key] === undefined || node[key] === null) {
      node[key] = /^\d+$/.test(parts[index + 1]) ? [] : {};
    }
    node = node[key];
  }
  const leaf = parts[parts.length - 1];
  node[/^\d+$/.test(leaf) ? Number(leaf) : leaf] = value;
}

function applyAssetManifestToPlan(job, plan, assetManifest = readJobAssetManifest(job)) {
  const nextPlan = JSON.parse(JSON.stringify(plan || {}));
  ensureArray(assetManifest.items).forEach((item) => {
    if (!item?.targetPath || !item.renderSrc) return;
    setObjectPath(nextPlan, item.targetPath, item.renderSrc);
  });
  nextPlan.assets = {
    manifestVersion: assetManifest.version || "asset-manifest-v1",
    updatedAt: assetManifest.updatedAt || "",
    items: ensureArray(assetManifest.items).map((item) => ({
      slotId: item.slotId,
      label: item.label,
      source: item.source,
      status: item.status,
      locked: Boolean(item.locked),
      renderSrc: item.renderSrc,
      targetPath: item.targetPath,
    })),
  };
  return nextPlan;
}

function validateJobAssetsForRender(job) {
  const bundle = ensureJobAssetPlan(job, safeReadJson(ensureJobArtifactShape(job).planPath));
  const manifestBySlot = new Map(ensureArray(bundle.assetManifest.items).map((item) => [item.slotId, item]));
  const missing = ensureArray(bundle.assetPlan.slots).filter((slot) => {
    if (!slot.required) return false;
    const item = manifestBySlot.get(slot.id);
    return !item?.path || !fs.existsSync(path.resolve(WORKSPACE_ROOT, item.path));
  });
  if (missing.length) {
    throw new Error(`Required assets are missing: ${missing.map((slot) => slot.label).join(", ")}`);
  }
  return bundle;
}

function buildAssetStatus(job) {
  const assetPlan = readJobAssetPlan(job);
  const assetManifest = readJobAssetManifest(job);
  const slots = ensureArray(assetPlan?.slots);
  const items = ensureArray(assetManifest.items);
  const bound = items.filter((item) => item.path && fs.existsSync(path.resolve(WORKSPACE_ROOT, item.path))).length;
  const required = slots.filter((slot) => slot.required).length;
  const missingRequired = slots.filter((slot) => {
    if (!slot.required) return false;
    const item = items.find((entry) => entry.slotId === slot.id);
    return !item?.path || !fs.existsSync(path.resolve(WORKSPACE_ROOT, item.path));
  }).length;
  return {
    slotCount: slots.length,
    boundCount: bound,
    requiredCount: required,
    missingRequiredCount: missingRequired,
    lockedCount: items.filter((item) => item.locked).length,
  };
}

function buildJobAssetPayload(job) {
  const bundle = ensureJobAssetPlan(job, safeReadJson(ensureJobArtifactShape(job).planPath));
  return {
    assetPlan: bundle.assetPlan,
    assetManifest: bundle.assetManifest,
    assetStatus: buildAssetStatus(job),
    localAssets: listAssets(),
  };
}

function extractJobErrorMessage(job) {
  const logs = ensureArray(job.logs).slice().reverse();
  const line =
    logs.find((item) => /pipeline error:/i.test(String(item || ""))) ||
    logs.find((item) => /(error|failed|失败)/i.test(String(item || ""))) ||
    "";
  const text = String(line || job.preview?.subtitle || "").replace(/^.*pipeline error:\s*/i, "").trim();
  if (!text || text === "undefined") return "";
  return text.slice(0, 360);
}

function persistJobSnapshot(job, message = "") {
  const artifacts = ensureJobArtifactShape(job);
  safeWriteJson(path.join(artifacts.workspaceDir, "console-job.json"), publicEntitySnapshot(job));
  safeWriteJson(path.join(artifacts.workspaceDir, "status.json"), {
    id: job.id,
    status: job.status,
    progress: Number(job.preview?.progress || 0),
    message: message || job.preview?.subtitle || "",
    updated_at: job.updatedAt,
    output_dir: job.outputDir,
    plan_source: job.planSource || "",
    plan_fallback_reason: job.planFallbackReason || "",
    archived: Boolean(job.archived),
    archived_at: job.archivedAt || "",
    artifacts: {
      plan: fs.existsSync(artifacts.planPath) ? relativeWorkspacePath(artifacts.planPath) : null,
      subtitles: fs.existsSync(artifacts.subtitlesPath) ? relativeWorkspacePath(artifacts.subtitlesPath) : null,
      audio: fs.existsSync(artifacts.publicVoiceoverPath) ? relativeWorkspacePath(artifacts.publicVoiceoverPath) : null,
      asset_plan: fs.existsSync(artifacts.assetPlanPath) ? relativeWorkspacePath(artifacts.assetPlanPath) : null,
      asset_manifest: fs.existsSync(artifacts.assetManifestPath) ? relativeWorkspacePath(artifacts.assetManifestPath) : null,
      viral_breakdown: fs.existsSync(artifacts.viralBreakdownPath) ? relativeWorkspacePath(artifacts.viralBreakdownPath) : null,
      module_match_report: fs.existsSync(artifacts.moduleMatchReportPath) ? relativeWorkspacePath(artifacts.moduleMatchReportPath) : null,
      replication_plan: fs.existsSync(artifacts.replicationPlanPath) ? relativeWorkspacePath(artifacts.replicationPlanPath) : null,
      compile_report: fs.existsSync(artifacts.compileReportPath) ? relativeWorkspacePath(artifacts.compileReportPath) : null,
      poster: fs.existsSync(artifacts.posterPath) ? relativeWorkspacePath(artifacts.posterPath) : null,
      video: fs.existsSync(artifacts.outputVideoPath) ? relativeWorkspacePath(artifacts.outputVideoPath) : null,
    },
  });
}

function listAccounts() {
  if (accountCache) return [...accountCache];
  const fromDisk = safeReadJson(ACCOUNT_FILE);
  accountCache = Array.isArray(fromDisk) && fromDisk.length ? fromDisk : [...defaultAccounts];
  if (!Array.isArray(fromDisk) || !fromDisk.length) {
    safeWriteJson(ACCOUNT_FILE, accountCache);
  }
  return [...accountCache];
}

function saveAccounts(items) {
  accountCache = [...items];
  safeWriteJson(ACCOUNT_FILE, accountCache);
}

function getAccount(accountId) {
  return listAccounts().find((account) => account.id === accountId) || null;
}

function getInstructionPresets() {
  return [...instructionPresets];
}

function getTemplateCatalogEntry(templateId) {
  return templateCatalog[templateId] || null;
}

function buildAccountPayload(input = {}, existing = null) {
  const name = String(input.name || "").trim();
  if (!name) {
    throw new Error("Account name is required");
  }

  const templateId = String(input.defaultTemplateId || "new_signals");
  const template = getTemplateCatalogEntry(templateId) || getTemplateCatalogEntry("new_signals") || null;
  const archived = Boolean(input.archived ?? existing?.archived);
  const archivedAt = archived ? existing?.archivedAt || nowIso() : "";
  return {
    id: existing?.id || sanitizeId(input.id || name, "account"),
    name,
    platform: String(input.platform || "xiaohongshu"),
    persona: String(input.persona || "内容账号").trim(),
    toneTags: ensureStringList(input.toneTags),
    defaultTemplateId: templateId,
    defaultCompositionId: String(input.defaultCompositionId || template?.compositionId || ""),
    defaultDurationSec: Number(input.defaultDurationSec || template?.defaultDurationSec || 60),
    aspectRatio: String(input.aspectRatio || template?.aspectRatio || "9:16"),
    ctaStyle: String(input.ctaStyle || "行动建议型").trim(),
    constraints: ensureStringList(input.constraints),
    subtitleStyle: String(input.subtitleStyle || "标准字幕").trim(),
    voiceProfile: String(input.voiceProfile || "default").trim(),
    archived,
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso(),
    archivedAt,
  };
}

function createAccount(input = {}) {
  const account = buildAccountPayload(input);
  const accounts = listAccounts();
  if (accounts.some((item) => item.id === account.id)) {
    account.id = `${account.id}-${Date.now()}`;
  }
  const nextAccounts = [...accounts, account];
  saveAccounts(nextAccounts);
  return account;
}

function updateAccount(accountId, input = {}) {
  const accounts = listAccounts();
  const index = accounts.findIndex((account) => account.id === accountId);
  if (index === -1) {
    throw new Error("Account not found");
  }
  const nextAccount = buildAccountPayload({...accounts[index], ...input}, accounts[index]);
  accounts[index] = nextAccount;
  saveAccounts(accounts);
  return nextAccount;
}

function setAccountArchived(accountId, archived = true) {
  return updateAccount(accountId, {archived: Boolean(archived)});
}

function deleteAccount(accountId) {
  const accounts = listAccounts();
  const index = accounts.findIndex((account) => account.id === accountId);
  if (index === -1) {
    throw new Error("Account not found");
  }
  const [deleted] = accounts.splice(index, 1);
  saveAccounts(accounts);
  return deleted;
}

function defaultCampaigns() {
  return [
    {
      id: "workspace-default",
      name: "默认项目",
      objective: "常规视频生产",
      status: "active",
      owner: "workspace",
      tags: ["default"],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      archived: false,
      archivedAt: "",
    },
  ];
}

function listCampaigns() {
  if (campaignCache) return [...campaignCache];
  const fromDisk = safeReadJson(CAMPAIGN_FILE);
  campaignCache = Array.isArray(fromDisk) && fromDisk.length ? fromDisk : defaultCampaigns();
  if (!Array.isArray(fromDisk) || !fromDisk.length) {
    safeWriteJson(CAMPAIGN_FILE, campaignCache);
  }
  return [...campaignCache];
}

function saveCampaigns(items) {
  campaignCache = [...items];
  safeWriteJson(CAMPAIGN_FILE, campaignCache);
}

function buildCampaignPayload(input = {}, existing = null) {
  const name = String(input.name || "").trim();
  if (!name) throw new Error("Campaign name is required");
  const archived = Boolean(input.archived ?? existing?.archived);
  return {
    id: existing?.id || sanitizeId(input.id || name, "campaign"),
    name,
    objective: String(input.objective || existing?.objective || "视频生产").trim(),
    status: archived ? "archived" : String(input.status || existing?.status || "active"),
    owner: String(input.owner || existing?.owner || "workspace").trim(),
    tags: ensureStringList(input.tags ?? existing?.tags),
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso(),
    archived,
    archivedAt: archived ? existing?.archivedAt || nowIso() : "",
  };
}

function createCampaign(input = {}) {
  const campaign = buildCampaignPayload(input);
  const campaigns = listCampaigns();
  if (campaigns.some((item) => item.id === campaign.id)) {
    campaign.id = `${campaign.id}-${Date.now()}`;
  }
  saveCampaigns([...campaigns, campaign]);
  appendAuditEvent("campaign.created", "campaign", campaign.id, {name: campaign.name});
  return campaign;
}

function updateCampaign(campaignId, input = {}) {
  const campaigns = listCampaigns();
  const index = campaigns.findIndex((campaign) => campaign.id === campaignId);
  if (index === -1) throw new Error("Campaign not found");
  const nextCampaign = buildCampaignPayload({...campaigns[index], ...input}, campaigns[index]);
  campaigns[index] = nextCampaign;
  saveCampaigns(campaigns);
  appendAuditEvent("campaign.updated", "campaign", nextCampaign.id, {name: nextCampaign.name});
  return nextCampaign;
}

function setCampaignArchived(campaignId, archived = true) {
  const campaign = updateCampaign(campaignId, {archived: Boolean(archived), status: archived ? "archived" : "active"});
  appendAuditEvent(archived ? "campaign.archived" : "campaign.restored", "campaign", campaign.id, {name: campaign.name});
  return campaign;
}

function deleteCampaign(campaignId) {
  const campaigns = listCampaigns();
  const index = campaigns.findIndex((campaign) => campaign.id === campaignId);
  if (index === -1) throw new Error("Campaign not found");
  const [deleted] = campaigns.splice(index, 1);
  saveCampaigns(campaigns);
  appendAuditEvent("campaign.deleted", "campaign", deleted.id, {name: deleted.name});
  return deleted;
}

function defaultActivities() {
  const project = listCampaigns().find((campaign) => !campaign.archived) || listCampaigns()[0] || null;
  return [
    {
      id: "activity-default",
      projectId: project?.id || "workspace-default",
      name: "默认活动",
      objective: "常规选题生产",
      status: "active",
      tags: ["default"],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      archived: false,
      archivedAt: "",
    },
  ];
}

function listActivities() {
  if (activityCache) return [...activityCache];
  const fromDisk = safeReadJson(ACTIVITY_FILE);
  activityCache = Array.isArray(fromDisk) && fromDisk.length ? fromDisk : defaultActivities();
  if (!Array.isArray(fromDisk) || !fromDisk.length) {
    safeWriteJson(ACTIVITY_FILE, activityCache);
  }
  return [...activityCache];
}

function saveActivities(items) {
  activityCache = [...items];
  safeWriteJson(ACTIVITY_FILE, activityCache);
}

function buildActivityPayload(input = {}, existing = null) {
  const name = String(input.name || "").trim();
  if (!name) throw new Error("Activity name is required");
  const projectId = String(input.projectId || existing?.projectId || "").trim();
  if (!projectId) throw new Error("Activity projectId is required");
  const archived = Boolean(input.archived ?? existing?.archived);
  return {
    id: existing?.id || sanitizeId(input.id || `${projectId}-${name}`, "activity"),
    projectId,
    name,
    objective: String(input.objective || existing?.objective || "选题生产").trim(),
    status: archived ? "archived" : String(input.status || existing?.status || "active"),
    tags: ensureStringList(input.tags ?? existing?.tags),
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso(),
    archived,
    archivedAt: archived ? existing?.archivedAt || nowIso() : "",
  };
}

function createActivity(input = {}) {
  const activity = buildActivityPayload(input);
  const activities = listActivities();
  if (activities.some((item) => item.id === activity.id)) {
    activity.id = `${activity.id}-${Date.now()}`;
  }
  saveActivities([...activities, activity]);
  appendAuditEvent("activity.created", "activity", activity.id, {name: activity.name, projectId: activity.projectId});
  return activity;
}

function updateActivity(activityId, input = {}) {
  const activities = listActivities();
  const index = activities.findIndex((activity) => activity.id === activityId);
  if (index === -1) throw new Error("Activity not found");
  const nextActivity = buildActivityPayload({...activities[index], ...input}, activities[index]);
  activities[index] = nextActivity;
  saveActivities(activities);
  appendAuditEvent("activity.updated", "activity", nextActivity.id, {name: nextActivity.name, projectId: nextActivity.projectId});
  return nextActivity;
}

function setActivityArchived(activityId, archived = true) {
  const activity = updateActivity(activityId, {archived: Boolean(archived), status: archived ? "archived" : "active"});
  appendAuditEvent(archived ? "activity.archived" : "activity.restored", "activity", activity.id, {name: activity.name});
  return activity;
}

function listTopicPool() {
  if (topicPoolCache) return [...topicPoolCache];
  const fromDisk = safeReadJson(TOPIC_POOL_FILE);
  topicPoolCache = Array.isArray(fromDisk) ? fromDisk : [];
  if (!Array.isArray(fromDisk)) {
    safeWriteJson(TOPIC_POOL_FILE, topicPoolCache);
  }
  return [...topicPoolCache];
}

function saveTopicPool(items) {
  topicPoolCache = [...items];
  safeWriteJson(TOPIC_POOL_FILE, topicPoolCache);
}

function buildTopicPayload(input = {}, existing = null) {
  const title = String(input.title || input.topic || "").trim();
  if (!title) throw new Error("Topic title is required");
  const projectId = String(input.projectId || existing?.projectId || "").trim();
  if (!projectId) throw new Error("Topic projectId is required");
  const activityId = String(input.activityId || existing?.activityId || "").trim();
  return {
    id: existing?.id || sanitizeId(input.id || `${projectId}-${activityId}-${title}`, "topic"),
    projectId,
    activityId,
    title,
    brief: String(input.brief || existing?.brief || "").trim(),
    status: String(input.status || existing?.status || "idea"),
    priority: String(input.priority || existing?.priority || "normal"),
    accountIds: ensureStringList(input.accountIds ?? existing?.accountIds),
    batchId: String(input.batchId || existing?.batchId || ""),
    tags: ensureStringList(input.tags ?? existing?.tags),
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso(),
    archived: Boolean(input.archived ?? existing?.archived),
  };
}

function createTopic(input = {}) {
  const topic = buildTopicPayload(input);
  const topics = listTopicPool();
  if (topics.some((item) => item.id === topic.id)) {
    topic.id = `${topic.id}-${Date.now()}`;
  }
  saveTopicPool([topic, ...topics]);
  appendAuditEvent("topic.created", "topic", topic.id, {title: topic.title, projectId: topic.projectId, activityId: topic.activityId});
  return topic;
}

function updateTopic(topicId, input = {}) {
  const topics = listTopicPool();
  const index = topics.findIndex((topic) => topic.id === topicId);
  if (index === -1) throw new Error("Topic not found");
  const nextTopic = buildTopicPayload({...topics[index], ...input}, topics[index]);
  topics[index] = nextTopic;
  saveTopicPool(topics);
  appendAuditEvent("topic.updated", "topic", nextTopic.id, {title: nextTopic.title});
  return nextTopic;
}

function filterTopics(params = new URLSearchParams()) {
  const projectId = String(params.get("projectId") || "").trim();
  const activityId = String(params.get("activityId") || "").trim();
  const status = String(params.get("status") || "all").trim();
  const query = String(params.get("q") || "").trim().toLowerCase();
  return listTopicPool()
    .filter((topic) => !topic.archived)
    .filter((topic) => !projectId || topic.projectId === projectId)
    .filter((topic) => !activityId || topic.activityId === activityId)
    .filter((topic) => status === "all" || topic.status === status)
    .filter((topic) => !query || `${topic.title} ${topic.brief}`.toLowerCase().includes(query))
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
}

function listBatches() {
  if (batchCache) return [...batchCache];
  const fromDisk = safeReadJson(BATCH_FILE);
  batchCache = Array.isArray(fromDisk) ? fromDisk : [];
  if (!Array.isArray(fromDisk)) {
    safeWriteJson(BATCH_FILE, batchCache);
  }
  return [...batchCache];
}

function saveBatches(items) {
  batchCache = [...items];
  safeWriteJson(BATCH_FILE, batchCache);
}

function listAuditEvents(limit = 80) {
  if (!auditCache) {
    const fromDisk = safeReadJson(AUDIT_FILE);
    auditCache = Array.isArray(fromDisk) ? fromDisk : [];
  }
  return [...auditCache]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, Math.max(1, Math.min(Number(limit || 80), 300)));
}

function appendAuditEvent(action, entityType, entityId, metadata = {}) {
  if (!auditCache) {
    const fromDisk = safeReadJson(AUDIT_FILE);
    auditCache = Array.isArray(fromDisk) ? fromDisk : [];
  }
  const event = {
    id: `audit_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: nowIso(),
    actor: "local",
  };
  auditCache = [event, ...auditCache].slice(0, 1000);
  safeWriteJson(AUDIT_FILE, auditCache);
  return event;
}

function slugFromPrompt(prompt) {
  const compact = String(prompt || "")
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, "video")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return compact.slice(0, 32) || "video";
}

function chooseTemplate(prompt) {
  const text = String(prompt || "");
  if (/漫画|comic|剧情|情绪/.test(text)) return "comic_habit_spiral";
  if (/心理|mind|方法|habit/.test(text)) return "minimal_psych_explainer";
  if (/科技|archive|资料|AI/.test(text)) return "tech_archive_explainer";
  return "new_signals";
}

function platformLabel(platform) {
  const map = {
    xiaohongshu: "小红书",
    douyin: "抖音",
    bilibili: "B站",
    youtube: "YouTube",
  };
  return map[platform] || platform || "-";
}

function normalizeJobConfig(input = {}, prompt = "") {
  const accounts = listAccounts();
  const account = getAccount(input.accountId) || accounts[0] || null;
  const requestedTemplateId = String(input.templateId || "").trim();
  const accountDefaultTemplateId = String(account?.defaultTemplateId || "").trim();
  const templateId =
    (requestedTemplateId && getTemplateCatalogEntry(requestedTemplateId) && requestedTemplateId) ||
    (accountDefaultTemplateId && getTemplateCatalogEntry(accountDefaultTemplateId) && accountDefaultTemplateId) ||
    chooseTemplate(prompt) ||
    "new_signals";
  const template = getTemplateCatalogEntry(templateId) || getTemplateCatalogEntry("new_signals") || null;
  const presetIds = new Set(getInstructionPresets().map((preset) => preset.id));
  const localConfig = safeReadJson(LOCAL_CONFIG_FILE) || {};
  return {
    accountId: account?.id || "",
    templateId,
    compositionId: input.compositionId || template?.compositionId || account?.defaultCompositionId || "",
    templateLocked: Boolean(input.templateLocked),
    activePresetIds: ensureArray(input.activePresetIds).filter((presetId) => presetIds.has(presetId)),
    openInstruction: String(input.openInstruction || "").trim(),
    instructionScope: input.instructionScope === "session" ? "session" : "run",
    durationSec: Number(input.durationSec || account?.defaultDurationSec || template?.defaultDurationSec || 60),
    aspectRatio: input.aspectRatio || account?.aspectRatio || template?.aspectRatio || "9:16",
    subtitleFontSize: normalizeSubtitleFontSize(input.subtitleFontSize || localConfig.SUBTITLE_FONT_SIZE, 28),
    subtitleColor: normalizeSubtitleColor(input.subtitleColor || localConfig.SUBTITLE_COLOR, "#ffffff"),
    useAiImageAssets: Boolean(input.useAiImageAssets || localConfig.USE_AI_IMAGE_ASSETS),
    imageAssetModel: normalizeImageAssetModel(input.imageAssetModel || localConfig.IMAGE_ASSET_MODEL),
  };
}

function buildScriptSections(prompt, config = {}) {
  const text = String(prompt || "");
  const account = getAccount(config.accountId);
  const template = getTemplateCatalogEntry(config.templateId);
  const presetText = ensureArray(config.activePresetIds)
    .map((presetId) => getInstructionPresets().find((preset) => preset.id === presetId)?.label)
    .filter(Boolean)
    .join(" / ");
  return [
    account
      ? {
          label: "Account",
          text: `${account.name} / ${account.persona}`,
        }
      : null,
    template
      ? {
          label: "Template",
          text: `${template.title} / ${template.compositionId}`,
        }
      : null,
    presetText || config.openInstruction
      ? {
          label: "Instructions",
          text: [presetText, config.openInstruction].filter(Boolean).join(" / "),
        }
      : null,
    {
      label: "Hook",
      text: /假突破/.test(text)
        ? "很多假突破不是信号失败，而是你进场太早。"
        : "前三秒先给结论，再决定观众值不值得继续看。",
    },
    {
      label: "Body",
      text: /交易/.test(text)
        ? "先看突破后的回踩，再看成交量是否放大。"
        : "中段只保留一条核心机制，把注意力收束到最关键的判断上。",
    },
    {
      label: "Close",
      text: "结尾保留一个明确动作，让观众知道下一步该看什么、做什么。",
    },
  ].filter(Boolean);
}

function applyJobConfig(job, input = {}) {
  const config = normalizeJobConfig(
    {
      accountId: job.accountId,
      templateId: job.templateId,
      compositionId: job.compositionId,
      templateLocked: job.templateLocked,
      activePresetIds: job.activePresetIds,
      openInstruction: job.openInstruction,
      instructionScope: job.instructionScope,
      durationSec: job.durationSec,
      aspectRatio: job.aspectRatio,
      subtitleFontSize: job.subtitleFontSize,
      subtitleColor: job.subtitleColor,
      ...input,
    },
    job.prompt,
  );

  const account = getAccount(config.accountId);
  const template = getTemplateCatalogEntry(config.templateId);

  job.accountId = config.accountId;
  job.templateId = config.templateId;
  job.compositionId = config.compositionId;
  job.templateLocked = config.templateLocked;
  job.activePresetIds = config.activePresetIds;
  job.openInstruction = config.openInstruction;
  job.instructionScope = config.instructionScope;
  job.durationSec = config.durationSec;
  job.aspectRatio = config.aspectRatio;
  job.subtitleFontSize = normalizeSubtitleFontSize(config.subtitleFontSize, 28);
  job.subtitleColor = normalizeSubtitleColor(config.subtitleColor, "#ffffff");
  job.useAiImageAssets = Boolean(config.useAiImageAssets);
  job.imageAssetModel = normalizeImageAssetModel(config.imageAssetModel);
  job.scriptSections = buildScriptSections(job.prompt, config);

  if (job.preview) {
    job.preview.episodeLabel =
      account && template ? `${account.name} / ${template.title}` : job.preview.episodeLabel || "Codex Video Console";
    job.preview.summary =
      account && template
        ? `${account.persona} · ${platformLabel(account.platform)} · ${config.durationSec}s · ${config.aspectRatio}`
        : job.preview.summary;
  }

  return job;
}

function makeVideoSteps(stageIndex = 0) {
  const definitions = [
    {
      title: "解析视频需求",
      detail: "提取平台、时长、比例、主题、语气和模板候选。",
    },
    {
      title: "生成 video_plan.json",
      detail: "Codex 基于本地模板和素材目录生成结构化任务计划。",
    },
    {
      title: "生成口播与字幕",
      detail: "拆出 Hook、主体、转场、结尾，并保留字幕高亮字段。",
    },
    {
      title: "生成 TTS 与时间轴",
      detail: "调用本地配音脚本，写入音频和 word timestamps。",
    },
    {
      title: "绑定 Remotion Composition",
      detail: "把计划和字幕注入现有竖屏模板，准备本地渲染。",
    },
    {
      title: "渲染 MP4",
      detail: "执行 Remotion 渲染并把产物写入 data/jobs。",
    },
  ];

  return definitions.map((step, index) => {
    let status = "waiting";
    if (stageIndex > 0 && index < stageIndex) status = "done";
    if (stageIndex > 0 && index === stageIndex) status = "running";
    return {...step, status};
  });
}

function defaultPreview(title = "等待输入视频需求") {
  return {
    statusText: "Idle",
    episodeLabel: "New / Empty Thread",
    headline: title,
    summary: "左侧不会再预填对话。你可以直接发起新消息，或者先绑定一个本地 session。",
    subtitle: "选择本地 session 或直接发送第一条消息",
    progress: 0,
    imageUrl: "/workspace/assets/images/scenario_video_breakdown.jpg",
  };
}

function makeViralReplicationSteps(stageIndex = 0) {
  const definitions = [
    {
      title: "准备参考分析",
      detail: "读取已有 analysis.json / summary.json，并写入当前复刻任务目录。",
    },
    {
      title: "生成 viral_breakdown.json",
      detail: "把参考视频拆解为 Hook、分段、节奏、字幕、音频和可复刻结构。",
    },
    {
      title: "匹配本地模板模块",
      detail: "用 data/module_registry.json 规则打分，生成 module_match_report.json。",
    },
    {
      title: "生成 replication_plan.json",
      detail: "确定目标模板、风格、复刻强度、版权边界和 sceneMapping。",
    },
    {
      title: "编译预览渲染参数",
      detail: "输出 video_plan.json、asset_plan.json、render-props.json 和 compile_report.json。",
    },
    {
      title: "文案变体重写",
      detail: "生成并应用 copy_rewrite.<variant>.json，输出改写后的视频计划和口播单元。",
    },
    {
      title: "生成画面素材",
      detail: "按素材 Provider 顺序生成图片，优先使用 config.local.json 中的 local_api。",
    },
    {
      title: "生成配音与字幕",
      detail: "输出 voiceover_package、音频/字幕对齐和配音版 render props。",
    },
    {
      title: "渲染最终 MP4",
      detail: "合并素材和配音参数，调用 Remotion 输出成片和 render_package。",
    },
  ];

  return definitions.map((step, index) => {
    let status = "waiting";
    if (stageIndex > 0 && index < stageIndex) status = "done";
    if (stageIndex > 0 && index === stageIndex) status = "running";
    return {...step, status};
  });
}

function createRuntimeJob(prompt, configInput = {}) {
  const jobType = configInput.type === "viral_replication" ? "viral_replication" : "video_generation";
  const replicationInput = configInput.replication && typeof configInput.replication === "object" ? configInput.replication : {};
  const initialConfig = normalizeJobConfig(
    {
      ...configInput,
      templateId: configInput.templateId || chooseTemplate(prompt),
    },
    prompt,
  );
  const topicTitle = inferPrimaryTopic(prompt);
  const id = `job_ui_${Date.now()}_${slugFromPrompt(prompt)}`;
  const title = /假突破/.test(prompt) ? "假突破交易教育短视频" : topicTitle || String(prompt || "").slice(0, 22) || "新建视频任务";
  const job = {
    id,
    type: jobType,
    source: "runtime",
    title,
    prompt,
    topicTitle,
    templateId: initialConfig.templateId,
    compositionId: initialConfig.compositionId,
    renderCompositionId: "",
    aspectRatio: initialConfig.aspectRatio,
    durationSec: initialConfig.durationSec,
    subtitleFontSize: normalizeSubtitleFontSize(initialConfig.subtitleFontSize, 28),
    subtitleColor: normalizeSubtitleColor(initialConfig.subtitleColor, "#ffffff"),
    accountId: initialConfig.accountId,
    templateLocked: initialConfig.templateLocked,
    activePresetIds: initialConfig.activePresetIds,
    openInstruction: initialConfig.openInstruction,
    instructionScope: initialConfig.instructionScope,
    useAiImageAssets: Boolean(initialConfig.useAiImageAssets),
    imageAssetModel: normalizeImageAssetModel(initialConfig.imageAssetModel) || getImageApiConfig().model,
    replication:
      jobType === "viral_replication"
        ? {
            sourceId: String(replicationInput.sourceId || configInput.sourceId || "").trim(),
            analysisPath: String(replicationInput.analysisPath || configInput.analysisPath || "").trim(),
            summaryPath: String(replicationInput.summaryPath || configInput.summaryPath || "").trim(),
            targetTopic: String(replicationInput.targetTopic || configInput.targetTopic || prompt || "").trim(),
            strength: ["low", "medium", "high"].includes(replicationInput.strength) ? replicationInput.strength : "medium",
            templateId: String(replicationInput.templateId || initialConfig.templateId || "auto").trim() || "auto",
            styleVariant: String(replicationInput.styleVariant || "auto").trim() || "auto",
            copyVariant: normalizeCopyRewriteVariant(replicationInput.copyVariant || replicationInput.rewriteVariant || "sharp_contrarian"),
            deliveryMode: String(replicationInput.deliveryMode || "draft").trim() || "draft",
            providerOrder: ensureArray(replicationInput.providerOrder).length
              ? ensureArray(replicationInput.providerOrder)
              : ["local_asset", "local_api", "openai_image", "svg_fallback"],
          }
        : null,
    outputDir: `data/jobs/${id}`,
    status: "planning",
    updatedAt: nowIso(),
    stageIndex: 1,
    pipelineRunning: false,
    lastPipelineAction: "",
    failedAction: "",
    codexSessionId: null,
    messages: [],
    pendingAssistantText: "",
    codexRunning: false,
    steps: jobType === "viral_replication" ? makeViralReplicationSteps(0) : makeVideoSteps(1),
    logs: [
      `[${nowIso()}] system: workspace ${WORKSPACE_ROOT}`,
      `[${nowIso()}] codex: new thread created`,
      `[${nowIso()}] codex: template candidate ${initialConfig.templateId}`,
    ],
    preview: {
      ...defaultPreview(title),
      statusText: "Draft",
      episodeLabel: "New / Codex Thread",
      headline: /假突破/.test(prompt) ? "假突破最危险的地方" : title,
      summary: /假突破/.test(prompt)
        ? "不是亏损，而是它会让你连续追错方向。"
        : "Codex 会先结合本地模板、素材和 Remotion 结构组织第一轮回复。",
      subtitle: /假突破/.test(prompt)
        ? "先等回踩确认，再判断量能是否跟上"
        : "等待 Codex 返回第一轮规划",
      progress: 18,
      imageUrl: previewImages[Math.floor(Math.random() * previewImages.length)],
    },
    scriptSections: buildScriptSections(prompt, initialConfig),
    planSource: "",
    planFallbackReason: "",
    archived: false,
    archivedAt: "",
  };
  applyJobConfig(job, initialConfig);
  if (jobType === "viral_replication") {
    job.status = "draft";
    job.stageIndex = 0;
    job.renderCompositionId = "replicated-video-preview";
    job.steps = makeViralReplicationSteps(0);
    job.preview.statusText = "Replication Draft";
    job.preview.episodeLabel = "Viral Replication";
    job.preview.summary = "已创建爆款复刻任务，等待运行复刻 pipeline。";
    job.preview.subtitle = job.replication?.analysisPath
      ? `参考分析：${job.replication.analysisPath}`
      : "请先填写 analysis.json 路径。";
    job.preview.progress = 12;
  }
  ensureJobArtifactShape(job);
  runtimeJobs.set(job.id, job);
  return job;
}

function walkJsonlFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const output = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, {withFileTypes: true})) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        output.push(fullPath);
      }
    }
  }
  return output;
}

function extractSessionMeta(filePath) {
  const firstLine = safeReadText(filePath).split(/\r?\n/).find(Boolean);
  const parsed = safeParseJsonLine(firstLine);
  if (!parsed || parsed.type !== "session_meta" || !parsed.payload?.id) return null;
  return {
    id: parsed.payload.id,
    cwd: parsed.payload.cwd || "",
    timestamp: parsed.payload.timestamp || "",
    originator: parsed.payload.originator || "",
    cliVersion: parsed.payload.cli_version || "",
  };
}

function summarizeSessionMessages(filePath, limit = 10) {
  const messages = [];
  for (const entry of readJsonLines(filePath)) {
    if (entry.type !== "event_msg" || !entry.payload) continue;
    if (entry.payload.type === "user_message" && entry.payload.message) {
      const text = String(entry.payload.message).trim();
      if (!text || text.includes(SESSION_BOOTSTRAP_MARKER)) continue;
      messages.push({role: "user", meta: "You", text});
    }
    if (entry.payload.type === "agent_message" && entry.payload.message) {
      const text = String(entry.payload.message).trim();
      if (!text || text === SESSION_BOOTSTRAP_READY) continue;
      messages.push({role: "assistant", meta: "Codex", text});
    }
  }
  return messages.filter((item) => item.text).slice(-limit);
}

function extractSessionIdFromFilePath(filePath) {
  const name = path.basename(filePath || "");
  const match = name.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i);
  return match ? match[1] : "";
}

function compactSession(session) {
  return {
    id: session.id,
    threadName: session.threadName,
    updatedAt: session.updatedAt,
    cwd: session.cwd,
    archived: session.archived,
    previewText: session.previewText,
  };
}

function cacheSessionEntry(session) {
  if (!session?.id) return;
  sessionCatalogCache.set(session.id, {
    id: session.id,
    threadName: session.threadName,
    updatedAt: session.updatedAt,
    cwd: session.cwd || "",
    archived: Boolean(session.archived),
    filePath: session.filePath || "",
    previewText: session.previewText || "",
    metaVersion: session.metaVersion || "",
    previewVersion: session.previewVersion || "",
  });
  sessionCatalogState.cacheDirty = true;
}

function loadSessionPathIndex(options = {}) {
  const force = Boolean(options.force);
  const startedAt = Date.now();
  if (!force && sessionPathState.loadedAt && startedAt - sessionPathState.loadedAt < SESSION_PATH_CACHE_TTL_MS) {
    return sessionPathState;
  }

  sessionPathIndex.clear();
  for (const rootDir of [SESSION_ROOT, ARCHIVED_SESSION_ROOT]) {
    for (const filePath of walkJsonlFiles(rootDir)) {
      const sessionId = extractSessionIdFromFilePath(filePath);
      if (!sessionId) continue;
      const archived = filePath.startsWith(ARCHIVED_SESSION_ROOT);
      const existing = sessionPathIndex.get(sessionId);
      if (!existing || (existing.archived && !archived)) {
        sessionPathIndex.set(sessionId, {filePath, archived});
      }
    }
  }

  sessionPathState.loadedAt = Date.now();
  sessionPathState.scanMs = sessionPathState.loadedAt - startedAt;
  return sessionPathState;
}

function resolveSessionFilePath(sessionId) {
  const indexed = sessionPathIndex.get(sessionId);
  if (indexed?.filePath) return indexed;

  for (const rootDir of [SESSION_ROOT, ARCHIVED_SESSION_ROOT]) {
    for (const filePath of walkJsonlFiles(rootDir)) {
      if (!filePath.includes(sessionId)) continue;
      const entry = {
        filePath,
        archived: filePath.startsWith(ARCHIVED_SESSION_ROOT),
      };
      sessionPathIndex.set(sessionId, entry);
      return entry;
    }
  }
  return null;
}

function ensureSessionCatalogEntry(sessionId) {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) return null;

  const existing = sessionCatalog.get(normalizedSessionId);
  if (existing) return existing;

  const resolved = resolveSessionFilePath(normalizedSessionId);
  if (!resolved?.filePath) return null;

  const cached = sessionCatalogCache.get(normalizedSessionId) || {};
  const meta = extractSessionMeta(resolved.filePath) || {};
  let fileUpdatedAt = "";
  try {
    fileUpdatedAt = fs.statSync(resolved.filePath).mtime.toISOString();
  } catch {}

  const updatedAt = cached.updatedAt || meta.timestamp || fileUpdatedAt || nowIso();
  const session = {
    id: normalizedSessionId,
    threadName: cached.threadName || `Session ${normalizedSessionId.slice(0, 8)}`,
    updatedAt,
    cwd: cached.cwd || meta.cwd || "",
    archived: typeof resolved.archived === "boolean" ? resolved.archived : Boolean(cached.archived),
    filePath: resolved.filePath,
    previewText: String(cached.updatedAt || "") === String(updatedAt) ? cached.previewText || "" : "",
    metaVersion: meta.cwd ? updatedAt : cached.metaVersion || "",
    previewVersion: String(cached.updatedAt || "") === String(updatedAt) ? cached.previewVersion || "" : "",
  };

  sessionCatalog.set(session.id, session);
  cacheSessionEntry(session);
  return session;
}

function hydrateSessionEntry(session, options = {}) {
  if (!session) return false;
  let changed = false;

  if (!session.filePath) {
    const resolved = resolveSessionFilePath(session.id);
    if (resolved?.filePath) {
      session.filePath = resolved.filePath;
      session.archived = resolved.archived;
      changed = true;
    }
  }

  if (session.filePath && (!session.cwd || session.metaVersion !== session.updatedAt)) {
    const meta = extractSessionMeta(session.filePath);
    if (meta) {
      session.cwd = meta.cwd || session.cwd || "";
      session.archived = session.archived || session.filePath.startsWith(ARCHIVED_SESSION_ROOT);
      session.metaVersion = session.updatedAt;
      changed = true;
    }
  }

  if (options.includePreview && session.filePath && (!session.previewText || session.previewVersion !== session.updatedAt)) {
    const previewMessages = summarizeSessionMessages(session.filePath, 2);
    session.previewText = previewMessages[previewMessages.length - 1]?.text || "";
    session.previewVersion = session.updatedAt;
    changed = true;
  }

  if (changed) {
    cacheSessionEntry(session);
  }
  return changed;
}

function loadSessionCatalog(options = {}) {
  const force = Boolean(options.force);
  const startedAt = Date.now();
  if (!force && sessionCatalogState.loadedAt && startedAt - sessionCatalogState.loadedAt < SESSION_CACHE_TTL_MS) {
    return sessionCatalogState;
  }

  loadSessionCatalogCache();
  const pathState = loadSessionPathIndex({force});
  sessionCatalog.clear();
  const indexById = new Map();

  for (const entry of readJsonLines(SESSION_INDEX_FILE)) {
    if (!entry?.id) continue;
    const current = indexById.get(entry.id);
    if (!current || String(entry.updated_at || "") > String(current.updated_at || "")) {
      indexById.set(entry.id, entry);
    }
  }

  let cacheHits = 0;
  let workspaceCount = 0;
  for (const [sessionId, indexMeta] of indexById.entries()) {
    const cached = sessionCatalogCache.get(sessionId) || {};
    const pathEntry = sessionPathIndex.get(sessionId) || {};
    const updatedAt = indexMeta.updated_at || cached.updatedAt || nowIso();
    if (String(cached.updatedAt || "") === String(updatedAt)) {
      cacheHits += 1;
    }

    const session = {
      id: sessionId,
      threadName: indexMeta.thread_name || cached.threadName || `Session ${sessionId.slice(0, 8)}`,
      updatedAt,
      cwd: cached.cwd || "",
      archived: typeof pathEntry.archived === "boolean" ? pathEntry.archived : Boolean(cached.archived),
      filePath: pathEntry.filePath || cached.filePath || "",
      previewText: String(cached.updatedAt || "") === String(updatedAt) ? cached.previewText || "" : "",
      metaVersion: cached.metaVersion || "",
      previewVersion: String(cached.updatedAt || "") === String(updatedAt) ? cached.previewVersion || "" : "",
    };

    if (session.cwd === WORKSPACE_ROOT) {
      workspaceCount += 1;
    }
    sessionCatalog.set(session.id, session);
  }

  sessionCatalogState.loadedAt = Date.now();
  sessionCatalogState.scanMs = sessionCatalogState.loadedAt - startedAt;
  sessionCatalogState.pathScanMs = pathState.scanMs;
  sessionCatalogState.totalCount = sessionCatalog.size;
  sessionCatalogState.workspaceCount = workspaceCount;
  sessionCatalogState.cacheHits = cacheHits;
  sessionCatalogState.hydratedCount = 0;
  persistSessionCatalogCache();
  return sessionCatalogState;
}

function listSessions(options = {}) {
  const scope = options.scope === "all" ? "all" : "workspace";
  const cursor = Math.max(0, Number(options.cursor || 0));
  const limit = Math.max(1, Math.min(100, Number(options.limit || SESSION_PAGE_SIZE)));
  const query = String(options.query || "")
    .trim()
    .toLowerCase();

  const sorted = [...sessionCatalog.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const filtered = [];
  let hydratedCount = 0;

  for (const session of sorted) {
    if (scope !== "all") {
      if (!session.cwd && hydrateSessionEntry(session)) {
        hydratedCount += 1;
      }
      if (session.cwd !== WORKSPACE_ROOT) continue;
    }

    if (query) {
      const haystack = [session.threadName, session.id, session.previewText, session.cwd].join(" ").toLowerCase();
      if (!haystack.includes(query)) continue;
    }

    filtered.push(compactSession(session));
  }

  if (hydratedCount) {
    sessionCatalogState.workspaceCount = scope === "workspace" ? filtered.length : sessionCatalogState.workspaceCount;
    sessionCatalogState.hydratedCount += hydratedCount;
    persistSessionCatalogCache();
  }

  const items = filtered.slice(cursor, cursor + limit);
  return {
    items,
    total: filtered.length,
    cursor,
    limit,
    nextCursor: cursor + items.length,
    hasMore: cursor + items.length < filtered.length,
    scanMs: sessionCatalogState.scanMs,
    pathScanMs: sessionCatalogState.pathScanMs,
    cacheHits: sessionCatalogState.cacheHits,
    hydratedCount: sessionCatalogState.hydratedCount,
  };
}

function getSessionDetail(sessionId) {
  const session = sessionCatalog.get(sessionId) || ensureSessionCatalogEntry(sessionId);
  if (!session) return null;
  hydrateSessionEntry(session, {includePreview: true});
  persistSessionCatalogCache();
  return {
    id: session.id,
    threadName: session.threadName,
    updatedAt: session.updatedAt,
    cwd: session.cwd,
    archived: session.archived,
    messages: session.filePath ? summarizeSessionMessages(session.filePath, 14) : [],
  };
}

function createSessionJob(sessionId, configInput = {}) {
  const detail = getSessionDetail(sessionId);
  if (!detail) return null;

  const id = `job_session_${sessionId}`;
  const existing = runtimeJobs.get(id);
  if (existing) {
    existing.title = detail.threadName;
    existing.messages = detail.messages;
    existing.updatedAt = detail.updatedAt;
    existing.preview.headline = detail.threadName;
    existing.preview.summary = detail.cwd || WORKSPACE_ROOT;
    existing.preview.subtitle = detail.messages[detail.messages.length - 1]?.text || existing.preview.subtitle;
    existing.scriptSections = [
      {label: "Session", text: sessionId},
      {label: "Thread", text: detail.threadName},
      {label: "Scope", text: detail.cwd || WORKSPACE_ROOT},
    ];
    applyJobConfig(existing, configInput);
    return existing;
  }

  const job = {
    id,
    source: "session",
    title: detail.threadName,
    prompt: "",
    templateId: "session",
    compositionId: "",
    aspectRatio: "9:16",
    durationSec: 60,
    accountId: "",
    templateLocked: false,
    activePresetIds: [],
    openInstruction: "",
    instructionScope: "run",
    outputDir: "linked local session",
    status: "session",
    updatedAt: detail.updatedAt,
    stageIndex: 0,
    codexSessionId: sessionId,
    messages: detail.messages,
    pendingAssistantText: "",
    codexRunning: false,
    steps: [
      {
        title: "已绑定本地 session",
        detail: "后续发送的消息会通过 codex exec resume 继续这个上下文。",
        status: "done",
      },
    ],
    logs: [
      `[${nowIso()}] system: attached local session ${sessionId}`,
      `[${nowIso()}] session: ${detail.threadName}`,
    ],
    preview: {
      statusText: "Session",
      episodeLabel: "Linked / Local Session",
      headline: detail.threadName,
      summary: detail.cwd || WORKSPACE_ROOT,
      subtitle: detail.messages[detail.messages.length - 1]?.text || "已绑定本地 session",
      progress: 0,
      imageUrl: "/workspace/assets/images/scenario_video_breakdown.jpg",
    },
    scriptSections: [
      {label: "Session", text: sessionId},
      {label: "Thread", text: detail.threadName},
      {label: "Scope", text: detail.cwd || WORKSPACE_ROOT},
    ],
    archived: false,
    archivedAt: "",
  };

  applyJobConfig(job, configInput);
  runtimeJobs.set(job.id, job);
  return job;
}

function derivePersistedSteps(logText) {
  const lines = logText.split(/\r?\n/).filter(Boolean);
  const stageLines = lines.filter((line) => line.includes("Stage entered:"));
  if (!stageLines.length) {
    return [
      {
        title: "读取历史任务",
        detail: "该任务来自 data/jobs，当前展示的是已保存的分析结果。",
        status: "done",
      },
    ];
  }
  return stageLines.map((line) => ({
    title: line.split("Stage entered:")[1]?.trim() || "unknown",
    detail: "来自历史 runner.log 的阶段记录。",
    status: "done",
  }));
}

function loadPersistedJobs() {
  if (!fs.existsSync(JOB_ROOT)) return;
  for (const entry of fs.readdirSync(JOB_ROOT, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const jobDir = path.join(JOB_ROOT, entry.name);
    const consoleJobJson = safeReadJson(path.join(jobDir, "console-job.json")) || null;
    const jobJson = safeReadJson(path.join(jobDir, "job.json")) || {id: entry.name, status: "unknown"};
    const statusJson = safeReadJson(path.join(jobDir, "status.json")) || {};
    const planBriefJson = safeReadJson(path.join(jobDir, "plan-brief.json")) || {};
    const logText = safeReadText(path.join(jobDir, "runner.log"));
    const relativeDir = path.relative(WORKSPACE_ROOT, jobDir).replaceAll("\\", "/");
    const posterPath = path.join(jobDir, "poster.jpg");
    if (consoleJobJson?.id) {
      persistedJobs.set(entry.name, {
        id: consoleJobJson.id || entry.name,
        source: consoleJobJson.source || "runtime",
        title: consoleJobJson.title || entry.name,
        prompt: consoleJobJson.prompt || "",
        templateId: consoleJobJson.templateId || "new_signals",
        compositionId: consoleJobJson.compositionId || "",
        renderCompositionId: consoleJobJson.renderCompositionId || "",
        topicTitle: consoleJobJson.topicTitle || "",
        aspectRatio: consoleJobJson.aspectRatio || "9:16",
        durationSec: Number(consoleJobJson.durationSec || 60),
        accountId: consoleJobJson.accountId || "",
        templateLocked: Boolean(consoleJobJson.templateLocked),
        activePresetIds: ensureArray(consoleJobJson.activePresetIds),
        openInstruction: consoleJobJson.openInstruction || "",
        instructionScope: consoleJobJson.instructionScope || "run",
        outputDir: relativeDir,
        status: statusJson.status || consoleJobJson.status || "unknown",
        updatedAt: statusJson.updated_at || consoleJobJson.updatedAt || nowIso(),
        createdAt: consoleJobJson.createdAt || "",
        stageIndex: Number(consoleJobJson.stageIndex || statusJson.stage_index || 0),
        codexSessionId: consoleJobJson.codexSessionId || null,
        planSource: planBriefJson.source || statusJson.plan_source || consoleJobJson.planSource || "",
        planFallbackReason: planBriefJson.error || statusJson.plan_fallback_reason || consoleJobJson.planFallbackReason || "",
        archived: Boolean(statusJson.archived ?? consoleJobJson.archived),
        archivedAt: String(statusJson.archived_at || consoleJobJson.archivedAt || ""),
        campaignId: consoleJobJson.campaignId || "",
        activityId: consoleJobJson.activityId || "",
        topicId: consoleJobJson.topicId || "",
        batchId: consoleJobJson.batchId || "",
        batchIndex: Number(consoleJobJson.batchIndex || 0),
        messages: ensureArray(consoleJobJson.messages),
        pendingAssistantText: "",
        codexRunning: false,
        steps: ensureArray(consoleJobJson.steps).length ? ensureArray(consoleJobJson.steps) : derivePersistedSteps(logText),
        logs: logText ? logText.split(/\r?\n/).filter(Boolean) : ensureArray(consoleJobJson.logs),
        preview: consoleJobJson.preview || {
          statusText: statusJson.status || consoleJobJson.status || "History",
          episodeLabel: "History / Console Job",
          headline: consoleJobJson.title || entry.name,
          summary: statusJson.message || "历史任务快照。",
          subtitle: statusJson.message || "",
          progress: Number(statusJson.progress || 100),
          imageUrl: fs.existsSync(posterPath) ? toWorkspaceUrl(posterPath) : "/workspace/assets/images/scenario_video_breakdown.jpg",
        },
        scriptSections: ensureArray(consoleJobJson.scriptSections),
      });
      continue;
    }
    persistedJobs.set(entry.name, {
      id: jobJson.id || entry.name,
      source: "persisted",
      title: `${jobJson.source_video_id || entry.name} 分析任务`,
      prompt: `${jobJson.mode || "历史任务"} / source=${jobJson.source_video_id || "unknown"}`,
      templateId: "history",
      compositionId: "",
      aspectRatio: "16:9",
      durationSec: 60,
      accountId: "",
      templateLocked: false,
      activePresetIds: [],
      openInstruction: "",
      instructionScope: "run",
      outputDir: relativeDir,
      status: statusJson.status || jobJson.status || "unknown",
      updatedAt: statusJson.updated_at || jobJson.updated_at || nowIso(),
      stageIndex: 999,
      codexSessionId: null,
      planSource: planBriefJson.source || statusJson.plan_source || "",
      planFallbackReason: planBriefJson.error || statusJson.plan_fallback_reason || "",
      archived: Boolean(statusJson.archived),
      archivedAt: String(statusJson.archived_at || ""),
      messages: [
        {
          role: "assistant",
          meta: "System",
          text: "这是从 data/jobs 读取的历史任务快照，日志和状态来自本地文件。",
        },
      ],
      pendingAssistantText: "",
      codexRunning: false,
      steps: derivePersistedSteps(logText),
      logs: logText.split(/\r?\n/).filter(Boolean),
      preview: {
        statusText: statusJson.status || jobJson.status || "History",
        episodeLabel: "History / Analysis",
        headline: `${jobJson.source_video_id || entry.name} 分析任务`,
        summary: statusJson.message || "历史任务只展示状态和日志，不执行新的生成动作。",
        subtitle: "Runner completed successfully",
        progress: Number(statusJson.progress || 100),
        imageUrl: fs.existsSync(posterPath) ? toWorkspaceUrl(posterPath) : "/workspace/assets/images/scenario_video_breakdown.jpg",
      },
      scriptSections: [
        {label: "Mode", text: jobJson.mode || "unknown"},
        {label: "Status", text: statusJson.status || jobJson.status || "unknown"},
        {label: "Output", text: relativeDir},
      ],
    });
  }
}

function listTemplates() {
  if (!fs.existsSync(TEMPLATE_ROOT)) return [];
  return fs
    .readdirSync(TEMPLATE_ROOT, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const meta = getTemplateCatalogEntry(entry.name);
      const templateDir = path.join(TEMPLATE_ROOT, entry.name);
      const updatedAt = fs.existsSync(templateDir) ? fs.statSync(templateDir).mtime.toISOString() : nowIso();
      return {
        id: entry.name,
        title: meta?.title || entry.name.replaceAll("_", " "),
        compositionId: meta?.compositionId || "",
        suitablePlatforms: meta?.suitablePlatforms || [],
        defaultDurationSec: meta?.defaultDurationSec || 60,
        aspectRatio: meta?.aspectRatio || "9:16",
        summary: meta?.summary || "",
        description: meta?.description || meta?.summary || "",
        tags: meta?.tags || [],
        assetSlots: getTemplateAssetSlots(entry.name),
        version: meta?.version || "v1",
        publishStatus: meta?.publishStatus || "published",
        owner: meta?.owner || "workspace",
        updatedAt,
        path: `data/templates/${entry.name}`,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function classifyAsset(name) {
  if (/macd|chart|signal/i.test(name)) return "图表素材";
  if (/hook|crisis/i.test(name)) return "Hook 素材";
  if (/scenario|ppt/i.test(name)) return "场景素材";
  return "图片素材";
}

function listAssets() {
  if (!fs.existsSync(ASSET_IMAGE_ROOT)) return [];
  return fs
    .readdirSync(ASSET_IMAGE_ROOT, {withFileTypes: true})
    .filter((entry) => entry.isFile())
    .slice(0, 12)
    .map((entry) => ({
      name: entry.name,
      kind: classifyAsset(entry.name),
      path: `assets/images/${entry.name}`,
      url: `/workspace/assets/images/${encodeURIComponent(entry.name)}`,
    }));
}

function listCompositions() {
  if (!fs.existsSync(COMPOSITION_ROOT)) return [];
  return fs
    .readdirSync(COMPOSITION_ROOT, {withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    .map((entry) => entry.name.replace(/\.tsx$/, ""))
    .sort();
}

function summaryFromJob(job) {
  const manifest = buildArtifactManifest(job);
  return {
    id: job.id,
    type: job.type || "video_generation",
    source: job.source,
    title: job.title,
    status: job.status,
    updatedAt: job.updatedAt,
    accountId: job.accountId || "",
    templateId: job.templateId,
    compositionId: job.compositionId || "",
    renderCompositionId: job.renderCompositionId || "",
    topicTitle: job.topicTitle || "",
    durationSec: job.durationSec || 60,
    templateLocked: Boolean(job.templateLocked),
    activePresetIds: ensureArray(job.activePresetIds),
    openInstruction: job.openInstruction || "",
    instructionScope: job.instructionScope || "run",
    useAiImageAssets: Boolean(job.useAiImageAssets),
    imageAssetModel: normalizeImageAssetModel(job.imageAssetModel) || getImageApiConfig().model,
    replication: job.replication || null,
    outputDir: job.outputDir,
    codexSessionId: job.codexSessionId || null,
    planSource: job.planSource || "",
    planFallbackReason: job.planFallbackReason || "",
    stageIndex: Number(job.stageIndex || 0),
    pipelineRunning: Boolean(job.pipelineRunning),
    lastPipelineAction: job.lastPipelineAction || "",
    failedAction: job.failedAction || "",
    archived: Boolean(job.archived),
    archivedAt: job.archivedAt || "",
    campaignId: job.campaignId || "",
    activityId: job.activityId || "",
    topicId: job.topicId || "",
    batchId: job.batchId || "",
    batchIndex: Number(job.batchIndex || 0),
    hasVideo: Boolean(manifest.video?.exists),
    screenQaStatus: getJobScreenQaStatus(job),
    artifactManifest: manifest,
    assetStatus: buildAssetStatus(job),
  };
}

function detailFromJob(job) {
  const assetPlan = readJobAssetPlan(job);
  const assetManifest = readJobAssetManifest(job);
  return {
    ...summaryFromJob(job),
    prompt: job.prompt,
    aspectRatio: job.aspectRatio,
    messages: ensureArray(job.messages),
    pendingAssistantText: job.pendingAssistantText || "",
    codexRunning: Boolean(job.codexRunning),
    steps: ensureArray(job.steps),
    logs: ensureArray(job.logs),
    preview: job.preview,
    scriptSections: ensureArray(job.scriptSections),
    artifacts: job.artifacts || {},
    artifactManifest: buildArtifactManifest(job),
    assetPlan,
    assetManifest,
    assetStatus: buildAssetStatus(job),
    planSource: job.planSource || "",
    planFallbackReason: job.planFallbackReason || "",
    archived: Boolean(job.archived),
    archivedAt: job.archivedAt || "",
    campaignId: job.campaignId || "",
    batchId: job.batchId || "",
    batchIndex: Number(job.batchIndex || 0),
  };
}

function allJobs() {
  return [...runtimeJobs.values(), ...persistedJobs.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function buildStatsPayload() {
  const jobs = allJobs();
  const liveJobs = jobs.filter((job) => !job.archived);
  const archivedJobs = jobs.filter((job) => job.archived);
  const completedJobs = jobs.filter((job) => job.status === "completed");
  const failedJobs = jobs.filter((job) => job.status === "failed");
  const activeJobs = jobs.filter((job) => ["planning", "plan-ready", "tts-ready", "rendering", "draft"].includes(job.status));
  const accounts = listAccounts();
  const templates = listTemplates();
  const sessionCatalog = loadSessionCatalog();
  const campaigns = listCampaigns();
  const activities = listActivities();
  const topics = listTopicPool();
  const batches = listBatches();
  const successBase = completedJobs.length + failedJobs.length;
  return {
    totalJobs: jobs.length,
    liveJobs: liveJobs.length,
    archivedJobs: archivedJobs.length,
    completedJobs: completedJobs.length,
    failedJobs: failedJobs.length,
    activeJobs: activeJobs.length,
    successRate: successBase ? Math.round((completedJobs.length / successBase) * 100) : 0,
    accounts: accounts.filter((account) => !account.archived).length,
    archivedAccounts: accounts.filter((account) => account.archived).length,
    templates: templates.length,
    publishedTemplates: templates.filter((template) => template.publishStatus === "published").length,
    campaigns: campaigns.filter((campaign) => !campaign.archived).length,
    archivedCampaigns: campaigns.filter((campaign) => campaign.archived).length,
    activities: activities.filter((activity) => !activity.archived).length,
    topics: topics.filter((topic) => !topic.archived).length,
    batches: batches.length,
    sessions: sessionCatalog.length,
    updatedAt: nowIso(),
  };
}

function setJobArchived(job, archived = true) {
  const nextArchived = Boolean(archived);
  job.archived = nextArchived;
  job.archivedAt = nextArchived ? job.archivedAt || nowIso() : "";
  job.updatedAt = nowIso();
  if (job.source !== "session") {
    persistJobSnapshot(job, nextArchived ? "任务已归档" : "任务已恢复");
  }
  return job;
}

function buildRecoveryPrompt(job) {
  const sectionSummary = ensureArray(job.scriptSections)
    .map((section) => `${section.label}: ${section.text}`)
    .join("\n");
  return String(job.prompt || "").trim() || sectionSummary || job.title || "恢复历史任务";
}

function recoverJob(job) {
  const prompt = buildRecoveryPrompt(job);
  const recovered = createRuntimeJob(prompt, {
    accountId: job.accountId || "",
    templateId: job.templateId || "",
    compositionId: job.compositionId || "",
    durationSec: Number(job.durationSec || 60),
    aspectRatio: job.aspectRatio || "9:16",
    templateLocked: Boolean(job.templateLocked),
    activePresetIds: ensureArray(job.activePresetIds),
    openInstruction: job.openInstruction || "",
    instructionScope: job.instructionScope || "run",
  });
  recovered.title = `${job.title || recovered.title} · 恢复`;
  recovered.preview.headline = recovered.title;
  recovered.preview.summary = `已从任务 ${job.id} 恢复，沿用原有账号、模板和指令配置。`;
  recovered.preview.subtitle = "请先检查计划与产物，再决定是否继续渲染。";
  recovered.logs.push(`[${nowIso()}] system: recovered from ${job.id}`);
  attachMessage(recovered, "assistant", "System", `已从任务 ${job.id} 恢复，当前沿用原有账号、模板和指令配置。`);
  return recovered;
}

function isJobPlanReady(job) {
  const artifacts = ensureJobArtifactShape(job);
  return Boolean(fs.existsSync(artifacts.planPath) || job.planSource || Number(job.stageIndex || 0) >= 2);
}

function isJobTtsReady(job) {
  const artifacts = ensureJobArtifactShape(job);
  return Boolean(
    fs.existsSync(artifacts.publicVoiceoverPath) &&
      fs.existsSync(artifacts.subtitlesPath) &&
      Number(job.stageIndex || 0) >= 4,
  );
}

function isJobRenderReady(job) {
  const artifacts = ensureJobArtifactShape(job);
  return Boolean(fs.existsSync(artifacts.outputVideoPath) || job.status === "completed");
}

function msSince(value) {
  const started = new Date(value || "").getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Date.now() - started);
}

function average(values = []) {
  const numeric = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  if (!numeric.length) return 0;
  return Math.round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length);
}

function estimateBatchJobDurationMs(action, runState = {}) {
  const historical = Object.values(runState.durationMsByJobId || {});
  return average(historical) || BATCH_ACTION_ESTIMATE_MS[action] || 180000;
}

function enrichBatchRunState(runState = null) {
  if (!runState || typeof runState !== "object") return null;
  const currentElapsedMs = runState.currentJobStartedAt ? msSince(runState.currentJobStartedAt) : 0;
  const currentJobEstimateMs = Number(runState.currentJobEstimateMs || 0);
  const queued = ensureArray(runState.queuedJobIds);
  const completed = ensureArray(runState.completedJobIds);
  const failed = ensureArray(runState.failedJobIds);
  const canceled = ensureArray(runState.canceledJobIds);
  const processed = completed.length + failed.length + canceled.length;
  const remainingJobs = Math.max(0, queued.length - processed - (runState.currentJobId ? 1 : 0));
  const averageMs = average(Object.values(runState.durationMsByJobId || {})) || currentJobEstimateMs || BATCH_ACTION_ESTIMATE_MS[runState.action] || 180000;
  return {
    ...runState,
    currentElapsedMs,
    currentRemainingMs: currentJobEstimateMs ? Math.max(0, currentJobEstimateMs - currentElapsedMs) : 0,
    estimatedRemainingMs: runState.running
      ? Math.max(0, currentJobEstimateMs ? currentJobEstimateMs - currentElapsedMs : averageMs) + remainingJobs * averageMs
      : 0,
  };
}

function getBatchJobCurrentStep(job, runState = null) {
  const steps = ensureArray(job.steps);
  const isActive = runState?.currentJobId === job.id || Boolean(job.pipelineRunning);
  if (isActive || job.status === "failed") {
    return (
      steps.find((step) => step.status === "running" || step.status === "failed") ||
      steps.find((step) => step.status === "waiting") ||
      steps[steps.length - 1] ||
      null
    );
  }
  if (!isJobPlanReady(job)) return {title: "等待生成计划", status: "waiting"};
  if (!isJobTtsReady(job)) return {title: "等待批量配音", status: "waiting"};
  if (!isJobRenderReady(job)) return {title: "等待批量渲染", status: "waiting"};
  return {title: "视频已生成", status: "done"};
}

function batchJobSummary(job, runState = null) {
  const currentStep = getBatchJobCurrentStep(job, runState);
  return {
    id: job.id,
    title: job.title || job.id,
    status: job.status || "unknown",
    accountId: job.accountId || "",
    accountName: getAccount(job.accountId)?.name || job.accountId || "",
    templateId: job.templateId || "",
    campaignId: job.campaignId || "",
    activityId: job.activityId || "",
    topicId: job.topicId || "",
    topicTitle: job.topicTitle || "",
    updatedAt: job.updatedAt || "",
    planReady: isJobPlanReady(job),
    ttsReady: isJobTtsReady(job),
    renderReady: isJobRenderReady(job),
    hasVideo: isJobRenderReady(job),
    screenQaStatus: getJobScreenQaStatus(job),
    artifactStatus: buildBatchArtifactStatus(job),
    currentStepTitle: currentStep?.title || "",
    currentStepStatus: currentStep?.status || "",
    outputDir: job.outputDir || "",
    archived: Boolean(job.archived),
    batchCurrent: runState?.currentJobId === job.id,
    currentAction: runState?.currentJobId === job.id ? runState.action || "" : "",
    currentElapsedMs: runState?.currentJobId === job.id ? Number(runState.currentElapsedMs || 0) : 0,
    currentEstimateMs: runState?.currentJobId === job.id ? Number(runState.currentJobEstimateMs || 0) : 0,
    retryArtifactAt: job.batchRetryArtifactAt || "",
    retryAction: job.batchRetryAction || "",
    retryCount: Number(job.batchRetryCount || 0),
    errorMessage: job.status === "failed" ? extractJobErrorMessage(job) || runState?.lastError || "" : "",
  };
}

function batchJobDetail(job, runState = null) {
  return {
    ...batchJobSummary(job, runState),
    steps: ensureArray(job.steps),
    logs: ensureArray(job.logs).slice(-12),
    artifactManifest: buildArtifactManifest(job),
  };
}

function summarizeBatch(batch) {
  const jobs = allJobs().filter((job) => job.batchId === batch.id);
  const runState = enrichBatchRunState(batch.runState || null);
  const completed = jobs.filter((job) => job.status === "completed").length;
  const failed = jobs.filter((job) => job.status === "failed").length;
  const archived = jobs.filter((job) => job.archived).length;
  const planReady = jobs.filter(isJobPlanReady).length;
  const ttsReady = jobs.filter(isJobTtsReady).length;
  const renderReady = jobs.filter(isJobRenderReady).length;
  return {
    ...batch,
    jobCount: jobs.length || ensureArray(batch.jobIds).length,
    completed,
    failed,
    archived,
    planReady,
    ttsReady,
    renderReady,
    topicCount: Number(batch.topicCount || ensureArray(batch.topics).length || (batch.topic ? 1 : 0)),
    accountCount: Number(batch.accountCount || ensureArray(batch.accountIds).length || 0),
    autoRetry: batch.autoRetry !== false,
    maxAutoRetries: Number(batch.maxAutoRetries ?? 1),
    autoRetryCount: Object.values(batch.autoRetryCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0),
    jobIds: ensureArray(batch.jobIds),
    jobs: jobs.map((job) => batchJobSummary(job, runState)),
    failedJobs: jobs.filter((job) => job.status === "failed").map((job) => batchJobSummary(job, runState)),
    runState,
  };
}

function detailBatch(batch) {
  const jobs = allJobs().filter((job) => job.batchId === batch.id);
  const summary = summarizeBatch(batch);
  return {
    ...summary,
    jobs: jobs.map((job) => batchJobDetail(job, summary.runState)),
    artifacts: collectBatchArtifacts(batch, jobs),
  };
}

function listBatchSummaries(params = new URLSearchParams()) {
  const projectId = String(params.get("projectId") || params.get("campaignId") || "").trim();
  const activityId = String(params.get("activityId") || "").trim();
  const topicId = String(params.get("topicId") || "").trim();
  const status = String(params.get("status") || "all").trim();
  const query = String(params.get("q") || "").trim().toLowerCase();
  const failedOnly = params.get("failedOnly") === "1";
  return listBatches()
    .map(summarizeBatch)
    .filter((batch) => !projectId || batch.campaignId === projectId)
    .filter((batch) => !activityId || batch.activityId === activityId)
    .filter((batch) => !topicId || batch.topicId === topicId)
    .filter((batch) => status === "all" || batch.status === status)
    .filter((batch) => !failedOnly || Number(batch.failed || 0) > 0)
    .filter((batch) => !query || `${batch.topic || ""} ${batch.campaignName || ""} ${batch.activityName || ""}`.toLowerCase().includes(query))
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
}

function buildBatchPrompt(topic, account, campaign, input = {}) {
  const objective = campaign?.objective ? `\n项目目标：${campaign.objective}` : "";
  const activity = input.activity?.name ? `\n活动：${input.activity.name}` : "";
  const topicBrief = input.topicBrief ? `\n选题说明：${input.topicBrief}` : "";
  const platform = account?.platform ? `\n平台：${account.platform}` : "";
  const persona = account?.persona ? `\n账号人设：${account.persona}` : "";
  const extra = String(input.openInstruction || input.extraInstruction || "").trim();
  return [
    `请基于同一选题生成一条视频任务：${topic}`,
    objective,
    activity,
    topicBrief,
    account ? `\n账号：${account.name}` : "",
    platform,
    persona,
    extra ? `\n额外要求：${extra}` : "",
  ]
    .join("")
    .trim();
}

function normalizeBatchTopics(input = {}) {
  const rawItems = Array.isArray(input.topics) && input.topics.length ? input.topics : ensureStringList(input.topic || input.topicText || "");
  const seen = new Set();
  return rawItems
    .map((item) => {
      if (item && typeof item === "object") {
        const title = String(item.title || item.topic || item.name || "").trim();
        return {
          title,
          topicId: String(item.topicId || item.id || "").trim(),
          brief: String(item.brief || item.topicBrief || "").trim(),
        };
      }
      return {
        title: String(item || "").trim(),
        topicId: "",
        brief: "",
      };
    })
    .filter((item) => item.title)
    .filter((item) => {
      const key = `${item.topicId || ""}:${item.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function createBatch(input = {}) {
  const batchTopics = normalizeBatchTopics(input);
  if (!batchTopics.length) throw new Error("Batch topic is required");
  const topic = batchTopics[0].title;
  const campaigns = listCampaigns();
  const campaign = campaigns.find((item) => item.id === input.campaignId) || campaigns.find((item) => !item.archived) || campaigns[0] || null;
  const activities = listActivities();
  const activity =
    activities.find((item) => item.id === input.activityId && (!campaign || item.projectId === campaign.id)) ||
    activities.find((item) => !item.archived && (!campaign || item.projectId === campaign.id)) ||
    activities[0] ||
    null;
  const topicPool = listTopicPool();
  const singleSourceTopic = input.topicId ? topicPool.find((item) => item.id === input.topicId) : null;
  const primarySourceTopic = batchTopics[0]?.topicId
    ? topicPool.find((item) => item.id === batchTopics[0].topicId)
    : singleSourceTopic;
  const activeAccounts = listAccounts().filter((account) => !account.archived);
  const requestedAccountIds = ensureStringList(input.accountIds);
  const accounts = requestedAccountIds.length
    ? activeAccounts.filter((account) => requestedAccountIds.includes(account.id))
    : activeAccounts.slice(0, Math.min(activeAccounts.length, 3));
  if (!accounts.length) throw new Error("Batch requires at least one active account");

  const batchSlug = batchTopics.length > 1 ? `${topic}-${batchTopics.length}-topics` : topic;
  const batchId = `batch_${Date.now()}_${sanitizeId(batchSlug, "topic").slice(0, 28)}`;
  const createdAt = nowIso();
  const templateId = String(input.templateId || "").trim();
  const jobs = batchTopics.flatMap((topicItem, topicIndex) =>
    accounts.map((account, accountIndex) => {
    const sourceTopic = topicItem.topicId ? topicPool.find((item) => item.id === topicItem.topicId) : topicIndex === 0 ? singleSourceTopic : null;
    const topicTitle = sourceTopic?.title || topicItem.title;
    const accountTemplateId = templateId || account.defaultTemplateId || "new_signals";
    const template = getTemplateCatalogEntry(accountTemplateId) || getTemplateCatalogEntry("new_signals");
    const prompt = buildBatchPrompt(topicTitle, account, campaign, {
      ...input,
      activity,
      topicBrief: sourceTopic?.brief || topicItem.brief || input.topicBrief || "",
    });
    const job = createRuntimeJob(prompt, {
      accountId: account.id,
      templateId: accountTemplateId,
      compositionId: template?.compositionId || account.defaultCompositionId || "",
      durationSec: Number(input.durationSec || account.defaultDurationSec || template?.defaultDurationSec || 60),
      aspectRatio: input.aspectRatio || account.aspectRatio || template?.aspectRatio || "9:16",
      subtitleFontSize: normalizeSubtitleFontSize(input.subtitleFontSize, 28),
      subtitleColor: normalizeSubtitleColor(input.subtitleColor, "#ffffff"),
      templateLocked: input.templateLocked !== false,
      activePresetIds: ensureArray(input.activePresetIds),
      openInstruction: String(input.openInstruction || "").trim(),
      instructionScope: "run",
      useAiImageAssets: Boolean(input.useAiImageAssets),
      imageAssetModel: normalizeImageAssetModel(input.imageAssetModel),
    });
    const batchIndex = topicIndex * accounts.length + accountIndex + 1;
    job.title = `${topicTitle} / ${account.name}`.slice(0, 96);
    job.campaignId = campaign?.id || "";
    job.batchId = batchId;
    job.batchIndex = batchIndex;
    job.batchTopicIndex = topicIndex + 1;
    job.batchAccountIndex = accountIndex + 1;
    job.createdAt = createdAt;
    job.updatedAt = createdAt;
    job.preview.episodeLabel = `${campaign?.name || "批量任务"} / ${account.name}`;
    job.preview.headline = job.title;
    job.preview.summary = `批量任务 ${batchIndex}/${batchTopics.length * accounts.length}，选题 ${topicIndex + 1}/${batchTopics.length}，账号 ${accountIndex + 1}/${accounts.length}。`;
    job.preview.subtitle = "同题多账号任务已创建。";
    job.activityId = activity?.id || "";
    job.topicId = sourceTopic?.id || topicItem.topicId || (batchTopics.length === 1 ? String(input.topicId || "") : "");
    job.topicTitle = topicTitle;
    attachMessage(job, "user", "Batch", prompt);
    attachMessage(job, "assistant", "System", "批量任务已创建。请按需生成计划、配音和渲染。");
    persistJobSnapshot(job, "批量任务已创建");
    return job;
  }));

  const batch = {
    id: batchId,
    topic: batchTopics.length === 1 ? topic : `${topic} 等 ${batchTopics.length} 个选题`,
    campaignId: campaign?.id || "",
    campaignName: campaign?.name || "",
    activityId: activity?.id || "",
    activityName: activity?.name || "",
    topicId: batchTopics.length === 1 ? primarySourceTopic?.id || String(input.topicId || "") : "",
    topicTitle: batchTopics.length === 1 ? primarySourceTopic?.title || topic : `${batchTopics.length} 个选题`,
    topics: batchTopics.map((item) => ({
      title: item.title,
      topicId: item.topicId || "",
      brief: item.brief || "",
    })),
    topicCount: batchTopics.length,
    accountIds: accounts.map((account) => account.id),
    accountCount: accounts.length,
    templateId: templateId || "",
    jobIds: jobs.map((job) => job.id),
    autoRetry: input.autoRetry !== false,
    maxAutoRetries: Math.max(0, Math.min(Number(input.maxAutoRetries ?? 1), 5)),
    autoRetryCounts: {},
    status: "draft",
    createdAt,
    updatedAt: createdAt,
    archived: false,
  };
  saveBatches([batch, ...listBatches()]);
  batchTopics.forEach((topicItem, index) => {
    const sourceTopic = topicItem.topicId ? topicPool.find((item) => item.id === topicItem.topicId) : index === 0 ? singleSourceTopic : null;
    if (sourceTopic?.id) {
      updateTopic(sourceTopic.id, {status: "batched", batchId: batch.id});
    }
  });
  appendAuditEvent("batch.created", "batch", batch.id, {
    topic: batch.topic,
    campaignId: batch.campaignId,
    activityId: batch.activityId,
    topicId: batch.topicId,
    topicCount: batch.topicCount,
    accountCount: batch.accountCount,
    jobCount: jobs.length,
  });
  return {
    batch: summarizeBatch(batch),
    jobs: jobs.map(detailFromJob),
  };
}

function getBatchById(batchId) {
  return listBatches().find((batch) => batch.id === batchId) || null;
}

function updateBatchRecord(batchId, patch = {}) {
  const batches = listBatches();
  const index = batches.findIndex((batch) => batch.id === batchId);
  if (index === -1) throw new Error("Batch not found");
  const nextBatch = {
    ...batches[index],
    ...patch,
    updatedAt: nowIso(),
  };
  batches[index] = nextBatch;
  saveBatches(batches);
  return nextBatch;
}

function resolveBatchJobs(batch, options = {}) {
  const action = options.action || "generate-plan";
  const failedOnly = Boolean(options.failedOnly);
  const force = Boolean(options.force);
  return ensureArray(batch.jobIds)
    .map((jobId) => findJob(jobId))
    .filter(Boolean)
    .filter((job) => job.source === "runtime" && !job.archived)
    .filter((job) => !failedOnly || job.status === "failed")
    .filter((job) => {
      if (force || job.status === "failed") return true;
      if (action === "generate-plan") return !isJobPlanReady(job);
      if (action === "tts") return isJobPlanReady(job) && !isJobTtsReady(job);
      if (action === "render") return isJobTtsReady(job) && !isJobRenderReady(job);
      return false;
    });
}

function getBatchActionStatus(action, runState) {
  if (runState.failedJobIds.length && runState.completedJobIds.length) return "partial";
  if (runState.failedJobIds.length) return "failed";
  if (action === "generate-plan") return "planned";
  if (action === "tts") return "voiced";
  if (action === "render") return "completed";
  return "completed";
}

function getBatchStatusFromSummary(summary) {
  const total = Number(summary.jobCount || 0);
  if (Number(summary.failed || 0) > 0) return Number(summary.completed || 0) > 0 || Number(summary.planReady || 0) > 0 ? "partial" : "failed";
  if (total > 0 && Number(summary.renderReady || 0) >= total) return "completed";
  if (total > 0 && Number(summary.ttsReady || 0) >= total) return "voiced";
  if (total > 0 && Number(summary.planReady || 0) >= total) return "planned";
  return "draft";
}

function getTopicStatusFromBatchStatus(batchStatus) {
  if (batchStatus === "completed") return "completed";
  if (batchStatus === "voiced") return "voiced";
  if (batchStatus === "planned") return "planned";
  if (batchStatus === "failed") return "failed";
  if (batchStatus === "partial") return "partial";
  return "batched";
}

function localizeBatchAction(action) {
  const map = {
    "generate-plan": "批量生成计划",
    tts: "批量配音",
    render: "批量渲染",
  };
  return map[action] || action;
}

function safeArchiveName(value, fallback = "file") {
  return sanitizeId(value, fallback).replace(/-+/g, "-").slice(0, 72) || fallback;
}

function normalizeBatchArtifactFilters(input = {}) {
  const params = input instanceof URLSearchParams ? input : null;
  const accountValue = params ? params.get("accountIds") || params.get("accounts") || "" : input.accountIds || "";
  const accountIds = new Set(ensureStringList(accountValue));
  const retryOnly = params ? params.get("retryOnly") === "1" || params.get("retryOnly") === "true" : Boolean(input.retryOnly);
  return {accountIds, retryOnly};
}

function isRetryArtifactJob(batch, job) {
  if (job.batchRetryArtifactAt && (!job.batchRetryBatchId || job.batchRetryBatchId === batch.id)) return true;
  const runState = batch.runState || {};
  return Boolean(runState.failedOnly && ensureArray(runState.completedJobIds).includes(job.id));
}

function filterBatchArtifactJobs(batch, jobs, filters = {}) {
  return ensureArray(jobs)
    .filter((job) => !filters.accountIds?.size || filters.accountIds.has(job.accountId || ""))
    .filter((job) => !filters.retryOnly || isRetryArtifactJob(batch, job));
}

function collectBatchArtifacts(batch, jobs = allJobs().filter((job) => job.batchId === batch.id), filterInput = {}) {
  const filters = normalizeBatchArtifactFilters(filterInput);
  const items = [];
  const filteredJobs = filterBatchArtifactJobs(batch, jobs, filters);
  filteredJobs.forEach((job, index) => {
    const manifest = buildArtifactManifest(job);
    ["video", "poster", "audio", "plan", "subtitles"].forEach((key) => {
      const item = manifest[key];
      if (!item?.exists) return;
      const ext = path.extname(item.path || "") || path.extname(item.fileName || "");
      const prefix = String(index + 1).padStart(2, "0");
      items.push({
        jobId: job.id,
        jobTitle: job.title || job.id,
        key,
        label: item.label,
        accountId: job.accountId || "",
        accountName: getAccount(job.accountId)?.name || job.accountId || "",
        campaignId: job.campaignId || batch.campaignId || "",
        campaignName: batch.campaignName || job.campaignId || "",
        activityId: job.activityId || batch.activityId || "",
        activityName: batch.activityName || job.activityId || "",
        topicId: job.topicId || "",
        topicTitle: job.topicTitle || batch.topic || "",
        path: item.path,
        url: item.url,
        fileName: `${prefix}-${safeArchiveName(job.title || job.id, "job")}-${key}${ext}`,
        retryArtifactAt: job.batchRetryArtifactAt || "",
        retryAction: job.batchRetryAction || "",
      });
    });
  });
  return {
    batchId: batch.id,
    topic: batch.topic || batch.id,
    filters: {
      accountIds: [...filters.accountIds],
      retryOnly: filters.retryOnly,
    },
    downloadableCount: items.filter((item) => item.key === "video").length,
    items,
  };
}

const CRC32_TABLE = Array.from({length: 256}, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeZipBuffer(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBuffer = Buffer.from(file.name, "utf8");
    const data = file.data;
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);
    offset += local.length + nameBuffer.length + data.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function buildBatchArtifactZip(batch, filterInput = {}) {
  const jobs = allJobs().filter((job) => job.batchId === batch.id);
  const artifactCollection = collectBatchArtifacts(batch, jobs, filterInput);
  const artifactList = artifactCollection.items.filter((item) => item.key === "video");
  const entries = artifactList
    .map((item) => {
      const absolutePath = path.join(WORKSPACE_ROOT, item.path || "");
      if (!item.path || !fs.existsSync(absolutePath)) return null;
      return {
        item,
        data: fs.readFileSync(absolutePath),
      };
    })
    .filter(Boolean);
  if (!entries.length) throw new Error("No rendered videos to download");

  const manifest = {
    version: "batch-artifact-manifest-v1",
    generatedAt: nowIso(),
    batch: {
      id: batch.id,
      topic: batch.topic || batch.id,
      campaignId: batch.campaignId || "",
      campaignName: batch.campaignName || "",
      activityId: batch.activityId || "",
      activityName: batch.activityName || "",
      status: batch.status || "",
    },
    filters: artifactCollection.filters || {},
    videoCount: entries.length,
    videos: entries.map(({item}, index) => ({
      index: index + 1,
      fileName: item.fileName,
      jobId: item.jobId,
      jobTitle: item.jobTitle,
      accountId: item.accountId || "",
      accountName: item.accountName || "",
      campaignId: item.campaignId || "",
      campaignName: item.campaignName || "",
      activityId: item.activityId || "",
      activityName: item.activityName || "",
      topicId: item.topicId || "",
      topicTitle: item.topicTitle || "",
      retry: {
        isRetryArtifact: Boolean(item.retryArtifactAt),
        retryArtifactAt: item.retryArtifactAt || "",
        retryAction: item.retryAction || "",
      },
      sourcePath: item.path || "",
      sourceUrl: item.url || "",
    })),
  };

  const files = [
    {
      name: "manifest.json",
      data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
    },
    ...entries.map(({item, data}) => ({
      name: item.fileName,
      data,
    })),
  ];
  return makeZipBuffer(files);
}

function finishControlledBatch(batchId, runState, status, reason = "") {
  const nextRunState = {
    ...runState,
    running: false,
    currentJobId: "",
    currentJobStartedAt: "",
    currentJobEstimateMs: 0,
    currentJobLabel: "",
    control: "",
    controlReason: reason,
    updatedAt: nowIso(),
    finishedAt: status === "paused" ? "" : nowIso(),
  };
  updateBatchRecord(batchId, {status, runState: nextRunState});
  appendAuditEvent(`batch.${status}`, "batch", batchId, {
    action: runState.action,
    completed: ensureArray(runState.completedJobIds).length,
    failed: ensureArray(runState.failedJobIds).length,
  });
}

function readBatchControl(batchId) {
  const latest = getBatchById(batchId);
  return latest?.runState?.control || "";
}

function buildRetryQueue(params = new URLSearchParams()) {
  const batchId = String(params.get("batchId") || "").trim();
  const projectId = String(params.get("projectId") || params.get("campaignId") || "").trim();
  const activityId = String(params.get("activityId") || "").trim();
  return listBatchSummaries(params)
    .filter((batch) => !batchId || batch.id === batchId)
    .filter((batch) => !projectId || batch.campaignId === projectId)
    .filter((batch) => !activityId || batch.activityId === activityId)
    .flatMap((batch) =>
      ensureArray(batch.failedJobs).map((job) => ({
        batchId: batch.id,
        batchTopic: batch.topic,
        campaignId: batch.campaignId || "",
        activityId: batch.activityId || "",
        job,
      })),
    );
}

function getRetryActionForJob(job) {
  const explicit = String(job.failedAction || job.batchRetryAction || job.lastPipelineAction || "").trim();
  if (["generate-plan", "tts", "render"].includes(explicit)) return explicit;
  if (!isJobPlanReady(job)) return "generate-plan";
  if (!isJobTtsReady(job)) return "tts";
  if (!isJobRenderReady(job)) return "render";
  return "generate-plan";
}

function markBatchRetryAttempt(job, batchId, action, label = "Batch retry attempt started") {
  job.batchRetryBatchId = batchId;
  job.batchRetryAction = action;
  job.batchRetryCount = Number(job.batchRetryCount || 0) + 1;
  job.batchLastRetryStartedAt = nowIso();
  persistJobSnapshot(job, label);
}

function incrementBatchAutoRetry(batchId, action) {
  const latest = getBatchById(batchId);
  if (!latest) return null;
  const counts = {...(latest.autoRetryCounts || {})};
  counts[action] = Number(counts[action] || 0) + 1;
  return updateBatchRecord(batchId, {
    autoRetryCounts: counts,
    autoRetryLastAction: action,
    autoRetryLastAt: nowIso(),
  });
}

function shouldAutoRetryBatch(batch, action, runState, options = {}) {
  if (options.failedOnly || options.autoRetry) return false;
  if (batch.autoRetry === false) return false;
  if (!ensureArray(runState.failedJobIds).length) return false;
  const maxAutoRetries = Math.max(0, Number(batch.maxAutoRetries ?? 1));
  const count = Number(batch.autoRetryCounts?.[action] || 0);
  return count < maxAutoRetries;
}

async function runBatchJobAction(batchId, jobId, command) {
  const batch = getBatchById(batchId);
  if (!batch) throw new Error("Batch not found");
  const job = findJob(jobId);
  if (!job || job.batchId !== batch.id) throw new Error("Batch job not found");
  if (job.pipelineRunning) throw new Error("Job is already running");

  const normalized = String(command || "").trim();
  if (normalized === "retry-current") {
    const action = getRetryActionForJob(job);
    markBatchRetryAttempt(job, batchId, action);
    await advanceJob(job, action);
    job.batchRetryArtifactAt = nowIso();
    persistJobSnapshot(job, "Batch job retry completed");
    const summary = summarizeBatch(batch);
    const updated = updateBatchRecord(batchId, {status: getBatchStatusFromSummary(summary)});
    return {batch: detailBatch(updated), job: detailFromJob(job)};
  }

  if (normalized === "restart") {
    markBatchRetryAttempt(job, batchId, "restart");
    for (const action of ["generate-plan", "tts", "render"]) {
      await advanceJob(job, action);
    }
    job.batchRetryArtifactAt = nowIso();
    persistJobSnapshot(job, "Batch job restarted from head");
    const summary = summarizeBatch(batch);
    const updated = updateBatchRecord(batchId, {status: getBatchStatusFromSummary(summary)});
    return {batch: detailBatch(updated), job: detailFromJob(job)};
  }

  throw new Error(`Unsupported batch job action: ${command}`);
}

async function runBatchQueue(batchId, action, options = {}) {
  let batch = getBatchById(batchId);
  if (!batch) return;
  const jobs = resolveBatchJobs(batch, {action, ...options});
  const queuedJobIds = jobs.map((job) => job.id);
  const runState = {
    action,
    running: true,
    failedOnly: Boolean(options.failedOnly),
    queuedJobIds,
    currentJobId: "",
    completedJobIds: [],
    failedJobIds: [],
    canceledJobIds: [],
    durationMsByJobId: {},
    control: batch.runState?.control || "",
    controlReason: "",
    startedAt: nowIso(),
    updatedAt: nowIso(),
    finishedAt: "",
    lastError: "",
  };

  batch = updateBatchRecord(batchId, {
    status: "running",
    runState,
  });

  for (const job of jobs) {
    const controlBeforeJob = readBatchControl(batchId);
    if (controlBeforeJob === "pause") {
      finishControlledBatch(batchId, runState, "paused", "paused before next job");
      return;
    }
    if (controlBeforeJob === "cancel") {
      finishControlledBatch(batchId, runState, "canceled", "canceled before next job");
      return;
    }
    runState.currentJobId = job.id;
    runState.currentJobStartedAt = nowIso();
    runState.currentJobEstimateMs = estimateBatchJobDurationMs(action, runState);
    runState.currentJobLabel = job.title || job.id;
    runState.updatedAt = nowIso();
    updateBatchRecord(batchId, {status: "running", runState: {...runState}});
    try {
      if (options.failedOnly) {
        markBatchRetryAttempt(job, batchId, action);
      }
      await advanceJob(job, action);
      const finishedAt = nowIso();
      runState.durationMsByJobId[job.id] = msSince(runState.currentJobStartedAt);
      runState.currentJobFinishedAt = finishedAt;
      runState.completedJobIds.push(job.id);
      if (options.failedOnly) {
        job.batchRetryBatchId = batchId;
        job.batchRetryAction = action;
        job.batchRetryArtifactAt = finishedAt;
        persistJobSnapshot(job, "Batch retry artifact marked");
      }
    } catch (error) {
      runState.durationMsByJobId[job.id] = msSince(runState.currentJobStartedAt);
      const canceled = error?.code === "JOB_CANCELED" || Boolean(getJobTerminationRequest(job.id));
      if (canceled) {
        runState.canceledJobIds.push(job.id);
        clearJobTerminationRequest(job.id);
      } else {
        runState.failedJobIds.push(job.id);
      }
      runState.lastError = error.message || String(error);
    }
    runState.currentJobId = "";
    runState.currentJobStartedAt = "";
    runState.currentJobEstimateMs = 0;
    runState.currentJobLabel = "";
    runState.updatedAt = nowIso();
    updateBatchRecord(batchId, {status: "running", runState: {...runState}});
    const controlAfterJob = readBatchControl(batchId);
    if (controlAfterJob === "pause") {
      finishControlledBatch(batchId, runState, "paused", "paused after current job");
      return;
    }
    if (controlAfterJob === "cancel") {
      finishControlledBatch(batchId, runState, "canceled", "canceled after current job");
      return;
    }
  }

  runState.running = false;
  runState.currentJobId = "";
  runState.currentJobStartedAt = "";
  runState.currentJobEstimateMs = 0;
  runState.currentJobLabel = "";
  runState.updatedAt = nowIso();
  runState.finishedAt = nowIso();
  const nextStatus = getBatchActionStatus(action, runState);
  batch = updateBatchRecord(batchId, {
    status: nextStatus,
    runState,
  });
  if (batch.topicId) {
    try {
      updateTopic(batch.topicId, {status: getTopicStatusFromBatchStatus(nextStatus), batchId});
    } catch {}
  }
  appendAuditEvent("batch.run.finished", "batch", batchId, {
    action,
    label: localizeBatchAction(action),
    completed: runState.completedJobIds.length,
    failed: runState.failedJobIds.length,
  });

  const latestBatch = getBatchById(batchId) || batch;
  if (shouldAutoRetryBatch(latestBatch, action, runState, options)) {
    incrementBatchAutoRetry(batchId, action);
    setTimeout(() => {
      try {
        startBatchRun(batchId, action, {failedOnly: true, autoRetry: true});
      } catch (error) {
        try {
          const current = getBatchById(batchId);
          updateBatchRecord(batchId, {
            status: "failed",
            runState: {
              ...(current?.runState || {}),
              running: false,
              finishedAt: nowIso(),
              lastError: error.message || String(error),
            },
          });
        } catch {}
      }
    }, 120);
  }
}

function startBatchRun(batchId, action, options = {}) {
  const batch = getBatchById(batchId);
  if (!batch) throw new Error("Batch not found");
  if (!["generate-plan", "tts", "render"].includes(action)) throw new Error(`Unsupported batch action: ${action}`);
  if (batch.runState?.running) throw new Error("Batch is already running");
  const jobs = resolveBatchJobs(batch, {action, ...options});
  if (!jobs.length) throw new Error(options.failedOnly ? "No failed jobs to retry" : "No runnable jobs in this batch");
  appendAuditEvent(options.failedOnly ? "batch.retry.started" : "batch.run.started", "batch", batchId, {
    action,
    label: options.autoRetry ? `${localizeBatchAction(action)}自动重试` : localizeBatchAction(action),
    auto: Boolean(options.autoRetry),
    jobCount: jobs.length,
  });
  const queuedState = {
    action,
    running: true,
    failedOnly: Boolean(options.failedOnly),
    queuedJobIds: jobs.map((job) => job.id),
    currentJobId: "",
    completedJobIds: [],
    failedJobIds: [],
    canceledJobIds: [],
    durationMsByJobId: {},
    control: "",
    controlReason: "",
    currentJobStartedAt: "",
    currentJobEstimateMs: 0,
    currentJobLabel: "",
    startedAt: nowIso(),
    updatedAt: nowIso(),
    finishedAt: "",
    lastError: "",
  };
  const queuedBatch = updateBatchRecord(batchId, {status: "queued", runState: queuedState});
  setTimeout(() => {
    runBatchQueue(batchId, action, options).catch((error) => {
      try {
        updateBatchRecord(batchId, {
          status: "failed",
          runState: {
            ...(getBatchById(batchId)?.runState || {}),
            running: false,
            finishedAt: nowIso(),
            lastError: error.message || String(error),
          },
        });
      } catch {}
    });
  }, 0);
  return summarizeBatch(queuedBatch);
}

function controlBatchRun(batchId, command, input = {}) {
  const batch = getBatchById(batchId);
  if (!batch) throw new Error("Batch not found");
  const normalized = String(command || "").trim();
  const runState = batch.runState || {};
  const force = Boolean(input.force);

  if (normalized === "pause") {
    if (!runState.running) throw new Error("Batch is not running");
    const next = {...runState, control: "pause", controlReason: "pause requested", updatedAt: nowIso()};
    const updated = updateBatchRecord(batchId, {status: "pausing", runState: next});
    appendAuditEvent("batch.pause.requested", "batch", batchId, {action: runState.action || ""});
    return summarizeBatch(updated);
  }

  if (normalized === "cancel") {
    if (force && !runState.running) {
      throw new Error("Batch is not running");
    }
    if (!runState.running) {
      const updated = updateBatchRecord(batchId, {
        status: "canceled",
        runState: {...runState, running: false, control: "", controlReason: "canceled", finishedAt: nowIso(), updatedAt: nowIso()},
      });
      appendAuditEvent("batch.canceled", "batch", batchId, {action: runState.action || ""});
      return summarizeBatch(updated);
    }
    let terminatedProcessCount = Number(runState.terminatedProcessCount || 0);
    if (force && runState.currentJobId) {
      terminatedProcessCount += terminateJobProcesses(runState.currentJobId, "force canceled by queue request");
    }
    const next = {
      ...runState,
      control: "cancel",
      controlReason: force ? "force cancel requested" : "cancel requested",
      forceCancel: force,
      forceCanceledJobId: force ? runState.currentJobId || "" : runState.forceCanceledJobId || "",
      forceCanceledAt: force ? nowIso() : runState.forceCanceledAt || "",
      terminatedProcessCount,
      updatedAt: nowIso(),
    };
    const updated = updateBatchRecord(batchId, {status: "canceling", runState: next});
    appendAuditEvent(force ? "batch.cancel.force_requested" : "batch.cancel.requested", "batch", batchId, {
      action: runState.action || "",
      currentJobId: runState.currentJobId || "",
      terminatedProcessCount,
    });
    return summarizeBatch(updated);
  }

  if (normalized === "resume") {
    if (runState.running) throw new Error("Batch is already running");
    const action = runState.action || "generate-plan";
    return startBatchRun(batchId, action, {failedOnly: Boolean(runState.failedOnly)});
  }

  throw new Error(`Unsupported batch control: ${command}`);
}

function findJob(jobId) {
  const id = String(jobId || "");
  return (
    runtimeJobs.get(id) ||
    persistedJobs.get(id) ||
    [...runtimeJobs.values(), ...persistedJobs.values()].find((job) => job?.id === id) ||
    null
  );
}

function removeJobFromMaps(jobId) {
  for (const map of [runtimeJobs, persistedJobs]) {
    if (map.delete(jobId)) continue;
    for (const [key, job] of map.entries()) {
      if (job?.id === jobId) {
        map.delete(key);
        break;
      }
    }
  }
}

function resolveSafeJobDirectory(job) {
  const root = path.resolve(JOB_ROOT);
  const requestedOutputDir = String(job.outputDir || "").trim();
  const target = requestedOutputDir
    ? path.resolve(WORKSPACE_ROOT, requestedOutputDir)
    : path.resolve(JOB_ROOT, String(job.id || ""));
  const rootReal = fs.existsSync(root) ? fs.realpathSync(root) : root;
  if (!fs.existsSync(target)) {
    throw new Error("Job directory not found");
  }
  const targetReal = fs.realpathSync(target);
  if (targetReal === rootReal) {
    throw new Error("Refusing to delete jobs root");
  }
  const prefix = rootReal.endsWith(path.sep) ? rootReal : `${rootReal}${path.sep}`;
  if (!targetReal.startsWith(prefix)) {
    throw new Error("Refusing to delete outside data/jobs");
  }
  return targetReal;
}

function deleteJobAndArtifacts(jobId) {
  const job = findJob(jobId);
  if (!job) throw new Error("job not found");
  if (job.pipelineRunning || job.codexRunning || activeJobProcesses.has(job.id)) {
    throw new Error("Job is running and cannot be deleted");
  }
  const targetDir = resolveSafeJobDirectory(job);
  fs.rmSync(targetDir, {recursive: true, force: true});
  removeJobFromMaps(job.id);
  appendAuditEvent("job.deleted", "job", job.id, {
    title: job.title || "",
    outputDir: relativeWorkspacePath(targetDir),
  });
  return {
    deleted: true,
    id: job.id,
    outputDir: relativeWorkspacePath(targetDir),
  };
}

function writeJson(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function writeText(res, code, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(code, {"Content-Type": contentType});
  res.end(text);
}

function parseBody(req, options = {}) {
  const limitBytes = Number(options.limitBytes || 1_000_000);
  return new Promise((resolve, reject) => {
    const chunks = [];
    let byteLength = 0;
    req.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buffer);
      byteLength += buffer.length;
      if (byteLength > limitBytes) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".mp4":
      return "video/mp4";
    case ".mp3":
      return "audio/mpeg";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".svg":
      return "image/svg+xml; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    writeText(res, 404, "Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": getMimeType(filePath),
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(res);
}

function getMonitorPythonCommand() {
  return fs.existsSync(MONITOR_VENV_PYTHON) ? MONITOR_VENV_PYTHON : PYTHON_COMMAND;
}

function runMonitorPythonJson(inlineScript) {
  return new Promise((resolve, reject) => {
    const pythonCommand = getMonitorPythonCommand();
    const child =
      process.platform === "win32"
        ? spawn(
            POWERSHELL_COMMAND,
            [
              "-NoProfile",
              "-Command",
              `$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; Set-Location '${MONITOR_ROOT.replaceAll("'", "''")}'; @'\n${inlineScript}\n'@ | & '${pythonCommand.replaceAll("'", "''")}' -`,
            ],
            {
              cwd: MONITOR_ROOT,
              env: {
                ...process.env,
                PYTHONIOENCODING: "utf-8",
                PYTHONUTF8: "1",
              },
              windowsHide: true,
            },
          )
        : spawn(pythonCommand, ["-c", inlineScript], {
            cwd: MONITOR_ROOT,
            env: {
              ...process.env,
              PYTHONIOENCODING: "utf-8",
              PYTHONUTF8: "1",
            },
            windowsHide: true,
          });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `monitor process failed with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`invalid monitor response: ${error.message}`));
      }
    });
  });
}

function fetchMonitorStats(options = {}) {
  const skipYoutube = options.skipYoutube ? "True" : "False";
  const skipTiktok = options.skipTiktok ? "True" : "False";
  const inlineScript = `
import asyncio
import json
import sys
from pathlib import Path

root = Path(${JSON.stringify(MONITOR_ROOT)})
sys.path.insert(0, str(root))

from social_stats.collect import fetch_all_stats
from social_stats.settings import load_settings

settings = load_settings(Path(${JSON.stringify(MONITOR_CONFIG_FILE)}))
payload = asyncio.run(
    fetch_all_stats(
        settings,
        skip_youtube=${skipYoutube},
        skip_tiktok=${skipTiktok},
    )
)
sys.stdout.write(json.dumps(payload, ensure_ascii=False))
`;

  return runMonitorPythonJson(inlineScript);
}

function listMonitorAccounts() {
  const text = fs.readFileSync(MONITOR_CONFIG_FILE, "utf8");
  return Promise.resolve({
    configPath: MONITOR_CONFIG_FILE,
    youtubeChannels: readMonitorConfigList(text, "youtube", "channels"),
    tiktokUsers: readMonitorConfigList(text, "tiktok", "users").map((item) => item.replace(/^@+/, "")),
  });
}

function updateMonitorAccounts(action, platform, account) {
  if (!["youtube", "tiktok"].includes(platform)) {
    return Promise.reject(new Error("platform must be youtube or tiktok"));
  }
  if (!["add", "remove"].includes(action)) {
    return Promise.reject(new Error("unsupported action"));
  }

  const normalized = normalizeMonitorAccount(platform, account);
  const text = fs.readFileSync(MONITOR_CONFIG_FILE, "utf8");
  const sectionKey = platform === "youtube" ? "youtube" : "tiktok";
  const fieldKey = platform === "youtube" ? "channels" : "users";
  let items = readMonitorConfigList(text, sectionKey, fieldKey);

  if (action === "add") {
    if (!items.includes(normalized)) items.push(normalized);
  } else {
    items = items.filter((item) => item !== normalized);
  }

  const nextText = writeMonitorConfigList(text, sectionKey, fieldKey, items);
  fs.writeFileSync(MONITOR_CONFIG_FILE, nextText, "utf8");

  return Promise.resolve({
    configPath: MONITOR_CONFIG_FILE,
    youtubeChannels: readMonitorConfigList(nextText, "youtube", "channels"),
    tiktokUsers: readMonitorConfigList(nextText, "tiktok", "users").map((item) => item.replace(/^@+/, "")),
    normalizedAccount: normalized,
  });
}

function unquoteYamlScalar(value = "") {
  const text = String(value || "").trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function findMonitorSectionRange(lines, section) {
  const start = lines.findIndex((line) => line.trim() === `${section}:`);
  if (start < 0) return {start: -1, end: -1};
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^[A-Za-z0-9_-]+:\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return {start, end};
}

function readMonitorConfigList(text, section, key) {
  const lines = String(text || "").split(/\r?\n/);
  const {start, end} = findMonitorSectionRange(lines, section);
  if (start < 0) return [];
  const keyLine = lines.findIndex((line, index) => index > start && index < end && line.trim() === `${key}:`);
  if (keyLine < 0) return [];
  const items = [];
  for (let i = keyLine + 1; i < end; i += 1) {
    const line = lines[i];
    if (/^\s{2,4}-\s*/.test(line)) {
      items.push(unquoteYamlScalar(line.replace(/^\s{2,4}-\s*/, "")));
      continue;
    }
    if (line.trim() === "" || /^\s*#/.test(line)) continue;
    if (/^\s{2}[A-Za-z0-9_-]+:\s*/.test(line) || /^[A-Za-z0-9_-]+:\s*$/.test(line)) break;
  }
  return items;
}

function writeMonitorConfigList(text, section, key, items) {
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = String(text || "").split(/\r?\n/);
  const {start, end} = findMonitorSectionRange(lines, section);
  if (start < 0) {
    throw new Error(`section not found: ${section}`);
  }
  const keyLine = lines.findIndex((line, index) => index > start && index < end && line.trim() === `${key}:`);
  const serializedItems = items.map((item) => `  - ${JSON.stringify(item)}`);

  if (keyLine < 0) {
    const block = [`  ${key}:`, ...serializedItems];
    lines.splice(end, 0, ...block);
    return lines.join(newline);
  }

  let listEnd = keyLine + 1;
  while (listEnd < end) {
    const line = lines[listEnd];
    if (/^\s{2,4}-\s*/.test(line) || line.trim() === "" || /^\s*#/.test(line)) {
      listEnd += 1;
      continue;
    }
    break;
  }
  lines.splice(keyLine + 1, listEnd - (keyLine + 1), ...serializedItems);
  return lines.join(newline);
}

function normalizeMonitorAccount(platform, account) {
  const raw = String(account || "").trim();
  if (!raw) {
    throw new Error("account is required");
  }

  if (platform === "youtube") {
    let text = raw.replace(/^https?:\/\/(www\.)?youtube\.com\//i, "");
    if (text.startsWith("channel/")) return text.split("/", 2)[1].trim();
    if (text.startsWith("c/") || text.startsWith("user/")) {
      return `@${text.split("/", 2)[1].trim().replace(/^@+/, "")}`;
    }
    if (text.includes("/")) {
      text = text.split("/").filter(Boolean).pop() || text;
    }
    if (text.startsWith("UC")) return text;
    return `@${text.replace(/^@+/, "")}`;
  }

  let text = raw.replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, "");
  text = text.split("?", 1)[0].trim().replace(/\/+$/, "");
  if (text.includes("/")) {
    text = text.split("/").filter(Boolean).pop() || text;
  }
  return text.replace(/^@+/, "");
}

function serveMonitorIndex(res) {
  const filePath = path.join(MONITOR_WEB_ROOT, "index.html");
  fs.readFile(filePath, "utf8", (error, source) => {
    if (error) {
      writeJson(res, error.code === "ENOENT" ? 404 : 500, {
        error: error.code === "ENOENT" ? "monitor page not found" : error.message,
      });
      return;
    }
    const html = source
      .replaceAll('href="/static/', 'href="/monitor/static/')
      .replaceAll('src="/static/', 'src="/monitor/static/')
      .replaceAll('fetch("/api/stats', 'fetch("/api/monitor/stats');
    writeText(res, 200, html, "text/html; charset=utf-8");
  });
}

function serveMonitorAsset(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    writeText(res, 404, "Not found");
    return;
  }
  if (path.basename(filePath) !== "app.js") {
    serveFile(res, filePath);
    return;
  }
  fs.readFile(filePath, "utf8", (error, source) => {
    if (error) {
      writeText(res, 500, error.message);
      return;
    }
    const script = source.replaceAll("/api/stats", "/api/monitor/stats");
    writeText(res, 200, script, "application/javascript; charset=utf-8");
  });
}

function resolveWorkspacePath(urlPath) {
  const relative = decodeURIComponent(urlPath.replace(/^\/workspace\//, ""));
  const resolved = path.resolve(WORKSPACE_ROOT, relative);
  if (!resolved.startsWith(WORKSPACE_ROOT)) return null;
  return resolved;
}

function resolveVideoPublicPath(urlPath) {
  const relative = decodeURIComponent(urlPath.replace(/^\/+/, ""));
  const resolved = path.resolve(VIDEO_PUBLIC_ROOT, relative);
  if (!resolved.startsWith(VIDEO_PUBLIC_ROOT)) return null;
  return resolved;
}

function broadcastSnapshot(job) {
  const clients = sseClients.get(job.id);
  if (!clients?.size) return;
  const payload = JSON.stringify(detailFromJob(job));
  for (const res of clients) {
    res.write("event: snapshot\n");
    res.write(`data: ${payload}\n\n`);
  }
}

function pushLog(job, line) {
  job.logs.push(`[${nowIso()}] ${line}`);
  job.updatedAt = nowIso();
  const clients = sseClients.get(job.id);
  if (clients?.size) {
    const payload = JSON.stringify({line: job.logs[job.logs.length - 1]});
    for (const res of clients) {
      res.write("event: log\n");
      res.write(`data: ${payload}\n\n`);
    }
  }
  broadcastSnapshot(job);
}

function attachMessage(job, role, meta, text) {
  job.messages.push({role, meta, text});
  job.updatedAt = nowIso();
}

function setPendingAssistant(job, text) {
  job.pendingAssistantText = text;
  job.updatedAt = nowIso();
  broadcastSnapshot(job);
}

function buildCodexPrompt(job, latestMessage) {
  const account = getAccount(job.accountId);
  const template = getTemplateCatalogEntry(job.templateId);
  const presetSummary = ensureArray(job.activePresetIds)
    .map((presetId) => getInstructionPresets().find((preset) => preset.id === presetId))
    .filter(Boolean)
    .map((preset) => `${preset.label}: ${preset.prompt}`)
    .join("\n");
  const recentMessages = ensureArray(job.messages)
    .slice(-8)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`)
    .join("\n");
  const availableTemplates = listTemplates()
    .slice(0, 8)
    .map((template) => `${template.id}: ${template.title}`)
    .join("\n");
  const availableCompositions = listCompositions().join(", ");

  return [
    "You are Codex replying inside a local web console for a video-generation workspace.",
    "Reply in Chinese unless the user clearly asks for another language.",
    "Be concise and practical.",
    "Do not claim that you rendered video, edited files, or generated assets unless this exact run actually did that.",
    "",
    `Workspace: ${WORKSPACE_ROOT}`,
    `Current job title: ${job.title}`,
    `Current account: ${account ? `${account.name} / ${account.persona}` : "None"}`,
    `Current template: ${job.templateId}`,
    `Current composition: ${job.compositionId || "None"}`,
    `Current status: ${job.status}`,
    `Current duration: ${job.durationSec || 60}s`,
    `Current aspect ratio: ${job.aspectRatio || "9:16"}`,
    `Output directory: ${job.outputDir}`,
    "",
    "Active instruction presets:",
    presetSummary || "None",
    "",
    `Open instruction: ${job.openInstruction || "None"}`,
    "",
    "Available templates:",
    availableTemplates || "None",
    "",
    "Available Remotion compositions:",
    availableCompositions || "None",
    "",
    "Recent conversation:",
    recentMessages || "No previous messages",
    "",
    `Latest user message: ${latestMessage}`,
    "",
    "Answer the latest user message directly.",
  ].join("\n");
}

function buildCodexBaseArgs() {
  const args = ["--json", "--model", getCurrentCodexModel(), "--skip-git-repo-check"];
  if (CODEX_BYPASS_SANDBOX) {
    args.unshift("--dangerously-bypass-approvals-and-sandbox");
  } else {
    args.push("--sandbox", "read-only");
  }
  return args;
}

function buildCodexArgs(job, outputFile) {
  if (job.codexSessionId) {
    return ["exec", "resume", ...buildCodexBaseArgs(), "-o", outputFile, job.codexSessionId];
  }
  return ["exec", ...buildCodexBaseArgs(), "-C", WORKSPACE_ROOT, "-o", outputFile];
}

function resolveCodexCommand() {
  const homeCandidates = [USER_HOME, process.env.USERPROFILE || "", process.env.HOME || "", os.homedir() || ""].filter(Boolean);
  const appDataCandidates = [
    process.env.APPDATA || "",
    ...homeCandidates.map((home) => path.join(home, "AppData", "Roaming")),
    path.join("C:", "Users", "81422", "AppData", "Roaming"),
  ].filter(Boolean);
  const exeCandidates = [
    ...appDataCandidates.map((appData) => path.join(appData, "npm", "codex.cmd")),
    ...appDataCandidates.map((appData) => path.join(appData, "npm", "codex")),
    LOCAL_CODEX_EXE,
    ...homeCandidates.map((home) => path.join(home, "AppData", "Local", "OpenAI", "Codex", "bin", "codex.exe")),
    path.join("C:", "Users", "81422", "AppData", "Local", "OpenAI", "Codex", "bin", "codex.exe"),
  ];
  for (const candidate of exeCandidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return process.platform === "win32" ? (CODEX_COMMAND || "codex.exe") : (CODEX_COMMAND || "codex");
}

function extractCodexErrorMessage(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (payload.type === "error" && payload.error?.message) return String(payload.error.message);
  if (payload.error?.message) return String(payload.error.message);
  if (typeof payload.message === "string" && String(payload.type || "").includes("error")) return payload.message;
  return "";
}

function formatCodexFailureMessage(prefix, detail = "") {
  const normalizedDetail = String(detail || "").trim();
  return normalizedDetail ? `${prefix}: ${normalizedDetail}` : prefix;
}

function createCodexDiagnostics(kind, job, promptText = "") {
  return {
    kind,
    startedAt: Date.now(),
    promptLength: String(promptText || "").length,
    promptKind: job?.codexSessionId ? "resume" : "exec",
    command: resolveCodexCommand(),
    sessionId: job?.codexSessionId || "",
    stdoutBytes: 0,
    stderrBytes: 0,
    stdoutLines: 0,
    stderrLines: 0,
    jsonEvents: 0,
    textEvents: 0,
    threadStarted: false,
    turnStarted: false,
    firstAgentMessage: false,
    completionSignal: false,
    lastEventType: "",
    lastCodexError: "",
    lastTextLine: "",
    lastThreadId: "",
    lastChunkAt: 0,
    lastEventAt: 0,
  };
}

function describeCodexTimeout(diagnostics, timeoutMs) {
  const lines = [];
  const phase = diagnostics.threadStarted
    ? diagnostics.turnStarted
      ? diagnostics.firstAgentMessage
        ? "已收到首个回复，等待收尾"
        : "已进入对话轮次，等待首个回复"
      : "线程已启动，等待 turn.started"
    : "尚未进入 thread.started";
  lines.push(`阶段：${phase}`);
  lines.push(`超时：${timeoutMs}ms`);
  lines.push(`命令：${diagnostics.command || "unknown"}`);
  lines.push(`输入长度：${diagnostics.promptLength || 0} 字符`);
  lines.push(`事件：JSON ${diagnostics.jsonEvents || 0} 条 / 文本 ${diagnostics.textEvents || 0} 条`);
  if (diagnostics.lastThreadId) lines.push(`线程：${diagnostics.lastThreadId}`);
  if (diagnostics.lastCodexError) lines.push(`最后错误：${diagnostics.lastCodexError}`);
  if (diagnostics.lastTextLine && diagnostics.lastTextLine !== diagnostics.lastCodexError) {
    lines.push(`最后输出：${diagnostics.lastTextLine}`);
  }
  if (diagnostics.stdoutBytes || diagnostics.stderrBytes) {
    lines.push(`输出量：stdout ${diagnostics.stdoutBytes}B / stderr ${diagnostics.stderrBytes}B`);
  }
  if (diagnostics.lastChunkAt) {
    const silenceMs = Math.max(0, Date.now() - diagnostics.lastChunkAt);
    lines.push(`静默：${silenceMs}ms`);
  }
  return lines.join("；");
}

function updateCodexDiagnosticsFromLine(diagnostics, line, source = "stdout") {
  const text = String(line || "").trim();
  if (!text) return;
  diagnostics.textEvents += 1;
  diagnostics.lastTextLine = text;
  diagnostics.lastEventType = source;
  diagnostics.lastEventAt = Date.now();
  diagnostics.lastChunkAt = Date.now();
  if (!diagnostics.lastCodexError && /(error|failed|denied|forbidden|unauthorized|timed out)/i.test(text)) {
    diagnostics.lastCodexError = text;
  }
}

function updateCodexDiagnosticsFromPayload(diagnostics, payload) {
  diagnostics.jsonEvents += 1;
  diagnostics.lastEventType = payload?.type || "json";
  diagnostics.lastEventAt = Date.now();
  diagnostics.lastChunkAt = Date.now();
  if (payload?.thread_id) diagnostics.lastThreadId = String(payload.thread_id);
  if (payload?.type === "thread.started") diagnostics.threadStarted = true;
  if (payload?.type === "turn.started") diagnostics.turnStarted = true;
  if (payload?.type === "turn.completed") diagnostics.completionSignal = true;
  if (payload?.type === "item.completed" && payload.item?.type === "agent_message" && payload.item?.text) {
    diagnostics.firstAgentMessage = true;
  }
  const errorMessage = extractCodexErrorMessage(payload);
  if (errorMessage) diagnostics.lastCodexError = errorMessage;
}

function spawnCodexProcess(args, promptText = "") {
  const command = resolveCodexCommand();
  const needsShell = process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
  const child = spawn(command, args, {
    cwd: WORKSPACE_ROOT,
    env: {
      ...process.env,
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8",
    },
    shell: needsShell,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stdin?.end(String(promptText || ""), "utf8");
  return child;
}

function checkCodexRuntime({force = false} = {}) {
  const cached = codexRuntimeCache.payload;
  if (!force && cached && Date.now() - codexRuntimeCache.checkedAt < 30000) {
    return Promise.resolve(cached);
  }

  const command = resolveCodexCommand();
  const exists = path.isAbsolute(command) ? fs.existsSync(command) : null;
  const startedAt = Date.now();
  const payloadBase = {
    command,
    exists,
    checkedAt: nowIso(),
  };

  return new Promise((resolve) => {
    let settled = false;
    let stdoutText = "";
    let stderrText = "";
    let child = null;

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      const nextPayload = {
        ...payloadBase,
        latencyMs: Date.now() - startedAt,
        ...payload,
      };
      codexRuntimeCache.checkedAt = Date.now();
      codexRuntimeCache.payload = nextPayload;
      resolve(nextPayload);
    };

    try {
      const needsShell = process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
      child = spawn(command, ["-V"], {
        cwd: WORKSPACE_ROOT,
        env: {
          ...process.env,
          PYTHONUTF8: "1",
          PYTHONIOENCODING: "utf-8",
        },
        shell: needsShell,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch (error) {
      finish({ok: false, error: error.message, code: error.code || ""});
      return;
    }

    const timeout = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      finish({ok: false, error: "Codex CLI health check timed out", code: "TIMEOUT"});
    }, 8000);

    child.stdout.on("data", (chunk) => {
      stdoutText += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderrText += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      finish({ok: false, error: error.message, code: error.code || ""});
    });
    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      if (settled) return;
      const version = `${stdoutText}\n${stderrText}`.trim();
      if (code === 0) {
        finish({ok: true, version, code: "OK"});
        return;
      }
      finish({
        ok: false,
        version,
        error: version || `Codex CLI exited with code ${code}${signal ? ` signal ${signal}` : ""}`,
        code: code === null ? signal || "UNKNOWN" : String(code),
      });
    });
  });
}

function cleanCodexLogLine(line) {
  const text = String(line || "").trim();
  if (!text) return "";
  if (text.startsWith("{") && text.endsWith("}")) return "";
  if (text === "Reading additional input from stdin...") return "";
  if (/^(width|height|viewBox|fill|xmlns|strokeWidth|class)=/i.test(text)) return "";
  if (text === ">" || text === "/>" || text === "<svg" || text === "</svg>") return "";
  if (text.startsWith("<")) return "";
  if (text.includes("cf_chl_opt") || text.includes("challenge-platform") || text.includes("Enable JavaScript and cookies")) {
    return "";
  }
  if (text.includes("WARN codex_core_skills::loader")) return "";
  if (text.includes("WARN codex_core::plugins::manifest")) return "";
  if (text.includes("failed to load skill")) return "";
  if (text.includes("<html>") || text.includes("cdn-cgi/challenge-platform")) return "codex: suppressed noisy HTML warning output";
  if (text.length > 220) return `${text.slice(0, 220)}...`;
  return text;
}

function handleCodexEvent(job, payload) {
  if (payload.type === "thread.started") {
    if (payload.thread_id && job.codexSessionId !== payload.thread_id) {
      job.codexSessionId = payload.thread_id;
      pushLog(job, `codex: bound local session ${payload.thread_id}`);
    } else {
      pushLog(job, `codex: thread started ${payload.thread_id}`);
    }
    setPendingAssistant(job, "Codex 已连接，正在读取上下文...");
    return;
  }

  if (payload.type === "turn.started") {
    pushLog(job, "codex: turn started");
    setPendingAssistant(job, "Codex 正在组织回复...");
    return;
  }

  if (payload.type === "item.completed" && payload.item?.type === "agent_message") {
    setPendingAssistant(job, "Codex 已生成回复，正在整理结果...");
    return;
  }

  if (payload.type === "turn.completed") {
    pushLog(
      job,
      `codex: turn completed input_tokens=${payload.usage?.input_tokens ?? 0} output_tokens=${payload.usage?.output_tokens ?? 0}`,
    );
  }
}

function tryReadLastMessage(outputFile) {
  const text = safeReadText(outputFile).trim();
  return text || "";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function registerJobProcess(job, label, child) {
  if (!job?.id || !child) return () => {};
  const entry = {
    label,
    child,
    pid: child.pid || 0,
    startedAt: nowIso(),
  };
  const set = activeJobProcesses.get(job.id) || new Set();
  set.add(entry);
  activeJobProcesses.set(job.id, set);
  const unregister = () => {
    const current = activeJobProcesses.get(job.id);
    if (!current) return;
    current.delete(entry);
    if (!current.size) activeJobProcesses.delete(job.id);
  };
  child.on("close", unregister);
  child.on("exit", unregister);
  child.on("error", unregister);
  return unregister;
}

function terminateChildProcessTree(entry) {
  const child = entry?.child;
  if (!child) return false;
  const pid = Number(entry.pid || child.pid || 0);
  try {
    if (process.platform === "win32" && pid) {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.on("error", () => {
        try {
          child.kill();
        } catch {}
      });
    } else {
      child.kill("SIGTERM");
      setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {}
      }, 1500).unref?.();
    }
    return true;
  } catch {
    try {
      child.kill();
      return true;
    } catch {
      return false;
    }
  }
}

function terminateJobProcesses(jobId, reason = "canceled by request") {
  const id = String(jobId || "");
  if (!id) return 0;
  jobTerminationRequests.set(id, {reason, requestedAt: nowIso()});
  const entries = [...(activeJobProcesses.get(id) || [])];
  const job = findJob(id);
  if (job) {
    pushLog(job, `control: terminating ${entries.length} active process(es) (${reason})`);
  }
  return entries.reduce((count, entry) => count + (terminateChildProcessTree(entry) ? 1 : 0), 0);
}

function getJobTerminationRequest(jobId) {
  return jobTerminationRequests.get(String(jobId || "")) || null;
}

function clearJobTerminationRequest(jobId) {
  jobTerminationRequests.delete(String(jobId || ""));
}

function splitLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function clipText(text, max = 110) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function normalizeInlineText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function cleanTopicCandidate(value) {
  const cleaned = normalizeInlineText(value)
    .replace(/^["'“”‘’《》]+|["'“”‘’《》]+$/g, "")
    .replace(/^(关于|围绕|以|做一期|做一条|生成一条|生成一个|制作一条|制作一个)/, "")
    .replace(/(的视频|短视频|竖屏视频|横屏视频|内容)$/g, "")
    .replace(/[。；;，,：:]+$/g, "")
    .trim();
  return clipText(cleaned, 24);
}

function isWeakTopicCandidate(value) {
  const topic = cleanTopicCandidate(value);
  if (!topic) return true;
  const lower = topic.toLowerCase();
  const chineseChars = (topic.match(/[\u4e00-\u9fff]/g) || []).length;
  const asciiOnly = /^[\x00-\x7f]+$/.test(topic);
  const genericPlatformTopics = new Set([
    "youtube",
    "bilibili",
    "douyin",
    "tiktok",
    "shorts",
    "reels",
    "instagram",
    "xhs",
    "xiaohongshu",
    "video",
    "videos",
  ]);
  if (genericPlatformTopics.has(lower)) return true;
  if (asciiOnly && !/^[A-Z0-9]{2,6}$/.test(topic) && topic.length <= 8) return true;
  if (chineseChars < 2 && topic.length <= 4 && !/^(MACD|K线|RSI)$/i.test(topic)) return true;
  return false;
}

function inferPrimaryTopic(prompt) {
  const cleaned = normalizeInlineText(prompt);
  if (!cleaned) return "当前主题";

  const labeledPatterns = [
    /(?:主题|选题|题目)\s*(?:是|为|:|：)\s*([^。；;\n，,]+)/i,
    /视频任务\s*[：:]\s*([^。；;\n，,]+)/i,
    /同一选题生成一条视频任务\s*[：:]\s*([^。；;\n，,]+)/i,
    /(?:关于|围绕)\s*([^。；;\n，,]+?)(?:的)?(?:短视频|视频|内容|$)/i,
  ];

  for (const pattern of labeledPatterns) {
    const match = cleaned.match(pattern);
    const candidate = cleanTopicCandidate(match?.[1] || "");
    if (candidate) return candidate;
  }

  const knownTopics = [
    "MACD顶背离",
    "MACD底背离",
    "顶背离",
    "底背离",
    "假突破",
    "突破失败",
    "支撑压力位",
    "支撑位",
    "压力位",
    "仓位管理",
    "量能背离",
    "量价背离",
    "K线",
    "MACD",
  ];
  const matchedTopic = knownTopics.find((topic) => cleaned.includes(topic));
  if (matchedTopic) return matchedTopic;

  const clauses = cleaned
    .split(/[。；;\n]/)
    .map((item) => cleanTopicCandidate(item))
    .filter(Boolean)
    .filter((item) => !/(生成|制作|平台|语气|适合|视频需要|需要包含|时长|比例|竖屏|横屏)/.test(item));

  return clauses[0] || clipText(cleanTopicCandidate(cleaned), 24) || "当前主题";
}

function inferJobTopic(job) {
  return inferPrimaryTopic(job?.topicTitle || job?.prompt || job?.title || "");
}

function getSafeTopicLabel(job, candidate, fallback = "当前主题") {
  const topic = cleanTopicCandidate(candidate || "");
  const fallbackTopic = cleanTopicCandidate(
    fallback || getTemplateCatalogEntry(job?.templateId)?.title || job?.title || "当前主题",
  );
  if (!topic) return fallbackTopic || "当前主题";
  if (isWeakTopicCandidate(topic)) return fallbackTopic || "当前主题";
  if (hasPromptLeakText(job, topic)) return fallbackTopic || "当前主题";
  return topic;
}

const promptLeakPatterns = [
  /生成(?:一个|一条|一段|这个)?\s*\d*\s*(?:秒|分钟)?\s*(?:竖屏|横屏)?[^。；;\n]{0,18}(?:视频|短视频)/,
  /(?:制作|做)(?:一个|一条|一段)?\s*\d*\s*(?:秒|分钟)?\s*(?:竖屏|横屏)?[^。；;\n]{0,18}(?:视频|短视频)/,
  /平台\s*(?:是|为|:|：)/,
  /语气\s*(?:要|是|为|:|：)/,
  /视频\s*(?:需要|要)?\s*包含/,
  /适合[^。；;\n]{0,20}(?:用户|新手|观众|交易者)/,
  /写清楚(?:主题|平台|时长|风格)?/,
  /额外要求\s*(?:是|为|:|：)/,
  /账号人设\s*(?:是|为|:|：)/,
  /当前账号风格|当前模板/,
  /表达风格/,
  /强\s*Hook|强Hook|口语化|节奏快|交易信号教学|冷静交易老师/,
  /小红书|抖音|B站|YouTube\s*Shorts/i,
  /Context|Sentiment|Consequence|Core\s*Mechanism/i,
  /\b(?:RISK|FIRST|THEN|ACTION)\b/i,
  /\bCase\s*\d+\b/i,
  /new_signals|codex-job|xiaohongshu|Output\s*->|data\/jobs|renderCompositionId|templateId/i,
];

function hasPromptLeakText(job, text) {
  const value = normalizeInlineText(text);
  if (!value) return false;
  if (promptLeakPatterns.some((pattern) => pattern.test(value))) return true;

  const prompt = normalizeInlineText(job?.prompt || "");
  if (!prompt || prompt.length < 12) return false;
  const promptFragments = prompt
    .split(/[。；;\n]/)
    .map((fragment) => normalizeInlineText(fragment))
    .filter((fragment) => fragment.length >= 10);
  return promptFragments.some((fragment) => value.includes(fragment.slice(0, Math.min(fragment.length, 28))));
}

function safeDisplayText(job, value, fallback, max = 110) {
  const candidate = clipText(value, max);
  const fallbackText = clipText(fallback, max);
  if (!candidate || hasPromptLeakText(job, candidate)) {
    return hasPromptLeakText(job, fallbackText) ? "" : fallbackText;
  }
  return candidate;
}

function pickAccentWords(text, fallback = []) {
  const matches = String(text || "").match(/[\u4e00-\u9fffA-Za-z0-9]{2,8}/g) || [];
  const unique = [];
  for (const token of [...fallback, ...matches]) {
    const normalized = String(token).trim();
    if (!normalized || unique.includes(normalized)) continue;
    unique.push(normalized);
    if (unique.length >= 3) break;
  }
  return unique;
}

function buildVoiceoverUnits(job, plan) {
  const topic = getSafeTopicLabel(job, plan.topic || inferJobTopic(job));
  const topicPhrase = topic && topic !== "当前主题" ? topic : "这件事";
  const hookLine = plan.scriptSections.find((section) => section.label === "Hook")?.text || "先说最关键的判断。";
  const bodyLine = plan.scriptSections.find((section) => section.label === "Body")?.text || "把注意力收束到最核心的一步。";
  const closeLine = plan.scriptSections.find((section) => section.label === "Close")?.text || "最后给出一个明确动作。";
  const emphasisSeed = pickAccentWords(plan.headline);

  return [
    {
      voiceId: "v01",
      visualSectionId: "news_context",
      text: `${plan.headline}。`,
      emphasisWords: pickAccentWords(plan.headline, emphasisSeed),
    },
    {
      voiceId: "v02",
      visualSectionId: "case_shock",
      text: hookLine,
      emphasisWords: pickAccentWords(hookLine, emphasisSeed),
    },
    {
      voiceId: "v03",
      visualSectionId: "indicator_mechanism",
      text: `先把${topicPhrase}拆成一个能执行的判断顺序。${bodyLine}`,
      emphasisWords: pickAccentWords(bodyLine, emphasisSeed),
    },
    {
      voiceId: "v04",
      visualSectionId: "chart_case_1",
      text: "第一步，先看结构位置，不要在情绪最热的时候直接追进去。",
      emphasisWords: ["第一步", "结构位置"],
    },
    {
      voiceId: "v05",
      visualSectionId: "chart_case_2",
      text: "第二步，再看量能、动能或者内部证据有没有同步跟上。",
      emphasisWords: ["第二步", "量能", "动能"],
    },
    {
      voiceId: "v06",
      visualSectionId: "chart_case_3",
      text: "第三步，只在确认动作出现以后，再决定要不要执行。",
      emphasisWords: ["第三步", "确认动作"],
    },
    {
      voiceId: "v07",
      visualSectionId: "checklist",
      text: "不要把预警当成动作，把判断顺序做对，节奏就会稳很多。",
      emphasisWords: ["预警", "判断顺序"],
    },
    {
      voiceId: "v08",
      visualSectionId: "risk_close",
      text: closeLine,
      emphasisWords: pickAccentWords(closeLine, emphasisSeed),
    },
  ];
}

function buildStructuredPlanPrompt(job) {
  const account = getAccount(job.accountId);
  const template = getTemplateCatalogEntry(job.templateId);
  const prompt = String(job.prompt || "").trim();
  const topic = getSafeTopicLabel(job, inferJobTopic(job));
  const presetSummary = ensureArray(job.activePresetIds)
    .map((presetId) => getInstructionPresets().find((preset) => preset.id === presetId))
    .filter(Boolean)
    .map((preset) => `${preset.label}: ${preset.prompt}`)
    .join("\n");

  const schemaExample = {
    headline: "假突破最危险的地方",
    toneSummary: "冷静交易老师，强 Hook，节奏快",
    scriptSections: [
      {label: "Hook", text: "很多假突破不是机会，而是你进场太早。"},
      {label: "Body", text: "先看结构，再看量能和内部证据，最后只等确认动作。"},
      {label: "Close", text: "把预警和执行分开，最后只保留一个明确动作。"},
    ],
    newsBullets: ["先点出核心风险", "把判断顺序拆成三步", "保留一个可执行结论"],
    caseTitles: ["先看位置", "再看内部证据", "最后等确认动作"],
    caseTakeaways: ["不要在最热的时候追进去", "表面强不等于内部同步", "确认以后再执行"],
    checklistSteps: ["先看结构位置", "再看内部证据", "最后等确认动作"],
    subtitleLead: "先等回踩确认，再判断量能是否跟上。",
    closeHeadline: "真正有价值的不是更早动作，而是更早发现风险。",
  };

  return [
    "You are generating a structured short-video production brief for an existing local video pipeline.",
    "Return JSON only. No markdown fences. No commentary.",
    "All text fields inside the JSON must be in Chinese.",
    "Keep every string concise and production-ready.",
    "",
    `Workspace: ${WORKSPACE_ROOT}`,
    `User prompt: ${prompt}`,
    `Extracted video topic: ${topic}`,
    `Account: ${account ? `${account.name} / ${account.persona}` : "None"}`,
    `Template: ${template ? `${template.title} / ${job.templateId}` : job.templateId}`,
    `Composition: ${job.compositionId || "codex-job-preview"}`,
    `Duration seconds: ${job.durationSec || 60}`,
    `Aspect ratio: ${job.aspectRatio || "9:16"}`,
    `Active presets:\n${presetSummary || "None"}`,
    `Open instruction: ${job.openInstruction || "None"}`,
    "",
    "Return a JSON object matching this shape exactly:",
    JSON.stringify(schemaExample, null, 2),
    "",
    "Requirements:",
    `- Treat "${topic}" as the video topic. Do not copy the full User prompt into any output field.`,
    "- If the topic is still too close to the user prompt, shorten it further and rewrite it as a neutral subject label.",
    "- Do not include instruction text such as platform, tone, duration, or production requirements in on-screen copy.",
    "- scriptSections must contain exactly Hook, Body, Close in that order.",
    "- newsBullets, caseTitles, caseTakeaways, checklistSteps must each contain exactly 3 items.",
    "- Do not include any extra keys.",
  ].join("\n");
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    throw new Error("Empty structured response");
  }
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Structured response did not contain a JSON object");
  }
  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

function normalizeStructuredSections(inputSections, fallbackSections) {
  const requestedOrder = ["Hook", "Body", "Close"];
  const sections = Array.isArray(inputSections) ? inputSections : [];
  return requestedOrder.map((label) => {
    const fallback = ensureArray(fallbackSections).find((section) => section?.label === label) || {label, text: ""};
    const match = sections.find((section) => String(section?.label || "").trim().toLowerCase() === label.toLowerCase());
    return {
      label,
      text: clipText(match?.text || fallback.text || "", 120),
    };
  });
}

function sanitizeProductionPlan(job, planInput) {
  const fallback = buildPlanDraft(job);
  const plan = JSON.parse(JSON.stringify(planInput || fallback));
  const topic = getSafeTopicLabel(job, inferJobTopic(job));
  const topicPhrase = topic && topic !== "当前主题" ? topic : "这件事";
  const headline = safeDisplayText(job, plan.headline, fallback.headline, 42);
  const toneSummary = safeDisplayText(job, plan.toneSummary, fallback.toneSummary, 80);
  const scriptSections = normalizeStructuredSections(plan.scriptSections, fallback.scriptSections).map((section, index) => {
    const fallbackText = fallback.scriptSections[index]?.text || section.text;
    return {
      ...section,
      text: safeDisplayText(job, section.text, fallbackText, 120),
    };
  });
  const sectionText = (label, fallbackText = "") =>
    scriptSections.find((section) => section.label === label)?.text || fallbackText;

  plan.headline = headline;
  plan.toneSummary = toneSummary;
  plan.scriptSections = scriptSections;
  plan.meta = {
    ...(fallback.meta || {}),
    ...(plan.meta || {}),
    topic,
    requestedCompositionId: job.compositionId || plan.meta?.requestedCompositionId || "",
    renderCompositionId: "codex-job-preview",
  };
  plan.data = plan.data || fallback.data;
  plan.data.newsContext = plan.data.newsContext || fallback.data.newsContext;
  plan.data.hook = plan.data.hook || fallback.data.hook;
  plan.data.mechanism = plan.data.mechanism || fallback.data.mechanism;
  plan.data.cases = Array.isArray(plan.data.cases) ? plan.data.cases : fallback.data.cases;
  plan.data.checklist = plan.data.checklist || fallback.data.checklist;
  plan.data.close = plan.data.close || fallback.data.close;

  plan.data.newsContext.kicker = "";
  plan.data.newsContext.title = headline;
  plan.data.newsContext.quote = safeDisplayText(
    job,
    plan.data.newsContext.quote,
    `先看结构，再等确认，不要把${topicPhrase}当成马上行动的理由。`,
    64,
  );
  plan.data.newsContext.sourceLabel = "";
  plan.data.newsContext.bullets = ensureArray(plan.data.newsContext.bullets).slice(0, 3).map((item, index) =>
    safeDisplayText(job, item, fallback.data.newsContext.bullets[index] || `记住${topicPhrase}的判断顺序`, 36),
  );
  while (plan.data.newsContext.bullets.length < 3) {
    const index = plan.data.newsContext.bullets.length;
    plan.data.newsContext.bullets.push(fallback.data.newsContext.bullets[index] || `记住${topicPhrase}的判断顺序`);
  }
  plan.data.newsContext.tags = [];
  plan.data.newsContext.mediaCards = [];

  plan.data.hook.headline = headline;
  plan.data.hook.kicker = "";
  plan.data.hook.subheadline = sectionText("Hook", fallback.data.hook.subheadline);
  plan.data.hook.stat = "";
  plan.data.hook.statLabel = safeDisplayText(job, plan.data.hook.statLabel, "先确认，再进场", 18);
  plan.data.hook.dateLabel = safeDisplayText(job, plan.data.hook.dateLabel, "别让一根K线决定动作", 22);
  plan.data.hook.sourceLabel = "";
  plan.data.hook.insetImageSrc = "";
  plan.data.hook.boardLines = [];

  plan.data.mechanism.title = safeDisplayText(
    job,
    plan.data.mechanism.title,
    `把${topicPhrase}还原成一个能执行的判断顺序`,
    42,
  );
  plan.data.mechanism.tag = "";
  plan.data.mechanism.imageSrc = "";
  plan.data.mechanism.description = sectionText("Body", fallback.data.mechanism.description);
  plan.data.mechanism.cards = ensureArray(plan.data.mechanism.cards).slice(0, 4).map((card, index) => {
    const fallbackCard = fallback.data.mechanism.cards[index] || {};
    return {
      ...fallbackCard,
      ...card,
      title: safeDisplayText(job, card?.title, fallbackCard.title || "判断", 12),
      body: safeDisplayText(job, card?.body, fallbackCard.body || "把预警和动作分开。", 42),
    };
  });

  plan.data.cases = plan.data.cases.slice(0, 3).map((item, index) => {
    const fallbackCase = fallback.data.cases[index] || {};
    return {
      ...fallbackCase,
      ...item,
      badge: ["第一步", "第二步", "第三步"][index] || `第 ${index + 1} 步`,
      title: safeDisplayText(job, item?.title, fallbackCase.title || `第 ${index + 1} 步`, 28),
      takeaway: safeDisplayText(job, item?.takeaway, fallbackCase.takeaway || `围绕${topic}做判断。`, 54),
      imageSrc: "",
      bullets: ensureArray(item?.bullets || fallbackCase.bullets).slice(0, 3).map((bullet, bulletIndex) =>
        safeDisplayText(job, bullet, fallbackCase.bullets?.[bulletIndex] || "先判断再执行", 24),
      ),
    };
  });

  plan.data.checklist.title = safeDisplayText(job, plan.data.checklist.title, `一条更稳的${topic}判断顺序`, 36);
  plan.data.checklist.subtitle = safeDisplayText(job, plan.data.checklist.subtitle, "先看结构，再看证据，最后等确认。", 32);
  plan.data.checklist.steps = ensureArray(plan.data.checklist.steps).slice(0, 3).map((step, index) => {
    const fallbackStep = fallback.data.checklist.steps[index] || {};
    return {
      ...fallbackStep,
      ...step,
      title: safeDisplayText(job, step?.title, fallbackStep.title || `第 ${index + 1} 步`, 24),
      body: safeDisplayText(job, step?.body, fallbackStep.body || "把判断顺序做对。", 42),
    };
  });

  plan.data.close.title = safeDisplayText(job, plan.data.close.title, fallback.data.close.title, 54);
  plan.data.close.body = sectionText("Close", fallback.data.close.body);
  plan.data.close.tags = [];
  plan.previewSubtitle = safeDisplayText(job, plan.previewSubtitle, fallback.previewSubtitle || sectionText("Close"), 60);
  plan.voiceoverUnits = buildVoiceoverUnits(job, {topic, headline, scriptSections});
  return plan;
}

function buildProductionPlan(job, planBrief = null) {
  const fallback = buildPlanDraft(job);
  const brief = planBrief && typeof planBrief === "object" ? planBrief : {};
  const headline = clipText(brief.headline || fallback.headline, 42);
  const toneSummary = clipText(brief.toneSummary || fallback.toneSummary, 80);
  const scriptSections = normalizeStructuredSections(brief.scriptSections, fallback.scriptSections);
  const newsBullets = ensureStringList(brief.newsBullets).slice(0, 3);
  const caseTitles = ensureStringList(brief.caseTitles).slice(0, 3);
  const caseTakeaways = ensureStringList(brief.caseTakeaways).slice(0, 3);
  const checklistSteps = ensureStringList(brief.checklistSteps).slice(0, 3);
  const subtitleLead = clipText(brief.subtitleLead || "", 60);
  const closeHeadline = clipText(brief.closeHeadline || "", 72);
  const topic = getSafeTopicLabel(job, inferJobTopic(job));

  const plan = JSON.parse(JSON.stringify(fallback));
  plan.version = planBrief ? "stage2-codex-structured-v1" : fallback.version;
  plan.generatedAt = nowIso();
  plan.headline = headline;
  plan.toneSummary = toneSummary;
  plan.scriptSections = scriptSections;
  plan.voiceoverUnits = buildVoiceoverUnits(job, {headline, scriptSections});
  plan.meta = {
    ...plan.meta,
    planSource: planBrief ? "codex-structured" : "local-fallback",
    renderCompositionId: "codex-job-preview",
  };

  if (subtitleLead) {
    plan.previewSubtitle = subtitleLead;
  }
  if (newsBullets.length === 3) {
    plan.data.newsContext.bullets = newsBullets;
  }
  plan.data.newsContext.title = headline;
  plan.data.hook.headline = headline;
  plan.data.hook.subheadline = scriptSections.find((section) => section.label === "Hook")?.text || plan.data.hook.subheadline;
  plan.data.mechanism.description =
    scriptSections.find((section) => section.label === "Body")?.text || plan.data.mechanism.description;

  if (caseTitles.length === 3) {
    plan.data.cases = plan.data.cases.map((item, index) => ({
      ...item,
      title: caseTitles[index] || item.title,
      takeaway: caseTakeaways[index] || item.takeaway,
    }));
  } else if (caseTakeaways.length === 3) {
    plan.data.cases = plan.data.cases.map((item, index) => ({
      ...item,
      takeaway: caseTakeaways[index] || item.takeaway,
    }));
  }

  if (checklistSteps.length === 3) {
    plan.data.checklist.steps = plan.data.checklist.steps.map((item, index) => ({
      ...item,
      title: checklistSteps[index] || item.title,
    }));
  }

  if (closeHeadline) {
    plan.data.close.title = closeHeadline;
  }
  plan.data.close.body = scriptSections.find((section) => section.label === "Close")?.text || plan.data.close.body;
  return sanitizeProductionPlan(job, plan);
}

async function generateStructuredPlan(job) {
  if (!job.codexSessionId) {
    throw new Error("Job is not bound to a Codex session yet");
  }
  const prompt = buildStructuredPlanPrompt(job);
  const raw = await runRealCodex(job, prompt);
  return {raw, parsed: extractJsonObject(raw)};
}

function buildPlanDraft(job) {
  const account = getAccount(job.accountId);
  const template = getTemplateCatalogEntry(job.templateId);
  const topic = getSafeTopicLabel(job, inferJobTopic(job));
  const sourceText = `${job.prompt || ""} ${topic}`;
  const isFakeBreakout = /假突破|突破失败|false break/i.test(sourceText);
  const isTradingTopic = /交易|MACD|量能|背离|K线|支撑|压力|趋势/i.test(sourceText);
  const headline = isFakeBreakout
    ? "假突破最危险的地方"
    : isTradingTopic
      ? `${topic}里最容易误判的一步`
      : clipText(topic, 26);
  const toneSummary = "先确认，再执行";
  const platform = platformLabel(account?.platform);
  const persona = account?.persona || "当前账号人设";
  const templateTitle = template?.title || job.templateId;

  const scriptSections = [
    {
      label: "Hook",
      text: isFakeBreakout
        ? "很多假突破不是机会，而是你在最热的时候追进去。"
        : `先给结论，${topic}里最容易出错的，不是你没看懂，而是你动得太早。`,
    },
    {
      label: "Body",
      text: isTradingTopic
        ? "先看结构位置，再看量能和内部证据，最后只等确认动作。"
        : "先拆核心判断，再给执行顺序，避免把信息铺得太散。",
    },
    {
      label: "Close",
      text: account?.ctaStyle
        ? `结尾按${account.ctaStyle}收束，只保留一个能立刻执行的下一步动作。`
        : "结尾只保留一个明确动作，让观众知道下一步该看什么。",
    },
  ];

  const data = {
    newsContext: {
      kicker: "交易教育 / 风险识别",
      title: `${headline}，问题往往不出在最显眼的地方`,
      quote: `先看结构，再等确认，不要把${topic}当成马上行动的理由。`,
      sourceLabel: "交易教育 / 风险识别",
      bullets: [
        `先明确 ${topic} 的核心风险点`,
        "把预警、确认、执行拆成三步",
        "只保留观众最需要记住的一条顺序",
      ],
      tags: ["先确认", "看结构", "控风险"],
      mediaCards: [
        {
          imageSrc: "/images/shared/hook_paul_tudor_jones.jpg",
          label: "Context",
          caption: `先把 ${topic} 放进一个清楚的上下文里。`,
        },
        {
          imageSrc: "/images/shared/hook_occupy_wall_street.jpg",
          label: "Sentiment",
          caption: "情绪最热的时候，最容易忽略结构已经开始走坏。",
        },
        {
          imageSrc: "/images/shared/hook_financial_crisis_store.jpg",
          label: "Consequence",
          caption: "错误通常不是没看见，而是动作做在确认之前。",
        },
      ],
      variant: "dark",
    },
    hook: {
      kicker: "先确认 / 再执行",
      headline,
      subheadline: scriptSections[0].text,
      stat: `${job.durationSec}s`,
      statLabel: "先确认，再进场",
      dateLabel: "别让一根K线决定动作",
      insetImageSrc: "/images/shared/macd_ref_chart_1.jpg",
      sourceLabel: "新手交易判断",
      boardLines: ["RISK", "FIRST", "THEN", "ACTION"],
      variant: "dark",
    },
    mechanism: {
      tag: "Core Mechanism",
      title: `把 ${topic} 还原成一个能执行的判断顺序`,
      formula: "先看结构 -> 再看内部证据 -> 最后等确认",
      description: scriptSections[1].text,
      cards: [
        {title: "结构", body: "先确认位置和趋势方向，避免离开结构空谈指标。"},
        {title: "证据", body: "再看量能、动能或节奏，有没有同步支持当前方向。"},
        {title: "确认", body: "只有确认动作出现以后，再决定要不要执行。"},
        {title: "节奏", body: "把预警和动作分开，减少被情绪带着追单。"},
      ],
      imageSrc: "/images/shared/macd_ref_chart_2.jpg",
      variant: "dark",
    },
    cases: [
      {
        badge: "Case 01",
        title: "先看位置，不要先下动作",
        takeaway: `面对 ${topic}，先把结构位置看清楚，再决定后面是否值得继续跟。`,
        bullets: ["有没有明显结构位", "当前位置是不是已经太热", "先判断再执行"],
        imageSrc: "/images/shared/macd_ref_chart_1.jpg",
        variant: "dark",
      },
      {
        badge: "Case 02",
        title: "再看内部证据是否同步",
        takeaway: "表面还在往前，内部证据却已经放缓，这种不同步才最有提醒价值。",
        bullets: ["量能有没有继续放大", "动能有没有同步跟上", "不要只看价格表面"],
        imageSrc: "/images/shared/macd_ref_chart_2.jpg",
        variant: "dark",
      },
      {
        badge: "Case 03",
        title: "最后只等确认动作",
        takeaway: "把预警当提醒，把确认当动作，顺序对了，误判自然会少很多。",
        bullets: ["回踩是否守住关键位", "确认以后再执行", "不给情绪抢节奏"],
        imageSrc: "/images/shared/macd_ref_chart_3.jpg",
        variant: "dark",
      },
    ],
    checklist: {
      title: `一条更稳的 ${topic} 判断顺序`,
      subtitle: "先看结构，再看证据，最后等确认。",
      steps: [
        {title: "先看结构位置", body: "没有结构前提，任何指标和情绪判断都会失去依托。"},
        {title: "再看内部证据", body: "量能、动能、节奏不同步时，优先把它当成风险提醒。"},
        {title: "最后等确认动作", body: "只在确认出现以后执行，不把预警直接当动作按钮。"},
      ],
      variant: "dark",
    },
    close: {
      title: `真正有价值的，不是更早动作，而是更早发现 ${topic} 已经没那么健康`,
      body: scriptSections[2].text,
      tags: ["结构先行", "证据确认", "动作靠后", "少追单"],
      variant: "dark",
    },
  };

  return {
    version: "stage1-real-chain-v1",
    generatedAt: nowIso(),
    meta: {
      jobId: job.id,
      accountId: job.accountId || "",
      templateId: job.templateId,
      requestedCompositionId: job.compositionId || "",
      renderCompositionId: "codex-job-preview",
      durationSec: job.durationSec || 60,
      aspectRatio: job.aspectRatio || "9:16",
      prompt: job.prompt,
      topic,
    },
    headline,
    toneSummary,
    scriptSections,
    voiceoverUnits: buildVoiceoverUnits(job, {topic, headline, scriptSections}),
    timeline: REAL_PIPELINE_TIMELINE,
    data,
  };
}

function buildTimelineFromSubtitles(subtitles = [], fallbackTimeline = REAL_PIPELINE_TIMELINE) {
  const cues = ensureArray(subtitles)
    .map((cue) => ({
      visualSectionId: String(cue?.visualSectionId || "").trim(),
      startFrame: Number(cue?.startFrame),
      endFrame: Number(cue?.endFrame),
    }))
    .filter((cue) => cue.visualSectionId && Number.isFinite(cue.startFrame) && Number.isFinite(cue.endFrame));

  if (!cues.length) return {...fallbackTimeline};

  const byKey = new Map();
  for (const [visualSectionId, key] of TIMELINE_SECTION_ORDER) {
    const sectionCues = cues.filter((cue) => cue.visualSectionId === visualSectionId);
    if (!sectionCues.length) continue;
    byKey.set(key, {
      startFrame: Math.min(...sectionCues.map((cue) => cue.startFrame)),
      endFrame: Math.max(...sectionCues.map((cue) => cue.endFrame)),
    });
  }

  if (!TIMELINE_SECTION_ORDER.every(([, key]) => byKey.has(key))) {
    return {...fallbackTimeline};
  }

  const ordered = TIMELINE_SECTION_ORDER.map(([, key]) => ({key, ...byKey.get(key)}));
  const timeline = {};
  const minSceneFrames = 36;
  const closingHoldFrames = 60;

  ordered.forEach((section, index) => {
    const next = ordered[index + 1];
    const rawDuration = next ? next.startFrame - section.startFrame : section.endFrame + closingHoldFrames - section.startFrame;
    timeline[section.key] = Math.max(minSceneFrames, Math.round(rawDuration));
  });

  return timeline;
}

function buildRenderProps(job, plan, subtitles = []) {
  const artifacts = ensureJobArtifactShape(job);
  return {
    backgroundColor: "#04060b",
    timeline: plan.timeline || REAL_PIPELINE_TIMELINE,
    data: plan.data,
    audio: {
      voiceover: fs.existsSync(artifacts.publicVoiceoverPath)
        ? {
            src: `/generated-jobs/${job.id}/voiceover.mp3`,
            startFrame: 0,
            volume: 1,
            enabled: true,
          }
        : null,
      bgm: {
        src: "/audio/new-signals/financial-tension-low.mp3",
        startFrame: 0,
        volume: 0.18,
        loop: true,
        enabled: false,
      },
      subtitles,
      subtitleStyle: {
        fontSize: normalizeSubtitleFontSize(job.subtitleFontSize, 28),
        color: normalizeSubtitleColor(job.subtitleColor, "#ffffff"),
      },
    },
    assets: {
      plan: readJobAssetPlan(job),
      manifest: readJobAssetManifest(job),
    },
  };
}

function collectRenderContentLeaks(job, plan, subtitles = []) {
  const leaks = [];
  const visit = (value, pathLabel) => {
    if (typeof value === "string") {
      if (hasPromptLeakText(job, value)) {
        leaks.push({path: pathLabel, text: clipText(value, 72)});
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${pathLabel}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, child]) => visit(child, `${pathLabel}.${key}`));
    }
  };

  visit(plan?.headline, "plan.headline");
  visit(plan?.toneSummary, "plan.toneSummary");
  visit(plan?.scriptSections, "plan.scriptSections");
  visit(
    ensureArray(plan?.voiceoverUnits).map((unit) => ({
      text: unit?.text || "",
      emphasisWords: unit?.emphasisWords || [],
    })),
    "plan.voiceoverUnits",
  );
  visit(plan?.previewSubtitle, "plan.previewSubtitle");
  visit(plan?.data, "plan.data");
  visit(
    ensureArray(subtitles).map((subtitle) => ({text: subtitle?.text || ""})),
    "subtitles",
  );
  return leaks;
}

function assertRenderContentSafe(job, plan, subtitles = []) {
  const leaks = collectRenderContentLeaks(job, plan, subtitles);
  if (!leaks.length) return;
  const first = leaks[0];
  throw new Error(`Render content contains prompt leakage at ${first.path}: ${first.text}`);
}

async function runScreenLeakQa(job) {
  if (!SCREEN_QA_ENABLED) {
    pushLog(job, "screen-qa: skipped (disabled)");
    return;
  }

  const artifacts = ensureJobArtifactShape(job);
  if (!fs.existsSync(artifacts.renderPropsPath)) {
    pushLog(job, "screen-qa: skipped (render props not found)");
    return;
  }

  fs.mkdirSync(artifacts.screenQaDir, {recursive: true});
  job.preview.statusText = "QA";
  job.preview.subtitle = "正在抽取关键画面并检查提示词泄漏。";
  job.preview.progress = Math.max(Number(job.preview.progress || 0), 86);
  job.updatedAt = nowIso();
  broadcastSnapshot(job);

  const args = [
    path.join(VIDEO_APP_ROOT, "scripts", "screen-leak-qa.mjs"),
    "--composition",
    job.renderCompositionId || "codex-job-preview",
    "--props",
    artifacts.renderPropsPath,
    "--output-dir",
    artifacts.screenQaDir,
    "--report",
    artifacts.screenQaReportPath,
    "--prompt",
    job.prompt || "",
    "--ocr",
    SCREEN_QA_OCR_COMMAND,
    "--npx",
    NPX_COMMAND,
  ];
  if (SCREEN_QA_FRAMES) {
    args.push("--frames", SCREEN_QA_FRAMES);
  }

  await runLoggedProcess(job, "screen-qa", process.execPath, args, {
    cwd: VIDEO_APP_ROOT,
    timeoutMs: 300000,
  });

  const report = safeReadJson(artifacts.screenQaReportPath);
  if (report?.status === "failed") {
    const leak = report.ocrLeaks?.[0] || report.textLeaks?.[0] || {};
    throw new Error(`Screen visual QA failed: ${leak.rule || "unknown"} ${leak.text || ""}`.trim());
  }
  if (report?.warnings?.length) {
    pushLog(job, `screen-qa: ${report.warnings.join("; ")}`);
  }
  pushLog(job, `screen-qa: report written to ${relativeWorkspacePath(artifacts.screenQaReportPath)}`);
}

function updateJobFromPlan(job, plan) {
  job.title = plan.headline;
  job.renderCompositionId = plan.meta?.renderCompositionId || "codex-job-preview";
  job.topicTitle = plan.meta?.topic || inferJobTopic(job);
  job.scriptSections = plan.scriptSections;
  job.preview.headline = plan.headline;
  job.preview.summary = `${job.renderCompositionId} / ${job.durationSec}s / ${job.aspectRatio}`;
  job.preview.imageUrl = "/workspace/video-app/public/images/shared/scenario_video_breakdown.jpg";
}

function refreshJobFromPlanArtifacts(job, reason = "Plan artifacts refreshed") {
  const artifacts = ensureJobArtifactShape(job);
  const plan = safeReadJson(artifacts.planPath);
  if (!plan) return false;
  const safePlan = sanitizeProductionPlan(job, plan);
  const subtitles = safeReadJson(artifacts.subtitlesPath) || [];
  updateJobFromPlan(job, safePlan);
  writeRuntimeJobFiles(job, safePlan, subtitles);
  job.updatedAt = nowIso();
  pushLog(job, `script: ${reason}`);
  persistJobSnapshot(job, reason);
  return true;
}

function runLoggedProcess(job, label, command, args, options = {}) {
  const cwd = options.cwd || WORKSPACE_ROOT;
  const timeoutMs = options.timeoutMs || 600000;
  return new Promise((resolve, reject) => {
    let stdoutRemainder = "";
    let stderrRemainder = "";
    let lastErrorLine = "";
    let finished = false;
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        PYTHONUTF8: "1",
        ...(options.env || {}),
      },
      shell: false,
      windowsHide: true,
    });
    const unregisterProcess = registerJobProcess(job, label, child);

    const flushBuffer = (chunkText, streamLabel) => {
      const lines = chunkText.split(/\r?\n/);
      const remainder = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        pushLog(job, `${label}: ${line.trim()}`);
        if (streamLabel === "stderr") {
          lastErrorLine = line.trim();
        }
      }
      return remainder;
    };

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      unregisterProcess();
      try {
        child.kill();
      } catch {}
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdoutRemainder += chunk.toString("utf8");
      stdoutRemainder = flushBuffer(stdoutRemainder, "stdout");
    });

    child.stderr.on("data", (chunk) => {
      stderrRemainder += chunk.toString("utf8");
      stderrRemainder = flushBuffer(stderrRemainder, "stderr");
    });

    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      unregisterProcess();
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      unregisterProcess();
      if (stdoutRemainder.trim()) {
        pushLog(job, `${label}: ${stdoutRemainder.trim()}`);
      }
      if (stderrRemainder.trim()) {
        pushLog(job, `${label}: ${stderrRemainder.trim()}`);
        lastErrorLine = stderrRemainder.trim();
      }
      if (code !== 0) {
        const termination = getJobTerminationRequest(job.id);
        if (termination) {
          reject(new Error(termination.reason || "Job process canceled by request"));
          return;
        }
        reject(new Error(lastErrorLine || `${label} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

function resolveWorkspaceInputPath(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const resolved = path.resolve(WORKSPACE_ROOT, text);
  const workspaceRoot = path.resolve(WORKSPACE_ROOT);
  if (resolved !== workspaceRoot && !resolved.startsWith(workspaceRoot + path.sep)) {
    throw new Error("Reference analysis path must be inside the workspace.");
  }
  return resolved;
}

function saveReplicationReferenceUpload(body = {}) {
  const fileName = String(body.fileName || "reference.mp4").trim();
  if (!/\.mp4$/i.test(fileName)) {
    throw new Error("Only MP4 reference videos are supported by the first upload flow.");
  }
  const rawBase64 = String(body.dataBase64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!rawBase64) {
    throw new Error("Missing uploaded video data.");
  }

  const videoBuffer = Buffer.from(rawBase64, "base64");
  if (!videoBuffer.length) {
    throw new Error("Uploaded video is empty.");
  }

  const title = String(body.title || path.basename(fileName, path.extname(fileName))).trim();
  const sourceId = `viral_${Date.now()}_${safeArchiveName(path.basename(fileName, path.extname(fileName)), "reference")}`;
  const sourceDir = path.join(SOURCE_VIDEO_ROOT, sourceId);
  const sourcePath = path.join(sourceDir, "source.mp4");
  const metaPath = path.join(sourceDir, "meta.json");
  const analysisPath = path.join(ANALYSIS_ROOT, `${sourceId}.analysis.json`);
  const summaryPath = path.join(ANALYSIS_ROOT, `${sourceId}.summary.json`);
  fs.mkdirSync(sourceDir, {recursive: true});
  fs.writeFileSync(sourcePath, videoBuffer);
  safeWriteJson(metaPath, {
    id: sourceId,
    filename: fileName,
    title,
    description: String(body.description || "").trim(),
    platform: String(body.platform || "local").trim() || "local",
    track: "viral_replication",
    language: String(body.language || "zh-CN").trim() || "zh-CN",
    mimeType: String(body.mimeType || "video/mp4").trim() || "video/mp4",
    uploadedAt: nowIso(),
    status: "uploaded",
  });

  return {
    sourceId,
    title,
    sourceVideoPath: relativeWorkspacePath(sourcePath),
    metaPath: relativeWorkspacePath(metaPath),
    analysisPath: relativeWorkspacePath(analysisPath),
    summaryPath: relativeWorkspacePath(summaryPath),
  };
}

async function runReferenceAnalysis(job) {
  const replication = job.replication || {};
  const sourceId = String(replication.sourceId || "").trim();
  if (!sourceId) {
    throw new Error("Reference sourceId missing. Upload a reference video first.");
  }
  const sourcePath = path.join(SOURCE_VIDEO_ROOT, sourceId, "source.mp4");
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Reference video not found: ${relativeWorkspacePath(sourcePath)}`);
  }

  job.type = "viral_replication";
  job.status = "analyzing_reference";
  job.stageIndex = 0;
  job.steps = makeViralReplicationSteps(0);
  job.updatedAt = nowIso();
  job.preview.statusText = "Analyzing";
  job.preview.progress = 16;
  job.preview.subtitle = "正在拆解参考爆款视频，生成 analysis.json。";
  pushLog(job, `reference-analysis: source ${sourceId}`);
  broadcastSnapshot(job);

  await runLoggedProcess(
    job,
    "reference-analysis",
    PYTHON_COMMAND,
    [path.join("scripts", "analyze_video.py"), job.id, sourceId, "auto", "data"],
    {cwd: WORKSPACE_ROOT, timeoutMs: 1800000, env: {PYTHONIOENCODING: "utf-8"}},
  );

  const analysisPath = path.join(ANALYSIS_ROOT, `${sourceId}.analysis.json`);
  const summaryPath = path.join(ANALYSIS_ROOT, `${sourceId}.summary.json`);
  if (!fs.existsSync(analysisPath)) {
    throw new Error(`Reference analysis did not produce ${relativeWorkspacePath(analysisPath)}`);
  }

  job.replication = {
    ...replication,
    sourceId,
    analysisPath: relativeWorkspacePath(analysisPath),
    summaryPath: fs.existsSync(summaryPath) ? relativeWorkspacePath(summaryPath) : "",
  };
  job.status = "analysis_ready";
  job.stageIndex = 1;
  job.steps = makeViralReplicationSteps(1);
  job.updatedAt = nowIso();
  job.preview.statusText = "Analysis Ready";
  job.preview.progress = 24;
  job.preview.subtitle = "参考视频拆解完成，可以继续生成复刻计划。";
  persistJobSnapshot(job, "Reference video analysis completed");
  broadcastSnapshot(job);
}

async function runViralReplication(job, options = {}) {
  const artifacts = ensureJobArtifactShape(job);
  const replication = job.replication || {};
  const delivery = Boolean(options.delivery);
  const copyVariant = normalizeCopyRewriteVariant(replication.copyVariant || replication.rewriteVariant || "sharp_contrarian");
  let analysisPath = resolveWorkspaceInputPath(replication.analysisPath);
  if ((!analysisPath || !fs.existsSync(analysisPath)) && replication.sourceId) {
    await runReferenceAnalysis(job);
    analysisPath = resolveWorkspaceInputPath(job.replication?.analysisPath);
  }
  if (!analysisPath || !fs.existsSync(analysisPath)) {
    throw new Error("analysis.json not found. Provide a workspace-relative analysisPath.");
  }
  const nextReplication = job.replication || replication;
  const summaryPath = nextReplication.summaryPath ? resolveWorkspaceInputPath(nextReplication.summaryPath) : "";
  if (summaryPath && !fs.existsSync(summaryPath)) {
    throw new Error("summary.json not found. Leave summaryPath empty or provide an existing file.");
  }

  job.type = "viral_replication";
  job.status = "replicating";
  job.stageIndex = 1;
  job.steps = makeViralReplicationSteps(1);
  job.updatedAt = nowIso();
  job.preview.statusText = "Replicating";
  job.preview.progress = 28;
  job.preview.subtitle = "正在运行爆款复刻 artifact pipeline。";
  pushLog(job, `replication: analysis ${relativeWorkspacePath(analysisPath)}`);
  broadcastSnapshot(job);

  const args = [
    path.join("scripts", "run_viral_replication_pipeline.py"),
    "--workspace",
    ".",
    "--analysis",
    relativeWorkspacePath(analysisPath),
    "--job-id",
    job.id,
    "--account-id",
    job.accountId || "default",
    "--template-id",
    nextReplication.templateId || job.templateId || "auto",
    "--style-variant",
    nextReplication.styleVariant || "auto",
    "--strength",
    nextReplication.strength || "medium",
    "--topic",
    nextReplication.targetTopic || job.topicTitle || job.prompt || "TARGET_TOPIC",
    "--compile",
    "--force",
  ];
  if (delivery) {
    args.push(
      "--delivery",
      "--rewrite-variant",
      copyVariant,
      "--draft-copy-rewrite",
      "--render-output",
      relativeWorkspacePath(artifacts.outputVideoPath),
    );
    if (ensureArray(nextReplication.providerOrder).length) {
      args.push("--provider-order", ensureArray(nextReplication.providerOrder).join(","));
    }
  }
  if (summaryPath) {
    args.splice(7, 0, "--summary", relativeWorkspacePath(summaryPath));
  }

  await runLoggedProcess(job, "replication", PYTHON_COMMAND, args, {
    cwd: WORKSPACE_ROOT,
    timeoutMs: delivery ? 1800000 : 600000,
    env: {PYTHONIOENCODING: "utf-8"},
  });

  const status = safeReadJson(artifacts.replicationStatusPath) || {};
  const renderProps = safeReadJson(artifacts.renderPropsPath) || {};
  const compileReport = safeReadJson(artifacts.compileReportPath) || {};
  const renderPackage = safeReadJson(artifacts.renderPackagePath) || {};
  const target = renderProps.inputProps?.target || {};

  job.status = delivery
    ? renderPackage.status === "rendered"
      ? "completed"
      : renderPackage.status === "dry_run"
        ? "render-ready"
        : "needs_review"
    : compileReport.status === "partial"
      ? "needs_review"
      : "planned";
  job.stageIndex = delivery ? 9 : 5;
  job.steps = makeViralReplicationSteps(job.stageIndex);
  job.renderCompositionId = renderProps.composition?.compositionId || "replicated-video-preview";
  job.templateId = target.templateId || job.templateId;
  job.aspectRatio = target.aspectRatio || job.aspectRatio;
  job.durationSec = Number(target.durationSec || job.durationSec || 60);
  job.topicTitle = renderProps.inputProps?.topic || nextReplication.targetTopic || job.topicTitle;
  job.title = `爆款复刻：${job.topicTitle || job.title}`;
  job.preview.statusText = delivery ? (job.status === "completed" ? "Rendered" : "Needs Review") : job.status === "needs_review" ? "Needs Review" : "Replication Ready";
  job.preview.progress = delivery ? 100 : 68;
  job.preview.summary = `${job.renderCompositionId} / ${job.durationSec}s / ${job.aspectRatio}`;
  job.preview.subtitle = delivery
    ? `Final render output: ${relativeWorkspacePath(artifacts.outputVideoPath)}`
    : status.status === "completed"
      ? "复刻计划已生成，可查看 artifact 或继续生成成片。"
      : "复刻 pipeline 已返回，请检查状态文件。";
  job.updatedAt = nowIso();
  pushLog(job, `replication: wrote ${relativeWorkspacePath(artifacts.replicationPlanPath)}`);
  pushLog(job, `replication: wrote ${relativeWorkspacePath(artifacts.renderPropsPath)}`);
  if (delivery) {
    pushLog(job, `replication: wrote ${relativeWorkspacePath(artifacts.renderPackagePath)}`);
    pushLog(job, `replication: wrote ${relativeWorkspacePath(artifacts.outputVideoPath)}`);
    await refreshPosterFrame(job);
  }
  persistJobSnapshot(job, "Viral replication pipeline completed");
  broadcastSnapshot(job);
}

async function runViralReplicationDelivery(job) {
  return runViralReplication(job, {delivery: true});
}

async function generatePosterFrame(job) {
  const artifacts = ensureJobArtifactShape(job);
  const ffmpegAvailable = path.isAbsolute(FFMPEG_COMMAND) ? fs.existsSync(FFMPEG_COMMAND) : true;
  if (!ffmpegAvailable) {
    pushLog(job, "poster: ffmpeg not found, skipping poster frame");
    return;
  }

  await runLoggedProcess(
    job,
    "poster",
    FFMPEG_COMMAND,
    ["-y", "-ss", "00:00:00.50", "-i", artifacts.outputVideoPath, "-frames:v", "1", "-q:v", "2", artifacts.posterPath],
    {cwd: WORKSPACE_ROOT, timeoutMs: 120000},
  );

  if (fs.existsSync(artifacts.posterPath)) {
    job.preview.imageUrl = toWorkspaceUrl(artifacts.posterPath);
    const coverMeta = safeReadJson(artifacts.coverMetaPath) || {};
    if (!coverMeta.posterPath) {
      safeWriteJson(artifacts.coverMetaPath, {
        posterPath: relativeWorkspacePath(artifacts.posterPath),
        updatedAt: nowIso(),
      });
    }
    pushLog(job, `poster: wrote ${relativeWorkspacePath(artifacts.posterPath)}`);
  }
}

function setDefaultPosterFrame(job) {
  const artifacts = ensureJobArtifactShape(job);
  if (!fs.existsSync(artifacts.posterPath)) {
    throw new Error("Poster frame does not exist yet");
  }
  safeWriteJson(artifacts.coverMetaPath, {
    posterPath: relativeWorkspacePath(artifacts.posterPath),
    updatedAt: nowIso(),
  });
  pushLog(job, `poster: set default cover -> ${relativeWorkspacePath(artifacts.posterPath)}`);
  persistJobSnapshot(job, "Default cover updated");
}

async function refreshPosterFrame(job) {
  const artifacts = ensureJobArtifactShape(job);
  if (!fs.existsSync(artifacts.outputVideoPath)) {
    throw new Error("Rendered video does not exist yet");
  }
  try {
    if (fs.existsSync(artifacts.posterPath)) fs.unlinkSync(artifacts.posterPath);
  } catch {}
  await generatePosterFrame(job);
  persistJobSnapshot(job, "Poster refreshed");
}

async function ensurePosterFrame(job) {
  const artifacts = ensureJobArtifactShape(job);
  if (!artifacts.outputVideoPath || !fs.existsSync(artifacts.outputVideoPath)) return;
  if (artifacts.posterPath && fs.existsSync(artifacts.posterPath)) return;
  try {
    await generatePosterFrame(job);
  } catch (error) {
    pushLog(job, `poster: skipped (${error.message})`);
  }
}

function writeRuntimeJobFiles(job, plan, subtitles = [], options = {}) {
  const artifacts = ensureJobArtifactShape(job);
  const safePlan = sanitizeProductionPlan(job, plan);
  const assetBundle = options.assetManifest
    ? {assetPlan: readJobAssetPlan(job) || buildAssetPlan(job, safePlan), assetManifest: options.assetManifest}
    : ensureJobAssetPlan(job, safePlan, {autoBindLocal: job.useAiImageAssets ? false : options.autoBindLocal});
  const planWithAssets = applyAssetManifestToPlan(job, safePlan, assetBundle.assetManifest);
  planWithAssets.timeline = buildTimelineFromSubtitles(subtitles, planWithAssets.timeline || safePlan.timeline || REAL_PIPELINE_TIMELINE);
  job.topicTitle = planWithAssets.meta?.topic || job.topicTitle || inferJobTopic(job);
  job.renderCompositionId = planWithAssets.meta?.renderCompositionId || job.renderCompositionId || "codex-job-preview";
  safeWriteJson(artifacts.requestPath, {
    id: job.id,
    prompt: job.prompt,
    topicTitle: planWithAssets.meta?.topic || job.topicTitle || inferJobTopic(job),
    accountId: job.accountId,
    templateId: job.templateId,
    compositionId: job.compositionId,
    renderCompositionId: job.renderCompositionId || safePlan.meta?.renderCompositionId || "codex-job-preview",
    durationSec: job.durationSec,
    aspectRatio: job.aspectRatio,
    activePresetIds: ensureArray(job.activePresetIds),
    openInstruction: job.openInstruction || "",
    instructionScope: job.instructionScope || "run",
    useAiImageAssets: Boolean(job.useAiImageAssets),
    imageAssetModel: normalizeImageAssetModel(job.imageAssetModel) || getImageApiConfig().model,
    updatedAt: nowIso(),
  });
  safeWriteJson(artifacts.planBriefPath, {
    source: planWithAssets.meta?.planSource || "local-fallback",
    headline: planWithAssets.headline,
    toneSummary: planWithAssets.toneSummary,
    scriptSections: planWithAssets.scriptSections,
    generatedAt: planWithAssets.generatedAt,
  });
  safeWriteJson(artifacts.planPath, planWithAssets);
  safeWriteJson(artifacts.unitsPath, planWithAssets.voiceoverUnits);
  safeWriteText(artifacts.voiceoverTextPath, planWithAssets.voiceoverUnits.map((unit) => unit.text).join(" "));
  safeWriteJson(artifacts.renderPropsPath, buildRenderProps(job, planWithAssets, subtitles));
}

async function runGeneratePlan(job) {
  let planBrief = null;
  let fallbackReason = "";
  job.stageIndex = Math.max(job.stageIndex, 2);
  job.steps = makeVideoSteps(2);
  job.status = "planning";
  job.updatedAt = nowIso();
  job.preview.statusText = "Planning";
  job.preview.progress = 38;
  job.preview.subtitle = "正在调用 Codex 生成结构化视频计划。";
  broadcastSnapshot(job);

  try {
    const structured = await generateStructuredPlan(job);
    planBrief = structured.parsed;
    job.planSource = "codex-structured";
    job.planFallbackReason = "";
    safeWriteJson(job.artifacts.planBriefPath, {
      source: "codex-structured",
      raw: structured.raw,
      ...structured.parsed,
    });
    pushLog(job, "plan: structured Codex brief generated");
  } catch (error) {
    throw error;
    fallbackReason = error.message;
    job.planSource = "local-fallback";
    job.planFallbackReason = fallbackReason;
    safeWriteJson(job.artifacts.planBriefPath, {
      source: "local-fallback",
      error: fallbackReason,
      generatedAt: nowIso(),
    });
    pushLog(job, `plan: fallback to local draft (${fallbackReason})`);
  }

  const plan = buildProductionPlan(job, planBrief);
  job.planSource = plan.meta?.planSource || job.planSource || "local-fallback";
  if (job.planSource === "codex-structured") {
    job.planFallbackReason = "";
  }
  updateJobFromPlan(job, plan);
  writeRuntimeJobFiles(job, plan, [], {autoBindLocal: !job.useAiImageAssets});
  if (job.useAiImageAssets) {
    const imageAssetModel = normalizeImageAssetModel(job.imageAssetModel) || getImageApiConfig().model;
    job.preview.subtitle = `正在使用 ${imageAssetModel} 生成本条视频的图片素材...`;
    pushLog(job, `assets: generating task-specific images with ${imageAssetModel}`);
    resetUnlockedJobAssets(job);
    broadcastSnapshot(job);
    const generatedAssets = await generateFreshAssetsForJob(job, {
      force: true,
      status: "approved",
      provider: "openai",
      model: imageAssetModel,
    });
    writeRuntimeJobFiles(job, safeReadJson(job.artifacts.planPath) || plan, [], {
      autoBindLocal: false,
      assetManifest: generatedAssets.assetManifest,
    });
  }
  job.stageIndex = Math.max(job.stageIndex, 2);
  job.steps = makeVideoSteps(2);
  job.status = "planning";
  job.updatedAt = nowIso();
  job.preview.statusText = "Planned";
  job.preview.progress = 52;
  job.preview.subtitle = plan.voiceoverUnits[0]?.text || "已生成计划，下一步进入配音。";
  pushLog(job, `plan: wrote ${relativeWorkspacePath(job.artifacts.planPath)}`);
  pushLog(job, `plan: wrote ${relativeWorkspacePath(job.artifacts.unitsPath)}`);
  persistJobSnapshot(job, "Plan generated");
  broadcastSnapshot(job);
}

async function runTts(job) {
  const artifacts = ensureJobArtifactShape(job);
  if (!fs.existsSync(artifacts.planPath) || !fs.existsSync(artifacts.unitsPath)) {
    await runGeneratePlan(job);
  }
  const existingPlan = safeReadJson(artifacts.planPath);
  if (existingPlan) {
    writeRuntimeJobFiles(job, existingPlan, []);
  }

  job.stageIndex = Math.max(job.stageIndex, 4);
  job.steps = makeVideoSteps(4);
  job.status = "tts";
  job.updatedAt = nowIso();
  job.preview.statusText = "TTS";
  job.preview.progress = 74;
  job.preview.subtitle = "正在生成真实配音和字幕时间轴。";
  broadcastSnapshot(job);

  await runLoggedProcess(
    job,
    "tts",
    PYTHON_COMMAND,
    [
      path.join(WORKSPACE_ROOT, "scripts", "generate_job_tts.py"),
      "--units-file",
      artifacts.unitsPath,
      "--output-audio",
      artifacts.publicVoiceoverPath,
      "--output-subtitles",
      artifacts.subtitlesPath,
      "--output-alignment",
      artifacts.alignmentPath,
      "--fps",
      "30",
    ],
    {cwd: WORKSPACE_ROOT, timeoutMs: 300000},
  );

  const plan = safeReadJson(artifacts.planPath);
  const subtitles = safeReadJson(artifacts.subtitlesPath) || [];
  writeRuntimeJobFiles(job, plan, subtitles);
  job.updatedAt = nowIso();
  job.preview.subtitle = subtitles[0]?.text || "配音与字幕已生成。";
  persistJobSnapshot(job, "TTS generated");
  broadcastSnapshot(job);
}

async function runRender(job) {
  const artifacts = ensureJobArtifactShape(job);
  if (!fs.existsSync(artifacts.planPath)) {
    await runGeneratePlan(job);
  }
  if (!fs.existsSync(artifacts.publicVoiceoverPath) || !fs.existsSync(artifacts.subtitlesPath)) {
    await runTts(job);
  }
  let renderPlan = safeReadJson(artifacts.planPath);
  let renderSubtitles = safeReadJson(artifacts.subtitlesPath) || [];
  if (renderPlan) {
    renderPlan = sanitizeProductionPlan(job, renderPlan);
    const leaks = collectRenderContentLeaks(job, renderPlan, renderSubtitles);
    if (leaks.length) {
      pushLog(job, `render: prompt leakage detected before render (${leaks[0].path}); regenerating TTS`);
      await runTts(job);
      renderPlan = sanitizeProductionPlan(job, safeReadJson(artifacts.planPath));
      renderSubtitles = safeReadJson(artifacts.subtitlesPath) || [];
    }
    assertRenderContentSafe(job, renderPlan, renderSubtitles);
    writeRuntimeJobFiles(job, renderPlan, renderSubtitles);
  }

  validateJobAssetsForRender(job);

  await runScreenLeakQa(job);

  job.stageIndex = 5;
  job.steps = makeVideoSteps(5);
  job.status = "rendering";
  job.updatedAt = nowIso();
  job.preview.statusText = "Rendering";
  job.preview.progress = 90;
  job.preview.subtitle = "正在调用 Remotion 渲染 MP4。";
  broadcastSnapshot(job);

  const renderCommand =
    process.platform === "win32"
      ? [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          `npx.cmd remotion render src/index.ts codex-job-preview \"${artifacts.outputVideoPath}\" \"--props=${artifacts.renderPropsPath}\" --overwrite`,
        ]
      : [
          "remotion",
          "render",
          "src/index.ts",
          "codex-job-preview",
          artifacts.outputVideoPath,
          `--props=${artifacts.renderPropsPath}`,
          "--overwrite",
        ];

  await runLoggedProcess(
    job,
    "render",
    process.platform === "win32" ? POWERSHELL_COMMAND : NPX_COMMAND,
    renderCommand,
    {cwd: VIDEO_APP_ROOT, timeoutMs: 900000},
  );

  try {
    await generatePosterFrame(job);
  } catch (error) {
    pushLog(job, `poster: skipped (${error.message})`);
  }

  job.status = "completed";
  job.stageIndex = 6;
  job.steps = makeVideoSteps(6);
  job.updatedAt = nowIso();
  job.preview.statusText = "Ready";
  job.preview.progress = 100;
  job.preview.subtitle = `本地渲染完成：${relativeWorkspacePath(artifacts.outputVideoPath)}`;
  pushLog(job, `render: output written to ${relativeWorkspacePath(artifacts.outputVideoPath)}`);
  persistJobSnapshot(job, "Render completed");
  broadcastSnapshot(job);
}

async function resolveSessionJob(sessionId, configInput = {}) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    loadSessionCatalog({force: true});
    const job = createSessionJob(sessionId, configInput);
    if (job) return job;
    await wait(250);
  }
  throw new Error(`Session ${sessionId} was created but not found in local catalog`);
}

function createRealSession(configInput = {}) {
  const outputFile = path.join(os.tmpdir(), `codex-video-console-session-${Date.now()}-last-message.txt`);

  return new Promise((resolve, reject) => {
    const diagnostics = createCodexDiagnostics("session-bootstrap", {codexSessionId: ""}, SESSION_BOOTSTRAP_PROMPT);
    let stdoutRemainder = "";
    let stderrRemainder = "";
    let failed = false;
    let finalized = false;
    let exitTimer = null;
    let killTimer = null;
    let completionTimer = null;
    let threadId = "";
    let lastCodexError = "";
    const cleanupFiles = () => {
      try {
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch {}
    };
    let child;
    try {
      child = spawnCodexProcess(buildCodexArgs({codexSessionId: null}, outputFile), SESSION_BOOTSTRAP_PROMPT);
    } catch (error) {
      cleanupFiles();
      reject(error);
      return;
    }

    const handleLine = (line) => {
      const trimmed = String(line || "").trim();
      if (!trimmed) return;
      try {
        const payload = JSON.parse(trimmed);
        updateCodexDiagnosticsFromPayload(diagnostics, payload);
        const errorMessage = extractCodexErrorMessage(payload);
        if (errorMessage) {
          lastCodexError = errorMessage;
        }
        if (payload.type === "thread.started" && payload.thread_id) {
          threadId = payload.thread_id;
        }
      } catch {
        updateCodexDiagnosticsFromLine(diagnostics, trimmed, "stdout");
      }
    };

    const flushRemainders = () => {
      if (stdoutRemainder.trim()) {
        handleLine(stdoutRemainder);
        stdoutRemainder = "";
      }
      if (stderrRemainder.trim()) {
        handleLine(stderrRemainder);
        stderrRemainder = "";
      }
    };

    const finalizeRun = async (code, signal) => {
      if (finalized) return;
      finalized = true;
      if (exitTimer) clearTimeout(exitTimer);
      if (killTimer) clearTimeout(killTimer);
      if (completionTimer) clearTimeout(completionTimer);

      flushRemainders();
      cleanupFiles();

      if (failed) return;
      if (signal) {
        reject(new Error(`Codex session bootstrap terminated by signal ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(formatCodexFailureMessage(`Codex session bootstrap exited with code ${code}`, lastCodexError)));
        return;
      }
      if (!threadId) {
        reject(new Error("Codex did not return a thread id for the new session"));
        return;
      }

      try {
        const job = await resolveSessionJob(threadId, configInput);
        resolve(job);
      } catch (error) {
        reject(error);
      }
    };

    const completeSessionBootstrap = () => {
      if (finalized || failed || !threadId) return;
      finalized = true;
      if (exitTimer) clearTimeout(exitTimer);
      if (killTimer) clearTimeout(killTimer);
      if (completionTimer) clearTimeout(completionTimer);
      flushRemainders();
      cleanupFiles();
      try {
        child.kill();
      } catch {}
      resolveSessionJob(threadId, configInput).then(resolve).catch(reject);
    };

    const handleCompletionCandidate = (line) => {
      try {
        const payload = JSON.parse(String(line || "").trim());
        if (payload.type === "turn.completed" && threadId && !completionTimer) {
          completionTimer = setTimeout(completeSessionBootstrap, 300);
        }
      } catch {}
    };

    child.stdout.on("data", (chunk) => {
      diagnostics.stdoutBytes += chunk.length;
      stdoutRemainder += chunk.toString("utf8");
      const lines = stdoutRemainder.split(/\r?\n/);
      stdoutRemainder = lines.pop() || "";
      for (const line of lines) {
        diagnostics.stdoutLines += 1;
        handleLine(line);
        handleCompletionCandidate(line);
      }
    });

    child.stderr.on("data", (chunk) => {
      diagnostics.stderrBytes += chunk.length;
      stderrRemainder += chunk.toString("utf8");
      const lines = stderrRemainder.split(/\r?\n/);
      stderrRemainder = lines.pop() || "";
      for (const line of lines) {
        diagnostics.stderrLines += 1;
        handleLine(line);
        handleCompletionCandidate(line);
      }
    });

    child.on("error", (error) => {
      failed = true;
      cleanupFiles();
      reject(error);
    });

    killTimer = setTimeout(() => {
      if (finalized || failed) return;
      failed = true;
      flushRemainders();
      cleanupFiles();
      try {
        child.kill();
      } catch {}
      reject(new Error(formatCodexFailureMessage("Codex session bootstrap timed out", describeCodexTimeout(diagnostics, CODEX_PROCESS_TIMEOUT_MS))));
    }, CODEX_PROCESS_TIMEOUT_MS);

    child.on("exit", (code, signal) => {
      exitTimer = setTimeout(() => {
        finalizeRun(code, signal).catch(reject);
      }, 250);
    });

    child.on("close", (code, signal) => {
      finalizeRun(code, signal).catch(reject);
    });
  });
}

function runRealCodex(job, latestMessage) {
  if (job.codexRunning) {
    return Promise.reject(new Error("Codex is already running for this job"));
  }

  const outputFile = path.join(os.tmpdir(), `${job.id}-${Date.now()}-last-message.txt`);
  const prompt = job.codexSessionId ? String(latestMessage || "") : buildCodexPrompt(job, latestMessage);
  const initialSessionId = job.codexSessionId;

  return new Promise((resolve, reject) => {
    const diagnostics = createCodexDiagnostics("turn", job, prompt);
    job.codexRunning = true;
    pushLog(job, job.codexSessionId ? `codex: resume ${job.codexSessionId}` : "codex: exec started");
    setPendingAssistant(job, "Codex 正在处理你的消息...");

    let lastAgentMessage = "";
    let lastCodexError = "";
    let stdoutRemainder = "";
    let stderrRemainder = "";
    let failed = false;
    let finalized = false;
    let exitTimer = null;
    let killTimer = null;
    let completionTimer = null;
    let child;
    try {
      child = spawnCodexProcess(buildCodexArgs(job, outputFile), prompt);
    } catch (error) {
      job.codexRunning = false;
      setPendingAssistant(job, "");
      reject(error);
      return;
    }
    const unregisterProcess = registerJobProcess(job, "codex", child);

    const handleLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const payload = JSON.parse(trimmed);
        updateCodexDiagnosticsFromPayload(diagnostics, payload);
        const errorMessage = extractCodexErrorMessage(payload);
        if (errorMessage) {
          lastCodexError = errorMessage;
          pushLog(job, `codex error: ${errorMessage}`);
        }
        if (payload.type === "item.completed" && payload.item?.type === "agent_message" && payload.item?.text) {
          lastAgentMessage = String(payload.item.text);
        }
        handleCodexEvent(job, payload);
      } catch {
        const cleaned = cleanCodexLogLine(trimmed);
        if (cleaned) {
          updateCodexDiagnosticsFromLine(diagnostics, cleaned, "stdout");
          pushLog(job, cleaned);
          if (!lastCodexError && /(error|failed|denied|forbidden|unauthorized)/i.test(cleaned)) {
            lastCodexError = cleaned;
            diagnostics.lastCodexError = cleaned;
          }
        }
      }
    };

    const flushRemainders = () => {
      if (stdoutRemainder.trim()) {
        handleLine(stdoutRemainder);
        stdoutRemainder = "";
      }
      if (stderrRemainder.trim()) {
        handleLine(stderrRemainder);
        stderrRemainder = "";
      }
    };

    const finalizeRun = (code, signal) => {
      if (finalized) return;
      finalized = true;
      if (exitTimer) clearTimeout(exitTimer);
      if (killTimer) clearTimeout(killTimer);
      if (completionTimer) clearTimeout(completionTimer);

      flushRemainders();
      unregisterProcess();
      job.codexRunning = false;
      setPendingAssistant(job, "");

      const finalMessage = lastAgentMessage || tryReadLastMessage(outputFile);
      try {
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch {}

      if (failed) return;

      if (signal) {
        const termination = getJobTerminationRequest(job.id);
        if (termination) {
          pushLog(job, `codex: exec terminated by request (${termination.reason})`);
          reject(new Error(termination.reason || "Codex canceled by request"));
          return;
        }
        pushLog(job, `codex: exec terminated by signal ${signal}`);
        reject(new Error(`Codex terminated by signal ${signal}`));
        return;
      }

      if (code !== 0) {
        const termination = getJobTerminationRequest(job.id);
        if (termination) {
          pushLog(job, `codex: exec canceled (${termination.reason})`);
          reject(new Error(termination.reason || "Codex canceled by request"));
          return;
        }
        pushLog(job, `codex: exec exited with code ${code}`);
        reject(new Error(formatCodexFailureMessage(`Codex exited with code ${code}`, lastCodexError)));
        return;
      }

      if (!finalMessage) {
        reject(new Error("Codex completed without a final message"));
        return;
      }

      if (!initialSessionId && job.codexSessionId) {
        loadSessionCatalog({force: true});
      }

      pushLog(job, "codex: final message received");
      resolve(finalMessage);
    };

    const completeCodexTurn = () => {
      if (finalized || failed) return;
      const finalMessage = lastAgentMessage || tryReadLastMessage(outputFile);
      if (!finalMessage) return;

      finalized = true;
      if (exitTimer) clearTimeout(exitTimer);
      if (killTimer) clearTimeout(killTimer);
      if (completionTimer) clearTimeout(completionTimer);

      flushRemainders();
      unregisterProcess();
      job.codexRunning = false;
      setPendingAssistant(job, "");
      try {
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch {}

      if (!initialSessionId && job.codexSessionId) {
        loadSessionCatalog({force: true});
      }

      pushLog(job, "codex: final message received");
      try {
        child.kill();
      } catch {}
      resolve(finalMessage);
    };

    const handleCompletionCandidate = (line) => {
      try {
        const payload = JSON.parse(String(line || "").trim());
        if (payload.type === "turn.completed" && !completionTimer) {
          completionTimer = setTimeout(completeCodexTurn, 400);
        }
      } catch {}
    };

    child.stdout.on("data", (chunk) => {
      diagnostics.stdoutBytes += chunk.length;
      stdoutRemainder += chunk.toString("utf8");
      const lines = stdoutRemainder.split(/\r?\n/);
      stdoutRemainder = lines.pop() || "";
      for (const line of lines) {
        diagnostics.stdoutLines += 1;
        handleLine(line);
        handleCompletionCandidate(line);
      }
    });

    child.stderr.on("data", (chunk) => {
      diagnostics.stderrBytes += chunk.length;
      stderrRemainder += chunk.toString("utf8");
      const lines = stderrRemainder.split(/\r?\n/);
      stderrRemainder = lines.pop() || "";
      for (const line of lines) {
        diagnostics.stderrLines += 1;
        handleLine(line);
        handleCompletionCandidate(line);
      }
    });

    child.on("error", (error) => {
      failed = true;
      if (killTimer) clearTimeout(killTimer);
      unregisterProcess();
      job.codexRunning = false;
      setPendingAssistant(job, "");
      pushLog(job, `codex: process error ${error.message}`);
      reject(error);
    });

    killTimer = setTimeout(() => {
      if (finalized || failed) return;
      failed = true;
      flushRemainders();
      unregisterProcess();
      job.codexRunning = false;
      setPendingAssistant(job, "");
      pushLog(job, `codex: request timed out after ${CODEX_PROCESS_TIMEOUT_MS}ms`);
      try {
        child.kill();
      } catch {}
      reject(new Error(formatCodexFailureMessage(`Codex request timed out after ${CODEX_PROCESS_TIMEOUT_MS}ms`, describeCodexTimeout(diagnostics, CODEX_PROCESS_TIMEOUT_MS))));
    }, CODEX_PROCESS_TIMEOUT_MS);

    child.on("exit", (code, signal) => {
      // `close` can stall if descendant processes inherit stdio handles.
      exitTimer = setTimeout(() => finalizeRun(code, signal), 250);
    });

    child.on("close", (code, signal) => {
      finalizeRun(code, signal);
    });
  });
}

async function advanceJob(job, action) {
  if (job.source === "persisted" || job.source === "session") return job;
  if (job.pipelineRunning) {
    throw new Error("A pipeline action is already running for this job.");
  }

  const actionMap = {
    "analyze-reference": runReferenceAnalysis,
    "run-replication": runViralReplication,
    "run-replication-delivery": runViralReplicationDelivery,
    "generate-plan": runGeneratePlan,
    tts: runTts,
    render: runRender,
  };
  const runner = actionMap[action];
  if (!runner) {
    throw new Error(`Unsupported action: ${action}`);
  }

  job.pipelineRunning = true;
  job.lastPipelineAction = action;
  job.failedAction = "";
  job.updatedAt = nowIso();
  broadcastSnapshot(job);

  try {
    await runner(job);
    job.failedAction = "";
    return job;
  } catch (error) {
    const termination = getJobTerminationRequest(job.id);
    if (termination) {
      job.status = "canceled";
      job.updatedAt = nowIso();
      job.preview.statusText = "Canceled";
      job.preview.subtitle = termination.reason || "Job canceled by request";
      pushLog(job, `pipeline canceled: ${job.preview.subtitle}`);
      persistJobSnapshot(job, "Pipeline canceled");
      broadcastSnapshot(job);
      const cancellationError = new Error(job.preview.subtitle);
      cancellationError.code = "JOB_CANCELED";
      throw cancellationError;
    }
    job.status = "failed";
    job.failedAction = action;
    job.updatedAt = nowIso();
    job.preview.statusText = "Failed";
    job.preview.subtitle = String(error?.message || "??????");
    pushLog(job, `pipeline error: ${job.preview.subtitle}`);
    persistJobSnapshot(job, "Pipeline failed");
    broadcastSnapshot(job);
    throw error;
  } finally {
    job.pipelineRunning = false;
    job.updatedAt = nowIso();
    broadcastSnapshot(job);
  }
}

function startEventStream(req, res, job) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write("event: snapshot\n");
  res.write(`data: ${JSON.stringify(detailFromJob(job))}\n\n`);

  const set = sseClients.get(job.id) || new Set();
  set.add(res);
  sseClients.set(job.id, set);

  const heartbeat = setInterval(() => {
    res.write("event: heartbeat\n");
    res.write('data: {"ok":true}\n\n');
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const current = sseClients.get(job.id);
    if (!current) return;
    current.delete(res);
    if (!current.size) sseClients.delete(job.id);
  });
}

function handleApi(req, res, url) {
  const forceSessionRefresh = url.searchParams.get("refresh") === "1";

  if (req.method === "GET" && url.pathname === "/api/projects") {
    const sessionState = loadSessionCatalog({force: forceSessionRefresh});
    writeJson(res, 200, {
      workspacePath: WORKSPACE_ROOT,
      outputRoot: "data/jobs",
      templateCount: listTemplates().length,
      assetCount: listAssets().length,
      compositions: listCompositions(),
      codexBridge: "Codex CLI",
      codexMode: "read-only chat bridge",
      accountCount: listAccounts().length,
      instructionPresetCount: getInstructionPresets().length,
      localSessionCount: sessionState.workspaceCount,
      sessionCatalogLoadedAt: sessionState.loadedAt ? new Date(sessionState.loadedAt).toISOString() : null,
      sessionCatalogScanMs: sessionState.scanMs,
      sessionCatalogPathScanMs: sessionState.pathScanMs,
      sessionPageSize: SESSION_PAGE_SIZE,
      sessionCacheTtlMs: SESSION_CACHE_TTL_MS,
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/codex/status") {
    checkCodexRuntime({force: forceSessionRefresh})
      .then((payload) => writeJson(res, 200, {...payload, model: getCurrentCodexModel()}))
      .catch((error) => writeJson(res, 200, {ok: false, error: error.message, checkedAt: nowIso()}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/codex/config") {
    writeJson(res, 200, {
      ...codexConsoleConfig,
      model: getCurrentCodexModel(),
      defaultModel: DEFAULT_CODEX_MODEL,
      updatedAt: nowIso(),
    });
    return true;
  }

  if (req.method === "PATCH" && url.pathname === "/api/codex/config") {
    parseBody(req)
      .then((body) => {
        const model = normalizeCodexModel(body.model || body.codexModel || "");
        const config = saveCodexConsoleConfig({model});
        writeJson(res, 200, {
          ...config,
          defaultModel: DEFAULT_CODEX_MODEL,
          updatedAt: nowIso(),
        });
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/templates") {
    writeJson(res, 200, {items: listTemplates()});
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/stats") {
    writeJson(res, 200, buildStatsPayload());
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/monitor/stats") {
    fetchMonitorStats({
      skipYoutube: url.searchParams.get("skip_youtube") === "true",
      skipTiktok: url.searchParams.get("skip_tiktok") === "true",
    })
      .then((payload) => writeJson(res, 200, payload))
      .catch((error) => writeJson(res, 500, {error: error.message}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/monitor/accounts") {
    listMonitorAccounts()
      .then((payload) => writeJson(res, 200, payload))
      .catch((error) => writeJson(res, 500, {error: error.message}));
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/replication/uploads") {
    parseBody(req, {limitBytes: 350_000_000})
      .then((body) => saveReplicationReferenceUpload(body))
      .then((payload) => writeJson(res, 200, payload))
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/monitor/accounts") {
    parseBody(req)
      .then((body) =>
        updateMonitorAccounts(
          "add",
          String(body.platform || "").trim().toLowerCase(),
          String(body.account || "").trim(),
        ),
      )
      .then((payload) => writeJson(res, 200, payload))
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "DELETE" && url.pathname === "/api/monitor/accounts") {
    updateMonitorAccounts(
      "remove",
      String(url.searchParams.get("platform") || "").trim().toLowerCase(),
      String(url.searchParams.get("account") || "").trim(),
    )
      .then((payload) => writeJson(res, 200, payload))
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/campaigns") {
    writeJson(res, 200, {items: listCampaigns()});
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/campaigns") {
    parseBody(req)
      .then((body) => {
        const campaign = createCampaign(body);
        writeJson(res, 201, campaign);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const campaignMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)$/);
  if (req.method === "PATCH" && campaignMatch) {
    parseBody(req)
      .then((body) => {
        const campaign = updateCampaign(campaignMatch[1], body);
        writeJson(res, 200, campaign);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "DELETE" && campaignMatch) {
    try {
      const campaign = deleteCampaign(campaignMatch[1]);
      writeJson(res, 200, campaign);
    } catch (error) {
      writeJson(res, 400, {error: error.message});
    }
    return true;
  }

  const campaignArchiveMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)\/archive$/);
  if (req.method === "POST" && campaignArchiveMatch) {
    parseBody(req)
      .then((body) => {
        const campaign = setCampaignArchived(campaignArchiveMatch[1], body.archived !== false);
        writeJson(res, 200, campaign);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/activities") {
    const projectId = String(url.searchParams.get("projectId") || "").trim();
    const items = listActivities()
      .filter((activity) => !projectId || activity.projectId === projectId)
      .filter((activity) => url.searchParams.get("includeArchived") === "1" || !activity.archived);
    writeJson(res, 200, {items});
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/activities") {
    parseBody(req)
      .then((body) => {
        const activity = createActivity(body);
        writeJson(res, 201, activity);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const activityMatch = url.pathname.match(/^\/api\/activities\/([^/]+)$/);
  if (req.method === "PATCH" && activityMatch) {
    parseBody(req)
      .then((body) => {
        const activity = updateActivity(activityMatch[1], body);
        writeJson(res, 200, activity);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const activityArchiveMatch = url.pathname.match(/^\/api\/activities\/([^/]+)\/archive$/);
  if (req.method === "POST" && activityArchiveMatch) {
    parseBody(req)
      .then((body) => {
        const activity = setActivityArchived(activityArchiveMatch[1], body.archived !== false);
        writeJson(res, 200, activity);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/topic-pool") {
    writeJson(res, 200, {items: filterTopics(url.searchParams)});
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/topic-pool") {
    parseBody(req)
      .then((body) => {
        const topic = createTopic(body);
        writeJson(res, 201, topic);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const topicMatch = url.pathname.match(/^\/api\/topic-pool\/([^/]+)$/);
  if (req.method === "PATCH" && topicMatch) {
    parseBody(req)
      .then((body) => {
        const topic = updateTopic(topicMatch[1], body);
        writeJson(res, 200, topic);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/batches") {
    writeJson(res, 200, {items: listBatchSummaries(url.searchParams)});
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/batches") {
    parseBody(req)
      .then((body) => {
        const result = createBatch(body);
        writeJson(res, 201, result);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const batchDetailMatch = url.pathname.match(/^\/api\/batches\/([^/]+)$/);
  if (req.method === "GET" && batchDetailMatch) {
    const batch = getBatchById(batchDetailMatch[1]);
    if (!batch) {
      writeJson(res, 404, {error: "Batch not found"});
      return true;
    }
    writeJson(res, 200, detailBatch(batch));
    return true;
  }

  const batchArtifactsMatch = url.pathname.match(/^\/api\/batches\/([^/]+)\/artifacts$/);
  if (req.method === "GET" && batchArtifactsMatch) {
    const batch = getBatchById(batchArtifactsMatch[1]);
    if (!batch) {
      writeJson(res, 404, {error: "Batch not found"});
      return true;
    }
    writeJson(res, 200, collectBatchArtifacts(batch, undefined, url.searchParams));
    return true;
  }

  const batchDownloadMatch = url.pathname.match(/^\/api\/batches\/([^/]+)\/artifacts\/download$/);
  if (req.method === "GET" && batchDownloadMatch) {
    const batch = getBatchById(batchDownloadMatch[1]);
    if (!batch) {
      writeJson(res, 404, {error: "Batch not found"});
      return true;
    }
    try {
      const zip = buildBatchArtifactZip(batch, url.searchParams);
      const filename = `${safeArchiveName(batch.topic || batch.id, "batch")}-videos.zip`;
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zip.length,
        "Cache-Control": "no-store",
      });
      res.end(zip);
    } catch (error) {
      writeJson(res, 400, {error: error.message});
    }
    return true;
  }

  const batchControlMatch = url.pathname.match(/^\/api\/batches\/([^/]+)\/control$/);
  if (req.method === "POST" && batchControlMatch) {
    parseBody(req)
      .then((body) => {
        const batch = controlBatchRun(batchControlMatch[1], body.command, body);
        writeJson(res, 202, batch);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const batchActionMatch = url.pathname.match(/^\/api\/batches\/([^/]+)\/actions\/([^/]+)$/);
  if (req.method === "POST" && batchActionMatch) {
    parseBody(req)
      .then((body) => {
        const batch = getBatchById(batchActionMatch[1]);
        const retryAction = String(body.action || body.retryAction || batch?.runState?.action || "generate-plan").trim();
        const action = batchActionMatch[2] === "retry-failed" ? retryAction : batchActionMatch[2];
        const result = startBatchRun(batchActionMatch[1], action, {
          failedOnly: batchActionMatch[2] === "retry-failed" || Boolean(body.failedOnly),
          force: Boolean(body.force),
        });
        writeJson(res, 202, result);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const batchJobActionMatch = url.pathname.match(/^\/api\/batches\/([^/]+)\/jobs\/([^/]+)\/actions\/([^/]+)$/);
  if (req.method === "POST" && batchJobActionMatch) {
    runBatchJobAction(batchJobActionMatch[1], batchJobActionMatch[2], batchJobActionMatch[3])
      .then((payload) => writeJson(res, 200, payload))
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/retry-queue") {
    writeJson(res, 200, {items: buildRetryQueue(url.searchParams)});
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/audit-events") {
    const limit = Number(url.searchParams.get("limit") || 80);
    writeJson(res, 200, {items: listAuditEvents(limit)});
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/accounts") {
    writeJson(res, 200, {items: listAccounts()});
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/accounts") {
    parseBody(req)
      .then((body) => {
        const account = createAccount(body);
        writeJson(res, 201, account);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const accountMatch = url.pathname.match(/^\/api\/accounts\/([^/]+)$/);
  if (req.method === "PATCH" && accountMatch) {
    parseBody(req)
      .then((body) => {
        const account = updateAccount(accountMatch[1], body);
        writeJson(res, 200, account);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "DELETE" && accountMatch) {
    try {
      const account = deleteAccount(accountMatch[1]);
      writeJson(res, 200, account);
    } catch (error) {
      writeJson(res, 400, {error: error.message});
    }
    return true;
  }

  const accountArchiveMatch = url.pathname.match(/^\/api\/accounts\/([^/]+)\/archive$/);
  if (req.method === "POST" && accountArchiveMatch) {
    parseBody(req)
      .then((body) => {
        const account = setAccountArchived(accountArchiveMatch[1], body.archived !== false);
        writeJson(res, 200, account);
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/instruction-presets") {
    writeJson(res, 200, {items: getInstructionPresets()});
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/assets") {
    writeJson(res, 200, {items: listAssets()});
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/sessions") {
    loadSessionCatalog({force: forceSessionRefresh});
    const scope = url.searchParams.get("scope") === "all" ? "all" : "workspace";
    const cursor = Number(url.searchParams.get("cursor") || 0);
    const limit = Number(url.searchParams.get("limit") || SESSION_PAGE_SIZE);
    const query = url.searchParams.get("q") || "";
    writeJson(res, 200, listSessions({scope, cursor, limit, query}));
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/sessions") {
    parseBody(req)
      .then(async (body) => {
        const job = await createRealSession(body.config || body);
        writeJson(res, 201, detailFromJob(job));
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (req.method === "GET" && sessionMatch) {
    loadSessionCatalog({force: forceSessionRefresh});
    const session = getSessionDetail(sessionMatch[1]);
    if (!session) {
      writeJson(res, 404, {error: "session not found"});
      return true;
    }
    writeJson(res, 200, session);
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/jobs") {
    writeJson(res, 200, {items: allJobs().map(summaryFromJob)});
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/jobs") {
    parseBody(req)
      .then(async (body) => {
        const prompt = String(body.prompt || "").trim();
        const sessionId = String(body.sessionId || "").trim();
        const config = body.config || body;

        if (sessionId && !prompt) {
          loadSessionCatalog({force: forceSessionRefresh});
          const sessionJob = createSessionJob(sessionId, config);
          if (!sessionJob) {
            writeJson(res, 404, {error: "session not found"});
            return;
          }
          writeJson(res, 201, detailFromJob(sessionJob));
          return;
        }

        if (!prompt) {
          writeJson(res, 400, {error: "prompt or sessionId is required"});
          return;
        }

        const job = createRuntimeJob(prompt, config);
        if (sessionId) {
          loadSessionCatalog({force: forceSessionRefresh});
          if (!getSessionDetail(sessionId)) {
            writeJson(res, 404, {error: "session not found"});
            return;
          }
          job.codexSessionId = sessionId;
          pushLog(job, `codex: bound session ${sessionId}`);
        }
        attachMessage(job, "user", "You", prompt);
        attachMessage(job, "assistant", "System", "视频任务已创建。下一步请点击“生成计划”或“一键生成 MP4”。");
        job.preview.statusText = "Draft";
        job.preview.subtitle = "任务已创建，等待生成计划。";
        job.preview.progress = Math.max(Number(job.preview.progress || 0), 18);
        pushLog(job, "task: created without starting Codex chat");
        persistJobSnapshot(job, "Task created");
        broadcastSnapshot(job);
        writeJson(res, 201, detailFromJob(job));
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const detailMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (req.method === "GET" && detailMatch) {
    const job = findJob(detailMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    ensurePosterFrame(job)
      .catch(() => {})
      .finally(() => writeJson(res, 200, detailFromJob(job)));
    return true;
  }

  if (req.method === "DELETE" && detailMatch) {
    try {
      const result = deleteJobAndArtifacts(detailMatch[1]);
      writeJson(res, 200, result);
    } catch (error) {
      const code = String(error.message || "").includes("not found") ? 404 : 400;
      writeJson(res, code, {error: error.message});
    }
    return true;
  }

  const jobAssetsMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/assets$/);
  if (req.method === "GET" && jobAssetsMatch) {
    const job = findJob(decodeURIComponent(jobAssetsMatch[1]));
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    try {
      writeJson(res, 200, {...buildJobAssetPayload(job), job: detailFromJob(job)});
    } catch (error) {
      writeJson(res, 400, {error: error.message});
    }
    return true;
  }

  const jobAssetPlanMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/assets\/plan$/);
  if (req.method === "POST" && jobAssetPlanMatch) {
    const job = findJob(decodeURIComponent(jobAssetPlanMatch[1]));
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    try {
      const payload = buildJobAssetPayload(job);
      pushLog(job, "assets: asset plan refreshed");
      persistJobSnapshot(job, "Asset plan refreshed");
      broadcastSnapshot(job);
      writeJson(res, 200, {...payload, job: detailFromJob(job)});
    } catch (error) {
      writeJson(res, 400, {error: error.message});
    }
    return true;
  }

  const jobAssetBindMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/assets\/([^/]+)\/bind$/);
  if (req.method === "POST" && jobAssetBindMatch) {
    const job = findJob(decodeURIComponent(jobAssetBindMatch[1]));
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    parseBody(req)
      .then((body) => {
        const assetPath = body.assetPath || body.sourcePath || body.path;
        const bundle = bindLocalAssetToJob(job, decodeURIComponent(jobAssetBindMatch[2]), assetPath, {
          locked: body.locked,
          status: body.status || "approved",
          force: body.force,
        });
        writeJson(res, 200, {
          ...bundle,
          assetStatus: buildAssetStatus(job),
          localAssets: listAssets(),
          job: detailFromJob(job),
        });
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const jobAssetGenerateAllMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/assets\/generate-fresh$/);
  if (req.method === "POST" && jobAssetGenerateAllMatch) {
    const job = findJob(decodeURIComponent(jobAssetGenerateAllMatch[1]));
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    parseBody(req)
      .then(async (body) => {
        const bundle = await generateFreshAssetsForJob(job, {
          force: Boolean(body?.force),
          status: body?.status || "suggested",
          provider: body?.provider || (job.useAiImageAssets ? "openai" : "svg"),
          model: body?.model || job.imageAssetModel || getImageApiConfig().model,
        });
        writeJson(res, 200, {
          ...bundle,
          assetStatus: buildAssetStatus(job),
          localAssets: listAssets(),
          job: detailFromJob(job),
        });
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const jobAssetGenerateMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/assets\/([^/]+)\/generate$/);
  if (req.method === "POST" && jobAssetGenerateMatch) {
    const job = findJob(decodeURIComponent(jobAssetGenerateMatch[1]));
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    parseBody(req)
      .then(async (body) => {
        const bundle = await generateFreshAssetForSlot(job, decodeURIComponent(jobAssetGenerateMatch[2]), {
          force: Boolean(body?.force),
          status: body?.status || "suggested",
          provider: body?.provider || (job.useAiImageAssets ? "openai" : "svg"),
          model: body?.model || job.imageAssetModel || getImageApiConfig().model,
        });
        writeJson(res, 200, {
          ...bundle,
          assetStatus: buildAssetStatus(job),
          localAssets: listAssets(),
          job: detailFromJob(job),
        });
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const jobAssetSlotMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/assets\/([^/]+)$/);
  if (req.method === "PATCH" && jobAssetSlotMatch) {
    const job = findJob(decodeURIComponent(jobAssetSlotMatch[1]));
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    parseBody(req)
      .then((body) => {
        const bundle = updateJobAssetSlot(job, decodeURIComponent(jobAssetSlotMatch[2]), body || {});
        writeJson(res, 200, {
          ...bundle,
          assetStatus: buildAssetStatus(job),
          localAssets: listAssets(),
          job: detailFromJob(job),
        });
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const configMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/config$/);
  if (req.method === "PATCH" && configMatch) {
    const job = findJob(configMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    parseBody(req)
      .then((body) => {
        const payload = body && typeof body === "object" ? body : {};
        if (Object.prototype.hasOwnProperty.call(payload, "codexSessionId")) {
          const nextSessionId = String(payload.codexSessionId || "").trim();
          if (nextSessionId) {
            loadSessionCatalog({force: forceSessionRefresh});
            if (!getSessionDetail(nextSessionId)) {
              throw new Error("session not found");
            }
          }
          const normalizedSessionId = nextSessionId || null;
          if ((job.codexSessionId || null) !== normalizedSessionId) {
            job.codexSessionId = normalizedSessionId;
            pushLog(job, normalizedSessionId ? `codex: bound session ${normalizedSessionId}` : "codex: session unbound");
          }
        }
        applyJobConfig(job, payload);
        const artifacts = ensureJobArtifactShape(job);
        if (fs.existsSync(artifacts.planPath)) {
          const plan = safeReadJson(artifacts.planPath);
          const subtitles = fs.existsSync(artifacts.subtitlesPath) ? safeReadJson(artifacts.subtitlesPath) || [] : [];
          if (plan) {
            writeRuntimeJobFiles(job, plan, subtitles, {autoBindLocal: !job.useAiImageAssets});
            pushLog(job, `config: subtitle font size set to ${normalizeSubtitleFontSize(job.subtitleFontSize, 28)}`);
          }
        }
        broadcastSnapshot(job);
        writeJson(res, 200, detailFromJob(job));
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const archiveJobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/archive$/);
  if (req.method === "POST" && archiveJobMatch) {
    const job = findJob(archiveJobMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    parseBody(req)
      .then((body) => {
        const archived = body.archived !== false;
        setJobArchived(job, archived);
        broadcastSnapshot(job);
        writeJson(res, 200, detailFromJob(job));
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const recoverJobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/recover$/);
  if (req.method === "POST" && recoverJobMatch) {
    const job = findJob(recoverJobMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    try {
      const recovered = recoverJob(job);
      broadcastSnapshot(recovered);
      writeJson(res, 201, detailFromJob(recovered));
    } catch (error) {
      writeJson(res, 400, {error: error.message});
    }
    return true;
  }

  const posterRefreshMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/artifacts\/poster\/refresh$/);
  if (req.method === "POST" && posterRefreshMatch) {
    const job = findJob(posterRefreshMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    refreshPosterFrame(job)
      .then(() => writeJson(res, 200, detailFromJob(job)))
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const posterDefaultMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/artifacts\/poster\/default$/);
  if (req.method === "POST" && posterDefaultMatch) {
    const job = findJob(posterDefaultMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    try {
      setDefaultPosterFrame(job);
      broadcastSnapshot(job);
      writeJson(res, 200, detailFromJob(job));
    } catch (error) {
      writeJson(res, 400, {error: error.message});
    }
    return true;
  }

  const eventMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/events$/);
  if (req.method === "GET" && eventMatch) {
    const job = findJob(eventMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    startEventStream(req, res, job);
    return true;
  }

  const messageMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/codex\/message$/);
  if (req.method === "POST" && messageMatch) {
    const job = findJob(messageMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    parseBody(req)
      .then(async (body) => {
        const message = String(body.message || "").trim();
        if (!message) {
          writeJson(res, 400, {error: "message is required"});
          return;
        }
        attachMessage(job, "user", "You", message);
        broadcastSnapshot(job);
        const reply = await runRealCodex(job, message);
        attachMessage(job, "assistant", "Codex", reply);
        try {
          refreshJobFromPlanArtifacts(job, "Plan refreshed after Codex script revision");
        } catch (error) {
          pushLog(job, `script: refresh skipped (${error.message})`);
        }
        broadcastSnapshot(job);
        writeJson(res, 200, detailFromJob(job));
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  const actionMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/actions\/([^/]+)$/);
  if (req.method === "POST" && actionMatch) {
    const job = findJob(actionMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    advanceJob(job, actionMatch[2])
      .then(() => writeJson(res, 200, detailFromJob(job)))
      .catch((error) => writeJson(res, 400, {error: error.message}));
    return true;
  }

  return false;
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

  if (url.pathname.startsWith("/api/")) {
    const handled = handleApi(req, res, url);
    if (!handled) writeJson(res, 404, {error: "not found"});
    return;
  }

  if (url.pathname.startsWith("/workspace/")) {
    const filePath = resolveWorkspacePath(url.pathname);
    if (!filePath) {
      writeText(res, 403, "Forbidden");
      return;
    }
    serveFile(res, filePath);
    return;
  }

  if (url.pathname.startsWith("/generated-jobs/")) {
    const filePath = resolveVideoPublicPath(url.pathname);
    if (!filePath) {
      writeText(res, 403, "Forbidden");
      return;
    }
    serveFile(res, filePath);
    return;
  }

  if (url.pathname === "/monitor" || url.pathname === "/monitor/") {
    serveMonitorIndex(res);
    return;
  }

  if (url.pathname.startsWith("/monitor/static/")) {
    const relativePath = decodeURIComponent(url.pathname.replace("/monitor/static/", ""));
    const filePath = path.resolve(MONITOR_WEB_ROOT, relativePath);
    if (!filePath.startsWith(MONITOR_WEB_ROOT)) {
      writeText(res, 403, "Forbidden");
      return;
    }
    serveMonitorAsset(res, filePath);
    return;
  }

  const relativePath = url.pathname === "/" || url.pathname === "/replication" ? "/index.html" : url.pathname;
  const filePath = path.resolve(WEB_ROOT, `.${relativePath}`);
  if (!filePath.startsWith(WEB_ROOT)) {
    writeText(res, 403, "Forbidden");
    return;
  }
  serveFile(res, filePath);
}

function boot() {
  loadPersistedJobs();
  loadSessionCatalog();
  const server = http.createServer(handleRequest);
  server.listen(PORT, HOST, () => {
    console.log(`Codex Video Console listening on http://${HOST}:${PORT}`);
  });
}

boot();

