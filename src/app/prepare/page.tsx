import { AdviceChecklist } from "@/components/molecules/AdviceChecklist";
import { PublicPageLayout } from "@/components/templates/PublicPageLayout";

export default function PreparePage() {
  return (
    <PublicPageLayout title="เตรียมตัวก่อนน้ำท่วม" description="คำแนะนำที่ช่วยให้ครอบครัวและชุมชนพร้อมก่อนสถานการณ์รุนแรง">
      <AdviceChecklist title="Checklist เบื้องต้น" description="เริ่มจากสิ่งที่ทำได้วันนี้" items={["เก็บเอกสารสำคัญในถุงกันน้ำ", "เตรียมยาประจำตัว น้ำดื่ม อาหารแห้ง และไฟฉาย", "บันทึกเบอร์ติดต่อฉุกเฉินและช่องทางประกาศของท้องถิ่น", "วางแผนเส้นทางและจุดนัดพบของครอบครัว"]} />
    </PublicPageLayout>
  );
}
