import json
from pathlib import Path

import yaml

from system_cards.build import build_dataset, write_dataset
from system_cards.normalization import load_tier_table
from system_cards.schema import DomainOutcome

TABLE = load_tier_table(Path(__file__).resolve().parent.parent / "normalization" / "tiers.yaml")


def test_build_adds_normalized_tier_and_coverage(tmp_path):
    sources = tmp_path / "sources" / "lab"
    sources.mkdir(parents=True)
    card = {
        "id": "lab/model/2026-01",
        "models": [{"name": "M", "developer": "Lab"}],
        "document": {"kind": "system_card", "title": "T", "url": "https://example.org/t.pdf"},
        "framework": {
            "name": "rsp",
            "tier": {
                "status": "reported",
                "value": "ASL-3",
                "cite": {"page": 1, "quote": "deployed under ASL-3"},
            },
        },
        "evaluations": {
            "alignment": {
                "sabotage": {
                    "status": "withheld",
                    "cite": {"page": 2, "quote": "results not published"},
                },
                "sycophancy": {"status": "not_reported"},
            }
        },
        "provenance": {"extracted_by": "human", "extracted_on": "2026-10-25"},
    }
    (sources / "model.yaml").write_text(yaml.safe_dump(card))
    data = build_dataset(tmp_path / "sources", TABLE)
    assert data["normalization_version"] == TABLE.version
    assert "framework.tier" in data["fact_paths"]
    assert "not_assessed" not in data["domain_outcomes"]
    assert set(data["domain_outcomes"]) | {"not_assessed"} == {o.value for o in DomainOutcome}
    rec = data["cards"][0]
    assert rec["lab"] == "lab"
    assert rec["normalized_tier"] == "elevated"
    assert rec["withheld"] == ["evaluations.alignment.sabotage"]
    assert rec["not_reported"] == ["evaluations.alignment.sycophancy"]
    cov = rec["coverage"]
    assert cov["reported"] == 1 and cov["withheld"] == 1 and cov["not_reported"] == 1
    assert sum(cov.values()) == len(data["fact_paths"])
    out = tmp_path / "out" / "data.json"
    write_dataset(out, data)
    assert json.loads(out.read_text())["cards"][0]["id"] == "lab/model/2026-01"


def test_build_is_deterministic_and_handles_empty(tmp_path):
    (tmp_path / "sources").mkdir()
    a = build_dataset(tmp_path / "sources", TABLE)
    b = build_dataset(tmp_path / "sources", TABLE)
    assert a == b and a["cards"] == []
