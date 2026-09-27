import L from "leaflet";

export const RISK_HEX = {
  low: "#34d399",
  medium: "#facc15",
  high: "#f97316",
  very_high: "#fb7185",
} as const;

/** Small dot pin rendered as pure HTML so no Leaflet image assets are needed. */
export function dotPin(color: string, size = 18) {
  return L.divIcon({
    className: "flood-map-pin",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,0.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
