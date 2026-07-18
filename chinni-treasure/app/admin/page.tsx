"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import AdminHeader from "@/src/components/admin/AdminHeader";
import AdminStatsGrid from "@/src/components/admin/AdminStatsGrid";
import AdminTabs from "@/src/components/admin/AdminTabs";
import { useAdminPageState } from "./useAdminPageState";

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
    statusFilter, currentPage, productPage, activeTab,
    productFilters,
    statsQuery, ordersQuery, productsQuery, categoriesQuery,
    orders, totalPages, products, productTotalPages,
    stats, chartData, productSales, selectedOrder,
    ordersController, catalogueController, categoriesController, headerActions,
    setActiveTab, setCurrentPage, setProductPage, setSelectedOrderId,
    clearSelectedOrder, handleStatusFilterChange,
    handleProductFilterChange, handleProductFilterReset,
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
            categories={categoriesQuery.data ?? []}
            categoriesLoading={categoriesQuery.isLoading}
            filters={productFilters}
            onFilterChange={handleProductFilterChange}
            onFilterReset={handleProductFilterReset}
            onToggleForm={catalogueController.toggleProductForm}
            onFormChange={catalogueController.onFormChange}
            onSave={catalogueController.handleProductSave}
            onEdit={catalogueController.editProduct}
            onRequestDelete={catalogueController.requestProductDelete}
            onPageChange={setProductPage}
          />
        )}

        {activeTab === "categories" && (
          <AdminCategoriesPanel
            showForm={categoriesController.showForm}
            formClosing={categoriesController.formClosing}
            form={categoriesController.form}
            productLoading={categoriesController.productLoading}
            categories={categoriesQuery.data ?? []}
            categoriesLoading={categoriesQuery.isLoading}
            deleteConfirm={categoriesController.deleteConfirm}
            loadingCategoryId={categoriesController.loadingCategoryId}
            togglePendingId={categoriesController.togglePendingId}
            onToggleForm={categoriesController.toggleForm}
            onFormChange={categoriesController.onFormChange}
            onSave={categoriesController.handleSave}
            onEdit={categoriesController.editCategory}
            onRequestDelete={categoriesController.requestDelete}
            onCancelDelete={categoriesController.closeDeleteConfirm}
            onConfirmDelete={categoriesController.handleDeleteConfirmed}
            onToggleActive={categoriesController.handleToggleActive}
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
          onUpdateTracking={ordersController.handleUpdateTracking}
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
