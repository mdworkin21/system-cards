import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";
import type { ViewState } from "@/lib/viewState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Radix Select has no empty value; no lab slug (ID_PATTERN) can be "*", nor is any rung in tiers.yaml.
const ALL = "*";

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
  const navType = useNavigationType();
  // No deps: React may batch a typed edit and a later navigation into one render.
  useEffect(() => {
    // An untagged navigation (a link, a select) or back/forward, whose entry may hold an old tag, ends the pending edit.
    if (own === undefined || own === sent.current || navType === "POP") sent.current = null;
    if (sent.current === null && input.current) input.current.value = view.q;
  });
  return (
    <form className="mb-4 flex flex-wrap items-end gap-3" role="search" onSubmit={(e) => e.preventDefault()}>
      <FilterSelect
        id="filter-lab"
        label="Lab"
        all="All labs"
        options={labs}
        value={view.lab}
        onChange={(lab) => onChange({ ...view, lab })}
      />
      <FilterSelect
        id="filter-rung"
        label="Rung"
        all="All rungs"
        options={rungs}
        value={view.rung}
        onChange={(rung) => onChange({ ...view, rung })}
      />
      <div className="grid w-full gap-1.5 sm:w-64">
        <Label htmlFor="filter-model">Model</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="filter-model"
            className="pl-8"
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
        </div>
      </div>
      {(view.sort || view.lab || view.rung || view.q) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground"
          onClick={() => onChange({ sort: null, lab: null, rung: null, q: "" })}
        >
          <X aria-hidden="true" />
          Clear
        </Button>
      )}
    </form>
  );
}

interface FilterSelectProps {
  id: string;
  label: string;
  all: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}

function FilterSelect({ id, label, all, options, value, onChange }: FilterSelectProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? null : v)}>
        <SelectTrigger id={id} className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{all}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
