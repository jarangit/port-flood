"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";

import type { RiskLevel } from "@/config/risk-levels";
import { RISK_HEX, dotPin } from "@/components/molecules/map-pins";
import { MAP_TILES } from "@/components/molecules/map-themes";

export type TravelMapSegment = {
  startKm: number;
  endKm: number;
  risk: RiskLevel;
};

type TravelMapCanvasProps = {
  coordinates?: [number, number][];
  segments?: TravelMapSegment[];
  distanceKm?: number;
};

const THAILAND_CENTER: [number, number] = [15.87, 100.9925];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function FitRouteBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const bounds = useMemo(() => L.latLngBounds(positions), [positions]);
  // Keep route clear of the floating panel on desktop by padding the left side.
  useEffect(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    map.fitBounds(bounds, {
      padding: [40, 40],
      paddingTopLeft: isDesktop ? L.point(440, 40) : undefined,
    });
  }, [map, bounds]);
  return null;
}

/** Fullscreen Apple-Maps-style canvas. Shows Thailand overview until a route result arrives. */
export function TravelMapCanvas({ coordinates = [], segments = [], distanceKm = 0 }: TravelMapCanvasProps) {
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

  const hasRoute = positions.length >= 2;
  const boundsKey = hasRoute
    ? `${positions[0][0].toFixed(4)},${positions[0][1].toFixed(4)}-${positions[positions.length - 1][0].toFixed(4)},${positions[positions.length - 1][1].toFixed(4)}`
    : "thailand-overview";

  if (!hasRoute) {
    return (
      <MapContainer
        key={boundsKey}
        center={THAILAND_CENTER}
        zoom={6}
        scrollWheelZoom
        zoomControl={false}
        className="z-0 h-full w-full"
      >
        <TileLayer attribution={MAP_TILES.attribution} url={MAP_TILES.url} />
        <ZoomControl position="bottomright" />
      </MapContainer>
    );
  }

  const start = positions[0];
  const end = positions[positions.length - 1];

  return (
    <MapContainer
      key={boundsKey}
      bounds={L.latLngBounds(positions)}
      scrollWheelZoom
      zoomControl={false}
      className="z-0 h-full w-full"
    >
      <TileLayer attribution={MAP_TILES.attribution} url={MAP_TILES.url} />
      <ZoomControl position="bottomright" />
      <FitRouteBounds positions={positions} />
      <Polyline positions={positions} pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.95 }} />
      {coloredRuns.map(({ key, run, risk }) => (
        <Polyline
          key={key}
          positions={run}
          pathOptions={{ color: RISK_HEX[risk], weight: 5, opacity: 0.95 }}
        />
      ))}
      <Marker position={start} icon={dotPin("#0284c7")} />
      <Marker position={end} icon={dotPin("#0f1729")} />
    </MapContainer>
  );
}
