---
name: Obsidian Telemetry & Observability
colors:
  surface: '#0e1321'
  surface-dim: '#0e1321'
  surface-bright: '#343948'
  surface-container-lowest: '#090e1c'
  surface-container-low: '#161b2a'
  surface-container: '#1a1f2e'
  surface-container-high: '#252a39'
  surface-container-highest: '#303444'
  on-surface: '#dee2f6'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dee2f6'
  inverse-on-surface: '#2b303f'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0e1321'
  on-background: '#dee2f6'
  surface-variant: '#303444'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a refined tech-luxury aesthetic built for mission-critical website monitoring and change detection. The visual identity merges the operational discipline of aerospace telemetry with modern high-craft product execution.

The interface targets senior site reliability engineers, security analysts, and enterprise digital operations teams who monitor critical infrastructure around the clock. The UI evokes clinical calm, precision, and absolute authority—transforming noisy visual diffs and DOM mutations into elegant, actionable telemetry.

The visual style blends minimalist structural geometry with selective optical glassmorphism. Deep navy surfaces establish zero-glare spatial depth, punctuated by razor-sharp border definition, luminous cyan accents, and calibrated diff indicators.

## Colors

The palette operates in strict dark mode, calibrated for high-density visual scanning and eye comfort during long monitoring shifts.

- **Primary (`#06B6D4`):** Cyber Cyan represents active scanning pulses, primary calls to action, focus states, and live telemetry badges.
- **Secondary (`#8B5CF6`):** Luminous Violet designates synthetic monitoring runs, scheduled audits, and automation metadata.
- **Semantic Accents:**
  - Addition / Healthy: `#10B981` (Emerald Green)
  - Deletion / Breach / Alert: `#EF4444` (Crimson)
  - Pending / Threshold Warning: `#F59E0B` (Amber)
- **Neutral Surface Foundations:**
  - Canvas Root: `#0A0F1D` (Deep void black-navy)
  - Card / Panel Surface: `#0F172A` (Rich slate navy)
  - Elevated Container / Hover Tier: `#1E293B` (Luminous dark slate)
  - Boundary Dividers: `#334155` (Crisp technical slate border)
- **Text & Data Contrast:** Primary readouts use `#F8FAFC` (98% luminance) for maximum legibility against dark substrates, with secondary telemetry labels rendered in `#94A3B8`.

## Typography

The type scale combines **Plus Jakarta Sans** for commanding, geometric headlines with **Manrope** for rhythmic, high-legibility body prose and metadata readouts.

- **Headlines (`Plus Jakarta Sans`):** Clean apertures and disciplined geometric forms lend modern executive polish to dashboards, overview banners, and modal headers. Letter tracking is slightly cinched at larger sizes to enforce structural cohesion.
- **Body & Data (`Manrope`):** Optimized for dense information architectures. Its open counters ensure effortless reading in multi-column diff viewers, JSON inspection panels, and historical audit logs.
- **Micro-Labels & Status Tags:** Micro-badges apply uppercase styling to `label-sm` with widened tracking (+0.06em) to preserve crisp legibility at compact dimensions.

## Layout & Spacing

The system enforces a 12-column fluid grid governed by a strict 4px/8px structural base rhythm.

- **Breakpoints & Layout Boundaries:**
  - Desktop (≥1280px): 12 columns, 32px gutters (`gutter-lg`), 48px canvas margins (`margin-lg`). Layout supports split diff viewports side by side.
  - Tablet (768px – 1279px): 8 columns, 24px gutters (`gutter-md`), 32px canvas margins (`margin-md`). Diff views switch to unified vertical stacking.
  - Mobile (<768px): 4 columns, 16px gutters (`gutter`), 16px margins (`margin`). Navigation collapses to an edge-to-edge floating command bar.
- **Density Philosophy:** Functional areas such as diff inspectors, raw payload viewers, and telemetry matrices use compressed internal gaps (`space-xs` and `space-sm`) to maximize visible data payload above the fold. High-level dashboard overviews leverage `space-lg` and `space-xl` for structured breathing room.

## Elevation & Depth

Spatial layering relies on translucent tonal stacking paired with razor-sharp slate borders rather than muddy cast shadows.

- **Canvas Base Layer:** `#0A0F1D` (absolute floor).
- **Surface Tier 1 (Cards, Data Grids):** `#0F172A` with a 1px solid border in `#334155`.
- **Surface Tier 2 (Flyouts, Menus, Active Panels):** Translucent `#1E293B` rendered at 85% opacity with an active `backdrop-filter: blur(12px)`. Outlines use `#334155` with a delicate 1px inset highlight of `rgba(255, 255, 255, 0.05)`.
- **Hover & Attention States:** Dynamic interactive cards cast a concentrated ambient glow: `0 8px 32px -8px rgba(6, 182, 212, 0.15)`. Critical alert elements substitute an ambient crimson emission: `0 8px 32px -8px rgba(239, 68, 68, 0.2)`.

## Shapes

The design system implements a roundedness level of `2`, creating a technical, precision-engineered aesthetic without appearing harsh.

- **Standard Elements (0.5rem / 8px):** Buttons, inputs, inline status chips, dropdown items, and table cells.
- **Large Containers (1rem / 16px):** Metric panels, diff comparison canvas windows, code inspector panes, and modal dialogs.
- **Floating Overlays (1.5rem / 24px):** Toast notifications and quick-switcher command palettes.
- **Pill Exception (9999px):** Live indicator pips and pulse telemetry dots.

## Components

- **Buttons:**
  - *Primary:* Filled `#06B6D4` with `#0A0F1D` bold typography. Hover produces a subtle cyan luminescent bloom (`box-shadow: 0 0 16px rgba(6, 182, 212, 0.4)`).
  - *Secondary:* Ghost fill on `#0F172A` with a 1px `#334155` border, transitioning to `#1E293B` and primary text color on hover.
  - *Destructive:* Ghost fill with a 1px border in `rgba(239, 68, 68, 0.4)` and `#EF4444` text.
- **Micro-Badges & Chips:**
  - Rendered with `label-sm` uppercase text, 4px vertical by 8px horizontal padding, and a 0.5rem corner radius.
  - *Status Live:* Cyan background at 10% opacity, border at `rgba(6, 182, 212, 0.3)`, text `#06B6D4`, accompanied by a pulsing 6px round pip.
  - *Diff Added:* Emerald background at 12% opacity, text `#10B981`.
  - *Diff Removed:* Crimson background at 12% opacity, text `#EF4444`.
- **Diff Inspection Panels:**
  - Split two-column display bounded by `#334155` borders.
  - Removed lines display a background tint of `rgba(239, 68, 68, 0.12)` with a `#EF4444` gutter indicator.
  - Added lines display `rgba(16, 185, 129, 0.12)` with a `#10B981` gutter indicator.
  - Character-level changes feature an inner highlight badge for immediate visual capture.
- **Data Tables & Lists:**
  - Sticky header row backed by `#0F172A` with bottom border `#334155`.
  - Table rows feature subtle hover states utilizing `#1E293B` at 50% opacity with zero transition lag.
  - Numeric metrics align right with tabular figures for rapid vertical scanning.
- **Form Inputs & Search:**
  - Inputs use `#0F172A` surface, 1px `#334155` border, and `#94A3B8` placeholder.
  - Focus state swaps the border to `#06B6D4` with an accompanying inner glow ring `0 0 0 1px #06B6D4`.
- **Cards & Visual Snapshots:**
  - Encased in 1px `#334155` borders with `#0F172A` backgrounds.
  - Image capture diff previews overlay an interactive split-slider handle rendered in luminous cyber cyan.