import { flexRender, getCoreRowModel, useReactTable, type Row } from "@tanstack/react-table";
import { useMemo } from "react";
import { matrixColumns } from "../lib/columns";
import { useDataset } from "../lib/data";
import { isStub } from "../lib/facts";
import { groupByLab } from "../lib/rows";
import type { CardRecord, Dataset } from "../types.generated";
import { MatrixCell } from "./MatrixCell";

export function Matrix() {
  const ds = useDataset();
  const columns = useMemo(() => matrixColumns(ds), [ds]);
  const table = useReactTable({ data: ds.cards, columns, getCoreRowModel: getCoreRowModel() });
  const rows = table.getRowModel().rows;
  const width = table.getVisibleLeafColumns().length;

  return (
    <div className="matrix-box">
      <table className="matrix">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} scope="col">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {groupByLab(rows, (r) => r.original.lab).map((g) => (
            <LabGroup key={g.lab} lab={g.lab} rows={g.items} width={width} ds={ds} />
          ))}
        </tbody>
      </table>
    </div>
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
