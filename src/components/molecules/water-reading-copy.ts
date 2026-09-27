import type { NearbyWaterStation } from "@/server/external/thaiwater/mapper";

export type WaterBankState = {
  chip: { status: "normal" | "watch" | "warning" | "critical"; label: string };
  meaning: string;
};

export function trendLabel(trendM?: number): string | null {
  if (trendM === undefined) return null;
  if (trendM > 0.05) return `↑ สูงขึ้น ${trendM} ม.`;
  if (trendM < -0.05) return `↓ ลดลง ${Math.abs(trendM)} ม.`;
  return "→ ทรงตัว";
}

export function bankState(station: NearbyWaterStation): WaterBankState {
  if (station.status === "critical") {
    return {
      chip: { status: "critical", label: "ล้นตลิ่งแล้ว" },
      meaning: "น้ำในคลองสูงกว่าตลิ่งแล้ว พื้นที่ต่ำใกล้คลองเสี่ยงน้ำล้นเข้าท่วม",
    };
  }
  if (station.status === "warning") {
    return {
      chip: { status: "warning", label: "ใกล้ล้นตลิ่ง" },
      meaning: "น้ำใกล้เต็มตลิ่ง ควรติดตามใกล้ชิด",
    };
  }
  if (
    station.bankDiffM !== undefined &&
    station.bankDiffM < 0 &&
    station.bankDiffM > -0.5
  ) {
    return {
      chip: { status: "watch", label: "เฝ้าระวัง" },
      meaning: `น้ำต่ำกว่าตลิ่งเพียง ${Math.abs(station.bankDiffM).toFixed(2)} ม. ควรติดตามหากฝนตกต่อ`,
    };
  }
  return {
    chip: { status: "normal", label: "ปกติ" },
    meaning: "ระดับน้ำยังต่ำกว่าตลิ่งอยู่",
  };
}
