import { describe, expect, it } from "vitest";
import { FACT_PATHS, makeCard, quote } from "../test/fixtures";
import { factAt, groupCount, isStub } from "./facts";

describe("isStub", () => {
  it("is true only when every fact is unknown, not when every fact is not_reported", () => {
    const silent = makeCard({
      facts: Object.fromEntries(FACT_PATHS.map((p) => [p, { status: "not_reported" as const }])),
    });
    expect(isStub(silent, FACT_PATHS)).toBe(false);
    expect(isStub(makeCard(), FACT_PATHS)).toBe(true);
  });
});

describe("factAt", () => {
  it("returns the fact itself at a domain path and at a top-level evaluations path", () => {
    const card = makeCard({
      facts: {
        "framework.domains.cyber": { status: "reported", value: "below_threshold", cite: quote(3, "cyber text here") },
        "evaluations.welfare": { status: "withheld", cite: quote(9, "welfare text here") },
      },
    });
    expect(factAt(card, "framework.domains.cyber")).toBe(card.framework.domains.cyber);
    expect(factAt(card, "evaluations.welfare")).toBe(card.evaluations.welfare);
    expect(factAt(card, "framework.domains")).toBeUndefined();
  });
});

describe("groupCount", () => {
  it("counts reported only, out of the group's paths in fact_paths", () => {
    const card = makeCard({
      facts: {
        "evaluations.agentic_safety.prompt_injection": { status: "reported", value: "yes", cite: quote(1, "prompt injection") },
        "evaluations.agentic_safety.tool_misuse": { status: "withheld", cite: quote(2, "tool misuse text") },
      },
    });
    expect(groupCount(card, "evaluations.agentic_safety", FACT_PATHS)).toEqual({ reported: 1, total: 3 });
  });
});
