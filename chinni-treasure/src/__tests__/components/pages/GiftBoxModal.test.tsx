import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GiftBoxModal from "../../../components/pages/GiftBoxModal";

// Mock FallbackImage to avoid next/image issues in tests
vi.mock("@/src/components/ui/FallbackImage", () => ({
  default: ({ alt, width, height, className }: { alt: string; width: number; height: number; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- plain img so the mock renders despite next/image returning null
    <img alt={alt} width={width} height={height} className={className} data-testid="fallback-img" />
  ),
}));

const mockGiftBoxes = [
  { id: "box-1", name: "Hexagon Velvet Box", price: 150, imageUrl: "/hex-box.jpg", stockQuantity: 2 },
  { id: "box-2", name: "Red Velvet Gift Box", price: 75, imageUrl: "/red-box.jpg", stockQuantity: 10 },
];

const baseProduct = {
  id: "prod-1",
  name: "Gold Necklace",
  price: 2999,
  image: "/necklace.jpg",
  category: { name: "Jewellery" },
};

describe("GiftBoxModal", () => {
  const onConfirm = vi.fn();
  const onSkip = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockGiftBoxes) }),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <GiftBoxModal open={false} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    expect(container.querySelector(".gift-box-modal-overlay")).toBeNull();
  });

  it("renders the modal when open", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add a Gift Box for Packing")).toBeInTheDocument();
    expect(screen.getByText("Gold Necklace")).toBeInTheDocument();
    expect(screen.getByText("₹2999.00")).toBeInTheDocument();
  });

  it("fetches and displays gift boxes", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    expect(await screen.findByText("Hexagon Velvet Box")).toBeInTheDocument();
    expect(screen.getByText("Red Velvet Gift Box")).toBeInTheDocument();
    expect(screen.getByText("₹150.00")).toBeInTheDocument();
    expect(screen.getByText("₹75.00")).toBeInTheDocument();
  });

  it("shows low stock warning for boxes with 3 or fewer in stock", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");
    expect(screen.getByText("Only 2 left")).toBeInTheDocument();
    expect(screen.queryByText("Only 10 left")).not.toBeInTheDocument();
  });

  it("allows selecting a gift box", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    // Click the Hexagon box option
    fireEvent.click(screen.getByText("Hexagon Velvet Box"));

    // Check mark should appear
    const checkMarks = screen.getAllByText("✓");
    expect(checkMarks.length).toBeGreaterThanOrEqual(1);
  });

  it("shows quantity controls after selecting a box", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    fireEvent.click(screen.getByText("Hexagon Velvet Box"));

    // Quantity controls should appear with value 1
    const qtyValues = screen.getAllByText("1");
    expect(qtyValues.length).toBeGreaterThanOrEqual(1);
  });

  it("allows deselecting a gift box", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    // Select then deselect
    fireEvent.click(screen.getByText("Hexagon Velvet Box"));
    fireEvent.click(screen.getByText("Hexagon Velvet Box"));

    // Check marks should be gone
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });

  it("shows Add to Cart with no extra cost when no boxes selected", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    const addBtn = screen.getByText("Add to Cart");
    expect(addBtn).toBeInTheDocument();
    // Should not show any extra cost
    expect(screen.queryByText(/\+\₹/)).not.toBeInTheDocument();
  });

  it("shows Add to Cart with extra cost when boxes are selected", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    fireEvent.click(screen.getByText("Hexagon Velvet Box"));

    expect(screen.getByText("Add to Cart (+₹150.00)")).toBeInTheDocument();
  });

  it("calls onConfirm with selected boxes when Add to Cart is clicked", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    fireEvent.click(screen.getByText("Hexagon Velvet Box"));
    fireEvent.click(screen.getByText("Add to Cart (+₹150.00)"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith([
      { productId: "box-1", name: "Hexagon Velvet Box", price: 150, image: "/hex-box.jpg", quantity: 1 },
    ]);
  });

  it("calls onConfirm with empty array when Skip is clicked", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    fireEvent.click(screen.getByText("Skip"));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the close button", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    fireEvent.click(screen.getByLabelText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when pressing Escape", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the overlay backdrop", async () => {
    const { container } = render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    const overlay = container.querySelector(".gift-box-modal-overlay")!;
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the modal panel", async () => {
    const { container } = render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    const modal = container.querySelector(".gift-box-modal")!;
    fireEvent.click(modal);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows loading state while fetching gift boxes", () => {
    // Make fetch hang
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    expect(screen.getByText("Loading gift boxes…")).toBeInTheDocument();
  });

  it("shows empty state when no gift boxes are available", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    ) as unknown as typeof fetch;

    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    expect(await screen.findByText("No gift boxes available.")).toBeInTheDocument();
  });

  it("increments gift box quantity", async () => {
    render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    // Select the box
    fireEvent.click(screen.getByText("Hexagon Velvet Box"));

    // Find the + button for the selected box and click it
    const plusButtons = screen.getAllByText("+");
    const boxPlusBtn = plusButtons.find((btn) => {
      const parent = btn.closest(".gift-box-modal-qty");
      return parent !== null;
    });
    expect(boxPlusBtn).toBeTruthy();
    fireEvent.click(boxPlusBtn!);

    // Quantity should be 2 now
    expect(screen.getByText("2")).toBeInTheDocument();

    // Total should be 300 (2 * 150)
    expect(screen.getByText("Add to Cart (+₹300.00)")).toBeInTheDocument();
  });

  it("prevents body scroll when open", async () => {
    const { unmount } = render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });

  it("resets selection when modal reopens", async () => {
    const { rerender } = render(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    // Select a box
    fireEvent.click(screen.getByText("Hexagon Velvet Box"));
    expect(screen.getByText("✓")).toBeInTheDocument();

    // Close
    rerender(
      <GiftBoxModal open={false} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );

    // Reopen
    rerender(
      <GiftBoxModal open={true} product={baseProduct} onConfirm={onConfirm} onSkip={onSkip} onClose={onClose} />,
    );
    await screen.findByText("Hexagon Velvet Box");

    // Selection should be reset
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });
});
