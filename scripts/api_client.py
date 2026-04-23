from __future__ import annotations

import json
import mimetypes
import os
import uuid
import base64
from pathlib import Path
from typing import Any
from urllib import error, request


class ApiClientError(RuntimeError):
    pass


def image_file_to_data_url(file_path: Path) -> str:
    mime_type = mimetypes.guess_type(str(file_path))[0] or "image/jpeg"
    encoded = base64.b64encode(file_path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def _decode_response(response) -> dict[str, Any]:
    raw = response.read().decode("utf-8")
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ApiClientError(f"Invalid JSON response: {exc}") from exc


def post_json(url: str, api_key: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with request.urlopen(req, timeout=timeout) as response:
            return _decode_response(response)
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise ApiClientError(f"HTTP {exc.code} calling {url}: {details}") from exc
    except error.URLError as exc:
        raise ApiClientError(f"Network error calling {url}: {exc.reason}") from exc


def post_multipart(
    url: str,
    api_key: str,
    fields: dict[str, str],
    file_field: str,
    file_path: Path,
    timeout: int,
) -> dict[str, Any]:
    boundary = f"----CodexBoundary{uuid.uuid4().hex}"
    chunks: list[bytes] = []

    for key, value in fields.items():
        chunks.extend(
            [
                f"--{boundary}\r\n".encode("utf-8"),
                f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"),
                f"{value}\r\n".encode("utf-8"),
            ]
        )

    mime_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
    filename = os.path.basename(file_path)
    file_bytes = file_path.read_bytes()
    chunks.extend(
        [
            f"--{boundary}\r\n".encode("utf-8"),
            (
                f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'
                f"Content-Type: {mime_type}\r\n\r\n"
            ).encode("utf-8"),
            file_bytes,
            b"\r\n",
            f"--{boundary}--\r\n".encode("utf-8"),
        ]
    )

    body = b"".join(chunks)
    req = request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )

    try:
        with request.urlopen(req, timeout=timeout) as response:
            return _decode_response(response)
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise ApiClientError(f"HTTP {exc.code} calling {url}: {details}") from exc
    except error.URLError as exc:
        raise ApiClientError(f"Network error calling {url}: {exc.reason}") from exc
