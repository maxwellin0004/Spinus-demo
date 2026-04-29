const http = require("node:http");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
const {spawn} = require("node:child_process");
const {URL} = require("node:url");

const PORT = Number(process.env.PORT || 3008);
const HOST = process.env.HOST || "127.0.0.1";
const WEB_ROOT = __dirname;
const WORKSPACE_ROOT = path.resolve(__dirname, "..");
const USER_HOME = process.env.USERPROFILE || process.env.HOME || "";
const CODEX_HOME = path.join(USER_HOME, ".codex");
const TEMPLATE_ROOT = path.join(WORKSPACE_ROOT, "data", "templates");
const JOB_ROOT = path.join(WORKSPACE_ROOT, "data", "jobs");
const VIDEO_APP_ROOT = path.join(WORKSPACE_ROOT, "video-app");
const VIDEO_PUBLIC_ROOT = path.join(VIDEO_APP_ROOT, "public");
const GENERATED_PUBLIC_ROOT = path.join(VIDEO_PUBLIC_ROOT, "generated-jobs");
const COMPOSITION_ROOT = path.join(WORKSPACE_ROOT, "video-app", "src", "compositions");
const ASSET_IMAGE_ROOT = path.join(WORKSPACE_ROOT, "assets", "images");
const ACCOUNT_FILE = path.join(WEB_ROOT, "accounts.json");
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
const CODEX_MODEL = process.env.CODEX_MODEL || "gpt-5.4";
const CODEX_BYPASS_SANDBOX = process.env.CODEX_BYPASS_SANDBOX !== "0";
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

const templateMeta = {
  ai_concept_analyse: "AI 概念分析 / 拆解",
  bikini_margin_theater: "戏剧化剧情 / 角色对撞",
  comic_emotional_insight: "漫画洞察 / 情绪视角",
  comic_habit_spiral: "漫画叙事 / 习惯机制",
  minimal_psych_explainer: "心理机制 / 方法论",
  new_signals: "交易信号 / 指标解释",
  tech_archive_explainer: "技术档案 / 资料考据",
};

const previewImages = [
  "/workspace/assets/images/macd_ref_chart_2.jpg",
  "/workspace/assets/images/macd_ref_chart_1.jpg",
  "/workspace/assets/images/scenario_video_breakdown.jpg",
  "/workspace/assets/images/hook_financial_crisis_newspaper.jpg",
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
    title: "冲突戏剧化叙事",
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
    title: "技术档案解释",
    compositionId: "TechArchiveExplainer",
    suitablePlatforms: ["bilibili", "youtube"],
    defaultDurationSec: 90,
    aspectRatio: "16:9",
    summary: "适合技术背景、资料引用和更长时长的说明型内容。",
    tags: ["技术", "档案", "资料"],
  },
};

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

function safeWriteJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
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
  job.artifacts.outputVideoPath = path.join(workspaceDir, "output.mp4");
  job.artifacts.posterPath = path.join(workspaceDir, "poster.jpg");
  job.artifacts.publicVoiceoverPath = path.join(publicDir, "voiceover.mp3");
  job.artifacts.publicVoiceoverUrl = `/workspace/${relativeWorkspacePath(path.join(publicDir, "voiceover.mp3"))}`;
  return job.artifacts;
}

function toWorkspaceUrl(targetPath) {
  return `/workspace/${relativeWorkspacePath(targetPath)}`;
}

function buildArtifactManifest(job) {
  const artifacts = ensureJobArtifactShape(job);
  const items = [
    ["request", "Request JSON", artifacts.requestPath],
    ["planBrief", "Plan Brief", artifacts.planBriefPath],
    ["plan", "Video Plan", artifacts.planPath],
    ["voiceoverUnits", "Voiceover Units", artifacts.unitsPath],
    ["voiceoverText", "Voiceover Text", artifacts.voiceoverTextPath],
    ["subtitles", "Subtitles", artifacts.subtitlesPath],
    ["alignment", "Alignment", artifacts.alignmentPath],
    ["renderProps", "Render Props", artifacts.renderPropsPath],
    ["poster", "Poster Frame", artifacts.posterPath],
    ["audio", "Voiceover Audio", artifacts.publicVoiceoverPath],
    ["video", "Rendered Video", artifacts.outputVideoPath],
  ];

  return items.reduce(
    (output, [key, label, filePath]) => {
      const exists = fs.existsSync(filePath);
      output[key] = {
        key,
        label,
        exists,
        path: relativeWorkspacePath(filePath),
        url: exists ? toWorkspaceUrl(filePath) : "",
        fileName: path.basename(filePath),
      };
      return output;
    },
    {
      workspaceDir: {
        key: "workspaceDir",
        label: "Output Directory",
        exists: true,
        path: relativeWorkspacePath(artifacts.workspaceDir),
        url: "",
      },
    },
  );
}

function persistJobSnapshot(job, message = "") {
  const artifacts = ensureJobArtifactShape(job);
  safeWriteJson(path.join(artifacts.workspaceDir, "status.json"), {
    id: job.id,
    status: job.status,
    progress: Number(job.preview?.progress || 0),
    message: message || job.preview?.subtitle || "",
    updated_at: job.updatedAt,
    output_dir: job.outputDir,
    plan_source: job.planSource || "",
    plan_fallback_reason: job.planFallbackReason || "",
    artifacts: {
      plan: fs.existsSync(artifacts.planPath) ? relativeWorkspacePath(artifacts.planPath) : null,
      subtitles: fs.existsSync(artifacts.subtitlesPath) ? relativeWorkspacePath(artifacts.subtitlesPath) : null,
      audio: fs.existsSync(artifacts.publicVoiceoverPath) ? relativeWorkspacePath(artifacts.publicVoiceoverPath) : null,
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

function createAccount(input = {}) {
  const name = String(input.name || "").trim();
  if (!name) {
    throw new Error("Account name is required");
  }

  const templateId = String(input.defaultTemplateId || "new_signals");
  const template = getTemplateCatalogEntry(templateId) || getTemplateCatalogEntry("new_signals") || null;
  const account = {
    id: sanitizeId(input.id || name, "account"),
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
  };

  const accounts = listAccounts();
  if (accounts.some((item) => item.id === account.id)) {
    account.id = `${account.id}-${Date.now()}`;
  }
  const nextAccounts = [...accounts, account];
  saveAccounts(nextAccounts);
  return account;
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

function createRuntimeJob(prompt, configInput = {}) {
  const initialConfig = normalizeJobConfig(
    {
      ...configInput,
      templateId: configInput.templateId || chooseTemplate(prompt),
    },
    prompt,
  );
  const id = `job_ui_${Date.now()}_${slugFromPrompt(prompt)}`;
  const title = /假突破/.test(prompt) ? "假突破交易教育短视频" : String(prompt || "").slice(0, 22) || "新建视频任务";
  const job = {
    id,
    source: "runtime",
    title,
    prompt,
    templateId: initialConfig.templateId,
    compositionId: initialConfig.compositionId,
    aspectRatio: initialConfig.aspectRatio,
    durationSec: initialConfig.durationSec,
    accountId: initialConfig.accountId,
    templateLocked: initialConfig.templateLocked,
    activePresetIds: initialConfig.activePresetIds,
    openInstruction: initialConfig.openInstruction,
    instructionScope: initialConfig.instructionScope,
    outputDir: `data/jobs/${id}`,
    status: "planning",
    updatedAt: nowIso(),
    stageIndex: 1,
    codexSessionId: null,
    messages: [],
    pendingAssistantText: "",
    codexRunning: false,
    steps: makeVideoSteps(1),
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
  };
  applyJobConfig(job, initialConfig);
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
  const session = sessionCatalog.get(sessionId);
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
    const jobJson = safeReadJson(path.join(jobDir, "job.json")) || {id: entry.name, status: "unknown"};
    const statusJson = safeReadJson(path.join(jobDir, "status.json")) || {};
    const planBriefJson = safeReadJson(path.join(jobDir, "plan-brief.json")) || {};
    const logText = safeReadText(path.join(jobDir, "runner.log"));
    const relativeDir = path.relative(WORKSPACE_ROOT, jobDir).replaceAll("\\", "/");
    const posterPath = path.join(jobDir, "poster.jpg");
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
      return {
        id: entry.name,
        title: meta?.title || entry.name.replaceAll("_", " "),
        compositionId: meta?.compositionId || "",
        suitablePlatforms: meta?.suitablePlatforms || [],
        defaultDurationSec: meta?.defaultDurationSec || 60,
        aspectRatio: meta?.aspectRatio || "9:16",
        summary: meta?.summary || "",
        tags: meta?.tags || [],
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
  return {
    id: job.id,
    source: job.source,
    title: job.title,
    status: job.status,
    updatedAt: job.updatedAt,
    accountId: job.accountId || "",
    templateId: job.templateId,
    compositionId: job.compositionId || "",
    durationSec: job.durationSec || 60,
    templateLocked: Boolean(job.templateLocked),
    activePresetIds: ensureArray(job.activePresetIds),
    openInstruction: job.openInstruction || "",
    instructionScope: job.instructionScope || "run",
    outputDir: job.outputDir,
    codexSessionId: job.codexSessionId || null,
    planSource: job.planSource || "",
    planFallbackReason: job.planFallbackReason || "",
  };
}

function detailFromJob(job) {
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
    planSource: job.planSource || "",
    planFallbackReason: job.planFallbackReason || "",
  };
}

function allJobs() {
  return [...runtimeJobs.values(), ...persistedJobs.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function findJob(jobId) {
  return runtimeJobs.get(jobId) || persistedJobs.get(jobId) || null;
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

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
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

function resolveWorkspacePath(urlPath) {
  const relative = decodeURIComponent(urlPath.replace(/^\/workspace\//, ""));
  const resolved = path.resolve(WORKSPACE_ROOT, relative);
  if (!resolved.startsWith(WORKSPACE_ROOT)) return null;
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
  const args = ["--json", "--model", CODEX_MODEL, "--skip-git-repo-check"];
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

function spawnCodexProcess(args, promptText = "") {
  const argsFile = path.join(os.tmpdir(), `codex-video-console-args-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const promptFile = promptText
    ? path.join(os.tmpdir(), `codex-video-console-prompt-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`)
    : "";
  fs.writeFileSync(argsFile, JSON.stringify(args), "utf8");
  if (promptFile) {
    fs.writeFileSync(promptFile, String(promptText || ""), "utf8");
  }
  const bridgeCommand = [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    [
      "$ErrorActionPreference = 'Stop'",
      "$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)",
      "$exe = $env:CODEX_BRIDGE_EXE",
      "if ([System.IO.Path]::IsPathRooted($exe)) { $exe = [System.IO.Path]::GetFullPath($exe) }",
      "$argv = Get-Content -LiteralPath $env:CODEX_BRIDGE_ARGS_FILE -Raw -Encoding UTF8 | ConvertFrom-Json",
      "$promptFile = $env:CODEX_BRIDGE_PROMPT_FILE",
      "if ($promptFile -and (Test-Path -LiteralPath $promptFile)) {",
      "  Get-Content -LiteralPath $promptFile -Raw -Encoding UTF8 | & $exe @argv",
      "} else {",
      "  & $exe @argv",
      "}",
      "exit $LASTEXITCODE",
    ].join("; "),
  ];
  const child = spawn(POWERSHELL_COMMAND, bridgeCommand, {
    cwd: WORKSPACE_ROOT,
    env: {
      ...process.env,
      PYTHONUTF8: "1",
      CODEX_BRIDGE_EXE: CODEX_COMMAND,
      CODEX_BRIDGE_ARGS_FILE: argsFile,
      CODEX_BRIDGE_PROMPT_FILE: promptFile,
    },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const cleanupArgsFile = () => {
    try {
      if (fs.existsSync(argsFile)) fs.unlinkSync(argsFile);
    } catch {}
    try {
      if (promptFile && fs.existsSync(promptFile)) fs.unlinkSync(promptFile);
    } catch {}
  };
  child.on("close", cleanupArgsFile);
  child.on("error", cleanupArgsFile);
  return child;
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

function splitLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function clipText(text, max = 110) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function inferPrimaryTopic(prompt) {
  const cleaned = String(prompt || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "当前主题";
  return clipText(cleaned, 42);
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
  const prompt = inferPrimaryTopic(job.prompt);
  const hookLine = plan.scriptSections.find((section) => section.label === "Hook")?.text || "先说最关键的判断。";
  const bodyLine = plan.scriptSections.find((section) => section.label === "Body")?.text || "把注意力收束到最核心的一步。";
  const closeLine = plan.scriptSections.find((section) => section.label === "Close")?.text || "最后给出一个明确动作。";
  const emphasisSeed = pickAccentWords(prompt, [plan.headline, job.templateId]);

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
      text: `先把 ${prompt} 拆成一个核心判断。${bodyLine}`,
      emphasisWords: pickAccentWords(bodyLine, emphasisSeed),
    },
    {
      voiceId: "v04",
      visualSectionId: "chart_case_1",
      text: `第一步，先看结构位置，不要在最热的时候直接追进去。`,
      emphasisWords: ["第一步", "结构位置"],
    },
    {
      voiceId: "v05",
      visualSectionId: "chart_case_2",
      text: `第二步，再看量能、动能或者内部证据有没有同步跟上。`,
      emphasisWords: ["第二步", "量能", "动能"],
    },
    {
      voiceId: "v06",
      visualSectionId: "chart_case_3",
      text: `第三步，只在确认动作出现以后，再决定要不要执行。`,
      emphasisWords: ["第三步", "确认动作"],
    },
    {
      voiceId: "v07",
      visualSectionId: "checklist",
      text: `不要把预警当成动作，把判断顺序做对，节奏就会稳很多。`,
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
  return plan;
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
  const topic = inferPrimaryTopic(job.prompt);
  const headline = /假突破/.test(job.prompt)
    ? "假突破最危险的地方"
    : /交易|MACD|量能|背离/.test(job.prompt)
      ? `${topic}里最危险的一步`
      : clipText(topic, 26);
  const toneSummary = ensureStringList(account?.toneTags).join(" / ") || "结构清楚，节奏直接";
  const platform = platformLabel(account?.platform);

  const scriptSections = [
    {
      label: "Hook",
      text: /假突破/.test(job.prompt)
        ? "很多假突破不是机会，而是你在最热的时候追进去。"
        : `先给结论：${topic}里最容易出错的，不是你没看懂，而是你太早动作。`,
    },
    {
      label: "Body",
      text: /交易|MACD|量能|背离/.test(job.prompt)
        ? "先看结构位置，再看量能和内部动能，最后只等确认动作。"
        : "先拆核心判断，再给执行顺序，避免把信息铺得太散。",
    },
    {
      label: "Close",
      text: account?.ctaStyle
        ? `结尾按 ${account.ctaStyle} 收束：给观众一个能立刻执行的下一步。`
        : "结尾只保留一个明确动作，让观众知道下一步该看什么。",
    },
  ];

  const data = {
    newsContext: {
      kicker: `${account?.name || "Codex Job"} / ${platform}`,
      title: `${headline}，往往不是表面上最显眼的那一下`,
      quote: `${account?.persona || "当前账号人设"} 的表达风格是 ${toneSummary}，所以这一版先用清楚的结构把风险点讲透。`,
      sourceLabel: `${template?.title || job.templateId} / ${job.durationSec}s / ${job.aspectRatio}`,
      bullets: [
        `先明确 ${topic} 的核心风险点`,
        "把预警、确认、执行拆成三步",
        "只保留观众最需要记住的一条顺序",
      ],
      tags: [job.templateId, account?.platform || "local", "codex-job"],
      mediaCards: [
        {
          imageSrc: "/images/shared/hook_paul_tudor_jones.jpg",
          label: "Context",
          caption: `先把 ${topic} 放进一个清楚的上下文里。`,
        },
        {
          imageSrc: "/images/shared/hook_occupy_wall_street.jpg",
          label: "Sentiment",
          caption: "情绪最热的时候，最容易忽略结构已经开始走弱。",
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
      kicker: `${platform} / Hook`,
      headline,
      subheadline: scriptSections[0].text,
      stat: `${job.durationSec}s`,
      statLabel: `${template?.title || job.templateId} / ${toneSummary}`,
      dateLabel: `Output -> data/jobs/${job.id}`,
      insetImageSrc: "/images/shared/macd_ref_chart_1.jpg",
      sourceLabel: `${account?.persona || "local profile"} / ${platform}`,
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
        {title: "证据", body: "再看量能、动能或节奏有没有同步支持当前方向。"},
        {title: "确认", body: "只有确认动作出现，再决定要不要执行。"},
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
      subtitle: `当前账号风格：${account?.persona || "未指定"}；当前模板：${template?.title || job.templateId}。`,
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
      tags: ["结构先行", "证据确认", "动作靠后", platform],
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
      aspectRatio: job.aspectRatio || "16:9",
      prompt: job.prompt,
    },
    headline,
    toneSummary,
    scriptSections,
    voiceoverUnits: buildVoiceoverUnits(job, {headline, scriptSections}),
    timeline: REAL_PIPELINE_TIMELINE,
    data,
  };
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
    },
  };
}

function updateJobFromPlan(job, plan) {
  job.title = plan.headline;
  job.compositionId = "codex-job-preview";
  job.scriptSections = plan.scriptSections;
  job.preview.headline = plan.headline;
  job.preview.summary = `${plan.meta.renderCompositionId} / ${job.durationSec}s / ${job.aspectRatio}`;
  job.preview.imageUrl = "/workspace/video-app/public/images/shared/scenario_video_breakdown.jpg";
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
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (stdoutRemainder.trim()) {
        pushLog(job, `${label}: ${stdoutRemainder.trim()}`);
      }
      if (stderrRemainder.trim()) {
        pushLog(job, `${label}: ${stderrRemainder.trim()}`);
        lastErrorLine = stderrRemainder.trim();
      }
      if (code !== 0) {
        reject(new Error(lastErrorLine || `${label} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
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
    pushLog(job, `poster: wrote ${relativeWorkspacePath(artifacts.posterPath)}`);
  }
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

function writeRuntimeJobFiles(job, plan, subtitles = []) {
  const artifacts = ensureJobArtifactShape(job);
  safeWriteJson(artifacts.requestPath, {
    id: job.id,
    prompt: job.prompt,
    accountId: job.accountId,
    templateId: job.templateId,
    compositionId: job.compositionId,
    durationSec: job.durationSec,
    aspectRatio: job.aspectRatio,
    activePresetIds: ensureArray(job.activePresetIds),
    openInstruction: job.openInstruction || "",
    instructionScope: job.instructionScope || "run",
    updatedAt: nowIso(),
  });
  safeWriteJson(artifacts.planBriefPath, {
    source: plan.meta?.planSource || "local-fallback",
    headline: plan.headline,
    toneSummary: plan.toneSummary,
    scriptSections: plan.scriptSections,
    generatedAt: plan.generatedAt,
  });
  safeWriteJson(artifacts.planPath, plan);
  safeWriteJson(artifacts.unitsPath, plan.voiceoverUnits);
  safeWriteText(artifacts.voiceoverTextPath, plan.voiceoverUnits.map((unit) => unit.text).join(" "));
  safeWriteJson(artifacts.renderPropsPath, buildRenderProps(job, plan, subtitles));
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
  writeRuntimeJobFiles(job, plan, []);
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
        const errorMessage = extractCodexErrorMessage(payload);
        if (errorMessage) {
          lastCodexError = errorMessage;
        }
        if (payload.type === "thread.started" && payload.thread_id) {
          threadId = payload.thread_id;
        }
      } catch {}
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
      stdoutRemainder += chunk.toString("utf8");
      const lines = stdoutRemainder.split(/\r?\n/);
      stdoutRemainder = lines.pop() || "";
      for (const line of lines) {
        handleLine(line);
        handleCompletionCandidate(line);
      }
    });

    child.stderr.on("data", (chunk) => {
      stderrRemainder += chunk.toString("utf8");
      const lines = stderrRemainder.split(/\r?\n/);
      stderrRemainder = lines.pop() || "";
      for (const line of lines) {
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
      reject(new Error(formatCodexFailureMessage("Codex session bootstrap timed out", lastCodexError)));
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

    const handleLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const payload = JSON.parse(trimmed);
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
          pushLog(job, cleaned);
          if (!lastCodexError && /(error|failed|denied|forbidden|unauthorized)/i.test(cleaned)) {
            lastCodexError = cleaned;
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
      job.codexRunning = false;
      setPendingAssistant(job, "");

      const finalMessage = lastAgentMessage || tryReadLastMessage(outputFile);
      try {
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch {}

      if (failed) return;

      if (signal) {
        pushLog(job, `codex: exec terminated by signal ${signal}`);
        reject(new Error(`Codex terminated by signal ${signal}`));
        return;
      }

      if (code !== 0) {
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
      stdoutRemainder += chunk.toString("utf8");
      const lines = stdoutRemainder.split(/\r?\n/);
      stdoutRemainder = lines.pop() || "";
      for (const line of lines) {
        handleLine(line);
        handleCompletionCandidate(line);
      }
    });

    child.stderr.on("data", (chunk) => {
      stderrRemainder += chunk.toString("utf8");
      const lines = stderrRemainder.split(/\r?\n/);
      stderrRemainder = lines.pop() || "";
      for (const line of lines) {
        handleLine(line);
        handleCompletionCandidate(line);
      }
    });

    child.on("error", (error) => {
      failed = true;
      if (killTimer) clearTimeout(killTimer);
      job.codexRunning = false;
      setPendingAssistant(job, "");
      pushLog(job, `codex: process error ${error.message}`);
      reject(error);
    });

    killTimer = setTimeout(() => {
      if (finalized || failed) return;
      failed = true;
      flushRemainders();
      job.codexRunning = false;
      setPendingAssistant(job, "");
      pushLog(job, `codex: request timed out after ${CODEX_PROCESS_TIMEOUT_MS}ms`);
      try {
        child.kill();
      } catch {}
      reject(new Error(formatCodexFailureMessage(`Codex request timed out after ${CODEX_PROCESS_TIMEOUT_MS}ms`, lastCodexError)));
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
    "generate-plan": runGeneratePlan,
    tts: runTts,
    render: runRender,
  };
  const runner = actionMap[action];
  if (!runner) {
    throw new Error(`Unsupported action: ${action}`);
  }

  job.pipelineRunning = true;
  job.updatedAt = nowIso();
  broadcastSnapshot(job);

  try {
    await runner(job);
    return job;
  } catch (error) {
    job.status = "failed";
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

  if (req.method === "GET" && url.pathname === "/api/templates") {
    writeJson(res, 200, {items: listTemplates()});
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

        if (sessionId) {
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
        attachMessage(job, "user", "You", prompt);
        broadcastSnapshot(job);
        const reply = await runRealCodex(job, prompt);
        attachMessage(job, "assistant", "Codex", reply);
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

  const configMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/config$/);
  if (req.method === "PATCH" && configMatch) {
    const job = findJob(configMatch[1]);
    if (!job) {
      writeJson(res, 404, {error: "job not found"});
      return true;
    }
    parseBody(req)
      .then((body) => {
        applyJobConfig(job, body);
        broadcastSnapshot(job);
        writeJson(res, 200, detailFromJob(job));
      })
      .catch((error) => writeJson(res, 400, {error: error.message}));
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

  const relativePath = url.pathname === "/" ? "/index.html" : url.pathname;
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
