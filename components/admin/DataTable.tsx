"use client";

import { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export default function DataTable<T extends { _id: string }>({
  columns,
  rows,
  loading,
  emptyMessage,
  actions,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
}) {
  if (loading) {
    return <div className="empty-note">Loading...</div>;
  }

  if (rows.length === 0) {
    return <div className="empty-note">{emptyMessage ?? "No items yet."}</div>;
  }

  return (
    <div className="data-table">
      <table className="data-table__table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
            {actions && <th className="data-table__actions-head">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
              {actions && <td className="data-table__actions">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
