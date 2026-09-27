# Technical Architecture: ท่วมไทย

## Architecture Goals

- Serve location-based flood context for all of Thailand.
- Combine static geospatial risk layers with cached realtime water and weather data.
- Keep public pages fast, mobile-friendly, and resilient when upstream data sources fail.
- Make methodology, source attribution, update time, and confidence inspectable.
- Avoid storing precise user locations unless explicitly required and consented to.

## Recommended Stack

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS with design tokens
- `shadcn/ui` as the primary UI component foundation
- Radix primitives through `shadcn/ui`
- `class-variance-authority` for component variants
- MapLibre GL for maps

Backend:

- Next.js Route Handlers for MVP APIs
- Explicit backend boundary in `src/server`
- PostgreSQL with PostGIS
- Background workers for data ingestion
- Redis or database-backed cache if realtime traffic grows

Geospatial processing:

- GDAL for raster/vector processing
- Tippecanoe or equivalent for vector tile generation
- PMTiles or a tile server for large static layers

Hosting:

- Vercel for frontend and lightweight APIs
- Supabase, Neon, or managed PostgreSQL with PostGIS
- Cloud Run, Fly.io, or Render for long-running ingestion workers if needed

Observability:

- Sentry for errors
- Plausible or privacy-friendly analytics
- Uptime monitoring for API health and ingestion freshness

## Repository Boundaries

The MVP should stay in one repository. Frontend, API routes, backend services, shared domain types, database code, and ingestion scripts evolve together while the product is still changing quickly.

Recommended top-level structure:

```txt
flood-check-thailand/
  docs/
  src/
    app/
    components/
    features/
    lib/
    server/
    styles/
    config/
  scripts/
    ingest/
    geospatial/
  data/
    raw/
    processed/
    samples/
  db/
    migrations/
    seeds/
  public/
```

Boundary rules:

- `src/app` contains Next.js pages, layouts, and route handlers.
- `src/app/api` contains thin HTTP route handlers only.
- `src/server` contains backend services, database queries, external clients, and server-only logic.
- `src/components` contains UI components only and must not call the database or external agency APIs.
- `src/features` contains feature-level UI, hooks, domain types, and frontend orchestration.
- `scripts/ingest` contains scheduled data-ingestion jobs.
- `scripts/geospatial` contains GIS import and processing jobs.
- `db` contains migrations and seed data.

Route handlers should validate input, call a server service, and return a response. Business logic belongs in `src/server/services`.

Future split path, if the project outgrows the single-repo MVP:

```txt
apps/web
apps/api
apps/workers
packages/ui
packages/domain
packages/db
```

Do not split into separate frontend/backend repositories until scaling, deployment, or team boundaries make that cost worthwhile.

## Frontend Design System Architecture

The UI system is Flood Safety UI. It is based on `shadcn/ui`, Radix primitives, Tailwind CSS variables, and Atomic Design composition.

Component layers:

```txt
src/components/ui/
  shadcn-generated components only

src/components/primitives/
  low-level token-aware wrappers only when needed

src/components/atoms/
  smallest app-specific components

src/components/molecules/
  composed app-specific components

src/components/organisms/
  section-level application UI

src/components/templates/
  page layout components
```

Feature components may compose these shared components, but reusable UI should be promoted back into the shared component layers.

Token layers:

- Primitive tokens: raw palette, spacing, radii, shadow, and typography values.
- Semantic tokens: product meanings such as background, foreground, primary, risk, and status.
- Component tokens: component-specific surfaces such as alert banner border, map control background, and risk card background.

Design-system rules:

- `src/components/ui` is reserved for `shadcn/ui` generated components.
- Prefer composing `shadcn/ui` components before creating custom interactive controls.
- Use `class-variance-authority` for risk, status, size, and emphasis variants.
- Do not hard-code risk or status colors in feature components.
- Add a semantic token before adding a new public-safety color.
- Avoid arbitrary Tailwind values unless there is a documented layout reason.
- Shared components must support Thai text length and accessible labels.

## High-Level System

```txt
Browser
  -> Next.js app
  -> API route: /api/flood-risk
  -> PostGIS static risk tables
  -> cached realtime readings
  -> response with risk, current situation, advice, sources

Background workers
  -> external agency APIs/downloads
  -> normalize data
  -> validate and timestamp
  -> write latest readings and ingestion logs

Map system
  -> static vector/raster tiles
  -> realtime point overlays from API
```

## Data Flow

Location check flow:

```txt
User selects location
-> frontend validates lat/lng
-> /api/reverse-geocode resolves administrative area
-> /api/flood-risk loads static risk factors from PostGIS
-> /api/realtime/nearby loads latest cached readings near the point
-> risk engine calculates baseline risk and current situation
-> advice engine selects guidance
-> frontend renders result page
```

Realtime ingestion flow:

```txt
Scheduled worker starts
-> fetch source data
-> parse source-specific format
-> normalize to internal schema
-> validate units and timestamps
-> classify station status if thresholds exist
-> upsert latest readings
-> write ingestion log
```

## API Surface

```txt
GET /api/geocode?q=
GET /api/reverse-geocode?lat=&lng=
GET /api/flood-risk?lat=&lng=
GET /api/realtime/nearby?lat=&lng=&radiusKm=
GET /api/realtime/rainfall?lat=&lng=&radiusKm=
GET /api/realtime/water-level?lat=&lng=&radiusKm=
GET /api/realtime/dams?province=&basin=
GET /api/alerts?province=&basin=
GET /api/flood-history?lat=&lng=
GET /api/shelters?lat=&lng=&radiusKm=
GET /api/advice?riskLevel=&currentStatus=
GET /api/map/layers
GET /api/health
```

## Core Domain Models

```ts
export type RiskLevel = "low" | "medium" | "high" | "very_high";
export type CurrentStatus = "normal" | "watch" | "warning" | "critical";
export type Confidence = "low" | "medium" | "high";

export interface LocationContext {
  lat: number;
  lng: number;
  province: string;
  district: string;
  subdistrict: string;
  basin?: string;
}

export interface FloodRiskResult {
  location: LocationContext;
  baselineRisk: RiskLevel;
  currentStatus: CurrentStatus;
  riskScore: number;
  confidence: Confidence;
  factors: RiskFactor[];
  realtime: RealtimeWaterStatus;
  advice: PreparednessAdvice;
  sources: DataSourceReference[];
  updatedAt: string;
  disclaimer: string;
}

export interface RiskFactor {
  type:
    | "historical_flood"
    | "low_elevation"
    | "near_river"
    | "heavy_rain"
    | "high_water_level"
    | "dam_discharge"
    | "official_warning";
  label: string;
  severity: "info" | "watch" | "warning" | "critical";
  value?: number;
  unit?: string;
  source: string;
}
```

## Database Sketch

Tables for static geospatial data:

```txt
admin_boundaries
- id
- level: province | district | subdistrict
- name_th
- name_en
- parent_id
- geom geometry

river_network
- id
- name
- type
- geom geometry

flood_history_areas
- id
- source
- event_date
- year
- max_depth_cm nullable
- confidence
- geom geometry

elevation_tiles_or_cells
- id
- elevation_m
- source
- geom geometry

baseline_risk_cells
- id
- risk_score
- risk_level
- confidence
- factors jsonb
- geom geometry
```

Tables for realtime data:

```txt
stations
- id
- source
- source_station_id
- station_type: rain | water_level | dam | weather
- name_th
- name_en
- province
- basin
- river
- geom geometry(Point)
- metadata jsonb

station_readings_latest
- station_id
- reading_type
- value
- unit
- status
- observed_at
- ingested_at
- raw jsonb

station_readings_history
- station_id
- reading_type
- value
- unit
- status
- observed_at
- ingested_at

official_alerts
- id
- source
- title
- description
- severity
- province
- basin
- url
- published_at
- expires_at nullable
- raw jsonb

ingestion_runs
- id
- source
- status
- started_at
- finished_at
- records_seen
- records_written
- error_message nullable
```

## Risk Engine V1

Risk V1 should be transparent and conservative.

Baseline risk inputs:

- Historical flood exposure.
- Elevation or lowland indicator.
- Distance to river or canal.
- Administrative area recurrence if available.
- Data availability and confidence.

Current situation inputs:

- Nearby rainfall over 1 hour, 3 hours, and 24 hours when available.
- Nearby river/canal water level status.
- Dam or reservoir storage and discharge if relevant.
- Official alerts matching province or basin.

Example scoring:

```txt
baseline_score =
  historical_flood_score * 0.45 +
  elevation_score * 0.25 +
  river_distance_score * 0.20 +
  administrative_recurrence_score * 0.10

current_status = max severity from:
  rainfall_status,
  water_level_status,
  dam_status,
  official_alert_status
```

The UI must not merge these into one ambiguous warning. It should show baseline risk and current situation separately.

## Caching and Resilience

- Never fetch multiple external agency APIs directly during a user page request for MVP.
- Fetch upstream sources through scheduled jobs.
- Store latest normalized readings locally.
- Show stale-data warnings when readings are older than expected.
- Keep static baseline risk available even if realtime ingestion fails.
- Log source-level failures separately so one broken feed does not block all results.

## Privacy

- Current location should be processed client-side and sent only to the result API.
- Do not store raw user location in analytics.
- If server logs include query parameters, configure redaction or avoid precise lat/lng logging.
- Share URLs may include rounded coordinates or a generated location token depending on privacy decision.
- Provide a clear privacy page in Thai.

## Accessibility and Performance

- Result summary must be readable without interacting with a map.
- Map colors must not be the only indicator of risk.
- Use text labels, legends, and accessible status components.
- Pages must work on mobile first.
- Optimize for low-bandwidth users during severe weather.
- Avoid requiring WebGL-only map content for critical information.

## Security

- Validate all lat/lng and radius parameters.
- Rate-limit public APIs.
- Sanitize external alert text before rendering.
- Keep API keys server-side.
- Use strict CORS if APIs are not meant for external consumers.
- Keep ingestion raw payloads away from public responses unless reviewed.

## Deployment Environments

Recommended environments:

- Local: developer environment with sample data.
- Staging: public preview with limited ingestion and test sources.
- Production: monitored public service.

Environment variables:

```txt
DATABASE_URL=
NEXT_PUBLIC_MAP_STYLE_URL=
GEOCODING_PROVIDER=
GEOCODING_API_KEY=
THAIWATER_API_KEY=
TMD_API_KEY=
RID_API_KEY=
SENTRY_DSN=
```

## Initial Technical Risks

- Thai agency data access may vary by endpoint, license, stability, and format.
- Nationwide historical flood and depth data may be uneven.
- DEM resolution may be too coarse for house-level claims.
- Realtime thresholds may be station-specific and not always publicly documented.
- Users may misread baseline risk as realtime danger unless UI language is precise.

## Recommended MVP Build Order

1. Next.js app shell and static content pages.
2. Flood Safety UI setup with `shadcn/ui`, tokens, and atomic folders.
3. Map and location selection.
4. PostGIS setup and administrative boundary lookup.
5. Static risk prototype using available open layers.
6. Realtime ingestion proof of concept for one or two sources.
7. Result page with split baseline/current summary.
8. Source attribution, timestamps, and data limitation pages.
9. Mobile, accessibility, and performance hardening.
