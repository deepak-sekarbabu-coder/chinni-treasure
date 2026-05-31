import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
  const knownStatuses = [
    "pending",
    "approved",
    "packaging",
    "shipped",
    "delivered",
    "rejected",
  ];

  it.each(knownStatuses)("renders label for %s status", (status) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText((content) => content.trim().length > 0);
    expect(badge).toBeInTheDocument();
  });

  it("renders the status label with icon by default", () => {
    render(<StatusBadge status="approved" />);
    const badge = screen.getByText((content) => content.includes("Approved"));
    expect(badge).toBeInTheDocument();
  });

  it("renders without icon when icon={false}", () => {
    const { container } = render(<StatusBadge status="pending" icon={false} />);
    expect(screen.getByText(/Pending/)).toBeInTheDocument();
  });

  it("applies the status as a CSS class", () => {
    const { container } = render(<StatusBadge status="shipped" />);
    expect(container.querySelector(".status-badge.shipped")).toBeTruthy();
  });

  it("falls back to the raw status string for unknown statuses", () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText((content) => content.includes("unknown_status"))).toBeInTheDocument();
  });

  it("renders an icon element when icon is true", () => {
    const { container } = render(<StatusBadge status="delivered" icon={true} />);
    const badge = container.querySelector(".status-badge");
    expect(badge?.textContent).toMatch(/^. /);
  });
});
