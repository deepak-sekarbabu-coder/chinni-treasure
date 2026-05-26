"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import OrderDetailModal from "@/src/components/order/OrderDetailModal";
import StatusBadge from "@/src/components/ui/StatusBadge";
import AdminStatCard from "@/src/components/ui/AdminStatCard";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
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

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
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
  const [categories] = useState<{ id: number; name: string }[]>([
    { id: 1, name: "Accessories" },
    { id: 2, name: "Apparel" },
    { id: 3, name: "Watches" },
    { id: 4, name: "Home" },
  ]);

  // Tracking modal
  const [trackingModal, setTrackingModal] = useState<{ orderId: string; open: boolean }>({
    orderId: "",
    open: false,
  });
  const [trackingId, setTrackingId] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      setAuthenticated(true);
      await Promise.all([fetchStats(), fetchOrders(), fetchProducts()]);
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
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
    }
  }

  async function fetchOrders(currentSelectedId?: string) {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        if (currentSelectedId) {
          const updated = data.find((o: Order) => o.id === currentSelectedId);
          if (updated) {
            setSelectedOrder(updated);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }

  const handleAdvance = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= ORDER_STATUS_FLOW.length - 1) return;

    const nextStatus = ORDER_STATUS_FLOW[currentIdx + 1];

    // If next is shipped, ask for tracking ID
    if (nextStatus === "shipped") {
      setTrackingModal({ orderId: order.id, open: true });
      setTrackingId("");
      return;
    }

    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await Promise.all([fetchOrders(orderId), fetchStats()]);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsTransitioning(false);
    }
  }, [orders]);

  async function handleSubmitTracking() {
    if (!trackingId.trim()) return;
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/orders/${trackingModal.orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "shipped", trackingId: trackingId.trim() }),
      });
      if (res.ok) {
        await Promise.all([fetchOrders(trackingModal.orderId), fetchStats()]);
        setTrackingModal({ orderId: "", open: false });
        setTrackingId("");
      }
    } catch (err) {
      console.error("Failed to ship order:", err);
    } finally {
      setIsTransitioning(false);
    }
  }

  const handleReject = useCallback(async (orderId: string) => {
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (res.ok) {
        await Promise.all([fetchOrders(orderId), fetchStats()]);
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error("Failed to reject order:", err);
    } finally {
      setIsTransitioning(false);
    }
  }, []);

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
      }
    } catch (err) {
      console.error("Failed to save product:", err);
    } finally {
      setProductLoading(false);
    }
  }

  async function handleProductDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setLoadingProductId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchProducts();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
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
      categoryId: product.category?.name ? "1" : "",
    });
    setShowProductForm(true);
  }

  function resetProductForm() {
    setProductForm({
      id: "", name: "", sku: "", description: "", price: "",
      stockQuantity: "", imageUrl: "", badge: "", categoryId: "",
    });
  }

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

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
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: "10px 24px" }}>
            Logout
          </button>
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
            ].map((s) => (
              <AdminStatCard key={s.label} {...s} />
            ))}
          </div>
        </section>
      )}

      {/* Charts Section (placeholder for Chart.js - will render a simple table instead) */}
      {chartData.length > 0 && (
        <section className="section" style={{ paddingTop: "24px" }}>
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
        </section>
      )}

      {/* Tabs */}
      <section className="section" style={{ paddingTop: "24px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          {(["orders", "catalogue"] as const).map((tab) => (
            <button
              key={tab}
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
          <>
            {/* Status Filters */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {ORDER_STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`btn ${statusFilter === f.key ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "8px 16px", fontSize: "0.65rem" }}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div id="orders-list">
              {filteredOrders.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                  No orders found.
                </p>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="admin-stat-card"
                    style={{
                      textAlign: "left",
                      marginBottom: "16px",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedOrder(order)}
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
                ))
              )}
            </div>
          </>
        )}

        {/* Catalogue Tab */}
        {activeTab === "catalogue" && (
          <>
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
                  {products.map((p, idx) => {
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
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              style={{ width: "40px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
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
                              onClick={() => handleProductDelete(p.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting && <span className="btn-spinner"></span>}
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
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
        <div className="modal-overlay active" onClick={() => setTrackingModal({ orderId: "", open: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h2>Enter Tracking ID</h2>
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
    </div>
  );
}
