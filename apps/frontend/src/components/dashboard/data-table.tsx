"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ChevronsUpDown, Search,
  FileText, SlidersHorizontal, X, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
  hideable?: boolean;
  hidden?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  className?: string;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable({
  columns, data, pageSize = 10, searchable = true,
  searchPlaceholder = "Search...", exportable = true, className,
  onRowClick, emptyMessage = "No data found", loading = false,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter((c) => !c.hidden).map((c) => c.key))
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = data.filter((row) =>
        columns.some((col) => {
          if (!visibleColumns.has(col.key)) return false;
          const val = row[col.key];
          return val?.toString().toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey]?.toString() || "";
        const bVal = b[sortKey]?.toString() || "";
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [data, search, sortKey, sortDir, columns, visibleColumns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const visible = columns.filter((c) => visibleColumns.has(c.key));
    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csv = [
      visible.map((c) => escape(c.label)).join(","),
      ...filtered.map((row) =>
        visible.map((c) => escape(String(row[c.key] || ""))).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={cn("glass-card overflow-hidden", className)}>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <div className="p-4 border-b border-glass-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input type="text" placeholder={searchPlaceholder} value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-glass-border bg-glass-bg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-foreground-muted" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          {exportable && (
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass hover:bg-glass-bg transition-colors text-xs font-medium">
              <FileText className="w-3.5 h-3.5" /> CSV
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass hover:bg-glass-bg transition-colors text-xs font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 glass p-2 rounded-xl shadow-glass-lg z-20">
                {columns.filter((c) => c.hideable).map((col) => (
                  <label key={col.key} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-glass-bg transition-colors cursor-pointer text-sm">
                    <input type="checkbox" checked={visibleColumns.has(col.key)}
                      onChange={() => {
                        const next = new Set(visibleColumns);
                        if (next.has(col.key)) next.delete(col.key); else next.add(col.key);
                        setVisibleColumns(next);
                      }}
                      className="rounded border-foreground-muted" />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              {columns.filter((c) => visibleColumns.has(c.key)).map((col) => (
                <th key={col.key}
                  className={cn("px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider",
                    col.sortable && "cursor-pointer hover:text-foreground transition-colors select-none")}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.filter((c) => visibleColumns.has(c.key)).length}
                  className="text-center py-16 text-foreground-muted">
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <motion.tr key={row.id || i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn("border-b border-glass-border last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-glass-bg/50")}
                  onClick={() => onRowClick?.(row)}>
                  {columns.filter((c) => visibleColumns.has(c.key)).map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-glass-border flex items-center justify-between">
          <p className="text-xs text-foreground-muted">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-glass-bg transition-colors disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const p = start + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                    page === p ? "gradient-primary text-white" : "hover:bg-glass-bg text-foreground-secondary")}>
                  {p + 1}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-glass-bg transition-colors disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
