# 0002. The URL owns site view state; data sits behind one loader; no global store

Status: proposed · Date: 2026-10-28 · Design doc: `docs/site.md`

## Context

The site is static on GitHub Pages, which has no SPA fallback, and reads one read-only `data.json`. The matrix needs sort and filters that a reader can share as a link. A backend may come later (`docs/plan.md` section 6, "Extending the stack").

## Decision

- Routing uses React Router. While the site is on GitHub Pages it uses `createHashRouter`; the route table lives in `site/src/routes.tsx`, the only file that changes to move to browser routing on a host with rewrites.
- Route, sort and filters are URL state (path and search params). Components do not keep them in React state or a store.
- All data access goes through `site/src/lib/data.ts:loadDataset`. There is no Redux or other global store; a backend replaces `loadDataset` with a query library (RTK Query or TanStack Query) without touching views.

## Consequences

- Every view is linkable and survives reload.
- New views add routes and URL params, not store slices.
- Adopting a store is a new ADR that supersedes this one, justified by state that is neither URL state nor server data.
