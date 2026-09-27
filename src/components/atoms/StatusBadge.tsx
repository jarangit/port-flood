import { cva, type VariantProps } from "class-variance-authority";

import { Badge } from "@/components/ui/badge";
import { currentStatusLabels } from "@/config/status-levels";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva("border-transparent", {
  variants: {
    status: {
      normal: "bg-status-normal/10 text-status-normal",
      watch: "bg-status-watch/10 text-status-watch",
      warning: "bg-status-warning/10 text-status-warning",
      critical: "bg-status-critical/10 text-status-critical",
    },
  },
  defaultVariants: {
    status: "normal",
  },
});

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  className?: string;
  label?: string;
};

export function StatusBadge({ status = "normal", className, label }: StatusBadgeProps) {
  const normalizedStatus = status ?? "normal";

  return <Badge className={cn(statusBadgeVariants({ status: normalizedStatus }), className)}>{label ?? currentStatusLabels[normalizedStatus]}</Badge>;
}
