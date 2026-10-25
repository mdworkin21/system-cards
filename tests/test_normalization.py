import pytest
from pydantic import ValidationError

from system_cards.normalization import TierTable, load_tier_table
from system_cards.schema import FrameworkName


def test_checked_in_table_loads(repo_root):
    table = load_tier_table(repo_root / "normalization" / "tiers.yaml")
    assert table.version >= 1
    assert table.rung_for(FrameworkName.rsp, "ASL-3") == "elevated"
    assert table.rung_for(FrameworkName.fsf, "CCL not reached") == "baseline"
    assert table.rung_for(FrameworkName.fsf, "made up") is None


def test_unknown_rung_rejected():
    with pytest.raises(ValidationError, match="unknown rung"):
        TierTable.model_validate(
            {
                "version": 1,
                "rungs": {"a": "x"},
                "mappings": [{"framework": "rsp", "raw": "ASL-3", "rung": "b"}],
            }
        )


def test_duplicate_mapping_rejected():
    with pytest.raises(ValidationError, match="duplicate"):
        TierTable.model_validate(
            {
                "version": 1,
                "rungs": {"a": "x"},
                "mappings": [
                    {"framework": "rsp", "raw": "ASL-3", "rung": "a"},
                    {"framework": "rsp", "raw": "ASL-3", "rung": "a"},
                ],
            }
        )
