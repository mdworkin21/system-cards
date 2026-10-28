import { describe, expect, it } from "vitest";
import { parseViewState, toSearchParams, type ViewState } from "./viewState";

describe("view state in the URL", () => {
  it("round-trips sort and every filter", () => {
    const s: ViewState = { sort: { id: "published", desc: true }, lab: "lab-a", rung: "elevated", q: "model x" };
    expect(parseViewState(toSearchParams(s))).toEqual(s);
  });

  it("ignores a param it does not know", () => {
    expect(parseViewState(new URLSearchParams("utm=1&sort=published")).sort).toEqual({ id: "published", desc: false });
  });
});
