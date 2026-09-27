import type { CurrentStatus } from "@/config/status-levels";
import type { RiskLevel } from "@/config/risk-levels";

export function getPreparednessAdvice(riskLevel: RiskLevel, currentStatus: CurrentStatus) {
  const elevated = riskLevel === "high" || riskLevel === "very_high" || currentStatus === "warning" || currentStatus === "critical";

  return {
    title: elevated ? "เตรียมพร้อมและติดตามสถานการณ์ใกล้ชิด" : "ติดตามสถานการณ์ตามปกติ",
    summary: elevated ? "พื้นที่หรือสถานการณ์มีปัจจัยที่ควรเตรียมตัวล่วงหน้า" : "ยังไม่มีสัญญาณรุนแรงในข้อมูลตัวอย่าง",
    checklist: [
      "ติดตามประกาศจากหน่วยงานรัฐและท้องถิ่น",
      "เตรียมเอกสารสำคัญ ยาประจำตัว น้ำดื่ม และ power bank",
      "วางแผนดูแลเด็ก ผู้สูงอายุ ผู้พิการ และสัตว์เลี้ยง",
      "หลีกเลี่ยงการขับรถผ่านน้ำท่วมขัง",
    ],
  };
}
