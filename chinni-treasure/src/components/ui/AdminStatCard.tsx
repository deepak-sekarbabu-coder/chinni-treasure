interface Props {
  value: string | number;
  label: string;
  color: string;
}

export default function AdminStatCard({ value, label, color }: Props) {
  return (
    <div className="admin-stat-card" style={{ textAlign: "center" }}>
      <div
        className="stat-value"
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color,
          fontFamily: "var(--font-serif)",
        }}
      >
        {value}
      </div>
      <div
        className="stat-label"
        style={{
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginTop: "6px",
        }}
      >
        {label}
      </div>
    </div>
  );
}
