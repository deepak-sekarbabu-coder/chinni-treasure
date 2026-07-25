"use client";

import { useCallback, useEffect, useState } from "react";
import { FREE_SHIPPING_THRESHOLD } from "@/src/lib/constants";
import { useCart } from "@/src/components/cart/CartProvider";

const MOBILE_BREAKPOINT = "(max-width: 768px)";

export interface ShippingNudgeState {
  show: boolean;
  newTotal: number;
  shippingLeft: number;
  trigger: (productPrice: number, quantity: number) => void;
  dismiss: () => void;
}

export function useShippingNudge(): ShippingNudgeState {
  const { getTotal } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [show, setShow] = useState(false);
  const [newTotal, setNewTotal] = useState(0);
  const [shippingLeft, setShippingLeft] = useState(0);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT);

    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
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
    (productPrice: number, quantity: number) => {
      if (!isMobile) return;

      const estimatedTotal = getTotal() + productPrice * quantity;

      if (estimatedTotal >= FREE_SHIPPING_THRESHOLD) {
        setShow(false);
        setNewTotal(estimatedTotal);
        setShippingLeft(0);
        return;
      }

      const remaining = FREE_SHIPPING_THRESHOLD - estimatedTotal;
      setNewTotal(estimatedTotal);
      setShippingLeft(remaining);
      setShow(true);
    },
    [getTotal, isMobile],
  );

  return { show, newTotal, shippingLeft, trigger, dismiss };
}
