# Implementation Backlog: ท่วมไทย

## Milestone 0: Project Setup

Goal: create a stable foundation for development and documentation.

- Create Next.js TypeScript project.
- Add Tailwind CSS.
- Add `shadcn/ui` configuration.
- Add linting and formatting.
- Add single-repo folder structure for app, components, features, server, scripts, data, and db modules.
- Add environment variable documentation.
- Add basic CI checks.
- Add deployment preview pipeline.

Acceptance criteria:

- App runs locally.
- CI runs typecheck and lint.
- README explains setup.
- Preview deployment can be opened by contributors.

## Milestone 1: Design System Foundation

Goal: establish Flood Safety UI before feature pages accumulate inconsistent styling.

- Define primitive, semantic, and component token naming.
- Add `src/styles/tokens.css`.
- Map Tailwind theme values to CSS variables.
- Add base `shadcn/ui` components: Button, Card, Input, Label, Badge, Alert, Dialog, Sheet, Tabs, Accordion, Select, Separator, Tooltip, and Toast.
- Create Atomic Design folders: `ui`, `primitives`, `atoms`, `molecules`, `organisms`, and `templates`.
- Build first atoms: `RiskBadge`, `StatusBadge`, `SourceLabel`, `UpdatedTime`, `MetricValue`, and `SeverityDot`.
- Build first molecules: `LocationSearch`, `RiskSummaryCard`, `CurrentStatusCard`, `AlertBanner`, and `AdviceChecklist`.
- Document component usage rules in `docs/DESIGN_SYSTEM.md`.

Acceptance criteria:

- `shadcn/ui` components are the default for shared UI controls.
- No feature component hard-codes risk or status colors.
- Semantic tokens exist for baseline risk and current situation.
- Shared components support Thai text wrapping.
- Risk and status components include accessible text labels.

## Milestone 2: Public Information Pages

Goal: make the public-safety framing clear before complex data features land.

- Build homepage with location search placeholder.
- Build `/prepare` page.
- Build `/data` page.
- Build `/faq` page.
- Build `/about` page.
- Build `/privacy` page.
- Build `/accessibility` page.

Acceptance criteria:

- Pages are Thai-first.
- Every page is mobile-readable.
- Data limitation language is visible and not hidden in legal text.
- Official-announcement disclaimer exists on relevant pages.

## Milestone 3: Map and Location Selection

Goal: let users select a location anywhere in Thailand.

- Add MapLibre map component.
- Add place search UI.
- Add current-location permission flow.
- Add manual pin drop.
- Add selected-location state.
- Add shareable `/check?lat=&lng=` route.
- Add loading and permission-denied states.

Acceptance criteria:

- User can search, use GPS, or drop a pin.
- Result URL is shareable.
- Permission denial does not block manual use.
- Critical page content is available outside the map.

## Milestone 4: Geocoding and Boundaries

Goal: resolve selected points to Thai administrative areas.

- Choose canonical administrative boundary dataset.
- Import province, district, and subdistrict geometries into PostGIS.
- Implement `/api/reverse-geocode`.
- Implement `/api/geocode` using a provider or local gazetteer.
- Add basin lookup if basin data is available.
- Add tests for boundary lookup around known locations.

Acceptance criteria:

- Most Thai coordinates resolve to province, district, and subdistrict.
- API returns clear errors for out-of-country points.
- Boundary lookup performs fast enough for public page loads.

## Milestone 5: Static Flood Risk V1

Goal: provide nationwide baseline flood risk with honest confidence.

- Choose initial historical flood dataset.
- Choose initial DEM or derived elevation layer.
- Import rivers and canals from OpenStreetMap or another source.
- Create risk-cell or risk-area model.
- Implement baseline risk scoring.
- Implement `/api/flood-risk` without realtime modifiers.
- Show factors and confidence on result page.

Acceptance criteria:

- Any Thailand location returns baseline risk or a clear no-data result.
- API explains which factors influenced the score.
- Result distinguishes risk from active warning.
- Low-confidence areas are labeled clearly.

## Milestone 6: Realtime Data Research Spike

Goal: confirm usable realtime water and weather sources before deep integration.

- Investigate ThaiWater/HAII access, format, rate limits, and licensing.
- Investigate TMD warnings and forecast data access.
- Investigate RID dam/reservoir and water-level data access.
- Investigate DDPM announcements access.
- Document source reliability and allowed usage.
- Pick first realtime source for MVP integration.

Acceptance criteria:

- Each source has a documented access method or blocker.
- Licensing and attribution requirements are captured.
- MVP integration order is decided based on reliability and public value.

## Milestone 7: Realtime Ingestion V1

Goal: cache realtime source data locally and avoid user-request dependency on upstream systems.

- Create ingestion worker framework.
- Create `stations` table.
- Create `station_readings_latest` table.
- Create `ingestion_runs` table.
- Implement first rainfall source ingestion.
- Implement first water-level source ingestion.
- Add freshness checks and stale-data status.

Acceptance criteria:

- Worker can be run manually and on a schedule.
- Latest readings are queryable from the database.
- Failed ingestion writes a visible error log.
- Stale data is labeled in API responses.

## Milestone 8: Realtime Nearby API

Goal: expose nearby realtime water and weather context for a selected location.

- Implement `/api/realtime/nearby`.
- Implement `/api/realtime/rainfall`.
- Implement `/api/realtime/water-level`.
- Add radius and result limits.
- Add station status classification.
- Add source and timestamp references.

Acceptance criteria:

- API returns nearest relevant stations.
- API handles missing nearby stations gracefully.
- Result page shows updated time and station distance.
- Status thresholds are documented or marked as provisional.

## Milestone 9: Official Alerts

Goal: surface official warnings without pretending to be the issuing authority.

- Implement alert data model.
- Integrate first official warning source.
- Map alerts to province where possible.
- Implement `/api/alerts`.
- Add alert banner to result page.
- Add `/alerts` page with filters.

Acceptance criteria:

- Alerts link back to original official source.
- Alert severity and publication time are visible.
- Expired or stale alerts are not presented as current.
- Result page says official authorities have priority.

## Milestone 10: Preparedness Advice Engine

Goal: turn risk and current situation into practical advice.

- Create advice content by baseline risk.
- Create advice content by current situation.
- Create household checklist.
- Create vulnerable-person checklist.
- Create pet checklist.
- Implement `/api/advice` or local advice selection module.
- Add print-friendly checklist view.

Acceptance criteria:

- Advice is concise, actionable, and Thai-first.
- Advice escalates based on current situation.
- Advice always points to official instructions during active danger.
- Content does not overstate certainty.

## Milestone 11: Map Layers

Goal: give users visual context without making the map the only source of truth.

- Add baseline risk layer.
- Add rainfall station layer.
- Add water-level station layer.
- Add dam/reservoir layer.
- Add official alert layer if geospatial mapping is available.
- Add waterways layer.
- Add layer legend and source panel.

Acceptance criteria:

- Layers can be toggled on mobile.
- Legend explains colors and symbols.
- Map does not hide essential text content.
- Data source attribution is visible.

## Milestone 12: Sharing and Community Use

Goal: make the result useful for communities and families.

- Add copy-link share.
- Add LINE and Facebook share metadata.
- Add generated summary card image.
- Add QR code for selected result URL.
- Add printable community poster template.

Acceptance criteria:

- Shared links open directly to the same location result.
- Share card does not include alarming wording without context.
- QR code can be printed and scanned reliably.

## Milestone 13: Public Beta Hardening

Goal: prepare for public release.

- Add error monitoring.
- Add uptime monitoring.
- Add API rate limiting.
- Add privacy-friendly analytics.
- Run accessibility audit.
- Run mobile performance audit.
- Add source freshness dashboard for maintainers.
- Review all Thai safety wording.

Acceptance criteria:

- Critical pages pass accessibility checks.
- Result pages load quickly on mobile.
- API handles bad input and high traffic safely.
- Maintainers can see ingestion freshness and failures.

## First Six-Week Plan

Week 1:

- Project setup.
- Flood Safety UI setup.
- Static public pages.

Week 2:

- Basic map and location selection.
- PostGIS setup.
- Administrative boundaries.
- Reverse geocoding.

Week 3:

- Static risk dataset import.
- Baseline risk scoring.
- First result page version.

Week 4:

- Realtime data research spike.
- First ingestion worker.
- Nearby realtime API prototype.

Week 5:

- Alerts integration.
- Advice engine.
- Map layer polish.

Week 6:

- Sharing.
- Accessibility and performance pass.
- Public beta readiness review.

## Immediate Next Tasks

- Decide final project name.
- Decide whether the repo will be open source from day one.
- Pick initial deployment stack.
- Start data-source research with ThaiWater, TMD, RID, DDPM, ONWR, and GISTDA.
- Select canonical administrative boundary dataset.
- Build the first clickable prototype for homepage, map, and result page.
