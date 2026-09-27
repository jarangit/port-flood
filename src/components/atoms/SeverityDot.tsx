import type { CurrentStatus } from "@/config/status-levels";
import { cn } from "@/lib/utils";

const statusClassNames: Record<CurrentStatus, string> = {
  normal: "bg-status-normal",
  watch: "bg-status-watch",
  warning: "bg-status-warning",
  critical: "bg-status-critical",
};

type SeverityDotProps = {
  status: CurrentStatus;
  label: string;
};

export function SeverityDot({ status, label }: SeverityDotProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={cn("h-2.5 w-2.5 rounded-full", statusClassNames[status])} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
