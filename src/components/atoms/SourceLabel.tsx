type SourceLabelProps = {
  source: string;
};

export function SourceLabel({ source }: SourceLabelProps) {
  return <span className="text-xs text-muted-foreground">แหล่งข้อมูล: {source}</span>;
}
