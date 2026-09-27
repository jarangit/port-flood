# Flood Check Thailand

Public project concept for a Thailand-wide flood preparedness website inspired by Overstroom ik.

The project helps people check flood risk for a location, understand nearby realtime water and weather signals, and prepare with clear public-safety guidance.

## Documents

- [PRD](docs/PRD.md)
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [API Contract](docs/API_CONTRACT.md)
- [Data Sources](docs/DATA_SOURCES.md)
- [Implementation Backlog](docs/BACKLOG.md)

## Architecture Direction

Flood Check Thailand starts as a single repository with frontend, API routes, backend services, database code, and data-ingestion scripts kept together. Backend boundaries still stay explicit through `src/server`, `src/app/api`, `scripts`, and `db` so the project can split into separate apps later if needed.

The UI foundation is Flood Safety UI, a `shadcn/ui`-based design system using Tailwind CSS through primitive, semantic, and component-level design tokens.

## Local Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm run build
```

API routes use real open data sources with graceful fallback; see Current Data Status below.

## Current Data Status

- Place search and reverse geocoding use OpenStreetMap Nominatim.
- Weather warning alerts use the Thai Meteorological Department WeatherWarningNews API.
- Nearby water-level and rainfall readings use the ThaiWater v3 public API.
- Flood depth is estimated from nearby ThaiWater station overflow and rainfall (null with an empty state when no station is in range).
- Baseline risk is scored from GISTDA repeated-flooding history (2005-2016), OpenTopoData SRTM elevation, and nearby OSM waterways, plus live ThaiWater/TMD modifiers.
- Dam and reservoir readings (`/api/realtime/dams`) still return an empty list.
- Do not launch this as a public safety production service until real flood datasets, realtime ingestion, source freshness, and safety review are complete.
