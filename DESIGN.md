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

<!-- impeccable:design-map -->
Name: Ondrej Michal Očkaj — Portfolio
Colors: primary: primary #9b9cf2; neutral: neutral-bg #0a0a0a; primary: primary-glow rgba(122, 123, 191, 0.2); primary: selection rgba(102, 103, 171, 0.3); neutral: neutral-surface #141414 (+3 more in the sidecar)
Fonts: Libre Caslon Condensed (display, headline, metrics); Outfit (title, body, label, footnote, caption); bpmn (mono)
Spacing: xs 4px, sm 8px, md 16px, lg 24px, xl 32px, 2xl 48px
Radius: xs 2px, scrollbar 3px, sm 4px, md 8px, panel-inner 10px, lg 12px, xl 16px, 2xl 24px, journal 28px, full 9999px
North Star: "The Precision Process Atelier"
Elevation:
- LiquidGlass Flat: inset 0 1px 1px rgba(255, 255, 255, 0.18), inset 0 -1px 1px rgba(255, 255, 255, 0.08), inset 0 4px 8px rgba(255, 255, 255, 0.03), inset 0 1.5px 2px -0.5px var(--color-dispersion-cyan), inset 0 -1.5px 2px -0.5px var(--color-dispersion-amber), 0 4px 12px rgba...
- Highlight Pill Active / Flat: .highlight-pill
- Drawer Structural Shadow: --shadow-drawer: 0 4px 16px rgba(0, 0, 0, 0.6)
- Accent Glow: --shadow-glow-accent: 0 0 10px hsla(var(--accent), 0.8)
- The Specular Illumination Rule.
- The Prismatic Dispersion Rule.
- The Inset Border Rule.
- The Transparency Fallback Rule.
Don't:
- Don't create raw HTML `<button>` or unstyled `<div>` cards for interactive UI.
- Don't use pure pitch black (`#000000`) for dark backgrounds; preserve the obsidian baseline (`#0a0a0a`).
- Don't apply opaque heavy black drop shadows; express depth through translucency and inner specular highlights.
- Don't import removed facade components; import explicit primitives from `src/components/LiquidGlass/`.
- Don't use generic SaaS warm beige or creamy palettes that conflict with the analytical process theme.
- Don't decorate layouts with cartoon illustrations, skeuomorphic noise textures, or repetitive uppercase eyebrows.
- Don't introduce arbitrary Tailwind values (such as `w-[320px]` or `bottom-[-20vh]`); define reusable theme tokens or `@utility` rules in `src/index.css`.
Do:
- Do build all buttons, cards, containers, and tabs with LiquidGlass primitives.
- Do use `InteractiveGlass` for clickable cards and `StaticGlass` for non-interactive containers.
- (+5 more)
Map: .agents/rules/liquid-glass.md
Map: src/utils/springConfig.ts
Map: src/components/LiquidGlass/
Map: src/index.css
Full: .impeccable/design-full.md (read a section when you need its detail)
