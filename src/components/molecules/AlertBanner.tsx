import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AlertBannerProps = {
  title: string;
  description: string;
};

export function AlertBanner({ title, description }: AlertBannerProps) {
  return (
    <Alert className="border-[hsl(var(--alert-banner-border))] bg-status-warning/10">
      <TriangleAlert className="h-4 w-4 text-status-warning" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
