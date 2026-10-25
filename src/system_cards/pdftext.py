"""Page text from cached PDFs, and the quote check.

Quotes are compared after a conservative normalization applied to both sides:
Unicode NFKC (which also expands ligatures), curly quotes and dashes to ASCII,
soft hyphens removed, whitespace collapsed. Words hyphenated across a line
break are tried both joined and kept, because the PDF does not say which.
"""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path

import pymupdf

_WS = re.compile(r"\s+")
_REPLACE = {
    chr(0x2018): "'",  # left single quotation mark
    chr(0x2019): "'",  # right single quotation mark
    chr(0x201A): "'",  # single low-9 quotation mark
    chr(0x201C): '"',  # left double quotation mark
    chr(0x201D): '"',  # right double quotation mark
    chr(0x201E): '"',  # double low-9 quotation mark
    chr(0x2013): "-",  # en dash
    chr(0x2014): "-",  # em dash
    chr(0x2212): "-",  # minus sign
    chr(0x00A0): " ",  # no-break space
    chr(0x00AD): "",  # soft hyphen
    chr(0x200B): "",  # zero-width space
}


def _base_normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    for a, b in _REPLACE.items():
        text = text.replace(a, b)
    return text


def normalize(text: str) -> str:
    """Normalize a quote (or page) for comparison. Idempotent."""
    return _WS.sub(" ", _base_normalize(text)).strip()


def page_variants(page_text: str) -> tuple[str, str]:
    """The page text with line-end hyphens joined, and with them kept."""
    base = _base_normalize(page_text)
    joined = re.sub(r"-\s*\n\s*", "", base)
    kept = re.sub(r"-\s*\n\s*", "-", base)
    return _WS.sub(" ", joined).strip(), _WS.sub(" ", kept).strip()


def page_texts(pdf: Path) -> list[str]:
    """Raw text of every page, in order. Index 0 is page 1."""
    with pymupdf.open(pdf) as doc:
        return [page.get_text() for page in doc]


def quote_on_page(quote: str, page_text: str) -> bool:
    q = normalize(quote)
    if not q:
        return False
    return any(q in variant for variant in page_variants(page_text))


def pages_containing(quote: str, pages: list[str]) -> list[int]:
    """1-based page numbers whose text contains the quote."""
    return [i + 1 for i, text in enumerate(pages) if quote_on_page(quote, text)]


def full_text(pages: list[str]) -> str:
    """The whole document, normalized, for the keyword net."""
    return normalize(" ".join(pages))
