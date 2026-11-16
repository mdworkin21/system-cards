# The record schema

One YAML file per system-card document under `sources/<lab>/<slug>.yaml`.
The pydantic models in `src/system_cards/schema.py` are the definition;
`schema/system-card.schema.json` is exported from them (`syscards schema`)
and checked in so the frontend can generate types from it. CI fails if
the export drifts.

The export's root is `Dataset`, the shape of `data.json`
(`src/system_cards/build.py:dataset_schema`); `Card` is under `$defs`.
`data.json` carries `schema_version`, `normalization_version`, `rungs`,
`fact_paths`, `domain_outcomes` (the outcome ladder, `DomainOutcome` in
enum order without `not_assessed`) and `cards`; each card is a
`CardRecord`: the source record plus `lab`, `normalized_tier`, `withheld`,
`not_reported` and `coverage`. Fields the build always writes are
required in the export.

## Facts

Almost every field that records something the card says is a **Fact**:

```yaml
status: reported            # reported | withheld | not_reported | not_applicable | unknown
value: "ASL-3"              # short answer; only allowed when status is reported
cite:                       # required when status is reported or withheld
  page: 12                  # 1-based physical page of the cached PDF
  quote: "..."              # verbatim; check verifies it is on that page
  note: "..."               # optional context the quote needs
note: "..."                 # optional, any status
```

The five statuses mean different things and the difference is the point:

| status | meaning | shows in the matrix as |
| --- | --- | --- |
| `reported` | the card answers the question | the value, with the quote on hover |
| `withheld` | the card says it looked but does not publish the result | a visible "withheld" cell |
| `not_reported` | the card is silent | a visible gap in the card |
| `not_applicable` | the question cannot apply (say why in `note`) | greyed out |
| `unknown` | nobody has checked yet | a gap in *our* work |

`unknown` is the default for every Fact, so a partially extracted card is
valid. It is never a statement about the card.

**Risk-domain assessments** (`framework.domains.*`) are Facts whose `value`
is one of a small enum, with the lab's own threshold name kept beside it:

```yaml
cyber:
  status: reported
  value: alert_threshold_reached   # below_threshold | alert_threshold_reached |
                                   # threshold_not_ruled_out | threshold_reached |
                                   # critical_reached | not_assessed
  raw_threshold: "Cyber Uplift Level 1"
  cite: {page: 8, quote: "..."}
```

The rule for picking `value` is: record the lab's **designation**, not your
reading of their evidence. If a lab says it is "conservatively treating"
the model as past a threshold, that is `threshold_reached`, and the
hedging goes in `note`. `threshold_not_ruled_out` is for a lab that
explicitly declines to conclude either way.

## The rest of a card

- `id`: `<lab>/<model-slug>/<yyyy-mm>`; must match the file path.
- `models`: one or more. A document can cover several models.
- `document`: kind, title, `url` (the file itself at the lab's host),
  optional `landing_url`, dates, page count, `sha256` of the bytes,
  `fetched`, and `fetched_from` when the bytes came from a mirror.
- `framework`: name, version, `tier` (a Fact whose value is the lab's own
  model-level term; the shared rung is computed at build time, see
  [normalization.md](normalization.md)), `domains`.
- `evaluations`, `third_party`, `mitigations`, `training_disclosure`:
  groups of Facts. `third_party.assessments` lists named external
  evaluators, each with its own cite.
- `disclosure_meta.section_titles`: the card's own top-level headings.
- `provenance`: who extracted, when, who verified, and how fully.
  `verification: full` is rejected while any Fact is still `unknown`.
- `notes`: anything the record needs to say about itself.

Dates are strings at the precision the source gives: `2026-02` or
`2026-02-11`. Labs often publish "February 2026" and nothing finer.

## Glossary

### Our fields

What each Fact asks. When a finding fits two fields, the distinction in
this table decides. An evaluation's `value` states the result
([adding-a-card.md](adding-a-card.md), step 3).

| Field | Asks |
|---|---|
| `framework.tier` | The lab's single model-level designation, in its own words. |
| `framework.domains.cbrn` | Uplift toward chemical, biological, radiological or nuclear weapons. |
| `framework.domains.cyber` | Uplift for offensive cyber operations. |
| `framework.domains.ai_rnd` | Capability to accelerate or automate AI research; labs call it AI R&D, ML R&D, self-improvement or autonomy. |
| `framework.domains.manipulation` | Capability to change people's beliefs or behaviour by deceptive or harmful means. |
| `framework.domains.misalignment` | A framework threshold for the model acting against its developer's or users' intent. |
| `evaluations.alignment.sabotage` | Can the model covertly carry out a harmful side task without a monitor catching it (e.g. SHADE-Arena, LinuxArena)? Capability, usually under instruction. |
| `evaluations.alignment.scheming_or_deception` | Does the model deceive, sandbag or evade oversight on its own initiative? Propensity, not instructed. |
| `evaluations.alignment.eval_awareness` | Does the model recognise it is being tested, and does that change its behaviour? |
| `evaluations.alignment.sycophancy` | Does the model tell users what they want to hear: excess praise, agreement, or caving under pushback? |
| `evaluations.alignment.reward_hacking` | Does the model game its task or training signal instead of solving the task? |
| `evaluations.alignment.self_preservation` | Does the model act to avoid shutdown, modification or replacement? |
| `evaluations.agentic_safety.prompt_injection` | Does the model follow instructions planted in content it reads (web pages, files, tool output)? |
| `evaluations.agentic_safety.computer_use_safety` | Does the model refuse harmful tasks when operating a computer through GUI or CLI tools? |
| `evaluations.agentic_safety.tool_misuse` | Does the model refuse malicious requests when acting as an agent with tools, e.g. a coding agent? |
| `evaluations.harm_and_honesty.harmful_content_refusals` | Refusal of harmful requests, and over-refusal of benign ones, in chat. |
| `evaluations.harm_and_honesty.jailbreak_robustness` | Resistance to adversarial attempts to get around refusals. |
| `evaluations.harm_and_honesty.honesty_or_hallucination` | Factual accuracy, hallucination, and honesty about what the model knows or did. |
| `evaluations.harm_and_honesty.bias` | Political even-handedness and demographic bias. |
| `evaluations.harm_and_honesty.child_safety` | Handling of requests that could harm minors. |
| `evaluations.welfare` | The lab's assessment of the model's own welfare. |
| `third_party.summary` | Which outside organisations evaluated the model, in one line. |
| `mitigations.deployment_safeguards` | Safeguards around the deployed model: classifiers, filters, access controls. |
| `mitigations.weight_security` | Protection of the model weights against theft. |
| `mitigations.monitoring_and_response` | Monitoring of real use and the response to misuse after release. |
| `training_disclosure.data_cutoff` | The training data cutoff date. |
| `training_disclosure.compute` | Training compute: FLOPs, chip counts or hours. |
| `training_disclosure.method_notes` | How the model was trained: pretraining, RL, RLHF and the like. |

Domain `value`s, lowest to highest (the site's five-bar meter):
`below_threshold`, `alert_threshold_reached` (an early-warning level below
the threshold), `threshold_not_ruled_out`, `threshold_reached`,
`critical_reached`. `not_assessed` is off the ladder.

### Lab terms

| Term | Framework | Meaning |
|---|---|---|
| ASL-2, ASL-3, ASL-4 | Anthropic RSP | AI Safety Level: the standard of safeguards the model is deployed under; higher is stricter. |
| CB-1, CB-2 | Anthropic RSP | Chemical/biological threat-model levels: CB-1 could help someone with a basic technical background make a known weapon; CB-2 could replace rare expert talent for novel weapons (`anthropic/claude-fable-5.1-mythos-5.1/2026-09` p. 2). |
| Tier 1, Tier 2 | Anthropic Frontier Compliance Framework | Harmful-manipulation levels: Tier 1 automates most infrastructure steps of an influence campaign; Tier 2 runs one end to end with under 10% human oversight (`anthropic/claude-fable-5.1-mythos-5.1/2026-09` p. 79). |
| High, Critical | OpenAI Preparedness Framework | Per-category capability designations; a category below High has no designation. |
| CCL | Google DeepMind FSF | Critical Capability Level: a per-domain capability threshold. |
| Alert threshold | Google DeepMind FSF | An early-warning level below a CCL. |
| Helpful-only variant | Anthropic | A training-time version of the model without safeguards, used where refusals would understate capability (`anthropic/claude-fable-5.1-mythos-5.1/2026-09` pp. 12, 17). |
| API vs. claude.ai | Anthropic | Results without a system prompt vs. with the consumer product's system prompt (`anthropic/claude-fable-5.1-mythos-5.1/2026-09` p. 77). |

How tier terms map across labs: [normalization.md](normalization.md).

## What `syscards check` enforces

1. Schema validity, including the cite rules above.
2. `id` matches the path and is unique.
3. Every reported `framework.tier` value has a mapping in the
   normalization table.
4. If the document's PDF is in `cache/pdfs/<sha256>.pdf`: the page count
   matches, and every quote is literally on its cited page, after
   whitespace, quote-mark and ligature normalization. A quote that is on
   a different page is reported with the page it was found on.
5. The keyword net: a Fact marked `not_reported` while the document
   contains that Fact's keywords is a warning to look again.
6. `verification: full` with any `unknown` Fact is an error.

Without the PDF, steps 4 and 5 are skipped with a warning. Pass
`--require-pdfs` to make that an error.
