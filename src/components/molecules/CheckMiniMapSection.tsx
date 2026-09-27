"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

import type { RiskLevel } from "@/config/risk-levels";

const MiniLocationMap = dynamic(
  () => import("@/components/molecules/MiniLocationMap").then((mod) => mod.MiniLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] w-full items-center justify-center text-sm text-slate-400 sm:h-[260px]">
        กำลังโหลดแผนที่…
      </div>
    ),
  },
);

type CheckMiniMapSectionProps = {
  lat: number;
  lng: number;
  risk: RiskLevel;
  caption: string;
};

export function CheckMiniMapSection({ lat, lng, risk, caption }: CheckMiniMapSectionProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-sky-100 bg-white/70 shadow-[0_20px_60px_rgba(14,116,144,0.10)] backdrop-blur sm:mt-6 sm:rounded-[28px]">
      <div className="flex items-center gap-2 border-b border-sky-100/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-600 sm:px-5 sm:py-3 sm:text-[12px]">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        <span>แผนที่จุดตรวจ</span>
      </div>
      <MiniLocationMap lat={lat} lng={lng} risk={risk} />
      <p className="border-t border-sky-100/80 px-4 py-2.5 text-xs text-slate-500 sm:px-5">{caption}</p>
    </div>
  );
}
