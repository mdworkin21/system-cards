import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import type { ViewState } from "../lib/viewState";

/** Navigation state that marks a URL change as this input's own edit. */
interface QEdit {
  qEdit: number;
}

interface Props {
  view: ViewState;
  labs: string[];
  rungs: string[];
  onChange: (next: ViewState, opts?: { replace: boolean; state?: QEdit }) => void;
}

export function MatrixFilters({ view, labs, rungs, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  // The number of this input's latest edit, until the URL catches up with it.
  const sent = useRef<number | null>(null);
  const edits = useRef(0);
  const own = (useLocation().state as QEdit | null)?.qEdit;
  // No deps: React may batch a typed edit and a later navigation into one render.
  useEffect(() => {
    // Any navigation not tagged as this input's edit (a link, back/forward, a select) ends the pending edit.
    if (own === undefined || own === sent.current) sent.current = null;
    if (sent.current === null && input.current) input.current.value = view.q;
  });
  return (
    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <label>
        Lab
        <select value={view.lab ?? ""} onChange={(e) => onChange({ ...view, lab: e.target.value || null })}>
          <option value="">All labs</option>
          {labs.map((lab) => (
            <option key={lab} value={lab}>
              {lab}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rung
        <select value={view.rung ?? ""} onChange={(e) => onChange({ ...view, rung: e.target.value || null })}>
          <option value="">All rungs</option>
          {rungs.map((rung) => (
            <option key={rung} value={rung}>
              {rung}
            </option>
          ))}
        </select>
      </label>
      <label>
        Model
        <input
          type="search"
          // Uncontrolled: a controlled input driven through the router's transition drops
          // keystrokes; the effect above resyncs it after any other navigation.
          ref={input}
          defaultValue={view.q}
          placeholder="Filter by name"
          onChange={(e) => {
            sent.current = ++edits.current;
            onChange({ ...view, q: e.target.value }, { replace: true, state: { qEdit: sent.current } });
          }}
        />
      </label>
    </form>
  );
}
