import { PublicPageLayout } from "@/components/templates/PublicPageLayout";

export default function MapPage() {
  return (
    <PublicPageLayout title="แผนที่สถานการณ์น้ำ" description="พื้นที่สำหรับ map layers เช่น risk layer, rainfall stations, water-level stations, dams และ official alerts">
      <div className="grid min-h-[420px] place-items-center rounded-2xl border bg-[hsl(var(--map-control-background))] text-center text-muted-foreground">
        MapLibre map placeholder
      </div>
    </PublicPageLayout>
  );
}
