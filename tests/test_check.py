from pathlib import Path

import yaml

from system_cards.check import check_sources, has_errors
from system_cards.fetch import sha256_of
from system_cards.normalization import load_tier_table

TABLE = load_tier_table(Path(__file__).resolve().parent.parent / "normalization" / "tiers.yaml")


def write_card(sources: Path, lab: str, slug: str, card: dict) -> Path:
    path = sources / lab / f"{slug}.yaml"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(card, sort_keys=False))
    return path


def card_for(pdf: Path) -> dict:
    return {
        "id": "lab/model/2026-01",
        "models": [{"name": "M", "developer": "Lab"}],
        "document": {
            "kind": "system_card",
            "title": "T",
            "url": "https://example.org/t.pdf",
            "pages": 2,
            "sha256": sha256_of(pdf.read_bytes()),
        },
        "framework": {
            "name": "fsf",
            "tier": {
                "status": "reported",
                "value": "CCL not reached",
                "cite": {"page": 1, "quote": "remains below the cyber CCL"},
            },
            "domains": {
                "cyber": {
                    "status": "reported",
                    "value": "below_threshold",
                    "cite": {"page": 1, "quote": "The model remains below the cyber CCL."},
                }
            },
        },
        "mitigations": {
            "deployment_safeguards": {
                "status": "reported",
                "value": "mentioned",
                "cite": {"page": 2, "quote": "about safeguards"},
            }
        },
        "provenance": {"extracted_by": "human", "extracted_on": "2026-10-25"},
    }


def cached(tmp_path: Path, pdf: Path) -> Path:
    cache = tmp_path / "cache"
    cache.mkdir()
    (cache / f"{sha256_of(pdf.read_bytes())}.pdf").write_bytes(pdf.read_bytes())
    return cache


def run(tmp_path, card, cache_dir=None, lab="lab", **kw):
    sources = tmp_path / "sources"
    write_card(sources, lab, "model", card)
    return check_sources(sources, table=TABLE, cache_dir=cache_dir or tmp_path / "nope", **kw)


def test_clean_card_passes(tmp_path, tiny_pdf):
    findings = run(tmp_path, card_for(tiny_pdf), cached(tmp_path, tiny_pdf))
    assert not has_errors(findings), [str(x) for x in findings]
    assert any("3 cites verified" in x.message for x in findings)


def test_quote_on_wrong_page_is_an_error_with_hint(tmp_path, tiny_pdf):
    card = card_for(tiny_pdf)
    card["mitigations"]["deployment_safeguards"]["cite"]["page"] = 1
    errs = [x for x in run(tmp_path, card, cached(tmp_path, tiny_pdf)) if x.level == "error"]
    assert len(errs) == 1
    assert errs[0].path == "mitigations.deployment_safeguards"
    assert "found on page(s) [2]" in errs[0].message


def test_fabricated_quote_is_an_error(tmp_path, tiny_pdf):
    card = card_for(tiny_pdf)
    card["framework"]["domains"]["cyber"]["cite"]["quote"] = "The model crossed every threshold."
    errs = [x for x in run(tmp_path, card, cached(tmp_path, tiny_pdf)) if x.level == "error"]
    assert [e.path for e in errs] == ["framework.domains.cyber"]
    assert "found nowhere" in errs[0].message


def test_missing_pdf_is_warning_unless_required(tmp_path, tiny_pdf):
    findings = run(tmp_path, card_for(tiny_pdf))
    assert not has_errors(findings)
    assert any("unverified" in x.message and x.level == "warning" for x in findings)
    assert has_errors(run(tmp_path, card_for(tiny_pdf), require_pdfs=True))


def test_page_count_mismatch_is_an_error(tmp_path, tiny_pdf):
    card = card_for(tiny_pdf)
    card["document"]["pages"] = 40
    findings = run(tmp_path, card, cached(tmp_path, tiny_pdf))
    assert any(x.path == "document.pages" and x.level == "error" for x in findings)


def test_unmapped_tier_is_an_error(tmp_path, tiny_pdf):
    card = card_for(tiny_pdf)
    card["framework"]["tier"]["value"] = "Tier Nine"
    findings = run(tmp_path, card, cached(tmp_path, tiny_pdf))
    assert any(x.path == "framework.tier" and "no mapping" in x.message for x in findings)


def test_not_reported_with_keyword_present_warns(tmp_path, tiny_pdf):
    card = card_for(tiny_pdf)
    card["mitigations"] = {"deployment_safeguards": {"status": "not_reported"}}
    findings = run(tmp_path, card, cached(tmp_path, tiny_pdf))
    hits = [x for x in findings if x.path == "mitigations.deployment_safeguards"]
    assert hits and hits[0].level == "warning" and "safeguard" in hits[0].message


def test_id_must_match_path(tmp_path, tiny_pdf):
    findings = run(tmp_path, card_for(tiny_pdf), cached(tmp_path, tiny_pdf), lab="otherlab")
    assert any(
        x.path == "id" and "must start with 'otherlab/model/'" in x.message for x in findings
    )


def test_full_verification_with_unknowns_is_an_error(tmp_path, tiny_pdf):
    card = card_for(tiny_pdf)
    card["provenance"] = {
        "extracted_by": "human",
        "extracted_on": "2026-10-25",
        "verified_by": "someone",
        "verification": "full",
    }
    findings = run(tmp_path, card, cached(tmp_path, tiny_pdf))
    assert any(x.path == "provenance.verification" and x.level == "error" for x in findings)
