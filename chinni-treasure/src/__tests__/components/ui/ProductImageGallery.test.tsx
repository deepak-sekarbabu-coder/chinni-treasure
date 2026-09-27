import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("next/image", () => ({
  // Passthrough so error events reach the fallback logic (setup mocks it to null).
  default: (props: Record<string, unknown>) => {
    const { blurDataURL: _blur, ...domProps } = props;
    void _blur;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(domProps as object)} />;
  },
}));

import ProductImageGallery from "@/src/components/ui/ProductImageGallery";
import { IMAGE_UNAVAILABLE_PLACEHOLDER } from "@/src/lib/images";
import type { ProductImage } from "@/src/lib/api/schemas";

const gallery: ProductImage[] = [
  { id: "i1", url: "/a.jpg", isPrimary: true, displayOrder: 0 },
  { id: "i2", url: "/b.jpg", isPrimary: false, displayOrder: 1 },
  { id: "i3", url: "/c.jpg", isPrimary: false, displayOrder: 2 },
];

/**
 * The round-4 rule this suite pins: no surface keeps its own per-image
 * failure-swap state. The composition renders FallbackImage everywhere and
 * holds no `failedImages` set — the core owns failure handling for viewing.
 */
describe("ProductImageGallery — the composition keeps no private failure state", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders stage and thumbnails through FallbackImage, with no local swap map", () => {
    const { container } = render(<ProductImageGallery images={gallery} productName="Silk Scarf" />);
    // Stage + 3 thumbnails, all delegated to FallbackImage (mocked to img).
    expect(screen.getAllByAltText(/Silk Scarf/).length).toBeGreaterThanOrEqual(4);
    expect(container.querySelector(".failedImages")).toBeNull();
    expect(screen.queryByText("Image unavailable")).not.toBeInTheDocument();
  });

  it("delegates a broken thumbnail's swap to FallbackImage and keeps its own index clean", () => {
    render(<ProductImageGallery images={gallery} productName="Silk Scarf" />);
    fireEvent.error(screen.getByAltText("Silk Scarf thumbnail 2"));
    // Re-query: FallbackImage unmounts the failed node and mounts the placeholder.
    expect(screen.getByAltText("Silk Scarf thumbnail 2")).toHaveAttribute("src", IMAGE_UNAVAILABLE_PLACEHOLDER);
    // Selection is untouched: failure is a render concern, not navigation.
    expect(screen.getByAltText("Silk Scarf - Image 1")).toBeInTheDocument();
  });

  it("keeps the page-local arrow exception working while the lightbox is closed", () => {
    render(<ProductImageGallery images={gallery} productName="Silk Scarf" />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByAltText("Silk Scarf - Image 2")).toBeInTheDocument();
  });

  it("opens the core on stage click and hands over navigation", () => {
    render(<ProductImageGallery images={gallery} productName="Silk Scarf" />);
    fireEvent.click(screen.getByRole("button", { name: /view silk scarf - image 1 full size/i }));
    // The core is up — query its counter inside the viewer dialog (the stage
    // renders its own "1 / 3" beside it).
    const viewer = within(screen.getByRole("dialog", { name: /silk scarf viewer/i }));
    expect(viewer.getByText("1 / 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next image for/i }));
    expect(viewer.getByText("2 / 3")).toBeInTheDocument();
  });

  it("keeps the stage in sync with lightbox navigation via onIndexChange", () => {
    render(<ProductImageGallery images={gallery} productName="Silk Scarf" />);
    fireEvent.click(screen.getByRole("button", { name: /view silk scarf - image 1 full size/i }));
    fireEvent.click(screen.getByRole("button", { name: /next image for/i }));
    fireEvent.click(screen.getByRole("button", { name: /close silk scarf viewer/i }));
    // Back on the page: the stage shows the image the customer browsed to.
    expect(screen.getByAltText("Silk Scarf - Image 2")).toBeInTheDocument();
  });

  it("opens the core on the selected thumbnail's index", () => {
    render(<ProductImageGallery images={gallery} productName="Silk Scarf" />);
    fireEvent.click(screen.getByRole("tab", { name: /view image 3/i }));
    fireEvent.click(screen.getByRole("button", { name: /view silk scarf - image 3 full size/i }));
    expect(within(screen.getByRole("dialog", { name: /silk scarf viewer/i })).getByText("3 / 3")).toBeInTheDocument();
  });

  it("renders the empty state when the gallery has no images", () => {
    render(<ProductImageGallery images={[]} productName="Silk Scarf" />);
    expect(screen.getByText("No Image Available")).toBeInTheDocument();
  });
});
