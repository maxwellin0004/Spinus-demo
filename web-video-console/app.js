const els = {
  workspacePath: document.querySelector("#workspacePath"),
  threadList: document.querySelector("#threadList"),
  composerForm: document.querySelector("#composerForm"),
  composerInput: document.querySelector("#composerInput"),
  stepList: document.querySelector("#stepList"),
  logStream: document.querySelector("#logStream"),
  previewProgress: document.querySelector("#previewProgress"),
  previewStatus: document.querySelector("#previewStatus"),
  subtitleBand: document.querySelector("#subtitleBand"),
  jobStatusLabel: document.querySelector("#jobStatusLabel"),
  activeJobTitle: document.querySelector("#activeJobTitle"),
  jobTemplateLabel: document.querySelector("#jobTemplateLabel"),
  jobAspectLabel: document.querySelector("#jobAspectLabel"),
  jobOutputLabel: document.querySelector("#jobOutputLabel"),
  resourceGrid: document.querySelector("#resourceGrid"),
  templateList: document.querySelector("#templateList"),
  jobHistoryList: document.querySelector("#jobHistoryList"),
  previewImage: document.querySelector("#previewImage"),
  episodeLabel: document.querySelector("#episodeLabel"),
  previewHeadline: document.querySelector("#previewHeadline"),
  previewSummary: document.querySelector("#previewSummary"),
  scriptPanel: document.querySelector("#scriptPanel"),
  refreshButton: document.querySelector("#refreshButton"),
  generatePlanButton: document.querySelector("#generatePlanButton"),
  ttsButton: document.querySelector("#ttsButton"),
  renderButton: document.querySelector("#renderButton"),
  playPreviewButton: document.querySelector("#playPreviewButton"),
  attachButton: document.querySelector("#attachButton"),
};

const state = {
  project: null,
  templates: [],
  assets: [],
  jobs: [],
  activeJob: null,
  eventSource: null,
};

function escapeHtml(value) {
  return String(value)
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

function localizeJobStatus(status) {
  const map = {
    planning: "规划中",
    tts: "配音中",
    completed: "已完成",
    awaiting_review: "待审核",
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

function setPreviewStatus(job) {
  const text = job.preview?.statusText || localizeJobStatus(job.status);
  els.previewStatus.innerHTML = `<span></span>${escapeHtml(text)}`;
  els.previewStatus.classList.toggle("is-ready", job.status === "completed");
}

function renderMessages(messages) {
  els.threadList.innerHTML = messages
    .map(
      (message) => `
        <article class="message ${message.role === "user" ? "user" : "assistant"}">
          <div class="meta">${escapeHtml(message.meta || (message.role === "user" ? "You" : "Codex"))}</div>
          <div class="bubble">${escapeHtml(message.text || "")}</div>
        </article>
      `,
    )
    .join("");
  els.threadList.scrollTop = els.threadList.scrollHeight;
}

function renderSteps(steps) {
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

function iconCheck() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6"></path>
    </svg>
  `;
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

function renderTemplates() {
  const activeTemplate = state.activeJob?.templateId;
  els.templateList.innerHTML = state.templates
    .map(
      (template) => `
        <button type="button" class="template-item ${template.id === activeTemplate ? "is-selected" : ""}" data-template-id="${escapeHtml(template.id)}">
          <span>${escapeHtml(template.id)}</span>
          <strong>${escapeHtml(template.title)}</strong>
        </button>
      `,
    )
    .join("");
}

function renderJobHistory() {
  els.jobHistoryList.innerHTML = state.jobs
    .map(
      (job) => `
        <button type="button" class="template-item ${job.id === state.activeJob?.id ? "is-selected" : ""}" data-job-id="${escapeHtml(job.id)}">
          <span>${escapeHtml(localizeJobStatus(job.status))} / ${escapeHtml(job.templateId || "runtime")}</span>
          <strong>${escapeHtml(job.title)}</strong>
        </button>
      `,
    )
    .join("");
}

function renderScriptPanel(sections) {
  els.scriptPanel.innerHTML = sections
    .map(
      (section) => `
        <div class="script-row">
          <span>${escapeHtml(section.label || "Section")}</span>
          <p>${escapeHtml(section.text || "")}</p>
        </div>
      `,
    )
    .join("");
}

function renderLogs(logs) {
  els.logStream.textContent = logs.join("\n");
  els.logStream.scrollTop = els.logStream.scrollHeight;
}

function renderPreview(job) {
  const preview = job.preview || {};
  els.previewImage.src = preview.imageUrl || "/workspace/assets/images/macd_ref_chart_2.jpg";
  els.episodeLabel.textContent = preview.episodeLabel || "Preview";
  els.previewHeadline.textContent = preview.headline || "预览";
  els.previewSummary.textContent = preview.summary || "";
  els.subtitleBand.textContent = preview.subtitle || "";
  els.previewProgress.style.width = `${Number(preview.progress || 0)}%`;
  setPreviewStatus(job);
}

function renderProject() {
  if (!state.project) return;
  els.workspacePath.textContent = state.project.workspacePath;
}

function renderJob(job) {
  state.activeJob = job;
  els.activeJobTitle.textContent = job.title || "未命名任务";
  els.jobStatusLabel.textContent = localizeJobStatus(job.status);
  els.jobTemplateLabel.textContent = job.templateId || "runtime";
  els.jobAspectLabel.textContent = job.aspectRatio || "9:16";
  els.jobOutputLabel.textContent = job.outputDir || "data/jobs";

  renderMessages(job.messages || []);
  renderSteps(job.steps || []);
  renderLogs(job.logs || []);
  renderPreview(job);
  renderScriptPanel(job.scriptSections || []);
  renderTemplates();
  renderJobHistory();
}

function bindDynamicLists() {
  els.jobHistoryList.querySelectorAll("[data-job-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const jobId = button.dataset.jobId;
      if (jobId) selectJob(jobId);
    });
  });
}

function refreshLayout() {
  renderProject();
  renderResources();
  renderTemplates();
  renderJobHistory();
  bindDynamicLists();
}

async function loadJobs() {
  const jobsPayload = await requestJson("/api/jobs");
  state.jobs = jobsPayload.items || [];
  renderJobHistory();
  bindDynamicLists();
}

async function loadBootstrap() {
  const [projectPayload, templatePayload, assetPayload, jobsPayload] = await Promise.all([
    requestJson("/api/projects"),
    requestJson("/api/templates"),
    requestJson("/api/assets"),
    requestJson("/api/jobs"),
  ]);

  state.project = projectPayload;
  state.templates = templatePayload.items || [];
  state.assets = assetPayload.items || [];
  state.jobs = jobsPayload.items || [];

  refreshLayout();
  const preferredJob = state.jobs.find((job) => job.source === "runtime") || state.jobs[0];
  if (preferredJob) {
    await selectJob(preferredJob.id);
  }
}

function connectToEvents(jobId) {
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }

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

async function selectJob(jobId) {
  const job = await requestJson(`/api/jobs/${encodeURIComponent(jobId)}`);
  renderJob(job);
  bindDynamicLists();
  connectToEvents(jobId);
}

async function createJob(prompt) {
  const job = await requestJson("/api/jobs", {
    method: "POST",
    body: JSON.stringify({prompt}),
  });
  await loadJobs();
  await selectJob(job.id);
}

async function sendMessage(message) {
  if (!state.activeJob || state.activeJob.source !== "runtime") {
    await createJob(message);
    return;
  }

  await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/codex/message`, {
    method: "POST",
    body: JSON.stringify({message}),
  });
}

async function runAction(action) {
  if (!state.activeJob) return;
  await requestJson(`/api/jobs/${encodeURIComponent(state.activeJob.id)}/actions/${action}`, {
    method: "POST",
  });
  await loadJobs();
}

document.querySelectorAll(".prompt-toolbar button").forEach((button) => {
  button.addEventListener("click", () => {
    els.composerInput.value = button.dataset.prompt || "";
    els.composerInput.focus();
  });
});

document.querySelectorAll(".segmented-control button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segmented-control button").forEach((item) => item.classList.remove("is-active"));
    document.querySelectorAll(".view-page").forEach((page) => page.classList.remove("is-active"));
    button.classList.add("is-active");
    document.querySelector(`#${button.dataset.view}View`).classList.add("is-active");
  });
});

els.composerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = els.composerInput.value.trim();
  if (!text) return;

  try {
    await sendMessage(text);
    els.composerInput.value = "";
    await loadJobs();
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
  if (!state.activeJob) return;
  const subtitles = [
    "先等回踩确认，再判断量能是否跟上",
    "突破不是入场理由，确认才是",
    "真正的风险，来自连续追错方向",
  ];
  const next = subtitles[Math.floor(Math.random() * subtitles.length)];
  els.subtitleBand.textContent = next;
});

els.refreshButton.addEventListener("click", async () => {
  try {
    await loadBootstrap();
  } catch (error) {
    console.error(error);
  }
});

els.attachButton.addEventListener("click", () => {
  els.composerInput.focus();
  els.composerInput.setAttribute("placeholder", "后续这里可以接本地素材选择器，指向 assets 和 data/source_videos。");
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
