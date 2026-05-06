const els = {
  workspacePath: document.querySelector("#workspacePath"),
  connectionStatus: document.querySelector("#connectionStatus"),
  topSessionChip: document.querySelector("#topSessionChip"),
  topModelChip: document.querySelector("#topModelChip"),
  topStatusChip: document.querySelector("#topStatusChip"),
  topOutputChip: document.querySelector("#topOutputChip"),
  openTaskModalButton: document.querySelector("#openTaskModalButton"),
  quickCreateTaskButton: document.querySelector("#quickCreateTaskButton"),
  quickBatchButton: document.querySelector("#quickBatchButton"),
  quickDocsButton: document.querySelector("#quickDocsButton"),
  newSessionButton: document.querySelector("#newSessionButton"),
  refreshButton: document.querySelector("#refreshButton"),
  settingsButton: document.querySelector("#settingsButton"),

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
  createAndSendButton: document.querySelector("#createAndSendButton"),
  attachButton: document.querySelector("#attachButton"),

  activeJobTitle: document.querySelector("#activeJobTitle"),
  taskHeaderTitle: document.querySelector("#taskHeaderTitle"),
  taskHeaderSummary: document.querySelector("#taskHeaderSummary"),
  accountSelect: document.querySelector("#accountSelect"),
  openAccountModalButton: document.querySelector("#openAccountModalButton"),
  templateSelect: document.querySelector("#templateSelect"),
  templateLockToggle: document.querySelector("#templateLockToggle"),
  generationModeInlineInput: document.querySelector("#generationModeInlineInput"),
  subtitleFontSizeInlineInput: document.querySelector("#subtitleFontSizeInlineInput"),
  subtitleColorInlineInput: document.querySelector("#subtitleColorInlineInput"),
  compositionLabel: document.querySelector("#compositionLabel"),
  headerMetaChips: document.querySelector("#headerMetaChips"),
  productionStatusGrid: document.querySelector("#productionStatusGrid"),
  pipelineBanner: document.querySelector("#pipelineBanner"),
  pipelineGuide: document.querySelector("#pipelineGuide"),
  statsGrid: document.querySelector("#statsGrid"),
  campaignSelect: document.querySelector("#campaignSelect"),
  campaignNameInput: document.querySelector("#campaignNameInput"),
  createCampaignButton: document.querySelector("#createCampaignButton"),
  activitySelect: document.querySelector("#activitySelect"),
  activityNameInput: document.querySelector("#activityNameInput"),
  createActivityButton: document.querySelector("#createActivityButton"),
  topicPoolInput: document.querySelector("#topicPoolInput"),
  createTopicButton: document.querySelector("#createTopicButton"),
  topicPoolList: document.querySelector("#topicPoolList"),
  batchTopicInput: document.querySelector("#batchTopicInput"),
  batchAccountGrid: document.querySelector("#batchAccountGrid"),
  createBatchButton: document.querySelector("#createBatchButton"),
  batchStatusFilter: document.querySelector("#batchStatusFilter"),
  batchSearchInput: document.querySelector("#batchSearchInput"),
  refreshBatchesButton: document.querySelector("#refreshBatchesButton"),
  retryQueueList: document.querySelector("#retryQueueList"),
  batchList: document.querySelector("#batchList"),
  auditEventList: document.querySelector("#auditEventList"),
  replicationVideoInput: document.querySelector("#replicationVideoInput"),
  replicationReferenceTitleInput: document.querySelector("#replicationReferenceTitleInput"),
  replicationReferencePlatformInput: document.querySelector("#replicationReferencePlatformInput"),
  replicationReferenceDescriptionInput: document.querySelector("#replicationReferenceDescriptionInput"),
  replicationTopicInput: document.querySelector("#replicationTopicInput"),
  replicationAnalysisInput: document.querySelector("#replicationAnalysisInput"),
  replicationSummaryInput: document.querySelector("#replicationSummaryInput"),
  replicationAccountInput: document.querySelector("#replicationAccountInput"),
  replicationTemplateInput: document.querySelector("#replicationTemplateInput"),
  replicationStrengthInput: document.querySelector("#replicationStrengthInput"),
  replicationCopyVariantInput: document.querySelector("#replicationCopyVariantInput"),
  replicationProviderInput: document.querySelector("#replicationProviderInput"),
  uploadReplicationVideoButton: document.querySelector("#uploadReplicationVideoButton"),
  analyzeReplicationVideoButton: document.querySelector("#analyzeReplicationVideoButton"),
  createReplicationJobButton: document.querySelector("#createReplicationJobButton"),
  runReplicationPipelineButton: document.querySelector("#runReplicationPipelineButton"),
  runReplicationDeliveryButton: document.querySelector("#runReplicationDeliveryButton"),
  selectLatestReplicationButton: document.querySelector("#selectLatestReplicationButton"),
  replicationStatusPanel: document.querySelector("#replicationStatusPanel"),

  accountProfileTitle: document.querySelector("#accountProfileTitle"),
  accountPlatformBadge: document.querySelector("#accountPlatformBadge"),
  editAccountButton: document.querySelector("#editAccountButton"),
  archiveAccountButton: document.querySelector("#archiveAccountButton"),
  deleteAccountButton: document.querySelector("#deleteAccountButton"),
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
  templateVersionLabel: document.querySelector("#templateVersionLabel"),
  templatePublishLabel: document.querySelector("#templatePublishLabel"),
  templateOwnerLabel: document.querySelector("#templateOwnerLabel"),
  templateUpdatedLabel: document.querySelector("#templateUpdatedLabel"),
  templateDescriptionText: document.querySelector("#templateDescriptionText"),
  templatePathLabel: document.querySelector("#templatePathLabel"),
  assetWorkbench: document.querySelector("#assetWorkbench"),
  resourceGrid: document.querySelector("#resourceGrid"),
  jobHistoryList: document.querySelector("#jobHistoryList"),
  historySearchInput: document.querySelector("#historySearchInput"),
  recoverJobButton: document.querySelector("#recoverJobButton"),
  archiveJobButton: document.querySelector("#archiveJobButton"),
  logStream: document.querySelector("#logStream"),
  actionHints: document.querySelector("#actionHints"),
  generatePlanButton: document.querySelector("#generatePlanButton"),
  ttsButton: document.querySelector("#ttsButton"),
  renderButton: document.querySelector("#renderButton"),
  runAllButton: document.querySelector("#runAllButton"),

  previewStatus: document.querySelector("#previewStatus"),
  previewImage: document.querySelector("#previewImage"),
  previewVideo: document.querySelector("#previewVideo"),
  episodeLabel: document.querySelector("#episodeLabel"),
  previewHeadline: document.querySelector("#previewHeadline"),
  previewSummary: document.querySelector("#previewSummary"),
  subtitleBand: document.querySelector("#subtitleBand"),
  previewProgress: document.querySelector("#previewProgress"),
  playPreviewButton: document.querySelector("#playPreviewButton"),
  openOutputButton: document.querySelector("#openOutputButton"),
  exportButton: document.querySelector("#exportButton"),
  reviewSubtitleText: document.querySelector("#reviewSubtitleText"),
  reviewShotText: document.querySelector("#reviewShotText"),
  reviewSummaryText: document.querySelector("#reviewSummaryText"),
  reviewOutputText: document.querySelector("#reviewOutputText"),
  artifactList: document.querySelector("#artifactList"),
  debugAssetsPanel: document.querySelector("#debugAssetsPanel"),
  debugAssetsStatus: document.querySelector("#debugAssetsStatus"),
  debugDiagnosisGrid: document.querySelector("#debugDiagnosisGrid"),
  debugAssetCount: document.querySelector("#debugAssetCount"),
  debugAssetGrid: document.querySelector("#debugAssetGrid"),
  debugArtifactCount: document.querySelector("#debugArtifactCount"),
  debugArtifactList: document.querySelector("#debugArtifactList"),

  accountModal: document.querySelector("#accountModal"),
  taskCreateModal: document.querySelector("#taskCreateModal"),
  taskCreateForm: document.querySelector("#taskCreateForm"),
  closeTaskCreateModalButton: document.querySelector("#closeTaskCreateModalButton"),
  cancelTaskCreateButton: document.querySelector("#cancelTaskCreateButton"),
  submitTaskCreateButton: document.querySelector("#submitTaskCreateButton"),
  taskCreateModeInput: document.querySelector("#taskCreateModeInput"),
  taskCreateTemplateInput: document.querySelector("#taskCreateTemplateInput"),
  taskCreatePromptInput: document.querySelector("#taskCreatePromptInput"),
  taskCreateSessionField: document.querySelector("#taskCreateSessionField"),
  taskCreateSessionInput: document.querySelector("#taskCreateSessionInput"),
  taskCreateAfterInput: document.querySelector("#taskCreateAfterInput"),
  taskCreateGenerationModeInput: document.querySelector("#taskCreateGenerationModeInput"),
  taskCreateSubtitleFontSizeInput: document.querySelector("#taskCreateSubtitleFontSizeInput"),
  taskCreateSubtitleColorInput: document.querySelector("#taskCreateSubtitleColorInput"),
  taskCreateAiImageAssetsInput: document.querySelector("#taskCreateAiImageAssetsInput"),
  taskCreateAccountGrid: document.querySelector("#taskCreateAccountGrid"),
  taskCreateAccountHint: document.querySelector("#taskCreateAccountHint"),
  scriptAiModal: document.querySelector("#scriptAiModal"),
  scriptAiForm: document.querySelector("#scriptAiForm"),
  scriptAiInstructionInput: document.querySelector("#scriptAiInstructionInput"),
  closeScriptAiModalButton: document.querySelector("#closeScriptAiModalButton"),
  cancelScriptAiButton: document.querySelector("#cancelScriptAiButton"),
  submitScriptAiButton: document.querySelector("#submitScriptAiButton"),
  renderConfirmModal: document.querySelector("#renderConfirmModal"),
  renderConfirmSummary: document.querySelector("#renderConfirmSummary"),
  renderConfirmGrid: document.querySelector("#renderConfirmGrid"),
  closeRenderConfirmButton: document.querySelector("#closeRenderConfirmButton"),
  cancelRenderConfirmButton: document.querySelector("#cancelRenderConfirmButton"),
  confirmRenderButton: document.querySelector("#confirmRenderButton"),
  settingsModal: document.querySelector("#settingsModal"),
  closeSettingsModalButton: document.querySelector("#closeSettingsModalButton"),
  cancelSettingsButton: document.querySelector("#cancelSettingsButton"),
  saveSettingsButton: document.querySelector("#saveSettingsButton"),
  showSessionControlsInput: document.querySelector("#showSessionControlsInput"),
  generationModeInput: document.querySelector("#generationModeInput"),
  codexModelInput: document.querySelector("#codexModelInput"),
  codexModelHint: document.querySelector("#codexModelHint"),
  useAiImageAssetsInput: document.querySelector("#useAiImageAssetsInput"),
  subtitleFontSizeInput: document.querySelector("#subtitleFontSizeInput"),
  subtitleColorInput: document.querySelector("#subtitleColorInput"),
  enforceQaBeforeExportInput: document.querySelector("#enforceQaBeforeExportInput"),
  showDebugAssetsInput: document.querySelector("#showDebugAssetsInput"),
  batchDetailDrawer: document.querySelector("#batchDetailDrawer"),
  batchDrawerTitle: document.querySelector("#batchDrawerTitle"),
  batchDrawerMeta: document.querySelector("#batchDrawerMeta"),
  batchDrawerJobs: document.querySelector("#batchDrawerJobs"),
  batchDrawerArtifacts: document.querySelector("#batchDrawerArtifacts"),
  closeBatchDrawerButton: document.querySelector("#closeBatchDrawerButton"),
  pauseBatchButton: document.querySelector("#pauseBatchButton"),
  resumeBatchButton: document.querySelector("#resumeBatchButton"),
  cancelBatchButton: document.querySelector("#cancelBatchButton"),
  forceCancelBatchButton: document.querySelector("#forceCancelBatchButton"),
  downloadBatchButton: document.querySelector("#downloadBatchButton"),
  accountModalEyebrow: document.querySelector("#accountModalEyebrow"),
  accountModalTitle: document.querySelector("#accountModalTitle"),
  closeAccountModalButton: document.querySelector("#closeAccountModalButton"),
  cancelAccountButton: document.querySelector("#cancelAccountButton"),
  accountSubmitButton: document.querySelector("#accountSubmitButton"),
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

const SETTINGS_STORAGE_KEY = "codexVideoConsoleSettings";
const DEFAULT_SETTINGS = {
  showSessionControls: false,
  generationMode: "review",
  useAiImageAssets: false,
  imageAssetModel: "gpt-image-2-all",
  subtitleFontSize: 28,
  subtitleColor: "#ffffff",
  enforceQaBeforeExport: true,
  showDebugAssets: false,
};
const SUBTITLE_COLOR_CHOICES = ["#ffffff", "#ffd166", "#fca5a5", "#67e8f9", "#a78bfa", "#86efac"];
const CODEX_MODEL_CHOICES = ["gpt-5.4", "gpt-5.4-mini", "gpt-5.2"];

const state = {
  project: null,
  codexStatus: null,
  codexConfig: {model: ""},
  accounts: [],
  presets: [],
  templates: [],
  assets: [],
  jobs: [],
  stats: null,
  campaigns: [],
  activities: [],
  topics: [],
  batches: [],
  retryQueue: [],
  auditEvents: [],
  selectedCampaignId: "",
  selectedActivityId: "",
  selectedTopicId: "",
  selectedTopicIds: [],
  batchAccountIds: [],
  batchFilterStatus: "all",
  batchFilterQuery: "",
  batchSearchTimer: 0,
  batchPollTimer: 0,
  batchPollInFlight: false,
  selectedBatchId: "",
  batchDetail: null,
  batchDetailLoading: false,
  batchArtifactAccountIds: [],
  batchArtifactRetryOnly: false,
  taskCreateAccountIds: [],
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
  accountModalMode: "create",
  editingAccountId: "",
  busyReason: "",
  toastTimer: 0,
  historyFilter: "all",
  historyQuery: "",
  renderConfirmResolver: null,
  screenQaReports: {},
  replicationUpload: null,
  settings: {...DEFAULT_SETTINGS},
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseBatchTopicsInput(value) {
  const seen = new Set();
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function syncBatchTopicInputFromSelection() {
  if (!els.batchTopicInput) return;
  const selected = state.selectedTopicIds
    .map((topicId) => state.topics.find((topic) => topic.id === topicId))
    .filter(Boolean);
  els.batchTopicInput.value = selected.map((topic) => topic.title || "").filter(Boolean).join("\n");
}

function getBatchTopicPayloadFromInput() {
  const topicsByTitle = new Map(
    (Array.isArray(state.topics) ? state.topics : []).map((topic) => [String(topic.title || "").trim().toLowerCase(), topic]),
  );
  return parseBatchTopicsInput(els.batchTopicInput?.value).map((title) => {
    const matched = topicsByTitle.get(title.toLowerCase());
    return {
      title,
      topicId: matched?.id || "",
      brief: matched?.brief || "",
    };
  });
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

function getScreenQaReportKey(job, item) {
  return item?.url || `${job?.id || "no-job"}:screen-qa`;
}

async function loadScreenQaReport(job, item) {
  if (!job?.id || !item?.exists || !item.url) return null;
  const key = getScreenQaReportKey(job, item);
  const cached = state.screenQaReports[key];
  if (cached?.loading || cached?.report || cached?.error) return cached?.report || null;

  state.screenQaReports[key] = {loading: true, report: null, error: ""};
  try {
    const response = await fetch(item.url, {cache: "no-store"});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const report = await response.json();
    state.screenQaReports[key] = {loading: false, report, error: ""};
  } catch (error) {
    state.screenQaReports[key] = {loading: false, report: null, error: error?.message || "\u8bfb\u53d6 QA \u62a5\u544a\u5931\u8d25"};
  }

  if (state.activeJob?.id === job.id) {
    renderArtifactList(state.activeJob);
    renderProductionStatus(state.activeJob);
    setActionState();
    renderActionHints(state.activeJob);
  }
  return state.screenQaReports[key]?.report || null;
}

function indexSteps(steps = []) {
  const aliases = ["intake", "generate-plan", "script", "tts", "bind-composition", "render"];
  return (Array.isArray(steps) ? steps : []).reduce((acc, step, index) => {
    const key = step?.id || step?.key || aliases[index] || `step-${index}`;
    acc[key] = step;
    return acc;
  }, {});
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDurationMs(value) {
  const ms = Math.max(0, Number(value || 0));
  if (!ms) return "-";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return `${hours}h ${restMinutes}m`;
  }
  return minutes ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}

function localizePublishStatus(status = "") {
  const value = String(status || "").toLowerCase();
  if (value === "published") return "\u5df2\u53d1\u5e03";
  if (value === "draft") return "\u8349\u7a3f";
  if (value === "review") return "\u5f85\u5ba1\u6838";
  if (value === "archived") return "\u5df2\u5f52\u6863";
  return value || "-";
}

function getVisibleJobs() {
  const jobs = Array.isArray(state.jobs) ? state.jobs : [];
  const query = String(state.historyQuery || "").trim().toLowerCase();
  return jobs.filter((job) => {
    const account = getAccountById(job.accountId);
    const template = getTemplateById(job.templateId);
    const hasVideo = hasHistoryVideo(job);
    const qaStatus = getHistoryQaStatus(job);
    const isRunning = Boolean(job.pipelineRunning || job.codexRunning || !["completed", "failed", "canceled", "idle", "unknown"].includes(job.status));
    const filterMatched =
      state.historyFilter === "all" ||
      (state.historyFilter === "success" && job.status === "completed") ||
      (state.historyFilter === "completed" && job.status === "completed") ||
      (state.historyFilter === "failed" && job.status === "failed") ||
      (state.historyFilter === "running" && isRunning) ||
      (state.historyFilter === "active" && isRunning) ||
      (state.historyFilter === "has-video" && hasVideo) ||
      (state.historyFilter === "qa-failed" && qaStatus === "failed") ||
      (state.historyFilter === "archived" && job.archived);
    if (!filterMatched) return false;
    if (!query) return true;
    return [job.title, job.id, job.codexSessionId, job.outputDir, account?.name, account?.platform, template?.title, template?.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
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

async function setPosterAsDefault(jobId) {
  return requestJson(`/api/jobs/${encodeURIComponent(jobId)}/artifacts/poster/default`, {
    method: "POST",
  });
}

async function refreshPoster(jobId) {
  return requestJson(`/api/jobs/${encodeURIComponent(jobId)}/artifacts/poster/refresh`, {
    method: "POST",
  });
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

function normalizeSubtitleFontSize(value, fallback = 28) {
  const number = Number(value || fallback);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(52, Math.max(20, Math.round(number)));
}

function normalizeSubtitleColor(value, fallback = "#ffffff") {
  const color = String(value || fallback).trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : fallback;
}

function loadSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    state.settings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      showSessionControls:
        typeof saved.showSessionControls === "boolean" ? saved.showSessionControls : DEFAULT_SETTINGS.showSessionControls,
      generationMode: saved.generationMode === "auto" ? "auto" : "review",
      useAiImageAssets:
        typeof saved.useAiImageAssets === "boolean" ? saved.useAiImageAssets : DEFAULT_SETTINGS.useAiImageAssets,
      imageAssetModel: String(saved.imageAssetModel || DEFAULT_SETTINGS.imageAssetModel || "gpt-image-2-all"),
      subtitleFontSize: normalizeSubtitleFontSize(saved.subtitleFontSize || DEFAULT_SETTINGS.subtitleFontSize),
      subtitleColor: normalizeSubtitleColor(saved.subtitleColor || DEFAULT_SETTINGS.subtitleColor),
      enforceQaBeforeExport: saved.enforceQaBeforeExport !== false,
      showDebugAssets:
        typeof saved.showDebugAssets === "boolean" ? saved.showDebugAssets : DEFAULT_SETTINGS.showDebugAssets,
    };
  } catch {
    state.settings = {...DEFAULT_SETTINGS};
  }
}

function saveSettings() {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
}

function renderCodexModelInput() {
  if (!els.codexModelInput) return;
  const currentModel = String(state.codexConfig?.model || "").trim();
  const models = [...new Set([...CODEX_MODEL_CHOICES, currentModel].filter(Boolean))];
  els.codexModelInput.innerHTML = models
    .map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`)
    .join("");
  els.codexModelInput.value = currentModel || models[0] || "";
  if (els.codexModelHint) {
    els.codexModelHint.textContent = currentModel
      ? `当前模型：${currentModel}。修改后会影响后续所有 Codex 调用。`
      : "修改后会影响后续所有 Codex 调用。";
  }
}

function applySettingsToUi() {
  document.body.classList.toggle("is-session-hidden", !state.settings.showSessionControls);
  if (els.generationModeInlineInput) {
    els.generationModeInlineInput.value = state.settings.generationMode || "review";
  }
  if (els.subtitleFontSizeInlineInput) {
    els.subtitleFontSizeInlineInput.value = String(normalizeSubtitleFontSize(state.settings.subtitleFontSize));
  }
  if (els.subtitleColorInlineInput) {
    els.subtitleColorInlineInput.value = normalizeSubtitleColor(state.settings.subtitleColor);
  }
  if (els.taskCreateGenerationModeInput) {
    els.taskCreateGenerationModeInput.value = state.settings.generationMode || "review";
  }
  if (els.taskCreateSubtitleFontSizeInput) {
    els.taskCreateSubtitleFontSizeInput.value = String(normalizeSubtitleFontSize(state.settings.subtitleFontSize));
  }
  if (els.taskCreateSubtitleColorInput) {
    els.taskCreateSubtitleColorInput.value = normalizeSubtitleColor(state.settings.subtitleColor);
  }
  if (els.taskCreateAiImageAssetsInput) {
    els.taskCreateAiImageAssetsInput.checked = Boolean(state.settings.useAiImageAssets);
  }
  if (els.debugAssetsPanel) {
    els.debugAssetsPanel.hidden = !state.settings.showDebugAssets;
  }
  if (els.debugAssetsStatus) {
    els.debugAssetsStatus.textContent = state.settings.showDebugAssets ? "显示中" : "隐藏";
  }
}

function updateGenerationMode(mode, options = {}) {
  const nextMode = mode === "auto" ? "auto" : "review";
  state.settings = {
    ...state.settings,
    generationMode: nextMode,
  };
  if (options.persist !== false) {
    saveSettings();
  }
  applySettingsToUi();
  if (options.toast) {
    showToast(nextMode === "auto" ? "已切换为自动直出" : "已切换为脚本审阅后继续", "success");
  }
}

function renderSettingsModal() {
  renderCodexModelInput();
  if (els.showSessionControlsInput) {
    els.showSessionControlsInput.checked = Boolean(state.settings.showSessionControls);
  }
  if (els.generationModeInput) {
    els.generationModeInput.value = state.settings.generationMode || "review";
  }
  if (els.subtitleColorInput) {
    els.subtitleColorInput.value = normalizeSubtitleColor(state.settings.subtitleColor);
  }
  if (els.enforceQaBeforeExportInput) {
    els.enforceQaBeforeExportInput.checked = state.settings.enforceQaBeforeExport !== false;
  }
  if (els.useAiImageAssetsInput) {
    els.useAiImageAssetsInput.checked = Boolean(state.settings.useAiImageAssets);
  }
  if (els.subtitleFontSizeInput) {
    els.subtitleFontSizeInput.value = String(normalizeSubtitleFontSize(state.settings.subtitleFontSize));
  }
  if (els.subtitleColorInput) {
    els.subtitleColorInput.value = normalizeSubtitleColor(state.settings.subtitleColor);
  }
  if (els.showDebugAssetsInput) {
    els.showDebugAssetsInput.checked = Boolean(state.settings.showDebugAssets);
  }
}

function openSettingsModal() {
  renderSettingsModal();
  if (els.settingsModal) els.settingsModal.hidden = false;
}

function closeSettingsModal() {
  if (els.settingsModal) els.settingsModal.hidden = true;
}

function persistSettingsFromModal() {
  state.settings = {
    showSessionControls: Boolean(els.showSessionControlsInput?.checked),
    generationMode: els.generationModeInput?.value === "auto" ? "auto" : "review",
    useAiImageAssets: Boolean(els.useAiImageAssetsInput?.checked),
    imageAssetModel: state.settings.imageAssetModel || "gpt-image-2-all",
    subtitleFontSize: normalizeSubtitleFontSize(els.subtitleFontSizeInput?.value || state.settings.subtitleFontSize),
    subtitleColor: normalizeSubtitleColor(els.subtitleColorInput?.value || state.settings.subtitleColor),
    enforceQaBeforeExport: els.enforceQaBeforeExportInput?.checked !== false,
    showDebugAssets: Boolean(els.showDebugAssetsInput?.checked),
  };
  saveSettings();
  applySettingsToUi();
  renderDebugAssetsPanel(state.activeJob);
  closeSettingsModal();
  showToast("设置已保存", "success");
}

async function persistSettingsAndModelFromModal() {
  state.settings = {
    showSessionControls: Boolean(els.showSessionControlsInput?.checked),
    generationMode: els.generationModeInput?.value === "auto" ? "auto" : "review",
    useAiImageAssets: Boolean(els.useAiImageAssetsInput?.checked),
    imageAssetModel: state.settings.imageAssetModel || "gpt-image-2-all",
    subtitleFontSize: normalizeSubtitleFontSize(els.subtitleFontSizeInput?.value || state.settings.subtitleFontSize),
    subtitleColor: normalizeSubtitleColor(els.subtitleColorInput?.value || state.settings.subtitleColor),
    enforceQaBeforeExport: els.enforceQaBeforeExportInput?.checked !== false,
    showDebugAssets: Boolean(els.showDebugAssetsInput?.checked),
  };
  saveSettings();
  applySettingsToUi();
  renderDebugAssetsPanel(state.activeJob);
  const nextModel = String(els.codexModelInput?.value || "").trim();
  if (nextModel && nextModel !== state.codexConfig?.model) {
    const payload = await requestJson("/api/codex/config", {
      method: "PATCH",
      body: JSON.stringify({model: nextModel}),
    });
    state.codexConfig = {
      ...payload,
      model: payload.model || nextModel,
    };
  }
  renderProject();
  closeSettingsModal();
  showToast("设置已保存", "success");
}

function normalizeErrorText(message = "") {
  const text = String(message || "").trim();
  if (!text) return "\u53d1\u751f\u672a\u77e5\u9519\u8bef\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002";
  if (text.includes("Account not found")) return "\u8d26\u53f7\u4e0d\u5b58\u5728\u6216\u5df2\u88ab\u5220\u9664\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002";
  if (text.includes("Campaign name is required")) return "\u8bf7\u5148\u586b\u5199\u9879\u76ee\u540d\u79f0\u3002";
  if (text.includes("Campaign not found")) return "\u9879\u76ee\u4e0d\u5b58\u5728\u6216\u5df2\u88ab\u5220\u9664\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002";
  if (text.includes("Activity name is required")) return "\u8bf7\u5148\u586b\u5199\u6d3b\u52a8\u540d\u79f0\u3002";
  if (text.includes("Activity not found")) return "\u6d3b\u52a8\u4e0d\u5b58\u5728\u6216\u5df2\u88ab\u5220\u9664\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002";
  if (text.includes("Topic title is required")) return "\u8bf7\u5148\u586b\u5199\u9009\u9898\u3002";
  if (text.includes("Task prompt is required")) return "\u8bf7\u5148\u586b\u5199\u89c6\u9891\u9700\u6c42\u6216\u9009\u9898\u3002";
  if (text.includes("Task account is required")) return "请先选择一个账号，再创建视频任务。";
  if (text.includes("Task template is required")) return "请先选择一个模板，再创建视频任务。";
  if (text.includes("Create task explicitly first")) return "请先点击“新建视频任务”或“创建并发送”。输入第一条消息不会自动创建任务。";
  if (text.includes("Active job is required for script revision")) return "请先选择或创建一个当前任务，再让 AI 修改脚本。";
  if (text.includes("Job is running and cannot be deleted")) return "当前任务正在运行，不能删除。请等待完成或先取消任务。";
  if (text.includes("Refusing to delete outside data/jobs")) return "删除已被阻止：目标目录不在 data/jobs 下。";
  if (text.includes("Refusing to delete jobs root")) return "删除已被阻止：不能删除整个 data/jobs 目录。";
  if (text.includes("Job directory not found")) return "任务目录不存在，已无法删除本地产物。";
  if (text.includes("Batch topic is required")) return "\u8bf7\u5148\u586b\u5199\u540c\u9898\u6279\u91cf\u9009\u9898\u3002";
  if (text.includes("Batch requires at least one active account")) return "\u81f3\u5c11\u9700\u8981\u9009\u62e9\u4e00\u4e2a\u672a\u5f52\u6863\u8d26\u53f7\u3002";
  if (text.includes("Batch is already running")) return "\u8be5\u6279\u91cf\u4efb\u52a1\u6b63\u5728\u8fd0\u884c\uff0c\u8bf7\u7b49\u5f85\u5f53\u524d\u961f\u5217\u5b8c\u6210\u3002";
  if (text.includes("Batch is not running")) return "当前批量队列没有在运行。";
  if (text.includes("No rendered videos to download")) return "当前筛选范围内没有可下载的渲染视频。";
  if (text.includes("force canceled by queue request")) return "队列已强制取消当前 job。";
  if (text.includes("No failed jobs to retry")) return "\u5f53\u524d\u6ca1\u6709\u9700\u8981\u91cd\u8bd5\u7684\u5931\u8d25\u4efb\u52a1\u3002";
  if (text.includes("No runnable jobs in this batch")) return "\u8be5\u6279\u91cf\u4efb\u52a1\u6ca1\u6709\u9700\u8981\u6267\u884c\u7684\u8ba1\u5212\u4efb\u52a1\u3002";
  if (text.includes("session not found")) return "\u672c\u5730 session \u4e0d\u5b58\u5728\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002";
  if (text.includes("job not found")) return "\u5f53\u524d\u4efb\u52a1\u5df2\u4e0d\u53ef\u7528\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002";
  if (text.includes("message is required")) return "\u6d88\u606f\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a\u3002";
  if (text.includes("prompt or sessionId is required")) return "\u8bf7\u5148\u8f93\u5165\u6d88\u606f\uff0c\u6216\u9009\u62e9\u4e00\u4e2a\u672c\u5730 session\u3002";
  if (text.includes("Body too large")) return "\u8f93\u5165\u5185\u5bb9\u8fc7\u957f\uff0c\u8bf7\u7cbe\u7b80\u540e\u91cd\u8bd5\u3002";
  if (text.includes("Request timeout")) return "\u672c\u5730\u670d\u52a1\u8d85\u65f6\uff0c\u8bf7\u91cd\u8bd5\u3002";
  if (text.includes("Codex is already running for this job")) return "\u4e0a\u4e00\u6761 Codex \u8bf7\u6c42\u8fd8\u5728\u6267\u884c\uff0c\u8bf7\u7a0d\u5019\u3002";
  if (text.includes("A pipeline action is already running")) return "\u5f53\u524d\u4efb\u52a1\u5df2\u6709\u751f\u4ea7\u6b65\u9aa4\u5728\u6267\u884c\uff0c\u8bf7\u7b49\u5f85\u5b8c\u6210\u540e\u518d\u64cd\u4f5c\u3002";
  if (text.includes("Unsupported action")) return "\u8be5\u64cd\u4f5c\u6682\u4e0d\u652f\u6301\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u540e\u91cd\u8bd5\u3002";
  if (text.includes("Job canceled") || text.includes("job canceled")) return "\u4efb\u52a1\u5df2\u53d6\u6d88\u3002";
  if (text.includes("Poster frame does not exist yet")) return "\u5f53\u524d\u8fd8\u6ca1\u6709\u53ef\u7528\u7684\u5c01\u9762\u5e27\u3002";
  if (text.includes("Rendered video does not exist yet")) return "\u5f53\u524d\u8fd8\u6ca1\u6709\u53ef\u7528\u7684\u6e32\u67d3\u89c6\u9891\uff0c\u65e0\u6cd5\u91cd\u65b0\u6293\u5e27\u3002";
  if (text.includes("Render content contains prompt leakage")) return "\u6e32\u67d3\u5df2\u963b\u6b62\uff1a\u68c0\u6d4b\u5230\u7528\u6237\u63d0\u793a\u8bcd\u8fdb\u5165\u753b\u9762\u6587\u6848\u3002\u8bf7\u5148\u70b9\u201cAI \u6539\u811a\u672c\u201d\uff0c\u518d\u7ee7\u7eed\u914d\u97f3\u6216\u6e32\u67d3\u3002";
  if (text.includes("Screen visual QA failed")) return "\u6e32\u67d3\u5df2\u963b\u6b62\uff1a\u753b\u9762\u622a\u56fe QA \u68c0\u6d4b\u5230\u63d0\u793a\u8bcd\u6216\u5185\u90e8\u5143\u6570\u636e\u6cc4\u6f0f\uff0c\u8bf7\u5148\u70b9\u201cAI \u6539\u811a\u672c\u201d\u6216\u201c\u4ece\u5934\u91cd\u8dd1\u201d\u3002";
  if (text.includes("Asset slot not found")) return "素材槽位不存在，请刷新素材清单后重试。";
  if (text.includes("Asset slot is locked")) return "该素材槽位已锁定，请先解锁再替换。";
  if (text.includes("Asset source must be inside assets/images")) return "素材来源不安全：只能绑定 assets/images 目录里的本地素材。";
  if (text.includes("Asset source file not found")) return "素材文件不存在，请检查 assets/images 目录。";
  if (text.includes("Required assets are missing")) return "渲染已阻止：必需素材还没有绑定，请先在“素材”页补齐。";
  if (text.startsWith("Codex request timed out")) {
    const detail = text.split(":").slice(1).join(":").trim();
    return detail ? `Codex \u8bf7\u6c42\u8d85\u65f6\uff1a${detail}` : "Codex \u8bf7\u6c42\u8d85\u65f6\uff0c\u8bf7\u68c0\u67e5\u672c\u5730 Codex CLI \u72b6\u6001\u3002";
  }
  if (text.startsWith("Codex session bootstrap timed out")) {
    const detail = text.split(":").slice(1).join(":").trim();
    return detail ? `\u521b\u5efa\u672c\u5730 Codex session \u8d85\u65f6\uff1a${detail}` : "\u521b\u5efa\u672c\u5730 Codex session \u8d85\u65f6\u3002";
  }
  if (text.includes("spawn EPERM")) return "\u672c\u5730 Codex \u8fdb\u7a0b\u88ab\u7cfb\u7edf\u62d2\u7edd\u542f\u52a8\uff0c\u8bf7\u68c0\u67e5 Codex CLI \u6743\u9650\u3002";
  if (text.includes("spawn codex ENOENT") || text.includes("spawn ENOENT")) return "\u672c\u5730\u627e\u4e0d\u5230 Codex CLI\uff0c\u8bf7\u786e\u8ba4\u5df2\u5b89\u88c5\u5e76\u53ef\u4ece\u5f53\u524d\u8fdb\u7a0b\u8bbf\u95ee\u3002";
  if (text.includes("os error 5")) return "\u672c\u5730 Codex \u8fdb\u7a0b\u88ab\u62d2\u7edd\u8bbf\u95ee\uff0c\u8bf7\u68c0\u67e5\u6267\u884c\u6743\u9650\u3002";
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

function isCodexRuntimeReady() {
  return state.codexStatus?.ok !== false;
}

function getCodexRuntimeMessage() {
  const status = state.codexStatus;
  if (!status || status.ok !== false) return "";
  if (status.code === "EPERM" || String(status.error || "").includes("EPERM")) {
    return "本地服务当前没有权限启动 Codex CLI。请用普通终端在仓库目录启动前端服务，或检查 Codex CLI 执行权限。";
  }
  if (status.code === "ENOENT" || String(status.error || "").includes("ENOENT")) {
    return "本地服务找不到 Codex CLI。请确认 Codex 已安装，并且当前服务进程可以访问 codex 命令。";
  }
  return status.error || "Codex CLI 当前不可用。";
}

function cloneJob(job) {
  return job ? JSON.parse(JSON.stringify(job)) : null;
}

function setBusy(isBusy, reason = "") {
  state.busyReason = isBusy ? reason : "";
  [
    els.sessionSelect,
    els.newThreadButton,
    els.newSessionButton,
    els.toggleSessionDrawerButton,
    els.sessionRefreshButton,
    els.composerInput,
    els.composerSubmitButton,
    els.createAndSendButton,
    els.attachButton,
    els.openTaskModalButton,
    els.quickCreateTaskButton,
    els.quickBatchButton,
    els.quickDocsButton,
    els.refreshButton,
    els.accountSelect,
    els.openAccountModalButton,
    els.editAccountButton,
    els.archiveAccountButton,
    els.deleteAccountButton,
    els.accountSubmitButton,
    els.templateSelect,
    els.templateLockToggle,
    els.openInstructionInput,
    els.campaignSelect,
    els.campaignNameInput,
    els.createCampaignButton,
    els.activitySelect,
    els.activityNameInput,
    els.createActivityButton,
    els.topicPoolInput,
    els.createTopicButton,
    els.batchTopicInput,
    els.createBatchButton,
    els.batchStatusFilter,
    els.batchSearchInput,
    els.refreshBatchesButton,
    els.historySearchInput,
    els.recoverJobButton,
    els.archiveJobButton,
    els.generatePlanButton,
    els.ttsButton,
    els.renderButton,
    els.runAllButton,
    els.submitTaskCreateButton,
    els.taskCreateModeInput,
    els.taskCreateTemplateInput,
    els.taskCreatePromptInput,
    els.taskCreateSessionInput,
    els.taskCreateAfterInput,
    els.taskCreateGenerationModeInput,
    els.taskCreateSubtitleFontSizeInput,
    els.scriptAiInstructionInput,
    els.submitScriptAiButton,
    els.confirmRenderButton,
    els.pauseBatchButton,
    els.resumeBatchButton,
    els.cancelBatchButton,
    els.forceCancelBatchButton,
    els.downloadBatchButton,
    els.uploadReplicationVideoButton,
    els.analyzeReplicationVideoButton,
    els.createReplicationJobButton,
    els.runReplicationPipelineButton,
    els.runReplicationDeliveryButton,
    els.selectLatestReplicationButton,
  ].forEach((element) => {
    if (element) element.disabled = isBusy;
  });

  document
    .querySelectorAll(
      "[data-session-scope], [data-instruction-scope], [data-history-filter], [data-history-action], [data-batch-account-id], [data-task-account-id], [data-batch-action], [data-batch-detail], [data-batch-download], [data-failed-job-action], .preset-chip",
    )
    .forEach((element) => {
      element.disabled = isBusy;
    });

  setActionState();
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
    canceled: "已取消",
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

function listSelectableAccounts(activeAccountId = "") {
  const activeAccounts = state.accounts.filter((account) => !account.archived);
  const selectedArchived =
    activeAccountId && !activeAccounts.some((account) => account.id === activeAccountId)
      ? getAccountById(activeAccountId)
      : null;
  return selectedArchived ? [selectedArchived, ...activeAccounts] : activeAccounts;
}

function getTemplateById(templateId) {
  return state.templates.find((template) => template.id === templateId) || null;
}

function getPresetById(presetId) {
  return state.presets.find((preset) => preset.id === presetId) || null;
}

function normalizeConfig(config = {}) {
  const fallbackAccount = listSelectableAccounts(config.accountId)[0] || null;
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
    subtitleFontSize: normalizeSubtitleFontSize(config.subtitleFontSize || state.settings.subtitleFontSize),
    subtitleColor: normalizeSubtitleColor(config.subtitleColor || state.settings.subtitleColor),
    useAiImageAssets: Boolean(config.useAiImageAssets),
    imageAssetModel: String(config.imageAssetModel || state.settings.imageAssetModel || "gpt-image-2-all"),
  };
}

function buildDefaultDraftConfig() {
  const firstAccount = listSelectableAccounts()[0] || null;
  return normalizeConfig({
    accountId: firstAccount?.id || "",
    templateId: firstAccount?.defaultTemplateId || state.templates[0]?.id || "",
    compositionId: firstAccount?.defaultCompositionId || state.templates[0]?.compositionId || "",
    durationSec: firstAccount?.defaultDurationSec || 60,
    aspectRatio: firstAccount?.aspectRatio || "9:16",
    subtitleFontSize: normalizeSubtitleFontSize(state.settings.subtitleFontSize),
    subtitleColor: normalizeSubtitleColor(state.settings.subtitleColor),
    templateLocked: true,
    activePresetIds: [],
    instructionScope: "run",
    openInstruction: "",
    useAiImageAssets: Boolean(state.settings.useAiImageAssets),
    imageAssetModel: state.settings.imageAssetModel || "gpt-image-2-all",
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
      subtitleFontSize: state.activeJob.subtitleFontSize || state.settings.subtitleFontSize,
      subtitleColor: state.activeJob.subtitleColor || state.settings.subtitleColor,
      useAiImageAssets: Boolean(state.activeJob.useAiImageAssets),
      imageAssetModel: state.activeJob.imageAssetModel || state.settings.imageAssetModel || "gpt-image-2-all",
    });
  }
  ensureDraftConfig();
  return normalizeConfig(state.draftConfig);
}

function getDraftConfig() {
  ensureDraftConfig();
  return normalizeConfig(state.draftConfig);
}

function setDraftConfig(config) {
  state.draftConfig = normalizeConfig(config);
}

function artifactExists(job, key) {
  const item = getArtifactItem(job, key);
  return Boolean(item?.exists);
}

function isStepFinished(status = "") {
  return ["done", "completed", "success"].includes(String(status || "").toLowerCase());
}

function getJobReadiness(job = state.activeJob) {
  const stepMap = indexSteps(job?.steps || []);
  const stageIndex = Number(job?.stageIndex || 0);
  const hasPlan = Boolean(
    artifactExists(job, "plan") ||
      artifactExists(job, "planBrief") ||
      artifactExists(job, "voiceoverUnits") ||
      isStepFinished(stepMap["generate-plan"]?.status) ||
      stageIndex >= 2,
  );
  const hasTts = Boolean(
    (artifactExists(job, "audio") && artifactExists(job, "subtitles")) ||
      isStepFinished(stepMap.tts?.status) ||
      stageIndex >= 4,
  );
  const hasVideo = Boolean(artifactExists(job, "video") || isStepFinished(stepMap.render?.status) || job?.status === "completed");
  return {hasPlan, hasTts, hasVideo};
}

function getRetryActionForJob(job = state.activeJob) {
  const action = String(job?.failedAction || job?.lastPipelineAction || "").trim();
  if (["generate-plan", "tts", "render"].includes(action)) return action;
  const readiness = getJobReadiness(job);
  if (!readiness.hasPlan) return "generate-plan";
  if (!readiness.hasTts) return "tts";
  return "render";
}

function getPipelineActionLabel(action = "") {
  const labels = {
    "generate-plan": "\u751f\u6210\u8ba1\u5212",
    tts: "\u751f\u6210\u914d\u97f3",
    render: "\u6e32\u67d3\u89c6\u9891",
  };
  return labels[action] || action || "\u5f53\u524d\u6b65\u9aa4";
}

function getScreenQaCache(job) {
  const item = getArtifactItem(job, "screenQa");
  if (!item?.exists) return {status: "missing", report: null, item};
  const cached = state.screenQaReports[getScreenQaReportKey(job, item)];
  if (cached?.loading) return {status: "loading", report: null, item};
  if (cached?.error) return {status: "error", report: null, item, error: cached.error};
  if (!cached?.report) return {status: "unknown", report: null, item};
  return {status: cached.report.status || "unknown", report: cached.report, item};
}

function getJobCapabilities(job = state.activeJob) {
  const isJob = Boolean(job?.id && job.id !== "__pending_job__");
  const isRuntime = job?.source === "runtime";
  const isSession = job?.source === "session";
  const isBusy = Boolean(state.busyReason);
  const isPipelineBusy = Boolean(job?.pipelineRunning || job?.codexRunning);
  const readiness = getJobReadiness(job);
  const video = getArtifactItem(job, "video");
  const audio = getArtifactItem(job, "audio");
  const screenQa = getScreenQaCache(job);
  const exportNeedsQa = Boolean(video?.exists && video.url && state.settings.enforceQaBeforeExport);
  const qaPassed = screenQa.status === "passed";
  const qaExportBlocked = exportNeedsQa && !qaPassed;
  const needsCodexSession = Boolean(isRuntime && !job?.codexSessionId);
  const needsCodexRuntime = Boolean(isRuntime && !isCodexRuntimeReady());
  const codexRuntimeReason = getCodexRuntimeMessage();
  const basePipelineReason = !isJob
    ? "请先创建或选择一个视频任务。"
    : !isRuntime
      ? isSession
        ? "当前只是本地 Codex session 视图。请新建视频任务，或把 session 绑定到视频任务后再生成。"
        : "历史只读任务不能继续执行生产流水线。"
      : isPipelineBusy
        ? "当前任务正在执行，请等待本轮完成。"
        : needsCodexRuntime
          ? codexRuntimeReason
        : needsCodexSession
          ? "当前任务还没有绑定本地 session，请先绑定后再生成计划。"
          : "";

  return {
    isJob,
    isRuntime,
    isSession,
    readiness,
    isPipelineBusy,
    canChat: Boolean(isJob && (isRuntime || isSession) && !needsCodexRuntime && !isBusy),
    canPlan: Boolean(isRuntime && !needsCodexRuntime && !needsCodexSession && !isPipelineBusy && !isBusy),
    canTts: Boolean(isRuntime && readiness.hasPlan && !isPipelineBusy && !isBusy),
    canRender: Boolean(isRuntime && readiness.hasTts && !isPipelineBusy && !isBusy),
    canRunAll: Boolean(isRuntime && !isPipelineBusy && !isBusy && !needsCodexRuntime && (!needsCodexSession || readiness.hasPlan)),
    canExport: Boolean(!isBusy && ((video?.exists && video.url && !qaExportBlocked) || (!video?.exists && audio?.exists && audio.url))),
    canExportVideo: Boolean(video?.exists && video.url && !qaExportBlocked),
    canExportAudio: Boolean(!video?.exists && audio?.exists && audio.url),
    qaExportBlocked,
    screenQa,
    reason: basePipelineReason,
    actionReasons: {
      "generate-plan": basePipelineReason || (needsCodexSession ? "请先绑定本地 session，再生成计划。" : ""),
      tts: basePipelineReason || (!readiness.hasPlan ? "\u8bf7\u5148\u751f\u6210\u8ba1\u5212\uff0c\u518d\u8fdb\u5165\u914d\u97f3\u3002" : ""),
      render: basePipelineReason || (!readiness.hasTts ? "\u8bf7\u5148\u5b8c\u6210\u914d\u97f3\u548c\u5b57\u5e55\u65f6\u95f4\u8f74\uff0c\u518d\u6e32\u67d3 MP4\u3002" : ""),
      "run-all": basePipelineReason || (needsCodexSession ? "请先绑定本地 session，再执行一键生成。" : ""),
    },
    exportReason: !video?.exists && !audio?.exists
      ? "还没有可导出的产物。"
      : qaExportBlocked
        ? "Screen QA 未通过或报告未读取成功，已阻止导出。"
        : "",
  };
}

function getScreenQaOverview(job, readiness) {
  const screenQa = getScreenQaCache(job);
  if (!readiness.hasVideo) {
    return {value: "待渲染", note: "渲染后自动检查", tone: "todo"};
  }
  if (screenQa.status === "passed") {
    return {value: "已通过", note: "允许导出", tone: "ready"};
  }
  if (screenQa.status === "failed") {
    return {value: "未通过", note: "已阻止导出", tone: "danger"};
  }
  if (screenQa.status === "loading") {
    return {value: "读取中", note: "正在读取 QA 报告", tone: "warning"};
  }
  if (screenQa.status === "error") {
    return {value: "需检查", note: screenQa.error || "QA 报告读取失败", tone: "warning"};
  }
  return {value: "待检查", note: "等待 Screen QA 报告", tone: "warning"};
}

function getPipelineGuide(job = state.activeJob) {
  const stepMap = indexSteps(job?.steps || []);
  const readiness = getJobReadiness(job);
  const capabilities = getJobCapabilities(job);
  const errorText = String(job?.errorMessage || job?.preview?.subtitle || "").trim();
  const failed = String(job?.status || "").toLowerCase() === "failed";
  const hasRenderLeak = /screen qa|prompt leakage|render content contains prompt leakage|提示词|画面文案|内部元数据/i.test(errorText);
  const planDone = stepMap["generate-plan"]?.status === "completed" || readiness.hasPlan;
  const ttsDone = stepMap.tts?.status === "completed" || readiness.hasTts;
  const renderDone = stepMap.render?.status === "completed" || readiness.hasVideo;

  if (!job?.id || job.id === "__pending_job__") {
    return {
      tone: "todo",
      stageLabel: "尚未开始",
      stageNote: "先创建视频任务，再进入计划、配音和渲染。",
      nextLabel: "新建视频任务",
      nextNote: "先选择账号和模板，系统会告诉你后面要点哪个按钮。",
      actions: [{id: "new-task", label: "新建视频任务", tone: "primary"}],
    };
  }

  if (!capabilities.isRuntime) {
    return {
      tone: "todo",
      stageLabel: capabilities.isSession ? "本地 Session 只读" : "历史任务只读",
      stageNote: capabilities.isSession
        ? "这个视图只用于查看和对话，不能直接跑生产步骤。"
        : "历史任务只能查看产物，不能直接继续生成。",
      nextLabel: "新建视频任务",
      nextNote: "如果要继续生产，请新建运行中的任务。",
      actions: [{id: "new-task", label: "新建视频任务", tone: "primary"}],
    };
  }

  if (failed) {
    if (hasRenderLeak) {
      return {
        tone: "danger",
        stageLabel: "渲染前被拦截",
        stageNote: "Screen QA 检测到提示词或内部字段进入了画面文案。",
        nextLabel: "先改脚本，再继续",
        nextNote: "建议先打开 AI 改脚本，修掉泄漏后再重新跑配音和渲染。",
        actions: [
          {id: "open-script-ai", label: "AI 改脚本", tone: "primary"},
          {id: "restart-pipeline", label: "从头重跑", tone: "secondary"},
        ],
      };
    }

    const retryAction = getRetryActionForJob(job);
    return {
      tone: "danger",
      stageLabel: "任务已失败",
      stageNote: normalizeErrorText(errorText || job?.preview?.subtitle || "当前步骤执行失败。"),
      nextLabel: `重试 ${getPipelineActionLabel(retryAction)}`,
      nextNote: "可以先重试当前失败步骤，也可以从头重新执行整条链路。",
      actions: [
        {id: "retry-current", label: `重试当前步骤：${getPipelineActionLabel(retryAction)}`, tone: "primary"},
        {id: "restart-pipeline", label: "从头重跑", tone: "secondary"},
      ],
    };
  }

  if (job?.source === "runtime" && !isCodexRuntimeReady() && !planDone) {
    return {
      tone: "danger",
      stageLabel: "Codex CLI 不可用",
      stageNote: getCodexRuntimeMessage(),
      nextLabel: "修复本地 Codex 运行环境",
      nextNote: "当前服务进程不能启动 Codex，所以不能发送消息，也不能由 Codex 生成计划。",
      actions: [],
    };
  }

  if (job?.source === "runtime" && !job?.codexSessionId && !planDone) {
    return {
      tone: "warning",
      stageLabel: "先绑定 session 再生成计划",
      stageNote: "当前任务还没有绑定本地 session。先绑定后，计划才会由 Codex 生成。",
      nextLabel: "绑定本地 session",
      nextNote: "打开 session 列表，选择一个本地会话后再点“生成计划”。",
      actions: [{id: "open-session-drawer", label: "绑定 session", tone: "primary"}],
    };
  }

  if (!planDone) {
    return {
      tone: "warning",
      stageLabel: "等待生成计划",
      stageNote: "下一步是调用 Codex 生成脚本计划。",
      nextLabel: "生成计划",
      nextNote: state.settings.generationMode === "auto"
        ? "生成后会继续进入配音和渲染。"
        : "生成后会停在脚本审阅，确认无误再继续。",
      actions: [{id: "generate-plan", label: "生成计划", tone: "primary"}],
    };
  }

  if (!ttsDone) {
    return {
      tone: "warning",
      stageLabel: "计划已完成",
      stageNote: "下一步是生成配音和字幕时间轴。",
      nextLabel: "继续配音",
      nextNote: "点这个按钮后会进入 TTS，随后生成字幕与渲染参数。",
      actions: [{id: "tts", label: "继续配音", tone: "primary"}],
    };
  }

  if (!renderDone) {
    return {
      tone: "warning",
      stageLabel: "配音已完成",
      stageNote: "下一步是渲染 MP4，并自动跑 Screen QA。",
      nextLabel: "继续渲染",
      nextNote: "点这个按钮后会开始 Remotion 渲染，完成后会自动检查画面泄漏。",
      actions: [{id: "render", label: "继续渲染", tone: "primary"}],
    };
  }

  if (job?.status === "completed") {
    return {
      tone: "ready",
      stageLabel: "产物已完成",
      stageNote: "视频、封面和 QA 报告都已生成。",
      nextLabel: "导出或打开输出目录",
      nextNote: "如果还想检查细节，可以先打开产物目录或直接导出。",
      actions: [{id: "export", label: "导出 MP4", tone: "primary"}],
    };
  }

  return {
    tone: "ready",
    stageLabel: "渲染结果已就绪",
    stageNote: "如果 QA 通过，可以直接导出视频。",
    nextLabel: "导出 MP4",
    nextNote: "如果导出被阻止，先查看右侧 QA 结果。",
    actions: [{id: "export", label: "导出 MP4", tone: "primary"}],
  };
}

function renderPipelineGuide(job = state.activeJob) {
  if (!els.pipelineGuide) return;
  const guide = getPipelineGuide(job);
  const statusClass = `is-${escapeHtml(guide.tone || "todo")}`;
  const actionButtons = ensureArray(guide.actions)
    .map(
      (action) =>
        `<button class="${action.tone === "primary" ? "primary-button" : "secondary-button"} is-small" type="button" data-next-action="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`,
    )
    .join("");
  els.pipelineGuide.innerHTML = `
    <div class="pipeline-guide-head">
      <div>
        <span class="eyebrow">Current Step</span>
        <h3>${escapeHtml(guide.stageLabel)}</h3>
      </div>
      <span class="mini-status ${statusClass}">${escapeHtml(localizeJobStatus(job?.status || "idle"))}</span>
    </div>
    <div class="pipeline-guide-grid">
      <div class="pipeline-guide-block ${statusClass}">
        <span>当前阶段</span>
        <strong>${escapeHtml(guide.stageLabel)}</strong>
        <small>${escapeHtml(guide.stageNote)}</small>
      </div>
      <div class="pipeline-guide-block ${statusClass}">
        <span>下一步</span>
        <strong>${escapeHtml(guide.nextLabel)}</strong>
        <small>${escapeHtml(guide.nextNote)}</small>
      </div>
      <div class="pipeline-guide-actions">
        ${actionButtons}
      </div>
    </div>
  `;
}

function renderProductionStatus(job = state.activeJob) {
  if (!els.productionStatusGrid) return;
  const config = getCurrentConfig();
  const account = getAccountById(config.accountId);
  const template = getTemplateById(config.templateId);
  const readiness = getJobReadiness(job);
  const video = getArtifactItem(job, "video");
  const audio = getArtifactItem(job, "audio");
  const qa = getScreenQaOverview(job, readiness);
  const guide = getPipelineGuide(job);
  const isRuntimeJob = Boolean(job?.id && job.id !== "__pending_job__");
  const useAiImageAssets = Boolean(job?.useAiImageAssets || (!isRuntimeJob && config.useAiImageAssets));
  const imageAssetModel = job?.imageAssetModel || config.imageAssetModel || state.settings.imageAssetModel || "gpt-image-2-all";
  const items = [
    {
      label: "当前任务",
      value: isRuntimeJob ? job.title || job.id : "未创建",
      note: isRuntimeJob ? localizeJobStatus(job.status || "idle") : "先新建单条任务或选择历史任务",
      tone: isRuntimeJob ? "ready" : "todo",
    },
    {
      label: "账号",
      value: account?.name || "未选择",
      note: account ? platformLabel(account.platform) : "新任务必选",
      tone: account ? "ready" : "todo",
    },
    {
      label: "模板",
      value: template?.title || config.templateId || "未选择",
      note: config.compositionId || template?.compositionId || "新任务必选",
      tone: template ? "ready" : "todo",
    },
    {
      label: "生成计划",
      value: readiness.hasPlan ? "Ready" : "待生成",
      note: "video_plan.json / 脚本结构",
      tone: readiness.hasPlan ? "ready" : "todo",
    },
    {
      label: "素材模式",
      value: useAiImageAssets ? "图片模型" : "本地素材",
      note: useAiImageAssets ? imageAssetModel : "assets/images",
      tone: useAiImageAssets ? "ready" : "todo",
    },
    {
      label: "字幕字号",
      value: String(normalizeSubtitleFontSize(job?.subtitleFontSize || config.subtitleFontSize)),
      note: "Remotion subtitles",
      tone: "ready",
    },
    {
      label: "字幕颜色",
      value: normalizeSubtitleColor(job?.subtitleColor || config.subtitleColor),
      note: "SubtitleTrack",
      tone: "ready",
    },
    {
      label: "配音",
      value: readiness.hasTts ? "Ready" : "待配音",
      note: audio?.exists ? audio.fileName || "audio" : "TTS + subtitles",
      tone: readiness.hasTts ? "ready" : "todo",
    },
    {
      label: "渲染",
      value: readiness.hasVideo ? "Ready" : "待渲染",
      note: video?.exists ? video.fileName || "MP4" : "Remotion MP4",
      tone: readiness.hasVideo ? "ready" : "todo",
    },
    {
      label: "下一步",
      value: guide.nextLabel,
      note: guide.nextNote,
      tone: guide.tone,
    },
    {
      label: "Screen QA",
      value: qa.value,
      note: qa.note,
      tone: qa.tone,
    },
    {
      label: "产物",
      value: readiness.hasVideo ? "可审阅" : readiness.hasTts ? "音频已就绪" : "待产出",
      note: job?.outputDir || "data/jobs",
      tone: readiness.hasVideo ? "ready" : readiness.hasTts ? "warning" : "todo",
    },
  ];

  els.productionStatusGrid.innerHTML = items
    .map(
      (item) => `
        <article class="production-status-card is-${escapeHtml(item.tone)}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.note)}</small>
        </article>
      `,
    )
    .join("");
}

async function getExportTarget(job = state.activeJob) {
  const video = getArtifactItem(job, "video");
  if (video?.exists && video.url) {
    if (!state.settings.enforceQaBeforeExport) return {item: video, blocked: false};
    const screenQa = getArtifactItem(job, "screenQa");
    const report = await loadScreenQaReport(job, screenQa);
    if (report?.status === "passed") return {item: video, blocked: false};
    return {
      item: video,
      blocked: true,
      reason: report?.status === "failed"
        ? "\u5df2\u963b\u6b62\u5bfc\u51fa\uff1aScreen QA \u68c0\u6d4b\u672a\u901a\u8fc7\uff0c\u8bf7\u5148\u91cd\u65b0\u751f\u6210\u6216\u4fee\u590d\u753b\u9762\u3002"
        : "\u5df2\u963b\u6b62\u5bfc\u51fa\uff1a\u672a\u8bfb\u53d6\u5230\u901a\u8fc7\u7684 Screen QA \u62a5\u544a\u3002",
    };
  }
  const audio = getArtifactItem(job, "audio");
  if (audio?.exists && audio.url) return {item: audio, blocked: false};
  return {item: null, blocked: true, reason: "\u8fd8\u6ca1\u6709\u53ef\u5bfc\u51fa\u7684\u4ea7\u7269\uff0c\u8bf7\u5148\u5b8c\u6210\u914d\u97f3\u6216\u6e32\u67d3\u3002"};
}

function canChat(job) {
  return getJobCapabilities(job).canChat;
}

function canRunPipeline(job) {
  return Boolean(job?.id && job.id !== "__pending_job__" && job.source === "runtime");
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
  if (els.topModelChip) {
    els.topModelChip.textContent = state.codexConfig?.model || "gpt-5.4";
  }
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
  const codexSuffix =
    state.codexStatus?.ok === false
      ? ` | 不可用：${normalizeErrorText(state.codexStatus.error || state.codexStatus.code || "")}`
      : state.codexStatus?.version
        ? ` | ${state.codexStatus.version}`
        : "";
  const modelSuffix = state.codexConfig?.model ? ` | ${state.codexConfig.model}` : "";
  els.connectionStatus.classList.toggle("is-error", state.codexStatus?.ok === false);
  els.connectionStatus.innerHTML = `<span></span>${escapeHtml((state.project.codexBridge || "Codex CLI") + suffix + codexSuffix + modelSuffix)}`;

  document.querySelectorAll("[data-session-scope]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sessionScope === state.sessionScope);
  });
}

function renderStats() {
  if (!els.statsGrid) return;
  const stats = state.stats || {};
  const jobs = Array.isArray(state.jobs) ? state.jobs : [];
  const liveJobs = jobs.filter((job) => !job.archived).length;
  const archivedJobs = jobs.filter((job) => job.archived).length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const failedJobs = jobs.filter((job) => job.status === "failed").length;
  const activeJobs = jobs.filter((job) => !job.archived && !["completed", "failed"].includes(job.status)).length;
  const successBase = completedJobs + failedJobs;
  const successRate = successBase ? Math.round((completedJobs / successBase) * 100) : Number(stats.successRate || 0);
  const items = [
    {label: "\u4efb\u52a1", value: liveJobs, note: `\u5f52\u6863 ${archivedJobs}`},
    {label: "\u6210\u529f", value: completedJobs, note: `\u6210\u529f\u7387 ${successRate}%`},
    {label: "\u5931\u8d25", value: failedJobs, note: `\u8fdb\u884c\u4e2d ${activeJobs}`},
    {label: "\u8d26\u53f7", value: stats.accounts ?? state.accounts.length ?? 0, note: `\u5f52\u6863 ${stats.archivedAccounts ?? 0}`},
    {label: "\u6a21\u677f", value: stats.templates ?? state.templates.length ?? 0, note: `\u5df2\u53d1\u5e03 ${stats.publishedTemplates ?? 0}`},
    {label: "\u9879\u76ee", value: stats.campaigns ?? state.campaigns.filter((campaign) => !campaign.archived).length ?? 0, note: `\u5f52\u6863 ${stats.archivedCampaigns ?? 0}`},
    {label: "\u6d3b\u52a8", value: stats.activities ?? state.activities.filter((activity) => !activity.archived).length ?? 0, note: "\u9879\u76ee\u4e0b\u5c42"},
    {label: "\u9009\u9898", value: stats.topics ?? state.topics.length ?? 0, note: "\u9009\u9898\u6c60"},
    {label: "\u6279\u91cf", value: stats.batches ?? state.batches.length ?? 0, note: "\u540c\u9898\u591a\u8d26\u53f7"},
    {label: "Session", value: stats.sessions ?? state.sessionTotal ?? 0, note: formatDateTime(stats.updatedAt)},
  ];
  els.statsGrid.innerHTML = items
    .map(
      (item) => `
        <article class="stat-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.note || "-")}</small>
        </article>
      `,
    )
    .join("");
}

function getActiveCampaigns() {
  return (Array.isArray(state.campaigns) ? state.campaigns : []).filter((campaign) => !campaign.archived);
}

function getSelectedCampaign() {
  return (
    state.campaigns.find((campaign) => campaign.id === state.selectedCampaignId) ||
    getActiveCampaigns()[0] ||
    state.campaigns[0] ||
    null
  );
}

function ensureCampaignSelection() {
  const selected = getSelectedCampaign();
  state.selectedCampaignId = selected?.id || "";
  return selected;
}

function ensureBatchAccountSelection(config = getCurrentConfig()) {
  const activeAccountIds = new Set(listSelectableAccounts().map((account) => account.id));
  const selected = state.batchAccountIds.filter((accountId) => activeAccountIds.has(accountId));
  if (selected.length) {
    state.batchAccountIds = selected;
    return selected;
  }

  const preferred = config.accountId && activeAccountIds.has(config.accountId) ? [config.accountId] : [];
  state.batchAccountIds = preferred.length ? preferred : listSelectableAccounts().slice(0, 3).map((account) => account.id);
  return state.batchAccountIds;
}

function renderCampaignSelect() {
  if (!els.campaignSelect) return;
  const campaigns = getActiveCampaigns();
  const selected = ensureCampaignSelection();

  if (!campaigns.length) {
    els.campaignSelect.innerHTML = '<option value="">暂无项目</option>';
    els.campaignSelect.value = "";
    return;
  }

  els.campaignSelect.innerHTML = campaigns
    .map(
      (campaign) => `
        <option value="${escapeHtml(campaign.id)}">${escapeHtml(campaign.name || campaign.id)}</option>
      `,
    )
    .join("");
  els.campaignSelect.value = selected?.id || campaigns[0].id;
}

function getActiveActivities() {
  const projectId = state.selectedCampaignId || getSelectedCampaign()?.id || "";
  return (Array.isArray(state.activities) ? state.activities : []).filter(
    (activity) => !activity.archived && (!projectId || activity.projectId === projectId),
  );
}

function getSelectedActivity() {
  return (
    state.activities.find((activity) => activity.id === state.selectedActivityId) ||
    getActiveActivities()[0] ||
    null
  );
}

function ensureActivitySelection() {
  const selected = getSelectedActivity();
  state.selectedActivityId = selected?.id || "";
  return selected;
}

function renderActivitySelect() {
  if (!els.activitySelect) return;
  const activities = getActiveActivities();
  const selected = ensureActivitySelection();
  if (!activities.length) {
    els.activitySelect.innerHTML = '<option value="">暂无活动</option>';
    els.activitySelect.value = "";
    return;
  }
  els.activitySelect.innerHTML = activities
    .map((activity) => `<option value="${escapeHtml(activity.id)}">${escapeHtml(activity.name || activity.id)}</option>`)
    .join("");
  els.activitySelect.value = selected?.id || activities[0].id;
}

function getVisibleTopics() {
  const projectId = state.selectedCampaignId || getSelectedCampaign()?.id || "";
  const activityId = state.selectedActivityId || getSelectedActivity()?.id || "";
  return (Array.isArray(state.topics) ? state.topics : []).filter(
    (topic) => !topic.archived && (!projectId || topic.projectId === projectId) && (!activityId || topic.activityId === activityId),
  );
}

function getSelectedTopic() {
  return state.topics.find((topic) => topic.id === state.selectedTopicId) || null;
}

function getSelectedBatchTopics() {
  const ids = new Set(ensureStringList(state.selectedTopicIds));
  return (Array.isArray(state.topics) ? state.topics : []).filter((topic) => ids.has(topic.id));
}

function localizeTopicStatus(status = "") {
  const map = {
    idea: "待生成",
    batched: "已建批量",
    planned: "已生成计划",
    voiced: "已配音",
    completed: "已渲染",
    partial: "部分失败",
    failed: "失败",
  };
  return map[status] || status || "待生成";
}

function renderTopicPool() {
  if (!els.topicPoolList) return;
  const topics = getVisibleTopics();
  if (!topics.length) {
    els.topicPoolList.innerHTML = `
      <div class="panel-empty is-compact">
        <strong>当前活动还没有选题</strong>
        <p>输入选题后加入选题池，再选择账号创建批量任务。</p>
      </div>
    `;
    return;
  }

  els.topicPoolList.innerHTML = topics
    .slice(0, 8)
    .map(
      (topic) => {
        const selected = topic.id === state.selectedTopicId || state.selectedTopicIds.includes(topic.id);
        return `
        <button type="button" class="topic-chip ${selected ? "is-selected" : ""}" data-topic-id="${escapeHtml(topic.id)}">
          <strong>${escapeHtml(topic.title)}</strong>
          <small>${escapeHtml(localizeTopicStatus(topic.status))}${topic.batchId ? ` | ${escapeHtml(topic.batchId.slice(0, 18))}` : ""}</small>
        </button>
      `;
      },
    )
    .join("");
}

function updateBatchCreateButtonState(config = getCurrentConfig()) {
  if (!els.createBatchButton) return;
  const selectedAccountIds = ensureBatchAccountSelection(config);
  const hasTopics = getBatchTopicPayloadFromInput().length > 0;
  els.createBatchButton.disabled = Boolean(state.busyReason) || !selectedAccountIds.length || !hasTopics;
  els.createBatchButton.title = hasTopics ? "" : "请先输入选题，或从选题池选择一个或多个选题。";
}

function renderBatchPanel(config = getCurrentConfig()) {
  if (!els.batchAccountGrid) return;
  renderCampaignSelect();
  renderActivitySelect();
  renderTopicPool();
  const selectedAccountIds = new Set(ensureBatchAccountSelection(config));
  const accounts = listSelectableAccounts();

  if (!accounts.length) {
    els.batchAccountGrid.innerHTML = `
      <div class="panel-empty">
        <strong>还没有可用账号</strong>
        <p>先创建账号画像，再使用同题批量任务。</p>
      </div>
    `;
    if (els.createBatchButton) els.createBatchButton.disabled = true;
    return;
  }

  updateBatchCreateButtonState(config);

  els.batchAccountGrid.innerHTML = accounts
    .map((account) => {
      const checked = selectedAccountIds.has(account.id);
      const template = getTemplateById(account.defaultTemplateId);
      return `
        <label class="batch-account-card ${checked ? "is-selected" : ""}">
          <input type="checkbox" data-batch-account-id="${escapeHtml(account.id)}" ${checked ? "checked" : ""} />
          <span>
            <strong>${escapeHtml(account.name || account.id)}</strong>
            <small>${escapeHtml(platformLabel(account.platform))} | ${escapeHtml(template?.title || account.defaultTemplateId || "默认模板")}</small>
          </span>
        </label>
      `;
    })
    .join("");
}

function localizeBatchStatus(status = "") {
  const map = {
    draft: "草稿",
    queued: "排队中",
    running: "运行中",
    pausing: "暂停中",
    paused: "已暂停",
    canceling: "取消中",
    canceled: "已取消",
    planned: "已生成计划",
    voiced: "已配音",
    partial: "部分失败",
    failed: "失败",
    completed: "已完成",
  };
  return map[status] || status || "草稿";
}

function formatBatchRunState(batch) {
  const runState = batch?.runState || null;
  if (!runState) return "";
  const total = Array.isArray(runState.queuedJobIds) ? runState.queuedJobIds.length : 0;
  const done = Array.isArray(runState.completedJobIds) ? runState.completedJobIds.length : 0;
  const failed = Array.isArray(runState.failedJobIds) ? runState.failedJobIds.length : 0;
  const canceled = Array.isArray(runState.canceledJobIds) ? runState.canceledJobIds.length : 0;
  if (runState.control === "pause") return `暂停请求已提交 ${done + failed + canceled}/${total}`;
  if (runState.control === "cancel") return `取消请求已提交 ${done + failed + canceled}/${total}`;
  if (runState.running) {
    const elapsed = runState.currentElapsedMs ? ` | 当前 ${formatDurationMs(runState.currentElapsedMs)}` : "";
    const remaining = runState.estimatedRemainingMs ? ` | 剩余约 ${formatDurationMs(runState.estimatedRemainingMs)}` : "";
    return `队列运行中 ${done + failed + canceled}/${total}${elapsed}${remaining}`;
  }
  if (done || failed) return `上次队列 ${done} 成功 / ${failed} 失败`;
  return "";
}

function getBatchById(batchId) {
  return (Array.isArray(state.batches) ? state.batches : []).find((batch) => batch.id === batchId) || null;
}

function isBatchRunning(batch) {
  return Boolean(batch?.runState?.running) || ["queued", "running", "pausing", "canceling"].includes(batch?.status);
}

function countBatchArtifacts(batch) {
  if (!batch?.artifacts?.items) return Number(batch?.renderReady || 0);
  return batch.artifacts.items.filter((item) => item.key === "video").length;
}

function formatBatchArtifactStatus(job) {
  const status = job?.artifactStatus || {};
  const manifest = job?.artifactManifest || {};
  const ready = [
    status.plan || manifest.plan?.exists ? "计划" : "",
    status.audio || manifest.audio?.exists ? "音频" : "",
    status.subtitles || manifest.subtitles?.exists ? "字幕" : "",
    status.poster || manifest.poster?.exists ? "封面" : "",
    status.video || manifest.video?.exists || job?.hasVideo ? "视频" : "",
  ].filter(Boolean);
  return ready.length ? ready.join(" / ") : "暂无产物";
}

function formatBatchJobScope(job, batch) {
  const accountName = getAccountById(job?.accountId)?.name || job?.accountName || job?.accountId || "-";
  return [
    batch?.campaignName || job?.campaignName || job?.campaignId || "",
    batch?.activityName || job?.activityName || job?.activityId || "",
    job?.topicTitle || batch?.topic || "",
    accountName,
  ]
    .filter(Boolean)
    .join(" / ");
}

function getStepClass(status = "") {
  const value = String(status || "waiting").toLowerCase();
  if (["done", "completed", "success"].includes(value)) return "is-done";
  if (["running", "active"].includes(value)) return "is-running";
  if (["failed", "error"].includes(value)) return "is-failed";
  return "is-waiting";
}

function buildBatchDownloadUrl(batchId, options = {}) {
  const params = new URLSearchParams();
  const accountIds = ensureStringList(options.accountIds);
  if (accountIds.length) params.set("accountIds", accountIds.join(","));
  if (options.retryOnly) params.set("retryOnly", "1");
  const query = params.toString();
  return `/api/batches/${encodeURIComponent(batchId)}/artifacts/download${query ? `?${query}` : ""}`;
}

function renderBatchList() {
  if (!els.batchList) return;
  if (els.batchStatusFilter) els.batchStatusFilter.value = state.batchFilterStatus;
  if (els.batchSearchInput && els.batchSearchInput.value !== state.batchFilterQuery) {
    els.batchSearchInput.value = state.batchFilterQuery;
  }
  const batches = Array.isArray(state.batches) ? state.batches : [];
  if (!batches.length) {
    els.batchList.innerHTML = `
      <div class="panel-empty">
        <strong>还没有批量任务</strong>
        <p>输入一个选题并选择账号后，会生成一组可单独推进的任务。</p>
      </div>
    `;
    return;
  }

  els.batchList.innerHTML = batches
    .slice(0, 8)
    .map((batch) => {
      const jobs = Array.isArray(batch.jobs) ? batch.jobs : [];
      const completed = Number(batch.completed ?? batch.completedCount ?? jobs.filter((job) => job.status === "completed").length ?? 0);
      const failed = Number(batch.failed ?? batch.failedCount ?? jobs.filter((job) => job.status === "failed").length ?? 0);
      const planReady = Number(batch.planReady || jobs.filter((job) => job.planReady).length || 0);
      const ttsReady = Number(batch.ttsReady || jobs.filter((job) => job.ttsReady).length || 0);
      const renderReady = Number(batch.renderReady || jobs.filter((job) => job.renderReady).length || completed || 0);
      const total = Number(batch.jobCount || batch.jobIds?.length || jobs.length || 0);
      const progress = total ? `${planReady}/${total}` : "-";
      const isRunning = isBatchRunning(batch);
      const canRunPlan = total > 0 && planReady < total;
      const canRunTts = total > 0 && planReady > 0 && ttsReady < planReady;
      const canRunRender = total > 0 && ttsReady > 0 && renderReady < ttsReady;
      const retryAction = batch.runState?.action || "generate-plan";
      const jobButtons = (jobs.length ? jobs : (batch.jobIds || []).map((id) => ({id, title: id, status: "idle"})))
        .slice(0, 6)
        .map(
          (job) => `
            <button type="button" class="batch-job-chip ${job.id === state.activeJob?.id ? "is-selected" : ""} ${job.status === "failed" ? "is-danger" : ""}" data-batch-job-id="${escapeHtml(job.id)}">
              ${escapeHtml(job.title || job.id)}${job.renderReady ? " · video" : job.ttsReady ? " · audio" : job.planReady ? " · plan" : ""}
            </button>
          `,
        )
        .join("");
      const runStateText = formatBatchRunState(batch);

      return `
        <article class="batch-card">
          <div class="batch-card-head">
            <div>
              <span>${escapeHtml(formatDateTime(batch.updatedAt || batch.createdAt))}</span>
              <strong>${escapeHtml(batch.topic || batch.id)}</strong>
            </div>
            <div class="batch-progress">
              <strong>${escapeHtml(progress)}</strong>
              <small>${failed ? `失败 ${failed}` : localizeBatchStatus(batch.status)}</small>
            </div>
          </div>
          <div class="batch-card-meta">
            <small>项目：${escapeHtml(batch.campaignName || batch.campaignId || "-")}</small>
            <small>活动：${escapeHtml(batch.activityName || batch.activityId || "-")}</small>
            <small>任务数：${escapeHtml(total)}</small>
            <small>选题：${escapeHtml(batch.topicCount || 1)}</small>
            <small>账号：${escapeHtml(batch.accountCount || batch.accountIds?.length || "-")}</small>
            <small>计划 ${escapeHtml(planReady)}/${escapeHtml(total)}</small>
            <small>配音 ${escapeHtml(ttsReady)}/${escapeHtml(total)}</small>
            <small>渲染 ${escapeHtml(renderReady)}/${escapeHtml(total)}</small>
            <small>自动重试：${batch.autoRetry === false ? "关闭" : `开启 ${escapeHtml(batch.autoRetryCount || 0)}/${escapeHtml(batch.maxAutoRetries ?? 1)}`}</small>
            ${runStateText ? `<small>${escapeHtml(runStateText)}</small>` : ""}
          </div>
          <div class="batch-job-row">${jobButtons}</div>
          <div class="batch-action-row">
            <button type="button" class="secondary-button is-small" data-batch-detail="${escapeHtml(batch.id)}">详情</button>
            <button type="button" class="secondary-button is-small" data-batch-action="generate-plan" data-batch-id="${escapeHtml(batch.id)}" ${isRunning || !canRunPlan ? "disabled" : ""}>批量生成计划</button>
            <button type="button" class="secondary-button is-small" data-batch-action="tts" data-batch-id="${escapeHtml(batch.id)}" ${isRunning || !canRunTts ? "disabled" : ""}>批量配音</button>
            <button type="button" class="secondary-button is-small" data-batch-action="render" data-batch-id="${escapeHtml(batch.id)}" ${isRunning || !canRunRender ? "disabled" : ""}>批量渲染</button>
            <button type="button" class="secondary-button is-small ${failed ? "is-danger" : ""}" data-batch-action="retry-failed" data-retry-action="${escapeHtml(retryAction)}" data-batch-id="${escapeHtml(batch.id)}" ${isRunning || !failed ? "disabled" : ""}>重试失败</button>
            <button type="button" class="secondary-button is-small" data-batch-download="${escapeHtml(batch.id)}" ${renderReady ? "" : "disabled"}>下载产物</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderBatchDrawer() {
  const detail = state.batchDetail;
  if (!els.batchDetailDrawer || !detail) return;
  const jobs = Array.isArray(detail.jobs) ? detail.jobs : [];
  const total = Number(detail.jobCount || jobs.length || 0);
  const running = isBatchRunning(detail);
  const videos = countBatchArtifacts(detail);
  const runStateText = formatBatchRunState(detail);
  const busy = Boolean(state.busyReason);
  const runState = detail.runState || {};
  const activeAccountIds = [...new Set(jobs.map((job) => job.accountId).filter(Boolean))];
  if (!state.batchArtifactAccountIds.length && activeAccountIds.length) {
    state.batchArtifactAccountIds = activeAccountIds;
  }
  const selectedArtifactAccounts = state.batchArtifactAccountIds.filter((accountId) => activeAccountIds.includes(accountId));
  const selectedArtifactSet = new Set(selectedArtifactAccounts.length ? selectedArtifactAccounts : activeAccountIds);

  if (els.batchDrawerTitle) {
    els.batchDrawerTitle.textContent = detail.topic || detail.id || "批量队列详情";
  }
  if (els.batchDrawerMeta) {
    els.batchDrawerMeta.innerHTML = `
      <div><span>状态</span><strong>${escapeHtml(localizeBatchStatus(detail.status))}</strong></div>
      <div><span>任务</span><strong>${escapeHtml(total)}</strong></div>
      <div><span>计划 / 配音 / 渲染</span><strong>${escapeHtml(detail.planReady || 0)} / ${escapeHtml(detail.ttsReady || 0)} / ${escapeHtml(detail.renderReady || 0)}</strong></div>
      <div><span>渲染产物</span><strong>${escapeHtml(videos)}</strong></div>
      <div><span>项目</span><strong>${escapeHtml(detail.campaignName || detail.campaignId || "-")}</strong></div>
      <div><span>活动</span><strong>${escapeHtml(detail.activityName || detail.activityId || "-")}</strong></div>
      <div><span>选题 / 账号</span><strong>${escapeHtml(detail.topicCount || 1)} / ${escapeHtml(detail.accountCount || activeAccountIds.length || "-")}</strong></div>
      <div><span>失败自动重试</span><strong>${detail.autoRetry === false ? "关闭" : `开启 ${detail.autoRetryCount || 0}/${detail.maxAutoRetries ?? 1}`}</strong></div>
      <div><span>当前队列</span><strong>${escapeHtml(runStateText || "-")}</strong></div>
      <div><span>当前 job 已耗时</span><strong>${escapeHtml(formatDurationMs(runState.currentElapsedMs))}</strong></div>
      <div><span>当前 job 预计</span><strong>${escapeHtml(formatDurationMs(runState.currentJobEstimateMs))}</strong></div>
      <div><span>队列预计剩余</span><strong>${escapeHtml(formatDurationMs(runState.estimatedRemainingMs))}</strong></div>
      <div><span>更新</span><strong>${escapeHtml(formatDateTime(detail.updatedAt || detail.createdAt))}</strong></div>
    `;
  }

  if (els.pauseBatchButton) els.pauseBatchButton.disabled = busy || !running || detail.runState?.control === "pause";
  if (els.cancelBatchButton) els.cancelBatchButton.disabled = busy || !running || detail.runState?.control === "cancel";
  if (els.forceCancelBatchButton) els.forceCancelBatchButton.disabled = busy || !running || !detail.runState?.currentJobId || detail.runState?.control === "cancel";
  if (els.resumeBatchButton) els.resumeBatchButton.disabled = busy || running || !["paused", "partial", "failed", "canceled"].includes(detail.status);
  if (els.downloadBatchButton) els.downloadBatchButton.disabled = busy || videos <= 0;

  if (els.batchDrawerJobs) {
    if (!jobs.length) {
      els.batchDrawerJobs.innerHTML = `
        <div class="panel-empty">
          <strong>还没有队列任务</strong>
          <p>创建批量任务后，这里会显示每个 job 卡在哪一步。</p>
        </div>
      `;
    } else {
      els.batchDrawerJobs.innerHTML = jobs
        .map((job, index) => {
          const currentTitle = job.currentStepTitle || "等待队列调度";
          const currentStatus = job.currentStepStatus || job.status || "waiting";
          const steps = Array.isArray(job.steps) ? job.steps : [];
          const stepStrip = steps.length
            ? steps
                .map(
                  (step) => `
                    <span class="batch-step-pill ${getStepClass(step.status)}">
                      ${escapeHtml(step.title || step.id || step.key || "-")}
                    </span>
                  `,
                )
                .join("")
            : `<span class="batch-step-pill is-waiting">等待生成步骤</span>`;
          const logs = Array.isArray(job.logs) ? job.logs.filter(Boolean).slice(-4) : [];
          const timingText = job.batchCurrent
            ? `已耗时 ${formatDurationMs(job.currentElapsedMs)} / 预计 ${formatDurationMs(job.currentEstimateMs)}`
            : job.retryArtifactAt
              ? `重试产物 ${formatDateTime(job.retryArtifactAt)}`
              : "";
          const artifactStatus = formatBatchArtifactStatus(job);
          const qaStatus = localizeQaStatus(job.screenQaStatus || "missing");
          const errorText = job.errorMessage || runState.lastError || "";
          const scopeText = formatBatchJobScope(job, detail);
          const retryCount = Number(job.retryCount || 0);
          const retryActions =
            job.status === "failed"
              ? `
                <div class="batch-job-action-row">
                  <button type="button" class="secondary-button is-small is-danger" data-batch-job-action="retry-current" data-batch-id="${escapeHtml(detail.id)}" data-batch-job-id="${escapeHtml(job.id)}">重试当前步骤</button>
                  <button type="button" class="secondary-button is-small" data-batch-job-action="restart" data-batch-id="${escapeHtml(detail.id)}" data-batch-job-id="${escapeHtml(job.id)}">从头重新生成</button>
                </div>
              `
              : "";
          return `
            <article class="batch-job-detail ${job.status === "failed" ? "is-danger" : ""}">
              <div class="batch-job-detail-head">
                <div>
                  <span>${String(index + 1).padStart(2, "0")} · ${escapeHtml(localizeJobStatus(job.status || "idle"))}</span>
                  <strong>${escapeHtml(job.title || job.id)}</strong>
                </div>
                <button type="button" class="secondary-button is-small" data-batch-job-id="${escapeHtml(job.id)}">打开任务</button>
              </div>
              <div class="batch-current-step">
                <span>当前卡点</span>
                <strong>${escapeHtml(currentTitle)}</strong>
                <small>${escapeHtml(localizeStepStatus(currentStatus))}</small>
                ${timingText ? `<small>${escapeHtml(timingText)}</small>` : ""}
              </div>
              <div class="batch-job-metrics">
                <div><span>归档</span><strong>${escapeHtml(scopeText || "-")}</strong></div>
                <div><span>产物</span><strong>${escapeHtml(artifactStatus)}</strong></div>
                <div><span>QA</span><strong>${escapeHtml(qaStatus)}</strong></div>
                <div><span>重试次数</span><strong>${escapeHtml(retryCount)}</strong></div>
              </div>
              ${errorText ? `<div class="batch-job-error"><span>错误信息</span><strong>${escapeHtml(errorText)}</strong></div>` : ""}
              ${retryActions}
              <div class="batch-step-strip">${stepStrip}</div>
              ${
                logs.length
                  ? `<pre class="batch-job-logs">${escapeHtml(logs.join("\n"))}</pre>`
                  : `<div class="batch-job-empty-log">暂无运行日志</div>`
              }
            </article>
          `;
        })
        .join("");
    }
  }

  if (els.batchDrawerArtifacts) {
    const artifacts = detail.artifacts?.items || [];
    const filteredArtifacts = artifacts.filter((item) => {
      if (selectedArtifactSet.size && item.accountId && !selectedArtifactSet.has(item.accountId)) return false;
      if (state.batchArtifactRetryOnly && !item.retryArtifactAt) return false;
      return true;
    });
    const videoItems = filteredArtifacts.filter((item) => item.key === "video");
    const otherItems = filteredArtifacts.filter((item) => item.key !== "video").slice(0, 8);
    const accountFilters = activeAccountIds
      .map((accountId) => {
        const accountName = getAccountById(accountId)?.name || jobs.find((job) => job.accountId === accountId)?.accountId || accountId;
        const videoCount = artifacts.filter((item) => item.key === "video" && item.accountId === accountId).length;
        return `
          <label class="batch-artifact-filter">
            <input type="checkbox" data-batch-download-account-id="${escapeHtml(accountId)}" ${selectedArtifactSet.has(accountId) ? "checked" : ""} />
            <span>${escapeHtml(accountName)}${videoCount ? ` (${videoCount})` : ""}</span>
          </label>
        `;
      })
      .join("");
    const archiveSummary = jobs
      .map((job) => {
        const accountName = getAccountById(job.accountId)?.name || job.accountName || job.accountId || "-";
        const label = [
          detail.campaignName || job.campaignName || job.campaignId || "未归档项目",
          detail.activityName || job.activityName || job.activityId || "未归档活动",
          job.topicTitle || detail.topic || "未命名选题",
          accountName,
        ].join(" / ");
        return `
          <div class="batch-archive-row">
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(formatBatchArtifactStatus(job))} · ${escapeHtml(localizeQaStatus(job.screenQaStatus || "missing"))}</span>
          </div>
        `;
      })
      .join("");
    els.batchDrawerArtifacts.innerHTML = `
      <div class="batch-artifact-head">
        <div>
          <span>产物聚合</span>
          <strong>${videoItems.length ? `${videoItems.length} 个视频可打包下载` : "暂无可下载视频"}</strong>
        </div>
        <button type="button" class="primary-button is-small" data-batch-download="${escapeHtml(detail.id)}" ${videoItems.length ? "" : "disabled"}>下载筛选视频</button>
      </div>
      <div class="batch-artifact-filter-row">
        ${accountFilters || `<span>暂无账号筛选</span>`}
        <label class="batch-artifact-filter">
          <input type="checkbox" data-batch-download-retry-only="1" ${state.batchArtifactRetryOnly ? "checked" : ""} />
          <span>只看失败重试后产物</span>
        </label>
      </div>
      <div class="batch-archive-list">${archiveSummary || `<div class="batch-job-empty-log">还没有可归档的 job。</div>`}</div>
      <div class="batch-artifact-list">
        ${[...videoItems, ...otherItems]
          .map(
            (item) => `
              <a class="batch-artifact-item" href="${escapeHtml(item.url || "#")}" target="_blank" rel="noreferrer">
                <span>${escapeHtml(item.key)}</span>
                <strong>${escapeHtml(item.jobTitle || item.jobId || item.fileName)}</strong>
                <small>${escapeHtml(item.fileName || item.path || "")}</small>
              </a>
            `,
          )
          .join("") || `<div class="batch-job-empty-log">渲染完成后会在这里聚合视频、封面、音频和字幕。</div>`}
      </div>
    `;
  }

  bindBatchDrawerDynamicActions();
}

function openBatchDrawer() {
  if (!els.batchDetailDrawer) return;
  els.batchDetailDrawer.hidden = false;
}

function closeBatchDrawer() {
  if (!els.batchDetailDrawer) return;
  els.batchDetailDrawer.hidden = true;
  state.selectedBatchId = "";
  state.batchDetail = null;
  state.batchArtifactAccountIds = [];
  state.batchArtifactRetryOnly = false;
}

async function loadBatchDetail(batchId, options = {}) {
  if (!batchId) return null;
  if (state.selectedBatchId && state.selectedBatchId !== batchId) {
    state.batchArtifactAccountIds = [];
    state.batchArtifactRetryOnly = false;
  }
  state.batchDetailLoading = true;
  try {
    const detail = await requestJson(`/api/batches/${encodeURIComponent(batchId)}`);
    state.selectedBatchId = batchId;
    state.batchDetail = detail;
    if (options.open !== false) openBatchDrawer();
    renderBatchDrawer();
    return detail;
  } catch (error) {
    reportError("加载批量队列详情失败", error);
    throw error;
  } finally {
    state.batchDetailLoading = false;
  }
}

async function refreshOpenBatchDetail() {
  if (!state.selectedBatchId || !els.batchDetailDrawer || els.batchDetailDrawer.hidden || state.batchDetailLoading) return;
  try {
    await loadBatchDetail(state.selectedBatchId, {open: false});
  } catch (error) {
    console.warn("batch detail refresh failed", error);
  }
}

async function controlBatchQueue(command, options = {}) {
  const batchId = state.selectedBatchId || state.batchDetail?.id;
  if (!batchId || !command) return null;
  if (command === "cancel") {
    const accepted = window.confirm(
      options.force
        ? "强制取消会立即终止当前 job 的本地子进程，并停止后续队列。确认强制取消？"
        : "取消队列会停止后续 job，当前正在执行的 job 会执行完再停止。确认取消？",
    );
    if (!accepted) return null;
  }
  const labels = {pause: "暂停", cancel: "取消", resume: "继续"};
  setBusy(true, `batch-control-${command}`);
  setBanner(`正在提交队列${labels[command] || command}请求...`, "info");
  try {
    const batch = await requestJson(`/api/batches/${encodeURIComponent(batchId)}/control`, {
      method: "POST",
      body: JSON.stringify({command, force: Boolean(options.force)}),
    });
    await reloadScaleCollections();
    await loadBatchDetail(batchId, {open: true});
    setBanner(`队列${labels[command] || command}请求已提交。`, "success");
    showToast(`队列${labels[command] || command}请求已提交`, "success");
    return batch;
  } catch (error) {
    reportError(`队列${labels[command] || command}失败`, error);
    throw error;
  } finally {
    setBusy(false);
  }
}

function localizeBatchJobAction(action = "") {
  const map = {
    "retry-current": "重试当前步骤",
    restart: "从头重新生成",
  };
  return map[action] || action || "单任务操作";
}

async function runBatchJobAction(batchId, jobId, action) {
  if (!batchId || !jobId || !action) return null;
  const label = localizeBatchJobAction(action);
  setBusy(true, `batch-job-${action}`);
  setBanner(`正在执行${label}...`, "info");
  try {
    const payload = await requestJson(
      `/api/batches/${encodeURIComponent(batchId)}/jobs/${encodeURIComponent(jobId)}/actions/${encodeURIComponent(action)}`,
      {method: "POST"},
    );
    if (payload.job) mergeJob(payload.job);
    if (payload.batch) {
      state.batchDetail = payload.batch;
      state.selectedBatchId = payload.batch.id || batchId;
    }
    await reloadScaleCollections();
    await loadBatchDetail(batchId, {open: true});
    setBanner(`${label}已提交并同步最新状态。`, "success");
    showToast(`${label}已完成`, "success");
    return payload;
  } catch (error) {
    reportError(`${label}失败`, error);
    throw error;
  } finally {
    setBusy(false);
  }
}

function getBatchArtifactDownloadFilters(batchId) {
  const batch = state.batchDetail?.id === batchId ? state.batchDetail : null;
  if (!batch) return {};
  const jobs = Array.isArray(batch.jobs) ? batch.jobs : [];
  const allAccountIds = [...new Set(jobs.map((job) => job.accountId).filter(Boolean))];
  const accountIds = state.batchArtifactAccountIds.filter((accountId) => allAccountIds.includes(accountId));
  return {
    accountIds: accountIds.length && accountIds.length < allAccountIds.length ? accountIds : [],
    retryOnly: Boolean(state.batchArtifactRetryOnly),
  };
}

function downloadBatchArtifacts(batchId = state.selectedBatchId || state.batchDetail?.id) {
  if (!batchId) return;
  const batch = state.batchDetail?.id === batchId ? state.batchDetail : getBatchById(batchId);
  const filters = getBatchArtifactDownloadFilters(batchId);
  const artifacts = batch?.artifacts?.items || [];
  const downloadable = artifacts.filter((item) => {
    if (item.key !== "video") return false;
    if (filters.accountIds?.length && !filters.accountIds.includes(item.accountId)) return false;
    if (filters.retryOnly && !item.retryArtifactAt) return false;
    return true;
  }).length;
  if (batch && (artifacts.length ? downloadable <= 0 : countBatchArtifacts(batch) <= 0)) {
    showToast("当前批量队列还没有可下载的渲染视频。", "warning");
    return;
  }
  triggerDownload({
    url: buildBatchDownloadUrl(batchId, filters),
    fileName: `${batch?.topic || batchId}-videos.zip`,
  });
}

function bindBatchDrawerDynamicActions() {
  els.batchDrawerJobs?.querySelectorAll("[data-batch-job-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.batchJobAction) return;
      const jobId = button.dataset.batchJobId;
      if (jobId) selectJob(jobId).catch(console.error);
    });
  });
  els.batchDrawerJobs?.querySelectorAll("[data-batch-job-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const batchId = button.dataset.batchId || state.selectedBatchId || state.batchDetail?.id || "";
      const jobId = button.dataset.batchJobId || "";
      const action = button.dataset.batchJobAction || "";
      runBatchJobAction(batchId, jobId, action).catch(console.error);
    });
  });
  els.batchDrawerArtifacts?.querySelectorAll("[data-batch-download]").forEach((button) => {
    button.addEventListener("click", () => downloadBatchArtifacts(button.dataset.batchDownload));
  });
  els.batchDrawerArtifacts?.querySelectorAll("[data-batch-download-account-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const accountId = checkbox.dataset.batchDownloadAccountId || "";
      const set = new Set(state.batchArtifactAccountIds);
      if (checkbox.checked) set.add(accountId);
      else set.delete(accountId);
      state.batchArtifactAccountIds = [...set].filter(Boolean);
      renderBatchDrawer();
    });
  });
  els.batchDrawerArtifacts?.querySelector("[data-batch-download-retry-only]")?.addEventListener("change", (event) => {
    state.batchArtifactRetryOnly = Boolean(event.target.checked);
    renderBatchDrawer();
  });
}

function renderRetryQueue() {
  if (!els.retryQueueList) return;
  const items = Array.isArray(state.retryQueue) ? state.retryQueue : [];
  if (!items.length) {
    els.retryQueueList.innerHTML = "";
    return;
  }
  els.retryQueueList.innerHTML = `
    <div class="retry-queue-card">
      <div class="batch-card-head">
        <div>
          <span>失败重试队列</span>
          <strong>${items.length} 个任务待处理</strong>
        </div>
      </div>
      <div class="batch-job-row">
        ${items
          .slice(0, 8)
          .map(
            (item) => `
              <button type="button" class="batch-job-chip is-danger" data-batch-job-id="${escapeHtml(item.job?.id || "")}">
                ${escapeHtml(item.job?.title || item.batchTopic || item.batchId)}
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function localizeAuditAction(action = "") {
  const map = {
    "campaign.created": "新建项目",
    "campaign.updated": "更新项目",
    "campaign.archived": "归档项目",
    "campaign.restored": "恢复项目",
    "campaign.deleted": "删除项目",
    "activity.created": "新建活动",
    "topic.created": "加入选题池",
    "batch.created": "创建批量任务",
    "batch.run.started": "批量队列开始",
    "batch.retry.started": "失败重试开始",
    "batch.run.finished": "批量队列完成",
    "batch.pause.requested": "请求暂停队列",
    "batch.cancel.requested": "请求取消队列",
    "batch.cancel.force_requested": "请求强制取消",
    "batch.paused": "队列已暂停",
    "batch.canceled": "队列已取消",
  };
  return map[action] || action || "操作";
}

function renderAuditEvents() {
  if (!els.auditEventList) return;
  const events = Array.isArray(state.auditEvents) ? state.auditEvents : [];
  if (!events.length) {
    els.auditEventList.innerHTML = `
      <div class="panel-empty">
        <strong>暂无操作记录</strong>
        <p>新建项目、创建批量任务后会记录在这里。</p>
      </div>
    `;
    return;
  }

  els.auditEventList.innerHTML = events
    .slice(0, 12)
    .map((event) => {
      const metadata = event.metadata || {};
      const detail = [metadata.name, metadata.topic, metadata.jobCount ? `${metadata.jobCount} 个任务` : ""]
        .filter(Boolean)
        .join(" | ");
      return `
        <article class="audit-item">
          <div>
            <strong>${escapeHtml(localizeAuditAction(event.action))}</strong>
            <span>${escapeHtml(detail || event.entityId || "-")}</span>
          </div>
          <small>${escapeHtml(formatDateTime(event.createdAt))}</small>
        </article>
      `;
    })
    .join("");
}

function renderScaleTools(config = getCurrentConfig()) {
  renderBatchPanel(config);
  renderRetryQueue();
  renderBatchList();
  renderAuditEvents();
  syncBatchPolling();
}

function hasRunningBatchQueue() {
  return (Array.isArray(state.batches) ? state.batches : []).some(
    (batch) => Boolean(batch.runState?.running) || ["queued", "running"].includes(batch.status),
  );
}

function syncBatchPolling() {
  const shouldPoll = hasRunningBatchQueue();
  if (!shouldPoll) {
    if (state.batchPollTimer) {
      window.clearTimeout(state.batchPollTimer);
      state.batchPollTimer = 0;
    }
    return;
  }
  if (state.batchPollTimer || state.batchPollInFlight) return;
  state.batchPollTimer = window.setTimeout(async () => {
    state.batchPollTimer = 0;
    if (state.batchPollInFlight) return;
    if (state.busyReason && !String(state.busyReason).startsWith("batch-")) {
      syncBatchPolling();
      return;
    }
    state.batchPollInFlight = true;
    try {
      await reloadScaleCollections({silent: true});
    } catch (error) {
      console.warn("batch polling failed", error);
    } finally {
      state.batchPollInFlight = false;
      syncBatchPolling();
    }
  }, 2500);
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
      (message) => {
        const text = message.text ?? message.content ?? message.message ?? "";
        return `
        <article class="message ${escapeHtml(message.role || "assistant")} ${message.pending ? "is-pending" : ""}">
          <div class="meta">${escapeHtml(message.meta || message.author || (message.role === "user" ? "You" : "Codex"))}</div>
          <div class="bubble">${escapeHtml(text)}</div>
        </article>
      `;
      },
    )
    .join("");
  els.threadList.scrollTop = els.threadList.scrollHeight;
}

function renderSteps(steps = []) {
  if (!steps.length) {
    els.stepList.innerHTML =       `
      <li class="step-card is-running is-onboarding">
        <div class="step-index">01</div>
        <div class="step-copy">
          <strong>\u9009\u62e9\u8d26\u53f7\u548c\u6a21\u677f</strong>
          <p>\u5148\u786e\u5b9a\u8d26\u53f7\u753b\u50cf\u3001\u9ed8\u8ba4\u6a21\u677f\uff0c\u4ee5\u53ca\u8fd9\u6b21\u662f\u5426\u9501\u5b9a\u6a21\u677f\u3002</p>
        </div>
        <span class="step-state">Start</span>
      </li>
      <li class="step-card is-onboarding">
        <div class="step-index">02</div>
        <div class="step-copy">
          <strong>明确创建视频任务</strong>
          <p>点击“新建视频任务”或“创建并发送”。输入框的发送按钮只用于当前任务对话，不会自动创建新任务。</p>
        </div>
        <span class="step-state">Prompt</span>
      </li>
      <li class="step-card is-onboarding">
        <div class="step-index">03</div>
        <div class="step-copy">
          <strong>\u6309\u987a\u5e8f\u751f\u6210\u4ea7\u7269</strong>
          <p>\u4f9d\u6b21\u751f\u6210\u8ba1\u5212\u3001\u914d\u97f3\u548c\u6e32\u67d3\uff0c\u518d\u5230\u53f3\u4fa7\u5ba1\u9605\u533a\u68c0\u67e5\u4ea7\u7269\u3002</p>
        </div>
        <span class="step-state">Review</span>
      </li>
    `;
    return;
  }

  els.stepList.innerHTML = steps
    .map(
      (step, index) =>         `
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

function sectionText(sections = [], labels = []) {
  const normalizedLabels = labels.map((label) => String(label).toLowerCase());
  return (
    sections.find((section) => normalizedLabels.includes(String(section.label || "").toLowerCase()))?.text ||
    ""
  );
}

function buildScriptReviewModel(jobOrSections = []) {
  const job = Array.isArray(jobOrSections) ? null : jobOrSections;
  const sections = Array.isArray(jobOrSections) ? jobOrSections : Array.isArray(job?.scriptSections) ? job.scriptSections : [];
  const productionSections = sections.filter(
    (section) => !["account", "template", "instructions"].includes(String(section.label || "").toLowerCase()),
  );
  const hook = sectionText(sections, ["Hook"]) || productionSections[0]?.text || "";
  const body = sectionText(sections, ["Body"]) || productionSections[1]?.text || "";
  const close = sectionText(sections, ["Close"]) || productionSections[2]?.text || "";
  const voiceover = [hook, body, close].filter(Boolean).join("\n\n") || productionSections.map((section) => section.text).filter(Boolean).join("\n\n");
  const shotStructure = productionSections.length
    ? productionSections.map((section, index) => `${String(index + 1).padStart(2, "0")} ${section.label || "Scene"}：${section.text || ""}`).join("\n")
    : job?.preview?.shot || job?.renderCompositionId || "";
  return {
    job,
    sections,
    title: job?.title || job?.preview?.headline || "未命名脚本",
    hook: hook || "等待生成 Hook。",
    voiceover: voiceover || "生成计划后会展示口播脚本。",
    subtitleSummary: job?.preview?.subtitle || hook || "字幕摘要会在生成计划或配音后更新。",
    shotStructure: shotStructure || "镜头结构会跟随模板和脚本结构生成。",
  };
}

function renderScriptStructure(jobOrSections = []) {
  const review = buildScriptReviewModel(jobOrSections);
  const readiness = getJobReadiness(review.job);
  if (!review.sections.length) {
    els.scriptStructure.innerHTML = `
      <div class="panel-empty">
        <strong>\u8fd8\u6ca1\u6709\u811a\u672c\u7ed3\u6784</strong>
        <p>生成计划后，这里会展示标题、Hook、口播脚本、字幕摘要和镜头结构。脚本审阅模式会先停在这里。</p>
      </div>
    `;
    return;
  }

  els.scriptStructure.innerHTML = `
    <section class="script-review-panel">
      <div class="script-review-head">
        <div>
          <span class="eyebrow">Script Review</span>
          <h3>${escapeHtml(review.title)}</h3>
        </div>
        <div class="script-review-actions">
          <button class="secondary-button is-small" type="button" data-script-action="ai-rewrite">让 AI 修改脚本</button>
          <button class="primary-button is-small" type="button" data-script-action="continue" ${readiness.hasPlan ? "" : "disabled"}>继续配音并渲染</button>
        </div>
      </div>
      <div class="script-review-grid">
        <article class="structure-card script-review-card">
          <span>Title</span>
          <p>${escapeHtml(review.title)}</p>
        </article>
        <article class="structure-card script-review-card">
          <span>Hook</span>
          <p>${escapeHtml(review.hook)}</p>
        </article>
        <article class="structure-card script-review-card is-wide">
          <span>Voiceover Script</span>
          <p>${escapeHtml(review.voiceover)}</p>
        </article>
        <article class="structure-card script-review-card">
          <span>Subtitle Summary</span>
          <p>${escapeHtml(review.subtitleSummary)}</p>
        </article>
        <article class="structure-card script-review-card">
          <span>Shot Structure</span>
          <p>${escapeHtml(review.shotStructure)}</p>
        </article>
      </div>
    </section>
  `;
}

function renderLogs(lines = []) {
  if (!Array.isArray(lines) || !lines.length) {
    els.logStream.textContent = "\u8fd8\u6ca1\u6709\u65e5\u5fd7\u8f93\u51fa\u3002\u6267\u884c\u8ba1\u5212\u3001\u914d\u97f3\u6216\u6e32\u67d3\u540e\uff0c\u8fd9\u91cc\u4f1a\u663e\u793a\u5b9e\u65f6\u65e5\u5fd7\u3002";
    return;
  }
  els.logStream.textContent = lines.join("\n");
  els.logStream.scrollTop = els.logStream.scrollHeight;
}

function renderPreview(preview = EMPTY_PREVIEW, status = "idle") {
  const merged = {
    ...EMPTY_PREVIEW,
    ...(preview || {}),
  };
  const progress = Math.max(0, Math.min(1, Number(merged.progress || 0)));

  els.previewStatus.textContent = localizeJobStatus(status || "idle");
  els.episodeLabel.textContent = merged.episodeLabel || EMPTY_PREVIEW.episodeLabel;
  els.previewHeadline.textContent = merged.headline || EMPTY_PREVIEW.headline;
  els.previewSummary.textContent = merged.summary || EMPTY_PREVIEW.summary;
  els.subtitleBand.textContent = merged.subtitle || EMPTY_PREVIEW.subtitle;
  els.previewProgress.style.width = `${Math.round(progress * 100)}%`;
}

function renderPreviewMedia(job) {
  const preview = job?.preview || EMPTY_PREVIEW;
  const video = getArtifactItem(job, "video");
  const poster = getArtifactItem(job, "poster");
  const imageUrl = poster?.url || preview.imageUrl || EMPTY_PREVIEW.imageUrl;

  if (video?.exists && video.url) {
    if (els.previewVideo.src !== video.url) {
      els.previewVideo.src = video.url;
    }
    if (poster?.url) {
      els.previewVideo.setAttribute("poster", poster.url);
    }
    els.previewVideo.hidden = false;
    els.previewImage.hidden = true;
    els.previewImage.src = imageUrl;
    return;
  }

  els.previewVideo.pause();
  els.previewVideo.hidden = true;
  els.previewVideo.removeAttribute("src");
  els.previewVideo.load();
  els.previewImage.hidden = false;
  els.previewImage.src = imageUrl;
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

function renderAccountSelect(config) {
  const accounts = listSelectableAccounts(config.accountId);
  const options = accounts.length
    ? accounts
        .map((account) => {
          const archivedSuffix = account.archived ? " | \u5df2\u5f52\u6863" : "";
          return `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name || account.id)}${archivedSuffix}</option>`;
        })
        .join("")
    : `<option value="">\u6682\u65e0\u53ef\u7528\u8d26\u53f7</option>`;
  els.accountSelect.innerHTML = options;
  els.accountSelect.value = config.accountId || accounts[0]?.id || "";
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
  els.accountPlatformBadge.textContent = account?.archived
    ? `${platformLabel(account?.platform)} | \u5df2\u5f52\u6863`
    : platformLabel(account?.platform);
  els.editAccountButton.disabled = !account;
  els.archiveAccountButton.disabled = !account;
  els.deleteAccountButton.disabled = !account;
  els.archiveAccountButton.textContent = account?.archived ? "\u6062\u590d" : "\u5f52\u6863";
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
    sessionBound ? `Session\uff1a${sessionLabel}` : "Session\uff1a\u672a\u7ed1\u5b9a",
    job?.status ? `\u72b6\u6001\uff1a${localizeJobStatus(job.status)}` : null,
    job?.outputDir ? `\u8f93\u51fa\uff1a${job.outputDir}` : null,
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
  if (els.compositionLabel) {
    els.compositionLabel.textContent = config.compositionId || template?.compositionId || "-";
  }
  if (els.headerMetaChips) {
    els.headerMetaChips.innerHTML = [
      `${config.durationSec || 60}s`,
      config.aspectRatio || "9:16",
      `字幕 ${normalizeSubtitleFontSize(config.subtitleFontSize)}`,
      `颜色 ${normalizeSubtitleColor(config.subtitleColor)}`,
    ]
      .map((item) => `<span class="tiny-chip">${escapeHtml(item)}</span>`)
      .join("");
  }
  if (els.subtitleFontSizeInlineInput) {
    els.subtitleFontSizeInlineInput.value = String(normalizeSubtitleFontSize(config.subtitleFontSize));
  }

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
      const platformTags = Array.isArray(template.suitablePlatforms) ? template.suitablePlatforms : [];
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
          <div class="template-meta-row">
            <span>${escapeHtml(`${template.defaultDurationSec || 60}s`)}</span>
            <span>${escapeHtml(template.aspectRatio || "9:16")}</span>
            <span>${escapeHtml(platformTags.join(" / ") || "-")}</span>
          </div>
          <div class="chip-row">
            ${(template.tags || []).map((tag) => `<span class="tiny-chip">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </button>
      `;
    })
    .join("");
}

function renderTemplateGovernance(config) {
  const template = getTemplateById(config.templateId);
  if (!template) {
    if (els.templateVersionLabel) els.templateVersionLabel.textContent = "-";
    if (els.templatePublishLabel) els.templatePublishLabel.textContent = "-";
    if (els.templateOwnerLabel) els.templateOwnerLabel.textContent = "-";
    if (els.templateUpdatedLabel) els.templateUpdatedLabel.textContent = "-";
    if (els.templateDescriptionText) els.templateDescriptionText.textContent = "\u8bf7\u5148\u9009\u62e9\u4e00\u4e2a\u6a21\u677f\u3002";
    if (els.templatePathLabel) els.templatePathLabel.textContent = "data/templates";
    return;
  }
  if (els.templateVersionLabel) els.templateVersionLabel.textContent = template.version || "v1";
  if (els.templatePublishLabel) els.templatePublishLabel.textContent = localizePublishStatus(template.publishStatus);
  if (els.templateOwnerLabel) els.templateOwnerLabel.textContent = template.owner || "workspace";
  if (els.templateUpdatedLabel) els.templateUpdatedLabel.textContent = formatDateTime(template.updatedAt);
  if (els.templateDescriptionText) els.templateDescriptionText.textContent = template.description || template.summary || "\u6682\u65e0\u6a21\u677f\u8bf4\u660e\u3002";
  if (els.templatePathLabel) els.templatePathLabel.textContent = template.path || "data/templates";
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

function renderReplicationSelectors() {
  if (els.replicationAccountInput) {
    const current = els.replicationAccountInput.value || getCurrentConfig().accountId || listSelectableAccounts()[0]?.id || "";
    els.replicationAccountInput.innerHTML = listSelectableAccounts()
      .map((account) => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name || account.id)}</option>`)
      .join("");
    els.replicationAccountInput.value = state.accounts.some((account) => account.id === current) ? current : state.accounts[0]?.id || "";
  }
  if (els.replicationTemplateInput) {
    const current = els.replicationTemplateInput.value || getCurrentConfig().templateId || "auto";
    els.replicationTemplateInput.innerHTML = [
      `<option value="auto">自动推荐</option>`,
      ...state.templates.map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.title || template.id)}</option>`),
    ].join("");
    els.replicationTemplateInput.value =
      current === "auto" || state.templates.some((template) => template.id === current) ? current : "auto";
  }
}

function getViralReplicationJobs() {
  return ensureArray(state.jobs).filter((job) => job?.type === "viral_replication");
}

function replicationArtifactCard(job, key, label) {
  const item = getArtifactItem(job, key);
  const exists = Boolean(item?.exists);
  return `
    <article class="replication-artifact-card ${exists ? "is-ready" : "is-missing"}">
      <span>${escapeHtml(label)}</span>
      <strong>${exists ? "已生成" : "未生成"}</strong>
      <small>${escapeHtml(item?.path || "-")}</small>
      ${exists && item?.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">打开 JSON</a>` : ""}
    </article>
  `;
}

function renderReplicationStatusPanel(job = state.activeJob) {
  if (!els.replicationStatusPanel) return;
  const replicationJobs = getViralReplicationJobs();
  const active = job?.type === "viral_replication" ? job : replicationJobs[0] || null;
  if (!active) {
    els.replicationStatusPanel.innerHTML = `
      <div class="asset-empty">
        <span class="eyebrow">Replication Status</span>
        <h3>还没有爆款复刻任务</h3>
        <p>先上传参考爆款视频，再分析生成 analysis.json；也可以直接填写已有 analysis.json 路径后创建任务。</p>
      </div>
    `;
    return;
  }

  const replication = active.replication || {};
  const artifacts = [
    ["viralBreakdown", "viral_breakdown.json"],
    ["moduleMatchReport", "module_match_report.json"],
    ["replicationPlan", "replication_plan.json"],
    ["renderProps", "render-props.json"],
    ["compileReport", "compile_report.json"],
    ["copyRewrite", "copy_rewrite.json"],
    ["deliveryAssetManifest", "asset_manifest.json"],
    ["voiceoverPackage", "voiceover_package.json"],
    ["finalRenderProps", "render-props.final.json"],
    ["renderPackage", "render_package.json"],
    ["video", "output.mp4"],
  ];
  els.replicationStatusPanel.innerHTML = `
    <div class="card-heading">
      <div>
        <span class="eyebrow">Active Replication Job</span>
        <h3>${escapeHtml(active.title || active.id)}</h3>
      </div>
      <span class="mini-status">${escapeHtml(active.status || "draft")}</span>
    </div>
    <div class="replication-meta-grid">
      <div><span>任务 ID</span><strong>${escapeHtml(active.id)}</strong></div>
      <div><span>目标主题</span><strong>${escapeHtml(replication.targetTopic || active.topicTitle || active.prompt || "-")}</strong></div>
      <div><span>复刻强度</span><strong>${escapeHtml(replication.strength || "medium")}</strong></div>
      <div><span>参考分析</span><strong>${escapeHtml(replication.analysisPath || "-")}</strong></div>
    </div>
    <div class="replication-artifact-grid">
      ${artifacts.map(([key, label]) => replicationArtifactCard(active, key, label)).join("")}
    </div>
    <div class="replication-job-list">
      ${replicationJobs
        .slice(0, 6)
        .map(
          (item) => `
            <button type="button" class="${item.id === active.id ? "is-active" : ""}" data-replication-job-id="${escapeHtml(item.id)}">
              <strong>${escapeHtml(item.title || item.id)}</strong>
              <span>${escapeHtml(item.status || "draft")} / ${escapeHtml(formatDateTime(item.updatedAt))}</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderReplicationPage(job = state.activeJob) {
  renderReplicationSelectors();
  renderReplicationStatusPanel(job);
}

function getAssetSlots(job) {
  return ensureArray(job?.assetPlan?.slots);
}

function getAssetManifestItems(job) {
  return ensureArray(job?.assetManifest?.items);
}

function getAssetManifestItem(job, slotId) {
  return getAssetManifestItems(job).find((item) => item.slotId === slotId) || null;
}

function localizeAssetStatus(status = "") {
  const map = {
    suggested: "建议素材",
    approved: "已确认",
    generated: "AI 生成",
    searched: "网络素材",
    missing: "待绑定",
  };
  return map[status] || status || "待绑定";
}

function renderAssetWorkbench(job) {
  if (!els.assetWorkbench) return;
  if (!job || job.id === "__pending_job__") {
    els.assetWorkbench.innerHTML = `
      <div class="asset-empty">
        <span class="eyebrow">Asset Workbench</span>
        <h3>还没有当前任务素材清单</h3>
        <p>创建或恢复一个任务后，可以为模板槽位绑定本地素材。未绑定 session 也可以使用素材工作台。</p>
      </div>
    `;
    return;
  }

  const slots = getAssetSlots(job);
  const status = job.assetStatus || {};
  const localAssets = state.assets || [];
  const localChoices = localAssets.slice(0, 8);
  const hasPlan = slots.length > 0;
  const missingRequired = Number(status.missingRequiredCount || 0);
  const useAiImageAssets = Boolean(job.useAiImageAssets);
  const imageAssetModel = job.imageAssetModel || state.settings.imageAssetModel || "gpt-image-2-all";

  if (!hasPlan) {
    els.assetWorkbench.innerHTML = `
      <div class="asset-workbench-head">
        <div>
          <span class="eyebrow">Asset Workbench</span>
          <h3>生成素材清单</h3>
          <p>素材清单会根据当前任务模板建立槽位，并优先自动绑定 assets/images 里的本地素材。</p>
        </div>
        <button class="primary-button" type="button" data-asset-action="ensure-plan">生成素材清单</button>
      </div>
      <div class="asset-empty">
        <strong>当前还没有素材槽位</strong>
        <p>建议先生成计划，再刷新素材清单；也可以现在直接生成默认模板槽位。</p>
      </div>
    `;
    return;
  }

  const slotCards = slots
    .map((slot) => {
      const item = getAssetManifestItem(job, slot.id);
      const isBound = Boolean(item?.path || item?.renderSrc);
      const preview = item?.url
        ? `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.label || slot.label)}" />`
        : `<div class="asset-preview-placeholder">待绑定</div>`;
      const localButtons = localChoices
        .map((asset) => {
          const assetPath = asset.path || String(asset.url || "").replace(/^\/workspace\//, "");
          return `
            <button type="button" class="asset-source-button" data-asset-action="bind-local" data-slot-id="${escapeHtml(
              slot.id,
            )}" data-asset-path="${escapeHtml(assetPath)}">
              ${escapeHtml(asset.name)}
            </button>
          `;
        })
        .join("");
      return `
        <article class="asset-slot-card ${isBound ? "is-bound" : "is-missing"}">
          <div class="asset-slot-preview">${preview}</div>
          <div class="asset-slot-main">
            <div class="asset-slot-title">
              <div>
                <strong>${escapeHtml(slot.label || slot.id)}</strong>
                <span>${slot.required ? "必需" : "可选"} | ${escapeHtml(slot.type || "image")} | ${escapeHtml(
                  slot.targetPath || slot.id,
                )}</span>
              </div>
              <span class="mini-status">${escapeHtml(localizeAssetStatus(item?.status || (isBound ? "suggested" : "missing")))}</span>
            </div>
            <p>${escapeHtml(slot.prompt || "为当前画面提供可渲染素材。")}</p>
            <div class="asset-slot-meta">
              <span>来源：${escapeHtml(item?.source === "ai" ? "AI 新生成" : item?.sourceName || item?.source || "未绑定")}</span>
              <span>${item?.locked ? "已锁定" : "可替换"}</span>
              ${item?.promptPath ? `<span>Prompt：${escapeHtml(item.promptPath)}</span>` : ""}
            </div>
            <div class="asset-local-list">${localButtons || "<span>assets/images 里还没有可用素材。</span>"}</div>
            <div class="asset-actions">
              <button class="secondary-button is-small" type="button" data-asset-action="approve" data-slot-id="${escapeHtml(
                slot.id,
              )}" ${!isBound ? "disabled" : ""}>确认素材</button>
              <button class="secondary-button is-small" type="button" data-asset-action="toggle-lock" data-slot-id="${escapeHtml(
                slot.id,
              )}" ${!isBound ? "disabled" : ""}>${item?.locked ? "解锁" : "锁定"}</button>
              <button class="secondary-button is-small" type="button" data-asset-action="generate-ai" data-slot-id="${escapeHtml(
                slot.id,
              )}">AI 生成</button>
              <button class="secondary-button is-small" type="button" data-asset-action="web-placeholder" data-slot-id="${escapeHtml(
                slot.id,
              )}">网络获取</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  els.assetWorkbench.innerHTML = `
    <div class="asset-workbench-head">
      <div>
        <span class="eyebrow">Asset Workbench</span>
        <h3>模板素材槽位</h3>
        <p>渲染前会把已绑定素材写入 video_plan.json 和 Remotion props，必需素材缺失时会阻止渲染。</p>
      </div>
      <div class="asset-workbench-actions">
        <button class="secondary-button" type="button" data-asset-action="ensure-plan">刷新素材清单</button>
        <button class="primary-button" type="button" data-asset-action="generate-fresh">生成全新素材</button>
      </div>
    </div>
    <div class="asset-status-grid">
      <div><span>模式</span><strong>${escapeHtml(useAiImageAssets ? "图片模型" : "本地")}</strong></div>
      <div><span>槽位</span><strong>${Number(status.slotCount || slots.length)}</strong></div>
      <div><span>已绑定</span><strong>${Number(status.boundCount || 0)}</strong></div>
      <div><span>必需</span><strong>${Number(status.requiredCount || 0)}</strong></div>
      <div class="${missingRequired ? "is-warning" : ""}"><span>缺失必需</span><strong>${missingRequired}</strong></div>
      <div><span>已锁定</span><strong>${Number(status.lockedCount || 0)}</strong></div>
    </div>
    <div class="asset-mode-note">${escapeHtml(
      useAiImageAssets ? `useAiImageAssets: true / ${imageAssetModel}` : "useAiImageAssets: false / assets/images",
    )}</div>
    <div class="asset-slot-grid">${slotCards}</div>
  `;
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
  const defaultAction = item.isDefaultCover
    ? '<span class="artifact-flag">当前默认封面</span>'
    : `<button type="button" class="artifact-link artifact-button" data-poster-action="set-default">设为默认封面</button>`;
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
        <button type="button" class="artifact-link artifact-button" data-poster-action="copy-path" data-poster-path="${escapeHtml(
          item.path || "",
        )}">\u590d\u5236\u8def\u5f84</button>
        <button type="button" class="artifact-link artifact-button" data-poster-action="refresh">\u91cd\u65b0\u6293\u5e27</button>
        ${defaultAction}
      </div>
    </div>
  `;
}

function buildScreenQaCard(job, item) {
  const key = getScreenQaReportKey(job, item);
  const cached = state.screenQaReports[key];
  if (item?.exists && !cached) {
    loadScreenQaReport(job, item);
  }

  const report = cached?.report || null;
  const loading = Boolean(cached?.loading);
  const error = cached?.error || "";
  const textLeaks = Array.isArray(report?.textLeaks) ? report.textLeaks : [];
  const ocrLeaks = Array.isArray(report?.ocrLeaks) ? report.ocrLeaks : [];
  const warnings = Array.isArray(report?.warnings) ? report.warnings : [];
  const frameCount = Array.isArray(report?.frames) ? report.frames.length : 0;
  const leak = ocrLeaks[0] || textLeaks[0] || null;
  const status = !item?.exists
    ? "pending"
    : loading
      ? "loading"
      : error
        ? "warning"
        : report?.status === "failed"
          ? "failed"
          : report?.status === "passed"
            ? "passed"
            : "unknown";
  const statusLabel = {
    pending: "\u5f85\u751f\u6210",
    loading: "\u8bfb\u53d6\u4e2d",
    warning: "\u9700\u68c0\u67e5",
    failed: "\u5df2\u62e6\u622a",
    passed: "\u5df2\u901a\u8fc7",
    unknown: "\u672a\u77e5",
  }[status];
  const summary = !item?.exists
    ? "\u6e32\u67d3\u524d\u4f1a\u81ea\u52a8\u62bd\u53d6\u5173\u952e\u753b\u9762\u68c0\u67e5\u63d0\u793a\u8bcd\u6cc4\u6f0f\u3002"
    : loading
      ? "\u6b63\u5728\u8bfb\u53d6 screen-qa/report.json\u3002"
      : error
        ? error
        : leak
          ? `${leak.rule || "leak"} | ${leak.path || `frame ${leak.frame || "-"}`} | ${leak.text || ""}`
          : `frames ${frameCount || "-"} | text leaks ${textLeaks.length} | ocr leaks ${ocrLeaks.length} | warnings ${warnings.length}`;
  const action = item?.exists && item.url
    ? `<div class="artifact-actions"><a class="artifact-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">\u6253\u5f00\u62a5\u544a</a><a class="artifact-link" href="${escapeHtml(item.url)}" download="${escapeHtml(item.fileName || "report.json")}">\u4e0b\u8f7d</a></div>`
    : '<span class="artifact-link is-disabled">\u5f85\u6e32\u67d3</span>';

  return `
    <div class="artifact-qa-card is-${escapeHtml(status)}">
      <div class="artifact-qa-main">
        <span class="artifact-qa-dot"></span>
        <div class="artifact-copy">
          <strong>Screen QA</strong>
          <span>${escapeHtml(summary)}</span>
        </div>
      </div>
      <div class="artifact-qa-side">
        <span class="artifact-qa-status">${escapeHtml(statusLabel)}</span>
        ${action}
      </div>
    </div>
  `;
}

function buildConfigFromAccount(account, currentConfig = getCurrentConfig(), options = {}) {
  const patch = {
    accountId: account?.id || "",
    durationSec: account?.defaultDurationSec || currentConfig.durationSec,
    aspectRatio: account?.aspectRatio || currentConfig.aspectRatio,
  };

  if ((options.forceTemplate || !currentConfig.templateLocked) && account?.defaultTemplateId) {
    const defaultTemplate = getTemplateById(account.defaultTemplateId);
    patch.templateId = account.defaultTemplateId;
    patch.compositionId = defaultTemplate?.compositionId || account.defaultCompositionId || "";
  }

  return patch;
}

function accountHasPersistedWork(job) {
  if (!job) return false;
  const manifest = getArtifactManifest(job);
  return Boolean(
    manifest.plan?.exists ||
      manifest.subtitles?.exists ||
      manifest.audio?.exists ||
      manifest.video?.exists ||
      (Array.isArray(job.scriptSections) && job.scriptSections.length),
  );
}

function renderArtifactList(job) {
  const container = ensureArtifactListElement();
  if (!container) return;

  const manifest = getArtifactManifest(job);
  const poster = manifest.poster;
  const screenQa = manifest.screenQa;
  const items = ["planBrief", "plan", "assetPlan", "assetManifest", "voiceoverUnits", "subtitles", "alignment", "audio", "video"]
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

  container.innerHTML = `${buildPosterCard(poster)}${buildScreenQaCard(job, screenQa)}${rows}`;
}

function getDebugArtifactItems(job) {
  const manifest = getArtifactManifest(job);
  return [
    "request",
    "planBrief",
    "plan",
    "assetPlan",
    "assetManifest",
    "voiceoverUnits",
    "voiceoverText",
    "subtitles",
    "alignment",
    "renderProps",
    "screenQa",
    "poster",
    "audio",
    "video",
  ]
    .map((key) => manifest[key])
    .filter(Boolean);
}

function buildDebugDiagnosis(job) {
  const manifest = getArtifactManifest(job);
  const assetStatus = job?.assetStatus || {};
  const assetItems = ensureArray(job?.assetManifest?.items);
  const qaStatus = getHistoryQaStatus(job);
  const confirmedAssets = assetItems.filter((item) => item.status === "approved").length;
  const assetSummary = assetStatus.slotCount
    ? `${Number(assetStatus.boundCount || 0)}/${Number(assetStatus.slotCount || 0)} 已绑定，${confirmedAssets} 已确认`
    : "未生成素材清单";
  return [
    {
      label: "计划",
      status: manifest.plan?.exists ? "ready" : "missing",
      value: manifest.plan?.exists ? "已生成" : "未生成",
    },
    {
      label: "素材",
      status: Number(assetStatus.missingRequiredCount || 0) ? "warning" : assetItems.length ? "ready" : "missing",
      value: assetSummary,
    },
    {
      label: "配音",
      status: manifest.audio?.exists ? "ready" : manifest.voiceoverUnits?.exists ? "pending" : "missing",
      value: manifest.audio?.exists ? "音频已生成" : manifest.voiceoverUnits?.exists ? "口播已生成，待配音" : "未生成",
    },
    {
      label: "字幕",
      status: manifest.subtitles?.exists || manifest.alignment?.exists ? "ready" : "missing",
      value: manifest.alignment?.exists ? "已对齐" : manifest.subtitles?.exists ? "字幕已生成" : "未生成",
    },
    {
      label: "渲染",
      status: manifest.video?.exists ? "ready" : manifest.renderProps?.exists ? "pending" : "missing",
      value: manifest.video?.exists ? "MP4 已生成" : manifest.renderProps?.exists ? "参数已生成，待渲染" : "未生成",
    },
    {
      label: "QA",
      status: qaStatus === "passed" ? "ready" : qaStatus === "failed" ? "danger" : manifest.screenQa?.exists ? "warning" : "missing",
      value: localizeQaStatus(qaStatus),
    },
  ];
}

function buildDebugAssetCard(item) {
  const preview = item?.url
    ? `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.label || item.slotId || "素材")}" />`
    : `<div class="asset-preview-placeholder">无预览</div>`;
  const source = item?.source === "ai" ? "AI 新生成" : item?.source === "local" ? "本地素材" : item?.source || "未知来源";
  const promptLink = item?.promptPath
    ? `<a href="/workspace/${escapeHtml(item.promptPath)}" target="_blank" rel="noreferrer">Prompt</a>`
    : `<span>无 Prompt</span>`;
  const openLink = item?.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">打开</a>` : `<span>待生成</span>`;
  return `
    <article class="debug-asset-card">
      <div class="debug-asset-preview">${preview}</div>
      <div class="debug-asset-copy">
        <strong>${escapeHtml(item?.label || item?.slotId || "素材")}</strong>
        <span>${escapeHtml(source)} | ${escapeHtml(localizeAssetStatus(item?.status || "suggested"))}${item?.locked ? " | 已锁定" : ""}</span>
        <small>${escapeHtml(item?.targetPath || "-")}</small>
        <small>${escapeHtml(item?.path || item?.renderSrc || "-")}</small>
        <div class="debug-link-row">${openLink}${promptLink}</div>
      </div>
    </article>
  `;
}

function buildDebugArtifactRow(item) {
  const stateClass = item?.exists ? "is-ready" : "is-missing";
  const action = item?.exists && item?.url
    ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">打开</a>`
    : `<span>待生成</span>`;
  return `
    <div class="debug-artifact-row ${stateClass}">
      <div>
        <strong>${escapeHtml(item?.label || item?.key || "产物")}</strong>
        <span>${escapeHtml(item?.exists ? "已生成" : "未生成")} | ${escapeHtml(item?.path || "-")}</span>
      </div>
      ${action}
    </div>
  `;
}

function renderDebugAssetsPanel(job) {
  if (!els.debugAssetsPanel) return;
  els.debugAssetsPanel.hidden = !state.settings.showDebugAssets;
  if (els.debugAssetsStatus) {
    els.debugAssetsStatus.textContent = state.settings.showDebugAssets ? "显示中" : "隐藏";
  }
  if (!state.settings.showDebugAssets) return;

  const diagnosis = buildDebugDiagnosis(job);
  if (els.debugDiagnosisGrid) {
    els.debugDiagnosisGrid.innerHTML = diagnosis
      .map(
        (item) => `
          <div class="debug-diagnosis-card is-${escapeHtml(item.status)}">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
        `,
      )
      .join("");
  }

  const assetItems = ensureArray(job?.assetManifest?.items);
  if (els.debugAssetCount) els.debugAssetCount.textContent = String(assetItems.length);
  if (els.debugAssetGrid) {
    els.debugAssetGrid.innerHTML = assetItems.length
      ? assetItems.map(buildDebugAssetCard).join("")
      : '<div class="artifact-empty">还没有素材 manifest。先生成素材清单或点击“生成全新素材”。</div>';
  }

  const artifactItems = getDebugArtifactItems(job);
  if (els.debugArtifactCount) {
    els.debugArtifactCount.textContent = `${artifactItems.filter((item) => item.exists).length}/${artifactItems.length}`;
  }
  if (els.debugArtifactList) {
    els.debugArtifactList.innerHTML = artifactItems.length
      ? artifactItems.map(buildDebugArtifactRow).join("")
      : '<div class="artifact-empty">还没有工作流产物。</div>';
  }
}

function hasHistoryVideo(job) {
  if (typeof job?.hasVideo === "boolean") return job.hasVideo;
  const video = getArtifactItem(job, "video");
  return Boolean(video?.exists);
}

function getHistoryQaStatus(job) {
  const direct = String(job?.screenQaStatus || "").trim();
  if (direct) return direct;
  const item = getArtifactItem(job, "screenQa");
  if (!item?.exists) return "missing";
  const cached = getScreenQaCache(job);
  return cached.status || "unknown";
}

function localizeQaStatus(status = "") {
  const value = String(status || "missing").toLowerCase();
  const map = {
    passed: "已通过",
    failed: "QA 失败",
    loading: "读取中",
    error: "需检查",
    warning: "需检查",
    unknown: "未知",
    missing: "未生成",
  };
  return map[value] || value;
}

function getHistoryMeta(job) {
  const account = getAccountById(job.accountId);
  const template = getTemplateById(job.templateId);
  const qaStatus = getHistoryQaStatus(job);
  return {
    accountName: account?.name || job.accountId || "-",
    templateName: template?.title || job.templateId || "-",
    sessionLabel: job.codexSessionId ? `Session ${String(job.codexSessionId).slice(0, 8)}` : "未绑定",
    outputDir: job.outputDir || "data/jobs",
    hasVideo: hasHistoryVideo(job),
    qaStatus,
    qaLabel: localizeQaStatus(qaStatus),
    updatedAt: formatDateTime(job.updatedAt),
  };
}

function renderJobHistory() {
  const jobs = getVisibleJobs();
  if (!jobs.length) {
    els.jobHistoryList.innerHTML = `
      <div class="panel-empty">
        <strong>\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u4e0b\u6682\u65e0\u4efb\u52a1</strong>
        <p>\u53ef\u4ee5\u5207\u6362\u7b5b\u9009\u3001\u6062\u590d\u5386\u53f2\u4efb\u52a1\uff0c\u6216\u4ece\u5de6\u4fa7\u5bf9\u8bdd\u533a\u521b\u5efa\u65b0\u4efb\u52a1\u3002</p>
      </div>
    `;
    return;
  }
  els.jobHistoryList.innerHTML = jobs
    .map((job) => {
      const meta = getHistoryMeta(job);
      return `
        <article class="history-item ${job.id === state.activeJob?.id ? "is-selected" : ""} ${job.archived ? "is-archived" : ""}">
          <div class="history-item-head">
            <div>
              <span>${escapeHtml(meta.updatedAt)}</span>
              <strong>${escapeHtml(job.title || job.id)}</strong>
            </div>
            <div class="history-state-stack">
              <small class="history-state">${escapeHtml(localizeJobStatus(job.status || "unknown"))}</small>
              <small class="history-state is-${escapeHtml(meta.qaStatus)}">${escapeHtml(meta.qaLabel)}</small>
            </div>
          </div>
          <div class="history-detail-grid">
            <div><span>账号</span><strong>${escapeHtml(meta.accountName)}</strong></div>
            <div><span>模板</span><strong>${escapeHtml(meta.templateName)}</strong></div>
            <div><span>Session</span><strong>${escapeHtml(meta.sessionLabel)}</strong></div>
            <div><span>输出目录</span><strong>${escapeHtml(meta.outputDir)}</strong></div>
            <div><span>视频</span><strong>${meta.hasVideo ? "有视频" : "未生成"}</strong></div>
            <div><span>更新</span><strong>${escapeHtml(meta.updatedAt)}</strong></div>
          </div>
          <div class="history-row-actions">
            <button type="button" class="secondary-button is-small" data-history-action="restore" data-job-id="${escapeHtml(job.id)}">恢复为当前任务</button>
            <button type="button" class="secondary-button is-small is-danger" data-history-action="delete" data-job-id="${escapeHtml(job.id)}">删除历史任务</button>
          </div>
        </article>
      `;
    })
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
  const capabilities = getJobCapabilities(job);
  if (!job) {
    hints.push("\u5148\u9009\u62e9 session \u6216\u76f4\u63a5\u53d1\u7b2c\u4e00\u6761\u6d88\u606f\u521b\u5efa\u4efb\u52a1\u3002");
  } else if (!job.codexSessionId) {
    hints.push("\u5f53\u524d\u4efb\u52a1\u8fd8\u6ca1\u6709\u7ed1\u5b9a\u672c\u5730 session\u3002");
  }

  if (capabilities.reason) {
    hints.push(capabilities.reason);
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

  if (capabilities.qaExportBlocked) {
    hints.push(capabilities.exportReason);
  }

  const retryAction = getRetryActionForJob(job);
  const failedControls =
    job?.status === "failed" && capabilities.isRuntime
      ? `
        <button class="tiny-action-button" type="button" data-failed-job-action="retry-current">
          \u91cd\u8bd5\u5f53\u524d\u6b65\u9aa4\uff1a${escapeHtml(getPipelineActionLabel(retryAction))}
        </button>
        <button class="tiny-action-button is-strong" type="button" data-failed-job-action="restart-pipeline">
          \u4ece\u5934\u91cd\u65b0\u751f\u6210
        </button>
      `
      : "";
  els.actionHints.innerHTML = `${hints.map((hint) => `<span class="tiny-chip">${escapeHtml(hint)}</span>`).join("")}${failedControls}`;
}

function renderHistoryToolbar() {
  document.querySelectorAll("[data-history-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.historyFilter === state.historyFilter);
  });
  if (els.historySearchInput && els.historySearchInput.value !== state.historyQuery) {
    els.historySearchInput.value = state.historyQuery || "";
  }
  const job = state.activeJob;
  const canManage = Boolean(job?.id && job.id !== "__pending_job__" && job.source !== "session");
  const canRecover = Boolean(job?.id && job.id !== "__pending_job__" && job.source !== "session");
  if (els.archiveJobButton) {
    els.archiveJobButton.disabled = !canManage;
    els.archiveJobButton.textContent = job?.archived ? "\u6062\u590d\u4efb\u52a1" : "\u5f52\u6863\u4efb\u52a1";
  }
  if (els.recoverJobButton) {
    els.recoverJobButton.disabled = !canRecover;
  }
}

function buildRenderReviewItems(job, config) {
  const stepMap = indexSteps(job?.steps || []);
  const template = getTemplateById(config.templateId);
  return [
    {label: "\u8d26\u53f7", value: getAccountById(config.accountId)?.name || "\u672a\u9009\u62e9"},
    {label: "\u6a21\u677f", value: template?.title || config.templateId || "-"},
    {label: "Composition", value: config.compositionId || template?.compositionId || "-"},
    {label: "\u65f6\u957f / \u6bd4\u4f8b", value: `${config.durationSec || 60}s / ${config.aspectRatio || "9:16"}`},
    {label: "\u8ba1\u5212", value: stepMap["generate-plan"]?.status === "completed" ? "\u5df2\u5c31\u7eea" : "\u672a\u5c31\u7eea"},
    {label: "TTS", value: stepMap.tts?.status === "completed" ? "\u5df2\u5c31\u7eea" : "\u672a\u5c31\u7eea"},
    {label: "\u8f93\u51fa", value: job?.outputDir || "data/jobs"},
    {
      label: "\u8ba1\u5212\u6765\u6e90",
      value: job?.planSource === "local-fallback" ? "\u672c\u5730 fallback" : "\u7ed3\u6784\u5316\u8ba1\u5212",
    },
  ];
}

function closeRenderConfirmModal(confirmed = false) {
  if (els.renderConfirmModal) {
    els.renderConfirmModal.hidden = true;
  }
  const resolver = state.renderConfirmResolver;
  state.renderConfirmResolver = null;
  if (resolver) resolver(Boolean(confirmed));
}

function openRenderConfirmModal() {
  if (!state.activeJob) return Promise.resolve(false);
  const config = getCurrentConfig();
  const items = buildRenderReviewItems(state.activeJob, config);
  if (els.renderConfirmSummary) {
    const fallbackText =
      state.activeJob.planSource === "local-fallback"
        ? "Codex 额度不可用，本次计划来自本地 fallback。请确认文案后再渲染。"
        : "请确认脚本、配音和输出目录，再开始渲染。";
    els.renderConfirmSummary.textContent = fallbackText;
  }
  if (els.renderConfirmGrid) {
    els.renderConfirmGrid.innerHTML = items
      .map(
        (item) => `
          <article class="stat-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </article>
        `,
      )
      .join("");
  }
  if (els.renderConfirmModal) {
    els.renderConfirmModal.hidden = false;
  }
  return new Promise((resolve) => {
    state.renderConfirmResolver = resolve;
  });
}

function renderTaskCreateModal(options = {}) {
  if (!els.taskCreateModal) return;
  const config = getDraftConfig();
  const mode = els.taskCreateModeInput?.value || "single";
  const accounts = listSelectableAccounts(config.accountId);
  const selected = new Set(
    state.taskCreateAccountIds.length
      ? state.taskCreateAccountIds
      : [config.accountId || accounts[0]?.id || ""].filter(Boolean),
  );

  if (options.resetPrompt && els.taskCreatePromptInput) {
    els.taskCreatePromptInput.value = "";
  }

  if (els.taskCreateTemplateInput) {
    const currentTemplateId = els.taskCreateTemplateInput.value || config.templateId;
    els.taskCreateTemplateInput.innerHTML = state.templates
      .map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.title || template.id)}</option>`)
      .join("");
    els.taskCreateTemplateInput.value =
      state.templates.some((template) => template.id === currentTemplateId) ? currentTemplateId : config.templateId || state.templates[0]?.id || "";
  }

  if (els.taskCreateSessionInput) {
    const currentSessionId = els.taskCreateSessionInput.value || state.selectedSessionId || "";
    els.taskCreateSessionInput.innerHTML = [
      '<option value="">不绑定，新建任务上下文</option>',
      ...state.sessions.map(
        (session) => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.threadName || session.id)}${session.updatedAt ? ` | ${escapeHtml(formatDateTime(session.updatedAt))}` : ""}</option>`,
      ),
    ].join("");
    els.taskCreateSessionInput.value = state.sessions.some((session) => session.id === currentSessionId) ? currentSessionId : "";
  }

  if (els.taskCreateSessionField) {
    els.taskCreateSessionField.hidden = mode === "batch";
  }
  if (els.taskCreateAfterInput) {
    const fullOption = els.taskCreateAfterInput.querySelector('option[value="full"]');
    if (fullOption) fullOption.disabled = mode === "batch";
    if (mode === "batch" && els.taskCreateAfterInput.value === "full") {
      els.taskCreateAfterInput.value = "plan";
    }
  }
  if (els.taskCreateGenerationModeInput) {
    els.taskCreateGenerationModeInput.value = state.settings.generationMode || "review";
  }
  if (els.taskCreateAiImageAssetsInput) {
    els.taskCreateAiImageAssetsInput.checked = Boolean(state.settings.useAiImageAssets);
  }
  if (els.taskCreateSubtitleFontSizeInput) {
    els.taskCreateSubtitleFontSizeInput.value = String(normalizeSubtitleFontSize(state.settings.subtitleFontSize));
  }
  if (els.taskCreateSubtitleColorInput) {
    els.taskCreateSubtitleColorInput.value = normalizeSubtitleColor(state.settings.subtitleColor);
  }
  if (els.taskCreateAccountHint) {
    els.taskCreateAccountHint.textContent =
      mode === "batch" ? "批量任务会给每个选中的账号创建一条 job。" : "单条视频会使用第一个选中的账号。";
  }

  if (els.taskCreateAccountGrid) {
    els.taskCreateAccountGrid.innerHTML = accounts
      .map((account) => {
        const template = getTemplateById(account.defaultTemplateId);
        return `
          <label class="task-create-account ${selected.has(account.id) ? "is-selected" : ""}">
            <input type="checkbox" data-task-account-id="${escapeHtml(account.id)}" ${selected.has(account.id) ? "checked" : ""} />
            <span>
              <strong>${escapeHtml(account.name || account.id)}</strong>
              <small>${escapeHtml(platformLabel(account.platform))} / ${escapeHtml(template?.title || account.defaultTemplateId || "默认模板")}</small>
            </span>
          </label>
        `;
      })
      .join("");

    els.taskCreateAccountGrid.querySelectorAll("[data-task-account-id]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const accountId = checkbox.dataset.taskAccountId || "";
        if (mode === "single") {
          state.taskCreateAccountIds = checkbox.checked ? [accountId] : [];
        } else {
          const next = new Set(state.taskCreateAccountIds);
          if (checkbox.checked) next.add(accountId);
          else next.delete(accountId);
          state.taskCreateAccountIds = [...next].filter(Boolean);
        }
        renderTaskCreateModal();
      });
    });
  }
}

function openTaskCreateModal(options = {}) {
  const config = getDraftConfig();
  state.taskCreateAccountIds = [config.accountId || listSelectableAccounts()[0]?.id || ""].filter(Boolean);
  if (els.taskCreateModeInput) els.taskCreateModeInput.value = "single";
  if (els.taskCreateAfterInput) els.taskCreateAfterInput.value = "none";
  if (els.taskCreateGenerationModeInput) els.taskCreateGenerationModeInput.value = state.settings.generationMode || "review";
  if (els.taskCreateSubtitleFontSizeInput) {
    els.taskCreateSubtitleFontSizeInput.value = String(normalizeSubtitleFontSize(state.settings.subtitleFontSize));
  }
  if (els.taskCreateSubtitleColorInput) {
    els.taskCreateSubtitleColorInput.value = normalizeSubtitleColor(state.settings.subtitleColor);
  }
  if (els.taskCreateAiImageAssetsInput) els.taskCreateAiImageAssetsInput.checked = Boolean(state.settings.useAiImageAssets);
  renderTaskCreateModal({resetPrompt: options.resetPrompt !== false});
  if (options.prompt && els.taskCreatePromptInput) {
    els.taskCreatePromptInput.value = options.prompt;
  }
  if (els.taskCreateModal) els.taskCreateModal.hidden = false;
  window.setTimeout(() => els.taskCreatePromptInput?.focus(), 0);
}

function closeTaskCreateModal() {
  if (els.taskCreateModal) els.taskCreateModal.hidden = true;
}

function validateTaskCreationSelection(accountIds = [], templateId = "") {
  const selectedAccountIds = ensureStringList(accountIds);
  if (!selectedAccountIds.length || !selectedAccountIds.some((accountId) => getAccountById(accountId))) {
    throw new Error("Task account is required");
  }
  if (!String(templateId || "").trim() || !getTemplateById(templateId)) {
    throw new Error("Task template is required");
  }
}

function getTaskCreateConfig(accountId) {
  const current = getDraftConfig();
  const account = getAccountById(accountId) || getCurrentAccount() || listSelectableAccounts()[0] || null;
  const templateId = els.taskCreateTemplateInput?.value || current.templateId || account?.defaultTemplateId || state.templates[0]?.id || "";
  const template = getTemplateById(templateId);
  return normalizeConfig({
    ...current,
    ...buildConfigFromAccount(account, current, {forceTemplate: true}),
    accountId: account?.id || "",
    templateId,
    compositionId: template?.compositionId || account?.defaultCompositionId || current.compositionId || "",
    templateLocked: true,
    subtitleFontSize: normalizeSubtitleFontSize(els.taskCreateSubtitleFontSizeInput?.value || state.settings.subtitleFontSize),
    subtitleColor: normalizeSubtitleColor(els.taskCreateSubtitleColorInput?.value || state.settings.subtitleColor),
    useAiImageAssets: Boolean(els.taskCreateAiImageAssetsInput?.checked),
    imageAssetModel: state.settings.imageAssetModel || "gpt-image-2-all",
  });
}

function selectCreatedJob(job) {
  renderJob(job);
  bindDynamicLists();
  if (job?.id) connectToEvents(job.id);
}

async function createSingleTaskFromModal(prompt) {
  const accountId = state.taskCreateAccountIds[0] || getCurrentConfig().accountId;
  validateTaskCreationSelection([accountId], els.taskCreateTemplateInput?.value || getDraftConfig().templateId);
  const config = getTaskCreateConfig(accountId);
  const sessionId = String(els.taskCreateSessionInput?.value || "").trim();
  let job;

  if (sessionId) {
    job = await requestJson("/api/jobs", {
      method: "POST",
      body: JSON.stringify({prompt, sessionId, config}),
    });
    selectCreatedJob(job);
  } else {
    job = await requestJson("/api/jobs", {
      method: "POST",
      body: JSON.stringify({prompt, config}),
    });
    selectCreatedJob(job);
  }

  await syncCollections();
  return job;
}

async function createBatchTaskFromModal(prompt) {
  const selectedAccountIds = state.taskCreateAccountIds.filter(Boolean);
  validateTaskCreationSelection(selectedAccountIds, els.taskCreateTemplateInput?.value || getDraftConfig().templateId);
  if (!selectedAccountIds.length) throw new Error("Batch requires at least one active account");
  const config = getTaskCreateConfig(selectedAccountIds[0]);
  const useAiImageAssets = Boolean(els.taskCreateAiImageAssetsInput?.checked);
  const payload = await requestJson("/api/batches", {
    method: "POST",
    body: JSON.stringify({
      topic: prompt,
      campaignId: getSelectedCampaign()?.id || "",
      activityId: getSelectedActivity()?.id || "",
      topicId: state.selectedTopicId || "",
      topicBrief: getSelectedTopic()?.brief || "",
      accountIds: selectedAccountIds,
      templateId: config.templateId,
      durationSec: config.durationSec,
      aspectRatio: config.aspectRatio,
      subtitleFontSize: config.subtitleFontSize,
      subtitleColor: config.subtitleColor,
      templateLocked: true,
      activePresetIds: config.activePresetIds,
      openInstruction: config.openInstruction,
      useAiImageAssets,
      imageAssetModel: state.settings.imageAssetModel || "gpt-image-2-all",
      autoRetry: true,
      maxAutoRetries: 1,
    }),
  });

  (payload.jobs || []).forEach(mergeJob);
  await reloadScaleCollections();
  const firstJob = payload.jobs?.[0] || null;
  if (firstJob?.id) selectCreatedJob(firstJob);
  return payload;
}

async function createTaskFromModal() {
  const prompt = String(els.taskCreatePromptInput?.value || "").trim();
  if (!prompt) {
    reportError("", new Error("Task prompt is required"));
    els.taskCreatePromptInput?.focus();
    return null;
  }
  const mode = els.taskCreateModeInput?.value || "single";
  const afterAction = els.taskCreateAfterInput?.value || "none";
  updateGenerationMode(els.taskCreateGenerationModeInput?.value || state.settings.generationMode || "review", {persist: true});
  state.settings = {
    ...state.settings,
    useAiImageAssets: Boolean(els.taskCreateAiImageAssetsInput?.checked),
    imageAssetModel: state.settings.imageAssetModel || "gpt-image-2-all",
  };
  saveSettings();
  setBusy(true, "create-task-modal");
  setBanner("正在创建视频任务...", "info");
  let result = null;
  try {
    result = mode === "batch" ? await createBatchTaskFromModal(prompt) : await createSingleTaskFromModal(prompt);
    closeTaskCreateModal();
    setBanner(mode === "batch" ? "批量任务已创建。" : "视频任务已创建。", "success");
    showToast(mode === "batch" ? "批量任务已创建" : "视频任务已创建", "success");
  } catch (error) {
    reportError("创建视频任务失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
  if (mode === "batch" && result?.batch?.id && (afterAction === "plan" || afterAction === "full")) {
    await runBatchAction(result.batch.id, "generate-plan");
  }
  if (mode !== "batch" && afterAction === "plan") {
    await runAction("generate-plan");
  }
  if (mode !== "batch" && afterAction === "full") {
    await runFullPipelineStable();
  }
  return result;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return window.btoa(binary);
}

async function uploadReplicationReferenceVideo() {
  const file = els.replicationVideoInput?.files?.[0] || null;
  if (!file) {
    throw new Error("请先选择一个 MP4 参考视频。");
  }
  if (!/\.mp4$/i.test(file.name || "")) {
    throw new Error("第一版上传入口只接受 MP4 文件。");
  }

  setBusy(true, "upload-replication-video");
  setBanner("正在上传参考爆款视频...", "info");
  try {
    const dataBase64 = await arrayBufferToBase64(await file.arrayBuffer());
    const payload = await requestJson("/api/replication/uploads", {
      method: "POST",
      timeoutMs: 120000,
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "video/mp4",
        dataBase64,
        title: String(els.replicationReferenceTitleInput?.value || "").trim(),
        description: String(els.replicationReferenceDescriptionInput?.value || "").trim(),
        platform: String(els.replicationReferencePlatformInput?.value || "local").trim(),
        language: "zh-CN",
      }),
    });
    state.replicationUpload = payload;
    if (els.replicationAnalysisInput) els.replicationAnalysisInput.value = payload.analysisPath || "";
    if (els.replicationSummaryInput) els.replicationSummaryInput.value = payload.summaryPath || "";
    if (els.replicationTopicInput && !els.replicationTopicInput.value.trim()) {
      els.replicationTopicInput.value = payload.title || payload.sourceId || "";
    }
    setBanner("参考视频已上传，下一步点击“分析参考视频”。", "success");
    showToast("参考视频已上传", "success");
    renderReplicationStatusPanel(state.activeJob);
    return payload;
  } catch (error) {
    reportError("上传参考视频失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

function readReplicationForm() {
  const topic = String(els.replicationTopicInput?.value || "").trim();
  const analysisPath = String(els.replicationAnalysisInput?.value || "").trim();
  const summaryPath = String(els.replicationSummaryInput?.value || "").trim();
  const sourceId = String(state.replicationUpload?.sourceId || state.activeJob?.replication?.sourceId || "").trim();
  if (!topic) throw new Error("目标主题不能为空");
  if (!analysisPath && !sourceId) throw new Error("请先上传参考视频，或填写已有 analysis.json 路径。");
  const providerOrder = String(els.replicationProviderInput?.value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const accountId = String(els.replicationAccountInput?.value || getCurrentConfig().accountId || "").trim();
  const templateId = String(els.replicationTemplateInput?.value || "auto").trim() || "auto";
  return {
    prompt: topic,
    config: {
      type: "viral_replication",
      accountId,
      templateId: templateId === "auto" ? getCurrentConfig().templateId || "new_signals" : templateId,
      templateLocked: templateId !== "auto",
      useAiImageAssets: Boolean(state.settings.useAiImageAssets),
      imageAssetModel: state.settings.imageAssetModel || "gpt-image-2-all",
      replication: {
        sourceId,
        targetTopic: topic,
        analysisPath,
        summaryPath,
        strength: String(els.replicationStrengthInput?.value || "medium"),
        templateId,
        styleVariant: "auto",
        copyVariant: String(els.replicationCopyVariantInput?.value || "sharp_contrarian").trim() || "sharp_contrarian",
        deliveryMode: "draft",
        providerOrder,
      },
    },
  };
}

async function createReplicationJobFromPage() {
  setBusy(true, "create-replication");
  setBanner("正在创建爆款复刻任务...", "info");
  try {
    const payload = readReplicationForm();
    const job = await requestJson("/api/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    selectCreatedJob(job);
    await syncCollections();
    openWorkbenchSection("replication");
    setBanner("爆款复刻任务已创建。", "success");
    showToast("爆款复刻任务已创建", "success");
    return job;
  } catch (error) {
    reportError("创建爆款复刻任务失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function analyzeReplicationReferenceForActiveJob() {
  let job = state.activeJob?.type === "viral_replication" ? state.activeJob : null;
  if (!job) {
    job = await createReplicationJobFromPage();
  }
  if (!job?.id) return null;

  setBusy(true, "analyze-replication-reference");
  setBanner("正在分析参考视频，生成 analysis.json...", "info");
  try {
    const updated = await requestJson(`/api/jobs/${encodeURIComponent(job.id)}/actions/analyze-reference`, {
      method: "POST",
      timeoutMs: 1800000,
    });
    renderJob(updated);
    if (els.replicationAnalysisInput) els.replicationAnalysisInput.value = updated.replication?.analysisPath || "";
    if (els.replicationSummaryInput) els.replicationSummaryInput.value = updated.replication?.summaryPath || "";
    bindDynamicLists();
    await syncCollections();
    openWorkbenchSection("replication");
    setBanner("参考视频分析完成，可以运行复刻 Pipeline。", "success");
    showToast("参考视频分析完成", "success");
    return updated;
  } catch (error) {
    reportError("分析参考视频失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function runReplicationPipelineForActiveJob() {
  let job = state.activeJob?.type === "viral_replication" ? state.activeJob : null;
  if (!job) {
    job = await createReplicationJobFromPage();
  }
  if (!job?.id) return;
  if (!job.replication?.analysisPath && job.replication?.sourceId) {
    job = await analyzeReplicationReferenceForActiveJob();
  }
  setBusy(true, "run-replication");
  setBanner("正在运行爆款复刻 pipeline...", "info");
  try {
    const updated = await requestJson(`/api/jobs/${encodeURIComponent(job.id)}/actions/run-replication`, {
      method: "POST",
    });
    renderJob(updated);
    bindDynamicLists();
    await syncCollections();
    openWorkbenchSection("replication");
    setBanner("爆款复刻计划已生成。", "success");
    showToast("复刻 pipeline 已完成", "success");
  } catch (error) {
    reportError("运行爆款复刻 pipeline 失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function runReplicationDeliveryForActiveJob() {
  let job = state.activeJob?.type === "viral_replication" ? state.activeJob : null;
  if (!job) {
    job = await createReplicationJobFromPage();
  }
  if (!job?.id) return;
  if (!job.replication?.analysisPath && job.replication?.sourceId) {
    job = await analyzeReplicationReferenceForActiveJob();
  }
  setBusy(true, "run-replication-delivery");
  setBanner("正在生成复刻成片：计划 -> 文案 -> 素材 -> 配音 -> 渲染...", "info");
  try {
    const updated = await requestJson(`/api/jobs/${encodeURIComponent(job.id)}/actions/run-replication-delivery`, {
      method: "POST",
      timeoutMs: 1800000,
    });
    renderJob(updated);
    bindDynamicLists();
    await syncCollections();
    openWorkbenchSection("replication");
    setBanner("复刻成片已生成。", "success");
    showToast("复刻成片已生成", "success");
  } catch (error) {
    reportError("生成复刻成片失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

function selectLatestReplicationJob() {
  const job = getViralReplicationJobs()[0] || null;
  if (!job) {
    showToast("还没有爆款复刻任务", "warning");
    return;
  }
  renderJob(job);
  bindDynamicLists();
  openWorkbenchSection("replication");
}

function setActionState() {
  const capabilities = getJobCapabilities(state.activeJob);
  const disabledReason = capabilities.reason || "";
  els.generatePlanButton.disabled = !capabilities.canPlan;
  els.generatePlanButton.title = capabilities.canPlan ? "" : capabilities.actionReasons?.["generate-plan"] || disabledReason;
  els.ttsButton.disabled = !capabilities.canTts;
  els.ttsButton.title = capabilities.canTts ? "" : capabilities.actionReasons?.tts || disabledReason;
  els.renderButton.disabled = !capabilities.canRender;
  els.renderButton.title = capabilities.canRender ? "" : capabilities.actionReasons?.render || disabledReason;
  if (els.runAllButton) {
    els.runAllButton.disabled = !capabilities.canRunAll;
    els.runAllButton.title = capabilities.canRunAll ? "" : capabilities.actionReasons?.["run-all"] || disabledReason;
  }
  if (els.exportButton) {
    els.exportButton.disabled = !capabilities.canExport;
    els.exportButton.title = capabilities.canExport ? "" : capabilities.exportReason;
  }
}

function renderEmptyJob() {
  state.activeJob = null;
  if (!state.busyReason) {
    syncSessionUiFromJob(null);
  }
  const config = getCurrentConfig();
  renderProject();
  renderStats();
  renderProductionStatus(null);
  renderAccountSelect(config);
  renderTemplateSelect(config);
  renderHeader(config, null);
  renderAccountProfile(config);
  renderInstructionArea(config);
  renderMessages([]);
  renderSteps([]);
  renderPipelineGuide(null);
  renderScriptStructure(null);
  renderLogs([]);
  renderPreview(EMPTY_PREVIEW, "idle");
  renderPreviewMedia(null);
  renderReviewCards(null, config);
  enhanceReviewCards(null, config);
  renderTemplateGovernance(config);
  renderTemplateGallery(config);
  renderScaleTools(config);
  renderJobHistory();
  renderHistoryToolbar();
  renderSessionSelect();
  renderSessionList();
  renderAssetWorkbench(null);
  renderResources();
  renderReplicationPage(null);
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
  renderStats();
  renderProductionStatus(job);
  renderAccountSelect(getDraftConfig());
  renderTemplateSelect(getDraftConfig());
  renderHeader(config, job);
  renderAccountProfile(config);
  renderInstructionArea(config);
  renderMessages(job.messages || [], job.pendingAssistantText || "");
  renderSteps(job.steps || []);
  renderPipelineGuide(job);
  renderScriptStructure(job);
  renderLogs(job.logs || []);
  renderPreview(job.preview || EMPTY_PREVIEW, job.status || "idle");
  renderPreviewMedia(job);
  renderReviewCards(job, config);
  renderDebugAssetsPanel(job);
  enhanceReviewCards(job, config);
  renderTemplateGovernance(config);
  renderTemplateGallery(config);
  renderScaleTools(getDraftConfig());
  renderJobHistory();
  renderHistoryToolbar();
  renderSessionSelect();
  renderSessionList();
  renderAssetWorkbench(job);
  renderResources();
  renderReplicationPage(job);
  renderActionHints(job);
  setActionState();
}

function applyAssetPayload(payload = {}) {
  if (payload.localAssets) state.assets = payload.localAssets;
  const nextJob = payload.job || state.activeJob;
  if (!nextJob) return;
  if (payload.assetPlan) nextJob.assetPlan = payload.assetPlan;
  if (payload.assetManifest) nextJob.assetManifest = payload.assetManifest;
  if (payload.assetStatus) nextJob.assetStatus = payload.assetStatus;
  renderJob(nextJob);
  bindDynamicLists();
}

async function ensureAssetPlanForActiveJob() {
  if (!state.activeJob?.id) {
    showToast("请先创建或恢复一个任务。", "warning");
    return;
  }
  setBusy(true, "asset-plan");
  try {
    const payload = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/assets/plan`, {method: "POST"});
    applyAssetPayload(payload);
    showToast("素材清单已刷新。", "success");
  } catch (error) {
    reportError("素材清单生成失败", error);
  } finally {
    setBusy(false);
  }
}

async function bindLocalAssetToSlot(slotId, assetPath) {
  if (!state.activeJob?.id || !slotId || !assetPath) {
    showToast("缺少任务或素材槽位。", "warning");
    return;
  }
  setBusy(true, "asset-bind");
  try {
    const payload = await requestJson(
      `/api/jobs/${encodeURIComponent(state.activeJob.id)}/assets/${encodeURIComponent(slotId)}/bind`,
      {
        method: "POST",
        body: JSON.stringify({assetPath, status: "approved"}),
      },
    );
    applyAssetPayload(payload);
    showToast("本地素材已绑定。", "success");
  } catch (error) {
    reportError("素材绑定失败", error);
  } finally {
    setBusy(false);
  }
}

async function updateAssetSlot(slotId, patch = {}) {
  if (!state.activeJob?.id || !slotId) {
    showToast("缺少任务或素材槽位。", "warning");
    return;
  }
  setBusy(true, "asset-update");
  try {
    const payload = await requestJson(
      `/api/jobs/${encodeURIComponent(state.activeJob.id)}/assets/${encodeURIComponent(slotId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      },
    );
    applyAssetPayload(payload);
    showToast("素材状态已更新。", "success");
  } catch (error) {
    reportError("素材状态更新失败", error);
  } finally {
    setBusy(false);
  }
}

async function generateAiAssetForSlot(slotId, options = {}) {
  if (!state.activeJob?.id || !slotId) {
    showToast("缺少任务或素材槽位。", "warning");
    return;
  }
  setBusy(true, "asset-generate");
  try {
    const payload = await requestJson(
      `/api/jobs/${encodeURIComponent(state.activeJob.id)}/assets/${encodeURIComponent(slotId)}/generate`,
      {
        method: "POST",
        body: JSON.stringify({
          force: Boolean(options.force),
          status: "suggested",
          provider: "openai",
          model: state.activeJob.imageAssetModel || state.settings.imageAssetModel || "gpt-image-2-all",
        }),
      },
    );
    applyAssetPayload(payload);
    showToast("AI 素材已生成，请预览后确认。", "success");
  } catch (error) {
    reportError("AI 素材生成失败", error);
  } finally {
    setBusy(false);
  }
}

async function generateFreshAssetsForActiveJob(options = {}) {
  if (!state.activeJob?.id) {
    showToast("请先创建或恢复一个任务。", "warning");
    return;
  }
  setBusy(true, "asset-generate-all");
  try {
    const payload = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/assets/generate-fresh`, {
      method: "POST",
      body: JSON.stringify({
        force: Boolean(options.force),
        status: "suggested",
        provider: "openai",
        model: state.activeJob.imageAssetModel || state.settings.imageAssetModel || "gpt-image-2-all",
      }),
    });
    applyAssetPayload(payload);
    showToast("全新素材已生成，请逐项确认或锁定。", "success");
  } catch (error) {
    reportError("全新素材生成失败", error);
  } finally {
    setBusy(false);
  }
}

function bindDynamicLists() {
  els.sessionList.querySelectorAll("[data-session-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const sessionId = button.dataset.sessionId;
      if (sessionId) attachSession(sessionId).catch(console.error);
    });
  });

  els.jobHistoryList.querySelectorAll("[data-history-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = button.dataset.jobId;
      const action = button.dataset.historyAction || "restore";
      if (!jobId) return;
      if (action === "delete") {
        deleteHistoryJob(jobId).catch(console.error);
        return;
      }
      selectJob(jobId).catch(console.error);
    });
  });

  els.batchList?.querySelectorAll("[data-batch-job-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = button.dataset.batchJobId;
      if (jobId) selectJob(jobId).catch(console.error);
    });
  });

  els.retryQueueList?.querySelectorAll("[data-batch-job-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = button.dataset.batchJobId;
      if (jobId) selectJob(jobId).catch(console.error);
    });
  });

  els.replicationStatusPanel?.querySelectorAll("[data-replication-job-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = button.dataset.replicationJobId;
      if (jobId) selectJob(jobId).then(() => openWorkbenchSection("replication")).catch(console.error);
    });
  });

  els.actionHints?.querySelectorAll("[data-failed-job-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.failedJobAction;
      if (action === "retry-current") {
        retryFailedCurrentStep().catch(console.error);
      } else if (action === "restart-pipeline") {
        restartFailedJobFromHead().catch(console.error);
      }
    });
  });

  els.pipelineGuide?.querySelectorAll("[data-next-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.nextAction;
      if (!action) return;
      if (action === "new-task") {
        openTaskCreateModal();
        return;
      }
      if (action === "open-session-drawer") {
        if (els.sessionDrawer) {
          state.sessionDrawerOpen = true;
          els.sessionDrawer.hidden = false;
        }
        if (els.toggleSessionDrawerButton) {
          els.toggleSessionDrawerButton.classList.add("is-open");
        }
        return;
      }
      if (action === "generate-plan" || action === "tts" || action === "render") {
        runAction(action).catch(console.error);
        return;
      }
      if (action === "open-script-ai") {
        openScriptAiModal();
        return;
      }
      if (action === "retry-current") {
        retryFailedCurrentStep().catch(console.error);
        return;
      }
      if (action === "restart-pipeline") {
        restartFailedJobFromHead().catch(console.error);
        return;
      }
      if (action === "export") {
        els.exportButton?.click();
        return;
      }
    });
  });

  els.scriptStructure?.querySelectorAll("[data-script-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.scriptAction;
      if (action === "ai-rewrite") {
        openScriptAiModal();
      } else if (action === "continue") {
        continueAfterScriptReview().catch(console.error);
      }
    });
  });

  els.assetWorkbench?.querySelectorAll("[data-asset-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.busyReason) return;
      const action = button.dataset.assetAction;
      const slotId = button.dataset.slotId || "";
      if (action === "ensure-plan") {
        ensureAssetPlanForActiveJob().catch(console.error);
        return;
      }
      if (action === "generate-fresh") {
        generateFreshAssetsForActiveJob().catch(console.error);
        return;
      }
      if (action === "bind-local") {
        bindLocalAssetToSlot(slotId, button.dataset.assetPath || "").catch(console.error);
        return;
      }
      if (action === "approve") {
        updateAssetSlot(slotId, {status: "approved"}).catch(console.error);
        return;
      }
      if (action === "toggle-lock") {
        const item = getAssetManifestItem(state.activeJob, slotId);
        updateAssetSlot(slotId, {locked: !item?.locked}).catch(console.error);
        return;
      }
      if (action === "generate-ai") {
        generateAiAssetForSlot(slotId).catch(console.error);
        return;
      }
      if (action === "web-placeholder") {
        showToast("网络获取素材入口已预留；当前版本先使用 assets/images 的本地素材。", "info");
      }
    });
  });

  els.batchList?.querySelectorAll("[data-batch-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const batchId = button.dataset.batchId;
      const action = button.dataset.batchAction;
      const retryAction = button.dataset.retryAction || "";
      if (batchId && action) runBatchAction(batchId, action, {retryAction}).catch(console.error);
    });
  });

  els.batchList?.querySelectorAll("[data-batch-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      const batchId = button.dataset.batchDetail;
      if (batchId) loadBatchDetail(batchId).catch(console.error);
    });
  });

  els.batchList?.querySelectorAll("[data-batch-download]").forEach((button) => {
    button.addEventListener("click", () => downloadBatchArtifacts(button.dataset.batchDownload));
  });

  els.topicPoolList?.querySelectorAll("[data-topic-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const topicId = button.dataset.topicId || "";
      const topic = state.topics.find((item) => item.id === topicId);
      const selected = new Set(ensureStringList(state.selectedTopicIds));
      if (selected.has(topicId)) selected.delete(topicId);
      else selected.add(topicId);
      state.selectedTopicIds = [...selected].filter(Boolean);
      state.selectedTopicId = state.selectedTopicIds[state.selectedTopicIds.length - 1] || "";
      if (topic) syncBatchTopicInputFromSelection();
      renderScaleTools(getDraftConfig());
      bindDynamicLists();
    });
  });

  els.batchAccountGrid?.querySelectorAll("[data-batch-account-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const selected = [...els.batchAccountGrid.querySelectorAll("[data-batch-account-id]:checked")].map(
        (item) => item.dataset.batchAccountId,
      );
      state.batchAccountIds = selected.filter(Boolean);
      renderBatchPanel(getDraftConfig());
      bindDynamicLists();
    });
  });

  els.templateGallery.querySelectorAll("[data-template-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const templateId = button.dataset.templateId;
      if (templateId) requestTemplateChange(templateId, {templateLocked: true, reason: "manual"}).catch(console.error);
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

  const [
    projectPayload,
    codexStatusPayload,
    codexConfigPayload,
    templatePayload,
    assetPayload,
    jobsPayload,
    sessionPayload,
    accountPayload,
    presetPayload,
    statsPayload,
    campaignPayload,
    activityPayload,
    topicPayload,
    batchPayload,
    retryPayload,
    auditPayload,
  ] =
    await Promise.all([
      requestJson(`/api/projects${refreshFlag}`),
      requestJson(`/api/codex/status${refreshFlag}`),
      requestJson("/api/codex/config"),
      requestJson("/api/templates"),
      requestJson("/api/assets"),
      requestJson("/api/jobs"),
      requestJson(buildSessionRequestUrl({forceRefresh, cursor: 0})),
      requestJson("/api/accounts"),
      requestJson("/api/instruction-presets"),
      requestJson("/api/stats"),
      requestJson("/api/campaigns"),
      requestJson("/api/activities"),
      requestJson("/api/topic-pool"),
      requestJson("/api/batches"),
      requestJson("/api/retry-queue"),
      requestJson("/api/audit-events?limit=80"),
    ]);

  state.project = projectPayload;
  state.codexStatus = codexStatusPayload || null;
  state.codexConfig = {
    model: codexConfigPayload?.model || state.codexConfig?.model || "",
    defaultModel: codexConfigPayload?.defaultModel || state.codexConfig?.defaultModel || "",
    updatedAt: codexConfigPayload?.updatedAt || "",
  };
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
  state.stats = statsPayload || null;
  state.campaigns = campaignPayload.items || [];
  state.activities = activityPayload.items || [];
  state.topics = topicPayload.items || [];
  state.batches = batchPayload.items || [];
  state.retryQueue = retryPayload.items || [];
  state.auditEvents = auditPayload.items || [];
  ensureCampaignSelection();
  ensureActivitySelection();
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
  if (window.location.pathname === "/replication") {
    openWorkbenchSection("replication");
  } else {
    setReplicationPageMode(false);
  }
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

async function deleteHistoryJob(jobId) {
  const job = (state.jobs || []).find((item) => item.id === jobId) || (state.activeJob?.id === jobId ? state.activeJob : null);
  const title = job?.title || jobId;
  const outputDir = job?.outputDir || `data/jobs/${jobId}`;
  const confirmed = window.confirm(
    `确定删除历史任务“${title}”吗？\n\n这会永久删除本地目录：${outputDir}\n后端会再次校验路径必须位于 data/jobs 下，避免误删其他目录。`,
  );
  if (!confirmed) return null;

  setBusy(true, "delete-history-job");
  setBanner("正在删除历史任务和本地产物目录...", "info");
  try {
    const deletingActive = state.activeJob?.id === jobId;
    await requestJson(`/api/jobs/${encodeURIComponent(jobId)}`, {method: "DELETE"});
    if (deletingActive) {
      closeEventSource();
      state.activeJob = null;
      await loadBootstrap({preserveSelection: false, forceRefresh: true});
    } else {
      await syncCollections({forceRefresh: true});
    }
    setBanner("历史任务已删除。", "success");
    showToast("历史任务已删除", "success");
    return true;
  } catch (error) {
    reportError("删除历史任务失败", error);
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

function buildScaleQueryParams(options = {}) {
  const params = new URLSearchParams();
  const projectId = options.projectId ?? state.selectedCampaignId;
  const activityId = options.activityId ?? state.selectedActivityId;
  if (projectId) params.set("projectId", projectId);
  if (activityId) params.set("activityId", activityId);
  if (options.includeBatchFilters !== false) {
    if (state.batchFilterStatus && state.batchFilterStatus !== "all") params.set("status", state.batchFilterStatus);
    if (state.batchFilterQuery) params.set("q", state.batchFilterQuery);
  }
  return params;
}

function scaleUrl(path, params) {
  const query = params?.toString?.() || "";
  return query ? `${path}?${query}` : path;
}

async function reloadScaleCollections() {
  const scaleParams = buildScaleQueryParams();
  const [campaignPayload, activityPayload, topicPayload, batchPayload, retryPayload, auditPayload, statsPayload, jobsPayload] = await Promise.all([
    requestJson("/api/campaigns"),
    requestJson(scaleUrl("/api/activities", buildScaleQueryParams({includeBatchFilters: false}))),
    requestJson(scaleUrl("/api/topic-pool", buildScaleQueryParams({includeBatchFilters: false}))),
    requestJson(scaleUrl("/api/batches", scaleParams)),
    requestJson(scaleUrl("/api/retry-queue", buildScaleQueryParams({includeBatchFilters: false}))),
    requestJson("/api/audit-events?limit=80"),
    requestJson("/api/stats"),
    requestJson("/api/jobs"),
  ]);
  state.campaigns = campaignPayload.items || [];
  state.activities = activityPayload.items || [];
  state.topics = topicPayload.items || [];
  state.batches = batchPayload.items || [];
  state.retryQueue = retryPayload.items || [];
  state.auditEvents = auditPayload.items || [];
  state.stats = statsPayload || state.stats;
  state.jobs = jobsPayload.items || state.jobs;
  ensureCampaignSelection();
  ensureActivitySelection();
  renderStats();
  renderScaleTools(getDraftConfig());
  renderJobHistory();
  renderHistoryToolbar();
  bindDynamicLists();
  await refreshOpenBatchDetail();
}

async function createCampaignFromInput() {
  const name = String(els.campaignNameInput?.value || "").trim();
  if (!name) {
    reportError("", new Error("Campaign name is required"));
    els.campaignNameInput?.focus();
    return null;
  }

  setBusy(true, "create-campaign");
  setBanner("正在创建项目...", "info");
  try {
    const campaign = await requestJson("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({name}),
    });
    state.selectedCampaignId = campaign.id;
    if (els.campaignNameInput) els.campaignNameInput.value = "";
    await reloadScaleCollections();
    setBanner("项目已创建，可以用于批量生产任务。", "success");
    showToast("项目已创建", "success");
    return campaign;
  } catch (error) {
    reportError("创建项目失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function createActivityFromInput() {
  const name = String(els.activityNameInput?.value || "").trim();
  if (!name) {
    reportError("", new Error("Activity name is required"));
    els.activityNameInput?.focus();
    return null;
  }
  const project = getSelectedCampaign();
  if (!project?.id) {
    reportError("", new Error("Campaign not found"));
    return null;
  }

  setBusy(true, "create-activity");
  setBanner("正在创建活动...", "info");
  try {
    const activity = await requestJson("/api/activities", {
      method: "POST",
      body: JSON.stringify({name, projectId: project.id}),
    });
    state.selectedActivityId = activity.id;
    if (els.activityNameInput) els.activityNameInput.value = "";
    await reloadScaleCollections();
    setBanner("活动已创建，可以沉淀选题并批量生成任务。", "success");
    showToast("活动已创建", "success");
    return activity;
  } catch (error) {
    reportError("创建活动失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function createTopicFromInput() {
  const title = String(els.topicPoolInput?.value || "").trim();
  if (!title) {
    reportError("", new Error("Topic title is required"));
    els.topicPoolInput?.focus();
    return null;
  }
  const project = getSelectedCampaign();
  const activity = getSelectedActivity();
  if (!project?.id) {
    reportError("", new Error("Campaign not found"));
    return null;
  }

  setBusy(true, "create-topic");
  setBanner("正在加入选题池...", "info");
  try {
    const topic = await requestJson("/api/topic-pool", {
      method: "POST",
      body: JSON.stringify({
        title,
        projectId: project.id,
        activityId: activity?.id || "",
        accountIds: ensureBatchAccountSelection(getDraftConfig()),
      }),
    });
    state.selectedTopicId = topic.id;
    state.selectedTopicIds = [...new Set([...ensureStringList(state.selectedTopicIds), topic.id])];
    if (els.topicPoolInput) els.topicPoolInput.value = "";
    syncBatchTopicInputFromSelection();
    await reloadScaleCollections();
    setBanner("选题已加入选题池。", "success");
    showToast("选题已加入", "success");
    return topic;
  } catch (error) {
    reportError("加入选题池失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function createBatchFromInput() {
  const topics = getBatchTopicPayloadFromInput();
  if (!topics.length) {
    reportError("", new Error("Batch topic is required"));
    els.batchTopicInput?.focus();
    return null;
  }
  const topic = topics[0]?.title || "";

  const config = getDraftConfig();
  const selectedAccountIds = ensureBatchAccountSelection(config);
  if (!selectedAccountIds.length) {
    reportError("", new Error("Batch requires at least one active account"));
    return null;
  }

  setBusy(true, "create-batch");
  setBanner("正在创建同题批量任务...", "info");
  try {
    const payload = await requestJson("/api/batches", {
      method: "POST",
      body: JSON.stringify({
        topic,
        topics,
        campaignId: getSelectedCampaign()?.id || "",
        activityId: getSelectedActivity()?.id || "",
        topicId: topics.length === 1 ? topics[0]?.topicId || state.selectedTopicId || "" : "",
        topicBrief: topics.length === 1 ? topics[0]?.brief || getSelectedTopic()?.brief || "" : "",
        accountIds: selectedAccountIds,
        templateId: config.templateId,
        durationSec: config.durationSec,
        aspectRatio: config.aspectRatio,
        templateLocked: config.templateLocked,
        activePresetIds: config.activePresetIds,
        openInstruction: config.openInstruction,
        autoRetry: true,
        maxAutoRetries: 1,
      }),
    });

    if (els.batchTopicInput) els.batchTopicInput.value = "";
    state.selectedTopicId = "";
    state.selectedTopicIds = [];
    (payload.jobs || []).forEach(mergeJob);
    await reloadScaleCollections();

    const firstJob = payload.jobs?.[0] || null;
    if (firstJob?.id) {
      renderJob(firstJob);
      connectToEvents(firstJob.id);
    } else {
      renderScaleTools(config);
    }
    bindDynamicLists();
    setBanner("批量任务已创建。默认会对失败任务自动重试 1 次，也可以在详情里人工重试单个 job。", "success");
    showToast(`已创建 ${payload.jobs?.length || 0} 条批量任务`, "success");
    return payload;
  } catch (error) {
    reportError("创建批量任务失败", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

function localizeBatchAction(action = "") {
  const map = {
    "generate-plan": "批量计划",
    tts: "批量配音",
    render: "批量渲染",
    "retry-failed": "失败重试",
  };
  return map[action] || action || "批量队列";
}

async function runBatchAction(batchId, action, options = {}) {
  if (!batchId || !action) return null;
  setBusy(true, `batch-${action}`);
  const actionLabel = localizeBatchAction(action);
  setBanner(`正在提交${actionLabel}队列...`, "info");
  try {
    const batch = await requestJson(`/api/batches/${encodeURIComponent(batchId)}/actions/${encodeURIComponent(action)}`, {
      method: "POST",
      body: JSON.stringify({
        retryAction: options.retryAction || "",
      }),
    });
    await reloadScaleCollections();
    setBanner(`${actionLabel}队列已启动，状态会自动刷新。`, "success");
    showToast(`已启动${actionLabel}`, "success");
    return batch;
  } catch (error) {
    reportError(`启动${actionLabel}失败`, error);
    throw error;
  } finally {
    setBusy(false);
  }
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

function confirmTemplateChange(nextTemplateId, reason = "manual") {
  const currentConfig = getCurrentConfig();
  if (!nextTemplateId || nextTemplateId === currentConfig.templateId) return true;
  if (!accountHasPersistedWork(state.activeJob)) return true;

  const currentTemplate = getTemplateById(currentConfig.templateId);
  const nextTemplate = getTemplateById(nextTemplateId);
  const reasonText =
    reason === "account-default"
      ? "\u5f53\u524d\u8d26\u53f7\u7684\u9ed8\u8ba4\u6a21\u677f\u4e5f\u4f1a\u4e00\u8d77\u53d8\u5316\u3002"
      : "\u8fd9\u4f1a\u6539\u53d8\u5f53\u524d\u4efb\u52a1\u7684\u6a21\u677f\u914d\u7f6e\u3002";
  return window.confirm(
    `\u4ece\u201c${currentTemplate?.title || currentConfig.templateId}\u201d\u5207\u6362\u5230\u201c${nextTemplate?.title || nextTemplateId}\u201d\u540e\uff0c\u73b0\u6709\u811a\u672c\u548c\u5df2\u751f\u6210\u4ea7\u7269\u53ef\u80fd\u4e0d\u518d\u5339\u914d\u3002\n\n${reasonText}\n\u5efa\u8bae\u5207\u6362\u540e\u91cd\u65b0\u751f\u6210\u8ba1\u5212\u3002\u662f\u5426\u7ee7\u7eed\uff1f`,
  );
}

async function requestTemplateChange(templateId, options = {}) {
  const nextTemplate = getTemplateById(templateId);
  if (!nextTemplate) return null;
  const target = options.target || "draft";
  const baseConfig = target === "job" ? getCurrentConfig() : getDraftConfig();
  const patch = {
    templateId: nextTemplate.id,
    compositionId: nextTemplate.compositionId || "",
    durationSec: nextTemplate.defaultDurationSec || baseConfig.durationSec,
    aspectRatio: nextTemplate.aspectRatio || baseConfig.aspectRatio,
    ...(options.templateLocked === undefined ? {} : {templateLocked: options.templateLocked}),
  };

  if (target === "job" && !confirmTemplateChange(nextTemplate.id, options.reason || "manual")) {
    if (state.activeJob) renderJob(state.activeJob);
    else renderEmptyJob();
    return null;
  }

  if (target === "job") return applyConfigPatch(patch);
  return applyDraftConfigPatch(patch, "\u5df2\u66f4\u65b0\u65b0\u4efb\u52a1\u9ed8\u8ba4\u6a21\u677f\uff0c\u5f53\u524d\u4efb\u52a1\u4e0d\u53d7\u5f71\u54cd\u3002");
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

function applyDraftConfigPatch(patch, message = "") {
  const nextConfig = normalizeConfig({...getDraftConfig(), ...patch});
  setDraftConfig(nextConfig);
  if (state.activeJob) {
    renderAccountSelect(nextConfig);
    renderTemplateSelect(nextConfig);
    renderScaleTools(nextConfig);
    renderTaskCreateModal();
    renderActionHints(state.activeJob);
    bindDynamicLists();
  } else {
    renderEmptyJob();
    bindDynamicLists();
  }
  if (message) showToast(message, "success");
  return nextConfig;
}

async function createSession() {
  setBusy(true, "create-session");
  setSessionUi("", "creating");
  state.pendingSessionLabel = "\u6b63\u5728\u521b\u5efa\u672c\u5730 session...";
  setBanner("\u6b63\u5728\u521b\u5efa\u672c\u5730 Codex session...", "info");
  try {
    const job = await requestJson("/api/sessions", {
      method: "POST",
      body: JSON.stringify({config: getDraftConfig()}),
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
  const config = getDraftConfig();
  validateTaskCreationSelection([config.accountId], config.templateId);
  const sessionId = String(state.selectedSessionId || "").trim();
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
    useAiImageAssets: Boolean(config.useAiImageAssets),
    imageAssetModel: config.imageAssetModel || state.settings.imageAssetModel || "gpt-image-2-all",
    durationSec: config.durationSec,
    aspectRatio: config.aspectRatio,
    outputDir: "data/jobs",
    codexSessionId: sessionId || null,
    messages: [
      {
        role: "user",
        author: "You",
        content: trimmedPrompt,
        createdAt: now,
      },
    ],
    pendingAssistantText: "\u6b63\u5728\u521b\u5efa\u89c6\u9891\u4efb\u52a1...",
    steps: [],
    logs: [],
    scriptSections: [],
    preview: {
      ...EMPTY_PREVIEW,
      statusText: "\u521b\u5efa\u4e2d",
      headline: "\u6b63\u5728\u521b\u5efa\u4efb\u52a1",
      summary: "\u6b63\u5728\u6839\u636e\u5f53\u524d\u8d26\u53f7\u3001\u6a21\u677f\u548c\u6307\u4ee4\u5efa\u7acb\u4efb\u52a1\u6863\u6848\u3002",
      subtitle: "\u4efb\u52a1\u521b\u5efa\u540e\uff0c\u4e0b\u4e00\u6b65\u53ef\u4ee5\u70b9\u51fb\u201c\u751f\u6210\u8ba1\u5212\u201d\u6216\u201c\u4e00\u952e\u751f\u6210 MP4\u201d\u3002",
      progress: 0.18,
    },
    codexRunning: false,
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
        sessionId,
        config,
      }),
    });
    renderJob(job);
    bindDynamicLists();
    connectToEvents(job.id);
    els.composerInput.value = "";
    await syncCollections();
    setBanner("\u4efb\u52a1\u5df2\u521b\u5efa\u3002\u4e0b\u4e00\u6b65\uff1a\u70b9\u51fb\u201c\u751f\u6210\u8ba1\u5212\u201d\u6216\u201c\u4e00\u952e\u751f\u6210 MP4\u201d\u3002", "success");
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

function getJobsForSession(sessionId) {
  const targetSessionId = String(sessionId || "").trim();
  if (!targetSessionId) return [];
  return (Array.isArray(state.jobs) ? state.jobs : [])
    .filter((job) => job?.source === "runtime" && job.codexSessionId === targetSessionId)
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
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
  setSessionUi(targetSessionId, "binding");
  renderSessionSelect();
  renderSessionList();

  const relatedJobs = getJobsForSession(targetSessionId);
  const latestRelatedJob = relatedJobs[0] || null;
  if (latestRelatedJob && latestRelatedJob.id !== state.activeJob?.id) {
    const countText =
      relatedJobs.length > 1
        ? `\u627e\u5230 ${relatedJobs.length} \u4e2a\u5173\u8054\u4efb\u52a1\uff0c\u5df2\u5207\u6362\u5230\u6700\u8fd1\u66f4\u65b0\u7684\u4e00\u4e2a\u3002`
        : "\u5df2\u5207\u6362\u5230\u8be5 session \u5173\u8054\u7684\u89c6\u9891\u4efb\u52a1\u3002";
    const selectedJob = await selectJob(latestRelatedJob.id);
    setBanner(countText, relatedJobs.length > 1 ? "warning" : "success");
    return selectedJob;
  }

  if (!state.activeJob) {
    state.pendingSessionLabel = "";
    setSessionUi(targetSessionId, "linked");
    renderSessionSelect();
    renderSessionList();
    setBanner("\u5df2\u9009\u62e9\u672c\u5730 session\u3002\u4e0b\u4e00\u6b21\u65b0\u5efa\u89c6\u9891\u4efb\u52a1\u6216\u53d1\u9001\u7b2c\u4e00\u6761\u9700\u6c42\u65f6\u4f1a\u81ea\u52a8\u7ed1\u5b9a\u5b83\u3002", "info");
    els.composerInput?.focus();
    return null;
  }

  if (state.activeJob.source !== "runtime" || state.activeJob.id === "__pending_job__") {
    state.pendingSessionLabel = "";
    setSessionUi(targetSessionId, "linked");
    renderSessionSelect();
    renderSessionList();
    setBanner("\u5df2\u9009\u62e9\u672c\u5730 session\u3002\u5f53\u524d\u4e0d\u662f\u53ef\u751f\u4ea7\u7684\u89c6\u9891\u4efb\u52a1\uff0c\u4e0d\u4f1a\u6539\u5199\u5f53\u524d\u4efb\u52a1\u3002", "warning");
    return null;
  }

  setBusy(true, "attach-session");
  setBanner("\u6b63\u5728\u7ed1\u5b9a\u672c\u5730 session...", "info");
  try {
    const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/config`, {
      method: "PATCH",
      body: JSON.stringify({
        ...getCurrentConfig(),
        codexSessionId: targetSessionId,
      }),
    });
    state.pendingSessionLabel = "";
    renderJob(job);
    bindDynamicLists();
    connectToEvents(job.id);
    state.sessionDrawerOpen = false;
    els.sessionDrawer.hidden = true;
    await loadSessions();
    setBanner("\u5df2\u628a\u672c\u5730 session \u7ed1\u5b9a\u5230\u5f53\u524d\u89c6\u9891\u4efb\u52a1\uff0c\u53ef\u4ee5\u7ee7\u7eed\u751f\u6210\u8ba1\u5212\u3001\u914d\u97f3\u548c\u6e32\u67d3\u3002", "success");
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

  if (!state.activeJob || !canChat(state.activeJob)) {
    const messageText = normalizeErrorText("Create task explicitly first");
    setBanner(messageText, "warning");
    showToast(messageText, "warning");
    openTaskCreateModal({prompt: trimmedMessage, resetPrompt: false});
    return null;
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

async function createAndSendFromComposer() {
  const text = String(els.composerInput?.value || "").trim();
  if (!text) {
    showToast("请先输入视频需求。", "info");
    els.composerInput?.focus();
    return null;
  }
  try {
    const job = await createJob(text);
    els.composerInput.value = "";
    return job;
  } catch (error) {
    reportError("创建并发送失败", error);
    return null;
  }
}

function openScriptAiModal() {
  if (!state.activeJob?.id || state.activeJob.id === "__pending_job__") {
    reportError("", new Error("Active job is required for script revision"));
    return;
  }
  const review = buildScriptReviewModel(state.activeJob);
  if (els.scriptAiInstructionInput) {
    els.scriptAiInstructionInput.value =
      `请优化当前任务脚本：\n- 保留主题和账号风格\n- 不修改账号默认配置和模板\n- 优化 Hook、口播脚本、字幕摘要和镜头结构\n- 不要把提示词、配置说明、文件路径写进视频画面\n\n当前标题：${review.title}`;
  }
  if (els.scriptAiModal) els.scriptAiModal.hidden = false;
  window.setTimeout(() => els.scriptAiInstructionInput?.focus(), 0);
}

function closeScriptAiModal() {
  if (els.scriptAiModal) els.scriptAiModal.hidden = true;
}

function buildScriptRevisionPrompt(instruction = "") {
  const review = buildScriptReviewModel(state.activeJob);
  const outputDir = state.activeJob?.outputDir || "";
  return [
    "请只修改当前视频任务的脚本，不要修改账号默认配置、模板库或其他任务。",
    `当前 job: ${state.activeJob?.id || ""}`,
    `当前输出目录: ${outputDir}`,
    "",
    "目标：优化标题、Hook、口播脚本、字幕摘要和镜头结构。修改必须继续服务当前主题，不要把用户提示词、内部配置、文件路径、账号/模板说明写进视频画面。",
    "",
    "请优先更新当前 job 目录中的 video_plan.json、voiceover_units.json、voiceover.txt、render-props.json；如果这些文件不存在，请返回可替换的脚本方案，并说明需要先生成计划。",
    "",
    "当前脚本摘要：",
    `标题：${review.title}`,
    `Hook：${review.hook}`,
    `字幕摘要：${review.subtitleSummary}`,
    `镜头结构：${review.shotStructure}`,
    "",
    "我的修改要求：",
    instruction,
  ].join("\n");
}

async function submitScriptAiRevision() {
  const instruction = String(els.scriptAiInstructionInput?.value || "").trim();
  if (!instruction) {
    showToast("请先填写脚本修改要求。", "info");
    els.scriptAiInstructionInput?.focus();
    return null;
  }
  closeScriptAiModal();
  activateWorkbenchView("script");
  setConsoleNavActive("console");
  return sendMessage(buildScriptRevisionPrompt(instruction));
}

async function continueAfterScriptReview() {
  if (!state.activeJob) {
    reportError("", new Error("Active job is required for script revision"));
    return null;
  }
  const readiness = getJobReadiness(state.activeJob);
  if (!readiness.hasPlan) {
    setBanner("请先生成计划，再进入脚本审阅和继续生产。", "warning");
    showToast("请先生成计划", "warning");
    return null;
  }
  setBanner("脚本已进入继续生产：配音 -> 渲染 -> Screen QA。", "info");
  return runFullPipelineStable();
}

async function runAction(action) {
  const capabilities = getJobCapabilities(state.activeJob);
  const capabilityMap = {
    "generate-plan": "canPlan",
    tts: "canTts",
    render: "canRender",
  };
  const actionLabel = getPipelineActionLabel(action);
  if (!capabilities[capabilityMap[action]]) {
    const message = capabilities.actionReasons?.[action] || capabilities.reason || "\u5f53\u524d\u72b6\u6001\u4e0d\u652f\u6301\u6267\u884c\u8fd9\u4e2a\u52a8\u4f5c\u3002";
    setBanner(message, "warning");
    showToast(message, "warning");
    return null;
  }
  setBusy(true, `run-${action}`);
  setBanner(`\u6b63\u5728\u6267\u884c${actionLabel}...`, "info");
  try {
    const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/actions/${action}`, {
      method: "POST",
    });
    renderJob(job);
    bindDynamicLists();
    if (action === "generate-plan" && state.settings.generationMode !== "auto") {
      activateWorkbenchView("script");
      setConsoleNavActive("console");
      setBanner("脚本审阅模式：计划已生成，已暂停。请检查脚本，必要时让 AI 修改，然后再继续配音和渲染。", "info");
      return job;
    }
    setBanner(`${actionLabel}\u5df2\u5b8c\u6210\uff0c\u5df2\u540c\u6b65\u6700\u65b0\u72b6\u6001\u3002`, "success");
    return job;
  } catch (error) {
    reportError(`${actionLabel}\u5931\u8d25`, error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function retryFailedCurrentStep() {
  if (!state.activeJob || state.activeJob.status !== "failed") {
    showToast("\u5f53\u524d\u6ca1\u6709\u9700\u8981\u91cd\u8bd5\u7684\u5931\u8d25\u4efb\u52a1\u3002", "warning");
    return null;
  }
  const action = getRetryActionForJob(state.activeJob);
  setBanner(`\u6b63\u5728\u91cd\u8bd5${getPipelineActionLabel(action)}...`, "info");
  return runAction(action);
}

async function restartFailedJobFromHead() {
  if (!state.activeJob || state.activeJob.status !== "failed") {
    showToast("\u5f53\u524d\u6ca1\u6709\u9700\u8981\u4ece\u5934\u751f\u6210\u7684\u5931\u8d25\u4efb\u52a1\u3002", "warning");
    return null;
  }
  setBanner("\u6b63\u5728\u4ece\u5934\u6267\u884c\uff1a\u751f\u6210\u8ba1\u5212 -> \u914d\u97f3 -> \u6e32\u67d3...", "info");
  return runFullPipelineStable();
}

async function executePipelineAction(action) {
  if (!canRunPipeline(state.activeJob)) return null;
  const job = await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/actions/${action}`, {
    method: "POST",
  });
  renderJob(job);
  bindDynamicLists();
  if (job?.id) connectToEvents(job.id);
  return job;
}

async function runFullPipeline() {
  const capabilities = getJobCapabilities(state.activeJob);
  if (!capabilities.canRunAll) {
    const message = capabilities.reason || "\u5f53\u524d\u72b6\u6001\u4e0d\u652f\u6301\u4e00\u952e\u751f\u6210\u3002";
    setBanner(message, "warning");
    showToast(message, "warning");
    return null;
  }
  const steps = [
    {action: "generate-plan", label: "生成计划"},
    {action: "tts", label: "配音"},
  ];
  setBusy(true, "run-full");
  try {
    for (const step of steps) {
      setBanner(`一键生成：正在${step.label}...`, "info");
      await executePipelineAction(step.action);
    }

    if (state.settings.generationMode !== "auto") {
      setBusy(false);
    const confirmed = await openRenderConfirmModal();
    if (!confirmed) {
      setBanner("已停在渲染前确认。确认脚本和配音后可继续渲染。", "info");
      return state.activeJob;
    }

    }

    setBusy(true, "run-full");
    setBanner("一键生成：正在渲染 MP4...", "info");
    const job = await executePipelineAction("render");
    setBanner("一键生成已完成，MP4 已写入产物目录。", "success");
    showToast("MP4 已生成", "success");
    return job;
  } catch (error) {
    reportError("一键生成 MP4 失败", error);
    throw error;
  } finally {
    setBusy(false);
    setActionState();
  }
}

async function runFullPipelineStable() {
  const capabilities = getJobCapabilities(state.activeJob);
  if (!capabilities.canRunAll) {
    const message = capabilities.actionReasons?.["run-all"] || capabilities.reason || "\u5f53\u524d\u72b6\u6001\u4e0d\u652f\u6301\u4e00\u952e\u751f\u6210\u3002";
    setBanner(message, "warning");
    showToast(message, "warning");
    return null;
  }

  setBusy(true, "run-full");
  try {
    const initialReadiness = getJobReadiness(state.activeJob);
    if (!initialReadiness.hasPlan) {
      setBanner("一键生成：正在生成计划...", "info");
      await executePipelineAction("generate-plan");
      if (state.settings.generationMode !== "auto") {
        activateWorkbenchView("script");
        setConsoleNavActive("console");
        setBanner("脚本审阅模式：计划已生成，已暂停。请检查脚本，必要时让 AI 修改，然后点击“继续配音并渲染”。", "info");
        showToast("已暂停在脚本审阅", "info");
        return state.activeJob;
      }
    }

    const afterPlanReadiness = getJobReadiness(state.activeJob);
    if (!afterPlanReadiness.hasTts) {
      setBanner("一键生成：正在生成配音和字幕时间轴...", "info");
      await executePipelineAction("tts");
    }

    const afterTtsReadiness = getJobReadiness(state.activeJob);
    if (!afterTtsReadiness.hasVideo) {
      setBanner("\u4e00\u952e\u751f\u6210\uff1a\u6b63\u5728\u6e32\u67d3 MP4 \u5e76\u6267\u884c Screen QA...", "info");
      await executePipelineAction("render");
    }

    setBanner("\u4e00\u952e\u751f\u6210\u5df2\u5b8c\u6210\uff0cMP4 \u5df2\u5199\u5165\u4ea7\u7269\u76ee\u5f55\u3002", "success");
    showToast("MP4 \u5df2\u751f\u6210", "success");
    return state.activeJob;
  } catch (error) {
    reportError("\u4e00\u952e\u751f\u6210 MP4 \u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
    setActionState();
  }
}

async function handlePosterAction(action, dataset = {}) {
  if (!state.activeJob?.id) return;

  if (action === "copy-path") {
    const relativePath = String(dataset.posterPath || "").trim();
    const absolutePath = getWorkspaceAbsolutePath(relativePath);
    const copied = await copyTextToClipboard(absolutePath || relativePath);
    if (copied) {
      showToast("\u5c01\u9762\u8def\u5f84\u5df2\u590d\u5236", "success");
      setBanner("\u5c01\u9762\u8def\u5f84\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f\u3002", "success");
    } else {
      reportError("\u590d\u5236\u8def\u5f84\u5931\u8d25", new Error("\u8bf7\u624b\u52a8\u590d\u5236\u5c01\u9762\u8def\u5f84"));
    }
    return;
  }

  const actionLabel =
    action === "set-default" ? "\u8bbe\u4e3a\u9ed8\u8ba4\u5c01\u9762" : "\u91cd\u65b0\u6293\u53d6\u5c01\u9762\u5e27";
  setBusy(true, `poster-${action}`);
  setBanner(`\u6b63\u5728${actionLabel}...`, "info");
  try {
    const job =
      action === "set-default"
        ? await setPosterAsDefault(state.activeJob.id)
        : await refreshPoster(state.activeJob.id);
    renderJob(job);
    bindDynamicLists();
    setBanner(`${actionLabel}\u5df2\u5b8c\u6210\u3002`, "success");
    showToast(`${actionLabel}\u5df2\u5b8c\u6210`, "success");
  } catch (error) {
    reportError(`${actionLabel}\u5931\u8d25`, error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function toggleActiveJobArchive() {
  const job = state.activeJob;
  if (!job?.id || job.id === "__pending_job__" || job.source === "session") return null;
  const nextArchived = !job.archived;
  const prompt = nextArchived
    ? `确定归档任务“${job.title || job.id}”吗？归档后任务仍会保留产物和历史记录。`
    : `确定恢复任务“${job.title || job.id}”吗？`;
  if (!window.confirm(prompt)) return null;
  setBusy(true, nextArchived ? "archive-job" : "restore-job");
  setBanner(nextArchived ? "\u6b63\u5728\u5f52\u6863\u4efb\u52a1..." : "\u6b63\u5728\u6062\u590d\u4efb\u52a1...", "info");
  try {
    const updated = await requestJson(`/api/jobs/${encodeURIComponent(job.id)}/archive`, {
      method: "POST",
      body: JSON.stringify({archived: nextArchived}),
    });
    renderJob(updated);
    bindDynamicLists();
    await syncCollections();
    setBanner(nextArchived ? "\u4efb\u52a1\u5df2\u5f52\u6863\u3002" : "\u4efb\u52a1\u5df2\u6062\u590d\u3002", "success");
    showToast(nextArchived ? "\u4efb\u52a1\u5df2\u5f52\u6863" : "\u4efb\u52a1\u5df2\u6062\u590d", "success");
    return updated;
  } catch (error) {
    reportError(nextArchived ? "\u5f52\u6863\u4efb\u52a1\u5931\u8d25" : "\u6062\u590d\u4efb\u52a1\u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function recoverActiveJob() {
  const job = state.activeJob;
  if (!job?.id || job.id === "__pending_job__" || job.source === "session") return null;
  setBusy(true, "recover-job");
  setBanner("\u6b63\u5728\u6062\u590d\u5386\u53f2\u4efb\u52a1...", "info");
  try {
    const recovered = await requestJson(`/api/jobs/${encodeURIComponent(job.id)}/recover`, {
      method: "POST",
    });
    renderJob(recovered);
    bindDynamicLists();
    connectToEvents(recovered.id);
    await syncCollections();
    setBanner("\u5386\u53f2\u4efb\u52a1\u5df2\u6062\u590d\u4e3a\u65b0\u4efb\u52a1\u3002", "success");
    showToast("\u5df2\u65b0\u5efa\u6062\u590d\u4efb\u52a1", "success");
    return recovered;
  } catch (error) {
    reportError("\u6062\u590d\u5386\u53f2\u4efb\u52a1\u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

function openAccountModal() {
  state.accountModalMode = "create";
  state.editingAccountId = "";
  els.accountModalEyebrow.textContent = "Create Account";
  els.accountModalTitle.textContent = "\u65b0\u589e\u8d26\u53f7";
  els.accountSubmitButton.textContent = "\u521b\u5efa\u8d26\u53f7";
  els.accountForm.reset();
  if (state.templates[0]) {
    els.accountTemplateInput.value = state.templates[0].id;
  }
  els.accountDurationInput.value = 60;
  els.accountModal.hidden = false;
  els.accountNameInput.focus();
}

function closeAccountModal() {
  state.accountModalMode = "create";
  state.editingAccountId = "";
  els.accountModal.hidden = true;
  els.accountForm.reset();
  if (state.templates[0]) {
    els.accountTemplateInput.value = state.templates[0].id;
  }
  els.accountDurationInput.value = 60;
}

function openAccountEditor(account) {
  if (!account) return;
  state.accountModalMode = "edit";
  state.editingAccountId = account.id;
  els.accountModalEyebrow.textContent = "Edit Account";
  els.accountModalTitle.textContent = "\u7f16\u8f91\u8d26\u53f7";
  els.accountSubmitButton.textContent = "\u4fdd\u5b58\u8d26\u53f7";
  els.accountNameInput.value = account.name || "";
  els.accountPlatformInput.value = account.platform || "xiaohongshu";
  els.accountPersonaInput.value = account.persona || "";
  els.accountToneInput.value = Array.isArray(account.toneTags) ? account.toneTags.join(", ") : "";
  els.accountTemplateInput.value = account.defaultTemplateId || state.templates[0]?.id || "";
  els.accountDurationInput.value = Number(account.defaultDurationSec || 60);
  els.accountCtaInput.value = account.ctaStyle || "";
  els.accountSubtitleStyleInput.value = account.subtitleStyle || "";
  els.accountConstraintsInput.value = Array.isArray(account.constraints) ? account.constraints.join(", ") : "";
  els.accountModal.hidden = false;
  els.accountNameInput.focus();
}

function getCurrentAccount() {
  return getAccountById(getCurrentConfig().accountId);
}

function buildAccountPayload(formData) {
  return {
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
}

async function reloadAccounts() {
  const payload = await requestJson("/api/accounts");
  state.accounts = Array.isArray(payload.items) ? payload.items : [];
  return state.accounts;
}

async function syncAccountSelection(account, options = {}) {
  const currentConfig = getDraftConfig();
  const nextConfig = normalizeConfig({
    ...currentConfig,
    ...buildConfigFromAccount(account, currentConfig, {forceTemplate: Boolean(options.forceTemplate)}),
  });

  setDraftConfig(nextConfig);
  if (state.activeJob) {
    renderAccountSelect(nextConfig);
    renderTemplateSelect(nextConfig);
    renderScaleTools(nextConfig);
    bindDynamicLists();
  } else {
    renderEmptyJob();
  }
  return nextConfig;
}

async function saveAccount(formData) {
  const payload = {
    ...buildAccountPayload(formData),
  };

  const isEdit = state.accountModalMode === "edit" && state.editingAccountId;
  const targetId = state.editingAccountId;
  setBusy(true, isEdit ? "update-account" : "create-account");
  setBanner(isEdit ? "\u6b63\u5728\u4fdd\u5b58\u8d26\u53f7..." : "\u6b63\u5728\u521b\u5efa\u8d26\u53f7...", "info");
  try {
    const account = await requestJson(isEdit ? `/api/accounts/${encodeURIComponent(targetId)}` : "/api/accounts", {
      method: isEdit ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    await reloadAccounts();
    await syncAccountSelection(account, {forceTemplate: !isEdit});
    bindDynamicLists();
    closeAccountModal();
    setBanner(
      isEdit
        ? "\u8d26\u53f7\u5df2\u4fdd\u5b58\uff0c\u5f53\u524d\u914d\u7f6e\u5df2\u66f4\u65b0\u3002"
        : "\u8d26\u53f7\u5df2\u521b\u5efa\uff0c\u5f53\u524d\u914d\u7f6e\u5df2\u66f4\u65b0\u3002",
      "success",
    );
    showToast(isEdit ? "\u8d26\u53f7\u5df2\u4fdd\u5b58" : "\u8d26\u53f7\u5df2\u521b\u5efa", "success");
    return account;
  } catch (error) {
    reportError(isEdit ? "\u4fdd\u5b58\u8d26\u53f7\u5931\u8d25" : "\u521b\u5efa\u8d26\u53f7\u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function toggleAccountArchive() {
  const account = getCurrentAccount();
  if (!account) return;
  const nextArchived = !account.archived;
  const confirmed = window.confirm(
    nextArchived
      ? "\u5f52\u6863\u540e\u8be5\u8d26\u53f7\u4e0d\u4f1a\u518d\u51fa\u73b0\u5728\u9ed8\u8ba4\u4e0b\u62c9\u5217\u8868\u4e2d\u3002\u7ee7\u7eed\u5417\uff1f"
      : "\u8981\u6062\u590d\u8fd9\u4e2a\u8d26\u53f7\u5417\uff1f",
  );
  if (!confirmed) return;

  setBusy(true, nextArchived ? "archive-account" : "restore-account");
  setBanner(nextArchived ? "\u6b63\u5728\u5f52\u6863\u8d26\u53f7..." : "\u6b63\u5728\u6062\u590d\u8d26\u53f7...", "info");
  try {
    await requestJson(`/api/accounts/${encodeURIComponent(account.id)}/archive`, {
      method: "POST",
      body: JSON.stringify({archived: nextArchived}),
    });
    await reloadAccounts();
    const fallbackAccount = listSelectableAccounts()[0] || null;
    const targetAccount = nextArchived ? fallbackAccount : getAccountById(account.id);
    await syncAccountSelection(targetAccount, {forceTemplate: false});
    bindDynamicLists();
    setBanner(nextArchived ? "\u8d26\u53f7\u5df2\u5f52\u6863\u3002" : "\u8d26\u53f7\u5df2\u6062\u590d\u3002", "success");
    showToast(nextArchived ? "\u8d26\u53f7\u5df2\u5f52\u6863" : "\u8d26\u53f7\u5df2\u6062\u590d", "success");
  } catch (error) {
    reportError(nextArchived ? "\u5f52\u6863\u8d26\u53f7\u5931\u8d25" : "\u6062\u590d\u8d26\u53f7\u5931\u8d25", error);
    throw error;
  } finally {
    setBusy(false);
  }
}

async function removeCurrentAccount() {
  const account = getCurrentAccount();
  if (!account) return;
  const confirmed = window.confirm(
    `\u786e\u5b9a\u5220\u9664\u8d26\u53f7\u201c${account.name}\u201d\u5417\uff1f\u6b64\u64cd\u4f5c\u4e0d\u4f1a\u5220\u9664\u5df2\u751f\u6210\u7684\u89c6\u9891\u4ea7\u7269\u3002`,
  );
  if (!confirmed) return;

  setBusy(true, "delete-account");
  setBanner("\u6b63\u5728\u5220\u9664\u8d26\u53f7...", "info");
  try {
    await requestJson(`/api/accounts/${encodeURIComponent(account.id)}`, {
      method: "DELETE",
    });
    await reloadAccounts();
    const fallbackAccount = listSelectableAccounts()[0] || null;
    await syncAccountSelection(fallbackAccount, {forceTemplate: true});
    bindDynamicLists();
    setBanner("\u8d26\u53f7\u5df2\u5220\u9664\u3002", "success");
    showToast("\u8d26\u53f7\u5df2\u5220\u9664", "success");
  } catch (error) {
    reportError("\u5220\u9664\u8d26\u53f7\u5931\u8d25", error);
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

function setConsoleNavActive(target = "console") {
  document.querySelectorAll(".console-nav [data-console-nav]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.consoleNav === target);
  });
}

function activateWorkbenchView(viewId = "workflow") {
  const targetView = document.querySelector(`#${viewId}View`);
  if (!targetView) return;
  state.activeView = viewId;
  document.querySelectorAll(".segmented-control button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewId);
  });
  document.querySelectorAll(".view-page").forEach((page) => page.classList.remove("is-active"));
  targetView.classList.add("is-active");
}

function setReplicationPageMode(enabled) {
  document.body.classList.toggle("is-replication-route", Boolean(enabled));
}

function openWorkbenchSection(target = "console") {
  if (target === "sessions") {
    setConsoleNavActive("sessions");
    openSettingsModal();
    return;
  }
  if (target === "docs") {
    activateWorkbenchView("docs");
    setConsoleNavActive("docs");
    return;
  }
  if (target === "batch") {
    activateWorkbenchView("resources");
    setConsoleNavActive("batch");
    document.querySelector("#batchConsoleSection")?.scrollIntoView({block: "start", behavior: "smooth"});
    return;
  }
  if (target === "replication") {
    setReplicationPageMode(true);
    activateWorkbenchView("replication");
    setConsoleNavActive("replication");
    renderReplicationPage(state.activeJob);
    return;
  }
  setReplicationPageMode(false);
  if (target === "history") {
    activateWorkbenchView("resources");
    setConsoleNavActive("history");
    document.querySelector("#historySection")?.scrollIntoView({block: "start", behavior: "smooth"});
    return;
  }
  activateWorkbenchView("workflow");
  setConsoleNavActive("console");
}

document.querySelectorAll(".segmented-control button").forEach((button) => {
  button.addEventListener("click", () => {
    activateWorkbenchView(button.dataset.view || "workflow");
    setConsoleNavActive("console");
  });
});

document.querySelectorAll("[data-console-nav]").forEach((button) => {
  button.addEventListener("click", () => {
    openWorkbenchSection(button.dataset.consoleNav || "console");
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

document.querySelectorAll("[data-history-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.historyFilter = button.dataset.historyFilter || "all";
    renderJobHistory();
    renderHistoryToolbar();
    bindDynamicLists();
  });
});

els.historySearchInput?.addEventListener("input", () => {
  state.historyQuery = els.historySearchInput.value || "";
  renderJobHistory();
  bindDynamicLists();
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
    renderSessionSelect();
    renderSessionList();
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

els.newSessionButton?.addEventListener("click", async () => {
  els.newSessionButton.disabled = true;
  try {
    await createSession();
    els.composerInput.focus();
  } catch (error) {
    void error;
  } finally {
    els.newSessionButton.disabled = false;
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

els.openTaskModalButton?.addEventListener("click", openTaskCreateModal);
els.quickCreateTaskButton?.addEventListener("click", openTaskCreateModal);
els.quickBatchButton?.addEventListener("click", () => openWorkbenchSection("batch"));
els.quickDocsButton?.addEventListener("click", () => openWorkbenchSection("docs"));
els.closeTaskCreateModalButton?.addEventListener("click", closeTaskCreateModal);
els.cancelTaskCreateButton?.addEventListener("click", closeTaskCreateModal);
els.taskCreateModeInput?.addEventListener("change", () => {
  state.taskCreateAccountIds = state.taskCreateAccountIds.slice(0, els.taskCreateModeInput.value === "single" ? 1 : undefined);
  renderTaskCreateModal();
});
els.taskCreateTemplateInput?.addEventListener("change", () => renderTaskCreateModal());
els.taskCreateGenerationModeInput?.addEventListener("change", () => {
  updateGenerationMode(els.taskCreateGenerationModeInput.value, {persist: true});
});
els.taskCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createTaskFromModal();
  } catch (error) {
    void error;
  }
});
els.taskCreateModal?.addEventListener("click", (event) => {
  if (event.target === els.taskCreateModal) closeTaskCreateModal();
});

els.uploadReplicationVideoButton?.addEventListener("click", async () => {
  try {
    await uploadReplicationReferenceVideo();
  } catch (error) {
    void error;
  }
});

els.analyzeReplicationVideoButton?.addEventListener("click", async () => {
  try {
    await analyzeReplicationReferenceForActiveJob();
  } catch (error) {
    void error;
  }
});

els.createReplicationJobButton?.addEventListener("click", async () => {
  try {
    await createReplicationJobFromPage();
  } catch (error) {
    void error;
  }
});

els.runReplicationPipelineButton?.addEventListener("click", async () => {
  try {
    await runReplicationPipelineForActiveJob();
  } catch (error) {
    void error;
  }
});

els.runReplicationDeliveryButton?.addEventListener("click", async () => {
  try {
    await runReplicationDeliveryForActiveJob();
  } catch (error) {
    void error;
  }
});

els.selectLatestReplicationButton?.addEventListener("click", selectLatestReplicationJob);

els.scriptAiForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await submitScriptAiRevision();
  } catch (error) {
    void error;
  }
});
els.closeScriptAiModalButton?.addEventListener("click", closeScriptAiModal);
els.cancelScriptAiButton?.addEventListener("click", closeScriptAiModal);
els.scriptAiModal?.addEventListener("click", (event) => {
  if (event.target === els.scriptAiModal) closeScriptAiModal();
});

els.campaignSelect?.addEventListener("change", async () => {
  state.selectedCampaignId = els.campaignSelect.value || "";
  state.selectedActivityId = "";
  state.selectedTopicId = "";
  state.selectedTopicIds = [];
  if (els.batchTopicInput) els.batchTopicInput.value = "";
  try {
    await reloadScaleCollections();
  } catch (error) {
    reportError("刷新项目层级失败", error);
  }
});

els.createCampaignButton?.addEventListener("click", async () => {
  try {
    await createCampaignFromInput();
  } catch (error) {
    void error;
  }
});

els.campaignNameInput?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  try {
    await createCampaignFromInput();
  } catch (error) {
    void error;
  }
});

els.activitySelect?.addEventListener("change", async () => {
  state.selectedActivityId = els.activitySelect.value || "";
  state.selectedTopicId = "";
  state.selectedTopicIds = [];
  if (els.batchTopicInput) els.batchTopicInput.value = "";
  try {
    await reloadScaleCollections();
  } catch (error) {
    reportError("刷新活动数据失败", error);
  }
});

els.createActivityButton?.addEventListener("click", async () => {
  try {
    await createActivityFromInput();
  } catch (error) {
    void error;
  }
});

els.activityNameInput?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  try {
    await createActivityFromInput();
  } catch (error) {
    void error;
  }
});

els.createTopicButton?.addEventListener("click", async () => {
  try {
    await createTopicFromInput();
  } catch (error) {
    void error;
  }
});

els.topicPoolInput?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  try {
    await createTopicFromInput();
  } catch (error) {
    void error;
  }
});

els.batchTopicInput?.addEventListener("input", () => {
  state.selectedTopicIds = [];
  state.selectedTopicId = "";
  updateBatchCreateButtonState(getDraftConfig());
  renderTopicPool();
  bindDynamicLists();
});

els.batchStatusFilter?.addEventListener("change", async () => {
  state.batchFilterStatus = els.batchStatusFilter.value || "all";
  try {
    await reloadScaleCollections();
  } catch (error) {
    reportError("筛选批量任务失败", error);
  }
});

els.batchSearchInput?.addEventListener("input", () => {
  state.batchFilterQuery = els.batchSearchInput.value || "";
  if (state.batchSearchTimer) window.clearTimeout(state.batchSearchTimer);
  state.batchSearchTimer = window.setTimeout(() => {
    reloadScaleCollections().catch((error) => reportError("搜索批量任务失败", error));
  }, 220);
});

els.refreshBatchesButton?.addEventListener("click", async () => {
  try {
    await reloadScaleCollections();
  } catch (error) {
    reportError("刷新批量状态失败", error);
  }
});

els.createBatchButton?.addEventListener("click", async () => {
  try {
    await createBatchFromInput();
  } catch (error) {
    void error;
  }
});

els.accountSelect.addEventListener("change", async () => {
  const account = getAccountById(els.accountSelect.value);
  const currentConfig = getDraftConfig();
  try {
    applyDraftConfigPatch(
      buildConfigFromAccount(account, currentConfig, {forceTemplate: false}),
      "\u5df2\u66f4\u65b0\u65b0\u4efb\u52a1\u9ed8\u8ba4\u8d26\u53f7\uff0c\u5f53\u524d\u4efb\u52a1\u4e0d\u53d7\u5f71\u54cd\u3002",
    );
  } catch (error) {
    void error;
  }
});

els.templateSelect.addEventListener("change", async () => {
  const template = getTemplateById(els.templateSelect.value);
  try {
    if (template?.id) {
      await requestTemplateChange(template.id, {reason: "manual"});
    }
  } catch (error) {
    void error;
  }
});

els.templateLockToggle.addEventListener("change", async () => {
  try {
    applyDraftConfigPatch({templateLocked: els.templateLockToggle.checked});
  } catch (error) {
    void error;
  }
});

els.generationModeInlineInput?.addEventListener("change", () => {
  updateGenerationMode(els.generationModeInlineInput.value, {persist: true, toast: true});
});

els.subtitleFontSizeInlineInput?.addEventListener("change", () => {
  const subtitleFontSize = normalizeSubtitleFontSize(els.subtitleFontSizeInlineInput.value);
  state.settings = {...state.settings, subtitleFontSize};
  saveSettings();
  applyConfigPatch({subtitleFontSize})
    .then(() => showToast(`字幕字号已更新为 ${subtitleFontSize}`, "success"))
    .catch(console.error);
});

els.subtitleColorInlineInput?.addEventListener("change", () => {
  const subtitleColor = normalizeSubtitleColor(els.subtitleColorInlineInput.value);
  state.settings = {...state.settings, subtitleColor};
  saveSettings();
  applyConfigPatch({subtitleColor})
    .then(() => showToast(`瀛楀箷棰滆壊宸叉洿鏂颁负 ${subtitleColor}`, "success"))
    .catch(console.error);
});

els.openInstructionInput.addEventListener("input", scheduleInstructionUpdate);

els.composerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = els.composerInput.value.trim();
  if (!text) {
    showToast("\u8bf7\u5148\u8f93\u5165\u89c6\u9891\u9700\u6c42\u6216\u8981\u7ee7\u7eed\u8ffd\u95ee\u7684\u5185\u5bb9\u3002", "info");
    els.composerInput.focus();
    return;
  }

  try {
    await sendMessage(text);
    els.composerInput.value = "";
  } catch (error) {
    void error;
  }
});

els.createAndSendButton?.addEventListener("click", async () => {
  await createAndSendFromComposer();
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

els.runAllButton?.addEventListener("click", async () => {
  try {
    await runFullPipelineStable();
  } catch (error) {
    void error;
  }
});

els.recoverJobButton?.addEventListener("click", async () => {
  try {
    await recoverActiveJob();
  } catch (error) {
    void error;
  }
});

els.archiveJobButton?.addEventListener("click", async () => {
  try {
    await toggleActiveJobArchive();
  } catch (error) {
    void error;
  }
});

els.artifactList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-poster-action]");
  if (!button) return;
  event.preventDefault();
  try {
    await handlePosterAction(button.dataset.posterAction, button.dataset);
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

els.openOutputButton?.addEventListener("click", async () => {
  const outputDir = state.activeJob?.outputDir || "data/jobs";
  const absolutePath = getWorkspaceAbsolutePath(outputDir);
  const copied = await copyTextToClipboard(absolutePath || outputDir);
  if (copied) {
    setBanner("\u8f93\u51fa\u76ee\u5f55\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f\u3002", "success");
    showToast("\u76ee\u5f55\u8def\u5f84\u5df2\u590d\u5236", "success");
    return;
  }
  reportError("\u590d\u5236\u8f93\u51fa\u76ee\u5f55\u5931\u8d25", new Error("\u8bf7\u624b\u52a8\u590d\u5236\u8f93\u51fa\u76ee\u5f55\u8def\u5f84"));
});

els.exportButton?.addEventListener("click", async () => {
  const target = await getExportTarget(state.activeJob);
  if (target.blocked) {
    setBanner(target.reason, "warning");
    showToast(target.reason, "warning");
    setActionState();
    return;
  }
  triggerDownload(target.item);
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
els.editAccountButton?.addEventListener("click", () => {
  const account = getCurrentAccount();
  if (account) openAccountEditor(account);
});
els.archiveAccountButton?.addEventListener("click", () => {
  toggleAccountArchive().catch((error) => {
    void error;
  });
});
els.deleteAccountButton?.addEventListener("click", () => {
  removeCurrentAccount().catch((error) => {
    void error;
  });
});
els.closeAccountModalButton.addEventListener("click", closeAccountModal);
els.cancelAccountButton.addEventListener("click", closeAccountModal);

els.accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await saveAccount(new FormData(els.accountForm));
  } catch (error) {
    reportError(state.accountModalMode === "edit" ? "\u4fdd\u5b58\u8d26\u53f7\u5931\u8d25" : "\u521b\u5efa\u8d26\u53f7\u5931\u8d25", error);
  }
});

els.accountModal.addEventListener("click", (event) => {
  if (event.target === els.accountModal) {
    closeAccountModal();
  }
});

els.renderConfirmModal?.addEventListener("click", (event) => {
  if (event.target === els.renderConfirmModal) {
    closeRenderConfirmModal(false);
  }
});

els.closeRenderConfirmButton?.addEventListener("click", () => closeRenderConfirmModal(false));
els.cancelRenderConfirmButton?.addEventListener("click", () => closeRenderConfirmModal(false));
els.confirmRenderButton?.addEventListener("click", () => closeRenderConfirmModal(true));

els.settingsButton?.addEventListener("click", openSettingsModal);
els.closeSettingsModalButton?.addEventListener("click", closeSettingsModal);
els.cancelSettingsButton?.addEventListener("click", closeSettingsModal);
els.saveSettingsButton?.addEventListener("click", () => {
  persistSettingsAndModelFromModal().catch((error) => {
    reportError("保存设置失败", error);
  });
});
els.settingsModal?.addEventListener("click", (event) => {
  if (event.target === els.settingsModal) {
    closeSettingsModal();
  }
});

els.batchDetailDrawer?.addEventListener("click", (event) => {
  if (event.target === els.batchDetailDrawer) {
    closeBatchDrawer();
  }
});

els.closeBatchDrawerButton?.addEventListener("click", closeBatchDrawer);
els.pauseBatchButton?.addEventListener("click", () => {
  controlBatchQueue("pause").catch((error) => {
    void error;
  });
});
els.resumeBatchButton?.addEventListener("click", () => {
  controlBatchQueue("resume").catch((error) => {
    void error;
  });
});
els.cancelBatchButton?.addEventListener("click", () => {
  controlBatchQueue("cancel").catch((error) => {
    void error;
  });
});
els.forceCancelBatchButton?.addEventListener("click", () => {
  controlBatchQueue("cancel", {force: true}).catch((error) => {
    void error;
  });
});
els.downloadBatchButton?.addEventListener("click", () => downloadBatchArtifacts());

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (els.batchDetailDrawer && !els.batchDetailDrawer.hidden) {
    closeBatchDrawer();
    return;
  }
  if (els.taskCreateModal && !els.taskCreateModal.hidden) {
    closeTaskCreateModal();
    return;
  }
  if (els.renderConfirmModal && !els.renderConfirmModal.hidden) {
    closeRenderConfirmModal(false);
    return;
  }
  if (els.settingsModal && !els.settingsModal.hidden) {
    closeSettingsModal();
    return;
  }
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

loadSettings();
applySettingsToUi();
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
