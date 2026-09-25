---
trigger: model_decision
description: Guidelines for LiquidGlass primitives (InteractiveGlass, StaticGlass, LiquidGlassButton, Tabs, Tab). Use when building, styling, or refactoring glass surfaces, tactile cards, buttons, or sliding tabs.
---

# LiquidGlass Primitives & Guidelines

Tactile glass design system providing responsive physical feedback, specular highlight glows, dynamic tilt, magnetic pull, and smooth sliding tabs.

---

## 1. Export Architecture & Component Selection

Always import named exports from `src/components/LiquidGlass/`. The previous `LiquidGlass` composite facade was eliminated in favor of explicit primitives.

### Component Primitives

| Component | Path | Use Case | Physics & Motion |
|---|---|---|---|
| `InteractiveGlass` | `src/components/LiquidGlass/LiquidGlass` | Cards, landmark containers, clickable surfaces (`CaseStudyCard`, `JournalEntry`, `FaqItem`, `ProcessDesktopCard`, `Skills` badges) | Dynamic desktop physics (tilt, magnetic pull, specular glow, spring scale) and mobile gyro/touch handling. |
| `StaticGlass` | `src/components/LiquidGlass/LiquidGlass` | Non-interactive containers, toolbars, controls, layout shells (`ProcessMobileControls`) | Zero physics overhead. Stripped of motion listeners and spring calculations for optimal performance. |
| `LiquidGlassButton` | `src/components/LiquidGlass/LiquidGlass` | Tactile interactive buttons and anchor links | Pre-configured `InteractiveGlass` with `as={href ? "a" : "button"}`, `springScale={true}`, magnetic pull, and keyboard accessibility. |
| `Tabs`, `Tab` | `src/components/LiquidGlass/LiquidGlassTabs` | Segmented controls, filter bars, view switchers | Sliding highlight pill with spring physics, 2 variants (`"capsule"` and `"segmented"`), and keyboard navigation. |

---

## 2. Rules & Constraints

1. **Explicit Primitive Selection**:
   - MUST use `StaticGlass` for layout shells and containers that do not react to mouse or touch.
   - MUST use `InteractiveGlass` for clickable cards, interactive items, or surfaces with physics.
   - MUST use `LiquidGlassButton` for standalone button/link triggers.
   - FORBID importing obsolete `LiquidGlass` facade (it has been removed).
2. **Never Use Namespace-Style Access**:
   - **Correct**: `import { InteractiveGlass, LiquidGlassButton } from "../LiquidGlass/LiquidGlass";`
   - **Incorrect**: `LiquidGlass.Button` or `<LiquidGlass interactive={false} />`.
3. **Props Allocation**:
   - Do NOT pass physics props (`springScale`, `tilt`, `magnetic`, `ripple`) to `StaticGlass`.
   - On `InteractiveGlass`, leverage `as` prop (`"div"`, `"button"`, `"a"`, `"article"`, `"section"`, `"span"`) to ensure semantic HTML.
   - Use `roundedClass` (e.g. `rounded-2xl`, `rounded-full`, `rounded-xl`) to specify border radius curvature.
4. **Tabs Variants**:
   - Use `variant="capsule"` (default) for floating stadium pill navigation bars and modals (`rounded-full`).
   - Use `variant="segmented"` for segmented controls and card selectors. Follow concentric geometry ($R_{inner} = R_{outer} - \text{padding}$, e.g. outer `rounded-xl` with `p-1.25` container padding and inner `rounded-lg`).
5. **Border Geometry & Chromatic Dispersion**:
   - MUST use inset box shadows instead of external 1px border strokes across glass elements.
   - Glass surfaces and active highlight pills MUST include prismatic chromatic dispersion margins:
     `inset 1.5px 0 2px -0.5px var(--color-dispersion-cyan)`
     `inset -1.5px 0 2px -0.5px var(--color-dispersion-amber)`
   - Flat inactive tab highlights MUST use inset borders (`box-shadow: inset 0 0 0 1px ...`) without CSS borders.
6. **Non-Reconciling Specular Rim Sheen**:
   - MUST use `useMotionTemplate` to interpolate radial gradients without React component re-renders.
   - Pointer tracking MUST update MotionValues directly. Never dispatch React component state on pointer move.
   - The specular highlight MUST be masked to the 1px edge perimeter using `.liquid-glass-rim`. This prevents interior surface blobs.
   - On cursor entry, MUST call `smoothSheenX.jump(localX)` to position coordinates instantly on frame 0.
   - Glass containers MUST declare `isolation: isolate` (via Tailwind `isolate`) to bound visual blending to the element.
