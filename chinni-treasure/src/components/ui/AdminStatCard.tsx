interface Props {
  value: string | number;
  label: string;
  color: string;
}

export default function AdminStatCard({ value, label, color }: Props) {
  return (
    <div
      className="admin-stat-card"
      style={{
        textAlign: "center",
        borderTop: `3px solid ${color}`,
      }}
    >
      <div
        className="stat-value"
        style={{
          color,
          fontFamily: "var(--font-serif)",
        }}
      >
        {value}
      </div>
      <div className="stat-label">
        {label}
      </div>
    </div>
  );
}
