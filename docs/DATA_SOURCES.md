# Data Sources

## Source Evaluation Principles

- Prefer official or clearly attributed public-interest sources.
- Confirm license and reuse conditions before production use.
- Cache upstream data locally instead of depending on live upstream calls during user requests.
- Store source name, observed time, ingested time, and raw payload references where appropriate.
- Show stale-data warnings when data is older than expected.

## Candidate Sources

### OpenStreetMap Nominatim

Current use:

- Place search in `/api/geocode`.
- Reverse geocoding in `/api/reverse-geocode`.
- Location names shown on `/check`.

Production notes:

- Public Nominatim has usage limits and requires a valid user agent.
- For production traffic, use a dedicated geocoding provider or self-host Nominatim/Photon/Pelias.
- OpenStreetMap attribution must be shown where geocoding-derived place names are used.
- This source gives location names, not flood risk.

Environment variables:

- `NOMINATIM_BASE_URL`
- `NOMINATIM_USER_AGENT`

### ThaiWater / HAII

Potential use:

- Rainfall stations.
- Water-level stations.
- National water situation context.

Current use:

- `/api/realtime/nearby`, `/api/realtime/water-level`, and `/api/realtime/rainfall` read the ThaiWater v3
  public API with no key: `waterlevel_load` (805 stations with lat/lon and `situation_level`) and
  `rain_24h` (4,400+ stations). Responses are cached server-side for 10 minutes, then filtered by
  distance to the selected location.
- `situation_level` 1/2/3/4-5 maps to normal/watch/warning/critical; rainfall uses Thai criteria
  (35.1 mm warning, 90 mm critical per 24h).
- If ThaiWater is unreachable, the APIs return `sourceStatus: "fallback"` with empty station lists
  instead of mock stations.

Questions:

- What are the rate limits and attribution requirements?
- Are station warning thresholds included or must they be derived?

Environment variables:

- `THAIWATER_BASE_URL`

### Thai Meteorological Department

Potential use:

- Weather warnings.
- Storm warnings.
- Rainfall forecasts.

Current use:

- `/api/alerts` reads `WeatherWarningNews/v2` and maps current TMD warnings into the app's alert contract.

Endpoint:

- `https://data.tmd.go.th/api/WeatherWarningNews/v2/?uid=demo&ukey=demokey`

Questions:

- Which endpoints provide structured warning data?
- Can warnings be mapped reliably to provinces?
- What timestamp should be treated as publication time?

Current limitations:

- The warning feed is national/free-text and is not yet mapped to province-level applicability.
- The API response is XML, so the app uses a narrow parser for the warning fields currently needed.
- If the TMD endpoint fails, `/api/alerts` returns a fallback item linking users to the TMD website.

### Royal Irrigation Department

Potential use:

- Dam and reservoir status.
- River and irrigation water situation.
- Discharge context.

Questions:

- Which dam and reservoir feeds are reusable?
- Are units and thresholds consistent across sources?
- How should dam data be mapped to downstream areas or basins?

### Department of Disaster Prevention and Mitigation

Potential use:

- Disaster announcements.
- Affected area reports.
- Emergency guidance links.

Questions:

- Is there structured machine-readable access?
- Are announcements province-level, district-level, or free text?
- How should expired announcements be handled?

### Office of the National Water Resources

Potential use:

- Basin-level water situation.
- National water reports.
- Policy and context links.

Questions:

- Are reports structured or PDF-only?
- Can basin statuses be mapped to user locations?

### GISTDA

Potential use:

- Satellite flood extent.
- Recent and historical flood maps.
- Validation context for flood history.

Current use:

- `/api/flood-risk` queries the keyless ArcGIS REST FeatureServer
  `FL_Flood/FL_RepeatedFlooding_GISTDA_50k_Y2005_Y2016` with a point-in-polygon query and reads
  `flood_freq` plus per-year flags (2005-2016). Results are cached server-side for 30 days.
  Vintage (ends 2016) and 1:50,000 scale are stated on the result page; attribute GISTDA.
- Newer gateway datasets (`flood-recurrence` 2011-2023, `flood-extent-1day`) require a free API key
  from https://api-gateway.gistda.or.th/v2 and are a future upgrade, not yet integrated.
- GISTDA floodcheck (request key via innotech@gistda.or.th) exposes point APIs under
  `https://floodcheck.gistda.or.th`: `tambon_latlon?lat=&lon=` (hourly weather and flood risk),
  `floodroad` (road-surface water-level stations), `waterlevel`, `cctv`. Auth uses an API key
  (query `api_key` or header). Status 2026-09-26: key is valid but scoped to `cctv` only
  (`cctv` returns 200 with camera data; `tambon_latlon`/`floodroad`/`waterlevel` return
  `invalid API key`/`Unauthorized`) — asked GISTDA to enable `tambon_latlon` (hourly flood risk)
  and `floodroad` (road sensors) for this key before integrating.

Questions:

- What is the exact reuse license for the ArcGIS portal layers? Confirm before production use.
- Which historical flood layers are downloadable or accessible?
- What attribution is required?

Environment variables:

- `GISTDA_FLOOD_BASE_URL`

### OpenStreetMap

Potential use:

- Rivers and canals.
- Roads.
- Hospitals, schools, temples, and public buildings.
- Basemap context and potential shelter candidates.

Current use:

- `/api/flood-risk` queries the Overpass API (`way(around:2000)[waterway]`, GET request) for the
  nearest river/canal/stream center and scores distance (<500 m / <1500 m). Results are cached
  server-side for 30 days keyed by rounded coordinates, per Overpass fair-use rules.

Questions:

- Which tags should define waterways and public facilities?
- How often should extracts be refreshed?
- How will OSM attribution be shown?

Environment variables:

- `OVERPASS_BASE_URL`
- `OVERPASS_USER_AGENT`

### DEM Datasets

Potential use:

- Elevation and lowland signals.
- Baseline flood-risk scoring.

Current use:

- `/api/flood-risk` reads point elevation from the OpenTopoData public API (`srtm30m`, ~30 m
  global, no key) and scores lowland bands (<5 m / <15 m / <30 m). Public limits are
  1 request/second and 1000 calls/day, so results are cached server-side for 30 days keyed by
  rounded coordinates and the score degrades gracefully when elevation is unavailable.

Candidate datasets:

- SRTM.
- Copernicus DEM.
- ALOS World 3D.

Questions:

- Which dataset has the best balance of coverage, license, and resolution?
- How should coarse elevation be communicated without overclaiming house-level precision?

Environment variables:

- `OPENTOPODATA_BASE_URL`

## Initial Research Backlog

- Document ThaiWater access and sample response.
- Document TMD warning access and sample response.
- Document RID dam/reservoir access and sample response.
- Document DDPM announcement access or blocker.
- Document ONWR report access or blocker.
- Document GISTDA flood-layer access and license.
- Pick canonical administrative boundary dataset.
- Pick initial DEM dataset.
