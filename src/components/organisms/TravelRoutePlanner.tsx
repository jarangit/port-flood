"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Bike,
  Car,
  CloudRain,
  Flag,
  Loader2,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
} from "lucide-react";

import { riskLevelLabels, type RiskLevel } from "@/config/risk-levels";
import type { CurrentStatus } from "@/config/status-levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TravelMiniMap = dynamic(
  () => import("@/components/molecules/MiniRouteMap").then((mod) => mod.MiniRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] w-full items-center justify-center text-sm text-slate-400 sm:h-[280px]">
        กำลังโหลดแผนที่…
      </div>
    ),
  },
);

type GeocodeResult = {
  label: string;
  name?: string;
  category?: string;
  lat: number;
  lng: number;
  province?: string;
  district?: string;
  subdistrict?: string;
};

type TravelMode = "car" | "motorcycle";

type RouteRiskSegment = {
  startKm: number;
  endKm: number;
  startTimeMin: number;
  endTimeMin: number;
  startLabel: string;
  endLabel: string;
  risk: RiskLevel;
  status: CurrentStatus;
  label: string;
  reasons: string[];
  vehicleWater: {
    depthCm: number | null;
    label: string;
    source: "nearest_station_bank_diff" | "fallback_estimate" | "unknown";
    impactLabel: string;
  };
  roadWaterEstimate: {
    roadElevationM: number | null;
    nearestWaterLevelMsl: number | null;
    clearanceM: number | null;
    stationDistanceKm: number | null;
    label: string;
    confidence: "low" | "medium" | "high";
    source: "road_elevation_vs_station_water_level" | "unavailable";
  };
};

type RouteRiskResponse = {
  origin: { label: string; lat: number; lng: number };
  destination: { label: string; lat: number; lng: number };
  mode: TravelMode;
  distanceKm: number;
  durationMin: number;
  sampleCount: number;
  source: "openrouteservice";
  disclaimer: string;
  coordinates: [number, number][];
  segments: RouteRiskSegment[];
};

const riskTone: Record<RiskLevel, string> = {
  low: "bg-emerald-400",
  medium: "bg-yellow-400",
  high: "bg-orange-500",
  very_high: "bg-red-700",
};

const riskCardTone: Record<RiskLevel, string> = {
  low: "border-emerald-100 bg-emerald-50 text-emerald-800",
  medium: "border-yellow-100 bg-yellow-50 text-yellow-800",
  high: "border-orange-100 bg-orange-50 text-orange-800",
  very_high: "border-red-200 bg-red-50 text-red-900",
};

const loadingSteps = [
  "ค้นหาต้นทางและปลายทาง",
  "คำนวณเส้นทางจาก OpenRouteService",
  "ตรวจจุดเสี่ยงน้ำท่วมตามเส้นทาง",
  "สรุป timeline สำหรับเดินทาง",
];

async function geocodeFirst(query: string, fieldName: string) {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  const data = (await response.json()) as { results?: GeocodeResult[]; error?: { message?: string } };

  if (!response.ok) {
    throw new Error(data.error?.message ?? `ค้นหา${fieldName}ไม่สำเร็จ`);
  }

  const result = data.results?.[0];
  if (!result) {
    throw new Error(`ไม่พบ${fieldName} ลองพิมพ์ชื่อให้ชัดขึ้น`);
  }

  return result;
}

function primaryPlaceName(result: GeocodeResult) {
  if (result.name && !result.name.startsWith("ไม่ทราบ")) return result.name;
  if (result.subdistrict && result.subdistrict !== "ไม่ทราบตำบล/แขวง") return result.subdistrict;
  if (result.district && result.district !== "ไม่ทราบอำเภอ/เขต") return result.district;
  return result.label;
}

function secondaryPlaceLine(result: GeocodeResult) {
  return [result.category, result.subdistrict, result.district, result.province]
    .filter((part, index, array) => part && !part.startsWith("ไม่ทราบ") && array.indexOf(part) === index)
    .join(" · ");
}

function LocationSuggestField({
  id,
  label,
  placeholder,
  value,
  selected,
  iconClassName,
  onChange,
  onSelect,
  suffixAction,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  selected: GeocodeResult | null;
  iconClassName: string;
  onChange: (value: string) => void;
  onSelect: (value: GeocodeResult | null) => void;
  suffixAction?: React.ReactNode;
}) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trimmed = value.trim();
    if (selected?.label === value || trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: GeocodeResult[] };
        setSuggestions(response.ok ? (data.results ?? []).slice(0, 5) : []);
        setIsOpen(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [selected?.label, value]);

  return (
    <div className="relative">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-2">
        <MapPin className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${iconClassName}`} aria-hidden="true" />
        <Input
          id={id}
          autoComplete="off"
          className={`h-12 rounded-2xl border-sky-100 pl-9 ${suffixAction ? "pr-28" : "pr-9"}`}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onSelect(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden="true" />
        ) : (
          suffixAction
        )}
      </div>

      {isOpen && suggestions.length > 0 ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-sky-100 bg-white p-2 shadow-xl">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.lat}-${suggestion.lng}-${suggestion.label}`}
              type="button"
              className="w-full rounded-xl px-3 py-2 text-left hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(suggestion.label);
                onSelect(suggestion);
                setIsOpen(false);
              }}
            >
              <span className="block text-sm font-semibold text-slate-900">
                {primaryPlaceName(suggestion)}
              </span>
              <span className="line-clamp-1 text-xs leading-5 text-sky-700">
                {secondaryPlaceLine(suggestion) || suggestion.label}
              </span>
              <span className="line-clamp-1 text-xs leading-5 text-slate-500">{suggestion.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function riskyEnough(segment: RouteRiskSegment) {
  return segment.risk !== "low" || segment.status !== "normal";
}

function splitRouteLabel(label: string) {
  const [kmPart, ...placeParts] = label.split(" · ");
  return {
    km: kmPart.replace("กม.", "").trim(),
    place: placeParts.join(" · ") || label,
  };
}

function LoadingAnalysisCard() {
  return (
    <section className="rounded-[28px] border border-sky-100 bg-white/85 p-4 shadow-sm backdrop-blur sm:p-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">กำลังวิเคราะห์เส้นทาง</p>
          <p className="text-sm text-slate-500">อาจใช้เวลาสักครู่ เพราะต้องตรวจหลายจุดตามเส้นทาง</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {loadingSteps.map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl bg-sky-50 px-3 py-2 text-sm text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-sky-700">
              {index + 1}
            </span>
            {step}
          </div>
        ))}
      </div>
    </section>
  );
}

// ระดับน้ำที่รถใช้เกณฑ์เดียวกับแถบสี 4 ระดับ (ไม่ใช่ค่าซม.จริงบนถนน)
const riskWaterHeightPx: Record<RiskLevel, number> = {
  low: 0,
  medium: 14,
  high: 28,
  very_high: 46,
};

function VehicleIcon({
  mode,
  risk,
  className = "",
}: {
  mode: TravelMode;
  risk: RiskLevel;
  className?: string;
}) {
  // พื้นถนนอยู่ที่ y=88; น้ำวัดจากพื้นถนนขึ้นไปตามระดับความเสี่ยง
  const waterH = riskWaterHeightPx[risk];
  const waterY = 88 - waterH;
  const hasWater = waterH > 0;
  const label = riskLevelLabels[risk];

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-sky-50 to-white ring-1 ring-sky-100 ${className}`}
    >
      <svg viewBox="0 0 160 110" className="h-14 w-full" role="img" aria-label={`ระดับน้ำเทียบรถ: ${label}`}>
        {hasWater ? (
          <rect x="8" y={waterY} width="144" height={waterH} rx="6" fill="rgba(56,189,248,0.45)" />
        ) : (
          <line x1="14" y1="88" x2="146" y2="88" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="5 4" />
        )}
        <rect x="8" y="88" width="144" height="5" rx="2.5" fill="#94a3b8" opacity="0.8" />
        {mode === "motorcycle" ? (
          <g>
            <line x1="58" y1="79" x2="80" y2="58" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <line x1="80" y1="58" x2="102" y2="79" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <line x1="80" y1="58" x2="80" y2="48" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <line x1="72" y1="48" x2="90" y2="48" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <circle cx="58" cy="79" r="9" fill="#0f172a" />
            <circle cx="58" cy="79" r="3.5" fill="#cbd5e1" />
            <circle cx="102" cy="79" r="9" fill="#0f172a" />
            <circle cx="102" cy="79" r="3.5" fill="#cbd5e1" />
          </g>
        ) : (
          <g>
            <rect x="30" y="52" width="100" height="20" rx="7" fill="#1e293b" />
            <rect x="52" y="38" width="56" height="18" rx="7" fill="#334155" />
            <rect x="58" y="42" width="20" height="10" rx="3" fill="#bae6fd" />
            <rect x="82" y="42" width="20" height="10" rx="3" fill="#bae6fd" />
            <circle cx="52" cy="79" r="9" fill="#0f172a" />
            <circle cx="52" cy="79" r="3.5" fill="#cbd5e1" />
            <circle cx="108" cy="79" r="9" fill="#0f172a" />
            <circle cx="108" cy="79" r="3.5" fill="#cbd5e1" />
          </g>
        )}
      </svg>
    </div>
  );
}

function RouteScrubber({ result }: { result: RouteRiskResponse }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [scrubKm, setScrubKm] = useState(0);
  const ScrubIcon = result.mode === "motorcycle" ? Bike : Car;

  if (result.segments.length === 0) return null;

  const setFromClientX = (clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(rect.width, 1)));
    setScrubKm(Math.round(pct * result.distanceKm * 10) / 10);
  };

  const segment =
    result.segments.find((item) => scrubKm <= item.endKm) ?? result.segments[result.segments.length - 1];
  const span = Math.max(segment.endKm - segment.startKm, 0.01);
  const frac = Math.min(1, Math.max(0, (scrubKm - segment.startKm) / span));
  const place = splitRouteLabel(frac < 0.5 ? segment.startLabel : segment.endLabel).place;
  const pct = result.distanceKm > 0 ? (scrubKm / result.distanceKm) * 100 : 0;
  const step = Math.max(0.5, Math.round((result.distanceKm / 50) * 10) / 10);

  return (
    <div className="mt-6">
      <div className="flex min-w-0 items-center justify-between gap-3 text-xs font-medium text-slate-500">
        <span className="line-clamp-1 max-w-[42%]">{result.origin.label}</span>
        <span className="line-clamp-1 max-w-[42%] text-right">{result.destination.label}</span>
      </div>

      <div
        className="cursor-ew-resize touch-pan-y px-3.5 py-5 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-2xl"
        role="slider"
        tabIndex={0}
        aria-label="เลื่อนดูระดับน้ำตามเส้นทาง"
        aria-valuemin={0}
        aria-valuemax={result.distanceKm}
        aria-valuenow={scrubKm}
        aria-valuetext={`กม. ${scrubKm} ${riskLevelLabels[segment.risk]}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setFromClientX(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.buttons & 1) setFromClientX(event.clientX);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            setScrubKm((km) => Math.min(result.distanceKm, Math.round((km + step) * 10) / 10));
          } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            setScrubKm((km) => Math.max(0, Math.round((km - step) * 10) / 10));
          } else if (event.key === "Home") {
            event.preventDefault();
            setScrubKm(0);
          } else if (event.key === "End") {
            event.preventDefault();
            setScrubKm(result.distanceKm);
          }
        }}
      >
        <div ref={barRef} className="relative flex h-5 rounded-full bg-slate-100 ring-1 ring-slate-200">
          {result.segments.map((item) => {
            const width = Math.max(4, ((item.endKm - item.startKm) / result.distanceKm) * 100);
            return (
              <div
                key={`${item.startKm}-${item.endKm}-${item.risk}-${item.status}`}
                className={`${riskTone[item.risk]} min-w-2 border-r border-white/70 first:rounded-l-full last:rounded-r-full last:border-r-0 [&:only-child]:rounded-full`}
                style={{ width: `${width}%` }}
                title={`${item.startKm}-${item.endKm} กม. ${riskLevelLabels[item.risk]}`}
              />
            );
          })}
          <span
            className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/60 bg-white/55 p-1.5 shadow-lg backdrop-blur-md"
            style={{ left: `${pct}%` }}
            aria-hidden="true"
          >
            <span className="relative block h-8 w-8" aria-hidden="true">
              <ScrubIcon className="absolute inset-0 h-8 w-8 text-slate-900" aria-hidden="true" />
              <span
                className="absolute inset-x-0 bottom-0 overflow-hidden transition-all"
                style={{ height: `${{ low: 0, medium: 30, high: 55, very_high: 82 }[segment.risk]}%` }}
                aria-hidden="true"
              >
                <ScrubIcon className="absolute bottom-0 left-0 h-8 w-8 text-sky-500" aria-hidden="true" />
              </span>
            </span>
          </span>
        </div>
      </div>

      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>0 กม.</span>
        <span>{result.distanceKm} กม.</span>
      </div>

      <div className="mt-3 min-w-0 rounded-2xl border border-sky-100 bg-white/70 p-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
            กม. {segment.startKm} - {segment.endKm}
          </span>
          <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
            {riskLevelLabels[segment.risk]}
          </span>
          <VehicleIcon mode={result.mode} risk={segment.risk} className="ml-auto w-20 max-[359px]:ml-0" />
        </div>
        <p className="mt-2 text-[13px] font-semibold tabular-nums text-slate-900">กม. {scrubKm}</p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
          <span className="truncate">{place}</span>
        </p>
      </div>
    </div>
  );
}

function RouteTimeline({ result }: { result: RouteRiskResponse }) {
  const riskySegments = result.segments.filter(riskyEnough);

  return (
    <section className="min-w-0 rounded-[28px] border border-border bg-card/85 p-4 shadow-[var(--shadow-float)] backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-600">
            <Route className="h-4 w-4" aria-hidden="true" />
            Timeline เส้นทาง
          </p>
          <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950">
            {result.distanceKm} กม. · ประมาณ {result.durationMin} นาที
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ตรวจ {result.sampleCount} จุดตลอดเส้นทางจาก OpenRouteService
          </p>
        </div>
      </div>

      <RouteScrubber result={result} />

      <div className="mt-5 min-w-0 overflow-hidden rounded-2xl border border-border bg-card/80">
        <div className="flex items-center gap-2 border-b border-sky-100/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-600">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          <span>แผนที่เส้นทางจริง</span>
        </div>
        <TravelMiniMap
          coordinates={result.coordinates}
          segments={result.segments}
          distanceKm={result.distanceKm}
        />
        <p className="border-t border-sky-100/80 px-4 py-2.5 text-xs text-slate-500">
          เส้นทางโดยประมาณจาก OpenRouteService · {result.distanceKm} กม.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {Object.entries(riskLevelLabels).map(([risk, label]) => (
          <div key={risk} className="flex min-w-0 items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-slate-600">
            <span className={`h-2.5 w-2.5 rounded-full ${riskTone[risk as RiskLevel]}`} />
            <span className="min-w-0 truncate">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {riskySegments.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              ยังไม่พบช่วงเสี่ยงเด่นในเส้นทางนี้
            </p>
            <p className="mt-1 text-sm leading-6">ยังควรติดตามประกาศและสภาพถนนจริงก่อนออกเดินทาง</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            <div className="relative grid grid-cols-[2.5rem_1fr] gap-3 pb-5 sm:grid-cols-[3rem_1fr]">
              <div className="relative flex justify-center">
                <span className="absolute top-9 h-[calc(100%-1.25rem)] w-1 rounded-full bg-gradient-to-b from-sky-200 via-sky-100 to-transparent" />
                <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm ring-4 ring-white">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="min-w-0 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sky-900 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-600">จุดเริ่มต้น</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6">{result.origin.label}</p>
                <p className="mt-1 text-xs text-sky-700">กม. 0</p>
              </div>
            </div>

            {riskySegments.map((segment, index) => {
              const start = splitRouteLabel(segment.startLabel);
              const end = splitRouteLabel(segment.endLabel);

              return (
                <div
                  key={`${segment.startKm}-${segment.endKm}-${segment.risk}-${segment.status}`}
                  className="relative grid grid-cols-[2.5rem_1fr] gap-3 pb-5 last:pb-0 sm:grid-cols-[3rem_1fr]"
                >
                  <div className="relative flex justify-center">
                    <span className="absolute top-9 h-[calc(100%-1.25rem)] w-1 rounded-full bg-gradient-to-b from-sky-200 via-sky-100 to-transparent" />
                    <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm ring-4 ring-white ${riskTone[segment.risk]}`}>
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>

                  <article className={`min-w-0 rounded-2xl border p-3 shadow-sm ${riskCardTone[segment.risk]}`}>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold">
                        กม. {segment.startKm} - {segment.endKm}
                      </span>
                      <span className="max-w-full break-words text-sm font-semibold sm:shrink-0">{segment.label}</span>
                      <span className="flex min-w-[11rem] flex-1 items-center gap-1 text-[13px] font-medium opacity-80 max-[430px]:basis-full">
                        <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                        <span className="truncate">
                          {start.place} → {end.place}
                        </span>
                      </span>
                      <VehicleIcon mode={result.mode} risk={segment.risk} className="ml-auto w-14 max-[430px]:ml-0 sm:w-16" />
                    </div>
                  </article>
                </div>
              );
            })}

            <div className="relative grid grid-cols-[2.5rem_1fr] gap-3 sm:grid-cols-[3rem_1fr]">
              <div className="relative flex justify-center">
                <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-white shadow-sm ring-4 ring-white">
                  <Flag className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="min-w-0 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-cyan-900 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-600">จุดปลายทาง</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6">{result.destination.label}</p>
                <p className="mt-1 text-xs text-cyan-700">กม. {result.distanceKm}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sm leading-6 text-slate-600">
        {result.disclaimer}
      </p>
    </section>
  );
}

export function TravelRoutePlanner() {
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState<GeocodeResult | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<GeocodeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteRiskResponse | null>(null);

  function handleUseCurrentLocation() {
    setError(null);

    if (!navigator.geolocation) {
      setError("เบราว์เซอร์นี้ไม่รองรับการใช้ตำแหน่งปัจจุบัน");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          label: "ตำแหน่งของฉัน",
          name: "ตำแหน่งของฉัน",
          category: "ตำแหน่งปัจจุบัน",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setOriginQuery(point.label);
        setSelectedOrigin(point);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError("ไม่สามารถเข้าถึงตำแหน่งได้ คุณยังค้นหาต้นทางเองได้");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!originQuery.trim() || !destinationQuery.trim()) {
      setError("กรุณากรอกต้นทางและปลายทาง");
      return;
    }

    setIsLoading(true);

    try {
      const [origin, destination] = await Promise.all([
        selectedOrigin ?? geocodeFirst(originQuery, "ต้นทาง"),
        selectedDestination ?? geocodeFirst(destinationQuery, "ปลายทาง"),
      ]);

      const response = await fetch("/api/route-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, mode: "car" }),
      });
      const data = (await response.json()) as RouteRiskResponse | { error?: { message?: string } };

      if (!response.ok) {
        setError("error" in data ? data.error?.message ?? "วิเคราะห์เส้นทางไม่สำเร็จ" : "วิเคราะห์เส้นทางไม่สำเร็จ");
        return;
      }

      setResult(data as RouteRiskResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "วิเคราะห์เส้นทางไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form className="min-w-0 rounded-[28px] border border-border bg-card/85 p-4 shadow-[var(--shadow-soft)] backdrop-blur sm:p-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <LocationSuggestField
            id="origin"
            label="ต้นทาง"
            placeholder="เช่น บางนา กรุงเทพ"
            value={originQuery}
            selected={selectedOrigin}
            iconClassName="text-sky-500"
            onChange={setOriginQuery}
            onSelect={setSelectedOrigin}
            suffixAction={
              <button
                type="button"
                title="ใช้ตำแหน่งของฉันเป็นต้นทาง"
                aria-label="ใช้ตำแหน่งของฉันเป็นต้นทาง"
                disabled={isLoading || isLocating}
                onClick={handleUseCurrentLocation}
                onMouseDown={(event) => event.preventDefault()}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-40"
              >
                {isLocating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                ที่คุณอยู่
              </button>
            }
          />
          <LocationSuggestField
            id="destination"
            label="ปลายทาง"
            placeholder="เช่น รังสิต ปทุมธานี"
            value={destinationQuery}
            selected={selectedDestination}
            iconClassName="text-cyan-500"
            onChange={setDestinationQuery}
            onSelect={setSelectedDestination}
          />
          <Button className="h-12 rounded-2xl px-6" type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CloudRain className="h-4 w-4" aria-hidden="true" />}
            วิเคราะห์เส้นทาง
          </Button>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">รองรับเส้นทางไม่เกิน 100 กม.</p>
        {error ? <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      </form>

      {isLoading ? <LoadingAnalysisCard /> : null}
      {result ? <RouteTimeline result={result} /> : null}
    </div>
  );
}
