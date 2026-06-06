"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OrderDetailModal from "@/src/components/order/OrderDetailModal";
import AdminStatCard from "@/src/components/ui/AdminStatCard";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import { useToast } from "@/src/components/ui/ToastProvider";
import { ORDER_STATUS_FLOW } from "@/src/lib/constants";
import AdminTrackingModal from "@/src/components/admin/AdminTrackingModal";
import AdminDeleteConfirm from "@/src/components/admin/AdminDeleteConfirm";
import AdminOrdersPanel from "@/src/components/admin/AdminOrdersPanel";
import AdminCataloguePanel from "@/src/components/admin/AdminCataloguePanel";
interface Stats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  packagingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
}

interface ChartPoint {
  date: string;
  orders: number;
  revenue: number;
}

interface ProductSales {
  productName: string;
  quantity: number;
  revenue: number;
}

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  version: number;
  trackingId?: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  createdAt: string;
  transactionId?: string;
  customerNotes?: string;
  items: OrderItem[];
  addressLine1: string;
  city: string;
  stateCode: string;
  postalCode: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  stockQuantity: number;
  badge: string | null;
  category: { name: string } | null;
  categoryId: number | null;
  sku: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "catalogue">("orders");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const PRODUCTS_PER_PAGE = 12;

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productFormClosing, setProductFormClosing] = useState(false);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    sku: "",
    description: "",
    price: "",
    stockQuantity: "",
    imageUrl: "",
    badge: "",
    categoryId: "",
  });
  // Tracking modal
  const [trackingModal, setTrackingModal] = useState<{ orderId: string; open: boolean }>({
    orderId: "",
    open: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; productId: string; productName: string }>({
    open: false,
    productId: "",
    productName: "",
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        setAuthenticated(true);
        await Promise.all([fetchStats(), fetchOrders(undefined, 1), fetchProducts()]);
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchStats() {
    setChartsLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setChartData(data.chartData);
        setProductSales(data.productSalesData);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      showToast("Failed to load stats", "error");
    } finally {
      setChartsLoading(false);
    }
  }

  async function fetchOrders(currentSelectedId?: string, pageNum?: number, statusParam?: string) {
    setOrdersLoading(true);
    try {
      const page = pageNum ?? currentPage;
      const status = statusParam ?? statusFilter;
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
        if (currentSelectedId) {
          const updated = data.orders.find((o: Order) => o.id === currentSelectedId);
          if (updated) {
            setSelectedOrder(updated);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      showToast("Failed to load orders", "error");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function fetchProducts(pageNum?: number) {
    setProductsLoading(true);
    try {
      const page = pageNum ?? productPage;
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PRODUCTS_PER_PAGE));
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setProductTotalPages(data.totalPages);
        setProductPage(data.page);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      showToast("Failed to load products", "error");
    } finally {
      setProductsLoading(false);
    }
  }

  const handleAdvance = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= ORDER_STATUS_FLOW.length - 1) return;

    const nextStatus = ORDER_STATUS_FLOW.find((_, i) => i === currentIdx + 1);

    // If next is shipped, ask for tracking ID
    if (nextStatus === "shipped") {
      setTrackingModal({ orderId: order.id, open: true });
      return;
    }

    setAdvancingOrderId(orderId);
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, expectedVersion: order.version }),
      });
      if (res.ok) {
        await Promise.all([fetchOrders(orderId, currentPage), fetchStats()]);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to update status", "error");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("Failed to update status", "error");
    } finally {
      setIsTransitioning(false);
      setAdvancingOrderId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, currentPage]);

  const handleReject = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setAdvancingOrderId(orderId);
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", expectedVersion: order.version }),
      });
      if (res.ok) {
        await Promise.all([fetchOrders(orderId, currentPage), fetchStats()]);
        setSelectedOrder(null);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to reject order", "error");
      }
    } catch (err) {
      console.error("Failed to reject order:", err);
      showToast("Failed to reject order", "error");
    } finally {
      setIsTransitioning(false);
      setAdvancingOrderId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, currentPage]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to export data", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      a.download = match ? match[1] : `chinni-treasure-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Export downloaded successfully", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Failed to export data", "error");
    }
  }

  async function handleProductSave(e: React.FormEvent) {
    e.preventDefault();
    const isEdit = !!productForm.id;
    const url = isEdit ? `/api/products/${productForm.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    setProductLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productForm.name,
          sku: productForm.sku || undefined,
          description: productForm.description,
          price: parseFloat(productForm.price),
          stockQuantity: parseInt(productForm.stockQuantity) || 0,
          imageUrl: productForm.imageUrl || undefined,
          badge: productForm.badge || null,
          categoryId: productForm.categoryId ? parseInt(productForm.categoryId) : null,
        }),
      });
      if (res.ok) {
        setProductPage(1);
        await fetchProducts(1);
        resetProductForm();
        setShowProductForm(false);
        setProductFormClosing(false);
        showToast(
          isEdit ? `Product "${productForm.name}" updated successfully` : `Product "${productForm.name}" created successfully`,
          "success"
        );
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to save product", "error");
      }
    } catch (err) {
      console.error("Failed to save product:", err);
      showToast("Failed to save product", "error");
    } finally {
      setProductLoading(false);
    }
  }

  function requestProductDelete(product: Product) {
    setDeleteConfirm({
      open: true,
      productId: product.id,
      productName: product.name,
    });
  }

  function closeDeleteConfirm() {
    setDeleteConfirm({ open: false, productId: "", productName: "" });
  }

  async function handleProductDeleteConfirmed() {
    if (!deleteConfirm.productId) return;
    setLoadingProductId(deleteConfirm.productId);
    try {
      const res = await fetch(`/api/products/${deleteConfirm.productId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchProducts();
        showToast("Product deleted successfully", "success");
        closeDeleteConfirm();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to delete product", "error");
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      showToast("Failed to delete product", "error");
    } finally {
      setLoadingProductId(null);
    }
  }

  function toggleProductForm() {
    if (showProductForm) {
      setProductFormClosing(true);
      setTimeout(() => {
        setShowProductForm(false);
        setProductFormClosing(false);
        resetProductForm();
      }, 300);
    } else {
      resetProductForm();
      setShowProductForm(true);
    }
  }

  function editProduct(product: Product) {
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
  }

  function resetProductForm() {
    setProductForm({
      id: "", name: "", sku: "", description: "", price: "",
      stockQuantity: "", imageUrl: "", badge: "", categoryId: "",
    });
  }

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!authenticated) return null;

  return (
    <div className="admin-page-root">
      {/* Admin Header */}
      <div className="admin-top-header">
        <div className="section admin-header-row">
          <div>
            <div className="section-subtitle text-gold">Administrator Portal</div>
            <h1 className="admin-heading">
              Dashboard
            </h1>
          </div>                          <div className="admin-header-actions">
            <Link href="/docs" className="btn btn-secondary btn-link btn-lg">
              API Docs
            </Link>
            <button className="btn btn-secondary btn-lg" onClick={handleExport}>
              Export Excel
            </button>
            <button className="btn btn-secondary btn-lg" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <section className="section section-top-lg">
          <div className="stats-grid">
            {[
              { label: "Total Orders", value: stats.totalOrders, color: "var(--gold)" },
              { label: "Pending", value: stats.pendingOrders, color: "var(--warning)" },
              { label: "Approved", value: stats.approvedOrders, color: "var(--success)" },
              { label: "Shipped", value: stats.shippedOrders, color: "#9b59b6" },
              { label: "Delivered", value: stats.deliveredOrders, color: "var(--success)" },
              { label: "Revenue", value: `₹${Number(stats.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: "var(--gold-dark)" },
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

      {/* Charts Section (placeholder for Chart.js - will render a simple table instead) */}
      {(chartsLoading || chartData.length > 0) && (
        <section className="section section-top-md">
          {chartsLoading ? (
            <div className="charts-grid">
              {/* Skeleton: Orders Chart */}
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
          ) : (
            <div className="charts-grid">
              <div className="admin-stat-card text-left">
                <h3 className="font-serif mb-16">Orders (Last 30 Days)</h3>
                <div className="chart-scroll">
                  {chartData.map((d) => (
                    <div key={d.date} className="chart-row">
                      <span>{d.date}</span>
                      <span>{d.orders} orders</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-stat-card text-left">
                <h3 className="font-serif mb-16">Top Products</h3>
                <div className="chart-scroll">
                  {productSales.slice(0, 10).map((p, i) => (
                    <div key={i} className="chart-row">
                      <span>{p.productName}</span>
                      <span>{p.quantity} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tabs */}
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

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <AdminOrdersPanel
            orders={orders}
            loading={ordersLoading}
            statusFilter={statusFilter}
            onStatusFilterChange={(key) => { setStatusFilter(key); fetchOrders(undefined, 1, key); }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => fetchOrders(undefined, page)}
            advancingOrderId={advancingOrderId}
            selectedOrder={selectedOrder}
            onSelectOrder={(order) => setSelectedOrder(order)}
          />
        )}

        {/* Catalogue Tab */}
        {activeTab === "catalogue" && (
          <AdminCataloguePanel
            showForm={showProductForm}
            formClosing={productFormClosing}
            productForm={productForm}
            productLoading={productLoading}
            products={products}
            productsLoading={productsLoading}
            loadingProductId={loadingProductId}
            productPage={productPage}
            productTotalPages={productTotalPages}
            onToggleForm={toggleProductForm}
            onFormChange={(form) => setProductForm(form)}
            onSave={handleProductSave}
            onEdit={editProduct}
            onRequestDelete={requestProductDelete}
            onPageChange={fetchProducts}
          />
        )}
      </section>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          showActions
          onAdvance={handleAdvance}
          onReject={handleReject}
          isTransitioning={isTransitioning}
        />
      )}

      {/* Tracking ID Modal */}
      {trackingModal.open && (
        <AdminTrackingModal
          onClose={() => setTrackingModal({ orderId: "", open: false })}
          onSubmit={async (trackingId) => {
            setAdvancingOrderId(trackingModal.orderId);
            setIsTransitioning(true);
            try {
              const order = orders.find((o) => o.id === trackingModal.orderId);
              if (!order) return;
              const res = await fetch(`/api/orders/${trackingModal.orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "shipped", trackingId, expectedVersion: order.version }),
              });
              if (res.ok) {
                await Promise.all([fetchOrders(trackingModal.orderId, currentPage), fetchStats()]);
                setTrackingModal({ orderId: "", open: false });
                showToast("Order marked as shipped successfully", "success");
              } else {
                const data = await res.json().catch(() => ({}));
                showToast(data.error || "Failed to ship order", "error");
              }
            } catch {
              showToast("Failed to ship order", "error");
            } finally {
              setIsTransitioning(false);
              setAdvancingOrderId(null);
            }
          }}
        />
      )}

      {/* Product Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <AdminDeleteConfirm
          productName={deleteConfirm.productName}
          loading={loadingProductId === deleteConfirm.productId}
          onConfirm={handleProductDeleteConfirmed}
          onCancel={closeDeleteConfirm}
        />
      )}
    </div>
  );
}
