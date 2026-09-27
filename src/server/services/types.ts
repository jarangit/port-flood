import type { RiskLevel } from "@/config/risk-levels";
import type { CurrentStatus } from "@/config/status-levels";

export type SafetySeverity = "info" | "watch" | "warning" | "critical";

export type LocationContext = {
  lat: number;
  lng: number;
  province: string;
  district: string;
  subdistrict: string;
  basin: string;
};

export type RiskFactor = {
  type: string;
  label: string;
  severity: SafetySeverity;
  source: string;
};

export type FloodRiskResponse = {
  location: LocationContext;
  baselineRisk: RiskLevel;
  currentStatus: CurrentStatus;
  estimatedDepthCm: number | null;
  depthBandLabel?: string;
  driverName?: string | null;
  driverBankDiffM?: number | null;
  stationWaterLevelMsl?: number | null;
  userElevationM?: number | null;
  surfaceWaterCm?: number | null;
  surfaceSource?: "msl_minus_elevation" | "unavailable";
  localSignal?: "none" | "ponding_possible" | "road_flood_possible" | "severe_watch" | "unknown";
  localSignalLabel?: string;
  displayDepthCm?: number | null;
  displayLabel?: string;
  displaySource?: "nearest_station_bank_diff" | "fallback_estimate" | "unknown";
  depthBasis?: string[];
  riskScore: number;
  confidence: "low" | "medium" | "high";
  factors: RiskFactor[];
  alerts: OfficialAlert[];
  alertsSourceStatus: "live" | "fallback";
  updatedAt: string;
  disclaimer: string;
};

export type PreparednessAdvice = {
  title: string;
  summary: string;
  checklist: string[];
};

export type OfficialAlert = {
  id: string;
  agency: "TMD" | "DDPM" | "RID" | "ONWR" | "OTHER";
  title: string;
  description: string;
  headline?: string;
  province?: string;
  severity: SafetySeverity;
  url: string;
  publishedAt: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  source: string;
};
