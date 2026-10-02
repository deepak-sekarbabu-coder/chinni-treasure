"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import AdminHeader from "@/src/components/admin/AdminHeader";
import AdminStatsGrid from "@/src/components/admin/AdminStatsGrid";
import AdminTabs from "@/src/components/admin/AdminTabs";
import { useAdminPageState } from "./useAdminPageState";
import { useAdminOrdersPanel } from "@/src/components/admin/useAdminOrdersPanel";
import { useAdminCataloguePanel } from "@/src/components/admin/useAdminCataloguePanel";
import { useAdminCategoriesPanel } from "@/src/components/admin/useAdminCategoriesPanel";
import { useAdminHeaderActions } from "@/src/lib/hooks/useAdminHeaderActions";

const AdminOrdersPanel = dynamic(() => import("@/src/components/admin/AdminOrdersPanel"), {
  ssr: false,
});
const AdminCataloguePanel = dynamic(() => import("@/src/components/admin/AdminCataloguePanel"), {
  ssr: false,
});
const AdminCategoriesPanel = dynamic(() => import("@/src/components/admin/AdminCategoriesPanel"), {
  ssr: false,
});
const AdminChartsSection = dynamic(() => import("@/src/components/admin/AdminChartsSection"), {
  ssr: false,
});
const AdminDeleteConfirm = dynamic(() => import("@/src/components/admin/AdminDeleteConfirm"), {
  ssr: false,
});
const AdminTrackingModal = dynamic(() => import("@/src/components/admin/AdminTrackingModal"), {
  ssr: false,
});
const OrderDetailModal = dynamic(() => import("@/src/components/order/OrderDetailModal"), {
  ssr: false,
});

export default function AdminPage() {
  const {
    authenticated, authLoading, ready,
    activeTab, setActiveTab,
    selectedOrderId, setSelectedOrderId, clearSelectedOrder,
    statsQuery,
  } = useAdminPageState();
  const headerActions = useAdminHeaderActions();

  const isCatalogueTab = activeTab === "catalogue";

  const ordersPanel = useAdminOrdersPanel({
    authenticated,
    selectedOrderId,
    setSelectedOrderId,
    clearSelectedOrder,
  });
  const cataloguePanel = useAdminCataloguePanel({
    authenticated,
    enabled: isCatalogueTab,
  });
  const categoriesPanel = useAdminCategoriesPanel({ authenticated });

  if (authLoading || !ready || !authenticated) {
    return authLoading ? <LoadingSpinner fullPage /> : null;
  }

  return (
    <div className="admin-page-root">
      <AdminHeader
        isExporting={headerActions.isExporting}
        isLoggingOut={headerActions.isLoggingOut}
        onExport={headerActions.handleExport}
        onLogout={headerActions.handleLogout}
      />

      <AdminStatsGrid stats={statsQuery.data?.stats ?? null} />

      <AdminChartsSection
        loading={statsQuery.isLoading}
        chartData={statsQuery.data?.chartData ?? []}
        productSales={statsQuery.data?.productSalesData ?? []}
      />

      <section className="section section-top-md">
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "orders" && <AdminOrdersPanel panel={ordersPanel} />}

        {activeTab === "catalogue" && <AdminCataloguePanel panel={cataloguePanel} />}

        {activeTab === "categories" && <AdminCategoriesPanel panel={categoriesPanel} />}
      </section>

      {ordersPanel.data.selectedOrder && (
        <OrderDetailModal
          order={ordersPanel.data.selectedOrder}
          onClose={clearSelectedOrder}
          showActions
          onAdvance={ordersPanel.actions.handleAdvance}
          onReject={ordersPanel.actions.handleReject}
          isTransitioning={ordersPanel.isTransitioning}
          onUpdateTracking={ordersPanel.actions.handleUpdateTracking}
        />
      )}

      {ordersPanel.data.trackingModal.open && (
        <AdminTrackingModal
          onClose={ordersPanel.actions.closeTrackingModal}
          onSubmit={ordersPanel.actions.handleTrackingSubmit}
        />
      )}

      {cataloguePanel.data.deleteConfirm.open && (
        <AdminDeleteConfirm
          name={cataloguePanel.data.deleteConfirm.productName}
          loading={cataloguePanel.isDeleting}
          onConfirm={cataloguePanel.actions.onConfirmDelete}
          onCancel={cataloguePanel.actions.onCancelDelete}
        />
      )}
    </div>
  );
}
