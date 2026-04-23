const threadList = document.querySelector("#threadList");
const composerForm = document.querySelector("#composerForm");
const composerInput = document.querySelector("#composerInput");
const stepList = document.querySelector("#stepList");
const logStream = document.querySelector("#logStream");
const previewProgress = document.querySelector("#previewProgress");
const previewStatus = document.querySelector("#previewStatus");
const subtitleBand = document.querySelector("#subtitleBand");
const jobStatusLabel = document.querySelector("#jobStatusLabel");

const state = {
  logs: [],
  previewProgress: 36,
  currentStep: 1,
  steps: [
    {
      title: "解析视频需求",
      detail: "提取平台、时长、比例、主题、语气和模板候选。",
      status: "done",
    },
    {
      title: "生成 video_plan.json",
      detail: "Codex 基于本地模板和素材目录生成结构化任务计划。",
      status: "running",
    },
    {
      title: "生成口播与字幕",
      detail: "拆出 Hook、主体、转场、结尾，并保留字幕高亮字段。",
      status: "waiting",
    },
    {
      title: "生成 TTS 与时间轴",
      detail: "调用本地配音脚本，写入音频和 word timestamps。",
      status: "waiting",
    },
    {
      title: "绑定 Remotion Composition",
      detail: "把计划和字幕注入 new_signals 竖屏模板。",
      status: "waiting",
    },
    {
      title: "渲染 MP4",
      detail: "执行 Remotion 渲染并把产物写入 data/jobs。",
      status: "waiting",
    },
  ],
};

const initialMessages = [
  {
    role: "assistant",
    meta: "Codex",
    text: "当前工作区已定位到 D:\\program\\ai_video\\workflow。可以把视频需求发给我，我会先生成任务计划，再进入配音和渲染。",
  },
  {
    role: "user",
    meta: "You",
    text: "生成一个 60 秒竖屏交易教育视频，主题是假突破，节奏紧凑，适合小红书。",
  },
  {
    role: "assistant",
    meta: "Codex",
    text: "已选择 new_signals 模板。下一步会生成 video_plan.json，并检查本地 assets、data/templates、video-app/src/compositions。",
  },
];

function renderMessages(messages) {
  threadList.innerHTML = messages
    .map(
      (message) => `
        <article class="message ${message.role === "user" ? "user" : "assistant"}">
          <div class="meta">${message.meta}</div>
          <div class="bubble">${escapeHtml(message.text)}</div>
        </article>
      `,
    )
    .join("");
  threadList.scrollTop = threadList.scrollHeight;
}

function renderSteps() {
  stepList.innerHTML = state.steps
    .map(
      (step, index) => `
        <li class="step-card is-${step.status}">
          <div class="step-index">${step.status === "done" ? iconCheck() : String(index + 1).padStart(2, "0")}</div>
          <div class="step-copy">
            <strong>${step.title}</strong>
            <p>${step.detail}</p>
          </div>
          <span class="step-state">${statusText(step.status)}</span>
        </li>
      `,
    )
    .join("");
}

function statusText(status) {
  const map = {
    done: "完成",
    running: "执行中",
    waiting: "等待",
    failed: "失败",
  };
  return map[status] || status;
}

function iconCheck() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6"></path>
    </svg>
  `;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addLog(line) {
  const time = new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  state.logs.push(`[${time}] ${line}`);
  logStream.textContent = state.logs.join("\n");
  logStream.scrollTop = logStream.scrollHeight;
}

function advancePipeline() {
  const runningIndex = state.steps.findIndex((step) => step.status === "running");
  if (runningIndex >= 0) {
    state.steps[runningIndex].status = "done";
  }

  const nextIndex = state.steps.findIndex((step) => step.status === "waiting");
  if (nextIndex >= 0) {
    state.steps[nextIndex].status = "running";
    state.currentStep = nextIndex;
    jobStatusLabel.textContent = state.steps[nextIndex].title.replace("生成 ", "").replace("绑定 ", "");
    addLog(`pipeline: ${state.steps[nextIndex].title}`);
  } else {
    jobStatusLabel.textContent = "已完成";
    previewStatus.innerHTML = "<span></span> Ready";
    previewStatus.classList.add("is-ready");
    addLog("render: output written to data/jobs/job_demo/output.mp4");
  }

  state.previewProgress = Math.min(100, state.previewProgress + 13);
  previewProgress.style.width = `${state.previewProgress}%`;
  renderSteps();
}

function addUserMessage(text) {
  const message = document.createElement("article");
  message.className = "message user";
  message.innerHTML = `
    <div class="meta">You</div>
    <div class="bubble">${escapeHtml(text)}</div>
  `;
  threadList.appendChild(message);
  threadList.scrollTop = threadList.scrollHeight;
}

function addAssistantMessage(text) {
  const message = document.createElement("article");
  message.className = "message assistant";
  message.innerHTML = `
    <div class="meta">Codex</div>
    <div class="bubble">${escapeHtml(text)}</div>
  `;
  threadList.appendChild(message);
  threadList.scrollTop = threadList.scrollHeight;
}

document.querySelectorAll(".prompt-toolbar button").forEach((button) => {
  button.addEventListener("click", () => {
    composerInput.value = button.dataset.prompt || "";
    composerInput.focus();
  });
});

document.querySelectorAll(".segmented-control button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segmented-control button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    document.querySelectorAll(".view-page").forEach((page) => page.classList.remove("is-active"));
    document.querySelector(`#${button.dataset.view}View`).classList.add("is-active");
  });
});

composerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = composerInput.value.trim();
  if (!text) return;

  addUserMessage(text);
  composerInput.value = "";
  addLog(`codex: received prompt "${text.slice(0, 36)}${text.length > 36 ? "..." : ""}"`);

  window.setTimeout(() => {
    addAssistantMessage("收到。我会先更新任务计划，再检查本地模板和素材绑定关系。");
    advancePipeline();
  }, 420);
});

document.querySelector("#generatePlanButton").addEventListener("click", () => {
  addLog("codex: writing data/jobs/job_demo/video_plan.json");
  advancePipeline();
});

document.querySelector("#ttsButton").addEventListener("click", () => {
  addLog("tts: generating voiceover and timestamps");
  advancePipeline();
  subtitleBand.textContent = "突破后的第一根回踩，才是你要等的信号";
});

document.querySelector("#renderButton").addEventListener("click", () => {
  addLog("remotion: render queued for NewSignalsComposition");
  const timer = window.setInterval(() => {
    state.previewProgress = Math.min(100, state.previewProgress + 8);
    previewProgress.style.width = `${state.previewProgress}%`;
    if (state.previewProgress >= 100) {
      window.clearInterval(timer);
      while (state.steps.some((step) => step.status !== "done")) {
        advancePipeline();
      }
    }
  }, 280);
});

document.querySelector("#playPreviewButton").addEventListener("click", () => {
  const subtitles = [
    "先等回踩确认，再判断量能是否跟上",
    "突破不是入场理由，确认才是",
    "真正的风险，来自连续追错方向",
  ];
  const next = subtitles[Math.floor(Math.random() * subtitles.length)];
  subtitleBand.textContent = next;
  addLog("preview: subtitle frame updated");
});

document.querySelector("#refreshButton").addEventListener("click", () => {
  addLog("system: refreshed project state");
});

document.querySelector("#attachButton").addEventListener("click", () => {
  addAssistantMessage("素材入口已预留。接入本地服务后会打开 assets 和 data/source_videos 的文件选择。");
});

renderMessages(initialMessages);
renderSteps();
addLog("system: workspace D:\\program\\ai_video\\workflow");
addLog("codex: bridge adapter pending");
addLog("remotion: video-app package detected");
