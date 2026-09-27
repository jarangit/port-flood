import type { CurrentStatus } from "@/config/status-levels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/atoms/StatusBadge";

type CurrentStatusCardProps = {
  status: CurrentStatus;
  title: string;
  description: string;
  signals: string[];
};

export function CurrentStatusCard({ status, title, description, signals }: CurrentStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {signals.map((signal) => (
            <li key={signal}>- {signal}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
