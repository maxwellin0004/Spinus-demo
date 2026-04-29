"""
使用 yt-dlp 提取 TikTok 用户主页视频元数据（社区维护 extractor，改版时往往能跟上）。
依赖：pip install yt-dlp，运行时等价于 `python -m yt_dlp ...`

若 `https://www.tiktok.com/@handle` 失败（如 Unable to extract secondary user ID），
会再从主页 HTML 解析 secUid / 数字 id，用官方推荐的 `tiktokuser:...` 形式重试。
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any

from .tiktok_fetch import sort_tiktok_videos_by_time
from .tiktok_fetch_http import resolve_user_ids_for_ytdlp


def _yt_dlp_cmd() -> list[str]:
    return [sys.executable, "-m", "yt_dlp"]


def _map_entry(j: dict[str, Any]) -> dict[str, Any] | None:
    if not isinstance(j, dict):
        return None
    if j.get("_type") == "playlist" and j.get("entries"):
        return None
    vid = j.get("id")
    if not vid:
        return None
    title = j.get("title") or j.get("description") or ""
    if not isinstance(title, str):
        title = str(title)
    ts = j.get("timestamp")
    pub: str | None = None
    if ts is not None:
        try:
            pub = datetime.fromtimestamp(int(ts), tz=timezone.utc).isoformat()
        except (TypeError, ValueError, OSError, OverflowError):
            pub = None
    vc = j.get("view_count")
    lc = j.get("like_count")

    def _ni(x: Any) -> int | None:
        if x is None:
            return None
        try:
            return int(x)
        except (TypeError, ValueError):
            return None

    return {
        "id": str(vid),
        "desc": title[:200],
        "published_at": pub,
        "play_count": _ni(vc),
        "digg_count": _ni(lc),
        "collect_count": None,
    }


def _parse_ytdlp_stdout(stdout: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            j = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(j, dict) and j.get("entries"):
            for e in j.get("entries") or []:
                if isinstance(e, dict):
                    m = _map_entry(e)
                    if m:
                        out.append(m)
            continue
        m = _map_entry(j)
        if m:
            out.append(m)
    return out


def _dedupe_videos(videos: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    uniq: list[dict[str, Any]] = []
    for v in videos:
        i = v.get("id")
        if i and str(i) not in seen:
            seen.add(str(i))
            uniq.append(v)
    return uniq


def _run_ytdlp(url: str, max_videos: int) -> subprocess.CompletedProcess[str]:
    cmd = _yt_dlp_cmd() + [
        "-j",
        "--no-download",
        "--skip-download",
        "--playlist-end",
        str(max(1, max_videos)),
        "--quiet",
        "--no-warnings",
        url,
    ]
    return subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=180,
        encoding="utf-8",
        errors="replace",
    )


def _try_ytdlp_urls(
    url_list: list[str],
    max_videos: int,
) -> tuple[list[dict[str, Any]], str, subprocess.CompletedProcess[str] | None]:
    last_err = ""
    last_p: subprocess.CompletedProcess[str] | None = None
    for u in url_list:
        try:
            p = _run_ytdlp(u, max_videos)
        except FileNotFoundError:
            return (
                [],
                "无法启动 Python/yt-dlp（请 pip install yt-dlp）",
                None,
            )
        except subprocess.TimeoutExpired:
            return [], "yt-dlp 抓取超时", None
        last_p = p
        vids = _dedupe_videos(_parse_ytdlp_stdout(p.stdout or ""))
        if vids:
            return vids, "", p
        err = ((p.stderr or "") + (p.stdout or ""))[:900]
        last_err = err or f"exit {p.returncode}"
    return [], last_err, last_p


def fetch_one_user_ytdlp(
    username: str,
    max_videos: int,
    ms_token: str | None = None,
) -> dict[str, Any]:
    clean = username.lstrip("@").strip()
    profile_url = f"https://www.tiktok.com/@{clean}"

    videos, err, _last_p = _try_ytdlp_urls([profile_url], max_videos)

    if not videos:
        sec_uid, numeric_id = resolve_user_ids_for_ytdlp(clean, ms_token)
        extra: list[str] = []
        if sec_uid:
            extra.append(f"tiktokuser:{sec_uid}")
        if numeric_id and numeric_id != sec_uid:
            tu = f"tiktokuser:{numeric_id}"
            if tu not in extra:
                extra.append(tu)
        if extra:
            videos, err, _last_p = _try_ytdlp_urls(extra, max_videos)

    if not videos:
        hint = (
            " 建议：pip install -U yt-dlp；在 config 配置 tiktok.ms_token；"
            "仍失败多为 TikTok 端变更，需等国区 yt-dlp 更新。"
        )
        return {
            "username": clean,
            "error": f"yt-dlp: {(err or '无输出')[:650]}{hint}",
            "videos": [],
        }

    sort_tiktok_videos_by_time(videos)
    return {"username": clean, "error": None, "videos": videos[:max_videos]}


def fetch_tiktok_users_ytdlp(
    usernames: list[str],
    max_videos_per_user: int,
    ms_token: str | None = None,
) -> dict[str, Any]:
    """与 HTTP / Playwright 相同的返回结构。"""
    users: list[dict[str, Any]] = []
    for name in usernames:
        users.append(fetch_one_user_ytdlp(name, max_videos_per_user, ms_token))
    return {"users": users}
