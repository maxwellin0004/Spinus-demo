from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass
class Settings:
    youtube_api_key: str
    youtube_channels: list[str]
    tiktok_users: list[str]
    tiktok_ms_token: str | None
    tiktok_max_videos_per_user: int
    youtube_max_videos_per_channel: int
    tiktok_headless: bool
    tiktok_browser: str


def load_settings(path: str | Path) -> Settings:
    p = Path(path)
    if not p.is_file():
        raise FileNotFoundError(
            f"找不到配置文件: {p.resolve()}。请复制 config.example.yaml 为 config.yaml 并填写。"
        )
    with open(p, encoding="utf-8") as f:
        raw: dict[str, Any] = yaml.safe_load(f) or {}

    yt = raw.get("youtube") or {}
    tk = raw.get("tiktok") or {}
    lim = raw.get("limits") or {}

    api_key = (yt.get("api_key") or "").strip()
    if not api_key or api_key == "YOUR_YOUTUBE_DATA_API_KEY":
        api_key = (os.environ.get("YOUTUBE_API_KEY") or "").strip()
    if not api_key:
        raise ValueError(
            "请设置 youtube.api_key，或环境变量 YOUTUBE_API_KEY（用于不想把密钥写进文件时）"
        )

    channels = yt.get("channels") or []
    if not isinstance(channels, list) or not channels:
        raise ValueError("请在 config.yaml 中配置 youtube.channels（至少一个频道）")

    users = tk.get("users") or []
    if not isinstance(users, list):
        users = []
    users = [str(u).strip().lstrip("@") for u in users if str(u).strip()]

    ms = tk.get("ms_token")
    if ms is not None and isinstance(ms, str):
        ms = ms.strip() or None

    headless = tk.get("headless")
    if headless is None:
        headless = True
    browser = (tk.get("browser") or "chromium").strip().lower()

    return Settings(
        youtube_api_key=api_key,
        youtube_channels=[str(c).strip() for c in channels],
        tiktok_users=users,
        tiktok_ms_token=ms,
        tiktok_max_videos_per_user=int(tk.get("max_videos_per_user") or 15),
        youtube_max_videos_per_channel=int(lim.get("max_videos_per_youtube_channel") or 25),
        tiktok_headless=bool(headless),
        tiktok_browser=browser if browser in ("chromium", "firefox", "webkit") else "chromium",
    )
