"""The checked-in data must pass its own checks, offline, without cached PDFs."""

import json
from pathlib import Path

from system_cards.check import check_sources, has_errors
from system_cards.loader import load_card, source_paths
from system_cards.normalization import load_tier_table
from system_cards.schema import Card


def test_every_source_card_passes_check_without_pdfs(repo_root: Path, tmp_path: Path):
    table = load_tier_table(repo_root / "normalization" / "tiers.yaml")
    findings = check_sources(repo_root / "sources", table=table, cache_dir=tmp_path)
    assert not has_errors(findings), "\n".join(str(x) for x in findings if x.level == "error")


def test_at_least_one_card_exists(repo_root: Path):
    assert source_paths(repo_root / "sources"), "sources/ is empty"


def test_every_reported_tier_is_in_the_normalization_table(repo_root: Path):
    table = load_tier_table(repo_root / "normalization" / "tiers.yaml")
    for path in source_paths(repo_root / "sources"):
        card = load_card(path)
        tier = card.framework.tier
        if tier.status.value == "reported" and tier.value is not None:
            assert table.rung_for(card.framework.name, tier.value), f"{card.id}: {tier.value!r}"


def test_checked_in_json_schema_matches_models(repo_root: Path):
    path = repo_root / "schema" / "system-card.schema.json"
    assert path.exists(), "run `syscards schema`"
    assert json.loads(path.read_text()) == Card.model_json_schema(), "run `syscards schema`"
