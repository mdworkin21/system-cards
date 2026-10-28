import type { ColumnDef, RowData } from "@tanstack/react-table";
import type { CardRecord, Dataset } from "../types.generated";
import { factAt, groupCount } from "./facts";
import { humanize, outcomeLevel } from "./format";

export type CellKind =
  | { kind: "model" }
  | { kind: "tier" }
  | { kind: "domain"; path: string }
  | { kind: "thirdParty" }
  | { kind: "group"; prefix: string }
  | { kind: "pages" }
  | { kind: "published" };

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    cell: CellKind;
  }
}

const DOMAIN_PREFIX = "framework.domains.";

// Acronyms only; any other domain key is shown humanized.
const DOMAIN_HEADERS: Record<string, string> = { cbrn: "CBRN", ai_rnd: "AI R&D" };

const GROUPS = [
  { prefix: "evaluations.alignment", header: "Alignment evals" },
  { prefix: "evaluations.agentic_safety", header: "Agentic safety evals" },
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function modelNames(card: CardRecord): string {
  return card.models.map((m) => m.name).join(" & ");
}

type Column = ColumnDef<CardRecord, string | number | undefined>;

/** The matrix's columns: fixed ones, plus one per `framework.domains.*` path in `fact_paths`. */
export function matrixColumns(ds: Dataset): Column[] {
  const rungOrder = Object.keys(ds.rungs);
  const domainPaths = ds.fact_paths.filter((p) => p.startsWith(DOMAIN_PREFIX));
  const sortable = { sortingFn: "basic", sortUndefined: "last" } as const;

  const domains: Column[] = domainPaths.map((path) => {
    const key = path.slice(DOMAIN_PREFIX.length);
    return {
      id: key,
      header: DOMAIN_HEADERS[key] ?? capitalize(humanize(key)),
      meta: { cell: { kind: "domain", path } },
      accessorFn: (card) => {
        const f = factAt(card, path);
        if (f?.status !== "reported" || !("raw_threshold" in f)) return undefined;
        return outcomeLevel(f.value, ds.domain_outcomes) ?? undefined;
      },
      ...sortable,
    };
  });

  const groups: Column[] = GROUPS.map(({ prefix, header }) => ({
    id: prefix.split(".").at(-1) as string,
    header,
    meta: { cell: { kind: "group", prefix } },
    accessorFn: (card) => groupCount(card, prefix, ds.fact_paths).reported,
    ...sortable,
  }));

  return [
    {
      id: "model",
      header: "Model",
      meta: { cell: { kind: "model" } },
      accessorFn: modelNames,
      sortingFn: "text",
    },
    {
      id: "tier",
      header: "Framework tier",
      meta: { cell: { kind: "tier" } },
      accessorFn: (card) => {
        const i = card.normalized_tier === null ? -1 : rungOrder.indexOf(card.normalized_tier);
        return i < 0 ? undefined : i;
      },
      ...sortable,
    },
    ...domains,
    {
      id: "third_party",
      header: "Third-party testers",
      meta: { cell: { kind: "thirdParty" } },
      accessorFn: (card) =>
        card.third_party.summary.status === "reported" ? card.third_party.assessments.length : undefined,
      ...sortable,
    },
    ...groups,
    {
      id: "pages",
      header: "Pages",
      meta: { cell: { kind: "pages" } },
      accessorFn: (card) => card.document.pages ?? undefined,
      ...sortable,
    },
    {
      id: "published",
      header: "Published",
      meta: { cell: { kind: "published" } },
      accessorFn: (card) => card.document.published ?? undefined,
      ...sortable,
    },
  ];
}
