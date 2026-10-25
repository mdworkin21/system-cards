import datetime as dt

import pytest
from pydantic import ValidationError

from system_cards.schema import (
    Card,
    Cite,
    DomainAssessment,
    DomainOutcome,
    Fact,
    Status,
    ThirdParty,
    ThirdPartyAssessment,
    ThirdPartyOrg,
    iter_facts,
)

CITE = Cite(page=3, quote="the model remains below the cyber CCL")


def minimal_card(**overrides):
    base = {
        "id": "lab/model/2026-01",
        "models": [{"name": "M", "developer": "Lab"}],
        "document": {"kind": "system_card", "title": "T", "url": "https://example.org/t.pdf"},
        "framework": {"name": "fsf"},
        "provenance": {"extracted_by": "human", "extracted_on": "2026-10-25"},
    }
    base.update(overrides)
    return Card.model_validate(base)


def test_reported_requires_cite():
    with pytest.raises(ValidationError, match="requires a cite"):
        Fact(status=Status.reported, value="x")


def test_withheld_requires_cite_and_no_value():
    Fact(status=Status.withheld, cite=CITE)
    with pytest.raises(ValidationError, match="only allowed when status is 'reported'"):
        Fact(status=Status.withheld, value="x", cite=CITE)


def test_not_reported_cannot_carry_value():
    with pytest.raises(ValidationError):
        Fact(status=Status.not_reported, value="x")


def test_unknown_is_the_default():
    assert Fact().status is Status.unknown


def test_domain_assessment_value_is_enum():
    d = DomainAssessment(status=Status.reported, value="below_threshold", cite=CITE)
    assert d.value is DomainOutcome.below_threshold
    with pytest.raises(ValidationError):
        DomainAssessment(status=Status.reported, value="fine", cite=CITE)


def test_cite_page_and_quote_constraints():
    with pytest.raises(ValidationError):
        Cite(page=0, quote="long enough quote")
    with pytest.raises(ValidationError):
        Cite(page=1, quote="short")


def test_card_id_pattern():
    minimal_card(id="google-deepmind/gemini-3.1-pro/2026-02")
    with pytest.raises(ValidationError):
        minimal_card(id="Gemini 3.1 Pro")
    with pytest.raises(ValidationError):
        minimal_card(id="lab/model")


def test_partial_dates_accept_month_precision():
    doc = {"kind": "model_card", "title": "T", "url": "https://example.org/t.pdf"}
    c = minimal_card(document={**doc, "published": "2026-02"})
    assert c.document.published == "2026-02"
    with pytest.raises(ValidationError):
        minimal_card(document={**doc, "published": "Feb 2026"})


def test_extra_fields_are_rejected():
    with pytest.raises(ValidationError):
        minimal_card(bonus="no")


def test_verification_requires_verifier():
    with pytest.raises(ValidationError, match="verified_by"):
        minimal_card(
            provenance={
                "extracted_by": "human",
                "extracted_on": "2026-10-25",
                "verification": "full",
            }
        )


def test_third_party_other_needs_name_and_summary_consistency():
    with pytest.raises(ValidationError, match="org_name"):
        ThirdPartyAssessment(org=ThirdPartyOrg.other, cite=CITE)
    with pytest.raises(ValidationError, match=r"summary\.status"):
        ThirdParty(assessments=[ThirdPartyAssessment(org=ThirdPartyOrg.metr, cite=CITE)])


def test_iter_facts_covers_every_fact_field_once():
    card = minimal_card()
    paths = [p for p, _ in iter_facts(card)]
    assert len(paths) == len(set(paths))
    for expected in (
        "framework.tier",
        "framework.domains.cyber",
        "evaluations.alignment.sabotage",
        "third_party.summary",
        "training_disclosure.data_cutoff",
    ):
        assert expected in paths
    assert all(isinstance(f, Fact | DomainAssessment) for _, f in iter_facts(card))


def test_provenance_date_is_a_real_date():
    assert minimal_card().provenance.extracted_on == dt.date(2026, 10, 25)


def test_keyword_matching_is_word_based():
    from system_cards.schema import keyword_hits

    assert keyword_hits("third_party.summary", "belief change metrics") == []
    assert keyword_hits("third_party.summary", "tested by METR before launch") == ["METR"]
    assert keyword_hits("training_disclosure.compute", "a 64K token output") == []
    assert keyword_hits("training_disclosure.compute", "trained on TPU v6") == ["TPU"]
    assert keyword_hits("framework.tier", "deployed under ASL-3 protections") == ["ASL-"]
    assert keyword_hits("evaluations.alignment.sycophancy", "Sycophantic behaviour") == ["sycophan"]
