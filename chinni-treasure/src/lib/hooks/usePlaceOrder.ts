"use client";

import { useMutation } from "@tanstack/react-query";
import { createOrder } from "@/src/lib/api";
import type { CreateOrderRequest, Order } from "@/src/lib/api/schemas";

/**
 * Placing the customer's Order. Lives beside Checkout, not in the admin
 * mutations module — it is the one public mutation in the app, and an operator
 * never places an order.
 */
export function usePlaceOrder() {
  return useMutation<Order, Error, CreateOrderRequest>({
    mutationFn: (input) => createOrder(input),
  });
}