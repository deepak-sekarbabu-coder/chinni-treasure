import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import AdminDataTable from "@/src/components/admin/table/AdminDataTable";

interface Row {
  id: number;
  name: string;
  qty: number;
}

const data: Row[] = [
  { id: 1, name: "Alpha", qty: 3 },
  { id: 2, name: "Beta", qty: 7 },
];

const baseColumns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name", meta: { label: "Name" } },
  { accessorKey: "qty", header: "Qty", enableSorting: false },
];

function StaticHarness(props: { emptyMessage?: string; data?: Row[] }) {
  const table = useReactTable({
    data: props.data ?? data,
    columns: baseColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  return <AdminDataTable table={table} emptyMessage={props.emptyMessage ?? "Nothing here."} />;
}

describe("AdminDataTable", () => {
  it("renders headers and one row per data item", () => {
    render(<StaticHarness />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /qty/i })).toBeInTheDocument();
  });

  it("renders sortable header as button and toggles aria-sort on click", () => {
    function SortedHarness() {
      const table = useReactTable({
        data,
        columns: baseColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSortingRemoval: false,
      });
      return <AdminDataTable table={table} emptyMessage="Nothing here." />;
    }
    render(<SortedHarness />);
    const nameHeader = screen.getByRole("columnheader", { name: /name/i });
    expect(nameHeader).not.toHaveAttribute("aria-sort");

    fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    // Non-sortable column stays a plain th with no sort button.
    expect(screen.queryByRole("button", { name: /sort by qty/i })).not.toBeInTheDocument();
  });

  it("renders skeleton rows while loading", () => {
    function LoadingHarness() {
      const table = useReactTable({
        data,
        columns: baseColumns,
        getCoreRowModel: getCoreRowModel(),
      });
      return (
        <AdminDataTable
          table={table}
          isLoading
          skeletonRowCount={4}
          emptyMessage="Nothing here."
        />
      );
    }
    const { container } = render(<LoadingHarness />);
    expect(container.querySelectorAll(".skeleton-text")).toHaveLength(8);
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("renders empty-state row spanning all columns when no rows", () => {
    const { container } = render(<StaticHarness data={[]} emptyMessage="No matches." />);
    const emptyCell = screen.getByText("No matches.");
    expect(emptyCell).toHaveClass("empty-state");
    expect(emptyCell).toHaveAttribute("colspan", "2");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
  });

  it("applies getRowProps to body rows", () => {
    function PropsHarness() {
      const table = useReactTable({
        data,
        columns: baseColumns,
        getCoreRowModel: getCoreRowModel(),
      });
      return (
        <AdminDataTable
          table={table}
          emptyMessage="Nothing here."
          getRowProps={(row) => ({ "data-testid": `row-${row.original.id}` })}
        />
      );
    }
    render(<PropsHarness />);
    expect(screen.getByTestId("row-1")).toBeInTheDocument();
    expect(screen.getByTestId("row-2")).toBeInTheDocument();
  });
});
