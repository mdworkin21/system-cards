# Normalization

Labs name their tiers differently and the names do not line up. The one
place a cross-lab judgment lives is `normalization/tiers.yaml`. Everything
else in the dataset is the lab's own words.

## The ladder

Three rungs, deliberately coarse:

| rung | meaning |
| --- | --- |
| `baseline` | No elevated capability threshold reached. Deployed under the framework's base standard. |
| `elevated` | A capability threshold was reached, or could not be ruled out, and the model is deployed with elevated safeguards. |
| `severe` | A threshold beyond the first elevated tier was reached. |

Anything finer than this is contestable, so it is not attempted. The raw
term is always stored on the card and always shown next to the rung.

## The table

```yaml
version: 1
rungs: {baseline: ..., elevated: ..., severe: ...}
mappings:
  - {framework: rsp, raw: "ASL-3", rung: elevated}
  - {framework: preparedness_framework, raw: "High", rung: elevated}
  - {framework: fsf, raw: "CCL not reached", rung: baseline}
```

A mapping is keyed by `(framework, raw)`. `raw` must be exactly the string
used as the card's `framework.tier.value`. `syscards check` fails on a
reported tier with no mapping, so adding a card with a new term means
adding a row here in the same change.

Bump `version` whenever an existing row changes meaning. The built
`data.json` records the version it was built with.

## Where the rest of the comparability comes from

Risk-domain outcomes (`framework.domains.*.value`) are not normalized
through a table. They are chosen directly by the extractor from a small
enum, with the lab's threshold name stored beside them and the quote one
hover away. The rule for choosing is in [schema.md](schema.md).
