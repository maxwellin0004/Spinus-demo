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
  sessionListMeta: document.querySelector("#sessionListMeta"),
  sessionLoadMoreButton: document.querySelector("#sessionLoadMoreButton"),
  chatStatusBanner: document.querySelector("#chatStatusBanner"),
  threadList: document.querySelector("#threadList"),
  composerForm: document.querySelector("#composerForm"),
  composerInput: document.querySelector("#composerInput"),
  composerSubmitButton: document.querySelector("#composerSubmitButton"),
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
  pipelineBanner: document.querySelector("#pipelineBanner"),

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
  previewVideo: document.querySelector("#previewVideo"),
  episodeLabel: document.querySelector("#episodeLabel"),
  previewHeadline: document.querySelector("#previewHeadline"),
  previewSummary: document.querySelector("#previewSummary"),
  subtitleBand: document.querySelector("#subtitleBand"),
  previewProgress: document.querySelector("#previewProgress"),
  playPreviewButton: document.querySelector("#playPreviewButton"),
  openOutputButton: document.querySelectorAll(".preview-actions .icon-label-button")[1],
  exportButton: document.querySelectorAll(".preview-actions .icon-label-button")[2],
  reviewSubtitleText: document.querySelector("#reviewSubtitleText"),
  reviewShotText: document.querySelector("#reviewShotText"),
  reviewSummaryText: document.querySelector("#reviewSummaryText"),
  reviewOutputText: document.querySelector("#reviewOutputText"),
  artifactList: document.querySelector("#artifactList"),

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
  toastStack: document.querySelector("#toastStack"),
};

const EMPTY_PREVIEW = {
  statusText: "\u7a7a\u95f2",
  episodeLabel: "\u65b0\u5efa / \u7a7a\u767d\u5bf9\u8bdd",
  headline: "\u7b49\u5f85\u65b0\u4efb\u52a1",
  summary: "\u5148\u9009\u62e9\u8d26\u53f7\u3001\u6a21\u677f\u548c\u6307\u4ee4\uff0c\u7136\u540e\u4ece\u5de6\u4fa7\u5bf9\u8bdd\u533a\u5f00\u59cb\u3002",
  subtitle: "\u5b57\u5e55\u9884\u89c8\u4f1a\u968f\u5f53\u524d\u4efb\u52a1\u72b6\u6001\u66f4\u65b0\u3002",
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
  sessionCursor: 0,
  sessionTotal: 0,
  sessionHasMore: false,
  sessionPageSize: 20,
  sessionScanMs: 0,
  sessionSearchTimer: 0,
  activeJob: null,
  eventSource: null,
  draftConfig: null,
  activeView: "workflow",
  instructionTimer: null,
  pendingSessionLabel: "",
  selectedSessionId: "",
  sessionBindState: "unbound",
  busyReason: "",
  toastTimer: 0,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureArtifactListElement() {
  if (els.artifactList) return els.artifactList;
  const parent = els.reviewOutputText?.parentElement;
  if (!parent) return null;
  const node = document.createElement("div");
  node.id = "artifactList";
  node.className = "artifact-list";
  parent.appendChild(node);
  els.artifactList = node;
  return node;
}

function getArtifactManifest(job) {
  return job?.artifactManifest && typeof job.artifactManifest === "object" ? job.artifactManifest : {};
}

function getArtifactItem(job, key) {
  return getArtifactManifest(job)?.[key] || null;
}

function buildSessionRequestUrl(options = {}) {
  const params = new URLSearchParams();
  params.set("scope", state.sessionScope);
  params.set("cursor", String(options.cursor || 0));
  params.set("limit", String(options.limit || state.sessionPageSize || 20));
  const query = typeof options.query === "string" ? options.query : state.sessionQuery;
  if (query?.trim()) params.set("q", query.trim());
  if (options.forceRefresh) params.set("refresh", "1");
  return `/api/sessions?${params.toString()}`;
}

function getWorkspaceAbsolutePath(relativePath = "") {
  if (!relativePath) return state.project?.workspacePath || "";
  const root = (state.project?.workspacePath || "").replace(/[\\/]+$/, "");
  return root ? `${root}\\${relativePath.replaceAll("/", "\\")}` : relativePath;
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "true");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const success = document.execCommand("copy");
    input.remove();
    return success;
  } catch {
    return false;
  }
}

function triggerDownload(item) {
  if (!item?.url) return;
  const anchor = document.createElement("a");
  anchor.href = item.url;
  anchor.download = item.fileName || "";
  anchor.rel = "noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function requestJson(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 0);
  const controller = timeoutMs > 0 ? new AbortController() : null;
  const timeoutHandle =
    controller && timeoutMs > 0
      ? window.setTimeout(() => {
          controller.abort(new Error(`Timeout after ${timeoutMs}ms`));
        }, timeoutMs)
      : 0;
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller?.signal,
      ...options,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed: ${response.status}`);
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Request timeout: ${url}`);
    }
    throw error;
  } finally {
    if (timeoutHandle) window.clearTimeout(timeoutHandle);
  }
}

function setBanner(message = "", tone = "info") {
  els.chatStatusBanner.textContent = message;
  els.chatStatusBanner.className = "chat-status-banner";
  if (!message) {
    els.chatStatusBanner.classList.add("is-hidden");
    return;
  }
  els.chatStatusBanner.classList.add(`is-${tone}`);
}

function showToast(message, tone = "info") {
  if (!message) return;
  const toast = document.createElement("div");
  toast.className = `toast is-${tone}`;
  toast.textContent = message;
  els.toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function normalizeErrorText(message = "") {
  const text = String(message || "").trim();
  if (!text) return "\u53d1\u751f\u672a\u77e5\u9519\u8bef\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002";
  if (text.includes("session not found")) return "\u672c\u5730 session \u4e0d\u5b58\u5728\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002";
  if (text.includes("job not found")) return "\u5f53\u524d\u4efb\u52a1\u5df2\u4e0d\u53ef\u7528\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002";
  if (text.includes("message is required")) return "\u6d88\u606f\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a\u3002";
  if (text.includes("prompt or sessionId is required")) return "\u8bf7\u5148\u8f93\u5165\u6d88\u606f\uff0c\u6216\u9009\u62e9\u4e00\u4e2a\u672c\u5730 session\u3002";
  if (text.includes("Body too large")) return "\u8f93\u5165\u5185\u5bb9\u8fc7\u957f\uff0c\u8bf7\u7cbe\u7b80\u540e\u91cd\u8bd5\u3002";
  if (text.includes("Request timeout")) return "\u672c\u5730\u670d\u52a1\u8d85\u65f6\uff0c\u8bf7\u91cd\u8bd5\u3002";
  if (text.includes("Codex is already running for this job")) return "\u4e0a\u4e00\u6761 Codex \u8bf7\u6c42\u8fd8\u5728\u6267\u884c\uff0c\u8bf7\u7a0d\u5019\u3002";
  if (text.includes("spawn EPERM")) return "\u672c\u5730 Codex \u8fdb\u7a0b\u88ab\u7cfb\u7edf\u62d2\u7edd\u542f\u52a8\uff0c\u8bf7\u68c0\u67e5 Codex CLI \u6743\u9650\u3002";
  if (text.includes("os error 5")) return "\u672c\u5730 Codex \u8fdb\u7a0b\u88ab\u62d2\u7edd\u8bbf\u95ee\uff0c\u8bf7\u68c0\u67e5\u6267\u884c\u6743\u9650\u3002";
  if (text.startsWith("Codex request timed out")) return "Codex \u8bf7\u6c42\u8d85\u65f6\uff0c\u8bf7\u68c0\u67e5\u672c\u5730 Codex CLI \u72b6\u6001\u3002";
  if (text.startsWith("Codex session bootstrap timed out")) return "\u521b\u5efa\u672c\u5730 Codex session \u8d85\u65f6\u3002";
  if (text.startsWith("Codex session bootstrap exited with code 1")) {
    const detail = text.split(":").slice(1).join(":").trim();
    return detail ? `\u521b\u5efa\u672c\u5730 Codex session \u5931\u8d25\uff1a${detail}` : "\u521b\u5efa\u672c\u5730 Codex session \u5931\u8d25\u3002";
  }
  if (text.startsWith("Codex exited with code 1")) {
    const detail = text.split(":").slice(1).join(":").trim();
    return detail ? `Codex \u6267\u884c\u5931\u8d25\uff1a${detail}` : "Codex \u6267\u884c\u5931\u8d25\u3002";
  }
  if (text.startsWith("Codex terminated by signal")) return "Codex \u88ab\u5f02\u5e38\u4e2d\u65ad\uff0c\u8bf7\u91cd\u8bd5\u3002";
  if (text.includes("Codex did not return a thread id")) return "Codex \u6ca1\u6709\u8fd4\u56de\u53ef\u7528\u7684 session id\u3002";
  if (text.includes("Codex completed without a final message")) return "Codex \u5df2\u5b8c\u6210\uff0c\u4f46\u6ca1\u6709\u8fd4\u56de\u53ef\u7528\u56de\u590d\u3002";
  return text;
}

function reportError(prefix, error) {
  const message = normalizeErrorText(error?.message || error);
  const text = prefix ? `${prefix}: ${message}` : message;
  setBanner(text, "error");
  showToast(text, "error");
}

function setSessionUi(selectedSessionId = "", sessionBindState = "unbound") {
  state.selectedSessionId = selectedSessionId || "";
  state.sessionBindState = sessionBindState;
}

function syncSessionUiFromJob(job) {
  if (job?.codexSessionId) {
    setSessionUi(job.codexSessionId, "linked");
    return;
  }
  if (!state.busyReason) {
    setSessionUi("", "unbound");
  }
}

function cloneJob(job) {
  return job ? JSON.parse(JSON.stringify(job)) : null;
}

function setBusy(isBusy, reason = "") {
  state.busyReason = isBusy ? reason : "";
  [
    els.sessionSelect,
    els.newThreadButton,
    els.toggleSessionDrawerButton,
    els.sessionRefreshButton,
    els.composerInput,
    els.composerSubmitButton,
    els.attachButton,
    els.refreshButton,
    els.accountSelect,
    els.openAccountModalButton,
    els.templateSelect,
    els.templateLockToggle,
    els.openInstructionInput,
  ].forEach((element) => {
    if (element) element.disabled = isBusy;
  });

  document.querySelectorAll("[data-session-scope], [data-instruction-scope], .preset-chip").forEach((element) => {
    element.disabled = isBusy;
  });
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
    planning: "\u89c4\u5212\u4e2d",
    tts: "TTS",
    rendering: "\u6e32\u67d3\u4e2d",
    completed: "\u5df2\u5b8c\u6210",
    awaiting_review: "\u5f85\u5ba1\u9605",
    session: "\u5df2\u7ed1\u5b9a session",
    idle: "\u7a7a\u95f2",
    unknown: "\u672a\u77e5",
  };
  return map[status] || status;
}

function localizeStepStatus(status) {
  const map = {
    done: "Done",
    running: "Running",
    waiting: "Waiting",
    failed: "Failed",
  };
  return map[status] || status;
}

function platformLabel(platform) {
  const map = {
    xiaohongshu: "Xiaohongshu",
    douyin: "Douyin",
    bilibili: "Bilibili",
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
  const requestedTemplate = getTemplateById(config.templateId);
  const fallbackTemplateId = requestedTemplate?.id || account?.defaultTemplateId || state.templates[0]?.id || "";
  const template = requestedTemplate || getTemplateById(fallbackTemplateId) || state.templates[0] || null;
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
  if (account) chips.push(`\u8d26\u53f7\uff1a${account.name}`);
  if (template) chips.push(`\u6a21\u677f\uff1a${template.title}`);
  presetLabels.forEach((label) => chips.push(label));
  if (config.openInstruction.trim()) chips.push("\u5df2\u542f\u7528\u5f00\u653e\u6307\u4ee4");
  return chips;
}

function getDisplayedSessionLabel(job) {
  if (state.sessionBindState === "creating") return "\u521b\u5efa\u4e2d...";
  if (state.sessionBindState === "binding" && state.selectedSessionId) return `\u7ed1\u5b9a\u4e2d ${state.selectedSessionId.slice(0, 8)}...`;
  if (state.sessionBindState === "failed" && state.selectedSessionId) return `\u7ed1\u5b9a\u5931\u8d25 ${state.selectedSessionId.slice(0, 8)}...`;
  if (job?.codexSessionId) return `${job.codexSessionId.slice(0, 8)}...`;
  if (state.pendingSessionLabel) return state.pendingSessionLabel;
  return "\u672a\u7ed1\u5b9a";
}

function renderTopContext(config, job) {
  const sessionLabel = getDisplayedSessionLabel(job);
  els.topSessionChip.textContent = sessionLabel;
  els.topStatusChip.textContent = localizeJobStatus(job?.status || "idle");
  els.topOutputChip.textContent = job?.outputDir || "data/jobs";
}

function getPipelineNotice(job) {
  if (!job?.planSource || job.planSource !== "local-fallback") return null;
  const reason = String(job.planFallbackReason || "");
  const usageLimit = /usage|limit|quota|rate/i.test(reason);
  return {
    tone: "warning",
    text: usageLimit
      ? "\u5f53\u524d Codex \u989d\u5ea6\u4e0d\u53ef\u7528\uff0c\u8ba1\u5212\u5df2\u81ea\u52a8\u5207\u6362\u4e3a\u672c\u5730 fallback\u3002\u4f60\u4ecd\u53ef\u4ee5\u7ee7\u7eed\u751f\u6210\u914d\u97f3\u548c\u6e32\u67d3\u3002"
      : `\u7ed3\u6784\u5316 Codex \u8ba1\u5212\u5931\u8d25\uff0c\u5df2\u81ea\u52a8\u5207\u6362\u4e3a\u672c\u5730 fallback${reason ? `\uff0c\u539f\u56e0\uff1a${reason}` : "\u3002"}`,
  };
}

function renderPipelineNotice(job) {
  const notice = getPipelineNotice(job);
  els.pipelineBanner.className = "pipeline-banner";
  if (!notice) {
    els.pipelineBanner.textContent = "";
    els.pipelineBanner.classList.add("is-hidden");
    return;
  }
  els.pipelineBanner.textContent = notice.text;
  els.pipelineBanner.classList.add(`is-${notice.tone}`);
}

function renderProject() {
  if (!state.project) return;
  els.workspacePath.textContent = state.project.workspacePath || "";

  const visibleCount = Number(state.sessionTotal || state.project.localSessionCount || 0);
  const suffix = visibleCount > 0 ? ` | ${visibleCount}\u4e2a session` : "";
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
        <strong>\u8fd8\u6ca1\u6709\u5bf9\u8bdd</strong>
        <p>\u53ef\u4ee5\u76f4\u63a5\u53d1\u9001\u4f60\u7684\u89c6\u9891\u9700\u6c42\uff0c\u6216\u5148\u7ed1\u5b9a\u4e00\u4e2a\u672c\u5730 Codex session \u7ee7\u7eed\u5bf9\u8bdd\u3002</p>
      </div>
    `;
    els.threadList.scrollTop = 0;
    return;
  }

  els.threadList.innerHTML = items
    .map(
      (message) => `
        <article class="message ${escapeHtml(message.role || "assistant")} ${message.pending ? "is-pending" : ""}">
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
        <strong>\u8fd8\u6ca1\u6709\u4efb\u52a1\u6d41\u6c34\u7ebf</strong>
        <p>\u751f\u6210\u8ba1\u5212\u540e\uff0c\u8fd9\u91cc\u4f1a\u6309\u6b65\u9aa4\u663e\u793a\u89c4\u5212\u3001\u914d\u97f3\u548c\u6e32\u67d3\u8fdb\u5ea6\u3002</p>
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
        <strong>\u8fd8\u6ca1\u6709\u811a\u672c\u7ed3\u6784</strong>
        <p>\u751f\u6210\u8ba1\u5212\u540e\uff0c\u8fd9\u91cc\u4f1a\u663e\u793a Hook\u3001\u6b63\u6587\u3001\u8f6c\u573a\u548c\u7ed3\u5c3e\u7ed3\u6784\u3002</p>
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

function renderTemplateSelect(config) {
  const options = state.templates
    .map(
      (template) =>
        `<option value="${escapeHtml(template.id)}">${escapeHtml(template.title)} | ${escapeHtml(
          template.compositionId || "-",
        )}</option>`,
    )
    .join("");
  els.templateSelect.innerHTML = options;
  els.accountTemplateInput.innerHTML = options;
  els.templateSelect.value = config.templateId || state.templates[0]?.id || "";
  els.accountTemplateInput.value = config.templateId || state.templates[0]?.id || "";
}

function renderSessionSelect() {
  const items = [...state.sessions];
  const activeSessionId = state.selectedSessionId || state.activeJob?.codexSessionId;
  if (activeSessionId && !items.some((session) => session.id === activeSessionId)) {
    items.unshift({
      id: activeSessionId,
      threadName: state.activeJob?.title || `Session ${activeSessionId.slice(0, 8)}`,
      updatedAt: state.activeJob?.updatedAt || "",
    });
  }
  const options = [
    `<option value="">\u9009\u62e9\u4e00\u4e2a\u672c\u5730 session \u6216\u76f4\u63a5\u53d1\u6d88\u606f\u65b0\u5efa\u5bf9\u8bdd</option>`,
    ...items.map((session) => {
      const timeLabel = formatTimestamp(session.updatedAt);
      const name = session.threadName || `Session ${session.id.slice(0, 8)}`;
      return `<option value="${escapeHtml(session.id)}">${escapeHtml(name)}${timeLabel ? ` | ${timeLabel}` : ""}</option>`;
    }),
  ];
  els.sessionSelect.innerHTML = options.join("");
  els.sessionSelect.value = activeSessionId || "";
}

function getFilteredSessions() {
  const query = String(state.sessionQuery || "").trim().toLowerCase();
  if (!query) return [...state.sessions];
  return state.sessions.filter((session) => {
    const haystack = [session.threadName, session.previewText, session.cwd, session.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

function renderSessionList() {
  const sessions = getFilteredSessions();
  const activeSessionId = state.selectedSessionId || state.activeJob?.codexSessionId || "";
  if (!sessions.length) {
    const hasQuery = Boolean(String(state.sessionQuery || "").trim());
    els.sessionList.innerHTML = `
      <div class="thread-empty">
        <strong>${hasQuery ? "\u672a\u627e\u5230\u5339\u914d\u7684 session" : "\u8fd8\u6ca1\u6709\u672c\u5730 session"}</strong>
        <p>${hasQuery
          ? "\u53ef\u4ee5\u5c1d\u8bd5\u66f4\u6362\u5173\u952e\u5b57\uff0c\u6216\u5207\u6362\u5230\u5168\u90e8 scope \u91cd\u65b0\u67e5\u627e\u3002"
          : "\u53ef\u4ee5\u70b9\u51fb\u65b0\u5efa\u5bf9\u8bdd\uff0c\u6216\u76f4\u63a5\u53d1\u9001\u4e00\u6761\u6d88\u606f\u8ba9\u7cfb\u7edf\u81ea\u52a8\u521b\u5efa session\u3002"}</p>
      </div>
    `;
    if (els.sessionListMeta) {
      els.sessionListMeta.textContent = `0 / ${state.sessionTotal || 0} \u4e2a session`;
    }
    if (els.sessionLoadMoreButton) {
      els.sessionLoadMoreButton.hidden = true;
    }
    return;
  }

  els.sessionList.innerHTML = sessions
    .map(
      (session) => `
        <button
          type="button"
          class="session-item ${activeSessionId === session.id ? "is-selected" : ""}"
          data-session-id="${escapeHtml(session.id)}"
        >
          <span class="session-badge">${session.archived ? "\u5df2\u5f52\u6863" : "\u672c\u5730 session"}</span>
          <strong>${escapeHtml(session.threadName || session.id)}</strong>
          <p>${escapeHtml(session.previewText || session.cwd || session.id)}</p>
          <small>${escapeHtml(formatTimestamp(session.updatedAt))} | ${escapeHtml(session.id.slice(0, 8))}</small>
        </button>
      `,
    )
    .join("");

  if (els.sessionListMeta) {
    const scanMs = Number(state.sessionScanMs || 0);
    const perfLabel = scanMs > 0 ? ` | ${scanMs}ms` : "";
    els.sessionListMeta.textContent = `${state.sessions.length} / ${state.sessionTotal || state.sessions.length} \u4e2a session${perfLabel}`;
  }
  if (els.sessionLoadMoreButton) {
    els.sessionLoadMoreButton.hidden = !state.sessionHasMore;
    els.sessionLoadMoreButton.disabled = !!state.busyReason;
  }
}

function renderAccountProfile(config) {
  const account = getAccountById(config.accountId);
  els.accountProfileTitle.textContent = account?.name || "\u672a\u9009\u62e9\u8d26\u53f7";
  els.accountPlatformBadge.textContent = platformLabel(account?.platform);
  els.accountPersonaLabel.textContent = account?.persona || "-";
  els.accountCtaLabel.textContent = account?.ctaStyle || "-";
  els.accountConstraintsLabel.textContent = Array.isArray(account?.constraints)
    ? account.constraints.join("\u3001")
    : account?.constraints || "-";

  const toneTags = Array.isArray(account?.toneTags) ? account.toneTags : [];
  els.accountToneTags.innerHTML = toneTags.length
    ? toneTags.map((tag) => `<span class="tiny-chip">${escapeHtml(tag)}</span>`).join("")
    : `<span class="tiny-chip is-muted">\u672a\u914d\u7f6e\u98ce\u683c\u6807\u7b7e</span>`;

  if (els.subtitleStyleLabel) {
    els.subtitleStyleLabel.textContent = account?.subtitleStyle || "\u672a\u914d\u7f6e\u5b57\u5e55\u98ce\u683c";
  }
  if (els.durationLabel) {
    const duration = account?.defaultDurationSec || account?.durationSec;
    els.durationLabel.textContent = duration ? `${duration}s` : "-";
  }
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
  els.instructionScopeBadge.textContent =
    config.instructionScope === "session"
      ? "\u6301\u7eed\u4f5c\u7528\u4e8e\u5f53\u524d session"
      : "\u4ec5\u672c\u8f6e\u751f\u6548";

  document.querySelectorAll("[data-instruction-scope]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.instructionScope === config.instructionScope);
  });
}

function renderHeader(config, job) {
  const account = getAccountById(config.accountId);
  const template = getTemplateById(config.templateId);
  const sessionLabel = getDisplayedSessionLabel(job);
  const sessionBound = Boolean(job?.codexSessionId || state.selectedSessionId);

  els.taskHeaderTitle.textContent = job?.title || "\u672a\u9009\u62e9\u5bf9\u8bdd";
  els.taskHeaderSummary.textContent = [
    account ? `\u8d26\u53f7\uff1a${account.name}` : null,
    template ? `\u6a21\u677f\uff1a${template.title}` : null,
    job?.status ? `\u72b6\u6001\uff1a${localizeJobStatus(job.status)}` : null,
  ]
    .filter(Boolean)
    .join("  |  ");

  els.chatAccountLabel.textContent = account?.name || "\u672a\u9009\u62e9\u8d26\u53f7";
  els.chatTemplateLabel.textContent = template?.title || "\u672a\u9009\u62e9\u6a21\u677f";
  if (els.chatSessionStateLabel) {
    els.chatSessionStateLabel.textContent = sessionBound
      ? "\u5df2\u7ed1\u5b9a\u672c\u5730 session"
      : "\u672a\u7ed1\u5b9a session";
  }
  els.chatSessionLabel.textContent = sessionLabel;
  els.chatOutputLabel.textContent = job?.outputDir || "data/jobs";

  const tags = buildActiveInstructionTags(config);
  els.activeInstructionStrip.innerHTML = tags.length
    ? tags.map((tag) => `<span class="inline-tag">${escapeHtml(tag)}</span>`).join("")
    : `<span class="inline-tag is-muted">\u8fd8\u6ca1\u6709\u542f\u7528\u6307\u4ee4\u9884\u8bbe\u6216\u5f00\u653e\u6307\u4ee4</span>`;

  renderTopContext(config, job || null);
  renderPipelineNotice(job || null);
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
          <p>${escapeHtml(template.summary || "\u672a\u914d\u7f6e\u6a21\u677f\u6458\u8981")}</p>
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

function buildArtifactActions(item) {
  if (!item?.exists || !item.url) {
    return `<span class="artifact-link is-disabled">\u5f85\u751f\u6210</span>`;
  }
  return `
    <div class="artifact-actions">
      <a class="artifact-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">\u6253\u5f00</a>
      <a class="artifact-link" href="${escapeHtml(item.url)}" download="${escapeHtml(item.fileName || "")}">\u4e0b\u8f7d</a>
    </div>
  `;
}

function buildPosterCard(item) {
  if (!item?.exists || !item.url) return "";
  return `
    <div class="artifact-poster-card">
      <img src="${escapeHtml(item.url)}" alt="\u5c01\u9762\u5e27" />
      <div class="artifact-poster-copy">
        <strong>\u5c01\u9762\u5e27</strong>
        <span>${escapeHtml(item.path)}</span>
      </div>
      <div class="artifact-actions">
        <a class="artifact-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">\u6253\u5f00</a>
        <a class="artifact-link" href="${escapeHtml(item.url)}" download="${escapeHtml(item.fileName || "poster.jpg")}">\u4e0b\u8f7d</a>
      </div>
    </div>
  `;
}

function renderArtifactList(job) {
  const container = ensureArtifactListElement();
  if (!container) return;

  const manifest = getArtifactManifest(job);
  const poster = manifest.poster;
  const items = ["planBrief", "plan", "voiceoverUnits", "subtitles", "alignment", "audio", "video"]
    .map((key) => manifest[key])
    .filter(Boolean);

  if (!job || !items.length) {
    container.innerHTML = '<div class="artifact-empty">\u8fd8\u6ca1\u6709\u4ea7\u7269\u3002\u751f\u6210\u8ba1\u5212\u3001\u914d\u97f3\u6216\u6e32\u67d3\u540e\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002</div>';
    return;
  }

  const rows = items
    .map((item) => {
      const status = item.exists ? "\u5df2\u5c31\u7eea" : "\u5f85\u751f\u6210";
      const pathLabel = item.path || "-";
      return `
        <div class="artifact-row">
          <div class="artifact-copy">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(status)} | ${escapeHtml(pathLabel)}</span>
          </div>
          ${buildArtifactActions(item)}
        </div>
      `;
    })
    .join("");

  container.innerHTML = `${buildPosterCard(poster)}${rows}`;
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
  const subtitle = job?.preview?.subtitle || "\u5f53\u524d\u8fd8\u6ca1\u6709\u5b57\u5e55\u9884\u89c8\u3002";
  const reviewSummary = [
    hook?.text ? `Hook: ${hook.text}` : null,
    body?.text ? `Body: ${body.text}` : null,
    close?.text ? `Close: ${close.text}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  els.subtitleReviewText.textContent = subtitle;
  els.reviewSubtitleText.textContent = subtitle;
  els.reviewShotText.textContent = job?.preview?.shot || template?.compositionId || "\u5f53\u524d\u8fd8\u6ca1\u6709\u955c\u5934\u8bf4\u660e\u3002";
  els.reviewSummaryText.textContent = reviewSummary || job?.preview?.summary || "\u5f53\u524d\u8fd8\u6ca1\u6709\u811a\u672c\u6458\u8981\u3002";
  els.subtitleRuleText.textContent = account?.subtitleStyle
    ? `\u5b57\u5e55\u98ce\u683c\uff1a${account.subtitleStyle}`
    : "\u5b57\u5e55\u98ce\u683c\u5c1a\u672a\u914d\u7f6e\u3002";
  els.reviewOutputText.textContent = job
    ? `${localizeJobStatus(job.status)} | ${job.outputDir || "data/jobs"}`
    : `${account?.name || "\u672a\u9009\u62e9\u8d26\u53f7"} | ${template?.title || "\u672a\u9009\u62e9\u6a21\u677f"}`;
}

function enhanceReviewCards(job, config) {
  const account = getAccountById(config.accountId);
  const template = getTemplateById(config.templateId);
  if (job) {
    const manifest = getArtifactManifest(job);
    const readyCount = ["plan", "subtitles", "audio", "video"].filter((key) => manifest[key]?.exists).length;
    const fallbackSuffix = job.planSource === "local-fallback"
      ? " | \u8ba1\u5212\u6765\u81ea\u672c\u5730 fallback"
      : "";
    els.reviewOutputText.textContent = `${localizeJobStatus(job.status)} | ${readyCount}/4 | ${job.outputDir || "data/jobs"}${fallbackSuffix}`;
  } else {
    els.reviewOutputText.textContent = `${account?.name || "\u672a\u9009\u62e9\u8d26\u53f7"} | ${template?.title || "\u672a\u9009\u62e9\u6a21\u677f"}`;
  }
  renderArtifactList(job);
}

function renderActionHints(job) {
  const hints = [];
  if (!job) {
    hints.push("\u5148\u9009\u62e9 session \u6216\u76f4\u63a5\u53d1\u7b2c\u4e00\u6761\u6d88\u606f\u521b\u5efa\u4efb\u52a1\u3002");
  } else if (!job.codexSessionId) {
    hints.push("\u5f53\u524d\u4efb\u52a1\u8fd8\u6ca1\u6709\u7ed1\u5b9a\u672c\u5730 session\u3002");
  }

  const stepMap = indexSteps(job?.steps || []);
  const planDone = stepMap["generate-plan"]?.status === "completed";
  const ttsDone = stepMap["tts"]?.status === "completed";
  const renderDone = stepMap["render"]?.status === "completed";

  if (!planDone) {
    hints.push("\u5148\u751f\u6210\u8ba1\u5212\uff0c\u518d\u8fdb\u5165\u914d\u97f3\u548c\u6e32\u67d3\u3002");
  } else if (!ttsDone) {
    hints.push("\u8ba1\u5212\u5df2\u5b8c\u6210\uff0c\u4e0b\u4e00\u6b65\u53ef\u4ee5\u751f\u6210 TTS \u548c\u65f6\u95f4\u8f74\u3002");
  } else if (!renderDone) {
    hints.push("\u914d\u97f3\u5df2\u5b8c\u6210\uff0c\u53ef\u4ee5\u5f00\u59cb\u6e32\u67d3 MP4\u3002");
  } else {
    hints.push("\u4ea7\u7269\u5df2\u5c31\u7eea\uff0c\u53ef\u4ee5\u5728\u53f3\u4fa7\u5ba1\u9605\u533a\u9884\u89c8\u3001\u5bfc\u51fa\u6216\u6253\u5f00\u6587\u4ef6\u3002");
  }

  if (job?.planSource === "local-fallback") {
    hints.push("Codex \u989d\u5ea6\u4e0d\u53ef\u7528\uff0c\u672c\u6b21\u8ba1\u5212\u5df2\u81ea\u52a8\u5207\u6362\u4e3a\u672c\u5730 fallback\u3002");
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
  if (!state.busyReason) {
    syncSessionUiFromJob(null);
  }
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
  renderPreviewMedia(null);
  renderReviewCards(null, config);
  enhanceReviewCards(null, config);
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
  if (job.codexSessionId) {
    state.pendingSessionLabel = "";
  }
  syncSessionUiFromJob(job);
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
  renderPreviewMedia(job);
  renderReviewCards(job, config);
  enhanceReviewCards(job, config);
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
    setBanner("\u4e0e\u672c\u5730\u4efb\u52a1\u4e8b\u4ef6\u6d41\u7684\u8fde\u63a5\u5df2\u65ad\u5f00\uff0c\u6b63\u5728\u4fdd\u7559\u5f53\u524d\u753b\u9762\u72b6\u6001\u3002", "warning");
    eventSource.close();
  };

  state.eventSource = eventSource;
}
async function loadBootstrap(options = {}) {
  const preserveSelection = Boolean(options.preserveSelection);
  const forceRefresh = Boolean(options.forceRefresh);
  const selectedJobId = preserveSelection ? state.activeJob?.id : null;
  const refreshFlag = forceRefresh ? "?refresh=1" : "";

  const [projectPayload, templatePayload, assetPayload, jobsPayload, sessionPayload, accountPayload, presetPayload] =
    await Promise.all([
      requestJson(`/api/projects${refreshFlag}`),
      requestJson("/api/templates"),
      requestJson("/api/assets"),
      requestJson("/api/jobs"),
      requestJson(buildSessionRequestUrl({forceRefresh, cursor: 0})),
      requestJson("/api/accounts"),
      requestJson("/api/instruction-presets"),
    ]);

  state.project = projectPayload;
  state.templates = templatePayload.items || [];
  state.assets = assetPayload.items || [];
  state.jobs = jobsPayload.items || [];
  state.sessions = sessionPayload.items || [];
  state.sessionCursor = (sessionPayload.cursor || 0) + (sessionPayload.items?.length || 0);
  state.sessionTotal = Number(sessionPayload.total || state.sessions.length || 0);
  state.sessionHasMore = Boolean(sessionPayload.hasMore);
  state.sessionScanMs = Number(sessionPayload.scanMs || projectPayload.sessionCatalogScanMs || 0);
  state.accounts = accountPayload.items || [];
  state.presets = presetPayload.items || [];
  state.project.localSessionCount = Number.isFinite(state.sessionTotal) ? state.sessionTotal : Number(state.project.localSessionCount || 0);
  state.project.sessionCatalogScanMs = state.sessionScanMs || state.project.sessionCatalogScanMs || 0;
  state.project.sessionPageSize = Number(projectPayload.sessionPageSize || state.sessionPageSize || 20);
  state.sessionPageSize = state.project.sessionPageSize || state.sessionPageSize;

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
  setBusy(true, "load-job");
  setBanner("\u6b63\u5728\u52a0\u8f7d\u4efb\u52a1\u8be6\u60c5...", "info");
  try {
    const job = await requestJson(`/api/jobs/${encodeURIComponent(jobId)}`, {timeoutMs: 10000});
    renderJob(job);
    bindDynamicLists();
    connectToEvents(jobId);
    setBanner("\u4efb\u52a1\u5df2\u52a0\u8f7d\uff0c\u53ef\u4ee5\u7ee7\u7eed\u5bf9\u8bdd\u6216\u68c0\u67e5\u4ea7\u7269\u3002", "success");
    return job;
  } catch (error) {
    reportError("\u52a0\u8f7d\u4efb\u52a1\u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function syncCollections(options = {}) {
  await loadBootstrap({
    preserveSelection: true,
    forceRefresh: Boolean(options.forceRefresh),
  });
  bindDynamicLists();
}

async function loadSessions(options = {}) {
  const query = typeof options.query === "string" ? options.query : state.sessionQuery;
  const forceRefresh = Boolean(options.forceRefresh);
  const append = Boolean(options.append);
  const cursor = append ? state.sessionCursor : 0;
  const limit = Number(options.limit || state.sessionPageSize || 20);
  const payload = await requestJson(buildSessionRequestUrl({query, forceRefresh, cursor, limit}));
  const items = Array.isArray(payload.items) ? payload.items : [];
  const merged = append
    ? [...state.sessions, ...items].filter(
        (session, index, all) => all.findIndex((item) => item.id === session.id) === index,
      )
    : items;

  state.sessionQuery = query;
  state.sessions = merged;
  state.sessionCursor = Number(payload.nextCursor ?? ((payload.cursor || 0) + items.length));
  state.sessionTotal = Number(payload.total || merged.length || 0);
  state.sessionHasMore = Boolean(payload.hasMore);
  state.sessionScanMs = Number(payload.scanMs || state.project?.sessionCatalogScanMs || 0);

  if (state.project) {
    state.project.localSessionCount = state.sessionTotal;
    state.project.sessionCatalogScanMs = state.sessionScanMs;
    state.project.sessionPageSize = Number(payload.limit || state.sessionPageSize || limit);
  }

  els.sessionSearchInput.value = state.sessionQuery;
  renderProject();
  renderSessionSelect();
  renderSessionList();
}

async function applyConfigPatch(patch) {
  const nextConfig = normalizeConfig({...getCurrentConfig(), ...patch});
  try {
    if (canConfigureJob(state.activeJob) && state.activeJob.id !== "__pending_job__") {
      const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/config`, {
        method: "PATCH",
        body: JSON.stringify(nextConfig),
      });
      renderJob(job);
      bindDynamicLists();
      return job;
    }

    setDraftConfig(nextConfig);
    renderEmptyJob();
    bindDynamicLists();
    return nextConfig;
  } catch (error) {
    reportError("\u66f4\u65b0\u4efb\u52a1\u914d\u7f6e\u5931\u8d25", error);
    throw error;
  }
}

async function createSession() {
  setBusy(true, "create-session");
  setSessionUi("", "creating");
  state.pendingSessionLabel = "\u6b63\u5728\u521b\u5efa\u672c\u5730 session...";
  setBanner("\u6b63\u5728\u521b\u5efa\u672c\u5730 Codex session...", "info");
  try {
    const job = await requestJson("/api/sessions", {
      method: "POST",
      body: JSON.stringify({config: getCurrentConfig()}),
    });
    state.pendingSessionLabel = "";
    renderJob(job);
    bindDynamicLists();
    connectToEvents(job.id);
    await loadSessions({forceRefresh: true});
    setBanner("\u5df2\u521b\u5efa\u672c\u5730 session\uff0c\u53ef\u4ee5\u76f4\u63a5\u5f00\u59cb\u5bf9\u8bdd\u3002", "success");
    showToast("\u5df2\u521b\u5efa\u672c\u5730 session", "success");
    return job;
  } catch (error) {
    state.pendingSessionLabel = "";
    setSessionUi("", "failed");
    reportError("\u521b\u5efa\u672c\u5730 session \u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function createJob(prompt) {
  const trimmedPrompt = String(prompt || "").trim();
  if (!trimmedPrompt) return null;

  const previousJob = cloneJob(state.activeJob);
  const config = getCurrentConfig();
  const now = new Date().toISOString();
  const pendingJob = {
    id: "__pending_job__",
    title: trimmedPrompt.length > 30 ? `${trimmedPrompt.slice(0, 30)}...` : trimmedPrompt,
    source: "runtime",
    status: "planning",
    accountId: config.accountId,
    templateId: config.templateId,
    compositionId: config.compositionId,
    templateLocked: config.templateLocked,
    activePresetIds: [...config.activePresetIds],
    openInstruction: config.openInstruction,
    instructionScope: config.instructionScope,
    durationSec: config.durationSec,
    aspectRatio: config.aspectRatio,
    outputDir: "data/jobs",
    messages: [
      {
        role: "user",
        author: "You",
        content: trimmedPrompt,
        createdAt: now,
      },
    ],
    pendingAssistantText: "Codex \u6b63\u5728\u7406\u89e3\u9700\u6c42\u5e76\u521b\u5efa\u4efb\u52a1...",
    steps: [],
    logs: [],
    scriptSections: [],
    preview: {
      ...EMPTY_PREVIEW,
      statusText: "\u89c4\u5212\u4e2d",
      headline: "\u6b63\u5728\u521b\u5efa\u4efb\u52a1",
      summary: "Codex \u6b63\u5728\u6839\u636e\u5f53\u524d\u8d26\u53f7\u3001\u6a21\u677f\u548c\u6307\u4ee4\u751f\u6210\u89c6\u9891\u4efb\u52a1\u3002",
      subtitle: "\u4efb\u52a1\u521b\u5efa\u4e2d\uff0c\u7a0d\u540e\u4f1a\u663e\u793a\u811a\u672c\u548c\u5b57\u5e55\u9884\u89c8\u3002",
      progress: 0.18,
    },
    codexRunning: true,
    createdAt: now,
    updatedAt: now,
    artifactManifest: {},
  };

  renderJob(pendingJob);
  bindDynamicLists();
  setBusy(true, "create-job");
  setBanner("\u6b63\u5728\u521b\u5efa\u4efb\u52a1...", "info");

  try {
    const job = await requestJson("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        prompt: trimmedPrompt,
        config,
      }),
    });
    renderJob(job);
    bindDynamicLists();
    connectToEvents(job.id);
    els.composerInput.value = "";
    await syncCollections();
    setBanner("\u4efb\u52a1\u5df2\u521b\u5efa\uff0c\u6b63\u5728\u540c\u6b65\u6700\u65b0\u72b6\u6001\u3002", "success");
    return job;
  } catch (error) {
    if (previousJob) {
      renderJob(previousJob);
      bindDynamicLists();
    } else {
      renderEmptyJob();
      bindDynamicLists();
    }
    reportError("\u521b\u5efa\u4efb\u52a1\u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function attachSession(sessionId) {
  const targetSessionId = String(sessionId || "").trim();
  if (!targetSessionId) return null;
  if (state.activeJob?.codexSessionId === targetSessionId) {
    setSessionUi(targetSessionId, "linked");
    renderSessionSelect();
    renderSessionList();
    return state.activeJob;
  }

  const session = state.sessions.find((item) => item.id === targetSessionId);
  state.pendingSessionLabel = session?.threadName || `Session ${targetSessionId.slice(0, 8)}`;
  setBusy(true, "attach-session");
  setSessionUi(targetSessionId, "binding");
  setBanner("\u6b63\u5728\u7ed1\u5b9a\u672c\u5730 session...", "info");
  renderSessionSelect();
  renderSessionList();

  try {
    const job = await requestJson("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        sessionId: targetSessionId,
        config: getCurrentConfig(),
      }),
    });
    state.pendingSessionLabel = "";
    renderJob(job);
    bindDynamicLists();
    connectToEvents(job.id);
    state.sessionDrawerOpen = false;
    els.sessionDrawer.hidden = true;
    await loadSessions();
    setBanner("\u5df2\u7ed1\u5b9a\u672c\u5730 session\uff0c\u53ef\u4ee5\u7ee7\u7eed\u5728\u8be5\u4e0a\u4e0b\u6587\u4e2d\u5bf9\u8bdd\u3002", "success");
    return job;
  } catch (error) {
    setSessionUi(targetSessionId, "failed");
    reportError("\u7ed1\u5b9a\u672c\u5730 session \u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function sendMessage(message) {
  const trimmedMessage = String(message || "").trim();
  if (!trimmedMessage) return null;

  if (!state.activeJob && state.selectedSessionId) {
    await attachSession(state.selectedSessionId);
  }

  if (!state.activeJob || !canChat(state.activeJob)) {
    return createJob(trimmedMessage);
  }

  const previousJob = cloneJob(state.activeJob);
  const optimisticJob = {
    ...cloneJob(state.activeJob),
    messages: [
      ...(state.activeJob.messages || []),
      {
        role: "user",
        author: "You",
        content: trimmedMessage,
        createdAt: new Date().toISOString(),
      },
    ],
    pendingAssistantText: "Codex \u6b63\u5728\u56de\u590d...",
    codexRunning: true,
    updatedAt: new Date().toISOString(),
  };

  renderJob(optimisticJob);
  bindDynamicLists();
  setBusy(true, "send-message");
  setBanner("\u6b63\u5728\u53d1\u9001\u6d88\u606f\u5e76\u7b49\u5f85 Codex \u56de\u590d...", "info");
  try {
    const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/codex/message`, {
      method: "POST",
      body: JSON.stringify({message: trimmedMessage}),
    });
    renderJob(job);
    bindDynamicLists();
    connectToEvents(job.id);
    setBanner("Codex \u5df2\u8fd4\u56de\u6700\u65b0\u56de\u590d\u3002", "success");
    return job;
  } catch (error) {
    if (previousJob) {
      renderJob(previousJob);
      bindDynamicLists();
    }
    reportError("\u53d1\u9001\u6d88\u606f\u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function runAction(action) {
  if (!canRunPipeline(state.activeJob)) return null;
  const actionLabelMap = {
    "generate-plan": "\u751f\u6210\u8ba1\u5212",
    tts: "\u751f\u6210\u914d\u97f3",
    render: "\u6e32\u67d3\u89c6\u9891",
  };
  const actionLabel = actionLabelMap[action] || action;
  setBusy(true, `run-${action}`);
  setBanner(`\u6b63\u5728\u6267\u884c${actionLabel}...`, "info");
  try {
    const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/actions/${action}`, {
      method: "POST",
    });
    renderJob(job);
    bindDynamicLists();
    setBanner(`${actionLabel}\u5df2\u542f\u52a8\uff0c\u6b63\u5728\u540c\u6b65\u6700\u65b0\u72b6\u6001\u3002`, "success");
    return job;
  } catch (error) {
    reportError(`${actionLabel}\u5931\u8d25`, error);
    throw error;
  } finally {
    setBusy(false);
  }
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
    name: String(formData.get("name") || "").trim(),
    platform: String(formData.get("platform") || "xiaohongshu").trim(),
    persona: String(formData.get("persona") || "").trim(),
    toneTags: String(formData.get("toneTags") || "").trim(),
    defaultTemplateId: String(formData.get("defaultTemplateId") || "").trim(),
    defaultDurationSec: Number(formData.get("defaultDurationSec") || 60),
    ctaStyle: String(formData.get("ctaStyle") || "").trim(),
    subtitleStyle: String(formData.get("subtitleStyle") || "").trim(),
    constraints: String(formData.get("constraints") || "").trim(),
  };

  setBusy(true, "create-account");
  setBanner("\u6b63\u5728\u521b\u5efa\u8d26\u53f7...", "info");
  try {
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

    if (canConfigureJob(state.activeJob) && state.activeJob.id !== "__pending_job__") {
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
    setBanner("\u8d26\u53f7\u5df2\u521b\u5efa\uff0c\u5f53\u524d\u914d\u7f6e\u5df2\u66f4\u65b0\u3002", "success");
    showToast("\u8d26\u53f7\u5df2\u521b\u5efa", "success");
    return account;
  } catch (error) {
    reportError("\u521b\u5efa\u8d26\u53f7\u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
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
    state.sessionCursor = 0;
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
  if (state.sessionSearchTimer) window.clearTimeout(state.sessionSearchTimer);
  state.sessionSearchTimer = window.setTimeout(() => {
    loadSessions({query: state.sessionQuery}).catch((error) => {
      reportError("\u8bfb\u53d6 session \u5217\u8868\u5931\u8d25", error);
    });
  }, 220);
});

els.sessionSelect.addEventListener("change", async () => {
  const sessionId = els.sessionSelect.value;
  if (!sessionId) {
    state.pendingSessionLabel = "";
    setSessionUi("", "unbound");
    closeEventSource();
    renderEmptyJob();
    setBanner("", "info");
    els.composerInput.focus();
    return;
  }

  try {
    await attachSession(sessionId);
  } catch (error) {
    void error;
  }
});

els.newThreadButton.addEventListener("click", async () => {
  els.newThreadButton.disabled = true;
  try {
    await createSession();
    els.composerInput.focus();
  } catch (error) {
    void error;
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
    reportError("\u5237\u65b0 session \u5217\u8868\u5931\u8d25", error);
  }
});

els.sessionLoadMoreButton?.addEventListener("click", async () => {
  try {
    await loadSessions({append: true});
  } catch (error) {
    reportError("\u52a0\u8f7d\u66f4\u591a session \u5931\u8d25", error);
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

  try {
    await applyConfigPatch(patch);
  } catch (error) {
    void error;
  }
});

els.templateSelect.addEventListener("change", async () => {
  const template = getTemplateById(els.templateSelect.value);
  try {
    await applyConfigPatch({
      templateId: template?.id || "",
      compositionId: template?.compositionId || "",
      durationSec: template?.defaultDurationSec || getCurrentConfig().durationSec,
      aspectRatio: template?.aspectRatio || getCurrentConfig().aspectRatio,
    });
  } catch (error) {
    void error;
  }
});

els.templateLockToggle.addEventListener("change", async () => {
  try {
    await applyConfigPatch({templateLocked: els.templateLockToggle.checked});
  } catch (error) {
    void error;
  }
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
    void error;
  }
});

els.generatePlanButton.addEventListener("click", async () => {
  try {
    await runAction("generate-plan");
  } catch (error) {
    void error;
  }
});

els.ttsButton.addEventListener("click", async () => {
  try {
    await runAction("tts");
  } catch (error) {
    void error;
  }
});

els.renderButton.addEventListener("click", async () => {
  try {
    await runAction("render");
  } catch (error) {
    void error;
  }
});

els.playPreviewButton.addEventListener("click", () => {
  const video = getArtifactItem(state.activeJob, "video");
  if (video?.exists && video.url && !els.previewVideo.hidden) {
    if (els.previewVideo.paused) {
      void els.previewVideo.play().catch(() => {
        showToast("\u6d4f\u89c8\u5668\u963b\u6b62\u4e86\u81ea\u52a8\u64ad\u653e\uff0c\u8bf7\u624b\u52a8\u70b9\u51fb\u89c6\u9891\u533a\u57df\u91cd\u8bd5\u3002", "warning");
      });
    } else {
      els.previewVideo.pause();
    }
    return;
  }
  if (video?.exists && video.url) {
    window.open(video.url, "_blank", "noopener");
    return;
  }
  showToast("\u8fd8\u6ca1\u6709\u53ef\u64ad\u653e\u7684\u89c6\u9891\uff0c\u8bf7\u5148\u5b8c\u6210\u6e32\u67d3\u3002", "info");
});

els.refreshButton.addEventListener("click", async () => {
  try {
    await loadBootstrap({preserveSelection: true, forceRefresh: true});
  } catch (error) {
    reportError("\u5237\u65b0\u9875\u9762\u6570\u636e\u5931\u8d25", error);
  }
});

els.attachButton.addEventListener("click", () => {
  showToast("\u7d20\u6750\u4e0a\u4f20\u8fd8\u6ca1\u63a5\u5165\u524d\u7aef\u8868\u5355\u3002\u5f53\u524d\u8bf7\u5148\u628a\u6587\u4ef6\u653e\u5230 assets \u6216 data/source_videos\uff0c\u518d\u5728\u4efb\u52a1\u91cc\u5f15\u7528\u3002", "info");
  els.composerInput.focus();
});

els.openAccountModalButton.addEventListener("click", openAccountModal);
els.closeAccountModalButton.addEventListener("click", closeAccountModal);
els.cancelAccountButton.addEventListener("click", closeAccountModal);

els.accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createAccount(new FormData(els.accountForm));
  } catch (error) {
    reportError("\u521b\u5efa\u8d26\u53f7\u5931\u8d25", error);
  }
});

els.accountModal.addEventListener("click", (event) => {
  if (event.target === els.accountModal) {
    closeAccountModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!els.accountModal.hidden) {
    closeAccountModal();
    return;
  }
  if (state.sessionDrawerOpen) {
    state.sessionDrawerOpen = false;
    els.sessionDrawer.hidden = true;
    els.toggleSessionDrawerButton.classList.remove("is-open");
  }
});

loadBootstrap().catch((error) => {
  console.error(error);
  const message = `\u521d\u59cb\u5316\u5931\u8d25\uff1a${normalizeErrorText(error?.message || error)}`;
  setBanner(message, "error");
  showToast(message, "error");
  els.threadList.innerHTML = `
    <article class="message assistant">
      <div class="meta">System</div>
      <div class="bubble">\u524d\u7aef\u521d\u59cb\u5316\u5931\u8d25\u3002\u8bf7\u5148\u68c0\u67e5\u672c\u5730\u670d\u52a1\uff0c\u518d\u5237\u65b0\u9875\u9762\u91cd\u8bd5\u3002</div>
    </article>
  `;
});
