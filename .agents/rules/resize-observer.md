---
trigger: model_decision
description: Use the central useResizeObserver hook for layout measurements and element boundary checks.
---

# Resize Observer Usage

Components measuring element boundaries or offsets must use the central `useResizeObserver` hook to avoid loop limit exceeded errors and optimize rendering.

## Rules
- MUST use [useResizeObserver](file:///d:/github/ockaj.github.io/src/hooks/useResizeObserver.ts) instead of native `ResizeObserver` instances.
- AVOID introducing third-party element measurement libraries.

## Examples
- **Correct** in [LiquidGlassDesktop.tsx](file:///d:/github/ockaj.github.io/src/components/LiquidGlass/LiquidGlassDesktop.tsx) and [LiquidGlassTabs.tsx](file:///d:/github/ockaj.github.io/src/components/LiquidGlass/LiquidGlassTabs.tsx):
  ```typescript
  useResizeObserver(element, (entry) => {
    setWidth(entry.target.offsetWidth);
  });
  ```
