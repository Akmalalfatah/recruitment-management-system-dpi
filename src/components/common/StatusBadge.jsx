import { STATUS_BADGE_STYLE } from "../../lib/constants";

export default function StatusBadge({ status }) {
  const style = STATUS_BADGE_STYLE[status] || STATUS_BADGE_STYLE["-"];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white ${style}`}>
      {status || "-"}
    </span>
  );
}
