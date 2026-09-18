---
trigger: model_decision
description: Consistent spring animation presets from springConfig.ts and reusable motion variants from motionVariants.ts.
---

# Spring Configurations

All spring animations in UI components must reuse the standardized configurations from `src/utils/springConfig.ts` to maintain consistent motion. Reusable animation variants and transitions must be imported from `src/utils/motionVariants.ts`.

## Rules
- MUST use preset configurations from the `SPRING` object in [springConfig.ts](file:///d:/github/ockaj.github.io/src/utils/springConfig.ts).
- MUST use centralized animation variants (`SECTION_ANIMATE`, `SECTION_VIEWPORT`, `SECTION_TRANSITION`, `createModalVariants`, `cardStaggerVariants`, etc.) from [motionVariants.ts](file:///d:/github/ockaj.github.io/src/utils/motionVariants.ts).
- AVOID hardcoding custom spring parameters (stiffness, damping, mass) inline.

## Examples
- **Correct**:
  ```typescript
  import { SPRING } from "../utils/springConfig";
  import {
    SECTION_ANIMATE,
    SECTION_VIEWPORT,
    SECTION_TRANSITION,
  } from "../utils/motionVariants";

  const variants = {
    hidden: { x: "100%", transition: SPRING.drawer },
  };
  ```
