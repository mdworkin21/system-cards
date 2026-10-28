import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { expect, it, vi } from "vitest";
import { makeCard, makeDataset } from "../test/fixtures";

const ds = makeDataset([
  makeCard({ id: "lab-a/model-x/2026-03", models: ["Model X"], published: "2026-03" }),
  makeCard({ id: "lab-a/model-y/2026-05", models: ["Model Y"], published: "2026-05" }),
  makeCard({ id: "lab-b/model-z/2025-12", models: ["Model Z"], published: "2025-12" }),
]);

vi.mock("../lib/data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/data")>()),
  loadDataset: async () => ds,
}));

const { routes } = await import("../routes");

async function renderAt(url: string) {
  const { container } = render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [url] })} />);
  await screen.findByRole("table");
  return {
    groupRows: container.querySelectorAll("tr.group-row").length,
    models: [...container.querySelectorAll("tbody th[scope=row]")].map((th) => th.textContent),
  };
}

it("groups rows by lab while unsorted", async () => {
  const { groupRows, models } = await renderAt("/");
  expect(groupRows).toBe(2);
  expect(models).toEqual(["Model X", "Model Y", "Model Z"]);
});

it("drops the groups and orders across labs when sorted by date", async () => {
  const { groupRows, models } = await renderAt("/?sort=published");
  expect(groupRows).toBe(0);
  expect(models).toEqual(["Model Z", "Model X", "Model Y"]);
});

it("filters by lab through the hidden lab column", async () => {
  expect((await renderAt("/?lab=lab-b")).models).toEqual(["Model Z"]);
});

it("filters by model name", async () => {
  expect((await renderAt("/?q=y")).models).toEqual(["Model Y"]);
});

it("clears the name box when a navigation drops q", async () => {
  const router = createMemoryRouter(routes, { initialEntries: ["/?q=y"] });
  render(<RouterProvider router={router} />);
  await screen.findByRole("table");
  await act(() => router.navigate("/"));
  expect(screen.getByRole("searchbox")).toHaveValue("");
});

it("resyncs the name box when a navigation lands before a typed edit renders", async () => {
  const router = createMemoryRouter(routes, { initialEntries: ["/?lab=lab-b", "/"], initialIndex: 1 });
  render(<RouterProvider router={router} />);
  await screen.findByRole("table");
  const box = screen.getByRole("searchbox");
  await act(async () => {
    fireEvent.change(box, { target: { value: "ab" } });
    await router.navigate(-1);
  });
  expect(box).toHaveValue("");
  await act(() => router.navigate("/?q=y"));
  expect(box).toHaveValue("y");
});

it("resyncs the name box when the header link lands before a typed edit renders", async () => {
  const router = createMemoryRouter(routes, { initialEntries: ["/"] });
  render(<RouterProvider router={router} />);
  await screen.findByRole("table");
  const box = screen.getByRole("searchbox");
  await act(async () => {
    fireEvent.change(box, { target: { value: "ab" } });
    fireEvent.click(screen.getByRole("link", { name: "System cards" }));
  });
  expect(router.state.location.search).toBe("");
  expect(box).toHaveValue("");
});

it("resyncs the name box on Back to an entry holding an older edit's tag", async () => {
  const router = createMemoryRouter(routes, {
    initialEntries: [{ pathname: "/", search: "?q=y", state: { qEdit: 2 } }, "/"],
    initialIndex: 1,
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole("table");
  const box = screen.getByRole("searchbox");
  await act(async () => {
    fireEvent.change(box, { target: { value: "x" } });
    await router.navigate(-1);
  });
  expect(router.state.location.search).toBe("?q=y");
  expect(box).toHaveValue("y");
});
