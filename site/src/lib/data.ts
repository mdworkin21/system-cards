import { useRouteLoaderData } from "react-router";
import type { Dataset } from "../types.generated";

export const DATASET_ROUTE_ID = "root";

/** The site's only data access: `data.json` next to the page. */
export async function loadDataset(): Promise<Dataset> {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`);
  if (!res.ok) throw new Error(`data.json: HTTP ${res.status}`);
  return (await res.json()) as Dataset;
}

/** The dataset the root route loaded; views below it never fetch. */
export function useDataset(): Dataset {
  return useRouteLoaderData(DATASET_ROUTE_ID) as Dataset;
}
