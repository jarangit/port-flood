export type CurrentStatus = "normal" | "watch" | "warning" | "critical";

export const currentStatusLabels: Record<CurrentStatus, string> = {
  normal: "ยังปกติ",
  watch: "เริ่มน่าห่วง",
  warning: "ควรเตรียมพร้อม",
  critical: "อันตราย",
};
