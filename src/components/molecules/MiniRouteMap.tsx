"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import type { RiskLevel } from "@/config/risk-levels";
import { RISK_HEX, dotPin } from "@/components/molecules/map-pins";

export type RouteMapSegment = {
  startKm: number;
  endKm: number;
  risk: RiskLevel;
};

type MiniRouteMapProps = {
  /** Route geometry as [lng, lat] pairs from OpenRouteService. */
  coordinates: [number, number][];
  segments: RouteMapSegment[];
  distanceKm: number;
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const bounds = useMemo(() => L.latLngBounds(positions), [positions]);
  map.fitBounds(bounds, { padding: [24, 24] });
  return null;
}

/** Read-only mini map of the real route, colored by flood-risk segment. Loaded with ssr:false. */
export function MiniRouteMap({ coordinates, segments, distanceKm }: MiniRouteMapProps) {
  const positions = useMemo<[number, number][]>(
    () => coordinates.map(([lng, lat]) => [lat, lng]),
    [coordinates],
  );

  const coloredRuns = useMemo(() => {
    if (positions.length < 2 || segments.length === 0 || distanceKm <= 0) return [];

    const cumulative: number[] = [0];
    for (let index = 1; index < positions.length; index += 1) {
      const [prevLat, prevLng] = positions[index - 1];
      const [lat, lng] = positions[index];
      cumulative.push(cumulative[index - 1] + haversineKm(prevLat, prevLng, lat, lng));
    }
    const totalHav = cumulative[cumulative.length - 1] || 1;
    // ORS summary distance can differ slightly from haversine sum, so scale km boundaries.
    const scale = totalHav / distanceKm;

    return segments.flatMap((segment, segmentIndex) => {
      const fromKm = Math.max(0, segment.startKm * scale);
      const toKm = Math.min(totalHav, segment.endKm * scale);

      let startIndex = cumulative.findIndex((km) => km >= fromKm);
      if (startIndex === -1) startIndex = cumulative.length - 1;
      startIndex = Math.max(0, startIndex - 1);
      let endIndex = cumulative.findIndex((km) => km >= toKm);
      if (endIndex === -1) endIndex = cumulative.length - 1;

      const run = positions.slice(startIndex, endIndex + 1);
      if (run.length < 2) return [];
      return [{ key: `${segmentIndex}-${segment.startKm}-${segment.endKm}`, run, risk: segment.risk }];
    });
  }, [positions, segments, distanceKm]);

  if (positions.length === 0) return null;

  const start = positions[0];
  const end = positions[positions.length - 1];
  const boundsKey = `${start[0].toFixed(4)},${start[1].toFixed(4)}-${end[0].toFixed(4)},${end[1].toFixed(4)}`;

  return (
    <MapContainer
      key={boundsKey}
      bounds={L.latLngBounds(positions)}
      scrollWheelZoom={false}
      className="z-0 h-[220px] w-full sm:h-[280px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds positions={positions} />
      {/* white casing under the colored runs for contrast on the base map */}
      <Polyline positions={positions} pathOptions={{ color: "#ffffff", weight: 7, opacity: 0.9 }} />
      {coloredRuns.map(({ key, run, risk }) => (
        <Polyline
          key={key}
          positions={run}
          pathOptions={{ color: RISK_HEX[risk], weight: 4, opacity: 0.95 }}
        />
      ))}
      <Marker position={start} icon={dotPin("#0284c7")} />
      <Marker position={end} icon={dotPin("#0f1729")} />
    </MapContainer>
  );
}
