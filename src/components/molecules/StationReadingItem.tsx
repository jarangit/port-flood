"use client";

import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { bankState, trendLabel } from "@/components/molecules/water-reading-copy";
import type {
  NearbyRainStation,
  NearbyWaterStation,
} from "@/server/external/thaiwater/mapper";

function rainMeaning(rain24h?: number): string {
  if (rain24h === undefined) return "ยังไม่มีค่าฝนล่าสุด";
  if (rain24h > 90) return "ฝนหนักมาก เสี่ยงน้ำท่วมฉับพลัน";
  if (rain24h >= 35.1) return "ฝนหนัก เสี่ยงน้ำขัง";
  if (rain24h >= 10) return "ฝนปานกลาง ควรติดตามต่อ";
  return "ฝนเล็กน้อย";
}

export function StationReadingItem({
  station,
  isDriver,
}: {
  station: NearbyWaterStation;
  isDriver: boolean;
}) {
  const state = bankState(station);
  const trend = trendLabel(station.trendM);

  return (
    <li className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold text-foreground">{station.name}</span>
        {station.river ? <span className="text-sm">({station.river})</span> : null}
        <StatusBadge status={state.chip.status} label={state.chip.label} />
        {isDriver ? <Badge variant="outline">ใช้ประกอบภาพด้านบน</Badge> : null}
      </div>
      <p className="mt-2 text-base leading-7 text-foreground">
        {state.meaning}
        {trend ? ` ${trend}` : ""}
      </p>
      <p className="mt-1 text-sm leading-6">
        ห่างประมาณ {station.distanceKm} กม. — บอกภาพลุ่มน้ำ ไม่ใช่ระดับน้ำหน้าบ้านคุณ
      </p>
      <details className="mt-2 text-sm leading-6">
        <summary className="cursor-pointer">ข้อมูลวิศวกร</summary>
        <p>
          ระดับ {station.waterLevelMsl ?? "-"} ม.รทก.
          {station.bankDiffM !== undefined
            ? ` ${station.bankDiffM >= 0 ? "สูง" : "ต่ำ"}กว่าตลิ่ง ${Math.abs(station.bankDiffM)} ม.`
            : ""}
          {station.bankStatusText ? ` (${station.bankStatusText})` : ""}
          {station.discharge !== undefined && station.discharge !== null
            ? ` | อัตราไหล ${station.discharge} ลบ.ม./วิ.`
            : ""}
          {" | "}อัปเดต {new Date(station.updatedAt).toLocaleString("th-TH")}
        </p>
      </details>
    </li>
  );
}

export function RainReadingItem({ station }: { station: NearbyRainStation }) {
  return (
    <li className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold text-foreground">{station.name}</span>
        <StatusBadge status={station.status} />
      </div>
      <p className="mt-2 text-base leading-7 text-foreground">
        ฝน 24 ชม. {station.rain24h ?? "-"} มม. — {rainMeaning(station.rain24h)}
      </p>
      <p className="mt-1 text-sm leading-6">
        ห่างประมาณ {station.distanceKm} กม. — ฝนตรงจุดคุณอาจมากหรือน้อยกว่านี้
      </p>
    </li>
  );
}
