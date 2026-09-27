type UpdatedTimeProps = {
  updatedAt: string;
};

export function UpdatedTime({ updatedAt }: UpdatedTimeProps) {
  return <span className="text-xs text-muted-foreground">อัปเดตล่าสุด: {updatedAt}</span>;
}
