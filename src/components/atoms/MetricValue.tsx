type MetricValueProps = {
  label: string;
  value: string;
  description?: string;
};

export function MetricValue({ label, value, description }: MetricValueProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
