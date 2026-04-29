const nf = new Intl.NumberFormat("zh-CN");

const $ = (id) => document.getElementById(id);

const state = {
  accounts: {
    youtubeChannels: [],
    tiktokUsers: [],
    configPath: "",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtNum(v) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return nf.format(n);
}

function fmtTime(iso) {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("zh-CN", {timeZone: "Asia/Shanghai"});
}

function setStatus(text) {
  $("status-text").textContent = text;
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || payload.detail || res.statusText || "Request failed");
  }
  return payload;
}

function showSectionPlaceholders(skipYoutube, skipTiktok) {
  const tpl = $("tpl-section-loading");
  const ytRoot = $("youtube-root");
  const ttRoot = $("tiktok-root");

  if (!skipYoutube && ytRoot && tpl) {
    ytRoot.innerHTML = "";
    ytRoot.appendChild(tpl.content.cloneNode(true));
  } else if (skipYoutube && ytRoot) {
    ytRoot.innerHTML = '<div class="empty-hint">当前只请求 TikTok，已跳过 YouTube。</div>';
  }

  if (!skipTiktok && ttRoot && tpl) {
    ttRoot.innerHTML = "";
    ttRoot.appendChild(tpl.content.cloneNode(true));
  } else if (skipTiktok && ttRoot) {
    ttRoot.innerHTML = '<div class="empty-hint">当前只请求 YouTube，已跳过 TikTok。</div>';
  }
}

async function fetchStats() {
  const onlyYt = $("only-youtube").checked;
  const onlyTt = $("only-tiktok").checked;
  let skipYoutube = onlyTt;
  let skipTiktok = onlyYt;
  if (onlyYt && onlyTt) {
    skipYoutube = false;
    skipTiktok = false;
  }
  const q = new URLSearchParams();
  if (skipYoutube) q.set("skip_youtube", "true");
  if (skipTiktok) q.set("skip_tiktok", "true");
  const url = `/api/stats${q.toString() ? `?${q}` : ""}`;
  return requestJson(url);
}

function renderMeta(data) {
  const meta = data.meta || {};
  const fetchedAt = meta.fetched_at;
  $("meta-time").textContent = fetchedAt
    ? new Date(fetchedAt).toLocaleString("zh-CN", {timeZone: "Asia/Shanghai"})
    : "—";
  const parts = [];
  if (meta.tiktok_note) parts.push(meta.tiktok_note);
  if (meta.tiktok_source) parts.push(`TikTok 来源: ${meta.tiktok_source}`);
  if (data.tiktok_fetch_error) parts.push(`TikTok 整体失败: ${data.tiktok_fetch_error}`);
  $("meta-note").textContent = parts.join(" | ");
}

function addStatRow(container, items) {
  container.innerHTML = "";
  for (const [k, v] of items) {
    const div = document.createElement("div");
    div.className = "stat";
    div.innerHTML = `<span class="stat-k">${escapeHtml(k)}</span><span class="stat-v">${escapeHtml(v)}</span>`;
    container.appendChild(div);
  }
}

function appendYouTubeRow(tbody, video) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="vid-title">${escapeHtml(video.title || "")}</td>
    <td>${escapeHtml(fmtTime(video.published_at))}</td>
    <td>${escapeHtml(fmtNum(video.view_count))}</td>
    <td>${escapeHtml(fmtNum(video.like_count))}</td>
    <td>${escapeHtml(fmtNum(video.comment_count))}</td>
  `;
  tbody.appendChild(tr);
}

function appendTikTokRow(tbody, video) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="vid-title">${escapeHtml(video.desc || "")}</td>
    <td>${escapeHtml(fmtTime(video.published_at))}</td>
    <td>${escapeHtml(fmtNum(video.play_count))}</td>
    <td>${escapeHtml(fmtNum(video.digg_count))}</td>
    <td>${escapeHtml(fmtNum(video.collect_count))}</td>
  `;
  tbody.appendChild(tr);
}

function bindAccountTitleToggle(article, titleEl, subEl, countVideos) {
  const base =
    countVideos > 0
      ? `首页先显示最新 1 条，点击账号名查看全部 ${countVideos} 条内容`
      : "点击账号名查看详情";
  const expanded = "再次点击账号名收起详情";
  subEl.textContent = base;

  const toggle = () => {
    const on = article.classList.toggle("is-detail");
    subEl.textContent = on ? expanded : base;
  };

  titleEl.addEventListener("click", (event) => {
    event.preventDefault();
    toggle();
  });
  titleEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  });
}

function renderYouTube(data) {
  const root = $("youtube-root");
  root.innerHTML = "";
  const yt = data.youtube;
  if (!yt) {
    root.innerHTML = '<div class="empty-hint">没有返回 YouTube 数据。</div>';
    return;
  }
  const channels = yt.channels || [];
  const tpl = $("tpl-yt-card");

  for (const channel of channels) {
    const node = tpl.content.cloneNode(true);
    const article = node.querySelector(".card");
    const titleEl = node.querySelector(".card-title");
    const subEl = node.querySelector(".card-sub");
    const statsRow = node.querySelector(".stats-row");
    const errHome = node.querySelector(".error-msg-home");
    const tbody = node.querySelector(".card-detail tbody");
    const preview = node.querySelector(".card-preview");
    const previewWrap = node.querySelector(".card-preview-table-wrap");
    const previewEmpty = node.querySelector(".card-preview-empty");
    const tbodyPreview = node.querySelector(".tbody-preview");

    if (channel.error) {
      titleEl.textContent = channel.query || "未知频道";
      subEl.textContent = "该账号拉取失败";
      errHome.textContent = channel.error;
      errHome.classList.remove("hidden");
      article.classList.add("card-no-detail");
      titleEl.classList.remove("card-title-account");
      titleEl.removeAttribute("role");
      titleEl.removeAttribute("tabindex");
      root.appendChild(article);
      continue;
    }

    titleEl.textContent = channel.title || channel.channel_id;
    const videos = channel.videos || [];

    addStatRow(statsRow, [
      ["订阅", fmtNum(channel.subscriber_count)],
      ["频道总播放", fmtNum(channel.channel_view_count)],
      ["视频数", fmtNum(channel.video_count)],
    ]);

    if (videos.length > 0) {
      preview.classList.remove("hidden");
      previewWrap.classList.remove("hidden");
      previewEmpty.classList.add("hidden");
      appendYouTubeRow(tbodyPreview, videos[0]);
    } else {
      preview.classList.remove("hidden");
      previewWrap.classList.add("hidden");
      previewEmpty.classList.remove("hidden");
    }

    for (const video of videos) appendYouTubeRow(tbody, video);
    bindAccountTitleToggle(article, titleEl, subEl, videos.length);
    root.appendChild(article);
  }

  if (channels.length === 0) {
    root.innerHTML = '<div class="empty-hint">没有配置 YouTube 频道。</div>';
  }
}

function renderTikTok(data) {
  const root = $("tiktok-root");
  root.innerHTML = "";
  const tt = data.tiktok;
  const tpl = $("tpl-tt-card");

  if (!tt || !(tt.users || []).length) {
    const msg = data.tiktok_fetch_error
      ? `拉取失败：${escapeHtml(data.tiktok_fetch_error)}`
      : "没有配置 TikTok 账号。";
    root.innerHTML = `<div class="empty-hint">${msg}</div>`;
    return;
  }

  for (const user of tt.users || []) {
    const node = tpl.content.cloneNode(true);
    const article = node.querySelector(".card");
    const titleEl = node.querySelector(".card-title");
    const subEl = node.querySelector(".card-sub");
    const statsRow = node.querySelector(".stats-row");
    const errHome = node.querySelector(".error-msg-home");
    const tbody = node.querySelector(".card-detail tbody");
    const preview = node.querySelector(".card-preview");
    const previewWrap = node.querySelector(".card-preview-table-wrap");
    const previewEmpty = node.querySelector(".card-preview-empty");
    const tbodyPreview = node.querySelector(".tbody-preview");

    titleEl.textContent = `@${user.username}`;

    if (user.error) {
      subEl.textContent = "该账号拉取失败";
      errHome.textContent = user.error;
      errHome.classList.remove("hidden");
      article.classList.add("card-no-detail");
      titleEl.classList.remove("card-title-account");
      titleEl.removeAttribute("role");
      titleEl.removeAttribute("tabindex");
      root.appendChild(article);
      continue;
    }

    const videos = user.videos || [];
    let totalPlay = 0;
    let totalLike = 0;
    let totalCollect = 0;
    for (const video of videos) {
      totalPlay += Number(video.play_count || 0);
      totalLike += Number(video.digg_count || 0);
      totalCollect += Number(video.collect_count || 0);
    }

    if (videos.length > 0) {
      const latest = videos[0];
      addStatRow(statsRow, [
        ["最新播放", fmtNum(latest.play_count)],
        ["最新点赞", fmtNum(latest.digg_count)],
        ["最新收藏", fmtNum(latest.collect_count)],
        ["发布时间", fmtTime(latest.published_at)],
        ["本批总播放", fmtNum(totalPlay)],
        ["本批总点赞", fmtNum(totalLike)],
        ["本批总收藏", fmtNum(totalCollect)],
      ]);
      preview.classList.remove("hidden");
      previewWrap.classList.remove("hidden");
      previewEmpty.classList.add("hidden");
      appendTikTokRow(tbodyPreview, latest);
    } else {
      addStatRow(statsRow, []);
      preview.classList.remove("hidden");
      previewWrap.classList.add("hidden");
      previewEmpty.classList.remove("hidden");
    }

    for (const video of videos) appendTikTokRow(tbody, video);
    bindAccountTitleToggle(article, titleEl, subEl, videos.length);
    root.appendChild(article);
  }
}

function renderAccountList(platform, items) {
  const root = $(platform === "youtube" ? "youtube-accounts" : "tiktok-accounts");
  const count = $(platform === "youtube" ? "youtube-count" : "tiktok-count");
  count.textContent = `${items.length} 个`;

  if (!items.length) {
    root.innerHTML = '<p class="empty-inline">还没有配置账号</p>';
    return;
  }

  root.innerHTML = items
    .map((item) => {
      const display = platform === "youtube" ? item : `@${item}`;
      return `
        <article class="account-chip">
          <span class="account-chip-label">${escapeHtml(display)}</span>
          <button
            type="button"
            class="account-chip-remove"
            data-platform="${escapeHtml(platform)}"
            data-account="${escapeHtml(item)}"
          >
            删除
          </button>
        </article>
      `;
    })
    .join("");
}

function renderAccounts() {
  $("config-path").textContent = state.accounts.configPath || "";
  renderAccountList("youtube", state.accounts.youtubeChannels || []);
  renderAccountList("tiktok", state.accounts.tiktokUsers || []);
}

async function loadAccounts() {
  state.accounts = await requestJson("/api/monitor/accounts");
  renderAccounts();
}

async function addAccount(event) {
  event.preventDefault();
  const platform = $("account-platform").value;
  const account = $("account-input").value.trim();
  if (!account) {
    setStatus("请输入账号");
    $("account-input").focus();
    return;
  }

  setStatus("保存中...");
  state.accounts = await requestJson("/api/monitor/accounts", {
    method: "POST",
    body: JSON.stringify({platform, account}),
  });
  renderAccounts();
  $("account-input").value = "";
  setStatus("账号已添加");
  await load();
}

async function removeAccount(button) {
  const platform = button.dataset.platform || "";
  const account = button.dataset.account || "";
  setStatus("删除中...");
  state.accounts = await requestJson(
    `/api/monitor/accounts?platform=${encodeURIComponent(platform)}&account=${encodeURIComponent(account)}`,
    {method: "DELETE"},
  );
  renderAccounts();
  setStatus("账号已删除");
  await load();
}

async function load() {
  const onlyYt = $("only-youtube").checked;
  const onlyTt = $("only-tiktok").checked;
  let skipYoutube = onlyTt;
  let skipTiktok = onlyYt;
  if (onlyYt && onlyTt) {
    skipYoutube = false;
    skipTiktok = false;
  }

  showSectionPlaceholders(skipYoutube, skipTiktok);
  setStatus("拉取中...");

  try {
    const data = await fetchStats();
    renderMeta(data);
    if (!skipYoutube) renderYouTube(data);
    if (!skipTiktok) renderTikTok(data);
    setStatus("完成");
  } catch (error) {
    console.error(error);
    setStatus("失败");
    $("meta-note").textContent = error.message || String(error);
    if (!skipYoutube) {
      $("youtube-root").innerHTML = `<div class="empty-hint">加载失败：${escapeHtml(error.message || "")}</div>`;
    }
    if (!skipTiktok) {
      $("tiktok-root").innerHTML = `<div class="empty-hint">加载失败：${escapeHtml(error.message || "")}</div>`;
    }
  }
}

$("btn-refresh").addEventListener("click", () => {
  load().catch((error) => {
    console.error(error);
    setStatus(error.message || "刷新失败");
  });
});

$("account-form").addEventListener("submit", (event) => {
  addAccount(event).catch((error) => {
    console.error(error);
    setStatus(error.message || "保存失败");
  });
});

$("youtube-accounts").addEventListener("click", (event) => {
  const button = event.target.closest(".account-chip-remove");
  if (!button) return;
  removeAccount(button).catch((error) => {
    console.error(error);
    setStatus(error.message || "删除失败");
  });
});

$("tiktok-accounts").addEventListener("click", (event) => {
  const button = event.target.closest(".account-chip-remove");
  if (!button) return;
  removeAccount(button).catch((error) => {
    console.error(error);
    setStatus(error.message || "删除失败");
  });
});

Promise.all([loadAccounts(), load()]).catch((error) => {
  console.error(error);
  setStatus(error.message || "加载失败");
});
