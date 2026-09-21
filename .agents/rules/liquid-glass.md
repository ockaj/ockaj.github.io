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
   - Use `variant="segmented"` for segmented controls and card selectors. Follow concentric geometry ($R_{inner} = R_{outer} - \text{padding}$, e.g. outer `rounded-xl` with `p-1` and inner `rounded-lg`).
