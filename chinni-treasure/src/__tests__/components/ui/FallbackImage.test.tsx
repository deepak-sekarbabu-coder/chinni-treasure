import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  // Passthrough so error events reach the fallback logic (setup mocks it to null).
  default: (props: Record<string, unknown>) => {
    const { blurDataURL: _blur, ...domProps } = props;
    void _blur;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(domProps as object)} />;
  },
}));

import FallbackImage from "@/src/components/ui/FallbackImage";
import { IMAGE_UNAVAILABLE_PLACEHOLDER } from "@/src/lib/images";

it("swaps a failed image to the shared placeholder", () => {
  render(<FallbackImage src="/broken.jpg" alt="x" width={50} height={50} />);
  // Re-query: the swap unmounts the failed node and mounts the placeholder.
  fireEvent.error(screen.getByAltText("x"));
  expect(screen.getByAltText("x")).toHaveAttribute("src", IMAGE_UNAVAILABLE_PLACEHOLDER);
});

it("shows the placeholder upfront for an empty src", () => {
  render(<FallbackImage src="" alt="y" width={50} height={50} />);
  expect(screen.getByAltText("y")).toHaveAttribute("src", IMAGE_UNAVAILABLE_PLACEHOLDER);
});

it("still forwards onError to the caller", () => {
  const onError = vi.fn();
  render(<FallbackImage src="/broken.jpg" alt="z" width={50} height={50} onError={onError} />);
  fireEvent.error(screen.getByAltText("z"));
  expect(onError).toHaveBeenCalled();
});
