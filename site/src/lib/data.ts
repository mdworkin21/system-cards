import type { Dataset } from "../types.generated";

/** The site's only data access: `data.json` next to the page. */
export async function loadDataset(): Promise<Dataset> {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`);
  if (!res.ok) throw new Error(`data.json: HTTP ${res.status}`);
  return (await res.json()) as Dataset;
}
