"use client";

import { useCallback, useState } from "react";
import { shippingProgress } from "@/src/lib/pricing";
import { useIsMobile } from "@/src/lib/hooks/useMediaQuery";

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

  // The popup is a mobile affordance: leaving the breakpoint hides it. Derived
  // rather than synced in an effect, so widening the window cannot leave a
  // stale popup mounted.
  const isMobile = useIsMobile();

  const dismiss = useCallback(() => {
    setShow(false);
  }, []);

  const trigger = useCallback(
    (total: number) => {
      const { unlocked, remaining } = shippingProgress(total);
      if (unlocked) {
        setShow(false);
        setNewTotal(total);
        setShippingLeft(0);
        return;
      }

      setNewTotal(total);
      setShippingLeft(remaining);
      setShow(true);
    },
    [],
  );

  return { show: show && isMobile, newTotal, shippingLeft, trigger, dismiss };
}
