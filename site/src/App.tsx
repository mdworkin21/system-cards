import { Link, Outlet, useRouteError } from "react-router";
import { useDataset } from "./lib/data";

const PAGE = "mx-auto max-w-[90rem] px-4 py-8";

export function App() {
  const data = useDataset();
  return (
    <div className={PAGE}>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">
          <Link to="/">System cards</Link>
        </h1>
        <p className="mt-1 text-page-muted">
          What frontier-model system cards say about safety, cited to the page.
        </p>
      </header>
      <main>
        {data.cards.length === 0 ? <p className="text-page-muted">data.json has no cards.</p> : <Outlet />}
      </main>
    </div>
  );
}

export function Loading() {
  return <p className={`${PAGE} text-page-muted`}>Loading data…</p>;
}

export function RootError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className={PAGE}>
      <p className="text-page-muted">Could not load the dataset: {message}</p>
    </div>
  );
}
