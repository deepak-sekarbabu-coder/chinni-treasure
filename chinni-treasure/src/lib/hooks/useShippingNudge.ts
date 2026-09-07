"use client";

import { useCallback, useEffect, useState } from "react";
import { FREE_SHIPPING_THRESHOLD } from "@/src/lib/constants";

const MOBILE_BREAKPOINT = "(max-width: 768px)";

export interface ShippingNudgeState {
  show: boolean;
  newTotal: number;
  shippingLeft: number;
  /**
   * Show the nudge popup when the customer is below the free-shipping
   * threshold. `newTotal` is the **absolute** post-add cart total — callers
   * compute it from known quantities rather than reading the (stale) cart
   * state, because addItem's setItems hasn't flushed yet when this is called.
   */
  trigger: (newTotal: number) => void;
  dismiss: () => void;
}

export function useShippingNudge(): ShippingNudgeState {
  const [show, setShow] = useState(false);
  const [newTotal, setNewTotal] = useState(0);
  const [shippingLeft, setShippingLeft] = useState(0);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT);

    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      if (!e.matches) {
        setShow(false);
      }
    };

    update(mql);
    mql.addEventListener("change", update);

    return () => mql.removeEventListener("change", update);
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
  }, []);

  const trigger = useCallback(
    (total: number) => {
      if (total >= FREE_SHIPPING_THRESHOLD) {
        setShow(false);
        setNewTotal(total);
        setShippingLeft(0);
        return;
      }

      const remaining = FREE_SHIPPING_THRESHOLD - total;
      setNewTotal(total);
      setShippingLeft(remaining);
      setShow(true);
    },
    [],
  );

  return { show, newTotal, shippingLeft, trigger, dismiss };
}
