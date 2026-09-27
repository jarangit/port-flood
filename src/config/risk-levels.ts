export type RiskLevel = "low" | "medium" | "high" | "very_high";

export const riskLevelLabels: Record<RiskLevel, string> = {
  low: "เสี่ยงต่ำ",
  medium: "เสี่ยงปานกลาง",
  high: "เสี่ยงสูง",
  very_high: "เสี่ยงสูงมาก",
};
