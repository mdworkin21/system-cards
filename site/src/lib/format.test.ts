import { describe, expect, it } from "vitest";
import { LADDER } from "../test/fixtures";
import type { Status } from "../types.generated";
import { displayQuote, outcomeLevel, pdfPageUrl, statusMark } from "./format";

describe("statusMark", () => {
  it("gives every status its own glyph and its own label", () => {
    const all: Status[] = ["reported", "withheld", "not_reported", "not_applicable", "unknown"];
    const marks = all.map(statusMark);
    expect(new Set(marks.map((m) => m.glyph)).size).toBe(all.length);
    expect(new Set(marks.map((m) => m.label)).size).toBe(all.length);
  });
});

describe("outcomeLevel", () => {
  it("puts not_assessed off the ladder rather than on its lowest step", () => {
    expect(outcomeLevel("not_assessed", LADDER)).toBeNull();
  });
});

describe("pdfPageUrl", () => {
  it("replaces an existing fragment and keeps the URL's encoding", () => {
    const url = "https://example.org/a/Model%20Card%20&%20X.pdf#foo";
    expect(pdfPageUrl(url, 15)).toBe("https://example.org/a/Model%20Card%20&%20X.pdf#page=15");
  });
});

describe("displayQuote", () => {
  it("marks a fragment cut at both ends", () => {
    expect(displayQuote("we are continuing to treat it as High")).toBe("…we are continuing to treat it as High…");
  });

  it("leaves a whole sentence alone, including one closing on a quote mark", () => {
    expect(displayQuote("It said “below threshold.”")).toBe("It said “below threshold.”");
  });
});
