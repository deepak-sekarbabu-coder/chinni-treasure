"use client";

import AdminStatCard from "@/src/components/ui/AdminStatCard";
import type { Stats } from "@/src/lib/api/schemas";

interface Props {
  stats: Stats | null;
}

const REVENUE_FORMAT = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function buildStatTiles(stats: Stats) {
  return [
    { label: "Total Orders", value: stats.totalOrders, color: "var(--gold)" },
    { label: "Pending", value: stats.pendingOrders, color: "var(--warning)" },
    { label: "Approved", value: stats.approvedOrders, color: "var(--success)" },
    { label: "Shipped", value: stats.shippedOrders, color: "#9b59b6" },
    { label: "Delivered", value: stats.deliveredOrders, color: "var(--success)" },
    {
      label: "Revenue",
      value: `₹${REVENUE_FORMAT.format(Number(stats.totalRevenue))}`,
      color: "var(--gold-dark)",
    },
  ];
}

export default function AdminStatsGrid({ stats }: Props) {
  if (!stats) return null;

  const tiles = buildStatTiles(stats);

  return (
    <section className="section section-top-lg">
      <div className="stats-grid">
        {tiles.map((s, idx) => (
          <div
            key={s.label}
            style={{
              animation: "fadeIn 0.4s var(--ease-out) both",
              animationDelay: `${idx * 0.08}s`,
            }}
          >
            <AdminStatCard label={s.label} value={s.value} color={s.color} />
          </div>
        ))}
      </div>
    </section>
  );
}
