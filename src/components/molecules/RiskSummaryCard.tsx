import type { RiskLevel } from "@/config/risk-levels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/atoms/RiskBadge";
import { UpdatedTime } from "@/components/atoms/UpdatedTime";

type RiskSummaryCardProps = {
  risk: RiskLevel;
  title: string;
  description: string;
  updatedAt: string;
};

export function RiskSummaryCard({ risk, title, description, updatedAt }: RiskSummaryCardProps) {
  return (
    <Card className="border-[hsl(var(--card-risk-border))] bg-[hsl(var(--card-risk-background))]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <RiskBadge risk={risk} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <UpdatedTime updatedAt={updatedAt} />
      </CardContent>
    </Card>
  );
}
