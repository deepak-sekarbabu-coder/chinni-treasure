import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminStatsGrid from "@/src/components/admin/AdminStatsGrid";
import { ORDER_STATUS_ALL } from "@/src/lib/constants";
import type { Stats } from "@/src/lib/api/schemas";

const stats: Stats = {
  totalOrders: 10,
  pendingOrders: 4,
  approvedOrders: 2,
  packagingOrders: 1,
  shippedOrders: 1,
  deliveredOrders: 1,
  rejectedOrders: 1,
  totalRevenue: 1234.5,
};

describe("AdminStatsGrid", () => {
  // The bug this pins: the grid hand-picked six tiles, so `packaging` and
  // `rejected` were computed by the stats module and never rendered.
  it("renders a tile for every status in the fulfilment vocabulary", () => {
    render(<AdminStatsGrid stats={stats} />);

    for (const status of ORDER_STATUS_ALL) {
      expect(screen.getByText(status[0].toUpperCase() + status.slice(1))).toBeInTheDocument();
    }
  });

  it("renders nothing without stats", () => {
    const { container } = render(<AdminStatsGrid stats={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});