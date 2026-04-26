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
const COMPOSITION_ROOT = path.join(WORKSPACE_ROOT, "video-app", "src", "compositions");
const ASSET_IMAGE_ROOT = path.join(WORKSPACE_ROOT, "assets", "images");
const ACCOUNT_FILE = path.join(WEB_ROOT, "accounts.json");
const SESSION_INDEX_FILE = path.join(CODEX_HOME, "session_index.jsonl");
const SESSION_ROOT = path.join(CODEX_HOME, "sessions");
const ARCHIVED_SESSION_ROOT = path.join(CODEX_HOME, "archived_sessions");
const CODEX_COMMAND = process.env.CODEX_COMMAND || "codex";
const SESSION_CACHE_TTL_MS = Number(process.env.SESSION_CACHE_TTL_MS || 30000);
const CODEX_EXEC_ARGS = [
  "exec",
  "--json",
  "--sandbox",
  "read-only",
  "--skip-git-repo-check",
  "-C",
  WORKSPACE_ROOT,
];
const SESSION_BOOTSTRAP_MARKER = "__CODEX_VIDEO_CONSOLE_BOOTSTRAP__";
const SESSION_BOOTSTRAP_READY = "__CODEX_VIDEO_CONSOLE_READY__";
const SESSION_BOOTSTRAP_PROMPT = `${SESSION_BOOTSTRAP_MARKER}\nReply with exactly ${SESSION_BOOTSTRAP_READY}.`;

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
const sseClients = new Map();
const sessionCatalogState = {
  loadedAt: 0,
  scanMs: 0,
};
let accountCache = null;

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
  const templateId = input.templateId || account?.defaultTemplateId || chooseTemplate(prompt);
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
  };
  applyJobConfig(job, initialConfig);
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

function loadSessionCatalog(options = {}) {
  const force = Boolean(options.force);
  const startedAt = Date.now();
  if (!force && sessionCatalogState.loadedAt && startedAt - sessionCatalogState.loadedAt < SESSION_CACHE_TTL_MS) {
    return sessionCatalogState;
  }

  sessionCatalog.clear();
  const indexById = new Map();

  for (const entry of readJsonLines(SESSION_INDEX_FILE)) {
    if (!entry?.id) continue;
    const current = indexById.get(entry.id);
    if (!current || String(entry.updated_at || "") > String(current.updated_at || "")) {
      indexById.set(entry.id, entry);
    }
  }

  const sessionFiles = [...walkJsonlFiles(SESSION_ROOT), ...walkJsonlFiles(ARCHIVED_SESSION_ROOT)];
  for (const filePath of sessionFiles) {
    const meta = extractSessionMeta(filePath);
    if (!meta) continue;
    const indexMeta = indexById.get(meta.id) || {};
    const previewMessages = summarizeSessionMessages(filePath, 2);
    sessionCatalog.set(meta.id, {
      id: meta.id,
      threadName: indexMeta.thread_name || `Session ${meta.id.slice(0, 8)}`,
      updatedAt: indexMeta.updated_at || meta.timestamp || nowIso(),
      cwd: meta.cwd,
      archived: filePath.startsWith(ARCHIVED_SESSION_ROOT),
      filePath,
      previewText: previewMessages[previewMessages.length - 1]?.text || "",
    });
  }

  sessionCatalogState.loadedAt = Date.now();
  sessionCatalogState.scanMs = sessionCatalogState.loadedAt - startedAt;
  return sessionCatalogState;
}

function listSessions(scope = "workspace") {
  let items = [...sessionCatalog.values()];
  if (scope !== "all") {
    items = items.filter((session) => session.cwd === WORKSPACE_ROOT);
  }
  return items
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .map((session) => ({
      id: session.id,
      threadName: session.threadName,
      updatedAt: session.updatedAt,
      cwd: session.cwd,
      archived: session.archived,
      previewText: session.previewText,
    }));
}

function getSessionDetail(sessionId) {
  const session = sessionCatalog.get(sessionId);
  if (!session) return null;
  return {
    id: session.id,
    threadName: session.threadName,
    updatedAt: session.updatedAt,
    cwd: session.cwd,
    archived: session.archived,
    messages: summarizeSessionMessages(session.filePath, 14),
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
    const logText = safeReadText(path.join(jobDir, "runner.log"));
    const relativeDir = path.relative(WORKSPACE_ROOT, jobDir).replaceAll("\\", "/");
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
        imageUrl: "/workspace/assets/images/scenario_video_breakdown.jpg",
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

function buildCodexArgs(job, outputFile) {
  if (job.codexSessionId) {
    return ["exec", "resume", "--json", "--skip-git-repo-check", "-o", outputFile, job.codexSessionId, "-"];
  }
  return [...CODEX_EXEC_ARGS, "-o", outputFile, "-"];
}

function quotePowerShell(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function buildCodexPowerShellCommand(job, outputFile) {
  const executable =
    CODEX_COMMAND.includes("\\") || CODEX_COMMAND.includes("/")
      ? `& ${quotePowerShell(CODEX_COMMAND)}`
      : CODEX_COMMAND;
  const args = buildCodexArgs(job, outputFile).map((item) => quotePowerShell(item)).join(" ");
  return `${executable} ${args}`;
}

function cleanCodexLogLine(line) {
  const text = String(line || "").trim();
  if (!text) return "";
  if (text.startsWith("{") && text.endsWith("}")) return "";
  if (text === "Reading additional input from stdin...") return "";
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
  const promptFile = path.join(os.tmpdir(), `codex-video-console-session-${Date.now()}-prompt.txt`);
  const powerShellCommand = [
    "$OutputEncoding = [Console]::OutputEncoding = [Console]::InputEncoding = [System.Text.UTF8Encoding]::new()",
    `Get-Content -LiteralPath ${quotePowerShell(promptFile)} -Raw -Encoding UTF8 | ${buildCodexPowerShellCommand({codexSessionId: null}, outputFile)}`,
  ].join("; ");

  return new Promise((resolve, reject) => {
    let stdoutRemainder = "";
    let stderrRemainder = "";
    let failed = false;
    let finalized = false;
    let exitTimer = null;
    let threadId = "";

    fs.writeFileSync(promptFile, SESSION_BOOTSTRAP_PROMPT, "utf8");

    const child = spawn("powershell.exe", ["-NoProfile", "-Command", powerShellCommand], {
      cwd: WORKSPACE_ROOT,
      env: process.env,
      shell: false,
    });

    const handleLine = (line) => {
      const trimmed = String(line || "").trim();
      if (!trimmed) return;
      try {
        const payload = JSON.parse(trimmed);
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

    const cleanupFiles = () => {
      try {
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        if (fs.existsSync(promptFile)) fs.unlinkSync(promptFile);
      } catch {}
    };

    const finalizeRun = async (code, signal) => {
      if (finalized) return;
      finalized = true;
      if (exitTimer) clearTimeout(exitTimer);

      flushRemainders();
      cleanupFiles();

      if (failed) return;
      if (signal) {
        reject(new Error(`Codex session bootstrap terminated by signal ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`Codex session bootstrap exited with code ${code}`));
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

    child.stdout.on("data", (chunk) => {
      stdoutRemainder += chunk.toString("utf8");
      const lines = stdoutRemainder.split(/\r?\n/);
      stdoutRemainder = lines.pop() || "";
      for (const line of lines) handleLine(line);
    });

    child.stderr.on("data", (chunk) => {
      stderrRemainder += chunk.toString("utf8");
      const lines = stderrRemainder.split(/\r?\n/);
      stderrRemainder = lines.pop() || "";
      for (const line of lines) handleLine(line);
    });

    child.on("error", (error) => {
      failed = true;
      cleanupFiles();
      reject(error);
    });

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
  const promptFile = path.join(os.tmpdir(), `${job.id}-${Date.now()}-prompt.txt`);
  const prompt = job.codexSessionId ? String(latestMessage || "") : buildCodexPrompt(job, latestMessage);
  const powerShellCommand = [
    "$OutputEncoding = [Console]::OutputEncoding = [Console]::InputEncoding = [System.Text.UTF8Encoding]::new()",
    `Get-Content -LiteralPath ${quotePowerShell(promptFile)} -Raw -Encoding UTF8 | ${buildCodexPowerShellCommand(job, outputFile)}`,
  ].join("; ");
  const initialSessionId = job.codexSessionId;

  return new Promise((resolve, reject) => {
    job.codexRunning = true;
    pushLog(job, job.codexSessionId ? `codex: resume ${job.codexSessionId}` : "codex: exec started");
    setPendingAssistant(job, "Codex 正在处理你的消息...");

    let lastAgentMessage = "";
    let stdoutRemainder = "";
    let stderrRemainder = "";
    let failed = false;
    let finalized = false;
    let exitTimer = null;

    fs.writeFileSync(promptFile, prompt, "utf8");

    const child = spawn("powershell.exe", ["-NoProfile", "-Command", powerShellCommand], {
      cwd: WORKSPACE_ROOT,
      env: process.env,
      shell: false,
    });

    const handleLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const payload = JSON.parse(trimmed);
        if (payload.type === "item.completed" && payload.item?.type === "agent_message" && payload.item?.text) {
          lastAgentMessage = String(payload.item.text);
        }
        handleCodexEvent(job, payload);
      } catch {
        const cleaned = cleanCodexLogLine(trimmed);
        if (cleaned) pushLog(job, cleaned);
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

      flushRemainders();
      job.codexRunning = false;
      setPendingAssistant(job, "");

      const finalMessage = lastAgentMessage || tryReadLastMessage(outputFile);
      try {
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        if (fs.existsSync(promptFile)) fs.unlinkSync(promptFile);
      } catch {}

      if (failed) return;

      if (signal) {
        pushLog(job, `codex: exec terminated by signal ${signal}`);
        reject(new Error(`Codex terminated by signal ${signal}`));
        return;
      }

      if (code !== 0) {
        pushLog(job, `codex: exec exited with code ${code}`);
        reject(new Error(`Codex exited with code ${code}`));
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

    child.stdout.on("data", (chunk) => {
      stdoutRemainder += chunk.toString("utf8");
      const lines = stdoutRemainder.split(/\r?\n/);
      stdoutRemainder = lines.pop() || "";
      for (const line of lines) handleLine(line);
    });

    child.stderr.on("data", (chunk) => {
      stderrRemainder += chunk.toString("utf8");
      const lines = stderrRemainder.split(/\r?\n/);
      stderrRemainder = lines.pop() || "";
      for (const line of lines) handleLine(line);
    });

    child.on("error", (error) => {
      failed = true;
      job.codexRunning = false;
      setPendingAssistant(job, "");
      pushLog(job, `codex: process error ${error.message}`);
      reject(error);
    });

    child.on("exit", (code, signal) => {
      // `close` can stall if descendant processes inherit stdio handles.
      exitTimer = setTimeout(() => finalizeRun(code, signal), 250);
    });

    child.on("close", (code, signal) => {
      finalizeRun(code, signal);
    });
  });
}

function advanceJob(job, action) {
  if (job.source === "persisted" || job.source === "session") return job;

  if (action === "generate-plan") {
    job.stageIndex = Math.max(job.stageIndex, 2);
    job.steps = makeVideoSteps(2);
    job.status = "planning";
    job.preview.progress = 52;
    job.preview.subtitle = "脚本和字幕结构已经排好，下一步进入配音";
    pushLog(job, "codex: wrote data/jobs/<job_id>/video_plan.json");
    pushLog(job, "codex: generated hook/body/close script blocks");
  } else if (action === "tts") {
    job.stageIndex = Math.max(job.stageIndex, 4);
    job.steps = makeVideoSteps(4);
    job.status = "tts";
    job.preview.progress = 74;
    job.preview.subtitle = "突破后的第一根回踩，才是你要等的信号";
    pushLog(job, "tts: generating voiceover and timestamps");
    pushLog(job, "tts: audio and word timings ready");
  } else if (action === "render") {
    job.stageIndex = 6;
    job.steps = makeVideoSteps(6);
    job.status = "completed";
    job.preview.statusText = "Ready";
    job.preview.progress = 100;
    job.preview.subtitle = "本地渲染完成，可以导出视频或继续微调";
    pushLog(job, "remotion: render queued for selected composition");
    pushLog(job, `render: output written to ${job.outputDir}/output.mp4`);
  }

  job.updatedAt = nowIso();
  broadcastSnapshot(job);
  return job;
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
      localSessionCount: listSessions("workspace").length,
      sessionCatalogLoadedAt: sessionState.loadedAt ? new Date(sessionState.loadedAt).toISOString() : null,
      sessionCatalogScanMs: sessionState.scanMs,
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
    writeJson(res, 200, {items: listSessions(scope)});
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
    writeJson(res, 200, detailFromJob(job));
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
    advanceJob(job, actionMatch[2]);
    writeJson(res, 200, detailFromJob(job));
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
