"use client";

import { useMemo } from "react";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";

import type { RiskLevel } from "@/config/risk-levels";
import { RISK_HEX, dotPin } from "@/components/molecules/map-pins";

type MiniLocationMapProps = {
  lat: number;
  lng: number;
  risk: RiskLevel;
};

/** Read-only mini map of the checked location. Loaded with ssr:false. */
export function MiniLocationMap({ lat, lng, risk }: MiniLocationMapProps) {
  const color = RISK_HEX[risk];
  const pin = useMemo(() => dotPin(color), [color]);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="z-0 h-[220px] w-full sm:h-[260px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={[lat, lng]}
        radius={1000}
        pathOptions={{ color, weight: 1.5, fillColor: color, fillOpacity: 0.12 }}
      />
      <Marker position={[lat, lng]} icon={pin} />
    </MapContainer>
  );
}
