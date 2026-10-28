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
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { LAB_COLUMN, matrixColumns } from "../lib/columns";
import { useDataset } from "../lib/data";
import { isStub } from "../lib/facts";
import { groupByLab } from "../lib/rows";
import { parseViewState, toSearchParams, type ViewState } from "../lib/viewState";
import type { CardRecord, Dataset } from "../types.generated";
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
  const setView = (next: ViewState, opts?: { replace: boolean }) => setParams(toSearchParams(next), opts);

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
      <div className="matrix-box">
        <table className="matrix">
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
                <td colSpan={width} className="empty">
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
    </>
  );
}

const SORT_ARIA = { asc: "ascending", desc: "descending" } as const;
const SORT_GLYPH = { asc: "▲", desc: "▼" } as const;

function HeaderCell({ header }: { header: Header<CardRecord, unknown> }) {
  const dir = header.column.getIsSorted();
  return (
    <th scope="col" aria-sort={dir ? SORT_ARIA[dir] : undefined}>
      <button type="button" className="sort-button" onClick={header.column.getToggleSortingHandler()}>
        {flexRender(header.column.columnDef.header, header.getContext())}
        <span className="sort-glyph" aria-hidden="true">
          {dir ? SORT_GLYPH[dir] : ""}
        </span>
      </button>
    </th>
  );
}

function LabGroup({ lab, rows, width, ds }: { lab: string; rows: Row<CardRecord>[]; width: number; ds: Dataset }) {
  return (
    <>
      <tr className="group-row">
        <th colSpan={width} scope="colgroup">
          {lab}
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
  return (
    <tr className={isStub(card, ds.fact_paths) ? "stub" : undefined}>
      {row.getVisibleCells().map((c) => {
        const cell = c.column.columnDef.meta?.cell;
        const content = cell && <MatrixCell card={card} cell={cell} ds={ds} />;
        return cell?.kind === "model" ? (
          <th key={c.id} scope="row">
            {content}
          </th>
        ) : (
          <td key={c.id}>{content}</td>
        );
      })}
    </tr>
  );
}
