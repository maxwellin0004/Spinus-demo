from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

# 顶层不 import TikTokApi：未安装时仍可只用 YouTube；实际调用时再加载


def tiktok_published_iso(raw: dict[str, Any]) -> str | None:
    """createTime 为 Unix 秒 → ISO8601 UTC。"""
    ct = raw.get("createTime") if isinstance(raw, dict) else None
    if ct is None:
        ct = raw.get("create_time") if isinstance(raw, dict) else None
    if ct is None:
        return None
    try:
        ts = int(ct)
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError, OverflowError):
        return None


def sort_tiktok_videos_by_time(videos: list[dict[str, Any]]) -> None:
    """按 published_at 降序。"""

    def key(v: dict[str, Any]) -> float:
        s = v.get("published_at") or ""
        if not s:
            return 0.0
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
        except (TypeError, ValueError, OSError):
            return 0.0

    videos.sort(key=key, reverse=True)


def _extract_tiktok_stats(video_dict: dict[str, Any]) -> dict[str, int | None]:
    """Map TikTok raw item dict to play / like / collect."""
    raw = video_dict or {}
    stats = raw.get("statsV2") or raw.get("stats") or {}

    def _to_int(v: Any) -> int | None:
        if v is None:
            return None
        try:
            return int(v)
        except (TypeError, ValueError):
            try:
                return int(str(v).replace(",", "").strip())
            except (TypeError, ValueError):
                return None

    play = (
        _to_int(stats.get("playCount"))
        or _to_int(stats.get("play_count"))
        or _to_int(raw.get("playCount"))
    )
    digg = _to_int(stats.get("diggCount")) or _to_int(stats.get("digg_count"))
    collect = (
        _to_int(stats.get("collectCount"))
        or _to_int(stats.get("collect_count"))
    )

    return {
        "play_count": play,
        "digg_count": digg,
        "collect_count": collect,
    }


async def fetch_tiktok_users(
    usernames: list[str],
    max_videos_per_user: int,
    ms_token: str | None,
    *,
    headless: bool = True,
    browser: str = "chromium",
) -> dict[str, Any]:
    """
    Fetch recent videos per user using unofficial TikTokApi (Playwright).
    """
    try:
        from TikTokApi import TikTokApi
    except ModuleNotFoundError as e:
        raise ModuleNotFoundError(
            "未安装 TikTok 依赖包。请在当前 Python 环境中执行: "
            "pip install TikTokApi playwright && python -m playwright install chromium"
        ) from e

    result: dict[str, Any] = {"users": []}
    if not usernames:
        return result

    token_list = [ms_token] if ms_token else [None]
    browser_name = (os.getenv("TIKTOK_BROWSER") or browser or "chromium").lower()
    if browser_name not in ("chromium", "firefox", "webkit"):
        browser_name = "chromium"

    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=token_list,
            num_sessions=1,
            sleep_after=3,
            browser=browser_name,
            headless=headless,
        )

        for username in usernames:
            u_entry: dict[str, Any] = {
                "username": username,
                "error": None,
                "videos": [],
            }
            try:
                user = api.user(username=username)
                n = 0
                async for video in user.videos(count=max_videos_per_user):
                    vd = video.as_dict if hasattr(video, "as_dict") else {}
                    st = _extract_tiktok_stats(vd)
                    u_entry["videos"].append(
                        {
                            "id": getattr(video, "id", None) or vd.get("id"),
                            "desc": (vd.get("desc") or "")[:120],
                            "published_at": tiktok_published_iso(vd),
                            **st,
                        }
                    )
                    n += 1
                    if n >= max_videos_per_user:
                        break
                sort_tiktok_videos_by_time(u_entry["videos"])
            except Exception as e:
                u_entry["error"] = str(e)
            result["users"].append(u_entry)

    return result
