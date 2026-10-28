import { Link, Outlet, useLoaderData, useRouteError } from "react-router";
import type { Dataset } from "./types.generated";

export function App() {
  const data = useLoaderData<Dataset>();
  return (
    <div className="page">
      <header className="site-header">
        <h1>
          <Link to="/">System cards</Link>
        </h1>
        <p className="tagline">What frontier-model system cards say about safety, cited to the page.</p>
      </header>
      <main>{data.cards.length === 0 ? <p className="empty">data.json has no cards.</p> : <Outlet />}</main>
    </div>
  );
}

export function Loading() {
  return <p className="page status-line">Loading data…</p>;
}

export function RootError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="page">
      <p className="status-line">Could not load the dataset: {message}</p>
    </div>
  );
}
