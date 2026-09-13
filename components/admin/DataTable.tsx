"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  exportValue?: (row: T) => string | number | null | undefined;
  hideable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
};

type RowId = string;

function defaultId<T>(row: T): RowId {
  const r = row as Record<string, unknown>;
  const id = r._id ?? r.id;
  return String(id ?? Math.random());
}

function plainText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function rowValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function toCsvCell(value: unknown): string {
  const s = plainText(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export default function DataTable<T extends object>({
  columns, rows, loading, emptyMessage, actions, searchPlaceholder,
  searchKeys, searchFn, searchValue, onSearchChange, filters,
  selectable = false, onSelectionChange, columnToggle = true,
  exportable = false, exportFilename = "export.csv", pageSize = 10,
  showPagination = true, bulkActions, rowId, toolbarActions, countLabel,
}: {
  columns: DataTableColumn<T>[]; rows: T[]; loading?: boolean;
  emptyMessage?: string; actions?: (row: T) => ReactNode;
  searchPlaceholder?: string; searchKeys?: string[];
  searchFn?: (row: T, query: string) => boolean;
  searchValue?: string; onSearchChange?: (value: string) => void;
  filters?: ReactNode; selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void; columnToggle?: boolean;
  exportable?: boolean | string; exportFilename?: string; pageSize?: number;
  showPagination?: boolean; bulkActions?: (selected: T[]) => ReactNode;
  rowId?: (row: T) => string; toolbarActions?: ReactNode; countLabel?: string;
}) {
  const getId = rowId ?? defaultId;
  const [internalQuery, setInternalQuery] = useState("");
  const query = searchValue ?? internalQuery;
  const setQuery = onSearchChange ?? setInternalQuery;
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [hidden, setHidden] = useState<string[]>([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<RowId>>(new Set());
  useEffect(() => { setPage(1); }, [query, rows.length]);
  useEffect(() => { setSelected(new Set()); }, [rows.length]);
  const visibleColumns = useMemo(
    () => columns.filter((c) => !hidden.includes(c.key)),
    [columns, hidden]
  );
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    if (searchFn) return rows.filter((r) => searchFn(r, q));
    const keys = searchKeys ?? columns.map((c) => c.key);
    return rows.filter((row) =>
      keys.some((k) => {
        const col = columns.find((c) => c.key === k);
        const raw = col?.sortValue ? col.sortValue(row) : rowValue(row, k);
        if (raw != null) return String(raw).toLowerCase().includes(q);
        return false;
      }) ||
      Object.values(row ?? {}).some(
        (v) => typeof v === "string" && v.toLowerCase().includes(q)
      )
    );
  }, [rows, query, searchKeys, searchFn, columns]);
  const sorted = useMemo(() => {
    if (!sortKey) return searched;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return searched;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...searched].sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : rowValue(a, col.key);
      const bv = col.sortValue ? col.sortValue(b) : rowValue(b, col.key);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [searched, sortKey, sortDir, columns]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = showPagination
    ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sorted;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedRows = useMemo(
    () => sorted.filter((r) => selected.has(getId(r))),
    [sorted, selected]
  );
  useEffect(() => {
    onSelectionChange?.(selectedRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRows]);
  function toggleSort(key: string) {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
    else if (sortDir === "asc") { setSortDir("desc"); }
    else { setSortKey(null); setSortDir("asc"); }
  }
  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      const ids = pageRows.map(getId);
      const allChecked = ids.length > 0 && ids.every((id) => next.has(id));
      if (allChecked) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }
  function toggleOne(id: RowId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function handleExport() {
    const cols = visibleColumns;
    const header = cols.map((c) => toCsvCell(c.header)).join(",");
    const lines = sorted.map((row) =>
      cols.map((c) => {
        const v = c.exportValue ? c.exportValue(row)
          : c.sortValue ? c.sortValue(row) : rowValue(row, c.key);
        return toCsvCell(v);
      }).join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = typeof exportable === "string" ? exportable : exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  }
  const showToolbar = Boolean(searchPlaceholder || filters || toolbarActions || exportable || columnToggle);
  const hideableColumns = columns.filter((c) => c.hideable !== false);
  const showColumnMenu = columnToggle && hideableColumns.length > 1;
  if (loading) {
    return (
      <div className="admin-table-card">
        <div className="admin-table-loading">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="admin-table-skeleton" />
          ))}
        </div>
      </div>
    );
  }
  const from = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(sorted.length, safePage * pageSize);
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(getId(r)));
  return (
    <div className="admin-table-card">
      {showToolbar && (
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar__left">
            {searchPlaceholder && (
              <label className="admin-search admin-table-search">
                <span className="admin-search__icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                </span>
                <input placeholder={searchPlaceholder} value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
              </label>
            )}
            {filters && <div className="admin-table-filters">{filters}</div>}
          </div>
          <div className="admin-table-toolbar__right">
            {toolbarActions}
            {showColumnMenu && (
              <div className="admin-table-menu-wrap">
                <button type="button" className="admin-table-tool-btn"
                  onClick={() => setColumnsOpen((v) => !v)} aria-expanded={columnsOpen}>
                  Columns <span aria-hidden="true">▾</span>
                </button>
                {columnsOpen && (
                  <div className="admin-table-menu" role="menu">
                    {hideableColumns.map((c) => (
                      <label key={c.key} className="admin-table-menu__item">
                        <input type="checkbox" checked={!hidden.includes(c.key)}
                          onChange={() => setHidden((prev) =>
                            prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...prev, c.key]
                          )} />
                        {c.header}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            {exportable && (
              <button type="button" className="admin-table-tool-btn" onClick={handleExport}>
                Export
              </button>
            )}
          </div>
        </div>
      )}
      {selected.size > 0 && (
        <div className="admin-table-bulkbar">
          <strong>{selected.size} selected</strong>
          <button type="button" className="admin-table-link" onClick={() => setSelected(new Set())}>
            Clear
          </button>
          {bulkActions?.(selectedRows)}
        </div>
      )}
      <div className="data-table admin-table-scroll">
        <table className="data-table__table admin-table">
          <thead>
            <tr>
              {selectable && (
                <th className="admin-table__check">
                  <input type="checkbox" aria-label="Select all on page"
                    checked={allOnPage} onChange={toggleAllOnPage} />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th key={col.key}
                  className={`${col.className ?? ""} ${col.sortable ? "admin-table__sortable" : ""} ${col.align === "right" ? "admin-table__right" : col.align === "center" ? "admin-table__center" : ""}`.trim()}
                  aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                  {col.sortable ? (
                    <button type="button" className="admin-table__sort-btn" onClick={() => toggleSort(col.key)}>
                      {col.header}
                      <span className="admin-table__sort-icon" aria-hidden="true">
                        {sortKey !== col.key ? "⇅" : sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    </button>
                  ) : (col.header)}
                </th>
              ))}
              {actions && <th className="data-table__actions-head admin-table__actions-head">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const id = getId(row);
              const checked = selected.has(id);
              return (
                <tr key={id} className={checked ? "admin-table__row--selected" : ""}>
                  {selectable && (
                    <td className="admin-table__check">
                      <input type="checkbox" aria-label="Select row"
                        checked={checked} onChange={() => toggleOne(id)} />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={col.key}
                      className={`${col.className ?? ""} ${col.align === "right" ? "admin-table__right" : col.align === "center" ? "admin-table__center" : ""}`.trim()}>
                      {col.render ? col.render(row) : (plainText(rowValue(row, col.key)) || "—")}
                    </td>
                  ))}
                  {actions && <td className="data-table__actions admin-table__actions">{actions(row)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        {pageRows.length === 0 && (
          <div className="empty-note admin-table-empty">{emptyMessage ?? "No items yet."}</div>
        )}
      </div>
      {showPagination && (
        <div className="admin-table-footer">
          <span className="admin-table-count">
            {countLabel ?? (sorted.length === 0 ? "0 results" : `Showing ${from}–${to} of ${sorted.length}`)}
          </span>
          {totalPages > 1 && (
            <div className="admin-table-pages">
              <button type="button" className="admin-table-page-btn" disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const n = i + 1;
                return (
                  <button key={n} type="button"
                    className={`admin-table-page-btn${n === safePage ? " admin-table-page-btn--active" : ""}`}
                    onClick={() => setPage(n)}>{n}</button>
                );
              })}
              <button type="button" className="admin-table-page-btn" disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next ›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
