import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionHeader from "../SectionHeader";

describe("SectionHeader", () => {
  it("renders subtitle and title", () => {
    render(<SectionHeader subtitle="Our Collection" title="Featured Products" />);
    expect(screen.getByText("Our Collection")).toBeInTheDocument();
    expect(screen.getByText("Featured Products")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <SectionHeader
        subtitle="About"
        title="Our Story"
        description="Handcrafted with love since 2020"
      />,
    );
    expect(screen.getByText("Handcrafted with love since 2020")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<SectionHeader subtitle="Test" title="Test" />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("applies custom style prop", () => {
    const { container } = render(
      <SectionHeader subtitle="Test" title="Test" style={{ marginTop: "20px" }} />,
    );
    const div = container.querySelector(".section-header");
    expect(div?.getAttribute("style")).toContain("margin-top: 20px");
  });
});
