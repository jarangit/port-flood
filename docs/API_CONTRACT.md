# API Contract

## Contract Principles

- APIs are public-facing but not yet stable for external consumers during MVP.
- Route handlers in `src/app/api` should stay thin.
- Server logic belongs in `src/server/services`.
- Every response that makes a safety-related claim should include sources and timestamps.
- Missing data should be explicit, not silently treated as safe.

## Shared Types

```ts
type RiskLevel = "low" | "medium" | "high" | "very_high";
type CurrentStatus = "normal" | "watch" | "warning" | "critical";
type Confidence = "low" | "medium" | "high";
```

## Error Shape

```json
{
  "error": {
    "code": "INVALID_LOCATION",
    "message": "Latitude and longitude must be inside Thailand.",
    "details": {}
  }
}
```

## GET /api/geocode?q=

Search for a place by text.

Current implementation uses OpenStreetMap Nominatim filtered to Thailand. Production use should move to a dedicated geocoding service or self-hosted geocoder if traffic grows.

A 5-digit query is treated as a postcode: the service uses Nominatim's structured
`postalcode` lookup (falling back to text search), dedupes near-identical points, and
returns results with `"isPostcode": true` so the UI can ask the user to pick instead of
auto-picking the first match. Because Nominatim resolves a postcode to a single centroid,
the service also appends named places from the same district (within 12 กม., up to 5) as
sibling choices. Postcode coordinates are approximate — the UI nudges users toward
"ใช้ตำแหน่งฉัน" when they are on site.

Response:

```json
{
  "results": [
    {
      "label": "อำเภอเมืองเชียงใหม่, จังหวัดเชียงใหม่",
      "lat": 18.7883,
      "lng": 98.9853,
      "province": "เชียงใหม่",
      "district": "เมืองเชียงใหม่",
      "subdistrict": null,
      "source": "geocoding-provider"
    }
  ]
}
```

## GET /api/reverse-geocode?lat=&lng=

Resolve coordinates to administrative context.

Current implementation uses OpenStreetMap Nominatim and rejects coordinates outside Thailand's bounding box.

Response:

```json
{
  "location": {
    "lat": 13.7563,
    "lng": 100.5018,
    "province": "กรุงเทพมหานคร",
    "district": "พระนคร",
    "subdistrict": "พระบรมมหาราชวัง",
    "basin": "เจ้าพระยา"
  },
  "sources": [
    {
      "name": "Administrative boundaries",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## GET /api/flood-risk?lat=&lng=

Return baseline flood risk and current situation for a point.

`baselineRisk` comes only from slow-changing signals (GISTDA flood history 2005-2016,
OpenTopoData SRTM elevation, nearby OSM waterway). `riskScore` (0-100) adds live
modifiers (ThaiWater water level and rainfall severity, active TMD alerts) on top.
`currentStatus` mirrors the worst nearby realtime severity. The figure uses the nearest
water-level station as its driver (`driverName`) so it matches the first
"ระดับน้ำใกล้คุณ" card, and `displayDepthCm`/`displayLabel` show that station's real
bank-difference reading (for example, "สูงกว่าตลิ่ง 49 ซม."). `localSignal`/
`localSignalLabel` carry the street-level signal combined from station overflow and
areal rain (`none`, `ponding_possible`, `road_flood_possible`, `severe_watch`).
`surfaceWaterCm` (station MSL minus SRTM elevation) is supporting context in `depthBasis`
only — it never decides the figure, because SRTM is coarse and urban flooding comes from
rain and drainage, not just river levels. `estimatedDepthCm`/`depthBandLabel` remain as
fallback estimates when the nearest station has no bank-difference reading.

Water stations also carry `trendM` (change in ม.รทก. since the previous reading, omitted
when unavailable) and `bankStatusText` (ThaiWater's own Thai bank-status description).

Response:

```json
{
  "location": {
    "lat": 13.7563,
    "lng": 100.5018,
    "province": "กรุงเทพมหานคร",
    "district": "พระนคร",
    "subdistrict": "พระบรมมหาราชวัง",
    "basin": "เจ้าพระยา"
  },
  "baselineRisk": "medium",
  "currentStatus": "critical",
  "estimatedDepthCm": 130,
  "depthBandLabel": "เกิน 100 ซม.",
  "driverName": "อโศก",
  "driverBankDiffM": 0.92,
  "surfaceWaterCm": -490,
  "surfaceSource": "msl_minus_elevation",
  "localSignal": "severe_watch",
  "localSignalLabel": "พื้นที่ต่ำอาจมีน้ำท่วม ควรหลีกเลี่ยงเส้นทางต่ำ",
  "displayDepthCm": 92,
  "displayLabel": "สูงกว่าตลิ่ง 92 ซม.",
  "displaySource": "nearest_station_bank_diff",
  "depthBasis": ["ใช้สถานีใกล้สุด อโศก สูงกว่าตลิ่ง 0.92 ม. ห่างประมาณ 6.7 กม."],
  "riskScore": 50,
  "confidence": "high",
  "factors": [
    {
      "type": "historical_flood",
      "label": "จุดนี้ไม่อยู่ในชั้นข้อมูลพื้นที่น้ำท่วมซ้ำซาก 2548-2559",
      "severity": "info",
      "source": "GISTDA พื้นที่น้ำท่วมซ้ำซาก 2548-2559"
    }
  ],
  "alerts": [],
  "alertsSourceStatus": "live",
  "updatedAt": "2026-09-26T00:00:00.000Z",
  "disclaimer": "คะแนนนี้ประเมินจากข้อมูลเปิดเพื่อการเตรียมพร้อม ไม่ใช่คำสั่งอพยพ โปรดติดตามประกาศจากหน่วยงานรัฐเสมอ"
}
```

## GET /api/realtime/nearby?lat=&lng=&radiusKm=

Return nearby realtime water and weather readings from ThaiWater.

`summaryStatus` is the worst severity across nearby water-level and rainfall stations.
`sourceStatus` is `live` when ThaiWater responded, otherwise `fallback` with empty lists.
`searchRadiusKm` is the radius used to find water-level stations. The API starts with the
requested radius, then expands to 50 km and 100 km when no water-level station is found,
so the result page can still show the nearest available water signal with the true distance.

Response:

```json
{
  "summaryStatus": "watch",
  "sourceStatus": "live",
  "searchRadiusKm": 25,
  "stations": [],
  "rainfall": [],
  "dams": [],
  "updatedAt": "2026-09-26T00:00:00.000Z"
}
```

## GET /api/alerts?province=&basin=

Return official warning links filtered by province or basin where possible.

Current implementation reads Thai Meteorological Department `WeatherWarningNews/v2`. Province and basin filtering are not implemented yet because the TMD warning text is national/free-text in the current integration.

Response:

```json
{
  "sourceStatus": "live",
  "updatedAt": "2026-09-26T00:00:00.000Z",
  "alerts": [
    {
      "id": "tmd-2026-001",
      "agency": "TMD",
      "title": "ประกาศฝนตกหนัก",
      "description": "พื้นที่เสี่ยงควรติดตามประกาศใกล้ชิด",
      "province": "เชียงใหม่",
      "severity": "warning",
      "url": "https://example.go.th/alert",
      "publishedAt": "2026-09-26T00:00:00.000Z"
    }
  ]
}
```

## GET /api/advice?riskLevel=&currentStatus=

Return preparedness advice for the selected risk and current situation.

Response:

```json
{
  "title": "เตรียมพร้อมและติดตามสถานการณ์",
  "summary": "พื้นที่นี้มีปัจจัยเสี่ยงและมีสัญญาณที่ควรติดตาม",
  "checklist": [
    "ติดตามประกาศจากหน่วยงานรัฐ",
    "เตรียมยาประจำตัว เอกสารสำคัญ และแบตเตอรี่สำรอง",
    "วางแผนดูแลเด็ก ผู้สูงอายุ ผู้พิการ และสัตว์เลี้ยง"
  ]
}
```
