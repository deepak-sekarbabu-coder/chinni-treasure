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

const CHART_W = 560;
const CHART_H = 200;
const CHART_TOP = 8;
const CHART_BASELINE = 184;
const CHART_PLOT_H = CHART_BASELINE - CHART_TOP;

const CHART_GRID_FRACTIONS = [1, 0.5];

function OrdersChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return null;

  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const best = data.reduce((winner, d) =>
    d.orders > winner.orders ? d : winner,
  );

  const slot = CHART_W / data.length;
  const barWidth = Math.min(14, slot - 4);
  const labelIndexes = data
    .map((_, i) => i)
    .filter((i) => i === 0 || i === data.length - 1 || i % 5 === 0);

  const chartLabel = `Orders per day over the last 30 days. Total ${totalOrders} orders; highest day ${best.orders} orders on ${fmtDate.format(new Date(best.date))}.`;

  return (
    <div className="admin-stat-card text-left">
      <div className="orders-chart-header">
        <h2 className="font-serif">Orders (Last 30 Days)</h2>
        <p className="orders-chart-summary">
          <strong>{totalOrders}</strong> total · peak{" "}
          <strong>{best.orders}</strong> on {fmtDate.format(new Date(best.date))}
        </p>
      </div>
      <svg
        className="orders-chart"
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        role="img"
        aria-label={chartLabel}
      >
        {CHART_GRID_FRACTIONS.map((f) => (
          <line
            key={f}
            className="orders-chart-gridline"
            x1={0}
            x2={CHART_W}
            y1={CHART_TOP + (1 - f) * CHART_PLOT_H}
            y2={CHART_TOP + (1 - f) * CHART_PLOT_H}
          />
        ))}
        <text className="orders-chart-caption" x={4} y={16}>
          {maxOrders}
        </text>
        <line
          className="orders-chart-baseline"
          x1={0}
          x2={CHART_W}
          y1={CHART_BASELINE}
          y2={CHART_BASELINE}
        />
        {data.map((d, i) => {
          const height = Math.max((d.orders / maxOrders) * CHART_PLOT_H, 2);
          const x = i * slot + (slot - barWidth) / 2;
          const y = CHART_BASELINE - height;
          const isToday = i === data.length - 1;
          return (
            <rect
              key={d.date}
              className={`orders-chart-bar${isToday ? " orders-chart-bar--today" : ""}`}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              rx={2}
              style={{ animationDelay: `${i * 12}ms` }}
              data-testid={isToday ? "orders-chart-today" : undefined}
            />
          );
        })}
        {labelIndexes.map((i) => (
          <text
            key={i}
            className={`orders-chart-axis-label${i === data.length - 1 ? " orders-chart-axis-label--strong" : ""}`}
            x={i * slot + slot / 2}
            y={CHART_BASELINE + 16}
            textAnchor="middle"
          >
            {fmtDate.format(new Date(data[i].date))}
          </text>
        ))}
      </svg>
    </div>
  );
}

function TopProductsChart({ data }: { data: ProductSales[] }) {
  const maxQty = Math.max(...data.map((p) => p.quantity), 1);
  return (
    <div className="admin-stat-card text-left">
      <h2 className="font-serif mb-16">Top Products</h2>
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
