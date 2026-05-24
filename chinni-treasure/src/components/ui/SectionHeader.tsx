interface Props {
  subtitle: string;
  title: string;
  description?: string;
  style?: React.CSSProperties;
}

export default function SectionHeader({
  subtitle,
  title,
  description,
  style,
}: Props) {
  return (
    <div className="section-header fade-in visible" style={style}>
      <div className="section-subtitle">{subtitle}</div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
