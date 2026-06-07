"use client";

import { useCallback, useMemo, useState } from "react";
import OrderDetailModal from "@/src/components/order/OrderDetailModal";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import AdminCataloguePanel from "@/src/components/admin/AdminCataloguePanel";
import AdminChartsSection from "@/src/components/admin/AdminChartsSection";
import AdminDeleteConfirm from "@/src/components/admin/AdminDeleteConfirm";
import AdminHeader from "@/src/components/admin/AdminHeader";
import AdminOrdersPanel from "@/src/components/admin/AdminOrdersPanel";
import AdminStatsGrid from "@/src/components/admin/AdminStatsGrid";
import AdminTabs, { type AdminTabKey } from "@/src/components/admin/AdminTabs";
import AdminTrackingModal from "@/src/components/admin/AdminTrackingModal";
import {
  ADMIN_PAGE_SIZES,
  useAdminOrders,
  useAdminProducts,
  useAdminStats,
} from "@/src/lib/hooks/useAdminData";
import { useAdminCatalogueController } from "@/src/lib/hooks/useAdminCatalogueController";
import { useAdminHeaderActions } from "@/src/lib/hooks/useAdminHeaderActions";
import { useAdminOrdersController } from "@/src/lib/hooks/useAdminOrdersController";
import { useAdminSession } from "@/src/lib/hooks/useAdminSession";

const PRODUCTS_PER_PAGE = ADMIN_PAGE_SIZES.products;
const ITEMS_PER_PAGE = ADMIN_PAGE_SIZES.orders;

export default function AdminPage() {
  const { authenticated, authLoading, ready } = useAdminSession();

  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [activeTab, setActiveTab] = useState<AdminTabKey>("orders");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const statsQuery = useAdminStats(authenticated);
  const ordersQuery = useAdminOrders(
    { page: currentPage, limit: ITEMS_PER_PAGE, status: statusFilter },
    authenticated,
  );
  const productsQuery = useAdminProducts(
    { page: productPage, limit: PRODUCTS_PER_PAGE, isActive: "all" },
    authenticated,
  );

  const orders = useMemo(() => ordersQuery.data?.orders ?? [], [ordersQuery.data?.orders]);
  const totalPages = ordersQuery.data?.totalPages ?? 1;
  const products = useMemo(() => productsQuery.data?.products ?? [], [productsQuery.data?.products]);
  const productTotalPages = productsQuery.data?.totalPages ?? 1;
  const stats = statsQuery.data?.stats ?? null;
  const chartData = statsQuery.data?.chartData ?? [];
  const productSales = statsQuery.data?.productSalesData ?? [];
  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) ?? null : null),
    [orders, selectedOrderId],
  );

  const clearSelectedOrder = useCallback(() => setSelectedOrderId(null), []);
  const handleProductSaved = useCallback(() => setProductPage(1), []);

  const ordersController = useAdminOrdersController(orders, clearSelectedOrder);
  const catalogueController = useAdminCatalogueController({ onAfterSave: handleProductSaved });
  const headerActions = useAdminHeaderActions();

  const handleStatusFilterChange = useCallback((key: string) => {
    setStatusFilter(key);
    setCurrentPage(1);
  }, []);

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
