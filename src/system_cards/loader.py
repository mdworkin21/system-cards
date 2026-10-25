"""Read cards from ``sources/<lab>/<slug>.yaml``."""

from __future__ import annotations

from pathlib import Path

import yaml

from system_cards.schema import Card

DEFAULT_SOURCES = Path("sources")


def load_card(path: Path) -> Card:
    with path.open(encoding="utf-8") as f:
        return Card.model_validate(yaml.safe_load(f))


def source_paths(sources_dir: Path = DEFAULT_SOURCES) -> list[Path]:
    return sorted(p for p in sources_dir.glob("*/*.yaml") if p.is_file())


def expected_id_prefix(path: Path, sources_dir: Path) -> str:
    rel = path.relative_to(sources_dir)
    return f"{rel.parent.as_posix()}/{rel.stem}/"
