"use client";

import AdminStatCard from "@/src/components/ui/AdminStatCard";
import { ORDER_STATUS_ALL, ORDER_STATUS_LABELS } from "@/src/lib/constants";
import type { Stats } from "@/src/lib/api/schemas";
import { formatINR } from "@/src/lib/format";

interface Props {
  stats: Stats | null;
}

/** Accent per status, so a status without one falls back rather than vanishing. */
const STATUS_COLORS: Record<string, string> = {
  pending: "var(--warning)",
  approved: "var(--success)",
  packaging: "#9b59b6",
  shipped: "#9b59b6",
  delivered: "var(--success)",
  rejected: "var(--text-muted)",
};

/**
 * One tile per status in the Fulfilment vocabulary, plus totals. The status
 * list is read from `ORDER_STATUS_ALL` rather than hand-picked, so a status
 * the stats module computes is also one the dashboard shows — previously
 * `packaging` and `rejected` were both computed and never rendered.
 */
function buildStatTiles(stats: Stats) {
  return [
    { label: "Total Orders", value: stats.totalOrders, color: "var(--gold)" },
    ...ORDER_STATUS_ALL.map((status) => ({
      label: ORDER_STATUS_LABELS[status],
      value: stats[`${status}Orders` as keyof Stats] as number,
      color: STATUS_COLORS[status] ?? "var(--text-muted)",
    })),
    {
      label: "Revenue",
      value: `₹${formatINR(Number(stats.totalRevenue))}`,
      color: "var(--gold-deep)",
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
