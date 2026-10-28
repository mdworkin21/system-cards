import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { CiteDetails, CitePopover } from "./CitePopover";

it("opens on keyboard focus with the quote and a link to the cited page", async () => {
  const user = userEvent.setup();
  render(
    <CitePopover trigger="CB-1 · elevated">
      <CiteDetails cite={{ page: 15, quote: "the quoted sentence", note: null }} url="https://example.org/c.pdf" />
    </CitePopover>,
  );
  expect(screen.queryByText("the quoted sentence")).toBeNull();
  await user.tab();
  expect(await screen.findByText("the quoted sentence")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /p\. 15/ })).toHaveAttribute("href", "https://example.org/c.pdf#page=15");
});
