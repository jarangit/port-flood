import { PublicPageLayout } from "@/components/templates/PublicPageLayout";

export default function FaqPage() {
  return (
    <PublicPageLayout title="คำถามที่พบบ่อย" description="คำอธิบายข้อจำกัดของระบบและวิธีอ่านผลลัพธ์">
      <div className="space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">ใช้แทนประกาศราชการได้ไหม?</h2>
          <p>ไม่ได้ ระบบนี้ใช้เพื่อการเตรียมพร้อมและสร้างความเข้าใจเบื้องต้นเท่านั้น</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">ทำไมผลลัพธ์อาจไม่ตรงกับบ้านข้าง ๆ?</h2>
          <p>ข้อมูลบางชนิดมีความละเอียดจำกัด และภูมิประเทศระดับบ้านอาจต่างกันมาก ต้องแสดง confidence ทุกครั้ง</p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
