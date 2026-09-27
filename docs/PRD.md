# PRD: Flood Check Thailand

## Working Name

Flood Check Thailand

Thai naming candidates:

- ท่วมไหม
- น้ำจะท่วมฉันไหม
- เช็กน้ำท่วมบ้าน
- น้ำถึงบ้านไหม

## Vision

Create a public, Thai-first flood preparedness website that lets anyone in Thailand check the flood risk around a home, workplace, school, or current location, understand nearby realtime water and weather signals, and know what to prepare before conditions become dangerous.

The product should feel like a public-safety service for ordinary people, not an expert dashboard.

## Problem

Flood information in Thailand is fragmented across agencies, formats, maps, announcements, and local news. People often see warnings at province, basin, or river level but still cannot answer simple questions:

- Is my home or workplace in a flood-prone area?
- Are nearby rainfall or water-level signals concerning right now?
- What should I do before water reaches my area?
- Which official sources should I follow?

## Goals

- Let users check a specific location anywhere in Thailand.
- Show baseline flood risk using geography, history, and proximity factors.
- Show realtime water and weather context near the selected location.
- Provide clear preparedness advice based on risk and current signals.
- Make sources, timestamps, confidence, and limitations visible.
- Build public trust through transparency, privacy, accessibility, and open documentation.

## Non-Goals

- Do not act as an official evacuation order system.
- Do not replace announcements from DDPM, TMD, RID, ONWR, provinces, municipalities, or local authorities.
- Do not claim exact flood-depth prediction without validated hydraulic scenario data.
- Do not store precise user location unless there is a clear opt-in public-interest feature.
- Do not launch as a crisis-only site that depends on external APIs being available in real time.

## Target Users

- Residents checking homes, apartments, dormitories, or family homes.
- Workers checking offices, factories, schools, or shops.
- Families caring for children, elderly people, people with disabilities, or pets.
- Community volunteers and local civil-society groups.
- Journalists and researchers needing public-facing context.
- Local administrations that want to share simple preparedness links.

## Key User Stories

- As a resident, I want to use my current location so I can quickly see whether my area has flood risk.
- As a user, I want to search by place name so I can check my family home even if I am elsewhere.
- As a commuter, I want nearby water and rainfall signals so I can understand whether conditions are changing.
- As a parent, I want simple guidance so I know what to prepare before a warning escalates.
- As a community volunteer, I want to share a result link or QR code so neighbors can check the same area.
- As a cautious user, I want to see data sources and timestamps so I know whether the result is current.

## Core Experience

1. User opens the homepage.
2. User searches a place, drops a pin, or allows current location.
3. The site shows two separate summaries:
   - Baseline flood risk: geography and historical risk.
   - Current water situation: realtime and official warning signals.
4. User sees a map, risk factors, nearby stations, alert links, and preparedness advice.
5. User can share the result page.

## Site Map

```txt
/
  Homepage
  Location search
  Use current location
  Short explanation of the service

/check?lat=&lng=
  Location result page
  Baseline flood risk
  Current water situation
  Map and nearby stations
  Preparedness advice
  Share result

/map
  Full-screen map
  Flood risk layer
  Realtime rainfall layer
  Realtime water-level layer
  Dam/reservoir layer
  Official alerts layer
  Shelter and important-place layer

/alerts
  Official warnings and situation links
  Filter by province and basin

/prepare
  Preparedness guide
  Before flood
  During flood
  After flood
  Household checklist
  Guidance for elderly people, children, disabled people, and pets

/data
  Data sources
  Methodology
  Update frequency
  Confidence and limitations

/faq
  Common questions
  Why results may differ from a nearby house
  Why the site is not an evacuation-order system
  What realtime data means

/about
  Project mission
  Public project statement
  Contributors and contact

/privacy
  Location privacy
  Analytics policy
  Data retention policy

/accessibility
  Accessibility statement
```

## Information Architecture on Result Page

The result page should use clear public-safety language.

Top summary:

- Location name: province, district, subdistrict, nearest known place.
- Baseline risk: low, medium, high, very high.
- Current situation: normal, watch, warning, critical.
- Last updated time.
- Link to official sources.

Risk explanation:

- Historical flood signal.
- Elevation and terrain signal.
- Distance to river, canal, or lowland.
- Nearby realtime rainfall.
- Nearby realtime water level.
- Dam/reservoir context if relevant.
- Official alert context.

Advice:

- What this means.
- What to prepare today.
- When to follow official orders.
- Emergency contacts and official links.

## Risk Language

Baseline flood risk and current situation must be separated.

Baseline flood risk:

- Low: limited available evidence of recurring flood exposure.
- Medium: some flood-prone factors exist.
- High: multiple flood-prone factors exist.
- Very high: strong historical/geographic flood-prone signals.

Current situation:

- Normal: no nearby signal is elevated.
- Watch: some rainfall, water level, or official warning signals should be monitored.
- Warning: nearby signals are concerning or official warnings apply.
- Critical: severe nearby signals or critical official warnings apply.

## Data Sources to Investigate

Primary candidates:

- ThaiWater / HAII: rainfall stations, water-level stations, water situation.
- Thai Meteorological Department: weather warnings, storm warnings, rainfall forecasts.
- Royal Irrigation Department: dam, reservoir, river, irrigation status.
- Department of Disaster Prevention and Mitigation: disaster announcements and affected areas.
- Office of the National Water Resources: basin-level and national water situation reports.
- GISTDA: satellite flood extent and historical flood monitoring.
- OpenStreetMap: roads, waterways, hospitals, schools, public buildings, potential shelter context.
- DEM datasets: SRTM, Copernicus DEM, ALOS World 3D.
- Administrative boundaries: province, district, subdistrict boundaries.

## Safety and Trust Requirements

- Every result must show data sources and timestamps.
- Every result must show a disclaimer that official announcements take priority.
- Confidence must be visible when data quality varies by area.
- The product must avoid alarming language unless backed by official alerts or severe realtime signals.
- Location permission must be optional.
- The site should work well on mobile and slow networks.
- Accessibility should be treated as a core requirement.

## UI Design System Requirements

The product uses Flood Safety UI as its design system.

- Use `shadcn/ui` as the primary component foundation for buttons, inputs, cards, dialogs, sheets, tabs, accordions, selects, badges, alerts, tooltips, toasts, and form controls.
- Use Radix primitives through `shadcn/ui` rather than building low-level interactive controls from scratch.
- Use Tailwind CSS through design tokens only. Feature components should not hard-code public-safety colors such as `text-red-500` or `bg-yellow-100`.
- Separate token levels into primitive tokens, semantic tokens, and component tokens.
- Risk and current-situation UI must use semantic tokens such as `risk-low`, `risk-high`, `status-warning`, and `status-critical`.
- Shared app-specific components should follow Atomic Design layers: atoms, molecules, organisms, templates, and pages.
- Components must support Thai-first content, including longer labels and line wrapping.
- Status and risk indicators must not rely on color alone. Use text labels, icons, patterns, or supporting descriptions.
- Map controls, alerts, and result cards must remain usable on mobile screens and low-bandwidth connections.

## MVP Definition

The first public beta is complete when users can:

- Search or use current location anywhere in Thailand.
- See province, district, and subdistrict for the selected point.
- See a baseline flood risk score with visible factors and confidence.
- See nearby realtime rainfall and water-level stations where available.
- See official warning links filtered to the relevant province or basin where possible.
- Read preparedness advice matched to the risk and current situation.
- Share a stable result URL.
- Read data methodology, limitations, privacy policy, and FAQ pages.

## Success Metrics

- Users can get a result in under 5 seconds for cached data.
- Result pages show clear source attribution and timestamps.
- At least 90% of Thai locations return a baseline risk result, even if confidence varies.
- Realtime station coverage is visible and honest when sparse.
- Mobile Lighthouse accessibility score stays high enough for public-sector usability expectations.
- User feedback reports confusion between risk and official warning less over time.

## Open Questions

- Which agency data sources are legally and technically reusable through APIs, downloads, or scraping with permission?
- Which administrative boundary dataset should be canonical?
- Which DEM is accurate enough for national baseline risk without overclaiming precision?
- Should the public beta launch with open-source code from day one?
- What Thai wording best communicates confidence and limitation without reducing trust?
