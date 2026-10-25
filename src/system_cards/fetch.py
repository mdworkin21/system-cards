"""Download a document into the content-addressed cache. Never overwrites."""

from __future__ import annotations

import hashlib
import ssl
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import pymupdf

DEFAULT_CACHE = Path("cache/pdfs")


class DocumentChanged(RuntimeError):
    """The URL now serves different bytes than the card records."""


@dataclass(frozen=True)
class Fetched:
    path: Path
    sha256: str
    pages: int
    was_cached: bool


def sha256_of(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def download(url: str, *, timeout: float = 120.0) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "system-cards/0.1 (+github)"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return bytes(resp.read())


def store(data: bytes, cache_dir: Path, *, expect_sha256: str | None = None) -> Fetched:
    sha = sha256_of(data)
    if expect_sha256 is not None and sha != expect_sha256:
        raise DocumentChanged(f"expected sha256 {expect_sha256} but got {sha}")
    cache_dir.mkdir(parents=True, exist_ok=True)
    target = cache_dir / f"{sha}.pdf"
    was_cached = target.exists()
    if not was_cached:
        target.write_bytes(data)
    with pymupdf.open(target) as doc:
        pages = doc.page_count
    return Fetched(path=target, sha256=sha, pages=pages, was_cached=was_cached)


def fetch(
    url: str, cache_dir: Path = DEFAULT_CACHE, *, expect_sha256: str | None = None
) -> Fetched:
    if expect_sha256 is not None and (cache_dir / f"{expect_sha256}.pdf").exists():
        return store((cache_dir / f"{expect_sha256}.pdf").read_bytes(), cache_dir)
    return store(download(url), cache_dir, expect_sha256=expect_sha256)
