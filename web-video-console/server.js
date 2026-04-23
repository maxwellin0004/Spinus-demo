const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const {URL} = require("node:url");

const PORT = Number(process.env.PORT || 3008);
const HOST = process.env.HOST || "127.0.0.1";
const WEB_ROOT = __dirname;
const WORKSPACE_ROOT = path.resolve(__dirname, "..");
const TEMPLATE_ROOT = path.join(WORKSPACE_ROOT, "data", "templates");
const JOB_ROOT = path.join(WORKSPACE_ROOT, "data", "jobs");
const COMPOSITION_ROOT = path.join(WORKSPACE_ROOT, "video-app", "src", "compositions");
const ASSET_IMAGE_ROOT = path.join(WORKSPACE_ROOT, "assets", "images");

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

const runtimeJobs = new Map();
const persistedJobs = new Map();
const sseClients = new Map();

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

function nowIso() {
  return new Date().toISOString();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
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

function buildScriptSections(prompt) {
  const base = String(prompt || "生成一个竖屏短视频");
  return [
    {
      label: "Hook",
      text: base.includes("假突破")
        ? "很多假突破不是信号失败，而是你进场太早。"
        : "前三秒先给结果，再解释为什么值得继续看。",
    },
    {
      label: "Body",
      text: base.includes("交易")
        ? "先看突破后的回踩，再看成交量是否放大。"
        : "中段用一条核心机制，把用户的注意力留在问题本身。",
    },
    {
      label: "Close",
      text: "结尾保留一个可执行动作，让观众知道下一步该看什么、做什么。",
    },
  ];
}

function buildMessages(prompt, title) {
  return [
    {
      role: "assistant",
      meta: "Codex",
      text: "当前工作区已定位到 D:\\program\\ai_video\\workflow。可以把视频需求发给我，我会先生成任务计划，再进入配音和渲染。",
    },
    {
      role: "user",
      meta: "You",
      text: prompt,
    },
    {
      role: "assistant",
      meta: "Codex",
      text: `已创建任务“${title}”。我会先结合本地模板、素材和 Remotion composition 生成 video_plan.json。`,
    },
  ];
}

function makeVideoSteps(stageIndex = 1) {
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
    if (index < stageIndex) status = "done";
    if (index === stageIndex) status = "running";
    if (stageIndex >= definitions.length) status = "done";
    return {...step, status};
  });
}

function createRuntimeJob(prompt) {
  const templateId = chooseTemplate(prompt);
  const id = `job_ui_${Date.now()}_${slugFromPrompt(prompt)}`;
  const title = prompt.includes("假突破") ? "假突破交易教育短视频" : prompt.slice(0, 22) || "新建视频任务";
  const job = {
    id,
    source: "runtime",
    title,
    prompt,
    templateId,
    aspectRatio: "9:16",
    outputDir: `data/jobs/${id}`,
    status: "planning",
    updatedAt: nowIso(),
    stageIndex: 1,
    messages: buildMessages(prompt, title),
    steps: makeVideoSteps(1),
    logs: [
      `[${nowIso()}] system: workspace ${WORKSPACE_ROOT}`,
      `[${nowIso()}] codex: task created with template=${templateId}`,
      `[${nowIso()}] codex: generating video_plan.json`,
    ],
    preview: {
      statusText: "Draft",
      episodeLabel: "EP. 04 / Trading Signals",
      headline: prompt.includes("假突破") ? "假突破最危险的地方" : "新任务预览已准备",
      summary: prompt.includes("假突破")
        ? "不是亏损，而是它会让你连续追错方向。"
        : "当前先生成任务计划，确认脚本与素材绑定后再进入配音和渲染。",
      subtitle: prompt.includes("假突破")
        ? "先等回踩确认，再判断量能是否跟上"
        : "先确定结构，再进入配音和渲染",
      progress: 34,
      imageUrl: previewImages[Math.floor(Math.random() * previewImages.length)],
    },
    scriptSections: buildScriptSections(prompt),
  };
  runtimeJobs.set(job.id, job);
  return job;
}

function createSeedDemoJob() {
  const seed = {
    id: "job_demo_trading_signal",
    source: "runtime",
    title: "假突破交易教育短视频",
    prompt: "生成一个 60 秒竖屏交易教育视频，主题是假突破，节奏紧凑，适合小红书。",
    templateId: "new_signals",
    aspectRatio: "9:16",
    outputDir: "data/jobs/job_demo_trading_signal",
    status: "planning",
    updatedAt: nowIso(),
    stageIndex: 1,
    messages: buildMessages(
      "生成一个 60 秒竖屏交易教育视频，主题是假突破，节奏紧凑，适合小红书。",
      "假突破交易教育短视频",
    ),
    steps: makeVideoSteps(1),
    logs: [
      `[${nowIso()}] system: workspace ${WORKSPACE_ROOT}`,
      `[${nowIso()}] codex: bridge adapter pending`,
      `[${nowIso()}] remotion: video-app package detected`,
    ],
    preview: {
      statusText: "Draft",
      episodeLabel: "EP. 04 / Trading Signals",
      headline: "假突破最危险的地方",
      summary: "不是亏损，而是它会让你连续追错方向。",
      subtitle: "先等回踩确认，再判断量能是否跟上",
      progress: 36,
      imageUrl: "/workspace/assets/images/macd_ref_chart_2.jpg",
    },
    scriptSections: buildScriptSections("假突破交易教育短视频"),
  };
  runtimeJobs.set(seed.id, seed);
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
  return stageLines.map((line) => {
    const stage = line.split("Stage entered:")[1]?.trim() || "unknown";
    return {
      title: stage,
      detail: "来自历史 runner.log 的阶段记录。",
      status: "done",
    };
  });
}

function loadPersistedJobs() {
  if (!fs.existsSync(JOB_ROOT)) return;
  for (const entry of fs.readdirSync(JOB_ROOT, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const jobDir = path.join(JOB_ROOT, entry.name);
    const jobJson = safeReadJson(path.join(jobDir, "job.json")) || {id: entry.name, status: "unknown"};
    const statusJson = safeReadJson(path.join(jobDir, "status.json")) || {};
    const logText = safeReadText(path.join(jobDir, "runner.log"));
    const prompt = `${jobJson.mode || "历史任务"} / source=${jobJson.source_video_id || "unknown"}`;
    persistedJobs.set(entry.name, {
      id: jobJson.id || entry.name,
      source: "persisted",
      title: `${jobJson.source_video_id || entry.name} 分析任务`,
      prompt,
      templateId: "history",
      aspectRatio: "16:9",
      outputDir: path.relative(WORKSPACE_ROOT, jobDir).replaceAll("\\", "/"),
      status: statusJson.status || jobJson.status || "unknown",
      updatedAt: statusJson.updated_at || jobJson.updated_at || nowIso(),
      stageIndex: 999,
      messages: [
        {
          role: "assistant",
          meta: "System",
          text: "这是从 data/jobs 读取的历史任务快照，日志和状态来自本地文件。",
        },
        {
          role: "assistant",
          meta: "System",
          text: prompt,
        },
      ],
      steps: derivePersistedSteps(logText),
      logs: logText.split(/\r?\n/).filter(Boolean),
      preview: {
        statusText: statusJson.status || jobJson.status || "History",
        episodeLabel: "History / Analysis",
        headline: `${jobJson.source_video_id || entry.name} 分析任务`,
        summary: statusJson.message || "历史任务仅展示状态和日志，不执行新的生成动作。",
        subtitle: "Runner completed successfully",
        progress: Number(statusJson.progress || 100),
        imageUrl: "/workspace/assets/images/scenario_video_breakdown.jpg",
      },
      scriptSections: [
        {label: "Mode", text: jobJson.mode || "unknown"},
        {label: "Status", text: statusJson.status || jobJson.status || "unknown"},
        {label: "Output", text: path.relative(WORKSPACE_ROOT, jobDir).replaceAll("\\", "/")},
      ],
    });
  }
}

function listTemplates() {
  if (!fs.existsSync(TEMPLATE_ROOT)) return [];
  return fs
    .readdirSync(TEMPLATE_ROOT, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      id: entry.name,
      title: templateMeta[entry.name] || entry.name.replaceAll("_", " "),
      path: `data/templates/${entry.name}`,
    }))
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
    templateId: job.templateId,
    outputDir: job.outputDir,
  };
}

function detailFromJob(job) {
  return {
    ...summaryFromJob(job),
    prompt: job.prompt,
    aspectRatio: job.aspectRatio,
    messages: ensureArray(job.messages),
    steps: ensureArray(job.steps),
    logs: ensureArray(job.logs),
    preview: job.preview,
    scriptSections: ensureArray(job.scriptSections),
  };
}

function allJobs() {
  const combined = [...runtimeJobs.values(), ...persistedJobs.values()];
  return combined.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
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
  if (!clients || !clients.size) return;
  const payload = JSON.stringify(detailFromJob(job));
  for (const res of clients) {
    res.write(`event: snapshot\n`);
    res.write(`data: ${payload}\n\n`);
  }
}

function pushLog(job, line) {
  job.logs.push(`[${nowIso()}] ${line}`);
  job.updatedAt = nowIso();
  const clients = sseClients.get(job.id);
  if (clients && clients.size) {
    const payload = JSON.stringify({line: job.logs[job.logs.length - 1]});
    for (const res of clients) {
      res.write(`event: log\n`);
      res.write(`data: ${payload}\n\n`);
    }
  }
  broadcastSnapshot(job);
}

function attachMessage(job, role, meta, text) {
  job.messages.push({role, meta, text});
  job.updatedAt = nowIso();
}

function advanceJob(job, action) {
  if (job.source !== "runtime") return job;

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

function codexReply(job, message) {
  const text = String(message || "");
  if (/hook|前三秒|开场/.test(text)) {
    job.preview.headline = "这不是信号失败，而是你进场太早";
    job.scriptSections[0].text = "前三秒先抛出风险反转，再让观众意识到自己一直踩在同一个坑里。";
    pushLog(job, "codex: tightened opening hook");
    return "我已经把开场改成结论先行，前三秒会先抛出风险反转，再进入解释。";
  }
  if (/小红书|节奏快|节奏紧凑/.test(text)) {
    job.preview.summary = "改成更紧凑的短句节奏，前半段抓注意力，后半段马上给判断方法。";
    pushLog(job, "codex: updated pacing for xiaohongshu format");
    return "已切到更短句、更密集的节奏，整体会更像小红书的前 10 秒结构。";
  }
  if (/字幕/.test(text)) {
    job.preview.subtitle = "突破不是入场理由，确认才是";
    pushLog(job, "codex: adjusted subtitle emphasis");
    return "字幕高亮逻辑已经调整，会优先突出判断动作和风险提示。";
  }
  pushLog(job, "codex: updated current draft from follow-up instruction");
  return "收到。我会保留现有模板和本地资源绑定，只调整当前任务的脚本和展示重点。";
}

function startEventStream(req, res, job) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write(`event: snapshot\n`);
  res.write(`data: ${JSON.stringify(detailFromJob(job))}\n\n`);

  const set = sseClients.get(job.id) || new Set();
  set.add(res);
  sseClients.set(job.id, set);

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\n`);
    res.write(`data: {"ok":true}\n\n`);
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
  if (req.method === "GET" && url.pathname === "/api/projects") {
    writeJson(res, 200, {
      workspacePath: WORKSPACE_ROOT,
      outputRoot: "data/jobs",
      templateCount: listTemplates().length,
      assetCount: listAssets().length,
      compositions: listCompositions(),
    });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/templates") {
    writeJson(res, 200, {items: listTemplates()});
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/assets") {
    writeJson(res, 200, {items: listAssets()});
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/jobs") {
    writeJson(res, 200, {items: allJobs().map(summaryFromJob)});
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/jobs") {
    parseBody(req)
      .then((body) => {
        const prompt = String(body.prompt || "").trim();
        if (!prompt) {
          writeJson(res, 400, {error: "prompt is required"});
          return;
        }
        const job = createRuntimeJob(prompt);
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
      .then((body) => {
        const message = String(body.message || "").trim();
        if (!message) {
          writeJson(res, 400, {error: "message is required"});
          return;
        }
        attachMessage(job, "user", "You", message);
        const reply = codexReply(job, message);
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
    const action = actionMatch[2];
    advanceJob(job, action);
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
  createSeedDemoJob();
  const server = http.createServer(handleRequest);
  server.listen(PORT, HOST, () => {
    console.log(`Codex Video Console listening on http://${HOST}:${PORT}`);
  });
}

boot();
