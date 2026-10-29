import type { CardRecord, DomainAssessment, Fact } from "../types.generated";

export type AnyFact = Fact | DomainAssessment;

function isFact(x: unknown): x is AnyFact {
  return typeof x === "object" && x !== null && "status" in x && "cite" in x;
}

/** The Fact or DomainAssessment at a dotted path from `fact_paths`. */
export function factAt(card: CardRecord, path: string): AnyFact | undefined {
  let node: unknown = card;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null || Array.isArray(node)) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return isFact(node) ? node : undefined;
}

export function groupPaths(prefix: string, factPaths: string[]): string[] {
  return factPaths.filter((p) => p.startsWith(`${prefix}.`));
}

/** How many facts under `prefix` are `reported`, out of how many there are. */
export function groupCount(
  card: CardRecord,
  prefix: string,
  factPaths: string[],
): { reported: number; total: number } {
  const paths = groupPaths(prefix, factPaths);
  const reported = paths.filter((p) => factAt(card, p)?.status === "reported").length;
  return { reported, total: paths.length };
}

/** True when nobody has extracted anything from the card yet. */
export function isStub(card: CardRecord, factPaths: string[]): boolean {
  return card.coverage.unknown === factPaths.length;
}
