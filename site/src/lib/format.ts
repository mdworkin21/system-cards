import type { DomainOutcome, Status } from "../types.generated";

const GLYPHS: Record<Status, string> = {
  reported: "●",
  withheld: "◐",
  not_reported: "○",
  not_applicable: "⊘",
  unknown: "?",
};

const OUTCOME_SHORT: Record<DomainOutcome, string> = {
  below_threshold: "Below",
  alert_threshold_reached: "Alert",
  threshold_not_ruled_out: "Not ruled out",
  threshold_reached: "Reached",
  critical_reached: "Critical",
  not_assessed: "Not assessed",
};

export function humanize(s: string): string {
  return s.replaceAll("_", " ");
}

/** Glyph and text for a status, so no status relies on color alone. */
export function statusMark(s: Status): { glyph: string; label: string } {
  return { glyph: GLYPHS[s], label: humanize(s) };
}

/** The outcome's label in a matrix cell, where the meter carries the scale. */
export function outcomeShort(v: DomainOutcome): string {
  return OUTCOME_SHORT[v];
}

/** 1-based step on the outcome ladder, or null for an outcome that is not on it. */
export function outcomeLevel(v: DomainOutcome | null, ladder: DomainOutcome[]): number | null {
  if (v === null) return null;
  const i = ladder.indexOf(v);
  return i < 0 ? null : i + 1;
}

/** The document URL opened at a page; any existing fragment is replaced, the rest kept as is. */
export function pdfPageUrl(url: string, page: number): string {
  return `${url.split("#", 1)[0]}#page=${page}`;
}

export function cardHref(id: string): string {
  return `/cards/${id}`;
}
