"""汇总拉取 YouTube + TikTok，供 CLI 与 Web 共用。"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from .settings import Settings
from .tiktok_race import fetch_tiktok_race
from .youtube_fetch import fetch_youtube


async def fetch_all_stats(
    settings: Settings,
    *,
    skip_youtube: bool = False,
    skip_tiktok: bool = False,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "meta": {
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
    }

    if not skip_youtube:
        payload["youtube"] = await asyncio.to_thread(
            fetch_youtube,
            settings.youtube_api_key,
            settings.youtube_channels,
            settings.youtube_max_videos_per_channel,
        )

    if skip_tiktok:
        return payload

    if not settings.tiktok_users:
        payload["tiktok"] = {"users": []}
        payload["meta"]["tiktok_note"] = "未配置 tiktok.users，已跳过"
        return payload

    try:
        tt, src = await fetch_tiktok_race(settings)
        payload["tiktok"] = tt
        payload["meta"]["tiktok_source"] = src
    except Exception as e:
        payload["tiktok_fetch_error"] = str(e)
        payload["tiktok"] = {"users": []}

    return payload
