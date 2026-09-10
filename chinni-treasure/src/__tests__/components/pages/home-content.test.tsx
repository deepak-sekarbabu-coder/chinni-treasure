import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/src/components/pages/LatestInEveryCategory", () => ({
  default: () => <section aria-label="Latest arrivals" />,
}));

vi.mock("@/src/components/pages/HeroParticles3D", () => ({
  default: () => null,
}));

import HomeContent from "@/src/components/pages/home-content";

describe("HomeContent", () => {
  it("presents a concise, factual first impression for the brand", () => {
    render(<HomeContent />);

    expect(screen.getByText("Chinni Treasure · Little Love")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /made for the moments\s*you keep/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/thoughtfully made pieces for gifting and every day/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Free shipping above ₹599")).toBeInTheDocument();
    expect(screen.getByText("5–7 business days")).toBeInTheDocument();
    expect(screen.queryByText("4.9/5")).not.toBeInTheDocument();
  });
});
