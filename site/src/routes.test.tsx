import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { expect, it, vi } from "vitest";
import { makeCard, makeDataset } from "./test/fixtures";

const ds = makeDataset([makeCard({ id: "lab-a/model-x/2026-01", models: ["Model X"] })]);

vi.mock("./lib/data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./lib/data")>()),
  loadDataset: async () => ds,
}));

const { routes } = await import("./routes");

const renderAt = (url: string) =>
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [url] })} />);

it("routes an id containing slashes to that card's detail view", async () => {
  renderAt("/cards/lab-a/model-x/2026-01");
  expect(await screen.findByRole("heading", { name: "Model X System Card" })).toBeInTheDocument();
});

it("shows not found for an id that is not in the dataset", async () => {
  renderAt("/cards/lab-a/missing/2026-01");
  expect(await screen.findByText("No card with this id.")).toBeInTheDocument();
});
