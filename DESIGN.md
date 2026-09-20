---
name: Ondrej Michal Očkaj — Portfolio
description: Business analysis and process optimization portfolio showcasing BPMN 2.0 architectures and enterprise modeling.
colors:
  primary: "#9b9cf2"
  primary-glow: "rgba(122, 123, 191, 0.2)"
  selection: "rgba(102, 103, 171, 0.3)"
  neutral-bg: "#0a0a0a"
  neutral-surface: "#141414"
  neutral-text: "#f5f5f5"
  neutral-muted: "#cccccc"
  neutral-stroke: "#1f1f1f"
typography:
  display:
    fontFamily: "Libre Caslon Condensed, Georgia, serif"
    fontSize: "clamp(3.5rem, 8vw, 6.0rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Libre Caslon Condensed, Georgia, serif"
    fontSize: "clamp(1.625rem, 4.5vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(1.25rem, 2vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  metrics:
    fontFamily: "Libre Caslon Condensed, Georgia, serif"
    fontSize: "clamp(1.25rem, 2vw, 1.875rem)"
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(0.875rem, 1.5vw, 1rem)"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.05em"
  footnote:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(0.75rem, 1.2vw, 0.8125rem)"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.05em"
  caption:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(0.6875rem, 1vw, 0.75rem)"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.02em"
  mono:
    fontFamily: "bpmn, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: "normal"
rounded:
  xs: "2px"
  scrollbar: "3px"
  sm: "4px"
  md: "8px"
  panel-inner: "10px"
  lg: "12px"
  xl: "16px"
  "2xl": "24px"
  journal: "28px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  tab-pill:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  tab-pill-active:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  card-interactive:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "24px"
  card-static:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "20px"
  bpmn-badge:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  navbar-capsule:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
---

# Design System: Ondrej Michal Očkaj — Portfolio

## Overview

**Creative North Star: "The Precision Process Atelier"**

The Precision Process Atelier unifies formal notation rigor with tactile digital craft. The interface presents enterprise business analysis deliverables with exactitude and elegance. Obsidian surfaces provide a calm, focused environment for complex process diagrams.

High information density balances with spacious section rhythm. Interactive glass elements provide physical feedback during user exploration. The system rejects generic SaaS templates, beige palettes, ghost cards with heavy drop shadows, repetitive uppercase eyebrows, and cartoon illustrations.

**Key Characteristics:**
- Deep obsidian foundation with restrained periwinkle focal accents.
- Editorial display typography paired with geometric body text.
- Physical glass feedback with specular highlights, tilt, and spring motion.
- Rigorous formal notation for AS-IS and TO-BE enterprise workflows.

## Colors

The palette pairs deep neutral obsidian layers with a singular, luminous periwinkle accent.

### Primary
- **Luminous Periwinkle** (`#9b9cf2` / `hsl(244 75% 76%)`): Primary focal accent. The interface uses this tone for active navigation states, interactive diagram pathways, selection highlights, and key action focus rings.

### Neutral
- **Void Obsidian** (`#0a0a0a` / `hsl(0 0% 4%)`): Primary canvas foundation. Used for the viewport background and baseline stage.
- **Charcoal Glass** (`#141414` / `hsl(0 0% 8%)`): Structural surface tone. Used for cards, drawer panels, modal sheets, and navigation backdrops.
- **Pure Light** (`#f5f5f5` / `hsl(0 0% 96%)`): Primary content typography. Used for titles, headlines, primary button text, and high-contrast labels.
- **Muted Ash** (`#cccccc` / `hsl(0 0% 80%)`): Secondary typography tone. Used for descriptions, subtitles, table metadata, and inactive labels.
- **Fine Stroke** (`#1f1f1f` / `hsl(0 0% 12%)`): Structural divider tone. Used for borders, card outlines, grid lines, and scrollbar tracks.

### Named Rules
- **The Restrained Accent Rule.** The system restricts the primary accent to interactive controls and critical process indicators. Accent coverage must not exceed 5% of any viewport.
- **The Obsidian Depth Rule.** Backgrounds never use pure pitch black (`#000000`) or saturated navy tints. Surfaces preserve a neutral obsidian value so translucent glass refractions remain visible.

## Typography

**Display Font:** Libre Caslon Condensed, Georgia, serif
**Body Font:** Outfit, sans-serif
**Label/Mono Font:** Outfit, sans-serif (tabular numerals enabled via `tabular-nums`)

**Character:** High-contrast editorial elegance meets modern analytical precision. Condensed serif display headings command authority, while geometric body copy guarantees effortless scanability.

### Hierarchy
- **Display** (weight: 400 italic, size: `clamp(3.5rem, 8vw, 6.0rem)`, line-height: 1.1, letter-spacing: -0.025em): Hero name and contact landmark header. Italic expression is the canonical brand identity.
- **Headline** (weight: 400, size: `clamp(1.625rem, 4.5vw, 3rem)`, line-height: 1.15, letter-spacing: -0.015em): Main section titles (`AppSectionHeader`). Section subtitles use `text-sm md:text-base` for clear optical separation.
- **Title** (weight: 600, size: `text-xl md:text-2xl` / `text-2xl md:text-3xl`, line-height: 1.2): Card titles, drawer headings, and process model titles.
- **Metrics / Highlight Numbers** (weight: 400 or 600, size: `text-xl md:text-3xl`, line-height: 1, `tabular-nums`): Case study metrics and diagram KPIs. Scaled to `text-xl` on mobile to preserve card balance without overpowering titles.
- **Body** (weight: 400, size: `text-sm md:text-base`, line-height: 1.5): Standard narrative text, case study analysis, and article paragraphs with a 70ch line limit. Uses `text-pretty` to prevent orphans.
- **Label** (weight: 500/600, size: `text-sm` / `0.875rem`, line-height: 1.2, letter-spacing: 0.05em to 0.15em): Navigation tabs, buttons, category kickers, and badge indicators. Metric values use `tabular-nums`.
- **Footnote / Caption** (weight: 500/600, size: `text-xs` to `text-[13px]` / 10pt–13pt, line-height: 1.3 to 1.35, letter-spacing: 0.02em to 0.05em): Secondary metadata, technology tags, timestamps, diagram status chips, and footnote disclosures matching compact native typography scales.

### Named Rules
- **The Native Typography Scale Rule.** The typography system supports compact native type scales down to 10pt–13pt (`text-[10px]`, `text-[11px]`, `text-xs`/12px, `text-[13px]`) for footnotes, captions, technology tags, and compact diagram metadata, combined with appropriate letter tracking and contrast. Primary reading copy and interactive controls maintain comfortable touch baselines (`text-sm` to `text-base`).
- **The Balanced Heading Rule.** All headings use `text-wrap: balance` and tight negative tracking (`-0.015em` to `-0.025em`) to prevent typographic orphans.
- **The Tabular Precision Rule.** All numerical indicators, cycle time metrics, and quantitative percentages use `tabular-nums` to maintain vertical column alignment.

## Layout

The interface operates on a single-page continuous scroll structure with seven defined landmark sections (`#home`, `#work`, `#skills`, `#processes`, `#journal`, `#faq`, `#contact`). Content containers align within maximum widths (`max-w-6xl` to `max-w-7xl`) with responsive fluid gutters (`px-4 sm:px-6 lg:px-8`).

Generous vertical spacing (`py-24 sm:py-32`) separates landmark sections. High information density governs the process models, case studies, and comparison matrices. This rhythm permits recruiters to scan credentials quickly while offering deep technical models for lead analysts.

The layout enforces responsive viewport boundaries through theme tokens (`max-w-85vw`, `max-w-95vw`, `max-h-85vh`, `max-h-mobile-panel`). Dedicated utility classes preserve interface ergonomics:
- **Canvas Minimum Width** (`min-w-bpmn-canvas`): Preserves a 950px baseline for desktop BPMN process models.
- **Safe Area Insets** (`pb-safe-8`, `pb-safe-12`): Prevents UI clipping above mobile navigation bars.
- **Accordion Transitions** (`grid-rows-open`, `grid-rows-closed`, `transition-accordion`): Smoothly animates expanding panel content.

## Elevation & Depth

The system uses a hybrid tactile glass architecture. Rather than relying on heavy opaque drop shadows, surfaces convey depth through translucency (`backdrop-blur-sm md:backdrop-blur-lg`), specular edge highlights, and subtle inner reflections.

### Shadow Vocabulary
- **LiquidGlass Flat** (`box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 4px 8px rgba(255, 255, 255, 0.03), 0 4px 10px rgba(0, 0, 0, 0.08)`): Resting elevation for glass cards, containers, and non-active controls.
- **LiquidGlass Sunken** (`box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 1px 2px rgba(255, 255, 255, 0.02)`): Pressed controls, active tab recesses, and indented indicator wells.
- **LiquidGlass Beveled Active** (`box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 6px 12px rgba(255, 255, 255, 0.06), 0 8px 16px rgba(0, 0, 0, 0.15)`): Highlighted callouts, hovered cards, and elevated modal sheets.
- **Drawer Structural Shadow** (`--shadow-drawer: 0 4px 16px rgba(0, 0, 0, 0.6)`): Deep elevation for slide-out drawers and bottom sheets.
- **Accent Glow** (`--shadow-glow-accent: 0 0 10px hsla(var(--accent), 0.8)`): High-contrast focal illumination for active elements.

### Named Rules
- **The Specular Illumination Rule.** Depth arises from top-edge specular highlights (`rgba(255, 255, 255, 0.25)`) and translucency, never from thick dark drop shadows.
- **The Transparency Fallback Rule.** When users enable reduced transparency, all glass surfaces revert to solid charcoal (`hsl(var(--surface))`) with simple borders.

## Shapes

Form language balances pill-shaped interactive capsules with large-radius structural cards. Primary triggers and navigation items use full pill geometry (`rounded-full`, 9999px). Cards, preview windows, and modal sheets use balanced rounded rectangles (`rounded-2xl` 16px or `rounded-3xl` 24px).

Surfaces feature delicate translucent strokes (`1px solid rgba(255, 255, 255, 0.04)` up to `0.15`). These strokes outline containers crisply against the dark canvas without visual clutter.

## Components

### Buttons & Floating Controls
- **Shape:** Pill curvature (`rounded-full`, 9999px).
- **Primary (`LiquidGlassButton`):** Charcoal glass base (`bg-surface/35`), pure white text, fine border (`border-white/[0.04]`), padding `8px 20px` up to `14px 32px` on desktop CTAs.
- **Mobile Stack Pattern:** Stacked mobile action buttons (such as Contact email and socials) share a unified maximum container width (`max-w-sm`) with equal-weight geometry to eliminate awkward visual pinch.
- **Compact Overlay Badges:** Canvas action badges (e.g. "Expand Diagram") collapse to a pure glass circle (`size-7 rounded-full`) on mobile to preserve viewport breathing room, expanding to an icon-and-label pill (`sm:rounded-xl`) on tablet/desktop.
- **Hover / Focus:** Luminous periwinkle glow, spring scale recoil (`stiffness: 400, damping: 15, mass: 0.6`), dynamic magnetic pull, and 3D pointer tilt.
- **Secondary / Ghost:** Transparent background, fine stroke border (`border-white/[0.08]`), text color transition on hover.

### Tabs
- **Style:** Capsule container hosting individual interactive tab triggers with an animated sliding highlight pill.
- **Sliding Pill:** Shared highlight pill (`.highlight-pill`) with subtle gradient reflection and spring physics (`stiffness: 380, damping: 24, mass: 0.6`).
- **States:** Active tab presents high-contrast text and specular glow. Inactive tabs display muted text and respond with pointer hover slide.

### Cards / Containers
- **Corner Style:** Rounded rectangles (`rounded-2xl` 16px or `rounded-3xl` 24px).
- **Background:** Charcoal glass with backdrop filter (`bg-surface/35 backdrop-blur-sm md:backdrop-blur-lg backdrop-saturate-150`).
- **Interactive Glass (`InteractiveGlass`):** Desktop 3D tilt (maximum 12 degrees), cursor-following glow blob, specular border highlight, and tap scale compression.
- **Static Glass (`StaticGlass`):** Stripped of motion listeners and physics overhead for toolbars, mobile controls, and fixed layout shells.

### Navigation
- **Style:** Floating pill capsule (`Navbar`), centered at viewport top, with responsive hamburger sheet on mobile viewports.
- **States:** Flat state when stationary (`rgba(122, 123, 191, 0.2)`), active state on scroll or item transition (`rgba(122, 123, 191, 0.1)` with box shadows).

### Signature Component: Process Diagram Canvas
- **Description:** Interactive AS-IS and TO-BE BPMN 2.0 process inspector with lightbox pan-and-zoom controls (`react-zoom-pan-pinch`), stage toggle tabs, and step metrics.
- **Style:** Charcoal glass frame with high-contrast SVG diagram rendering, formal gateway icons, RACI tags, and cycle time callouts.

## Do's and Don'ts

### Do:
- **Do** use `InteractiveGlass` for clickable cards and `StaticGlass` for non-interactive containers.
- **Do** constrain the primary periwinkle accent (`#9b9cf2`) to active states and focal process milestones.
- **Do** apply `tabular-nums` to all quantitative metrics, cycle times, and statistical data points.
- **Do** reuse standardized spring configs from `src/utils/springConfig.ts` for all motion transitions.
- **Do** honor `@media (prefers-reduced-motion: reduce)` by bypassing spring physics and tilt transforms.
- **Do** use `@theme` tokens or native Tailwind scale utilities. The project enforces `tailwindcss/no-arbitrary-value`.

### Don't:
- **Don't** use pure pitch black (`#000000`) for dark backgrounds; preserve the obsidian baseline (`#0a0a0a`).
- **Don't** apply opaque heavy black drop shadows; express depth through translucency and inner specular highlights.
- **Don't** import removed facade components; import explicit primitives from `src/components/LiquidGlass/`.
- **Don't** use generic SaaS warm beige or creamy palettes that conflict with the analytical process theme.
- **Don't** decorate layouts with cartoon illustrations, skeuomorphic noise textures, or repetitive uppercase eyebrows.
- **Don't** introduce arbitrary Tailwind values (such as `w-[320px]` or `bottom-[-20vh]`); define reusable theme tokens or `@utility` rules in `src/index.css`.