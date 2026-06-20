"use client";

import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import { useUpdateOrderStatus } from "@/src/lib/hooks/useAdminMutations";
import { ORDER_STATUS_FLOW } from "@/src/lib/constants";
import { extractApiErrorMessage } from "@/src/lib/utils";
import type { Order } from "@/src/lib/api/schemas";

interface TrackingModalState {
  orderId: string;
  open: boolean;
}

const CLOSED_TRACKING: TrackingModalState = { orderId: "", open: false };

export function useAdminOrdersController(orders: Order[], onClearSelection: () => void) {
  const { showToast } = useToast();
  const updateStatus = useUpdateOrderStatus();
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<TrackingModalState>(CLOSED_TRACKING);

  const ordersById = useMemo(() => {
    const map = new Map<string, Order>();
    for (const order of orders) map.set(order.id, order);
    return map;
  }, [orders]);

  const handleAdvance = useCallback(
    async (orderId: string) => {
      const order = ordersById.get(orderId);
      if (!order) return;
      const currentIdx = (ORDER_STATUS_FLOW as readonly string[]).indexOf(order.status);
      if (currentIdx < 0 || currentIdx >= ORDER_STATUS_FLOW.length - 1) return;
      const nextStatus = ORDER_STATUS_FLOW[currentIdx + 1];
      if (nextStatus === "shipped") {
        setTrackingModal({ orderId: order.id, open: true });
        return;
      }
      setAdvancingOrderId(orderId);
      try {
        await updateStatus.mutateAsync({
          orderId,
          input: { status: nextStatus, expectedVersion: order.version },
        });
      } catch (err) {
        showToast(extractApiErrorMessage(err, "Failed to update status"), "error");
      } finally {
        setAdvancingOrderId(null);
      }
    },
    [ordersById, updateStatus, showToast],
  );

  const handleReject = useCallback(
    async (orderId: string) => {
      const order = ordersById.get(orderId);
      if (!order) return;
      setAdvancingOrderId(orderId);
      try {
        await updateStatus.mutateAsync({
          orderId,
          input: { status: "rejected", expectedVersion: order.version },
        });
        onClearSelection();
      } catch (err) {
        showToast(extractApiErrorMessage(err, "Failed to reject order"), "error");
      } finally {
        setAdvancingOrderId(null);
      }
    },
    [ordersById, updateStatus, showToast, onClearSelection],
  );

  const handleTrackingSubmit = useCallback(
    async (trackingId: string) => {
      const orderId = trackingModal.orderId;
      const order = ordersById.get(orderId);
      if (!order) return;
      setAdvancingOrderId(orderId);
      try {
        await updateStatus.mutateAsync({
          orderId,
          input: { status: "shipped", trackingId, expectedVersion: order.version },
        });
        setTrackingModal(CLOSED_TRACKING);
        showToast("Order marked as shipped successfully", "success");
      } catch (err) {
        showToast(extractApiErrorMessage(err, "Failed to ship order"), "error");
      } finally {
        setAdvancingOrderId(null);
      }
    },
    [ordersById, trackingModal.orderId, updateStatus, showToast],
  );

  const closeTrackingModal = useCallback(() => {
    setTrackingModal(CLOSED_TRACKING);
  }, []);

  return {
    advancingOrderId,
    trackingModal,
    isTransitioning: updateStatus.isPending,
    handleAdvance,
    handleReject,
    handleTrackingSubmit,
    closeTrackingModal,
  };
}
