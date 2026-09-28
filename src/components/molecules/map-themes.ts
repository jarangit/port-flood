/**
 * Shared Leaflet base-map theme.
 *
 * OpenStreetMap Standard tiles (keyless, Thai labels preserved). The muted
 * Apple-Maps-like look is achieved with a CSS filter on `.leaflet-tile-pane`
 * (see `src/styles/globals.css`), which only affects the tile layer — route
 * overlays, pins and circles keep their full risk colors.
 *
 * NOTE: CARTO basemaps were tried before but now return an "API key
 * required" placeholder tile for keyless requests, so they are not used.
 */
export const MAP_TILES = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
} as const;
