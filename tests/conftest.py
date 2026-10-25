from pathlib import Path

import pymupdf
import pytest

REPO = Path(__file__).resolve().parent.parent


@pytest.fixture
def repo_root() -> Path:
    return REPO


@pytest.fixture
def tiny_pdf(tmp_path: Path) -> Path:
    """A two-page PDF with known text, including a curly quote and a line-end hyphen."""
    path = tmp_path / "tiny.pdf"
    doc = pymupdf.open()
    p1 = doc.new_page()
    p1.insert_text((72, 72), "The model remains below the cyber CCL.")
    p1.insert_text((72, 100), "We found the results consistent.")
    p2 = doc.new_page()
    p2.insert_text((72, 72), "Second page says something infor-")
    p2.insert_text((72, 90), "mation about safeguards.")
    doc.save(path)
    doc.close()
    return path
