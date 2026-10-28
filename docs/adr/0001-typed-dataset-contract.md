# 0001. The build output is a typed pydantic model and the root of the schema export

Status: proposed · Date: 2026-10-28 · Design doc: `docs/site.md`

## Context

The site's types come from `schema/system-card.schema.json` via json-schema-to-typescript. Until now `syscards schema` exported `Card` only, while `build.py:card_record` added `lab`, `normalized_tier`, `withheld`, `not_reported` and `coverage` as an untyped dict and `build.py:build_dataset` added the envelope (`rungs`, `fact_paths`, versions). Those fields would reach the site with hand-written types that nothing checks.

## Decision

Every field in `data.json` is declared on a pydantic model in `src/system_cards/build.py` (`Dataset`, `CardRecord`, `Coverage`), and `syscards schema` exports `Dataset.model_json_schema(mode="serialization")`. A new derived field is added to those models, never to a dict. `Strict` sets `json_schema_serialization_defaults_required` so the export marks fields the build always writes as required.

## Consequences

- A build change that the site has not absorbed fails `syscards schema --check` and the site's `gen-types` drift check in CI, not the rendered page.
- The export file keeps its name but its root is `Dataset`; `Card` is under `$defs`.
- Adding a field to `data.json` now touches a model, the export, and `types.generated.ts` in one PR.
