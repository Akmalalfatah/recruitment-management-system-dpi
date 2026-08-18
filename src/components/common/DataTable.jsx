import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

const PAGE_SIZE = 8;

export default function DataTable({ columns, rows, emptyLabel = "Belum ada data." }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const start = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, rows.length);

  return (
    <div>
      <div className="overflow-x-auto border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-panel text-left text-ink-500 text-xs uppercase tracking-wide">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2.5 font-semibold whitespace-nowrap">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-500">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={22} className="text-ink-300" />
                    <span>{emptyLabel}</span>
                  </div>
                </td>
              </tr>
            )}
            {paged.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-surface-panel/60 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 text-ink-700 align-middle whitespace-nowrap">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-ink-500">
        <span>
          Menampilkan {start}-{end} dari {rows.length} data
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-2 py-1 border border-surface-border disabled:opacity-40 hover:bg-surface-panel"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-2.5 py-1 border ${
                page === i + 1 ? "bg-primary text-white border-primary" : "border-surface-border hover:bg-surface-panel"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-2 py-1 border border-surface-border disabled:opacity-40 hover:bg-surface-panel"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
