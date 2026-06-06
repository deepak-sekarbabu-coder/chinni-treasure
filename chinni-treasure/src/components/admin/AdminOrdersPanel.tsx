"use client";

import StatusBadge from "@/src/components/ui/StatusBadge";
import { ORDER_STATUS_FILTERS } from "@/src/lib/constants";

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

interface Props {
  orders: Order[];
  loading: boolean;
  statusFilter: string;
  onStatusFilterChange: (key: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  advancingOrderId: string | null;
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
}

export default function AdminOrdersPanel({
  orders,
  loading,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  totalPages,
  onPageChange,
  advancingOrderId,
  selectedOrder,
  onSelectOrder,
}: Props) {
  function handleFilterClick(key: string) {
    onStatusFilterChange(key);
    onPageChange(1);
  }

  return (
    <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders">
      <div className="filters-bar">
        {ORDER_STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`btn btn-sm ${statusFilter === f.key ? "btn-primary" : "btn-secondary"}`}
            onClick={() => handleFilterClick(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div id="orders-list">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`order-skeleton-${idx}`}
              className="admin-stat-card order-card order-card-skeleton text-left"
              style={{ marginBottom: "16px", animationDelay: `${idx * 0.06}s` }}
            >
              <div className="order-card-header">
                <div className="skeleton-grow">
                  <div className="skeleton-text" style={{ width: "60px", height: "10px", marginBottom: "8px" }} />
                  <div className="skeleton-text" style={{ width: "140px", height: "16px" }} />
                </div>
                <div className="skeleton-block" style={{ width: "80px", height: "26px", borderRadius: "2px" }} />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="skeleton-text" style={{ width: "120px", height: "14px", marginBottom: "6px" }} />
                  <div className="skeleton-text" style={{ width: "90px", height: "12px" }} />
                </div>
                <div className="skeleton-text" style={{ width: "80px", height: "18px" }} />
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <p className="empty-state">No orders found.</p>
        ) : (
          orders.map((order) => {
            const isAdvancing = advancingOrderId === order.id;
            return (
              <div
                key={order.id}
                className={`admin-stat-card order-card text-left ${isAdvancing ? "order-card-advancing" : ""} ${selectedOrder?.id === order.id ? "order-card-selected" : ""}`}
                style={{ marginBottom: "16px", cursor: isAdvancing ? "default" : "pointer" }}
                onClick={() => !isAdvancing && onSelectOrder(order)}
              >
                <div className="order-card-header">
                  <div>
                    <div className="order-card-label">Order ID</div>
                    <h4 className="order-card-number">{order.orderNumber}</h4>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="order-card-name">{order.customerName}</p>
                    <p className="order-card-date">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <span className="order-card-price">₹{Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            ← Prev
          </button>
          <span className="pagination-text">Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
