"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  type Table,
} from "@tanstack/react-table";

/**
 * The shared admin list composition: the server-driven `useReactTable` wiring,
 * the pagination bar and the mobile-card frame. Panels supply their columns,
 * their filters and their card bodies; the table behaviour lives here so
 * paging and sorting can't drift between panels.
 */

interface UseAdminListTableOptions<T> {
  data: T[];
  columns: ColumnDef<T>[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  /** Omit for a table the server doesn't page. */
  pagination?: { pageIndex: number; pageSize: number };
  /** Omit for a client-sorted table. */
  pageCount?: number;
}

/** The manual (server-driven) table every paged admin panel renders. */
export function useAdminListTable<T>({
  data,
  columns,
  sorting,
  onSortingChange,
  pagination,
  pageCount,
}: UseAdminListTableOptions<T>): Table<T> {
  return useReactTable({
    data,
    columns,
    state: { sorting, ...(pagination ? { pagination } : {}) },
    onSortingChange,
    manualSorting: true,
    manualPagination: true,
    sortDescFirst: false,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
  });
}

export function AdminPaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-bar">
      <button
        className="btn btn-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <CaretLeft size={14} weight="bold" aria-hidden="true" />
        Prev
      </button>
      <span className="pagination-text">
        Page {page} of {totalPages}
      </span>
      <button
        className="btn btn-secondary btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <CaretRight size={14} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * The mobile list: one frame for the skeleton, the empty state and the items.
 * `renderSkeleton` draws the panel's own card shape — the frame, the
 * animation stagger and the empty copy are shared.
 */
export function AdminCardList({
  as: Tag = "div",
  className,
  loading,
  isEmpty,
  empty,
  skeletonCount,
  renderSkeleton,
  children,
}: {
  /** `ul` where the items are a real list; the panels keep their own markup. */
  as?: "div" | "ul";
  className: string;
  loading: boolean;
  isEmpty: boolean;
  empty: ReactNode;
  skeletonCount: number;
  renderSkeleton: (index: number) => ReactNode;
  children: ReactNode;
}) {
  return (
    <Tag className={className}>
      {loading ? (
        Array.from({ length: skeletonCount }, (_, index) => (
          <Fragment key={index}>{renderSkeleton(index)}</Fragment>
        ))
      ) : isEmpty ? (
        empty
      ) : (
        children
      )}
    </Tag>
  );
}
