"""TikTok：HTTP 快路 + yt-dlp + Playwright 三路并行，先返回且有条目的优先。"""

from __future__ import annotations

import asyncio
from typing import Any

from .settings import Settings
from .tiktok_fetch import fetch_tiktok_users
from .tiktok_fetch_http import fetch_tiktok_users_http
from .tiktok_fetch_ytdlp import fetch_tiktok_users_ytdlp


def _score_payload(data: dict[str, Any] | None) -> int:
    if not data:
        return 0
    return sum(len(u.get("videos") or []) for u in (data.get("users") or []))


async def _playwright_safe(settings: Settings) -> dict[str, Any]:
    try:
        return await fetch_tiktok_users(
            settings.tiktok_users,
            settings.tiktok_max_videos_per_user,
            settings.tiktok_ms_token,
            headless=settings.tiktok_headless,
            browser=settings.tiktok_browser,
        )
    except ModuleNotFoundError:
        return {
            "users": [],
            "_playwright_skipped": True,
            "_reason": "未安装 TikTokApi",
        }
    except Exception as e:
        return {"users": [], "_playwright_error": str(e)}


async def _ytdlp_safe(settings: Settings) -> dict[str, Any]:
    try:
        return await asyncio.to_thread(
            fetch_tiktok_users_ytdlp,
            settings.tiktok_users,
            settings.tiktok_max_videos_per_user,
            settings.tiktok_ms_token,
        )
    except Exception as e:
        return {"users": [], "_ytdlp_error": str(e)}


def _merge_two(r1: dict[str, Any], r2: dict[str, Any]) -> dict[str, Any]:
    m: dict[str, dict[str, Any]] = {}
    for r in (r1, r2):
        for u in r.get("users") or []:
            name = u.get("username")
            if not name:
                continue
            old = m.get(name)
            if old is None:
                m[name] = u
                continue
            lo, ln = len(old.get("videos") or []), len(u.get("videos") or [])
            if ln > lo:
                m[name] = u
            elif ln == lo and u.get("error") and not old.get("videos"):
                m[name] = u
    return {"users": list(m.values())}


def _merge_three(
    a: dict[str, Any],
    b: dict[str, Any],
    c: dict[str, Any],
) -> dict[str, Any]:
    return _merge_two(_merge_two(a, b), c)


async def fetch_tiktok_race(settings: Settings) -> tuple[dict[str, Any], str]:
    """
    同时启动 HTTP、yt-dlp、Playwright。
    任一路线先结束且总视频条数 > 0 → 采用该路并取消其余任务。
    若三路都无独立有效结果 → 合并每户条数最多的条目。
    """
    ms = settings.tiktok_ms_token
    n = settings.tiktok_max_videos_per_user
    users = settings.tiktok_users

    task_http = asyncio.create_task(fetch_tiktok_users_http(users, n, ms))
    task_ydlp = asyncio.create_task(_ytdlp_safe(settings))
    task_pw = asyncio.create_task(_playwright_safe(settings))

    label = {
        task_http: "http",
        task_ydlp: "ytdlp",
        task_pw: "playwright",
    }
    pending = {task_http, task_ydlp, task_pw}
    by_name: dict[str, dict[str, Any]] = {}

    while pending:
        done, pending = await asyncio.wait(
            pending,
            return_when=asyncio.FIRST_COMPLETED,
        )
        for t in done:
            name = label[t]
            try:
                r = t.result()
            except Exception as e:
                r = {"users": [], "_task_error": str(e)}
            by_name[name] = r
            if _score_payload(r) > 0:
                for p in pending:
                    p.cancel()
                for p in pending:
                    try:
                        await p
                    except asyncio.CancelledError:
                        pass
                    except Exception:
                        pass
                return r, name

    r_http = by_name.get("http", {"users": []})
    r_ydlp = by_name.get("ytdlp", {"users": []})
    r_pw = by_name.get("playwright", {"users": []})

    merged = _merge_three(r_http, r_ydlp, r_pw)
    if _score_payload(merged) > 0:
        # 按视频条数判断主要贡献来源（展示用）
        scores = [
            ("http", _score_payload(r_http)),
            ("ytdlp", _score_payload(r_ydlp)),
            ("playwright", _score_payload(r_pw)),
        ]
        best = max(scores, key=lambda x: x[1])
        return merged, f"merged_multi_{best[0]}" if best[1] > 0 else "merged_multi"
    return merged, "merged_all_empty"
