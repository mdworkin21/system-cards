import { createHashRouter, type RouteObject } from "react-router";
import { App, Loading, RootError } from "./App";
import { Matrix } from "./components/Matrix";
import { DATASET_ROUTE_ID, loadDataset } from "./lib/data";

// Hash routing because GitHub Pages has no SPA fallback; a host with
// rewrites swaps createHashRouter for createBrowserRouter here and nowhere else.
export const routes: RouteObject[] = [
  {
    id: DATASET_ROUTE_ID,
    path: "/",
    loader: loadDataset,
    shouldRevalidate: () => false,
    element: <App />,
    errorElement: <RootError />,
    HydrateFallback: Loading,
    children: [{ index: true, element: <Matrix /> }],
  },
];

export function createAppRouter() {
  return createHashRouter(routes);
}
