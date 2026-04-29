"""
读取 config.yaml，抓取 YouTube（官方 API）与 TikTok（TikTokApi）账号数据并打印汇总。

首次使用 TikTok 前请执行:  python -m playwright install chromium
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

# Windows 终端默认编码常为 GBK，尽量用 UTF-8 输出中文
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from social_stats.collect import fetch_all_stats
from social_stats.settings import load_settings


def _print_youtube(data: dict) -> None:
    print("\n=== YouTube（官方 Data API v3）===\n")
    for ch in data.get("channels") or []:
        q = ch.get("query")
        if ch.get("error"):
            print(f"- {q}: [错误] {ch['error']}")
            continue
        print(f"频道: {ch.get('title')} ({ch.get('channel_id')})")
        print(f"  订阅: {ch.get('subscriber_count'):,}  "
              f"频道总播放(估算累计): {ch.get('channel_view_count'):,}  "
              f"视频数: {ch.get('video_count'):,}")
        vids = ch.get("videos") or []
        print(f"  最近 {len(vids)} 条视频:")
        for v in vids[:5]:
            t = (v.get("title") or "")[:50]
            pub = v.get("published_at") or "—"
            print(
                f"    - {pub} | 播放 {v.get('view_count'):,} | "
                f"赞 {v.get('like_count'):,} | "
                f"评论 {v.get('comment_count'):,} | {t}"
            )
        if len(vids) > 5:
            print(f"    ... 共 {len(vids)} 条，略")
        print()


def _print_tiktok(data: dict) -> None:
    print("\n=== TikTok（HTTP / yt-dlp / Playwright 竞速）===\n")
    for u in data.get("users") or []:
        name = u.get("username")
        if u.get("error"):
            print(f"- @{name}: [错误] {u['error']}")
            print("  若频繁失败：配置 ms_token、更换网络，或安装浏览器内核 python -m playwright install chromium\n")
            continue
        vids = u.get("videos") or []
        print(f"@{name} — 最近 {len(vids)} 条视频:")
        total_play = sum(int(v.get("play_count") or 0) for v in vids)
        total_like = sum(int(v.get("digg_count") or 0) for v in vids)
        total_col = sum(int(v.get("collect_count") or 0) for v in vids)
        print(
            f"  本批合计(近似): 播放 {total_play:,} | 点赞 {total_like:,} | 收藏 {total_col:,}"
        )
        for v in vids[:5]:
            d = (v.get("desc") or "").replace("\n", " ")[:60]
            pub = v.get("published_at") or "—"
            print(
                f"    - {pub} | 播放 {v.get('play_count')} | "
                f"赞 {v.get('digg_count')} | "
                f"藏 {v.get('collect_count')} | {d}"
            )
        if len(vids) > 5:
            print(f"    ... 共 {len(vids)} 条")
        print()


def main() -> int:
    parser = argparse.ArgumentParser(description="YouTube + TikTok 账号数据统计")
    parser.add_argument(
        "--config",
        default="config.yaml",
        help="配置文件路径（默认当前目录 config.yaml）",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="同时输出完整 JSON 到标准输出末尾（便于管道处理）",
    )
    parser.add_argument(
        "--skip-tiktok",
        action="store_true",
        help="仅拉取 YouTube（跳过 TikTok，无需 Playwright）",
    )
    parser.add_argument(
        "--skip-youtube",
        action="store_true",
        help="仅拉取 TikTok",
    )
    args = parser.parse_args()

    cfg_path = Path(args.config)
    try:
        settings = load_settings(cfg_path)
    except Exception as e:
        print(e, file=sys.stderr)
        return 1

    if not args.skip_youtube:
        print("正在请求 YouTube API ...", flush=True)
    if not args.skip_tiktok and settings.tiktok_users:
        print("正在启动 TikTok 抓取（首次可能较慢）...", flush=True)

    payload = asyncio.run(
        fetch_all_stats(
            settings,
            skip_youtube=args.skip_youtube,
            skip_tiktok=args.skip_tiktok,
        )
    )

    if payload.get("tiktok_fetch_error"):
        print(f"TikTok 抓取失败: {payload['tiktok_fetch_error']}", file=sys.stderr)
        print(
            "确认已执行: pip install TikTokApi playwright && python -m playwright install chromium",
            file=sys.stderr,
        )
        return 1

    if not args.skip_youtube and payload.get("youtube"):
        _print_youtube(payload["youtube"])

    if not args.skip_tiktok:
        if not settings.tiktok_users:
            print("（config 中 tiktok.users 为空，跳过 TikTok）")
        elif payload.get("tiktok"):
            src = (payload.get("meta") or {}).get("tiktok_source")
            if src:
                print(f"TikTok 数据来源: {src}")
            _print_tiktok(payload["tiktok"])

    if args.json:
        print("\n--- JSON ---\n")
        print(json.dumps(payload, ensure_ascii=False, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
