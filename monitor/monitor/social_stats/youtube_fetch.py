from __future__ import annotations

from datetime import datetime
from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def _sort_videos_newest_first(videos: list[dict[str, Any]]) -> None:
    """按 published_at 降序原地排序；无时间则保持顺序。"""

    def key(v: dict[str, Any]) -> float:
        s = v.get("published_at")
        if not s:
            return 0.0
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
        except (TypeError, ValueError, OSError):
            return 0.0

    videos.sort(key=key, reverse=True)


def _normalize_channel_arg(handle_or_id: str) -> tuple[str, str]:
    """
    Returns (mode, value) where mode is 'id' | 'handle'.
    """
    s = handle_or_id.strip()
    if s.startswith("UC") and len(s) == 24:
        return "id", s
    if s.startswith("@"):
        return "handle", s[1:]
    if s.startswith("http"):
        # minimal: last path segment @user or /channel/UC...
        raise ValueError(
            f"请使用 @handle 或 UC 频道 ID，暂不支持完整 URL: {handle_or_id!r}"
        )
    if len(s) == 24 and s.startswith("UC"):
        return "id", s
    # treat as handle without @
    return "handle", s


def _get_channel_id(youtube: Any, handle_or_id: str) -> str:
    mode, val = _normalize_channel_arg(handle_or_id)
    if mode == "id":
        return val
    req = youtube.channels().list(part="id", forHandle=val)
    try:
        res = req.execute()
    except HttpError as e:
        if getattr(e, "resp", None) and e.resp.status == 404:
            raise ValueError(f"未找到频道 handle: @{val}") from e
        raise
    items = res.get("items") or []
    if not items:
        raise ValueError(f"未找到频道: @{val}（请检查 handle 是否正确）")
    return items[0]["id"]


def fetch_youtube(
    api_key: str,
    channels: list[str],
    max_videos_per_channel: int,
) -> dict[str, Any]:
    """
    Returns structured stats for each channel + recent videos.
    """
    youtube = build("youtube", "v3", developerKey=api_key)
    out: dict[str, Any] = {"channels": []}

    for raw_ch in channels:
        ch_entry: dict[str, Any] = {"query": raw_ch, "error": None}
        try:
            cid = _get_channel_id(youtube, raw_ch)
            ch_res = (
                youtube.channels()
                .list(
                    part="snippet,statistics,contentDetails",
                    id=cid,
                )
                .execute()
            )
            items = ch_res.get("items") or []
            if not items:
                ch_entry["error"] = "频道无返回数据"
                out["channels"].append(ch_entry)
                continue
            item = items[0]
            sn = item.get("snippet") or {}
            st = item.get("statistics") or {}
            cd = item.get("contentDetails") or {}
            uploads = (cd.get("relatedPlaylists") or {}).get("uploads")

            ch_entry["channel_id"] = cid
            ch_entry["title"] = sn.get("title")
            ch_entry["custom_url"] = sn.get("customUrl")
            ch_entry["subscriber_count"] = int(st.get("subscriberCount", 0) or 0)
            ch_entry["channel_view_count"] = int(st.get("viewCount", 0) or 0)
            ch_entry["video_count"] = int(st.get("videoCount", 0) or 0)
            ch_entry["videos"] = []

            if not uploads:
                out["channels"].append(ch_entry)
                continue

            video_ids: list[str] = []
            page_token = None
            while len(video_ids) < max_videos_per_channel:
                to_fetch = min(50, max_videos_per_channel - len(video_ids))
                pl = (
                    youtube.playlistItems()
                    .list(
                        part="contentDetails",
                        playlistId=uploads,
                        maxResults=to_fetch,
                        pageToken=page_token,
                    )
                    .execute()
                )
                for pl_item in pl.get("items") or []:
                    vid = (pl_item.get("contentDetails") or {}).get("videoId")
                    if vid:
                        video_ids.append(vid)
                page_token = pl.get("nextPageToken")
                if not page_token or len(video_ids) >= max_videos_per_channel:
                    break

            # batch videos.list by 50
            for i in range(0, len(video_ids), 50):
                chunk = video_ids[i : i + 50]
                vr = (
                    youtube.videos()
                    .list(part="snippet,statistics", id=",".join(chunk))
                    .execute()
                )
                for v in vr.get("items") or []:
                    vid = v.get("id")
                    vs = (v.get("statistics") or {}) if v else {}
                    v_sn = (v.get("snippet") or {}) if v else {}
                    pub = v_sn.get("publishedAt")
                    ch_entry["videos"].append(
                        {
                            "video_id": vid,
                            "title": v_sn.get("title"),
                            "published_at": pub,
                            "view_count": int(vs.get("viewCount", 0) or 0),
                            "like_count": int(vs.get("likeCount", 0) or 0),
                            "comment_count": int(vs.get("commentCount", 0) or 0),
                            "favorite_count": int(vs.get("favoriteCount", 0) or 0),
                        }
                    )
            _sort_videos_newest_first(ch_entry["videos"])
        except Exception as e:
            ch_entry["error"] = str(e)
        out["channels"].append(ch_entry)

    return out
