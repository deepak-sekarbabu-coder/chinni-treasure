"use client";

import { useRef, useEffect } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const previousRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    previousRef.current = document.activeElement as HTMLElement;

    const container = ref.current;
    if (!container) return;

    const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !container) return;
      const all = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      const f = all[0];
      const l = all[all.length - 1];
      if (e.shiftKey && document.activeElement === f) {
        e.preventDefault();
        l?.focus();
      } else if (!e.shiftKey && document.activeElement === l) {
        e.preventDefault();
        f?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousRef.current?.focus();
    };
  }, [active]);

  return ref;
}
