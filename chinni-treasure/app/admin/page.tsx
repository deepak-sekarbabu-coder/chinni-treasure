"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OrderDetailModal from "@/src/components/order/OrderDetailModal";
import StatusBadge from "@/src/components/ui/StatusBadge";
import AdminStatCard from "@/src/components/ui/AdminStatCard";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import { useToast } from "@/src/components/ui/ToastProvider";
import { ORDER_STATUS_FLOW } from "@/src/lib/constants";
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

const ORDER_STATUS_FILTERS = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "packaging", label: "Packaging" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected", label: "Rejected" },
];

const BADGE_OPTIONS = [
  { value: "", label: "None" },
  { value: "bestseller", label: "Bestseller" },
  { value: "new", label: "New" },
  { value: "premium", label: "Premium" },
  { value: "limited", label: "Limited" },
  { value: "luxury", label: "Luxury" },
];

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
  const ITEMS_PER_PAGE = 10;

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
  const [trackingId, setTrackingId] = useState("");
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

  async function fetchProducts() {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
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
      setTrackingId("");
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

  async function handleSubmitTracking() {
    if (!trackingId.trim()) return;
    const order = orders.find((o) => o.id === trackingModal.orderId);
    if (!order) return;
    setAdvancingOrderId(trackingModal.orderId);
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/orders/${trackingModal.orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "shipped", trackingId: trackingId.trim(), expectedVersion: order.version }),
      });
      if (res.ok) {
        await Promise.all([fetchOrders(trackingModal.orderId, currentPage), fetchStats()]);
        setTrackingModal({ orderId: "", open: false });
        setTrackingId("");
        showToast("Order marked as shipped successfully", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to ship order", "error");
      }
    } catch (err) {
      console.error("Failed to ship order:", err);
      showToast("Failed to ship order", "error");
    } finally {
      setIsTransitioning(false);
      setAdvancingOrderId(null);
    }
  }

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
        await fetchProducts();
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
    <div style={{ paddingTop: "80px" }}>
      {/* Admin Header */}
      <div
        style={{
          background: "var(--black)",
          borderBottom: "1px solid rgba(212, 175, 55, 0.1)",
          padding: "32px 0",
        }}
      >
        <div className="section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="section-subtitle" style={{ color: "var(--gold)" }}>Administrator Portal</div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--cream)" }}>
              Dashboard
            </h1>
          </div>                          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/docs" className="btn btn-secondary" style={{ padding: "10px 24px", textDecoration: "none" }}>
              API Docs
            </Link>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: "10px 24px" }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <section className="section" style={{ paddingTop: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
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
        <section className="section" style={{ paddingTop: "24px" }}>
          {chartsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Skeleton: Orders Chart */}
              <div className="admin-stat-card chart-skeleton" style={{ textAlign: "left" }}>
                <div className="skeleton-text" style={{ width: "180px", height: "18px", marginBottom: "20px" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { left: 130, right: 60 },
                    { left: 120, right: 55 },
                    { left: 100, right: 70 },
                    { left: 115, right: 50 },
                    { left: 125, right: 65 },
                    { left: 110, right: 58 },
                    { left: 95, right: 62 },
                    { left: 105, right: 48 },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="skeleton-text" style={{ width: `${item.left}px`, height: "12px" }} />
                      <div className="skeleton-text" style={{ width: `${item.right}px`, height: "12px" }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Skeleton: Top Products */}
              <div className="admin-stat-card chart-skeleton" style={{ textAlign: "left" }}>
                <div className="skeleton-text" style={{ width: "140px", height: "18px", marginBottom: "20px" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="skeleton-text" style={{ width: `${item.left}px`, height: "12px" }} />
                      <div className="skeleton-text" style={{ width: `${item.right}px`, height: "12px" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div className="admin-stat-card" style={{ textAlign: "left" }}>
                <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: "16px" }}>Orders (Last 30 Days)</h3>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxHeight: "200px", overflowY: "auto" }}>
                  {chartData.map((d) => (
                    <div key={d.date} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span>{d.date}</span>
                      <span>{d.orders} orders</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-stat-card" style={{ textAlign: "left" }}>
                <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: "16px" }}>Top Products</h3>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxHeight: "200px", overflowY: "auto" }}>
                  {productSales.slice(0, 10).map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
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
      <section className="section" style={{ paddingTop: "24px" }}>
        <div role="tablist" style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          {(["orders", "catalogue"] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`panel-${tab}`}
              className={`btn ${activeTab === tab ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "10px 24px", textTransform: "capitalize" }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "orders" ? "📋 Orders" : "📦 Catalogue"}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders">
            {/* Status Filters */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {ORDER_STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`btn ${statusFilter === f.key ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "8px 16px", fontSize: "0.65rem" }}
                  onClick={() => { setStatusFilter(f.key); setCurrentPage(1); fetchOrders(undefined, 1, f.key); }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div id="orders-list">
              {ordersLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`order-skeleton-${idx}`}
                    className="admin-stat-card order-card order-card-skeleton"
                    style={{
                      textAlign: "left",
                      marginBottom: "16px",
                      animationDelay: `${idx * 0.06}s`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div className="skeleton-text" style={{ width: "60px", height: "10px", marginBottom: "8px" }} />
                        <div className="skeleton-text" style={{ width: "140px", height: "16px" }} />
                      </div>
                      <div className="skeleton-block" style={{ width: "80px", height: "26px", borderRadius: "2px" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                      <div>
                        <div className="skeleton-text" style={{ width: "120px", height: "14px", marginBottom: "6px" }} />
                        <div className="skeleton-text" style={{ width: "90px", height: "12px" }} />
                      </div>
                      <div className="skeleton-text" style={{ width: "80px", height: "18px" }} />
                    </div>
                  </div>
                ))
              ) : orders.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                  No orders found.
                </p>
              ) : (
                orders.map((order) => {
                    const isAdvancing = advancingOrderId === order.id;
                    return (
                    <div
                      key={order.id}
                      className={`admin-stat-card order-card ${isAdvancing ? "order-card-advancing" : ""} ${selectedOrder?.id === order.id ? "order-card-selected" : ""}`}
                      style={{
                        textAlign: "left",
                        marginBottom: "16px",
                        cursor: isAdvancing ? "default" : "pointer",
                      }}
                      onClick={() => !isAdvancing && setSelectedOrder(order)}
                    >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
                          Order ID
                        </div>
                        <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginTop: "4px" }}>
                          {order.orderNumber}
                        </h4>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: "0.85rem" }}>{order.customerName}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", fontWeight: 600, color: "var(--gold-dark)" }}>
                          ₹{Number(order.totalAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "24px" }}>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage <= 1}
                  onClick={() => fetchOrders(undefined, currentPage - 1)}
                  style={{ padding: "8px 16px" }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => fetchOrders(undefined, currentPage + 1)}
                  style={{ padding: "8px 16px" }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Catalogue Tab */}
        {activeTab === "catalogue" && (
          <div id="panel-catalogue" role="tabpanel" aria-labelledby="tab-catalogue">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
              <button
                className={`btn ${showProductForm ? "btn-secondary product-add-btn cancel" : "btn-primary product-add-btn"}`}
                onClick={toggleProductForm}
              >
                {showProductForm ? "✕ Cancel" : "+ Add Product"}
              </button>
            </div>

            {/* Product Form */}
            <div className={`product-form-wrapper ${showProductForm ? "open" : ""} ${productFormClosing ? "closing" : ""}`}>
              <div className="product-form-inner">
                <div className="admin-stat-card" style={{ textAlign: "left" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: "20px" }}>
                    {productForm.id ? "Edit Product" : "Add New Product"}
                  </h3>
                  <form onSubmit={handleProductSave}>
                    <div className="admin-product-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className="form-group">
                        <label>Name *</label>
                        <input
                          type="text"
                          value={productForm.name}
                          onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                          required
                          style={{ background: "var(--cream-light)" }}
                        />
                      </div>
                      <div className="form-group">
                        <label>SKU</label>
                        <input
                          type="text"
                          value={productForm.sku}
                          onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))}
                          style={{ background: "var(--cream-light)" }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.price}
                          onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                          required
                          style={{ background: "var(--cream-light)" }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Stock Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.stockQuantity}
                          onChange={(e) => setProductForm((p) => ({ ...p, stockQuantity: e.target.value }))}
                          style={{ background: "var(--cream-light)" }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Image URL</label>
                        <input
                          type="url"
                          value={productForm.imageUrl}
                          onChange={(e) => setProductForm((p) => ({ ...p, imageUrl: e.target.value }))}
                          style={{ background: "var(--cream-light)" }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Badge</label>
                        <select
                          value={productForm.badge}
                          onChange={(e) => setProductForm((p) => ({ ...p, badge: e.target.value }))}
                          style={{ background: "var(--cream-light)" }}
                        >
                          {BADGE_OPTIONS.map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group full-width" style={{ gridColumn: "span 2" }}>
                        <label>Description</label>
                        <textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                          style={{ background: "var(--cream-light)" }}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className={`btn btn-dark product-action-btn ${productLoading ? "loading" : ""}`}
                      style={{ marginTop: "16px" }}
                      disabled={productLoading}
                    >
                      {productLoading && <span className="btn-spinner"></span>}
                      {productLoading
                        ? (productForm.id ? "Updating..." : "Creating...")
                        : (productForm.id ? "Update Product" : "Create Product")
                      }
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--gold)", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", letterSpacing: "1px", fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Image</th>
                    <th style={{ padding: "12px 16px", letterSpacing: "1px", fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Name</th>
                    <th style={{ padding: "12px 16px", letterSpacing: "1px", fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>SKU</th>
                    <th style={{ padding: "12px 16px", letterSpacing: "1px", fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Price</th>
                    <th style={{ padding: "12px 16px", letterSpacing: "1px", fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Stock</th>
                    <th style={{ padding: "12px 16px", letterSpacing: "1px", fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Badge</th>
                    <th style={{ padding: "12px 16px", letterSpacing: "1px", fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="product-table-skeleton"
                        style={{ animationDelay: `${idx * 0.06}s` }}
                      >
                        <td style={{ padding: "10px 16px" }}>
                          <div className="skeleton-block" style={{ width: "40px", height: "50px", borderRadius: "4px" }} />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <div className="skeleton-text skeleton-text-name" />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <div className="skeleton-text skeleton-text-sku" />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <div className="skeleton-text skeleton-text-price" />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <div className="skeleton-text skeleton-text-stock" />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <div className="skeleton-text skeleton-text-badge" />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <div className="skeleton-block" style={{ width: "50px", height: "28px", borderRadius: "2px" }} />
                            <div className="skeleton-block" style={{ width: "60px", height: "28px", borderRadius: "2px" }} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    products.map((p, idx) => {
                      const isDeleting = loadingProductId === p.id;
                      return (
                        <tr
                          key={p.id}
                          className={`product-table-row ${isDeleting ? "removing" : ""}`}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            animationDelay: `${idx * 0.04}s`,
                          }}
                        >
                          <td style={{ padding: "10px 16px" }}>
                            {p.imageUrl ? (
                              <Image
                                src={p.imageUrl}
                                alt={p.name}
                                width={40}
                                height={50}
                                style={{ objectFit: "cover", borderRadius: "4px" }}
                              />
                            ) : (
                              <div style={{ width: "40px", height: "50px", background: "var(--dark-gray)", borderRadius: "4px" }} />
                            )}
                          </td>
                          <td style={{ padding: "10px 16px", fontWeight: 500 }}>{p.name}</td>
                          <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.sku || "—"}</td>
                          <td style={{ padding: "10px 16px", color: "var(--gold-dark)", fontWeight: 600 }}>₹{Number(p.price).toFixed(2)}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <span className={`stock-badge ${p.stockQuantity <= 0 ? "empty" : p.stockQuantity <= 3 ? "low" : "in-stock"}`}>
                              {p.stockQuantity}
                            </span>
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            {p.badge ? (
                              <span className="status-badge pending" style={{ fontSize: "0.6rem" }}>{p.badge}</span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                className="btn btn-secondary product-action-btn"
                                style={{ padding: "4px 12px", fontSize: "0.65rem" }}
                                onClick={() => editProduct(p)}
                                disabled={isDeleting}
                              >
                                Edit
                              </button>
                              <button
                                className={`btn btn-danger product-action-btn ${isDeleting ? "loading" : ""}`}
                                style={{ padding: "4px 12px", fontSize: "0.65rem" }}
                                onClick={() => requestProductDelete(p)}
                                disabled={isDeleting}
                              >
                                {isDeleting && <span className="btn-spinner"></span>}
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
        <div className="modal-overlay active" onClick={() => setTrackingModal({ orderId: "", open: false })} onKeyDown={(e) => { if (e.key === "Escape") setTrackingModal({ orderId: "", open: false }); }}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="tracking-modal-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h2 id="tracking-modal-title">Enter Tracking ID</h2>
              <button className="modal-close" onClick={() => setTrackingModal({ orderId: "", open: false })}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "16px", color: "var(--text-muted)" }}>
                Please provide the courier tracking ID to mark this order as shipped.
              </p>
              <div className="form-group">
                <label htmlFor="tracking-id-input">Courier Tracking ID *</label>
                <input
                  id="tracking-id-input"
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. TRACK-123456"
                  style={{ background: "var(--cream-light)" }}
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button className="btn btn-success" onClick={handleSubmitTracking} disabled={!trackingId.trim()}>
                  Mark as Shipped
                </button>
                <button className="btn btn-secondary" onClick={() => setTrackingModal({ orderId: "", open: false })}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="modal-overlay active" onClick={closeDeleteConfirm} onKeyDown={(e) => { if (e.key === "Escape") closeDeleteConfirm(); }}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <h2 id="delete-modal-title">Confirm Delete</h2>
              <button className="modal-close" onClick={closeDeleteConfirm}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "10px", color: "var(--text-muted)" }}>
                This action will permanently remove the product from your catalogue.
              </p>
              <div
                style={{
                  background: "var(--cream-light)",
                  border: "1px solid rgba(231, 76, 60, 0.25)",
                  borderRadius: "6px",
                  padding: "14px 16px",
                  marginBottom: "18px",
                }}
              >
                <p style={{ fontSize: "0.7rem", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Product
                </p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", color: "var(--near-black)" }}>
                  {deleteConfirm.productName}
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  className={`btn btn-danger ${loadingProductId === deleteConfirm.productId ? "loading" : ""}`}
                  onClick={handleProductDeleteConfirmed}
                  disabled={loadingProductId === deleteConfirm.productId}
                >
                  {loadingProductId === deleteConfirm.productId && <span className="btn-spinner"></span>}
                  {loadingProductId === deleteConfirm.productId ? "Deleting..." : "Yes, Delete Product"}
                </button>
                <button className="btn btn-secondary" onClick={closeDeleteConfirm} autoFocus>
                  Keep Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
