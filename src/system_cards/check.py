"""Validate the sources: schema, ids, normalization coverage, quotes, gaps."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from pydantic import ValidationError

from system_cards.loader import expected_id_prefix, load_card, source_paths
from system_cards.normalization import TierTable
from system_cards.pdftext import full_text, page_texts, pages_containing, quote_on_page
from system_cards.schema import Card, Cite, Status, iter_facts, keyword_hits

Level = Literal["error", "warning", "info"]


@dataclass(frozen=True)
class Finding:
    level: Level
    card: str
    path: str
    message: str

    def __str__(self) -> str:
        where = f"{self.card}:{self.path}" if self.path else self.card
        return f"{self.level.upper():7} {where}: {self.message}"


def _cites(card: Card) -> list[tuple[str, Cite]]:
    out = [(path, fact.cite) for path, fact in iter_facts(card) if fact.cite is not None]
    out.extend(
        (f"third_party.assessments[{i}]", a.cite)
        for i, a in enumerate(card.third_party.assessments)
    )
    return out


def check_card(
    card: Card,
    *,
    table: TierTable,
    cache_dir: Path,
    require_pdfs: bool,
) -> list[Finding]:
    f: list[Finding] = []
    cid = card.id

    tier = card.framework.tier
    if (
        tier.status is Status.reported
        and tier.value is not None
        and table.rung_for(card.framework.name, tier.value) is None
    ):
        f.append(
            Finding(
                "error",
                cid,
                "framework.tier",
                f"raw tier {tier.value!r} has no mapping for {card.framework.name.value} "
                f"in the normalization table",
            )
        )

    if card.provenance.verification == "full":
        unknown = [p for p, fact in iter_facts(card) if fact.status is Status.unknown]
        if unknown:
            f.append(
                Finding(
                    "error",
                    cid,
                    "provenance.verification",
                    f"'full' but {len(unknown)} facts are still 'unknown' (first: {unknown[0]})",
                )
            )

    cites = _cites(card)
    sha = card.document.sha256
    pdf = cache_dir / f"{sha}.pdf" if sha else None
    if pdf is None or not pdf.exists():
        level: Level = "error" if require_pdfs else "warning"
        why = "document has no sha256" if sha is None else f"{pdf} not cached"
        f.append(Finding(level, cid, "document", f"{why}; {len(cites)} cites unverified"))
        return f

    pages = page_texts(pdf)
    if card.document.pages is not None and card.document.pages != len(pages):
        f.append(
            Finding(
                "error",
                cid,
                "document.pages",
                f"says {card.document.pages} but the cached PDF has {len(pages)}",
            )
        )
    for path, cite in cites:
        if cite.page > len(pages):
            f.append(Finding("error", cid, path, f"cites page {cite.page} of {len(pages)}"))
            continue
        if not quote_on_page(cite.quote, pages[cite.page - 1]):
            elsewhere = pages_containing(cite.quote, pages)
            hint = f"; found on page(s) {elsewhere}" if elsewhere else "; found nowhere"
            f.append(Finding("error", cid, path, f"quote not on page {cite.page}{hint}"))

    text = full_text(pages)
    for path, fact in iter_facts(card):
        if fact.status is not Status.not_reported:
            continue
        hits = keyword_hits(path, text)
        if hits:
            f.append(
                Finding(
                    "warning",
                    cid,
                    path,
                    f"marked not_reported but the document mentions {hits}",
                )
            )
    f.append(Finding("info", cid, "", f"{len(cites)} cites verified against {pdf.name}"))
    return f


def check_sources(
    sources_dir: Path,
    *,
    table: TierTable,
    cache_dir: Path,
    require_pdfs: bool = False,
) -> list[Finding]:
    findings: list[Finding] = []
    seen_ids: dict[str, Path] = {}
    paths = source_paths(sources_dir)
    if not paths:
        findings.append(Finding("warning", str(sources_dir), "", "no cards found"))
    for path in paths:
        try:
            card = load_card(path)
        except ValidationError as e:
            findings.append(Finding("error", str(path), "", f"schema: {e}"))
            continue
        except Exception as e:  # yaml errors come in many types
            findings.append(Finding("error", str(path), "", f"could not load: {e}"))
            continue
        prefix = expected_id_prefix(path, sources_dir)
        if not card.id.startswith(prefix):
            findings.append(
                Finding("error", card.id, "id", f"must start with {prefix!r} to match {path}")
            )
        if card.id in seen_ids:
            findings.append(Finding("error", card.id, "id", f"duplicate of {seen_ids[card.id]}"))
        seen_ids[card.id] = path
        findings.extend(
            check_card(card, table=table, cache_dir=cache_dir, require_pdfs=require_pdfs)
        )
    return findings


def has_errors(findings: list[Finding]) -> bool:
    return any(x.level == "error" for x in findings)
