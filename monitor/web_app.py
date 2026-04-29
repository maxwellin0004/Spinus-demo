"""
本地 Web 看板：浏览器打开 http://127.0.0.1:8765

启动:  python web_app.py
或:    uvicorn web_app:app --host 127.0.0.1 --port 8765

环境变量 MONITOR_CONFIG 可指定配置文件路径（默认与 main.py 相同：当前目录 config.yaml）。
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
WEB_DIR = ROOT / "web"
DEFAULT_CONFIG = ROOT / "config.yaml"

app = FastAPI(title="Social monitor dashboard", version="1.0")

if WEB_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=WEB_DIR), name="static")


def _config_path() -> Path:
    p = os.environ.get("MONITOR_CONFIG", "").strip()
    return Path(p) if p else DEFAULT_CONFIG


@app.get("/api/stats")
async def api_stats(
    skip_youtube: bool = Query(False),
    skip_tiktok: bool = Query(False),
):
    from social_stats.collect import fetch_all_stats
    from social_stats.settings import load_settings

    cfg = _config_path()
    try:
        settings = load_settings(cfg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return await fetch_all_stats(
        settings,
        skip_youtube=skip_youtube,
        skip_tiktok=skip_tiktok,
    )


@app.get("/")
async def index():
    index_path = WEB_DIR / "index.html"
    if not index_path.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"缺少前端文件: {index_path}",
        )
    return FileResponse(index_path)


def main() -> None:
    import uvicorn

    host = os.environ.get("MONITOR_HOST", "127.0.0.1")
    port = int(os.environ.get("MONITOR_PORT", "8765"))
    uvicorn.run(
        "web_app:app",
        host=host,
        port=port,
        reload=False,
    )


if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass
    print(f"配置: {_config_path()}", flush=True)
    main()
