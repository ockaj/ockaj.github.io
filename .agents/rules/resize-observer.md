---
trigger: model_decision
description: Element dimension and boundary observation using the central useResizeObserver hook.
---

# Resize Observer Usage

Components measuring element boundaries or offsets use the central `useResizeObserver` hook to avoid loop limit exceeded errors and optimize rendering.

## Rules
- Use [`useResizeObserver`](../../src/hooks/useResizeObserver.ts) instead of native `ResizeObserver` instances.
- Do not introduce third-party element measurement libraries.

## Examples
- Implementation in [`LiquidGlassDesktop.tsx`](../../src/components/LiquidGlass/LiquidGlassDesktop.tsx) and [`LiquidGlassTabs.tsx`](../../src/components/LiquidGlass/LiquidGlassTabs.tsx):
  ```typescript
  useResizeObserver(element, (entry) => {
    setWidth(entry.target.offsetWidth);
  });
  ```
