"""``syscards``: check, build, schema, fetch, and two helpers for hand extraction."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import click

from system_cards.build import build_dataset, write_dataset
from system_cards.check import check_sources, has_errors
from system_cards.fetch import DEFAULT_CACHE, DocumentChanged, fetch
from system_cards.loader import DEFAULT_SOURCES, load_card, source_paths
from system_cards.normalization import DEFAULT_TIER_TABLE, load_tier_table
from system_cards.pdftext import page_texts, pages_containing
from system_cards.schema import Card

DEFAULT_SCHEMA = Path("schema/system-card.schema.json")
DEFAULT_OUT = Path("site/public/data.json")

_sources_opt = click.option(
    "--sources", type=click.Path(path_type=Path), default=DEFAULT_SOURCES, show_default=True
)
_cache_opt = click.option(
    "--cache", type=click.Path(path_type=Path), default=DEFAULT_CACHE, show_default=True
)
_table_opt = click.option(
    "--tiers", type=click.Path(path_type=Path), default=DEFAULT_TIER_TABLE, show_default=True
)


@click.group()
def main() -> None:
    """What frontier model system cards actually say, cited to the page."""


@main.command()
@_sources_opt
@_cache_opt
@_table_opt
@click.option("--require-pdfs", is_flag=True, help="Fail if any cited document is not cached.")
@click.option("--quiet", is_flag=True, help="Only print warnings and errors.")
def check(sources: Path, cache: Path, tiers: Path, require_pdfs: bool, quiet: bool) -> None:
    """Validate every card: schema, ids, tier mapping, quotes on their pages, gaps."""
    findings = check_sources(
        sources, table=load_tier_table(tiers), cache_dir=cache, require_pdfs=require_pdfs
    )
    for x in findings:
        if quiet and x.level == "info":
            continue
        print(x)
    errors = sum(x.level == "error" for x in findings)
    warnings = sum(x.level == "warning" for x in findings)
    print(f"{len(source_paths(sources))} cards, {errors} errors, {warnings} warnings")
    sys.exit(1 if has_errors(findings) else 0)


@main.command()
@_sources_opt
@_table_opt
@click.option("--out", type=click.Path(path_type=Path), default=DEFAULT_OUT, show_default=True)
def build(sources: Path, tiers: Path, out: Path) -> None:
    """Compile sources into the JSON the site reads."""
    data = build_dataset(sources, load_tier_table(tiers))
    write_dataset(out, data)
    print(f"wrote {out} ({len(data['cards'])} cards)")


@main.command()
@click.option("--out", type=click.Path(path_type=Path), default=DEFAULT_SCHEMA, show_default=True)
@click.option("--check", "check_only", is_flag=True, help="Fail if the file is out of date.")
def schema(out: Path, check_only: bool) -> None:
    """Export the JSON Schema the frontend generates its types from."""
    current = json.dumps(Card.model_json_schema(), indent=2) + "\n"
    if check_only:
        if not out.exists() or out.read_text(encoding="utf-8") != current:
            print(f"{out} is out of date; run `syscards schema`")
            sys.exit(1)
        print(f"{out} is current")
        return
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(current, encoding="utf-8")
    print(f"wrote {out}")


@main.command("fetch")
@click.argument("url")
@_cache_opt
@click.option("--expect-sha256", default=None)
def fetch_cmd(url: str, cache: Path, expect_sha256: str | None) -> None:
    """Download one document into the cache and print its sha256 and page count."""
    try:
        r = fetch(url, cache, expect_sha256=expect_sha256)
    except DocumentChanged as e:
        print(f"refusing: {e}. The URL serves a revised document; record it as a new one.")
        sys.exit(2)
    state = "already cached" if r.was_cached else "cached"
    print(f"{state}: {r.path}\nsha256: {r.sha256}\npages: {r.pages}")


@main.command("fetch-all")
@_sources_opt
@_cache_opt
def fetch_all(sources: Path, cache: Path) -> None:
    """Fetch every card's document that records a sha256 and is not cached yet."""
    failed = 0
    for path in source_paths(sources):
        card = load_card(path)
        sha = card.document.sha256
        if sha is None:
            print(f"skip {card.id}: no sha256 recorded")
            continue
        try:
            r = fetch(card.document.url, cache, expect_sha256=sha)
        except DocumentChanged as e:
            print(f"CHANGED {card.id}: {e}")
            failed += 1
            continue
        except Exception as e:  # report and keep going
            print(f"FAILED {card.id}: {e}")
            failed += 1
            continue
        print(f"{'cached' if r.was_cached else 'fetched'} {card.id}: {r.pages} pages")
    sys.exit(1 if failed else 0)


@main.command()
@click.argument("pdf", type=click.Path(path_type=Path, exists=True))
@click.option("--page", type=int, default=None, help="1-based page; omit for all.")
def text(pdf: Path, page: int | None) -> None:
    """Print page text, for hand extraction."""
    pages = page_texts(pdf)
    chosen = range(1, len(pages) + 1) if page is None else [page]
    for n in chosen:
        print(f"===== page {n} / {len(pages)} =====")
        print(pages[n - 1])


@main.command()
@click.argument("pdf", type=click.Path(path_type=Path, exists=True))
@click.argument("quote")
def find(pdf: Path, quote: str) -> None:
    """Print the pages on which a quote appears, as the quote check would see it."""
    hits = pages_containing(quote, page_texts(pdf))
    print(f"pages: {hits}" if hits else "not found on any page")
    sys.exit(0 if hits else 1)
