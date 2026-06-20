"use client";

import type { ChartPoint, ProductSales } from "@/src/lib/api/schemas";

const fmtDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

interface Props {
  loading: boolean;
  chartData: ChartPoint[];
  productSales: ProductSales[];
}

const SKELETON_ROWS = [
  { left: 110, right: 45 },
  { left: 130, right: 55 },
  { left: 95, right: 50 },
  { left: 120, right: 60 },
  { left: 140, right: 40 },
  { left: 100, right: 48 },
  { left: 115, right: 52 },
  { left: 125, right: 58 },
];

function ChartSkeleton() {
  return (
    <div className="charts-grid">
      <div className="admin-stat-card chart-skeleton text-left">
        <div className="skeleton-text" style={{ width: "180px", height: "18px", marginBottom: "20px" }} />
        <div className="flex flex-col gap-12">
          {SKELETON_ROWS.map((item, idx) => (
            <div key={idx} className="skeleton-row">
              <div className="skeleton-text" style={{ width: `${item.left}px`, height: "12px" }} />
              <div className="skeleton-text" style={{ width: `${item.right}px`, height: "12px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersChart({ data }: { data: ChartPoint[] }) {
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  return (
    <div className="admin-stat-card text-left">
      <h3 className="font-serif mb-16">Orders (Last 30 Days)</h3>
      <div className="chart-scroll">
        {data.map((d) => (
          <div key={d.date} className="chart-row">
            <span className="chart-date">{fmtDate.format(new Date(d.date))}</span>
            <div className="chart-bar-wrap">
              <div className="chart-bar" style={{ width: `${(d.orders / maxOrders) * 100}%` }} />
            </div>
            <span className="chart-value">{d.orders}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProductsChart({ data }: { data: ProductSales[] }) {
  const maxQty = Math.max(...data.map((p) => p.quantity), 1);
  return (
    <div className="admin-stat-card text-left">
      <h3 className="font-serif mb-16">Top Products</h3>
      <div className="chart-scroll">
        {data.slice(0, 10).map((p, i) => (
          <div key={`${p.productName}-${i}`} className="chart-row">
            <span className="chart-product-name tooltip-wrapper">
              {p.productName}
              <span className="tooltip-text">{p.productName}</span>
            </span>
            <div className="chart-bar-wrap">
              <div
                className="chart-bar chart-bar-gold"
                style={{ width: `${(p.quantity / maxQty) * 100}%` }}
              />
            </div>
            <span className="chart-value">{p.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminChartsSection({ loading, chartData, productSales }: Props) {
  if (loading) {
    return (
      <section className="section section-top-md">
        <ChartSkeleton />
      </section>
    );
  }

  if (chartData.length === 0) {
    return <section className="section section-top-md" />;
  }

  return (
    <section className="section section-top-md">
      <div className="charts-grid">
        <OrdersChart data={chartData} />
        <TopProductsChart data={productSales} />
      </div>
    </section>
  );
}
