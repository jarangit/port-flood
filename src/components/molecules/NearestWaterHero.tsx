import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bankState, trendLabel } from "@/components/molecules/water-reading-copy";
import type { NearbyWaterStation } from "@/server/external/thaiwater/mapper";

type NearestWaterHeroProps = {
  station: NearbyWaterStation | null;
  searchRadiusKm: number;
  updatedAt: string;
};

export function NearestWaterHero({ station, searchRadiusKm, updatedAt }: NearestWaterHeroProps) {
  if (!station) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <p className="text-sm font-medium text-primary">ระดับน้ำใกล้คุณ</p>
          <CardTitle className="text-4xl leading-tight tracking-tight md:text-5xl">
            ยังไม่พบสถานีระดับน้ำใกล้พื้นที่นี้
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-8 text-muted-foreground">
            ลองค้นหาในรัศมี {searchRadiusKm} กม. แล้ว แต่ยังไม่มีสถานีระดับน้ำในระบบ ThaiWater ใกล้พิกัดนี้
          </p>
        </CardContent>
      </Card>
    );
  }

  const state = bankState(station);
  const trend = trendLabel(station.trendM);

  return (
    <Card className="overflow-hidden border-primary/30 bg-primary/5">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-primary">ระดับน้ำใกล้คุณ</p>
          <StatusBadge status={state.chip.status} label={state.chip.label} />
        </div>
        <div>
          <CardTitle className="text-4xl leading-tight tracking-tight md:text-5xl">
            {station.name}
            {station.river ? ` (${station.river})` : ""}
          </CardTitle>
          <p className="mt-3 text-xl leading-8 text-foreground">
            {state.meaning}
            {trend ? ` ${trend}` : ""}
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 text-base leading-8 md:grid-cols-3">
        <div className="rounded-2xl bg-background/80 p-4">
          <p className="text-sm text-muted-foreground">ระยะจากจุดที่ตรวจ</p>
          <p className="text-2xl font-semibold text-foreground">{station.distanceKm} กม.</p>
          <p className="mt-1 text-sm text-muted-foreground">บอกภาพลุ่มน้ำ ไม่ใช่ระดับน้ำหน้าบ้านคุณ</p>
        </div>
        <div className="rounded-2xl bg-background/80 p-4">
          <p className="text-sm text-muted-foreground">เทียบตลิ่งที่สถานี</p>
          <p className="text-2xl font-semibold text-foreground">
            {station.bankDiffM === undefined
              ? "ไม่มีข้อมูล"
              : `${station.bankDiffM >= 0 ? "สูงกว่า" : "ต่ำกว่า"} ${Math.abs(station.bankDiffM)} ม.`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">ตลิ่งของสถานีนี้ ไม่ใช่ระดับถนนหน้าบ้าน</p>
        </div>
        <div className="rounded-2xl bg-background/80 p-4">
          <p className="text-sm text-muted-foreground">อัปเดต</p>
          <p className="text-lg font-semibold text-foreground">
            {new Date(station.updatedAt).toLocaleString("th-TH")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            ค้นหาในรัศมี {searchRadiusKm} กม. | ที่มา ThaiWater
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
