import type { RiskLevel } from "@/config/risk-levels";
import type { CurrentStatus } from "@/config/status-levels";

export type TravelMode = "car" | "motorcycle";

export type RoutePoint = {
  lat: number;
  lng: number;
  label: string;
};

export type RouteRiskRequest = {
  origin: RoutePoint;
  destination: RoutePoint;
  mode: TravelMode;
};

export type RouteSamplePoint = {
  lat: number;
  lng: number;
  distanceKm: number;
  timeMin: number;
};

export type RouteRiskSegment = {
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

export type RouteRiskResponse = {
  origin: RoutePoint;
  destination: RoutePoint;
  mode: TravelMode;
  distanceKm: number;
  durationMin: number;
  sampleCount: number;
  source: "openrouteservice";
  disclaimer: string;
  /** Full route geometry as [lng, lat] pairs from OpenRouteService, for mini map display. */
  coordinates: [number, number][];
  segments: RouteRiskSegment[];
};
