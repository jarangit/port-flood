import {
  Backpack,
  BellRing,
  ChevronDown,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSun,
  Gauge,
  Info,
  MapPin,
  MapPinOff,
  PersonStanding,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Waves,
} from "lucide-react";
import type { CurrentStatus } from "@/config/status-levels";
import { currentStatusLabels } from "@/config/status-levels";
import type { RiskLevel } from "@/config/risk-levels";
import { riskLevelLabels } from "@/config/risk-levels";
import { CheckMiniMapSection } from "@/components/molecules/CheckMiniMapSection";
import { HumanWaterLevelCard } from "@/components/molecules/HumanWaterLevelCard";
import { parseCoordinate } from "@/lib/validation";
import { getPreparednessAdvice } from "@/server/services/advice-service";
import { getOfficialAlerts } from "@/server/services/alert-service";
import { getFloodRisk } from "@/server/services/flood-risk-service";
import { reverseGeocodeThailand } from "@/server/services/geocoding-service";
import { getRealtimeNearby } from "@/server/services/realtime-service";

type CheckPageProps = {
  searchParams?: Promise<{
    lat?: string;
    lng?: string;
  }>;
};

const statusMeta: Record<
  CurrentStatus,
  { icon: typeof CloudSun; soft: string; chip: string; heroIcon: string }
> = {
  normal: {
    icon: CloudSun,
    soft: "bg-emerald-500/10 text-emerald-600",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    heroIcon: "bg-emerald-500 text-white",
  },
  watch: {
    icon: CloudRainWind,
    soft: "bg-sky-500/10 text-sky-600",
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    heroIcon: "bg-sky-500 text-white",
  },
  warning: {
    icon: CloudLightning,
    soft: "bg-amber-500/10 text-amber-600",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    heroIcon: "bg-amber-500 text-white",
  },
  critical: {
    icon: TriangleAlert,
    soft: "bg-rose-500/10 text-rose-600",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    heroIcon: "bg-rose-500 text-white",
  },
};

const riskMeta: Record<RiskLevel, { icon: typeof ShieldCheck; chip: string }> = {
  low: { icon: ShieldCheck, chip: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  medium: { icon: ShieldCheck, chip: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  high: { icon: ShieldAlert, chip: "border-orange-200 bg-orange-50 text-orange-700" },
  very_high: { icon: ShieldAlert, chip: "border-rose-200 bg-rose-50 text-rose-700" },
};

function formatUpdatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "เพิ่งอัปเดต";
  }
}

function displayAdminName(value: string) {
  return value.startsWith("ไม่ทราบ") ? "-" : value;
}

function DetailSection({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof Info;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group overflow-hidden rounded-3xl border border-border bg-card/85 shadow-[var(--shadow-soft)] backdrop-blur">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-4 w-4 text-sky-600" aria-hidden="true" />
          </span>
          <span className="min-w-0 break-words text-[15px] font-semibold text-foreground">{title}</span>
          {badge ? (
            <span className="shrink-0 rounded-full border border-border bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border px-4 py-4 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export default async function CheckPage({ searchParams }: CheckPageProps) {
  const params = await searchParams;
  const lat = parseCoordinate(params?.lat ?? null, 13.7563);
  const lng = parseCoordinate(params?.lng ?? null, 100.5018);
  const reverseResult = await reverseGeocodeThailand(lat, lng);

  if ("error" in reverseResult) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-cyan-50 text-slate-900">
        <div className="relative mx-auto w-full max-w-3xl px-5 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-500 text-white">
            <MapPinOff className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">อยู่นอกพื้นที่รองรับ</h1>
          <p className="mt-3 text-slate-500">ตอนนี้รองรับเฉพาะตำแหน่งในประเทศไทย</p>
        </div>
      </main>
    );
  }

  const officialAlerts = await getOfficialAlerts();
  const realtime = await getRealtimeNearby(lat, lng);
  const risk = await getFloodRisk(lat, lng, reverseResult.location, officialAlerts, {
    stations: realtime.stations,
    rainfall: realtime.rainfall,
    summaryStatus: realtime.summaryStatus,
  });
  const advice = getPreparednessAdvice(risk.baselineRisk, realtime.summaryStatus);

  const status = realtime.summaryStatus;
  const StatusIcon = statusMeta[status].icon;
  const RiskIcon = riskMeta[risk.baselineRisk].icon;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-gradient-to-b from-sky-100/80 via-[#f4f9ff] to-white text-slate-900">
      {/* misty sky */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-200/50 blur-[100px]" />
        <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-cyan-200/40 blur-[110px]" />
        <div className="absolute left-1/2 top-0 h-64 w-[720px] -translate-x-1/2 rounded-full bg-white/70 blur-[90px]" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl min-w-0 px-4 pb-12 pt-8 sm:px-5 sm:pb-16 sm:pt-10 md:pt-14">
        {/* hero */}
        <div className="text-center">
          <p className="mx-auto flex max-w-full items-center justify-center gap-1.5 break-words text-sm font-medium text-slate-700 sm:text-[15px]">
            <MapPin className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
            <span className="min-w-0 break-words">
              {displayAdminName(risk.location.subdistrict)} · {displayAdminName(risk.location.district)}
            </span>
          </p>
          <p className="mt-1 text-[13px] text-slate-500 sm:text-sm">{displayAdminName(risk.location.province)}</p>

          <div className="mt-4 flex items-center justify-center gap-3 sm:mt-5">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg sm:h-16 sm:w-16 sm:rounded-[22px] ${statusMeta[status].heroIcon}`}
            >
              <StatusIcon className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden="true" />
            </span>
          </div>
          <h1 className="mt-2 break-words text-[40px] font-semibold leading-none tracking-tight text-slate-900 sm:mt-3 sm:text-6xl md:text-7xl">
            {currentStatusLabels[status]}
          </h1>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[15px]">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${riskMeta[risk.baselineRisk].chip}`}
            >
              <RiskIcon className="h-4 w-4" aria-hidden="true" />
              {riskLevelLabels[risk.baselineRisk]}
            </span>
            <span className="text-slate-500">อัปเดต {formatUpdatedAt(risk.updatedAt)}</span>
          </p>
        </div>

        {/* human visual — hero of this version */}
        <div className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-border bg-card/80 shadow-[var(--shadow-float)] backdrop-blur sm:mt-8 sm:rounded-[28px]">
          <div className="flex items-center gap-2 border-b border-sky-100/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-600 sm:px-5 sm:py-3 sm:text-[12px]">
            <PersonStanding className="h-4 w-4" aria-hidden="true" />
            <span>ภาพระดับน้ำเทียบตัวคน</span>
          </div>
          <div className="[&_div]:!border-0 [&_div]:!shadow-none">
            <HumanWaterLevelCard
              waterDepthCm={risk.estimatedDepthCm}
              depthBandLabel={risk.depthBandLabel}
              driverName={risk.driverName}
              driverBankDiffM={risk.driverBankDiffM}
              localSignalLabel={risk.localSignalLabel}
              displayDepthCm={risk.displayDepthCm}
              displayLabel={risk.displayLabel}
              displaySource={risk.displaySource}
              estimateBasis={risk.depthBasis}
            />
          </div>
        </div>

        {/* mini map — check location */}
        <CheckMiniMapSection
          lat={lat}
          lng={lng}
          risk={risk.baselineRisk}
          caption={`${risk.location.subdistrict} · ${risk.location.district} · ${risk.location.province}`}
        />

        {/* hidden details */}
        <div className="mx-auto mt-6 grid max-w-3xl min-w-0 gap-3">
          <DetailSection icon={BellRing} title="ประกาศทางการ" badge={`${risk.alerts.length}`}>
            {risk.alerts.length === 0 ? (
              <p>ตอนนี้ไม่มีประกาศในระบบ</p>
            ) : (
              <ul className="space-y-3">
                {risk.alerts.slice(0, 4).map((alert) => (
                  <li key={alert.id} className="rounded-2xl border border-border bg-card p-3">
                    <p className="break-words font-semibold text-foreground">{alert.title}</p>
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-sky-600 underline underline-offset-4"
                    >
                      อ่านฉบับเต็ม
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <DetailSection icon={Backpack} title="เช็กลิสต์เตรียมพร้อม" badge={`${advice.checklist.length}`}>
            <ul className="space-y-2">
              {advice.checklist.map((item) => (
                <li key={item} className="flex gap-2">
                  <CloudRain className="mt-1.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </DetailSection>

          <DetailSection icon={Info} title="ทำไมประเมินแบบนี้" badge={`${risk.factors.length}`}>
            <ul className="space-y-2">
              {risk.factors.map((factor) => (
                <li key={`${factor.type}-${factor.source}`}>
                  <span className="font-medium text-slate-900">{factor.label}</span>
                  <br />
                  <span className="text-slate-500">ที่มา: {factor.source}</span>
                </li>
              ))}
            </ul>
          </DetailSection>

          <DetailSection
            icon={Waves}
            title="สถานีน้ำและฝน"
            badge={`${realtime.stations.length + realtime.rainfall.length}`}
          >
            {realtime.stations.length === 0 && realtime.rainfall.length === 0 ? (
              <p>ไม่พบสถานีในรัศมี 25 กม.</p>
            ) : (
              <ul className="space-y-2">
                {realtime.stations.slice(0, 5).map((station) => (
                  <li key={station.id} className="rounded-2xl border border-border bg-card p-3">
                    <p className="break-words font-semibold text-foreground">{station.name}</p>
                    <p className="text-slate-500">
                      {station.bankDiffM !== undefined
                        ? `${station.bankDiffM >= 0 ? "เหนือ" : "ใต้"}ตลิ่ง ${Math.abs(station.bankDiffM)} ม.`
                        : currentStatusLabels[station.status]}{" "}
                      · {station.distanceKm} กม.
                    </p>
                  </li>
                ))}
                {realtime.rainfall.slice(0, 5).map((station) => (
                  <li key={station.id} className="rounded-2xl border border-border bg-card p-3">
                    <p className="break-words font-semibold text-foreground">{station.name}</p>
                    <p className="text-slate-500">
                      ฝน {station.rain24h ?? "-"} มม./24 ชม. · {station.distanceKm} กม.
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">
              ThaiWater (สสน.) · {formatUpdatedAt(realtime.updatedAt)}
            </p>
          </DetailSection>

          {(risk.depthBasis?.length ?? 0) > 0 ? (
            <DetailSection icon={Gauge} title="ที่มาตัวเลข">
              <ul className="space-y-1">
                {(risk.depthBasis ?? []).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          {/* safety */}
          <p className="flex items-start justify-center gap-2 text-center text-[13px] leading-6 text-slate-500">
            <Info className="mt-1 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
            <span>ข้อมูลเพื่อเตรียมพร้อม ไม่ใช่คำสั่งอพยพ · ติดตามประกาศรัฐเสมอ</span>
          </p>
        </div>
      </div>
    </main>
  );
}
