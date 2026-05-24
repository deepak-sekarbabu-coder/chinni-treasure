import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ICONS,
} from "@/src/lib/constants";

interface Props {
  status: string;
  icon?: boolean;
}

export default function StatusBadge({ status, icon = true }: Props) {
  return (
    <span className={`status-badge ${status}`}>
      {icon && <>{ORDER_STATUS_ICONS[status] || "●"} </>}
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}
