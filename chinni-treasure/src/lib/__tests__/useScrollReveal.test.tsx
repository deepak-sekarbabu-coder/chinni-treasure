import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import React from "react";
import useScrollReveal from "../useScrollReveal";

describe("useScrollReveal", () => {
  let observeCallback: ((entries: IntersectionObserverEntry[]) => void) | null;

  beforeEach(() => {
    observeCallback = null;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string = "";
        readonly thresholds: ReadonlyArray<number> = [];
        constructor(callback: IntersectionObserverCallback) {
          observeCallback = callback as (entries: IntersectionObserverEntry[]) => void;
        }
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with visible=false", () => {
    function TestComp() {
      const { ref, visible } = useScrollReveal();
      return <div ref={ref} data-visible={String(visible)} />;
    }
    const { container } = render(<TestComp />);
    expect(container.querySelector("[data-visible]")?.getAttribute("data-visible")).toBe("false");
  });

  it("sets visible=true when element is intersecting", () => {
    function TestComp() {
      const { ref, visible } = useScrollReveal();
      return <div ref={ref} data-visible={String(visible)} />;
    }
    const { container } = render(<TestComp />);

    if (observeCallback) {
      act(() => {
        observeCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
      });
    }

    expect(container.querySelector("[data-visible]")?.getAttribute("data-visible")).toBe("true");
  });

  it("calls unobserve after first intersection", () => {
    const unobserve = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string = "";
        readonly thresholds: ReadonlyArray<number> = [];
        constructor(callback: IntersectionObserverCallback) {
          observeCallback = callback as (entries: IntersectionObserverEntry[]) => void;
        }
        observe = vi.fn();
        unobserve = unobserve;
        disconnect = vi.fn();
      },
    );

    function TestComp() {
      const { ref } = useScrollReveal();
      return <div ref={ref} />;
    }
    render(<TestComp />);

    if (observeCallback) {
      act(() => {
        observeCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
      });
    }

    expect(unobserve).toHaveBeenCalled();
  });

  it("stays visible=false when element is not intersecting", () => {
    function TestComp() {
      const { ref, visible } = useScrollReveal();
      return <div ref={ref} data-visible={String(visible)} />;
    }
    const { container } = render(<TestComp />);

    if (observeCallback) {
      act(() => {
        observeCallback([{ isIntersecting: false } as IntersectionObserverEntry]);
      });
    }

    expect(container.querySelector("[data-visible]")?.getAttribute("data-visible")).toBe("false");
  });

  it("returns a ref", () => {
    const { result } = renderHook(() => useScrollReveal());
    expect(result.current.ref).toBeDefined();
  });

  it("passes threshold to IntersectionObserver", () => {
    let capturedThreshold: number | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string = "";
        readonly thresholds: ReadonlyArray<number> = [];
        constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          capturedThreshold = options?.threshold as number;
        }
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );

    function TestComp() {
      const { ref, visible } = useScrollReveal(0.5);
      return <div ref={ref} data-visible={String(visible)} />;
    }
    render(<TestComp />);
    expect(capturedThreshold).toBe(0.5);
  });
});
