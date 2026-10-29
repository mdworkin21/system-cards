import { describe, expect, it } from "vitest";
import { makeCard } from "../test/fixtures";
import { groupByLab } from "./rows";

describe("groupByLab", () => {
  it("keeps the build's order within a lab instead of re-sorting by name", () => {
    const cards = [
      makeCard({ id: "lab-a/zeta/2025-01", models: ["Zeta"] }),
      makeCard({ id: "lab-a/alpha/2026-01", models: ["Alpha"] }),
      makeCard({ id: "lab-b/beta/2025-06", models: ["Beta"] }),
    ];
    const groups = groupByLab(cards, (c) => c.lab);
    expect(groups.map((g) => [g.lab, g.items.map((c) => c.id)])).toEqual([
      ["lab-a", ["lab-a/zeta/2025-01", "lab-a/alpha/2026-01"]],
      ["lab-b", ["lab-b/beta/2025-06"]],
    ]);
  });
});
