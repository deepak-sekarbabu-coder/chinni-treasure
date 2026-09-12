import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ICONS,
  ORDER_STATUS_VOCABULARY,
} from "@/src/lib/constants";

interface Props {
  status: string;
  icon?: boolean;
}

type StatusKey = keyof typeof ORDER_STATUS_VOCABULARY.labels;
export default function StatusBadge({ status, icon = true }: Props) {
  return (
    <span className={`status-badge ${status}`}>
      {icon && <>{ORDER_STATUS_ICONS[status as StatusKey] || "●"} </>}
      {ORDER_STATUS_LABELS[status as StatusKey] || status}
    </span>
  );
}
