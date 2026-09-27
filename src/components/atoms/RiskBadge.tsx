import { cva, type VariantProps } from "class-variance-authority";

import { Badge } from "@/components/ui/badge";
import { riskLevelLabels } from "@/config/risk-levels";
import { cn } from "@/lib/utils";

const riskBadgeVariants = cva("border-transparent", {
  variants: {
    risk: {
      low: "bg-risk-low/10 text-risk-low",
      medium: "bg-risk-medium/10 text-risk-medium",
      high: "bg-risk-high/10 text-risk-high",
      very_high: "bg-risk-very-high/10 text-risk-very-high",
    },
  },
  defaultVariants: {
    risk: "medium",
  },
});

type RiskBadgeProps = VariantProps<typeof riskBadgeVariants> & {
  className?: string;
};

export function RiskBadge({ risk = "medium", className }: RiskBadgeProps) {
  const normalizedRisk = risk ?? "medium";

  return <Badge className={cn(riskBadgeVariants({ risk: normalizedRisk }), className)}>{riskLevelLabels[normalizedRisk]}</Badge>;
}
