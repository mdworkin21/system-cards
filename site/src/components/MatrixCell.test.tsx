import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { makeCard, makeDataset, quote } from "../test/fixtures";
import { MatrixCell } from "./MatrixCell";

it("shows a reported tier with no rung as the raw term alone", () => {
  const card = makeCard({
    normalizedTier: null,
    facts: { "framework.tier": { status: "reported", value: "CB-1", cite: quote(4, "designated CB-1 here") } },
  });
  const { container } = render(<MatrixCell card={card} cell={{ kind: "tier" }} ds={makeDataset([card])} />);
  expect(container.textContent).toBe("CB-1");
});
