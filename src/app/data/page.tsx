import { PublicPageLayout } from "@/components/templates/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sources = ["ThaiWater / HAII", "TMD", "RID", "DDPM", "ONWR", "GISTDA", "OpenStreetMap", "DEM datasets"];

export default function DataPage() {
  return (
    <PublicPageLayout title="ข้อมูลที่ใช้" description="ระบบต้องแสดง source, timestamp, confidence และข้อจำกัดของข้อมูลทุกครั้งที่สื่อสารเรื่องความเสี่ยง">
      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <Card key={source}>
            <CardHeader>
              <CardTitle className="text-lg">{source}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">รอ research เรื่อง access, license, format, update frequency และ attribution</CardContent>
          </Card>
        ))}
      </div>
    </PublicPageLayout>
  );
}
