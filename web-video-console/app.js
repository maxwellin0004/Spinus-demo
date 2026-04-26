const els = {
  workspacePath: document.querySelector("#workspacePath"),
  connectionStatus: document.querySelector("#connectionStatus"),
  topSessionChip: document.querySelector("#topSessionChip"),
  topStatusChip: document.querySelector("#topStatusChip"),
  topOutputChip: document.querySelector("#topOutputChip"),
  refreshButton: document.querySelector("#refreshButton"),

  chatAccountLabel: document.querySelector("#chatAccountLabel"),
  chatTemplateLabel: document.querySelector("#chatTemplateLabel"),
  chatSessionLabel: document.querySelector("#chatSessionLabel"),
  chatOutputLabel: document.querySelector("#chatOutputLabel"),
  activeInstructionStrip: document.querySelector("#activeInstructionStrip"),

  sessionSelect: document.querySelector("#sessionSelect"),
  newThreadButton: document.querySelector("#newThreadButton"),
  toggleSessionDrawerButton: document.querySelector("#toggleSessionDrawerButton"),
  sessionDrawer: document.querySelector("#sessionDrawer"),
  sessionSearchInput: document.querySelector("#sessionSearchInput"),
  sessionRefreshButton: document.querySelector("#sessionRefreshButton"),
  sessionList: document.querySelector("#sessionList"),
  threadList: document.querySelector("#threadList"),
  composerForm: document.querySelector("#composerForm"),
  composerInput: document.querySelector("#composerInput"),
  attachButton: document.querySelector("#attachButton"),

  activeJobTitle: document.querySelector("#activeJobTitle"),
  taskHeaderTitle: document.querySelector("#taskHeaderTitle"),
  taskHeaderSummary: document.querySelector("#taskHeaderSummary"),
  accountSelect: document.querySelector("#accountSelect"),
  openAccountModalButton: document.querySelector("#openAccountModalButton"),
  templateSelect: document.querySelector("#templateSelect"),
  templateLockToggle: document.querySelector("#templateLockToggle"),
  compositionLabel: document.querySelector("#compositionLabel"),
  headerMetaChips: document.querySelector("#headerMetaChips"),

  accountProfileTitle: document.querySelector("#accountProfileTitle"),
  accountPlatformBadge: document.querySelector("#accountPlatformBadge"),
  accountPersonaLabel: document.querySelector("#accountPersonaLabel"),
  accountCtaLabel: document.querySelector("#accountCtaLabel"),
  accountToneTags: document.querySelector("#accountToneTags"),
  accountConstraintsLabel: document.querySelector("#accountConstraintsLabel"),

  presetChipGrid: document.querySelector("#presetChipGrid"),
  instructionScopeBadge: document.querySelector("#instructionScopeBadge"),
  openInstructionInput: document.querySelector("#openInstructionInput"),

  jobStatusLabel: document.querySelector("#jobStatusLabel"),
  jobTemplateLabel: document.querySelector("#jobTemplateLabel"),
  jobAspectLabel: document.querySelector("#jobAspectLabel"),
  jobOutputLabel: document.querySelector("#jobOutputLabel"),
  stepList: document.querySelector("#stepList"),
  scriptStructure: document.querySelector("#scriptStructure"),
  subtitleReviewText: document.querySelector("#subtitleReviewText"),
  subtitleRuleText: document.querySelector("#subtitleRuleText"),
  templateGallery: document.querySelector("#templateGallery"),
  resourceGrid: document.querySelector("#resourceGrid"),
  jobHistoryList: document.querySelector("#jobHistoryList"),
  logStream: document.querySelector("#logStream"),
  actionHints: document.querySelector("#actionHints"),
  generatePlanButton: document.querySelector("#generatePlanButton"),
  ttsButton: document.querySelector("#ttsButton"),
  renderButton: document.querySelector("#renderButton"),

  previewStatus: document.querySelector("#previewStatus"),
  previewImage: document.querySelector("#previewImage"),
  episodeLabel: document.querySelector("#episodeLabel"),
  previewHeadline: document.querySelector("#previewHeadline"),
  previewSummary: document.querySelector("#previewSummary"),
  subtitleBand: document.querySelector("#subtitleBand"),
  previewProgress: document.querySelector("#previewProgress"),
  playPreviewButton: document.querySelector("#playPreviewButton"),
  reviewSubtitleText: document.querySelector("#reviewSubtitleText"),
  reviewShotText: document.querySelector("#reviewShotText"),
  reviewSummaryText: document.querySelector("#reviewSummaryText"),
  reviewOutputText: document.querySelector("#reviewOutputText"),

  accountModal: document.querySelector("#accountModal"),
  closeAccountModalButton: document.querySelector("#closeAccountModalButton"),
  cancelAccountButton: document.querySelector("#cancelAccountButton"),
  accountForm: document.querySelector("#accountForm"),
  accountNameInput: document.querySelector("#accountNameInput"),
  accountPlatformInput: document.querySelector("#accountPlatformInput"),
  accountPersonaInput: document.querySelector("#accountPersonaInput"),
  accountToneInput: document.querySelector("#accountToneInput"),
  accountTemplateInput: document.querySelector("#accountTemplateInput"),
  accountDurationInput: document.querySelector("#accountDurationInput"),
  accountCtaInput: document.querySelector("#accountCtaInput"),
  accountSubtitleStyleInput: document.querySelector("#accountSubtitleStyleInput"),
  accountConstraintsInput: document.querySelector("#accountConstraintsInput"),
};

const EMPTY_PREVIEW = {
  statusText: "Idle",
  episodeLabel: "New / Empty Thread",
  headline: "等待开始新的任务",
  summary: "先选择账号、模板和指令，再从左侧发起本轮视频需求。",
  subtitle: "字幕会根据当前账号风格和任务状态更新。",
  progress: 0,
  imageUrl: "/workspace/assets/images/scenario_video_breakdown.jpg",
};

const state = {
  project: null,
  accounts: [],
  presets: [],
  templates: [],
  assets: [],
  jobs: [],
  sessions: [],
  sessionScope: "workspace",
  sessionQuery: "",
  sessionDrawerOpen: false,
  activeJob: null,
  eventSource: null,
  draftConfig: null,
  activeView: "workflow",
  instructionTimer: null,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload;
}

function formatTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function localizeJobStatus(status) {
  const map = {
    planning: "规划中",
    tts: "配音中",
    completed: "已完成",
    awaiting_review: "待审阅",
    session: "已绑定 Session",
    idle: "未开始",
    unknown: "未知",
  };
  return map[status] || status;
}

function localizeStepStatus(status) {
  const map = {
    done: "完成",
    running: "执行中",
    waiting: "等待",
    failed: "失败",
  };
  return map[status] || status;
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

function iconCheck() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6"></path>
    </svg>
  `;
}

function getAccountById(accountId) {
  return state.accounts.find((account) => account.id === accountId) || null;
}

function getTemplateById(templateId) {
  return state.templates.find((template) => template.id === templateId) || null;
}

function getPresetById(presetId) {
  return state.presets.find((preset) => preset.id === presetId) || null;
}

function normalizeConfig(config = {}) {
  const fallbackAccount = state.accounts[0] || null;
  const account = getAccountById(config.accountId) || fallbackAccount;
  const fallbackTemplateId = config.templateId || account?.defaultTemplateId || state.templates[0]?.id || "";
  const template = getTemplateById(fallbackTemplateId) || state.templates[0] || null;
  const validPresetIds = new Set(state.presets.map((preset) => preset.id));

  return {
    accountId: account?.id || "",
    templateId: template?.id || "",
    compositionId: config.compositionId || template?.compositionId || account?.defaultCompositionId || "",
    templateLocked: Boolean(config.templateLocked),
    activePresetIds: Array.isArray(config.activePresetIds)
      ? config.activePresetIds.filter((presetId) => validPresetIds.has(presetId))
      : [],
    openInstruction: String(config.openInstruction || ""),
    instructionScope: config.instructionScope === "session" ? "session" : "run",
    durationSec: Number(config.durationSec || account?.defaultDurationSec || template?.defaultDurationSec || 60),
    aspectRatio: config.aspectRatio || account?.aspectRatio || template?.aspectRatio || "9:16",
  };
}

function buildDefaultDraftConfig() {
  const firstAccount = state.accounts[0] || null;
  return normalizeConfig({
    accountId: firstAccount?.id || "",
    templateId: firstAccount?.defaultTemplateId || state.templates[0]?.id || "",
    compositionId: firstAccount?.defaultCompositionId || state.templates[0]?.compositionId || "",
    durationSec: firstAccount?.defaultDurationSec || 60,
    aspectRatio: firstAccount?.aspectRatio || "9:16",
    templateLocked: true,
    activePresetIds: [],
    instructionScope: "run",
    openInstruction: "",
  });
}

function ensureDraftConfig() {
  if (!state.draftConfig) {
    state.draftConfig = buildDefaultDraftConfig();
    return;
  }
  state.draftConfig = normalizeConfig(state.draftConfig);
}

function getCurrentConfig() {
  if (state.activeJob) {
    return normalizeConfig({
      accountId: state.activeJob.accountId,
      templateId: state.activeJob.templateId,
      compositionId: state.activeJob.compositionId,
      templateLocked: state.activeJob.templateLocked,
      activePresetIds: state.activeJob.activePresetIds,
      openInstruction: state.activeJob.openInstruction,
      instructionScope: state.activeJob.instructionScope,
      durationSec: state.activeJob.durationSec,
      aspectRatio: state.activeJob.aspectRatio,
    });
  }
  ensureDraftConfig();
  return normalizeConfig(state.draftConfig);
}

function setDraftConfig(config) {
  state.draftConfig = normalizeConfig(config);
}

function canChat(job) {
  return Boolean(job && (job.source === "runtime" || job.source === "session"));
}

function canRunPipeline(job) {
  return Boolean(job && job.source === "runtime");
}

function canConfigureJob(job) {
  return Boolean(job && (job.source === "runtime" || job.source === "session"));
}

function closeEventSource() {
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }
}

function mergeJob(job) {
  const existingIndex = state.jobs.findIndex((item) => item.id === job.id);
  if (existingIndex === -1) {
    state.jobs.unshift(job);
  } else {
    state.jobs.splice(existingIndex, 1, job);
  }
}

function buildActiveInstructionTags(config) {
  const account = getAccountById(config.accountId);
  const template = getTemplateById(config.templateId);
  const presetLabels = config.activePresetIds.map((presetId) => getPresetById(presetId)?.label).filter(Boolean);
  const chips = [];
  if (account) chips.push(`账号：${account.name}`);
  if (template) chips.push(`模板：${template.title}`);
  presetLabels.forEach((label) => chips.push(label));
  if (config.openInstruction.trim()) chips.push("开放指令已启用");
  return chips;
}

function renderTopContext(config, job) {
  const sessionLabel = job?.codexSessionId ? `${job.codexSessionId.slice(0, 8)}…` : "未绑定";
  els.topSessionChip.textContent = sessionLabel;
  els.topStatusChip.textContent = localizeJobStatus(job?.status || "idle");
  els.topOutputChip.textContent = job?.outputDir || "data/jobs";
}

function renderProject() {
  if (!state.project) return;
  els.workspacePath.textContent = state.project.workspacePath || "";

  const suffix = Number(state.project.localSessionCount || 0) > 0 ? ` | ${state.project.localSessionCount} sessions` : "";
  els.connectionStatus.innerHTML = `<span></span>${escapeHtml((state.project.codexBridge || "Codex CLI") + suffix)}`;

  document.querySelectorAll("[data-session-scope]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sessionScope === state.sessionScope);
  });
}

function renderMessages(messages = [], pendingAssistantText = "") {
  const items = [...messages];
  if (pendingAssistantText) {
    items.push({
      role: "assistant",
      meta: "Codex",
      text: pendingAssistantText,
      pending: true,
    });
  }

  if (!items.length) {
    els.threadList.innerHTML = `
      <div class="thread-empty">
        <strong>还没有对话</strong>
        <p>可以先绑定一个本地 session，或者直接发送第一条消息创建新任务。</p>
      </div>
    `;
    return;
  }

  els.threadList.innerHTML = items
    .map(
      (message) => `
        <article class="message ${message.role === "user" ? "user" : "assistant"} ${message.pending ? "is-pending" : ""}">
          <div class="meta">${escapeHtml(message.meta || (message.role === "user" ? "You" : "Codex"))}</div>
          <div class="bubble">${escapeHtml(message.text || "")}</div>
        </article>
      `,
    )
    .join("");

  els.threadList.scrollTop = els.threadList.scrollHeight;
}

function renderSteps(steps = []) {
  if (!steps.length) {
    els.stepList.innerHTML = `
      <li class="panel-empty">
        <strong>还没有流程步骤</strong>
        <p>从左侧发起任务后，流程、脚本、配音和渲染步骤会在这里推进。</p>
      </li>
    `;
    return;
  }

  els.stepList.innerHTML = steps
    .map(
      (step, index) => `
        <li class="step-card is-${escapeHtml(step.status || "waiting")}">
          <div class="step-index">${step.status === "done" ? iconCheck() : String(index + 1).padStart(2, "0")}</div>
          <div class="step-copy">
            <strong>${escapeHtml(step.title || "Untitled")}</strong>
            <p>${escapeHtml(step.detail || "")}</p>
          </div>
          <span class="step-state">${escapeHtml(localizeStepStatus(step.status || "waiting"))}</span>
        </li>
      `,
    )
    .join("");
}

function renderScriptStructure(sections = []) {
  if (!sections.length) {
    els.scriptStructure.innerHTML = `
      <div class="panel-empty">
        <strong>还没有脚本结构</strong>
        <p>账号、模板和第一轮 Codex 回复确定后，这里会显示 Hook、Body、Close 和配置摘要。</p>
      </div>
    `;
    return;
  }

  els.scriptStructure.innerHTML = sections
    .map(
      (section) => `
        <article class="structure-card">
          <span>${escapeHtml(section.label || "Section")}</span>
          <p>${escapeHtml(section.text || "")}</p>
        </article>
      `,
    )
    .join("");
}

function renderLogs(logs = []) {
  els.logStream.textContent = logs.length ? logs.join("\n") : "No logs yet.";
  els.logStream.scrollTop = els.logStream.scrollHeight;
}

function setPreviewStatus(status, preview = EMPTY_PREVIEW) {
  const label = preview.statusText || localizeJobStatus(status);
  els.previewStatus.innerHTML = `<span></span>${escapeHtml(label)}`;
  els.previewStatus.classList.toggle("is-ready", status === "completed");
}

function renderPreview(preview = EMPTY_PREVIEW, status = "idle") {
  els.previewImage.src = preview.imageUrl || EMPTY_PREVIEW.imageUrl;
  els.episodeLabel.textContent = preview.episodeLabel || EMPTY_PREVIEW.episodeLabel;
  els.previewHeadline.textContent = preview.headline || EMPTY_PREVIEW.headline;
  els.previewSummary.textContent = preview.summary || EMPTY_PREVIEW.summary;
  els.subtitleBand.textContent = preview.subtitle || EMPTY_PREVIEW.subtitle;
  els.previewProgress.style.width = `${Number(preview.progress || 0)}%`;
  setPreviewStatus(status, preview);
}

function renderTemplateSelect(config) {
  const options = state.templates
    .map(
      (template) =>
        `<option value="${escapeHtml(template.id)}">${escapeHtml(template.title)} · ${escapeHtml(template.compositionId || "-")}</option>`,
    )
    .join("");
  els.templateSelect.innerHTML = options;
  els.accountTemplateInput.innerHTML = options;
  els.templateSelect.value = config.templateId || state.templates[0]?.id || "";
  els.accountTemplateInput.value = state.templates[0]?.id || "";
}

function renderAccountSelect(config) {
  const options = state.accounts
    .map((account) => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)}</option>`)
    .join("");
  els.accountSelect.innerHTML = options;
  els.accountSelect.value = config.accountId || state.accounts[0]?.id || "";
}

function renderSessionSelect() {
  const items = [...state.sessions];
  const activeSessionId = state.activeJob?.codexSessionId;
  if (activeSessionId && !items.some((session) => session.id === activeSessionId)) {
    items.unshift({
      id: activeSessionId,
      threadName: state.activeJob?.title || `Session ${activeSessionId.slice(0, 8)}`,
      updatedAt: state.activeJob?.updatedAt || "",
    });
  }
  const options = [
    `<option value="">未绑定本地 session</option>`,
    ...items.map((session) => {
      const timeLabel = formatTimestamp(session.updatedAt);
      const name = session.threadName || `Session ${session.id.slice(0, 8)}`;
      return `<option value="${escapeHtml(session.id)}">${escapeHtml(name)}${timeLabel ? ` | ${timeLabel}` : ""}</option>`;
    }),
  ];
  els.sessionSelect.innerHTML = options.join("");
  els.sessionSelect.value = state.activeJob?.codexSessionId || "";
}

function getFilteredSessions() {
  const query = state.sessionQuery.trim().toLowerCase();
  return state.sessions.filter((session) => {
    if (!query) return true;
    const haystack = [session.threadName, session.id, session.previewText, session.cwd].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function renderSessionList() {
  const sessions = getFilteredSessions();
  if (!sessions.length) {
    els.sessionList.innerHTML = `
      <div class="thread-empty">
        <strong>没有匹配的 session</strong>
        <p>可以切换到“全部”范围，或者修改筛选条件。</p>
      </div>
    `;
    return;
  }

  els.sessionList.innerHTML = sessions
    .map(
      (session) => `
        <button
          type="button"
          class="session-item ${state.activeJob?.codexSessionId === session.id ? "is-selected" : ""}"
          data-session-id="${escapeHtml(session.id)}"
        >
          <span class="session-badge">${session.archived ? "Archived" : "Local Session"}</span>
          <strong>${escapeHtml(session.threadName || session.id)}</strong>
          <p>${escapeHtml(session.previewText || session.cwd || session.id)}</p>
          <small>${escapeHtml(formatTimestamp(session.updatedAt))} | ${escapeHtml(session.id.slice(0, 8))}</small>
        </button>
      `,
    )
    .join("");
}

function renderAccountProfile(config) {
  const account = getAccountById(config.accountId);
  els.accountProfileTitle.textContent = account?.name || "请选择账号画像";
  els.accountPlatformBadge.textContent = platformLabel(account?.platform);
  els.accountPersonaLabel.textContent = account?.persona || "-";
  els.accountCtaLabel.textContent = account?.ctaStyle || "-";
  els.accountConstraintsLabel.textContent = Array.isArray(account?.constraints)
    ? account.constraints.join("，")
    : account?.constraints || "-";

  const toneTags = Array.isArray(account?.toneTags) ? account.toneTags : [];
  els.accountToneTags.innerHTML = toneTags.length
    ? toneTags.map((tag) => `<span class="tiny-chip">${escapeHtml(tag)}</span>`).join("")
    : `<span class="tiny-chip is-muted">暂无</span>`;

  els.subtitleRuleText.textContent = account?.subtitleStyle
    ? `字幕风格：${account.subtitleStyle}；配音：${account.voiceProfile || "默认"}。`
    : "选择账号后，这里会显示字幕风格和高亮规则。";
}

function renderInstructionArea(config) {
  els.presetChipGrid.innerHTML = state.presets
    .map((preset) => {
      const selected = config.activePresetIds.includes(preset.id);
      return `
        <button type="button" class="preset-chip ${selected ? "is-selected" : ""}" data-preset-id="${escapeHtml(preset.id)}">
          <strong>${escapeHtml(preset.label)}</strong>
          <span>${escapeHtml(preset.shortDescription || "")}</span>
        </button>
      `;
    })
    .join("");

  els.openInstructionInput.value = config.openInstruction || "";
  els.instructionScopeBadge.textContent = config.instructionScope === "session" ? "持续作用于当前 session" : "仅本轮";

  document.querySelectorAll("[data-instruction-scope]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.instructionScope === config.instructionScope);
  });
}

function renderHeader(config, job) {
  const account = getAccountById(config.accountId);
  const template = getTemplateById(config.templateId);
  const sessionLabel = job?.codexSessionId ? `${job.codexSessionId.slice(0, 8)}…` : "未绑定";

  els.taskHeaderTitle.textContent = job?.title || "配置下一条视频";
  els.taskHeaderSummary.textContent = [
    account ? `账号：${account.name}` : null,
    template ? `模板：${template.title}` : null,
    job?.outputDir ? `输出：${job.outputDir}` : "输出：data/jobs/<job_id>",
  ]
    .filter(Boolean)
    .join(" · ");

  els.activeJobTitle.textContent = job?.title || "未开始视频任务";
  els.compositionLabel.textContent = config.compositionId || "-";
  els.templateLockToggle.checked = Boolean(config.templateLocked);

  els.headerMetaChips.innerHTML = [
    account ? platformLabel(account.platform) : "未选平台",
    `${config.durationSec || 60}s`,
    config.aspectRatio || "9:16",
    `Session ${sessionLabel}`,
  ]
    .map((item) => `<span class="tiny-chip">${escapeHtml(item)}</span>`)
    .join("");

  els.jobStatusLabel.textContent = localizeJobStatus(job?.status || "idle");
  els.jobTemplateLabel.textContent = template?.title || config.templateId || "-";
  els.jobAspectLabel.textContent = config.aspectRatio || "9:16";
  els.jobOutputLabel.textContent = job?.outputDir || "data/jobs";

  els.chatAccountLabel.textContent = account?.name || "未选择";
  els.chatTemplateLabel.textContent = template?.title || "未选择";
  els.chatSessionLabel.textContent = sessionLabel;
  els.chatOutputLabel.textContent = job?.outputDir || "data/jobs";

  const tags = buildActiveInstructionTags(config);
  els.activeInstructionStrip.innerHTML = tags.length
    ? tags.map((tag) => `<span class="inline-tag">${escapeHtml(tag)}</span>`).join("")
    : `<span class="inline-tag is-muted">当前没有附加指令</span>`;

  renderTopContext(config, job || null);
}

function renderTemplateGallery(config) {
  els.templateGallery.innerHTML = state.templates
    .map((template) => {
      const selected = template.id === config.templateId;
      return `
        <button
          type="button"
          class="template-card ${selected ? "is-selected" : ""}"
          data-template-id="${escapeHtml(template.id)}"
        >
          <div class="template-card-top">
            <strong>${escapeHtml(template.title)}</strong>
            <span>${escapeHtml(template.compositionId || "-")}</span>
          </div>
          <p>${escapeHtml(template.summary || "暂无摘要")}</p>
          <div class="chip-row">
            ${(template.tags || []).map((tag) => `<span class="tiny-chip">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </button>
      `;
    })
    .join("");
}

function renderResources() {
  els.resourceGrid.innerHTML = state.assets
    .map(
      (asset) => `
        <article class="resource-card">
          <img src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.name)}" />
          <div>
            <strong>${escapeHtml(asset.name)}</strong>
            <span>${escapeHtml(asset.kind)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderJobHistory() {
  els.jobHistoryList.innerHTML = state.jobs
    .map(
      (job) => `
        <button type="button" class="history-item ${job.id === state.activeJob?.id ? "is-selected" : ""}" data-job-id="${escapeHtml(job.id)}">
          <span>${escapeHtml(localizeJobStatus(job.status || "unknown"))}</span>
          <strong>${escapeHtml(job.title || job.id)}</strong>
          <small>${escapeHtml(job.outputDir || "data/jobs")}</small>
        </button>
      `,
    )
    .join("");
}

function renderReviewCards(job, config) {
  const sections = Array.isArray(job?.scriptSections) ? job.scriptSections : [];
  const hook = sections.find((section) => String(section.label).toLowerCase() === "hook");
  const body = sections.find((section) => String(section.label).toLowerCase() === "body");
  const close = sections.find((section) => String(section.label).toLowerCase() === "close");
  const account = getAccountById(config.accountId);
  const template = getTemplateById(config.templateId);

  els.subtitleReviewText.textContent = job?.preview?.subtitle || EMPTY_PREVIEW.subtitle;
  els.reviewSubtitleText.textContent = job?.preview?.subtitle || "暂无字幕。";
  els.reviewShotText.textContent = template
    ? `${template.title} / ${template.compositionId || "-"} / ${config.aspectRatio || "9:16"}`
    : "等待生成脚本或选择模板。";
  els.reviewSummaryText.textContent = [hook?.text, body?.text, close?.text].filter(Boolean).join(" / ") || "Hook / Body / Close 会在这里汇总。";
  els.reviewOutputText.textContent = job
    ? `${localizeJobStatus(job.status)} · ${job.outputDir || "data/jobs"}`
    : `${account?.name || "未选账号"} · ${template?.title || "未选模板"} · 等待执行`;
}

function renderActionHints(job) {
  const hints = [];
  if (!job) {
    hints.push("先从左侧发送第一条任务消息");
  } else if (job.source === "session") {
    hints.push("当前是历史 session；左侧继续对话会同步到本地 Codex");
  } else if (job.source === "runtime") {
    hints.push(job.codexSessionId ? "已绑定真实本地 session" : "首轮回复后会绑定本地 session");
    hints.push(job.status === "completed" ? "可以继续微调脚本或重新渲染" : "可继续推进计划、配音和渲染");
  } else {
    hints.push("历史任务只读，不会重新执行");
  }

  els.actionHints.innerHTML = hints.map((hint) => `<span class="tiny-chip">${escapeHtml(hint)}</span>`).join("");
}

function setActionState() {
  const pipelineEnabled = canRunPipeline(state.activeJob);
  els.generatePlanButton.disabled = !pipelineEnabled;
  els.ttsButton.disabled = !pipelineEnabled;
  els.renderButton.disabled = !pipelineEnabled;
}

function renderEmptyJob() {
  state.activeJob = null;
  const config = getCurrentConfig();
  renderProject();
  renderAccountSelect(config);
  renderTemplateSelect(config);
  renderHeader(config, null);
  renderAccountProfile(config);
  renderInstructionArea(config);
  renderMessages([]);
  renderSteps([]);
  renderScriptStructure([]);
  renderLogs([]);
  renderPreview(EMPTY_PREVIEW, "idle");
  renderReviewCards(null, config);
  renderTemplateGallery(config);
  renderJobHistory();
  renderSessionSelect();
  renderSessionList();
  renderResources();
  renderActionHints(null);
  setActionState();
}

function renderJob(job) {
  state.activeJob = job;
  if (job.id !== "__pending_job__") {
    mergeJob(job);
  }
  const config = getCurrentConfig();

  renderProject();
  renderAccountSelect(config);
  renderTemplateSelect(config);
  renderHeader(config, job);
  renderAccountProfile(config);
  renderInstructionArea(config);
  renderMessages(job.messages || [], job.pendingAssistantText || "");
  renderSteps(job.steps || []);
  renderScriptStructure(job.scriptSections || []);
  renderLogs(job.logs || []);
  renderPreview(job.preview || EMPTY_PREVIEW, job.status || "idle");
  renderReviewCards(job, config);
  renderTemplateGallery(config);
  renderJobHistory();
  renderSessionSelect();
  renderSessionList();
  renderResources();
  renderActionHints(job);
  setActionState();
}

function bindDynamicLists() {
  els.sessionList.querySelectorAll("[data-session-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const sessionId = button.dataset.sessionId;
      if (sessionId) attachSession(sessionId).catch(console.error);
    });
  });

  els.jobHistoryList.querySelectorAll("[data-job-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = button.dataset.jobId;
      if (jobId) selectJob(jobId).catch(console.error);
    });
  });

  els.templateGallery.querySelectorAll("[data-template-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const templateId = button.dataset.templateId;
      if (templateId) applyConfigPatch({templateId, templateLocked: true}).catch(console.error);
    });
  });

  els.presetChipGrid.querySelectorAll("[data-preset-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const presetId = button.dataset.presetId;
      if (!presetId) return;
      const config = getCurrentConfig();
      const nextIds = new Set(config.activePresetIds);
      if (nextIds.has(presetId)) nextIds.delete(presetId);
      else nextIds.add(presetId);
      applyConfigPatch({activePresetIds: [...nextIds]}).catch(console.error);
    });
  });
}

function connectToEvents(jobId) {
  closeEventSource();
  const eventSource = new EventSource(`/api/jobs/${encodeURIComponent(jobId)}/events`);

  eventSource.addEventListener("snapshot", (event) => {
    const job = JSON.parse(event.data);
    renderJob(job);
    bindDynamicLists();
  });

  eventSource.addEventListener("log", (event) => {
    const payload = JSON.parse(event.data);
    if (!state.activeJob) return;
    state.activeJob.logs = [...(state.activeJob.logs || []), payload.line];
    renderLogs(state.activeJob.logs);
  });

  eventSource.onerror = () => {
    eventSource.close();
  };

  state.eventSource = eventSource;
}

async function loadBootstrap(options = {}) {
  const preserveSelection = Boolean(options.preserveSelection);
  const forceRefresh = Boolean(options.forceRefresh);
  const selectedJobId = preserveSelection ? state.activeJob?.id : null;
  const refreshFlag = forceRefresh ? "?refresh=1" : "";
  const sessionRefreshFlag = forceRefresh ? "&refresh=1" : "";

  const [projectPayload, templatePayload, assetPayload, jobsPayload, sessionPayload, accountPayload, presetPayload] =
    await Promise.all([
      requestJson(`/api/projects${refreshFlag}`),
      requestJson("/api/templates"),
      requestJson("/api/assets"),
      requestJson("/api/jobs"),
      requestJson(`/api/sessions?scope=${encodeURIComponent(state.sessionScope)}${sessionRefreshFlag}`),
      requestJson("/api/accounts"),
      requestJson("/api/instruction-presets"),
    ]);

  state.project = projectPayload;
  state.templates = templatePayload.items || [];
  state.assets = assetPayload.items || [];
  state.jobs = jobsPayload.items || [];
  state.sessions = sessionPayload.items || [];
  state.accounts = accountPayload.items || [];
  state.presets = presetPayload.items || [];

  ensureDraftConfig();

  if (selectedJobId && state.activeJob && state.activeJob.id === selectedJobId) {
    renderJob(state.activeJob);
    bindDynamicLists();
    return;
  }

  closeEventSource();
  renderEmptyJob();
  bindDynamicLists();
}

async function selectJob(jobId) {
  const job = await requestJson(`/api/jobs/${encodeURIComponent(jobId)}`);
  renderJob(job);
  bindDynamicLists();
  connectToEvents(jobId);
}

async function syncCollections(options = {}) {
  const tasks = [
    loadProject({forceRefresh: Boolean(options.forceRefresh)}),
    loadJobs(),
    loadSessions({forceRefresh: Boolean(options.forceRefresh)}),
  ];
  await Promise.allSettled(tasks);
}

async function loadSessions(options = {}) {
  const refreshParam = options.forceRefresh ? "&refresh=1" : "";
  const sessionPayload = await requestJson(`/api/sessions?scope=${encodeURIComponent(state.sessionScope)}${refreshParam}`);
  state.sessions = sessionPayload.items || [];
  renderSessionSelect();
  renderSessionList();
  bindDynamicLists();
}

async function applyConfigPatch(patch) {
  const nextConfig = normalizeConfig({...getCurrentConfig(), ...patch});
  const template = getTemplateById(nextConfig.templateId);
  if (!nextConfig.compositionId && template?.compositionId) {
    nextConfig.compositionId = template.compositionId;
  }

  if (canConfigureJob(state.activeJob)) {
    const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/config`, {
      method: "PATCH",
      body: JSON.stringify(nextConfig),
    });
    renderJob(job);
    bindDynamicLists();
    return;
  }

  setDraftConfig(nextConfig);
  renderEmptyJob();
  bindDynamicLists();
}

async function createSession() {
  const job = await requestJson("/api/sessions", {
    method: "POST",
    body: JSON.stringify({config: getCurrentConfig()}),
  });
  renderJob(job);
  bindDynamicLists();
  connectToEvents(job.id);
  await syncCollections({forceRefresh: true});
}

async function createJob(prompt) {
  const pendingConfig = getCurrentConfig();
  renderJob({
    id: "__pending_job__",
    source: "runtime",
    title: prompt.slice(0, 22) || "新建视频任务",
    status: "planning",
    updatedAt: new Date().toISOString(),
    accountId: pendingConfig.accountId,
    templateId: pendingConfig.templateId,
    compositionId: pendingConfig.compositionId,
    durationSec: pendingConfig.durationSec,
    templateLocked: pendingConfig.templateLocked,
    activePresetIds: pendingConfig.activePresetIds,
    openInstruction: pendingConfig.openInstruction,
    instructionScope: pendingConfig.instructionScope,
    aspectRatio: pendingConfig.aspectRatio,
    outputDir: "data/jobs/<pending>",
    codexSessionId: null,
    messages: [{role: "user", meta: "You", text: prompt}],
    pendingAssistantText: "Codex 正在创建任务并连接本地 session...",
    codexRunning: true,
    steps: [],
    logs: [],
    preview: {
      ...EMPTY_PREVIEW,
      statusText: "Planning",
      headline: prompt.slice(0, 22) || "新建视频任务",
      summary: "正在等待 Codex 返回第一轮回复。",
      subtitle: "任务已发出，正在连接本地 session。",
      progress: 8,
    },
    scriptSections: [],
  });
  bindDynamicLists();

  const job = await requestJson("/api/jobs", {
    method: "POST",
    body: JSON.stringify({prompt, config: getCurrentConfig()}),
  });
  renderJob(job);
  bindDynamicLists();
  connectToEvents(job.id);
  await syncCollections({forceRefresh: true});
}

async function attachSession(sessionId) {
  const job = await requestJson("/api/jobs", {
    method: "POST",
    body: JSON.stringify({sessionId, config: getCurrentConfig()}),
  });
  renderJob(job);
  bindDynamicLists();
  connectToEvents(job.id);
  await syncCollections({forceRefresh: false});
}

async function sendMessage(message) {
  if (!canChat(state.activeJob)) {
    await createJob(message);
    return;
  }

  const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/codex/message`, {
    method: "POST",
    body: JSON.stringify({message}),
  });
  renderJob(job);
  bindDynamicLists();
  connectToEvents(job.id);
}

async function runAction(action) {
  if (!canRunPipeline(state.activeJob)) return;
  const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/actions/${action}`, {
    method: "POST",
  });
  renderJob(job);
  bindDynamicLists();
}

function openAccountModal() {
  els.accountModal.hidden = false;
  els.accountNameInput.focus();
}

function closeAccountModal() {
  els.accountModal.hidden = true;
  els.accountForm.reset();
  if (state.templates[0]) {
    els.accountTemplateInput.value = state.templates[0].id;
  }
  els.accountDurationInput.value = 60;
}

async function createAccount(formData) {
  const payload = {
    name: formData.get("name"),
    platform: formData.get("platform"),
    persona: formData.get("persona"),
    toneTags: formData.get("toneTags"),
    defaultTemplateId: formData.get("defaultTemplateId"),
    defaultDurationSec: Number(formData.get("defaultDurationSec") || 60),
    ctaStyle: formData.get("ctaStyle"),
    subtitleStyle: formData.get("subtitleStyle"),
    constraints: formData.get("constraints"),
  };

  const account = await requestJson("/api/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  state.accounts = [...state.accounts, account];
  const nextConfig = normalizeConfig({
    ...getCurrentConfig(),
    accountId: account.id,
    templateId: account.defaultTemplateId,
    compositionId: account.defaultCompositionId,
    durationSec: account.defaultDurationSec,
    aspectRatio: account.aspectRatio,
  });

  if (canConfigureJob(state.activeJob)) {
    const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/config`, {
      method: "PATCH",
      body: JSON.stringify(nextConfig),
    });
    renderJob(job);
  } else {
    setDraftConfig(nextConfig);
    renderEmptyJob();
  }

  bindDynamicLists();
  closeAccountModal();
}

function scheduleInstructionUpdate() {
  if (state.instructionTimer) window.clearTimeout(state.instructionTimer);
  state.instructionTimer = window.setTimeout(() => {
    applyConfigPatch({openInstruction: els.openInstructionInput.value}).catch(console.error);
  }, 260);
}

document.querySelectorAll(".segmented-control button").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeView = button.dataset.view || "workflow";
    document.querySelectorAll(".segmented-control button").forEach((item) => item.classList.remove("is-active"));
    document.querySelectorAll(".view-page").forEach((page) => page.classList.remove("is-active"));
    button.classList.add("is-active");
    document.querySelector(`#${state.activeView}View`).classList.add("is-active");
  });
});

document.querySelectorAll("[data-session-scope]").forEach((button) => {
  button.addEventListener("click", async () => {
    state.sessionScope = button.dataset.sessionScope || "workspace";
    await loadSessions();
    renderProject();
  });
});

document.querySelectorAll("[data-instruction-scope]").forEach((button) => {
  button.addEventListener("click", async () => {
    await applyConfigPatch({instructionScope: button.dataset.instructionScope || "run"});
  });
});

els.sessionSearchInput.addEventListener("input", () => {
  state.sessionQuery = els.sessionSearchInput.value || "";
  renderSessionList();
  bindDynamicLists();
});

els.sessionSelect.addEventListener("change", async () => {
  const sessionId = els.sessionSelect.value;
  if (!sessionId) {
    closeEventSource();
    renderEmptyJob();
    els.composerInput.focus();
    return;
  }

  try {
    await attachSession(sessionId);
  } catch (error) {
    console.error(error);
  }
});

els.newThreadButton.addEventListener("click", async () => {
  els.newThreadButton.disabled = true;
  try {
    await createSession();
    els.composerInput.focus();
  } catch (error) {
    console.error(error);
  } finally {
    els.newThreadButton.disabled = false;
  }
});

els.toggleSessionDrawerButton.addEventListener("click", () => {
  state.sessionDrawerOpen = !state.sessionDrawerOpen;
  els.sessionDrawer.hidden = !state.sessionDrawerOpen;
  els.toggleSessionDrawerButton.classList.toggle("is-open", state.sessionDrawerOpen);
});

els.sessionRefreshButton.addEventListener("click", async () => {
  try {
    await loadBootstrap({preserveSelection: true, forceRefresh: true});
  } catch (error) {
    console.error(error);
  }
});

els.accountSelect.addEventListener("change", async () => {
  const account = getAccountById(els.accountSelect.value);
  const currentConfig = getCurrentConfig();
  const patch = {
    accountId: account?.id || "",
    durationSec: account?.defaultDurationSec || currentConfig.durationSec,
    aspectRatio: account?.aspectRatio || currentConfig.aspectRatio,
  };

  if (!currentConfig.templateLocked && account?.defaultTemplateId) {
    const defaultTemplate = getTemplateById(account.defaultTemplateId);
    patch.templateId = account.defaultTemplateId;
    patch.compositionId = defaultTemplate?.compositionId || account.defaultCompositionId || "";
  }

  await applyConfigPatch(patch);
});

els.templateSelect.addEventListener("change", async () => {
  const template = getTemplateById(els.templateSelect.value);
  await applyConfigPatch({
    templateId: template?.id || "",
    compositionId: template?.compositionId || "",
    durationSec: template?.defaultDurationSec || getCurrentConfig().durationSec,
    aspectRatio: template?.aspectRatio || getCurrentConfig().aspectRatio,
  });
});

els.templateLockToggle.addEventListener("change", async () => {
  await applyConfigPatch({templateLocked: els.templateLockToggle.checked});
});

els.openInstructionInput.addEventListener("input", scheduleInstructionUpdate);

els.composerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = els.composerInput.value.trim();
  if (!text) return;

  try {
    await sendMessage(text);
    els.composerInput.value = "";
  } catch (error) {
    console.error(error);
  }
});

els.generatePlanButton.addEventListener("click", async () => {
  try {
    await runAction("generate-plan");
  } catch (error) {
    console.error(error);
  }
});

els.ttsButton.addEventListener("click", async () => {
  try {
    await runAction("tts");
  } catch (error) {
    console.error(error);
  }
});

els.renderButton.addEventListener("click", async () => {
  try {
    await runAction("render");
  } catch (error) {
    console.error(error);
  }
});

els.playPreviewButton.addEventListener("click", () => {
  const subtitles = [
    "先等回踩确认，再判断量能是否跟上。",
    "突破不是理由，确认才是执行点。",
    "真正危险的不是亏损，而是连续追错方向。",
  ];
  const next = subtitles[Math.floor(Math.random() * subtitles.length)];
  els.subtitleBand.textContent = next;
  els.reviewSubtitleText.textContent = next;
});

els.refreshButton.addEventListener("click", async () => {
  try {
    await loadBootstrap({preserveSelection: true, forceRefresh: true});
  } catch (error) {
    console.error(error);
  }
});

els.attachButton.addEventListener("click", () => {
  els.composerInput.focus();
  els.composerInput.placeholder = "后续这里会接本地素材选择器，指向 assets 和 data/source_videos。";
});

els.openAccountModalButton.addEventListener("click", openAccountModal);
els.closeAccountModalButton.addEventListener("click", closeAccountModal);
els.cancelAccountButton.addEventListener("click", closeAccountModal);

els.accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createAccount(new FormData(els.accountForm));
  } catch (error) {
    console.error(error);
  }
});

els.accountModal.addEventListener("click", (event) => {
  if (event.target === els.accountModal) {
    closeAccountModal();
  }
});

loadBootstrap().catch((error) => {
  console.error(error);
  els.threadList.innerHTML = `
    <article class="message assistant">
      <div class="meta">System</div>
      <div class="bubble">本地 API 未连接。请先运行 <code>node web-video-console/server.js</code>。</div>
    </article>
  `;
});
