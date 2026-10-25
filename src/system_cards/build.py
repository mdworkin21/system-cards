"""Compile sources into the one JSON file the site reads. Deterministic."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from system_cards import __version__
from system_cards.loader import load_card, source_paths
from system_cards.normalization import TierTable
from system_cards.schema import Card, Status, iter_facts


def card_record(card: Card, table: TierTable) -> dict[str, Any]:
    record = card.model_dump(mode="json")
    tier = card.framework.tier
    record["lab"] = card.lab
    record["normalized_tier"] = (
        table.rung_for(card.framework.name, tier.value)
        if tier.status is Status.reported and tier.value is not None
        else None
    )
    facts = iter_facts(card)
    record["withheld"] = [p for p, f in facts if f.status is Status.withheld]
    record["not_reported"] = [p for p, f in facts if f.status is Status.not_reported]
    counts = Counter(f.status.value for _, f in facts)
    record["coverage"] = {s.value: counts.get(s.value, 0) for s in Status}
    return record


def build_dataset(sources_dir: Path, table: TierTable) -> dict[str, Any]:
    cards = [load_card(p) for p in source_paths(sources_dir)]
    cards.sort(key=lambda c: (c.lab, c.document.published or "", c.id))
    return {
        "schema_version": __version__,
        "normalization_version": table.version,
        "rungs": table.rungs,
        "fact_paths": [p for p, _ in iter_facts(cards[0])] if cards else [],
        "cards": [card_record(c, table) for c in cards],
    }


def write_dataset(out: Path, data: dict[str, Any]) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2, sort_keys=False) + "\n", encoding="utf-8")
