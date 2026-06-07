"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import OrderDetailModal from "@/src/components/order/OrderDetailModal";
import AdminStatCard from "@/src/components/ui/AdminStatCard";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import { useToast } from "@/src/components/ui/ToastProvider";
import { ORDER_STATUS_FLOW } from "@/src/lib/constants";
import AdminTrackingModal from "@/src/components/admin/AdminTrackingModal";
import AdminDeleteConfirm from "@/src/components/admin/AdminDeleteConfirm";
import AdminOrdersPanel from "@/src/components/admin/AdminOrdersPanel";
import AdminCataloguePanel from "@/src/components/admin/AdminCataloguePanel";
import {
  useAdminOrders,
  useAdminProducts,
  useAdminStats,
  useAuthMe,
  ADMIN_PAGE_SIZES,
} from "@/src/lib/hooks/useAdminData";
import {
  useCreateProduct,
  useDeleteProduct,
  useExportToExcel,
  useLogout,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "@/src/lib/hooks/useAdminMutations";
import { ApiError } from "@/src/lib/api-client";
import type { Product } from "@/src/lib/api-schemas";

const PRODUCTS_PER_PAGE = ADMIN_PAGE_SIZES.products;
const ITEMS_PER_PAGE = ADMIN_PAGE_SIZES.orders;

interface ProductFormState {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  stockQuantity: string;
  imageUrl: string;
  badge: string;
  categoryId: string;
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
  id: "",
  name: "",
  sku: "",
  description: "",
  price: "",
  stockQuantity: "",
  imageUrl: "",
  badge: "",
  categoryId: "",
};

function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "catalogue">("orders");
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productFormClosing, setProductFormClosing] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [trackingModal, setTrackingModal] = useState<{ orderId: string; open: boolean }>({
    orderId: "",
    open: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    productId: string;
    productName: string;
  }>({ open: false, productId: "", productName: "" });

  const authQuery = useAuthMe();
  const authenticated = authQuery.isSuccess && authQuery.data?.authenticated === true;
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

  const chartsLoading = statsQuery.isLoading;
  const ordersLoading = ordersQuery.isLoading;
  const productsLoading = productsQuery.isLoading;

  const updateStatus = useUpdateOrderStatus();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const exportMutation = useExportToExcel();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (authQuery.isSuccess && !authQuery.data.authenticated) {
      router.push("/admin/login");
    }
  }, [authQuery.data, authQuery.isSuccess, router]);

  useEffect(() => {
    if (authQuery.error) {
      router.push("/admin/login");
    }
  }, [authQuery.error, router]);

  const authLoading = authQuery.isPending;

  const isTransitioning = updateStatus.isPending;

  const handleAdvance = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
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
    [orders, updateStatus, showToast],
  );

  const handleReject = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      setAdvancingOrderId(orderId);
      try {
        await updateStatus.mutateAsync({
          orderId,
          input: { status: "rejected", expectedVersion: order.version },
        });
        setSelectedOrderId(null);
      } catch (err) {
        showToast(extractApiErrorMessage(err, "Failed to reject order"), "error");
      } finally {
        setAdvancingOrderId(null);
      }
    },
    [orders, updateStatus, showToast],
  );

  const handleTrackingSubmit = useCallback(
    async (trackingId: string) => {
      const orderId = trackingModal.orderId;
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      setAdvancingOrderId(orderId);
      try {
        await updateStatus.mutateAsync({
          orderId,
          input: { status: "shipped", trackingId, expectedVersion: order.version },
        });
        setTrackingModal({ orderId: "", open: false });
        showToast("Order marked as shipped successfully", "success");
      } catch (err) {
        showToast(extractApiErrorMessage(err, "Failed to ship order"), "error");
      } finally {
        setAdvancingOrderId(null);
      }
    },
    [orders, trackingModal.orderId, updateStatus, showToast],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Even if logout fails server-side, clear local state and redirect.
    } finally {
      router.push("/admin/login");
    }
  }, [logoutMutation, router]);

  const handleExport = useCallback(async () => {
    try {
      const blob = await exportMutation.mutateAsync();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = ""; // browser will use blob default name
      const match = disposition.match(/filename="?(.+?)"?$/);
      a.download = match ? match[1] : `chinni-treasure-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Export downloaded successfully", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showToast(extractApiErrorMessage(err, "Failed to export data"), "error");
    }
  }, [exportMutation, showToast]);

  const handleProductSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isEdit = !!productForm.id;
      const price = parseFloat(productForm.price);
      if (!productForm.name.trim() || Number.isNaN(price) || price <= 0) {
        showToast("Product name and a valid price are required", "error");
        return;
      }
      const stockQuantity = parseInt(productForm.stockQuantity) || 0;
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim() || undefined,
        description: productForm.description,
        price,
        stockQuantity,
        imageUrl: productForm.imageUrl || undefined,
        badge: productForm.badge || null,
        categoryId: productForm.categoryId ? parseInt(productForm.categoryId) : null,
      };
      try {
        if (isEdit) {
          await updateProduct.mutateAsync({ productId: productForm.id, input: payload });
          showToast(`Product "${productForm.name}" updated successfully`, "success");
        } else {
          await createProduct.mutateAsync(payload);
          showToast(`Product "${productForm.name}" created successfully`, "success");
        }
        setProductPage(1);
        setShowProductForm(false);
        setProductFormClosing(false);
        setProductForm(EMPTY_PRODUCT_FORM);
      } catch (err) {
        console.error("Failed to save product:", err);
        showToast(extractApiErrorMessage(err, "Failed to save product"), "error");
      }
    },
    [productForm, createProduct, updateProduct, showToast],
  );

  const handleProductDeleteConfirmed = useCallback(async () => {
    if (!deleteConfirm.productId) return;
    try {
      await deleteProduct.mutateAsync(deleteConfirm.productId);
      showToast("Product deleted successfully", "success");
      setDeleteConfirm({ open: false, productId: "", productName: "" });
    } catch (err) {
      console.error("Failed to delete product:", err);
      showToast(extractApiErrorMessage(err, "Failed to delete product"), "error");
    }
  }, [deleteConfirm.productId, deleteProduct, showToast]);

  const toggleProductForm = useCallback(() => {
    if (showProductForm) {
      setProductFormClosing(true);
      setTimeout(() => {
        setShowProductForm(false);
        setProductFormClosing(false);
        setProductForm(EMPTY_PRODUCT_FORM);
      }, 300);
    } else {
      setProductForm(EMPTY_PRODUCT_FORM);
      setShowProductForm(true);
    }
  }, [showProductForm]);

  const editProduct = useCallback((product: Product) => {
    setProductFormClosing(false);
    setProductForm({
      id: product.id,
      name: product.name,
      sku: product.sku || "",
      description: product.description || "",
      price: product.price.toString(),
      stockQuantity: product.stockQuantity.toString(),
      imageUrl: product.imageUrl || "",
      badge: product.badge || "",
      categoryId: product.categoryId ? product.categoryId.toString() : "",
    });
    setShowProductForm(true);
  }, []);

  const requestProductDelete = useCallback((product: Product) => {
    setDeleteConfirm({ open: true, productId: product.id, productName: product.name });
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm({ open: false, productId: "", productName: "" });
  }, []);

  const handleStatusFilterChange = useCallback((key: string) => {
    setStatusFilter(key);
    setCurrentPage(1);
  }, []);

  const handleOrdersPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleProductPageChange = useCallback((page: number) => {
    setProductPage(page);
  }, []);

  const onFormChange = useCallback((next: ProductFormState) => {
    setProductForm(next);
  }, []);

  const productLoading = createProduct.isPending || updateProduct.isPending;
  const loadingProductId = deleteProduct.isPending ? deleteConfirm.productId : null;

  if (authLoading || (!authenticated && !authQuery.isError)) {
    return <LoadingSpinner fullPage />;
  }
  if (!authenticated) return null;

  return (
    <div className="admin-page-root">
      <div className="admin-top-header">
        <div className="section admin-header-row">
          <div>
            <div className="section-subtitle text-gold">Administrator Portal</div>
            <h1 className="admin-heading">Dashboard</h1>
          </div>
          <div className="admin-header-actions">
            <Link href="/docs" className="btn btn-secondary btn-link btn-lg">
              API Docs
            </Link>
            <button
              className="btn btn-secondary btn-lg"
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? "Exporting..." : "Export Excel"}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <section className="section section-top-lg">
          <div className="stats-grid">
            {[
              { label: "Total Orders", value: stats.totalOrders, color: "var(--gold)" },
              { label: "Pending", value: stats.pendingOrders, color: "var(--warning)" },
              { label: "Approved", value: stats.approvedOrders, color: "var(--success)" },
              { label: "Shipped", value: stats.shippedOrders, color: "#9b59b6" },
              { label: "Delivered", value: stats.deliveredOrders, color: "var(--success)" },
              {
                label: "Revenue",
                value: `₹${Number(stats.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
                color: "var(--gold-dark)",
              },
            ].map((s, idx) => (
              <div
                key={s.label}
                style={{
                  animation: `fadeIn 0.4s var(--ease-out) both`,
                  animationDelay: `${idx * 0.08}s`,
                }}
              >
                <AdminStatCard label={s.label} value={s.value} color={s.color} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section section-top-md">
        {chartsLoading ? (
          <div className="charts-grid">
            <div className="admin-stat-card chart-skeleton text-left">
              <div className="skeleton-text" style={{ width: "180px", height: "18px", marginBottom: "20px" }} />
              <div className="flex flex-col gap-12">
                {[
                  { left: 110, right: 45 },
                  { left: 130, right: 55 },
                  { left: 95, right: 50 },
                  { left: 120, right: 60 },
                  { left: 140, right: 40 },
                  { left: 100, right: 48 },
                  { left: 115, right: 52 },
                  { left: 125, right: 58 },
                ].map((item, idx) => (
                  <div key={idx} className="skeleton-row">
                    <div className="skeleton-text" style={{ width: `${item.left}px`, height: "12px" }} />
                    <div className="skeleton-text" style={{ width: `${item.right}px`, height: "12px" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="charts-grid">
            <div className="admin-stat-card text-left">
              <h3 className="font-serif mb-16">Orders (Last 30 Days)</h3>
              <div className="chart-scroll">
                {(() => {
                  const maxOrders = Math.max(...chartData.map((d) => d.orders), 1);
                  return chartData.map((d) => (
                    <div key={d.date} className="chart-row">
                      <span className="chart-date">{dayjs(d.date).format("D MMM")}</span>
                      <div className="chart-bar-wrap">
                        <div className="chart-bar" style={{ width: `${(d.orders / maxOrders) * 100}%` }}></div>
                      </div>
                      <span className="chart-value">{d.orders}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="admin-stat-card text-left">
              <h3 className="font-serif mb-16">Top Products</h3>
              <div className="chart-scroll">
                {(() => {
                  const maxQty = Math.max(...productSales.map((p) => p.quantity), 1);
                  return productSales.slice(0, 10).map((p, i) => (
                    <div key={i} className="chart-row">
                      <span className="chart-product-name tooltip-wrapper">
                        {p.productName}
                        <span className="tooltip-text">{p.productName}</span>
                      </span>
                      <div className="chart-bar-wrap">
                        <div className="chart-bar chart-bar-gold" style={{ width: `${(p.quantity / maxQty) * 100}%` }}></div>
                      </div>
                      <span className="chart-value">{p.quantity}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="section section-top-md">
        <div role="tablist" className="admin-tab-buttons flex gap-8 mb-32">
          {(["orders", "catalogue"] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`panel-${tab}`}
              className={`btn capitalize ${activeTab === tab ? "btn-primary" : "btn-secondary"} btn-lg`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "orders" ? "📋 Orders" : "📦 Catalogue"}
            </button>
          ))}
        </div>

        {activeTab === "orders" && (
          <AdminOrdersPanel
            orders={orders}
            loading={ordersLoading || ordersQuery.isFetching}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handleOrdersPageChange}
            advancingOrderId={advancingOrderId}
            selectedOrder={selectedOrder}
            onSelectOrder={(order) => setSelectedOrderId(order?.id ?? null)}
          />
        )}

        {activeTab === "catalogue" && (
          <AdminCataloguePanel
            showForm={showProductForm}
            formClosing={productFormClosing}
            productForm={productForm}
            productLoading={productLoading}
            products={products}
            productsLoading={productsLoading || productsQuery.isFetching}
            loadingProductId={loadingProductId}
            productPage={productPage}
            productTotalPages={productTotalPages}
            onToggleForm={toggleProductForm}
            onFormChange={onFormChange}
            onSave={handleProductSave}
            onEdit={editProduct}
            onRequestDelete={requestProductDelete}
            onPageChange={handleProductPageChange}
          />
        )}
      </section>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
          showActions
          onAdvance={handleAdvance}
          onReject={handleReject}
          isTransitioning={isTransitioning}
        />
      )}

      {trackingModal.open && (
        <AdminTrackingModal
          onClose={() => setTrackingModal({ orderId: "", open: false })}
          onSubmit={handleTrackingSubmit}
        />
      )}

      {deleteConfirm.open && (
        <AdminDeleteConfirm
          productName={deleteConfirm.productName}
          loading={deleteProduct.isPending}
          onConfirm={handleProductDeleteConfirmed}
          onCancel={closeDeleteConfirm}
        />
      )}
    </div>
  );
}
