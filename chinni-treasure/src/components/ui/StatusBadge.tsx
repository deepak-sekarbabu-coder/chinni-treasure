import { ORDER_STATUS_LABELS, ORDER_STATUS_ICONS, type OrderStatusKey } from "@/src/lib/constants";

interface Props {
  status: string;
  icon?: boolean;
}

export default function StatusBadge({ status, icon = true }: Props) {
  return (
    <span className={`status-badge ${status}`}>
      {icon && <>{ORDER_STATUS_ICONS[status as OrderStatusKey] || "●"} </>}
      {ORDER_STATUS_LABELS[status as OrderStatusKey] || status}
    </span>
  );
}
