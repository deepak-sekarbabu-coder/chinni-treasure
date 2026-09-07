"use client";

import { useCallback, useState } from "react";
import type { AdminTabKey } from "@/src/components/admin/AdminTabs";
import { useAdminStats } from "@/src/lib/hooks/useAdminData";
import { useAdminSession } from "@/src/lib/hooks/useAdminSession";

/**
 * Admin page aggregate state.
 *
 * Deliberately small: this owns only what is shared across panels — the
 * session gate, the active tab, the dashboard stats/charts, and the
 * selected-order state (the order-detail and tracking modals render at the
 * page level, outside the orders panel). Per-panel state lives in the
 * `useAdmin<Panel>` modules co-located with each panel.
 */
export function useAdminPageState() {
  const { authenticated, authLoading, ready } = useAdminSession();
  const [activeTab, setActiveTab] = useState<AdminTabKey>("orders");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const statsQuery = useAdminStats(authenticated);

  const clearSelectedOrder = useCallback(() => setSelectedOrderId(null), []);

  return {
    authenticated,
    authLoading,
    ready,
    activeTab,
    setActiveTab,
    selectedOrderId,
    setSelectedOrderId,
    clearSelectedOrder,
    statsQuery,
  };
}
