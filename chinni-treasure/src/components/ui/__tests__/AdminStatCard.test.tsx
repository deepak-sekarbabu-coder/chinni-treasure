import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminStatCard from "../AdminStatCard";

describe("AdminStatCard", () => {
  it("renders value and label", () => {
    render(<AdminStatCard value="342" label="Total Orders" color="#c9a96e" />);
    expect(screen.getByText("342")).toBeInTheDocument();
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
  });

  it("renders with a numeric value", () => {
    render(<AdminStatCard value={150} label="Products" color="#4caf50" />);
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("applies the given color to the value element", () => {
    const { container } = render(
      <AdminStatCard value="10" label="Revenue" color="#ff6b6b" />,
    );
    const statValue = container.querySelector(".stat-value");
    expect(statValue?.getAttribute("style")).toContain("color: rgb(255, 107, 107)");
  });
});
