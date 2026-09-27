# Design System: Flood Safety UI

## Purpose

Flood Safety UI is the design system for Flood Check Thailand. It provides a calm, trustworthy, Thai-first public-safety interface built on `shadcn/ui`, Tailwind CSS design tokens, and Atomic Design component composition.

The design should feel clear and reliable, not decorative. It should help people understand risk and act without panic.

## Design Direction

- Calm public-safety interface.
- Government-trustworthy but warmer and clearer than a typical government portal.
- Low visual noise with strong status hierarchy.
- Map-forward but never map-dependent.
- Mobile-first for emergency readability.
- Thai-first typography and content length.

## Foundations

- `shadcn/ui` is the primary component foundation.
- Radix primitives should be consumed through `shadcn/ui` components.
- Tailwind CSS should use design tokens rather than hard-coded colors and one-off values.
- `class-variance-authority` should define variants for shared components.

## Token Taxonomy

Primitive tokens are raw values.

```css
--color-blue-50
--color-blue-600
--color-slate-50
--color-slate-900
--space-1
--space-2
--radius-sm
--radius-md
--shadow-sm
```

Semantic tokens express product meaning.

```css
--background
--foreground
--primary
--primary-foreground
--muted
--muted-foreground
--border
--ring
--risk-low
--risk-medium
--risk-high
--risk-very-high
--status-normal
--status-watch
--status-warning
--status-critical
```

Component tokens express component-specific meaning.

```css
--card-risk-background
--card-risk-border
--badge-critical-background
--badge-critical-foreground
--map-control-background
--map-control-border
--alert-banner-border
```

## Tailwind Rules

- Tailwind theme colors should map to CSS variables.
- Feature components should use semantic classes such as `bg-risk-high/10` and `text-status-critical`.
- Do not use raw public-safety colors such as `text-red-500`, `bg-orange-100`, or `border-yellow-400` inside feature components.
- If a feature needs a new status color, add a semantic token first.
- Use arbitrary values only for layout details that cannot be expressed through tokens.

## shadcn/ui Usage Rules

- Keep generated `shadcn/ui` components in `src/components/ui`.
- Do not place domain-specific components in `src/components/ui`.
- Prefer composition over editing generated components heavily.
- Wrap shared public-safety patterns as atoms or molecules.
- Use `Button`, `Card`, `Input`, `Label`, `Badge`, `Alert`, `Dialog`, `Sheet`, `Tabs`, `Accordion`, `Select`, `Separator`, `Tooltip`, and `Toast` as default building blocks.

## Atomic Design Structure

```txt
src/components/ui/
  shadcn-generated components

src/components/primitives/
  VisuallyHidden
  ResponsiveContainer

src/components/atoms/
  RiskBadge
  StatusBadge
  SourceLabel
  UpdatedTime
  MetricValue
  SeverityDot

src/components/molecules/
  LocationSearch
  HumanWaterLevelCard
  RiskSummaryCard
  CurrentStatusCard
  StationReadingCard
  AlertBanner
  AdviceChecklist
  DataSourceList

src/components/organisms/
  SiteHeader
  SiteFooter
  ResultOverview
  RealtimePanel
  MapLayerPanel
  PreparednessPanel
  AlertsFeed

src/components/templates/
  PublicPageLayout
  ResultPageLayout
  MapPageLayout
```

## Component Examples

Risk badge variants should use semantic tokens.

```tsx
const riskBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
  {
    variants: {
      risk: {
        low: "bg-risk-low/10 text-risk-low",
        medium: "bg-risk-medium/10 text-risk-medium",
        high: "bg-risk-high/10 text-risk-high",
        very_high: "bg-risk-very-high/10 text-risk-very-high",
      },
    },
  },
);
```

Status badge variants should separate current conditions from baseline risk.

```tsx
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
  {
    variants: {
      status: {
        normal: "bg-status-normal/10 text-status-normal",
        watch: "bg-status-watch/10 text-status-watch",
        warning: "bg-status-warning/10 text-status-warning",
        critical: "bg-status-critical/10 text-status-critical",
      },
    },
  },
);
```

## Accessibility Rules

- Risk and status must include text labels, not color alone.
- Icon-only buttons must include accessible labels.
- Map controls must be keyboard reachable where practical.
- Result summaries must be readable without interacting with the map.
- Components must tolerate Thai labels wrapping to two or more lines.
- Alert banners must not rely on motion or color alone to communicate urgency.
- Interactive components should inherit Radix accessibility behavior through `shadcn/ui`.

## Do and Don't

Do:

- Use `Button` from `components/ui/button`.
- Use semantic variants for risk and status.
- Compose public-safety UI into atoms and molecules.
- Show source and update time near risk or status claims.

Don't:

- Build a custom dialog when `shadcn/ui` Dialog is sufficient.
- Put `RiskSummaryCard` inside `components/ui`.
- Use `text-red-500` for critical status in a feature component.
- Make a map layer the only place where risk is visible.

## Flood-Specific Visual Components

`HumanWaterLevelCard` shows approximate flood depth against a simple 2D person icon. It exists because water depth is easier to understand when users can compare it with their own body height.

The current person figure uses `IoBody` from `react-icons/io5`. The icon is intentionally pictogram-like because the water-level comparison needs to be understood quickly on mobile.

Rules:

- Let users enter their height in centimeters.
- Always show the numeric water depth next to the illustration.
- Always show body-reference text such as ankle, shin, knee, waist, chest, neck, or above head.
- Treat the illustration as approximate, not a precise survival guide.
- Do not replace official safety instructions with the illustration.

## Senior-Friendly Result Page

The `/check` page should prioritize comprehension for older adults and non-technical users.

Order information by user need:

1. Water depth in plain language.
2. Body comparison through `HumanWaterLevelCard`.
3. Immediate actions.
4. Current situation.
5. Area risk.
6. Supporting details and sources.

Rules:

- Use short Thai sentences.
- Put the most important number first, such as `น้ำอาจสูงประมาณ 85 ซม.`.
- Avoid English operational terms such as baseline, realtime, mock, and risk score in user-facing content.
- Use large type for primary results.
- Keep each card focused on one question.
- Put technical factors and source details below the action guidance.
