import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type Header,
  type Row,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams, type NavigateOptions } from "react-router";
import { LAB_COLUMN, matrixColumns, type CellKind } from "@/lib/columns";
import { useDataset } from "@/lib/data";
import { isStub } from "@/lib/facts";
import { groupByLab } from "@/lib/rows";
import { cn } from "@/lib/utils";
import { parseViewState, toSearchParams, type ViewState } from "@/lib/viewState";
import type { CardRecord, Dataset } from "@/types.generated";
import { MatrixCell } from "./MatrixCell";
import { MatrixFilters } from "./MatrixFilters";

function filtersOf(view: ViewState): ColumnFiltersState {
  const filters: ColumnFiltersState = [];
  if (view.lab) filters.push({ id: LAB_COLUMN, value: view.lab });
  if (view.rung) filters.push({ id: "tier", value: view.rung });
  if (view.q) filters.push({ id: "model", value: view.q });
  return filters;
}

export function Matrix() {
  const ds = useDataset();
  const [params, setParams] = useSearchParams();
  const view = parseViewState(params);
  const setView = (next: ViewState, opts?: NavigateOptions) => setParams(toSearchParams(next), opts);

  const columns = useMemo(() => matrixColumns(ds), [ds]);
  const labs = useMemo(() => [...new Set(ds.cards.map((c) => c.lab))], [ds]);
  const sorting: SortingState = view.sort ? [view.sort] : [];
  const table = useReactTable({
    data: ds.cards,
    columns,
    state: { sorting, columnFilters: filtersOf(view), columnVisibility: { [LAB_COLUMN]: false } },
    enableMultiSort: false,
    // The row models otherwise queue a page-index reset as an urgent update, which
    // keeps interrupting the router's transition so a second navigation never renders.
    autoResetAll: false,
    onSortingChange: (u: Updater<SortingState>) => {
      const next = typeof u === "function" ? u(sorting) : u;
      setView({ ...view, sort: next[0] ?? null });
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const rows = table.getRowModel().rows;
  const width = table.getVisibleLeafColumns().length;

  return (
    <>
      <MatrixFilters view={view} labs={labs} rungs={Object.keys(ds.rungs)} onChange={setView} />
      <div className="overflow-hidden rounded-lg border border-input bg-card text-card-foreground shadow-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <HeaderCell key={h.id} header={h} />
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={width} className="px-3 py-8 text-center text-muted-foreground">
                    No cards match these filters.
                  </td>
                </tr>
              )}
              {view.sort
                ? rows.map((row) => <MatrixRow key={row.id} row={row} ds={ds} />)
                : groupByLab(rows, (r) => r.original.lab).map((g) => (
                    <LabGroup key={g.lab} lab={g.lab} rows={g.items} width={width} ds={ds} />
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const SORT_ARIA = { asc: "ascending", desc: "descending" } as const;
const SORT_ICON = { asc: ArrowUp, desc: ArrowDown } as const;

// The model column stays in view while the table scrolls sideways, from sm up;
// on a phone a pinned column would leave almost no room for the rest.
const STICKY = "sm:sticky sm:left-0 sm:z-10 sm:border-r";

/** Per-kind cell classes; the model column's min width fits the longest name in data.json. */
const CELL_CLASS: Partial<Record<CellKind["kind"], string>> = {
  model: `text-left font-normal ${STICKY}`,
};

function HeaderCell({ header }: { header: Header<CardRecord, unknown> }) {
  const dir = header.column.getIsSorted();
  const Icon = dir ? SORT_ICON[dir] : null;
  const isModel = header.column.columnDef.meta?.cell?.kind === "model";
  return (
    <th
      scope="col"
      aria-sort={dir ? SORT_ARIA[dir] : undefined}
      className={cn(
        "h-9 border-b bg-muted px-2 py-1 text-left align-middle text-xs font-medium text-muted-foreground",
        isModel && STICKY,
      )}
    >
      <button
        type="button"
        className={cn(
          "-mx-1.5 inline-flex items-center gap-1 rounded-md text-left px-1.5 py-1 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
          dir && "text-foreground",
        )}
        onClick={header.column.getToggleSortingHandler()}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : <span className="size-3.5" aria-hidden="true" />}
      </button>
    </th>
  );
}

function LabGroup({ lab, rows, width, ds }: { lab: string; rows: Row<CardRecord>[]; width: number; ds: Dataset }) {
  return (
    <>
      <tr className="group-row">
        <th colSpan={width} scope="colgroup" className="border-b bg-group px-3 py-1.5 text-left shadow-[inset_3px_0_0_var(--link)]">
          <span className="inline-flex items-baseline gap-2 sm:sticky sm:left-3">
            <span className="font-semibold text-link">{lab}</span>
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              {rows.length} {rows.length === 1 ? "card" : "cards"}
            </span>
          </span>
        </th>
      </tr>
      {rows.map((row) => (
        <MatrixRow key={row.id} row={row} ds={ds} />
      ))}
    </>
  );
}

function MatrixRow({ row, ds }: { row: Row<CardRecord>; ds: Dataset }) {
  const card = row.original;
  const stub = isStub(card, ds.fact_paths);
  return (
    <tr className="group/row">
      {row.getVisibleCells().map((c) => {
        const cell = c.column.columnDef.meta?.cell;
        const content = cell && <MatrixCell card={card} cell={cell} ds={ds} />;
        const className = cn(
          "border-b bg-card px-2 py-2 align-middle whitespace-nowrap group-last/row:border-b-0 group-hover/row:bg-muted",
          stub && "text-muted-foreground *:opacity-60",
          cell && CELL_CLASS[cell.kind],
        );
        return cell?.kind === "model" ? (
          <th key={c.id} scope="row" className={className}>
            {content}
          </th>
        ) : (
          <td key={c.id} className={className}>
            {content}
          </td>
        );
      })}
    </tr>
  );
}
