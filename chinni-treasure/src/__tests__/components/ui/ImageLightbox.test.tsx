import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, type RenderResult } from "@testing-library/react";

vi.mock("next/image", () => ({
  // Passthrough so error events reach the fallback logic (setup mocks it to null).
  default: (props: Record<string, unknown>) => {
    const { blurDataURL: _blur, ...domProps } = props;
    void _blur;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(domProps as object)} />;
  },
}));

import ImageLightbox from "@/src/components/ui/ImageLightbox";
import { IMAGE_UNAVAILABLE_PLACEHOLDER } from "@/src/lib/images";

const three = ["/a.jpg", "/b.jpg", "/c.jpg"];

function open(overrides: Partial<Parameters<typeof ImageLightbox>[0]> = {}): RenderResult & { onClose: ReturnType<typeof vi.fn> } {
  const onClose = vi.fn();
  const result = render(<ImageLightbox images={three} alt="Silk Scarf" onClose={onClose} {...overrides} />);
  return { ...result, onClose };
}

function counterText(): string {
  return screen.getByText(/^\d+ \/ \d+$/).textContent ?? "";
}

describe("ImageLightbox — navigation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens on the requested index and shows the counter", () => {
    open({ initialIndex: 1 });
    expect(counterText()).toBe("2 / 3");
  });

  it("wraps forward past the last image and backward past the first", () => {
    open({ initialIndex: 2 });
    fireEvent.click(screen.getByRole("button", { name: /next image for/i }));
    expect(counterText()).toBe("1 / 3");
    fireEvent.click(screen.getByRole("button", { name: /previous image for/i }));
    expect(counterText()).toBe("3 / 3");
  });

  it("clamps an out-of-range initial index into the list", () => {
    open({ initialIndex: 99 });
    expect(counterText()).toBe("3 / 3");
  });
});

describe("ImageLightbox — keyboard contract (while open)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("moves with arrow keys and closes on Escape", () => {
    const { onClose } = open();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(counterText()).toBe("2 / 3");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps with arrow keys from both ends", () => {
    open({ initialIndex: 2 });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(counterText()).toBe("1 / 3");
  });

  it("never steals arrows while an editable element holds focus, but Escape still closes", () => {
    const { onClose } = open();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(counterText()).toBe("1 / 3"); // caret movement, not navigation
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it("closes from the empty state via Escape", () => {
    const { onClose } = open({ images: [] });
    expect(screen.getByText(/no image available/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ImageLightbox — zoom (opt-in core behavior)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hides zoom controls unless opted in", () => {
    const view = open();
    expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
    view.unmount();
    open({ zoom: true });
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
  });

  it("clamps at the zoom maximum and offers reset only once zoomed", () => {
    open({ zoom: true, initialIndex: 0 });
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    expect(screen.queryByText("Reset")).not.toBeInTheDocument();
    for (let i = 0; i < 12; i++) fireEvent.click(zoomIn); // 100% → clamp at 300%
    expect(screen.getByText("300%")).toBeInTheDocument();
    expect(zoomIn).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.queryByText("Reset")).not.toBeInTheDocument();
  });

  it("resets zoom when navigating between images", () => {
    open({ zoom: true });
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next image for/i }));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});

describe("ImageLightbox — failure swap belongs to the viewer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("swaps a broken current image to the shared placeholder via FallbackImage", () => {
    open();
    const img = screen.getByAltText(/image 1 of 3/i);
    fireEvent.error(img);
    expect(screen.getByAltText(/image 1 of 3/i)).toHaveAttribute("src", IMAGE_UNAVAILABLE_PLACEHOLDER);
    // And the viewer still navigates after a failure.
    fireEvent.click(screen.getByRole("button", { name: /next image for/i }));
    expect(counterText()).toBe("2 / 3");
  });
});
