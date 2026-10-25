"""The one place a cross-lab judgment lives: raw tier term -> shared rung."""

from __future__ import annotations

from pathlib import Path

import yaml
from pydantic import Field, model_validator

from system_cards.schema import FrameworkName, Strict

DEFAULT_TIER_TABLE = Path("normalization/tiers.yaml")


class TierMapping(Strict):
    framework: FrameworkName
    raw: str = Field(min_length=1)
    rung: str


class TierTable(Strict):
    version: int = Field(ge=1)
    rungs: dict[str, str]
    mappings: list[TierMapping]

    @model_validator(mode="after")
    def _consistent(self) -> TierTable:
        seen: set[tuple[FrameworkName, str]] = set()
        for m in self.mappings:
            if m.rung not in self.rungs:
                raise ValueError(
                    f"mapping {m.framework.value}/{m.raw!r} uses unknown rung {m.rung!r}"
                )
            key = (m.framework, m.raw)
            if key in seen:
                raise ValueError(f"duplicate mapping for {m.framework.value}/{m.raw!r}")
            seen.add(key)
        return self

    def rung_for(self, framework: FrameworkName, raw: str) -> str | None:
        for m in self.mappings:
            if m.framework is framework and m.raw == raw:
                return m.rung
        return None


def load_tier_table(path: Path = DEFAULT_TIER_TABLE) -> TierTable:
    with path.open(encoding="utf-8") as f:
        return TierTable.model_validate(yaml.safe_load(f))
