"use client";

import OrderDetailModal from "@/src/components/order/OrderDetailModal";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import AdminCataloguePanel from "@/src/components/admin/AdminCataloguePanel";
import AdminChartsSection from "@/src/components/admin/AdminChartsSection";
import AdminDeleteConfirm from "@/src/components/admin/AdminDeleteConfirm";
import AdminHeader from "@/src/components/admin/AdminHeader";
import AdminOrdersPanel from "@/src/components/admin/AdminOrdersPanel";
import AdminStatsGrid from "@/src/components/admin/AdminStatsGrid";
import AdminTabs from "@/src/components/admin/AdminTabs";
import AdminTrackingModal from "@/src/components/admin/AdminTrackingModal";
import { useAdminPageState } from "./useAdminPageState";

export default function AdminPage() {
  const {
    authenticated, authLoading, ready,
    statusFilter, currentPage, productPage, activeTab,
    statsQuery, ordersQuery, productsQuery,
    orders, totalPages, products, productTotalPages,
    stats, chartData, productSales, selectedOrder,
    ordersController, catalogueController, headerActions,
    setActiveTab, setCurrentPage, setProductPage, setSelectedOrderId,
    clearSelectedOrder, handleStatusFilterChange,
  } = useAdminPageState();

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

      <AdminStatsGrid stats={stats} />

      <AdminChartsSection
        loading={statsQuery.isLoading}
        chartData={chartData}
        productSales={productSales}
      />

      <section className="section section-top-md">
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "orders" && (
          <AdminOrdersPanel
            orders={orders}
            loading={ordersQuery.isLoading || ordersQuery.isFetching}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            advancingOrderId={ordersController.advancingOrderId}
            selectedOrder={selectedOrder}
            onSelectOrder={(order) => setSelectedOrderId(order?.id ?? null)}
          />
        )}

        {activeTab === "catalogue" && (
          <AdminCataloguePanel
            showForm={catalogueController.showProductForm}
            formClosing={catalogueController.productFormClosing}
            productForm={catalogueController.productForm}
            productLoading={catalogueController.productLoading}
            products={products}
            productsLoading={productsQuery.isLoading || productsQuery.isFetching}
            loadingProductId={catalogueController.loadingProductId}
            productPage={productPage}
            productTotalPages={productTotalPages}
            onToggleForm={catalogueController.toggleProductForm}
            onFormChange={catalogueController.onFormChange}
            onSave={catalogueController.handleProductSave}
            onEdit={catalogueController.editProduct}
            onRequestDelete={catalogueController.requestProductDelete}
            onPageChange={setProductPage}
          />
        )}
      </section>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={clearSelectedOrder}
          showActions
          onAdvance={ordersController.handleAdvance}
          onReject={ordersController.handleReject}
          isTransitioning={ordersController.isTransitioning}
        />
      )}

      {ordersController.trackingModal.open && (
        <AdminTrackingModal
          onClose={ordersController.closeTrackingModal}
          onSubmit={ordersController.handleTrackingSubmit}
        />
      )}

      {catalogueController.deleteConfirm.open && (
        <AdminDeleteConfirm
          productName={catalogueController.deleteConfirm.productName}
          loading={catalogueController.isDeleting}
          onConfirm={catalogueController.handleProductDeleteConfirmed}
          onCancel={catalogueController.closeDeleteConfirm}
        />
      )}
    </div>
  );
}
