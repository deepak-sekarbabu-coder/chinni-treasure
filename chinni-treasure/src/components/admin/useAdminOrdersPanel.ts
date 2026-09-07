"use client";

import { useCallback, useMemo, useState } from "react";
import { ADMIN_PAGE_SIZES, useAdminOrders } from "@/src/lib/hooks/useAdminData";
import { useAdminOrdersController } from "@/src/lib/hooks/useAdminOrdersController";
import type { OrderSortKey } from "@/src/components/admin/table/columns.orders";
import type { Order } from "@/src/lib/api/schemas";

/**
 * Orders panel-view module.
 *
 * Owns everything the Orders tab needs — the orders query, status filter,
 * pagination, sort key, and the fulfilment controller — behind one typed
 * `{ data, loading, actions }` view-model. Selection state stays at the
 * page/aggregate level (the order-detail modal renders there); this module
 * consumes it via `selectedOrderId` + the selection callbacks.
 */
export interface OrdersPanelData {
  orders: Order[];
  totalPages: number;
  statusFilter: string;
  currentPage: number;
  sort: OrderSortKey;
  advancingOrderId: string | null;
  selectedOrder: Order | null;
  trackingModal: { orderId: string; open: boolean };
}

export interface OrdersPanelActions {
  onStatusFilterChange: (key: string) => void;
  onPageChange: (page: number) => void;
  onSortChange: (sort: OrderSortKey) => void;
  onSelectOrder: (order: Order | null) => void;
  handleAdvance: (orderId: string) => Promise<void>;
  handleReject: (orderId: string) => Promise<void>;
  handleTrackingSubmit: (trackingId: string) => Promise<void>;
  closeTrackingModal: () => void;
  handleUpdateTracking: (orderId: string, trackingId: string) => Promise<void>;
}

export interface OrdersPanelViewModel {
  data: OrdersPanelData;
  loading: boolean;
  isTransitioning: boolean;
  actions: OrdersPanelActions;
}

interface UseAdminOrdersPanelArgs {
  authenticated: boolean;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  clearSelectedOrder: () => void;
}

export function useAdminOrdersPanel({
  authenticated,
  selectedOrderId,
  setSelectedOrderId,
  clearSelectedOrder,
}: UseAdminOrdersPanelArgs): OrdersPanelViewModel {
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<OrderSortKey>("date-desc");

  const ordersQuery = useAdminOrders(
    { page: currentPage, limit: ADMIN_PAGE_SIZES.orders, status: statusFilter, sort },
    authenticated,
  );

  const orders = useMemo(() => ordersQuery.data?.orders ?? [], [ordersQuery.data?.orders]);
  const totalPages = ordersQuery.data?.totalPages ?? 1;
  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) ?? null : null),
    [orders, selectedOrderId],
  );

  const controller = useAdminOrdersController(orders, clearSelectedOrder);

  const handleStatusFilterChange = useCallback((key: string) => {
    setStatusFilter(key);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSortChange = useCallback((next: OrderSortKey) => {
    setSort(next);
  }, []);

  const handleSelectOrder = useCallback(
    (order: Order | null) => {
      setSelectedOrderId(order?.id ?? null);
    },
    [setSelectedOrderId],
  );

  return {
    data: {
      orders,
      totalPages,
      statusFilter,
      currentPage,
      sort,
      advancingOrderId: controller.advancingOrderId,
      selectedOrder,
      trackingModal: controller.trackingModal,
    },
    loading: ordersQuery.isLoading || ordersQuery.isFetching,
    isTransitioning: controller.isTransitioning,
    actions: {
      onStatusFilterChange: handleStatusFilterChange,
      onPageChange: handlePageChange,
      onSortChange: handleSortChange,
      onSelectOrder: handleSelectOrder,
      handleAdvance: controller.handleAdvance,
      handleReject: controller.handleReject,
      handleTrackingSubmit: controller.handleTrackingSubmit,
      closeTrackingModal: controller.closeTrackingModal,
      handleUpdateTracking: controller.handleUpdateTracking,
    },
  };
}
