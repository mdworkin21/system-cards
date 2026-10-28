import type { ViewState } from "../lib/viewState";

interface Props {
  view: ViewState;
  labs: string[];
  rungs: string[];
  onChange: (next: ViewState, opts?: { replace: boolean }) => void;
}

export function MatrixFilters({ view, labs, rungs, onChange }: Props) {
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
          // Uncontrolled: the router commits URL updates in a transition, and a controlled
          // input driven by one drops characters under fast typing. `q` edits replace the
          // history entry, so the URL never changes under the input without a remount.
          defaultValue={view.q}
          placeholder="Filter by name"
          onChange={(e) => onChange({ ...view, q: e.target.value }, { replace: true })}
        />
      </label>
    </form>
  );
}
