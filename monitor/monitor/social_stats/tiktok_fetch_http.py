"""
TikTok 轻量抓取：纯 HTTP，不启动 Playwright。
通过用户主页 HTML 中的 __UNIVERSAL_DATA_FOR_REHYDRATION__ 及可选 item_list API 取数据。
TikTok 常改版，可能失败；失败时由 Playwright 路径兜底。
"""

from __future__ import annotations

import json
import re
import time
from typing import Any

from .tiktok_fetch import _extract_tiktok_stats, sort_tiktok_videos_by_time, tiktok_published_iso

try:
    import httpx
except ModuleNotFoundError:  # pragma: no cover
    httpx = None  # type: ignore


def _ua() -> str:
    return (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    )


def _parse_universal_html(html: str) -> dict[str, Any] | None:
    """从用户页 HTML 中取出 __UNIVERSAL_DATA_FOR_REHYDRATION__ 的 JSON。"""
    # 优先整段匹配 script 标签内 JSON
    m = re.search(
        r'<script[^>]*\bid="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)</script>',
        html,
        re.I,
    )
    if not m:
        m = re.search(
            r'<script[^>]*\bid="SIGI_STATE"[^>]*>([\s\S]*?)</script>',
            html,
            re.I,
        )
    if not m:
        return None
    raw = (m.group(1) or "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def _numeric_user_id_from_ud(ud: dict[str, Any]) -> str | None:
    """用户数字 ID（部分场景 yt-dlp 需要 tiktokuser:ID）。"""
    if not isinstance(ud, dict):
        return None
    scope = ud.get("__DEFAULT_SCOPE__")
    if not isinstance(scope, dict):
        return None
    udetail = scope.get("webapp.user-detail")
    if not isinstance(udetail, dict):
        return None
    ui = udetail.get("userInfo")
    if not isinstance(ui, dict):
        return None
    u = ui.get("user")
    if not isinstance(u, dict):
        return None
    uid = u.get("id")
    if uid is None:
        return None
    s = str(uid).strip()
    return s or None


def _sec_uid_from_ud(ud: dict[str, Any]) -> str | None:
    if not isinstance(ud, dict):
        return None
    scope = ud.get("__DEFAULT_SCOPE__")
    if not isinstance(scope, dict):
        return None
    udetail = scope.get("webapp.user-detail")
    if not isinstance(udetail, dict):
        return None
    ui = udetail.get("userInfo")
    if isinstance(ui, dict):
        u = ui.get("user")
        if isinstance(u, dict) and u.get("secUid"):
            return str(u["secUid"])
    return None


def _item_list_from_ud(ud: dict[str, Any]) -> list[dict[str, Any]] | None:
    """从嵌套 JSON 里找出类似视频条目列表的结构。"""
    if not isinstance(ud, dict):
        return None
    scope = ud.get("__DEFAULT_SCOPE__")
    if isinstance(scope, dict):
        udetail = scope.get("webapp.user-detail")
        if isinstance(udetail, dict):
            for key in ("itemList", "items", "userPosts", "posts"):
                il = udetail.get(key)
                if isinstance(il, list) and il and isinstance(il[0], dict):
                    if "id" in il[0] or "author" in il[0]:
                        return il
    # 广度优先搜 itemList
    stack: list[Any] = [ud]
    seen = 0
    while stack and seen < 5000:
        cur = stack.pop()
        seen += 1
        if isinstance(cur, dict):
            for k, v in cur.items():
                if k == "itemList" and isinstance(v, list) and v:
                    if isinstance(v[0], dict) and ("id" in v[0] or "stats" in v[0] or "statsV2" in v[0]):
                        return v
                if isinstance(v, (dict, list)):
                    stack.append(v)
        elif isinstance(cur, list):
            for x in cur[:100]:
                if isinstance(x, (dict, list)):
                    stack.append(x)
    return None


def resolve_user_ids_for_ytdlp(
    username: str,
    ms_token: str | None,
) -> tuple[str | None, str | None]:
    """
    同步拉取用户主页，解析 secUid 与数字 user id，供 yt-dlp 使用 tiktokuser:... 重试。
    """
    if httpx is None:
        return None, None
    clean = username.lstrip("@").strip()
    headers = {
        "User-Agent": _ua(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
        "Referer": "https://www.tiktok.com/",
    }
    cookies: dict[str, str] = {}
    if ms_token:
        cookies["msToken"] = ms_token
    try:
        with httpx.Client(
            headers=headers,
            cookies=cookies,
            follow_redirects=True,
            timeout=httpx.Timeout(25.0, connect=15.0),
        ) as client:
            r = client.get(f"https://www.tiktok.com/@{clean}")
        if r.status_code != 200:
            return None, None
        ud = _parse_universal_html(r.text)
        if not ud:
            return None, None
        return _sec_uid_from_ud(ud), _numeric_user_id_from_ud(ud)
    except Exception:
        return None, None


async def _fetch_item_list(
    client: Any,
    sec_uid: str,
    count: int,
    *,
    cursor: str = "0",
) -> list[dict[str, Any]]:
    """调用网页端 item_list 接口补全视频（需有效 sec_uid）。"""
    params = {
        "WebIdLastTime": str(int(time.time())),
        "aid": "1988",
        "app_language": "zh-Hans",
        "app_name": "tiktok_web",
        "browser_language": "zh-CN",
        "browser_name": "Mozilla",
        "browser_online": "true",
        "browser_platform": "Win32",
        "channel": "tiktok_web",
        "cookie_enabled": "true",
        "count": str(max(1, min(count, 35))),
        "cursor": cursor,
        "device_platform": "webapp",
        "focus_state": "true",
        "is_fullscreen": "false",
        "is_page_visible": "true",
        "odinId": "0",
        "os": "windows",
        "priority_region": "",
        "referer": "",
        "region": "US",
        "screen_height": "1080",
        "screen_width": "1920",
        "secUid": sec_uid,
        "tz_name": "Asia/Shanghai",
        "post_item_list_request_type": "0",
    }
    url = "https://www.tiktok.com/api/post/item_list/"
    r = await client.get(url, params=params)
    if r.status_code != 200:
        return []
    try:
        data = r.json()
    except json.JSONDecodeError:
        return []
    il = data.get("itemList")
    if isinstance(il, list):
        return [x for x in il if isinstance(x, dict)]
    return []


async def fetch_one_user_http(
    username: str,
    max_videos: int,
    ms_token: str | None,
) -> dict[str, Any]:
    if httpx is None:
        return {
            "username": username,
            "error": "未安装 httpx，请 pip install httpx",
            "videos": [],
        }

    headers = {
        "User-Agent": _ua(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
        "Referer": "https://www.tiktok.com/",
    }
    cookies: dict[str, str] = {}
    if ms_token:
        cookies["msToken"] = ms_token

    profile_url = f"https://www.tiktok.com/@{username}"

    try:
        timeout = httpx.Timeout(25.0, connect=15.0)
        async with httpx.AsyncClient(
            headers=headers,
            cookies=cookies,
            follow_redirects=True,
            timeout=timeout,
        ) as client:
            resp = await client.get(profile_url)
            if resp.status_code != 200:
                return {
                    "username": username,
                    "error": f"HTTP {resp.status_code}",
                    "videos": [],
                }
            html = resp.text
            ud = _parse_universal_html(html)
            if not ud:
                return {
                    "username": username,
                    "error": "页面中未解析到数据（可能被风控或页面改版）",
                    "videos": [],
                }

            raw_items = _item_list_from_ud(ud) or []
            sec_uid = _sec_uid_from_ud(ud)

            if len(raw_items) < max_videos and sec_uid:
                api_items = await _fetch_item_list(
                    client, sec_uid, max_videos - len(raw_items)
                )
                seen = {str(x.get("id")) for x in raw_items if x.get("id")}
                for it in api_items:
                    iid = str(it.get("id", ""))
                    if iid and iid not in seen:
                        raw_items.append(it)
                        seen.add(iid)

            videos: list[dict[str, Any]] = []
            for it in raw_items[:max_videos]:
                st = _extract_tiktok_stats(it)
                videos.append(
                    {
                        "id": it.get("id"),
                        "desc": (it.get("desc") or "")[:120],
                        "published_at": tiktok_published_iso(it),
                        **st,
                    }
                )
            sort_tiktok_videos_by_time(videos)

            if not videos:
                return {
                    "username": username,
                    "error": "解析成功但未发现视频列表（接口或页面结构变动）",
                    "videos": [],
                }

            return {"username": username, "error": None, "videos": videos}

    except Exception as e:
        return {"username": username, "error": str(e), "videos": []}


async def fetch_tiktok_users_http(
    usernames: list[str],
    max_videos_per_user: int,
    ms_token: str | None,
) -> dict[str, Any]:
    """结构与 fetch_tiktok_users（Playwright）一致。"""
    users: list[dict[str, Any]] = []
    for name in usernames:
        u = await fetch_one_user_http(name, max_videos_per_user, ms_token)
        users.append(u)
    return {"users": users}
