---
trigger: model_decision
description: UI primitives (LiquidGlassButton, InteractiveGlass, StaticGlass, Tabs). Use when creating or modifying buttons, cards, containers, tabs, badges, or clickable UI surfaces.
---

# LiquidGlass Primitives & Guidelines

Tactile glass design system providing responsive physical feedback, specular highlight glows, dynamic tilt, magnetic pull, and smooth sliding tabs.

---

## 1. Export Architecture & Component Selection

Import named exports directly from `src/components/LiquidGlass/`.

### Component Primitives

| Component | Path | Use Case | Physics & Motion |
|---|---|---|---|
| `InteractiveGlass` | `src/components/LiquidGlass/Glass` | Cards, landmark containers, clickable surfaces (`CaseStudyCard`, `JournalEntry`, `FaqItem`, `ProcessDesktopCard`, `Skills` badges) | Dynamic desktop physics (tilt, magnetic pull, clamped specular glow, resting 1.0x scale, hold expansion, and dual-stage physical recoil) and mobile touch handling. |
| `StaticGlass` | `src/components/LiquidGlass/StaticGlass` | Non-interactive containers, toolbars, controls, layout shells (`ProcessMobileControls`) | Zero physics overhead. Stripped of motion listeners and spring calculations for optimal performance. |
| `LiquidGlassButton` | `src/components/LiquidGlass/Button` | Tactile interactive buttons and anchor links | Pre-configured `InteractiveGlass` with `as={href ? "a" : "button"}`, resting 1.0x scale, hold-expansion physics, magnetic pull, and keyboard accessibility. |
| `Tabs`, `Tab` | `src/components/LiquidGlass/Tabs` | Segmented controls, filter bars, view switchers | Sliding highlight pill with spring physics, 2 variants (`"capsule"` and `"segmented"`), and keyboard navigation. |
| `DraggableTabs`, `DraggableTab` | `src/components/LiquidGlass/DraggableTabs` | Top navigation bars with interactive draggable pill (`Navbar`) | Extends `Tabs`/`Tab` behavior with pointer-draggable active highlight pill and rubber-band overscroll on desktop. |

### Anti-Patterns and Prohibitions

| Prohibited Pattern | Required Pattern | Reason |
|---|---|---|
| `<button className="...">` | `<LiquidGlassButton>` | Standard buttons lack physical spring recoil and magnetic feedback. |
| `<a href="..." className="...">` (CTA) | `<LiquidGlassButton href="...">` | CTAs require consistent glass styling and keyboard accessibility. |
| `<div className="... rounded-2xl border ...">` (Card) | `<InteractiveGlass as="article">` | Cards require 3D desktop tilt and specular highlight edges. |
| `<div className="... border ...">` (Toolbar) | `<StaticGlass>` | Glass toolbars require unified blur, depth, and inset borders. |
| Custom tab buttons | `<Tabs>` and `<Tab>` | Tabs require shared spring-animated highlight pills. |

---

## 2. Rules & Constraints

1. **Explicit Primitive Selection**:
   - Replace standard HTML `<button>` elements with `LiquidGlassButton` for standalone buttons and links.
   - Replace standard card `<div>` elements with `InteractiveGlass` for clickable cards and interactive surfaces.
   - Use `StaticGlass` for layout shells, fixed toolbars, and non-interactive containers.
   - Use `Tabs` and `Tab` for segmented controls, filter bars, and view switchers.
2. **Named Imports**:
   - Use named imports from each primitive's module:
     `import { InteractiveGlass } from "../LiquidGlass/Glass";`
     `import { LiquidGlassButton } from "../LiquidGlass/Button";`
   - Avoid namespace-style access (`LiquidGlass.Button`).
3. **Props Allocation**:
   - Reserve physics props (`springScale`, `tilt`, `magnetic`, `magneticStrength`) for `InteractiveGlass` and `LiquidGlassButton`.
   - On `InteractiveGlass`, use the `as` prop (`"div"`, `"button"`, `"a"`, `"article"`, `"span"`) to ensure semantic HTML; on `StaticGlass`, use `"div"` or `"span"`.
   - Use `roundedClass` (e.g. `rounded-2xl`, `rounded-full`, `rounded-xl`, `rounded-lg`) to specify border curvature.
4. **Tabs Variants**:
   - Use `variant="capsule"` (default) for floating stadium pill navigation bars and modals (`rounded-full`).
   - Use `variant="segmented"` for segmented controls and card selectors. Follow concentric geometry ($R_{\text{inner}} = R_{\text{outer}} - \text{padding}$, e.g. outer `rounded-xl` with `p-1.25` padding and inner `rounded-lg`) with dynamic scale-compensated `borderRadius` on the highlight pill.
5. **Border Geometry & Chromatic Dispersion**:
   - Use inset box shadows instead of external 1px border strokes across glass elements.
   - Glass surfaces employ dual-vertical (12 & 6 o'clock) specular rims: key light on top (`inset 0 1px ...`) and ground bounce reflection on bottom (`inset 0 -1px ...`).
   - Glass surfaces and active highlight pills include vertical prismatic chromatic dispersion margins:
     `inset 0 1.5px 2px -0.5px var(--color-dispersion-cyan)`
     `inset 0 -1.5px 2px -0.5px var(--color-dispersion-amber)`
   - Flat inactive tab highlights use inset borders (`box-shadow: inset 0 0 0 1px ...`) without CSS borders.
6. **Non-Reconciling Specular Rim Sheen & Hold Physics**:
   - Use `useTransform` with MotionValue inputs to interpolate reactive inset specular box shadows directly without React component re-renders or compiler bailouts.
   - Pointer tracking updates MotionValues directly without dispatching React component state on pointer move.
   - Clamped sheen coordinates (`normX` and `normY` clamp to $\pm 0.65$ on hold/drag with $0.75\text{px}$ multiplier via `computeReactiveSheenBoxShadow`) prevent rim mask blowout.
   - Resting scale remains 1.0x. Scale expansion triggers strictly on pointer hold or touch drag via `computeGlisseBaseScale` and `computeAnisotropicStretch`.
   - Dual-stage physical springs (`glassPress`/`glassRelease` for mouse, `glassTouchPress`/`glassTouchRelease` for touch) deliver tactile physical feedback.
   - The specular highlight renders as a reactive inset bevel (`.liquid-glass-specular-bevel`) that shifts toward the cursor angle without any mask-composite exclude stencil cuts, rubber gaskets, or interior surface blobs.
   - Glass containers declare `isolation: isolate` (via Tailwind `isolate`) to bound visual blending to the element.
