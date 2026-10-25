"""The record schema: one Card per system-card document.

Every field that records something the card says is a ``Fact``. A Fact has a
status, and when the status is ``reported`` or ``withheld`` it must carry a
``Cite`` naming the page and quoting the document verbatim. ``check`` later
verifies that the quote really is on that page.
"""

from __future__ import annotations

import datetime as dt
import re
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

PartialDate = Annotated[
    str,
    Field(
        pattern=r"^\d{4}-\d{2}(-\d{2})?$",
        description="YYYY-MM or YYYY-MM-DD. Use the precision the source gives.",
    ),
]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Status(StrEnum):
    """What the card does about a question.

    ``reported``        the card answers it; ``value`` and ``cite`` say how.
    ``withheld``        the card says it looked but does not publish the result.
    ``not_reported``    the card is silent.
    ``not_applicable``  the question does not apply (say why in ``note``).
    ``unknown``         nobody has checked yet. A gap in our work, not the card's.
    """

    reported = "reported"
    withheld = "withheld"
    not_reported = "not_reported"
    not_applicable = "not_applicable"
    unknown = "unknown"


CITED_STATUSES = frozenset({Status.reported, Status.withheld})


class Cite(Strict):
    """Where in the document a fact comes from. ``quote`` is verbatim."""

    page: int = Field(ge=1, description="1-based page number in the cached PDF.")
    quote: str = Field(min_length=8, description="Verbatim text from that page.")
    note: str | None = Field(default=None, description="Context the quote needs.")


def _check_cite_rules(status: Status, value: object, cite: Cite | None) -> None:
    if status in CITED_STATUSES and cite is None:
        raise ValueError(f"status {status.value!r} requires a cite")
    if status is not Status.reported and value is not None:
        raise ValueError(f"value is only allowed when status is 'reported', not {status.value!r}")


class Fact(Strict):
    status: Status = Status.unknown
    value: str | None = Field(default=None, description="Short answer, only when reported.")
    cite: Cite | None = None
    note: str | None = None

    @model_validator(mode="after")
    def _rules(self) -> Fact:
        _check_cite_rules(self.status, self.value, self.cite)
        return self


class DomainOutcome(StrEnum):
    """Coarse outcome of a dangerous-capability assessment in one risk domain."""

    below_threshold = "below_threshold"
    alert_threshold_reached = "alert_threshold_reached"
    threshold_not_ruled_out = "threshold_not_ruled_out"
    threshold_reached = "threshold_reached"
    critical_reached = "critical_reached"
    not_assessed = "not_assessed"


class DomainAssessment(Strict):
    """Like a Fact, but ``value`` is a DomainOutcome and the lab's own term is kept."""

    status: Status = Status.unknown
    value: DomainOutcome | None = None
    raw_threshold: str | None = Field(
        default=None,
        description="The lab's own name for the threshold, e.g. 'Cyber Uplift Level 1'.",
    )
    cite: Cite | None = None
    note: str | None = None

    @model_validator(mode="after")
    def _rules(self) -> DomainAssessment:
        _check_cite_rules(self.status, self.value, self.cite)
        return self


class FrameworkName(StrEnum):
    rsp = "rsp"
    preparedness_framework = "preparedness_framework"
    fsf = "fsf"
    xai_rmf = "xai_rmf"
    meta_frontier_ai_framework = "meta_frontier_ai_framework"
    none = "none"
    other = "other"


class Domains(Strict):
    cbrn: DomainAssessment = Field(default_factory=DomainAssessment)
    cyber: DomainAssessment = Field(default_factory=DomainAssessment)
    ai_rnd: DomainAssessment = Field(
        default_factory=DomainAssessment,
        description="AI R&D, ML R&D, self-improvement, autonomy: the labs' names differ.",
    )
    manipulation: DomainAssessment = Field(default_factory=DomainAssessment)
    misalignment: DomainAssessment = Field(default_factory=DomainAssessment)


class Framework(Strict):
    name: FrameworkName
    version: str | None = None
    tier: Fact = Field(
        default_factory=Fact,
        description="Model-level tier in the lab's own words, e.g. 'ASL-3'. Normalized at build.",
    )
    domains: Domains = Field(default_factory=Domains)


class AlignmentEvals(Strict):
    sabotage: Fact = Field(default_factory=Fact)
    scheming_or_deception: Fact = Field(default_factory=Fact)
    eval_awareness: Fact = Field(default_factory=Fact)
    sycophancy: Fact = Field(default_factory=Fact)
    reward_hacking: Fact = Field(default_factory=Fact)
    self_preservation: Fact = Field(default_factory=Fact)


class AgenticSafetyEvals(Strict):
    prompt_injection: Fact = Field(default_factory=Fact)
    computer_use_safety: Fact = Field(default_factory=Fact)
    tool_misuse: Fact = Field(default_factory=Fact)


class HarmAndHonestyEvals(Strict):
    harmful_content_refusals: Fact = Field(default_factory=Fact)
    jailbreak_robustness: Fact = Field(default_factory=Fact)
    honesty_or_hallucination: Fact = Field(default_factory=Fact)
    bias: Fact = Field(default_factory=Fact)
    child_safety: Fact = Field(default_factory=Fact)


class Evaluations(Strict):
    alignment: AlignmentEvals = Field(default_factory=AlignmentEvals)
    agentic_safety: AgenticSafetyEvals = Field(default_factory=AgenticSafetyEvals)
    harm_and_honesty: HarmAndHonestyEvals = Field(default_factory=HarmAndHonestyEvals)
    welfare: Fact = Field(default_factory=Fact)


class ThirdPartyOrg(StrEnum):
    uk_aisi = "uk_aisi"
    us_caisi = "us_caisi"
    metr = "metr"
    apollo = "apollo"
    gray_swan = "gray_swan"
    securebio = "securebio"
    other = "other"


class ThirdPartyAssessment(Strict):
    org: ThirdPartyOrg
    org_name: str | None = Field(default=None, description="Required when org is 'other'.")
    pre_deployment: bool | None = None
    scope: str | None = None
    report_url: str | None = None
    cite: Cite

    @model_validator(mode="after")
    def _named(self) -> ThirdPartyAssessment:
        if self.org is ThirdPartyOrg.other and not self.org_name:
            raise ValueError("org 'other' requires org_name")
        return self


class ThirdParty(Strict):
    summary: Fact = Field(default_factory=Fact)
    assessments: list[ThirdPartyAssessment] = Field(default_factory=list)

    @model_validator(mode="after")
    def _consistent(self) -> ThirdParty:
        if self.assessments and self.summary.status is not Status.reported:
            raise ValueError("assessments listed but summary.status is not 'reported'")
        return self


class Mitigations(Strict):
    deployment_safeguards: Fact = Field(default_factory=Fact)
    weight_security: Fact = Field(default_factory=Fact)
    monitoring_and_response: Fact = Field(default_factory=Fact)


class TrainingDisclosure(Strict):
    data_cutoff: Fact = Field(default_factory=Fact)
    compute: Fact = Field(default_factory=Fact)
    method_notes: Fact = Field(default_factory=Fact)


class DisclosureMeta(Strict):
    section_titles: list[str] = Field(
        default_factory=list, description="The card's own top-level headings, verbatim."
    )


class Provenance(Strict):
    extracted_by: Literal["human", "llm_assisted"]
    extracted_on: dt.date
    verified_by: str | None = None
    verification: Literal["full", "partial", "none"] = "none"

    @model_validator(mode="after")
    def _verified_has_verifier(self) -> Provenance:
        if self.verification != "none" and not self.verified_by:
            raise ValueError("verification other than 'none' requires verified_by")
        return self


class ModelInfo(Strict):
    name: str
    developer: str
    family: str | None = None
    release_date: PartialDate | None = None
    open_weights: bool | None = None
    modalities: list[str] = Field(default_factory=list)
    epoch_id: str | None = Field(default=None, description="Join key into Epoch AI's models CSV.")


class DocumentKind(StrEnum):
    system_card = "system_card"
    model_card = "model_card"
    addendum = "addendum"
    risk_report = "risk_report"
    third_party_report = "third_party_report"
    other = "other"


class Document(Strict):
    kind: DocumentKind
    title: str
    url: str = Field(description="The document itself, usually a PDF, at the lab's own host.")
    landing_url: str | None = Field(
        default=None, description="The lab's page that links the document, if different."
    )
    published: PartialDate | None = None
    revised: PartialDate | None = None
    pages: int | None = Field(default=None, ge=1)
    sha256: str | None = Field(default=None, pattern=r"^[0-9a-f]{64}$")
    fetched: dt.date | None = None
    fetched_from: str | None = Field(
        default=None, description="Set only if the bytes came from a mirror rather than url."
    )


ID_PATTERN = r"^[a-z0-9-]+/[a-z0-9.-]+/\d{4}-\d{2}$"


class Card(Strict):
    """One system-card document and everything we recorded about it."""

    id: str = Field(pattern=ID_PATTERN, description="<lab>/<model-slug>/<yyyy-mm of the document>")
    models: list[ModelInfo] = Field(min_length=1)
    document: Document
    framework: Framework
    evaluations: Evaluations = Field(default_factory=Evaluations)
    third_party: ThirdParty = Field(default_factory=ThirdParty)
    mitigations: Mitigations = Field(default_factory=Mitigations)
    training_disclosure: TrainingDisclosure = Field(default_factory=TrainingDisclosure)
    disclosure_meta: DisclosureMeta = Field(default_factory=DisclosureMeta)
    provenance: Provenance
    notes: str | None = None

    @property
    def lab(self) -> str:
        return self.id.split("/", 1)[0]


# Keywords whose presence in the document text makes a ``not_reported`` status
# suspicious. Keyed by the dotted path of the Fact or DomainAssessment. Matching
# is word-based: an all-caps keyword matches as a whole word, case-sensitively
# (so "METR" does not match "metrics"); anything else matches the start of a
# word, case-insensitively (so "sycophan" matches "sycophantic").
KEYWORDS: dict[str, tuple[str, ...]] = {
    "framework.tier": ("ASL-", "high capability", "critical capability", "CCL"),
    "framework.domains.cbrn": ("CBRN", "biological", "chemical", "bioweapon"),
    "framework.domains.cyber": ("cyber",),
    "framework.domains.ai_rnd": ("AI R&D", "ML R&D", "self-improvement", "autonomy", "RE-Bench"),
    "framework.domains.manipulation": ("manipulation", "persuasion"),
    "framework.domains.misalignment": ("misalignment", "stealth", "situational awareness"),
    "evaluations.alignment.sabotage": ("sabotage", "SHADE"),
    "evaluations.alignment.scheming_or_deception": ("scheming", "deception", "deceptive"),
    "evaluations.alignment.eval_awareness": (
        "evaluation awareness",
        "being evaluated",
        "being tested",
    ),
    "evaluations.alignment.sycophancy": ("sycophan",),
    "evaluations.alignment.reward_hacking": ("reward hack",),
    "evaluations.alignment.self_preservation": ("self-preservation", "shutdown", "self-exfiltrat"),
    "evaluations.agentic_safety.prompt_injection": ("prompt injection",),
    "evaluations.agentic_safety.computer_use_safety": ("computer use", "computer-use"),
    "evaluations.agentic_safety.tool_misuse": ("tool misuse", "agentic misuse"),
    "evaluations.harm_and_honesty.harmful_content_refusals": ("refusal", "content safety"),
    "evaluations.harm_and_honesty.jailbreak_robustness": ("jailbreak",),
    "evaluations.harm_and_honesty.honesty_or_hallucination": (
        "hallucinat",
        "honesty",
        "factuality",
    ),
    "evaluations.harm_and_honesty.bias": ("fairness", "bias"),
    "evaluations.harm_and_honesty.child_safety": ("child safety", "CSAM"),
    "evaluations.welfare": ("welfare",),
    "third_party.summary": (
        "METR",
        "AI Security Institute",
        "AISI",
        "CAISI",
        "Apollo",
        "Gray Swan",
        "SecureBio",
        "external red team",
        "third-party",
        "third party",
    ),
    "mitigations.deployment_safeguards": ("safeguard", "classifier", "mitigation"),
    "mitigations.weight_security": ("model weights", "weight security"),
    "mitigations.monitoring_and_response": ("monitoring",),
    "training_disclosure.data_cutoff": ("cutoff", "cut-off"),
    "training_disclosure.compute": ("FLOP", "TPU", "GPU", "training compute"),
    "training_disclosure.method_notes": ("reinforcement learning", "RLHF", "pretrain", "pre-train"),
}


def keyword_pattern(keyword: str) -> re.Pattern[str]:
    """See the comment on KEYWORDS."""
    escaped = re.escape(keyword)
    if keyword.isupper() or keyword.rstrip("-").isupper():
        tail = r"\w*" if keyword.endswith("-") else r"\b"
        return re.compile(rf"\b{escaped}{tail}")
    return re.compile(rf"\b{escaped}\w*", re.IGNORECASE)


def keyword_hits(path: str, text: str) -> list[str]:
    return [k for k in KEYWORDS.get(path, ()) if keyword_pattern(k).search(text)]


def iter_facts(card: Card) -> list[tuple[str, Fact | DomainAssessment]]:
    """Every Fact-like field on a card with its dotted path, in schema order."""
    out: list[tuple[str, Fact | DomainAssessment]] = []

    def walk(obj: BaseModel, prefix: str) -> None:
        for name in type(obj).model_fields:
            child = getattr(obj, name)
            path = f"{prefix}.{name}" if prefix else name
            if isinstance(child, Fact | DomainAssessment):
                out.append((path, child))
            elif isinstance(child, BaseModel):
                walk(child, path)

    walk(card, "")
    return out
