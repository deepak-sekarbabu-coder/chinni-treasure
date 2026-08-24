"use client";

import {
  flexRender,
  type Row,
  type RowData,
  type Table,
} from "@tanstack/react-table";
import type { HTMLAttributes } from "react";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Accessible label used for "Sort by {label}" button names. */
    label?: string;
  }
}

interface Props<T> {
  table: Table<T>;
  isLoading?: boolean;
  skeletonRowCount?: number;
  emptyMessage: string;
  getRowProps?: (row: Row<T>) => HTMLAttributes<HTMLTableRowElement>;
}

export default function AdminDataTable<T>({
  table,
  isLoading = false,
  skeletonRowCount = 5,
  emptyMessage,
  getRowProps,
}: Props<T>) {
  const visibleColumns = table.getVisibleFlatColumns();

  return (
    <div className="admin-product-table-wrap">
      <table className="admin-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const label =
                  (column.columnDef.meta?.label as string | undefined) ?? String(column.id);
                const ariaSort =
                  sorted === "asc"
                    ? "ascending"
                    : sorted === "desc"
                      ? "descending"
                      : undefined;
                return (
                  <th key={header.id} data-sort={sorted || undefined} aria-sort={ariaSort}>
                    {column.getCanSort() ? (
                      <button
                        type="button"
                        className="th-sort-btn"
                        onClick={column.getToggleSortingHandler()}
                        aria-label={`Sort by ${label}`}
                      >
                        {flexRender(column.columnDef.header, header.getContext())}
                      </button>
                    ) : (
                      flexRender(column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRowCount }, (_, idx) => (
              <tr
                key={`skeleton-${idx}`}
                className="product-table-skeleton"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                {visibleColumns.map((column) => (
                  <td key={column.id}>
                    <div className="skeleton-text" />
                  </td>
                ))}
              </tr>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length} className="empty-state">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} {...getRowProps?.(row)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
