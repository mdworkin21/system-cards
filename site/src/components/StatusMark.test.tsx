import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StatusMark } from "./StatusMark";

it("keeps the label for hover and screen readers", () => {
  render(<StatusMark status="not_reported" />);
  expect(screen.getByText("not reported")).toHaveClass("sr-only");
  expect(screen.getByTitle("not reported")).toBeInTheDocument();
});
