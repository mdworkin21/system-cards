"""Compile sources into the one JSON file the site reads. Deterministic."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from system_cards import __version__
from system_cards.loader import load_card, source_paths
from system_cards.normalization import TierTable
from system_cards.schema import (
    DOMAIN_OUTCOME_LADDER,
    Card,
    DomainOutcome,
    Status,
    Strict,
    iter_facts,
)


class Coverage(Strict):
    """How many of a card's facts have each status."""

    reported: int
    withheld: int
    not_reported: int
    not_applicable: int
    unknown: int


class CardRecord(Card):
    """A card as the site sees it: the source record plus what the build derives."""

    normalized_tier: str | None
    withheld: list[str]
    not_reported: list[str]
    coverage: Coverage


class Dataset(Strict):
    """The whole of ``data.json``."""

    schema_version: str
    normalization_version: int
    rungs: dict[str, str]
    fact_paths: list[str]
    domain_outcomes: list[DomainOutcome]
    cards: list[CardRecord]


def card_record(card: Card, table: TierTable) -> CardRecord:
    tier = card.framework.tier
    normalized_tier = (
        table.rung_for(card.framework.name, tier.value)
        if tier.status is Status.reported and tier.value is not None
        else None
    )
    facts = iter_facts(card)
    counts = Counter(f.status.value for _, f in facts)
    return CardRecord(
        **card.model_dump(exclude={"lab"}),
        normalized_tier=normalized_tier,
        withheld=[p for p, f in facts if f.status is Status.withheld],
        not_reported=[p for p, f in facts if f.status is Status.not_reported],
        coverage=Coverage(**{s.value: counts.get(s.value, 0) for s in Status}),
    )


def build_dataset(sources_dir: Path, table: TierTable) -> dict[str, Any]:
    cards = [load_card(p) for p in source_paths(sources_dir)]
    cards.sort(key=lambda c: (c.lab, c.document.published or "", c.id))
    dataset = Dataset(
        schema_version=__version__,
        normalization_version=table.version,
        rungs=table.rungs,
        fact_paths=[p for p, _ in iter_facts(cards[0])] if cards else [],
        domain_outcomes=list(DOMAIN_OUTCOME_LADDER),
        cards=[card_record(c, table) for c in cards],
    )
    return dataset.model_dump(mode="json")


def dataset_schema() -> dict[str, Any]:
    """The JSON Schema of ``data.json``, exported for the site's generated types."""
    return Dataset.model_json_schema(mode="serialization")


def write_dataset(out: Path, data: dict[str, Any]) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2, sort_keys=False) + "\n", encoding="utf-8")
