# Card queue

The ordered worklist of documents to extract into `sources/`. One card at a
time; a card is done when a named person has read every cite
(`docs/adding-a-card.md`, step 5). Index pages checked 2026-11-08:
anthropic.com/transparency, deploymentsafety.openai.com,
deepmind.google/models/model-cards.

Status: `extracted` (in `sources/`, awaiting human verification),
`cached` (PDF in `cache/pdfs/`, nothing written), `url` (document located,
not fetched), `listed` (on the lab's index, document not located).

## 1. Cutting edge

| # | Document | Lab | Published | Status | Notes |
|---|---|---|---|---|---|
| 1 | Claude Opus 5.5 System Card | Anthropic | 2026-09-22 | extracted | `anthropic/claude-opus-5.5/2026-09`, branch `data/anthropic-claude-opus-5.5` |
| 2 | GPT-6 Astra System Card | OpenAI | 2026-09-03 (updated 09-09) | listed | deploymentsafety.openai.com/gpt-6-astra; PDF path to confirm |
| 3 | Gemini 4 Argon Model Card | Google DeepMind | to confirm (Sept 30 or Oct 13, sources disagree) | url | storage.googleapis.com/deepmind-media/Model-Cards/Gemini-4-Argon-Model-Card.pdf. Open question: the card page announces a separate Safety & Security Report; the schema takes one `document` per card, so decide which one is the record (or two records) |
| 4 | Claude Sonnet 5.5 System Card | Anthropic | 2026-09-28 | cached | 148 pp, sha256 `89cfd6a6…` |
| 5 | Claude Haiku 5.5 System Card | Anthropic | 2026-10-07 | cached | 144 pp, sha256 `d5dbaab6…` |
| 6 | Addendum to GPT-6 Astra: GPT-6.1 Sol; GPT-6.1 Terra | OpenAI | 2026-09-29; 2026-10-26 | listed | `kind: addendum`; only after #2 |

## 2. Specialized models (optional)

Not general-purpose frontier LLM cards. Expect many `not_applicable` facts;
decide per document whether the schema fits before extracting.

| Document | Lab | Published | Status | Why consider |
|---|---|---|---|---|
| GPT-6 Cyber System Card | OpenAI | 2026-11-05 | listed | Cyber-specialized variant of GPT-6 Astra; the one specialized card squarely in scope for the cyber domain |
| GPT-Live-1.1 system card | OpenAI | 2026-10-15 | listed | Realtime/voice line |
| GPT-Rosalind-6 System Card Addendum | OpenAI | 2026-10-30 | listed | Addendum; purpose not checked |
| ChatGPT Images 2.6 System Card | OpenAI | 2026-11-04 | listed | Image model; weak fit |
| Gemini Robotics ER 2; Robotics On-Device 2 | Google DeepMind | 2026-07-30 | listed | Embodied models; weak fit |
| Gemini 3.8 Flash Model Card | Google DeepMind | 2026-09 | url | storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-8-Flash-Model-Card.pdf; a "3.8 Flash Cyber" variant is reported second-hand only |

## 3. Backfills (optional)

For version-over-version views (the Opus line first). Dates come from
each card's cover page when fetched; the Anthropic PDFs below were
resolved from anthropic.com/transparency.

| Order | Document | Lab | Status | Notes |
|---|---|---|---|---|
| 1 | Claude Opus 4.8 System Card | Anthropic | url | Stub in `sources/`; assets.claude.com/0f0c97ad20d8005706296bd92aa1c27c6b2f4f61.pdf now reachable |
| 2 | Claude Opus 5 System Card | Anthropic | url | assets.claude.com/ceaf5c7ff2783855203fde8208ec311252dced5b.pdf |
| 3 | Claude Opus 4.7 System Card | Anthropic | url | assets.claude.com/037f06850df7fbe871e206dad004c3db5fd50340.pdf |
| 4 | Claude Opus 4.6 System Card | Anthropic | url | assets.claude.com/6a5fa276ac68b9aeb0c8b6af5fa36326e0e166dd.pdf |
| 5 | Claude Opus 4.5 System Card | Anthropic | url | assets.claude.com/bf10f64990cfda0ba858290be7b8cc6317685f47.pdf |
| 6 | GPT-5.6 System Card | OpenAI | listed | 2026-07-09 (updated 08-03); deploymentsafety.openai.com/gpt-5-6 |
| 7 | GPT-5.5 System Card | OpenAI | listed | 2026-04-23 (updated 08-19); deploymentsafety.openai.com/gpt-5-5 |
| 8 | Gemini 3 Pro Model Card | Google DeepMind | listed | deepmind.google/models/model-cards/gemini-3-pro |
| 9 | Claude Fable 5 & Mythos 5; Mythos Preview; Sonnet 5 | Anthropic | url | assets.claude.com/57a52ea7…, 7624816413…, 283ef97c… |
| 10 | Sonnet 4.5; Haiku 4.5; Claude 3.7 Sonnet | Anthropic | listed | On the transparency hub; older lines |
| 11 | Gemini 3.5 to 3.7 Flash, Gemini 3 Flash | Google DeepMind | listed | Flash line, if a Flash series is wanted |

Not on the transparency hub as of 2026-11-08: Claude Opus 4 and 4.1, so the
Opus line currently starts at 4.5.
