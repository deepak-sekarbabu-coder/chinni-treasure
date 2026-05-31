import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders the loading spinner element", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector(".loading-spinner")).toBeTruthy();
  });

  it("renders centered with fullPage mode", () => {
    const { container } = render(<LoadingSpinner fullPage />);
    const outerDiv = container.querySelector("[style]");
    expect(outerDiv?.getAttribute("style")).toContain("min-height: 100vh");
  });

  it("renders with padding in non-fullPage mode", () => {
    const { container } = render(<LoadingSpinner />);
    const outerDiv = container.querySelector("[style]");
    expect(outerDiv?.getAttribute("style")).toContain("padding: 60px 0");
  });

  it("has margin auto on the spinner", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".loading-spinner");
    expect(spinner?.getAttribute("style")).toContain("margin: 0px auto");
  });
});
