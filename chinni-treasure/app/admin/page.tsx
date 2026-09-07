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

        {activeTab === "orders" && (
          <AdminOrdersPanel
            orders={ordersPanel.data.orders}
            loading={ordersPanel.loading}
            statusFilter={ordersPanel.data.statusFilter}
            onStatusFilterChange={ordersPanel.actions.onStatusFilterChange}
            currentPage={ordersPanel.data.currentPage}
            totalPages={ordersPanel.data.totalPages}
            onPageChange={ordersPanel.actions.onPageChange}
            advancingOrderId={ordersPanel.data.advancingOrderId}
            selectedOrder={ordersPanel.data.selectedOrder}
            onSelectOrder={ordersPanel.actions.onSelectOrder}
            sort={ordersPanel.data.sort}
            onSortChange={ordersPanel.actions.onSortChange}
          />
        )}

        {activeTab === "catalogue" && (
          <AdminCataloguePanel
            showForm={cataloguePanel.data.showForm}
            formClosing={cataloguePanel.data.formClosing}
            productForm={cataloguePanel.data.productForm}
            productLoading={cataloguePanel.formSaving}
            products={cataloguePanel.data.products}
            productsLoading={cataloguePanel.loading}
            loadingProductId={cataloguePanel.data.loadingProductId}
            productPage={cataloguePanel.data.currentPage}
            productTotalPages={cataloguePanel.data.productTotalPages}
            categories={cataloguePanel.data.categories}
            categoriesLoading={false}
            filters={cataloguePanel.data.filters}
            onFilterChange={cataloguePanel.actions.onFilterChange}
            onFilterReset={cataloguePanel.actions.onFilterReset}
            onToggleForm={cataloguePanel.actions.onToggleForm}
            onFormChange={cataloguePanel.actions.onFormChange}
            onSave={cataloguePanel.actions.onSave}
            onEdit={cataloguePanel.actions.onEdit}
            onRequestDelete={cataloguePanel.actions.onRequestDelete}
            onPageChange={cataloguePanel.actions.onPageChange}
          />
        )}

        {activeTab === "categories" && (
          <AdminCategoriesPanel
            showForm={categoriesPanel.data.showForm}
            formClosing={categoriesPanel.data.formClosing}
            form={categoriesPanel.data.form}
            productLoading={categoriesPanel.formSaving}
            categories={categoriesPanel.data.categories}
            categoriesLoading={categoriesPanel.loading}
            deleteConfirm={categoriesPanel.data.deleteConfirm}
            loadingCategoryId={categoriesPanel.data.loadingCategoryId}
            togglePendingId={categoriesPanel.data.togglePendingId}
            onToggleForm={categoriesPanel.actions.onToggleForm}
            onFormChange={categoriesPanel.actions.onFormChange}
            onSave={categoriesPanel.actions.onSave}
            onEdit={categoriesPanel.actions.onEdit}
            onRequestDelete={categoriesPanel.actions.onRequestDelete}
            onCancelDelete={categoriesPanel.actions.onCancelDelete}
            onConfirmDelete={categoriesPanel.actions.onConfirmDelete}
            onToggleActive={categoriesPanel.actions.onToggleActive}
          />
        )}
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
          productName={cataloguePanel.data.deleteConfirm.productName}
          loading={cataloguePanel.isDeleting}
          onConfirm={cataloguePanel.actions.onConfirmDelete}
          onCancel={cataloguePanel.actions.onCancelDelete}
        />
      )}
    </div>
  );
}
