export interface ViewState {
  sort: { id: string; desc: boolean } | null;
  lab: string | null;
  rung: string | null;
  q: string;
}

/** The matrix's sort and filters from the URL; unknown params are ignored. */
export function parseViewState(p: URLSearchParams): ViewState {
  const sortId = p.get("sort");
  return {
    sort: sortId ? { id: sortId, desc: p.get("dir") === "desc" } : null,
    lab: p.get("lab") || null,
    rung: p.get("rung") || null,
    q: p.get("q") ?? "",
  };
}

export function toSearchParams(s: ViewState): URLSearchParams {
  const p = new URLSearchParams();
  if (s.sort) {
    p.set("sort", s.sort.id);
    if (s.sort.desc) p.set("dir", "desc");
  }
  if (s.lab) p.set("lab", s.lab);
  if (s.rung) p.set("rung", s.rung);
  if (s.q) p.set("q", s.q);
  return p;
}
