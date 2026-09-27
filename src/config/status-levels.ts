export type CurrentStatus = "normal" | "watch" | "warning" | "critical";

export const currentStatusLabels: Record<CurrentStatus, string> = {
  normal: "ปกติ",
  watch: "เฝ้าระวัง",
  warning: "เตือนภัย",
  critical: "วิกฤต",
};
