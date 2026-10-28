import type {
  CardRecord,
  Dataset,
  DomainAssessment,
  Fact,
  ModelInfo,
  Status,
  ThirdPartyAssessment,
} from "../types.generated";

type Tree = Record<string, unknown>;

const fact = (): Fact => ({ status: "unknown", value: null, cite: null, note: null });
const domain = (): DomainAssessment => ({
  status: "unknown",
  value: null,
  raw_threshold: null,
  cite: null,
  note: null,
});

function isFactLike(x: unknown): x is Fact | DomainAssessment {
  return typeof x === "object" && x !== null && "status" in x && "cite" in x;
}

function factPathsOf(node: Tree, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isFactLike(child)) return [path];
    if (typeof child === "object" && child !== null && !Array.isArray(child)) {
      return factPathsOf(child as Tree, path);
    }
    return [];
  });
}

export interface CardOptions {
  id?: string;
  models?: string[];
  published?: string | null;
  pages?: number | null;
  url?: string;
  normalizedTier?: string | null;
  facts?: Record<string, Partial<Fact> | Partial<DomainAssessment>>;
  assessments?: ThirdPartyAssessment[];
}



function nodeAt(root: unknown, keys: string[]): Tree {
  return keys.reduce<Tree>((node, key) => node[key] as Tree, root as Tree);
}

const model = (name: string): ModelInfo => ({
  name,
  developer: "Lab A",
  family: null,
  release_date: null,
  open_weights: null,
  modalities: [],
  epoch_id: null,
});

function blankCard(opts: CardOptions): CardRecord {
  const id = opts.id ?? "lab-a/model-x/2026-01";
  const [first = "Model X", ...rest] = opts.models ?? [];
  const card: CardRecord = {
    id,
    lab: id.split("/")[0] ?? "",
    models: [model(first), ...rest.map(model)],
    document: {
      kind: "system_card",
      title: `${[first, ...rest].join(" & ")} System Card`,
      url: opts.url ?? "https://example.org/card.pdf",
      landing_url: null,
      published: opts.published === undefined ? "2026-01" : opts.published,
      revised: null,
      pages: opts.pages === undefined ? 10 : opts.pages,
      sha256: null,
      fetched: null,
      fetched_from: null,
    },
    framework: {
      name: "other",
      version: null,
      tier: fact(),
      domains: {
        cbrn: domain(),
        cyber: domain(),
        ai_rnd: domain(),
        manipulation: domain(),
        misalignment: domain(),
      },
    },
    evaluations: {
      alignment: {
        sabotage: fact(),
        scheming_or_deception: fact(),
        eval_awareness: fact(),
        sycophancy: fact(),
        reward_hacking: fact(),
        self_preservation: fact(),
      },
      agentic_safety: { prompt_injection: fact(), computer_use_safety: fact(), tool_misuse: fact() },
      harm_and_honesty: {
        harmful_content_refusals: fact(),
        jailbreak_robustness: fact(),
        honesty_or_hallucination: fact(),
        bias: fact(),
        child_safety: fact(),
      },
      welfare: fact(),
    },
    third_party: { summary: fact(), assessments: opts.assessments ?? [] },
    mitigations: {
      deployment_safeguards: fact(),
      weight_security: fact(),
      monitoring_and_response: fact(),
    },
    training_disclosure: { data_cutoff: fact(), compute: fact(), method_notes: fact() },
    disclosure_meta: { section_titles: [] },
    provenance: {
      extracted_by: "human",
      extracted_on: "2026-01-15",
      verified_by: null,
      verification: "none",
    },
    notes: null,
    normalized_tier: opts.normalizedTier ?? null,
    withheld: [],
    not_reported: [],
    coverage: { reported: 0, withheld: 0, not_reported: 0, not_applicable: 0, unknown: 0 },
  };
  return card;
}

export const FACT_PATHS: string[] = factPathsOf(blankCard({}) as unknown as Tree);

/** A card shaped like `data.json`, every fact `unknown` unless set in `facts`. */
export function makeCard(opts: CardOptions = {}): CardRecord {
  const card = blankCard(opts);
  for (const [path, patch] of Object.entries(opts.facts ?? {})) {
    const keys = path.split(".");
    const last = keys.pop() as string;
    const parent = nodeAt(card, keys);
    parent[last] = { ...(parent[last] as Tree), ...patch };
  }
  const statuses = FACT_PATHS.map(
    (p): [string, Status] => [p, (nodeAt(card, p.split(".")) as unknown as Fact).status],
  );
  card.withheld = statuses.filter(([, s]) => s === "withheld").map(([p]) => p);
  card.not_reported = statuses.filter(([, s]) => s === "not_reported").map(([p]) => p);
  for (const [, s] of statuses) card.coverage[s] += 1;
  return card;
}

export const RUNGS = {
  baseline: "Rung one description.",
  elevated: "Rung two description.",
  severe: "Rung three description.",
};

export const LADDER: Dataset["domain_outcomes"] = [
  "below_threshold",
  "alert_threshold_reached",
  "threshold_not_ruled_out",
  "threshold_reached",
  "critical_reached",
];

export function makeDataset(cards: CardRecord[]): Dataset {
  return {
    schema_version: "0.0.0",
    normalization_version: 1,
    rungs: RUNGS,
    fact_paths: FACT_PATHS,
    domain_outcomes: LADDER,
    cards,
  };
}

export const quote = (page: number, text: string) => ({ page, quote: text, note: null });
