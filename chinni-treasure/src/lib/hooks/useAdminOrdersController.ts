"use client";

import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import { useUpdateOrderStatus, useUpdateTrackingId } from "@/src/lib/hooks/useAdminMutations";
import { nextOrderStatus } from "@/src/lib/constants";
import type { FlowStatus } from "@/src/lib/constants";


import { getErrorMessage } from "@/src/lib/api/client";
import type { Order } from "@/src/lib/api/schemas";

interface TrackingModalState {
  orderId: string;
  open: boolean;
}

const CLOSED_TRACKING: TrackingModalState = { orderId: "", open: false };

export function useAdminOrdersController(orders: Order[], onClearSelection: () => void) {
  const { showToast } = useToast();
  const updateStatus = useUpdateOrderStatus();
  const updateTracking = useUpdateTrackingId();
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
      // Advance target comes from the shared forward-step computation
      // (first non-terminal transition in ORDER_STATUS_ACTIONS; rejected
      // is handled by handleReject) — same table validateTransition enforces.
      const nextStatus = nextOrderStatus(order.status);
      if (!nextStatus) return;
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
        showToast(getErrorMessage(err, "Failed to update status"), "error");
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
          input: { status: "rejected" as FlowStatus, expectedVersion: order.version },
        });
        onClearSelection();
      } catch (err) {
        showToast(getErrorMessage(err, "Failed to reject order"), "error");
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
        showToast(getErrorMessage(err, "Failed to ship order"), "error");
      } finally {
        setAdvancingOrderId(null);
      }
    },
    [ordersById, trackingModal.orderId, updateStatus, showToast],
  );

  const closeTrackingModal = useCallback(() => {
    setTrackingModal(CLOSED_TRACKING);
  }, []);

  const handleUpdateTracking = useCallback(
    async (orderId: string, trackingId: string) => {
      const order = ordersById.get(orderId);
      if (!order) return;
      try {
        await updateTracking.mutateAsync({
          orderId,
          trackingId,
          expectedVersion: order.version,
        });
        showToast("Tracking ID updated successfully", "success");
      } catch (err) {
        showToast(getErrorMessage(err, "Failed to update tracking ID"), "error");
        throw err;
      }
    },
    [ordersById, updateTracking, showToast],
  );

  return {
    advancingOrderId,
    trackingModal,
    isTransitioning: updateStatus.isPending,
    handleAdvance,
    handleReject,
    handleTrackingSubmit,
    closeTrackingModal,
    handleUpdateTracking,
  };
}
