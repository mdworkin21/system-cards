import { createHashRouter, type RouteObject } from "react-router";
import { App, Loading, RootError } from "./App";
import { loadDataset } from "./lib/data";

export const ROOT_ROUTE_ID = "root";

// Hash routing because GitHub Pages has no SPA fallback; a host with
// rewrites swaps createHashRouter for createBrowserRouter here and nowhere else.
export const routes: RouteObject[] = [
  {
    id: ROOT_ROUTE_ID,
    path: "/",
    loader: loadDataset,
    shouldRevalidate: () => false,
    element: <App />,
    errorElement: <RootError />,
    HydrateFallback: Loading,
    children: [],
  },
];

export function createAppRouter() {
  return createHashRouter(routes);
}
