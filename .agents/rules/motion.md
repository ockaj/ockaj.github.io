---
trigger: model_decision
description: Animation standards, spring presets, and motion/react guidelines. Use when implementing or updating transitions, gesture animations, or spring physics.
---

# Motion Guidelines

This document defines motion rules for animations, transitions, and physics in this portfolio.

---

## 1. Motion Skill Activation

When creating, modifying, or auditing animations:
- Consult the `motion` skill in [`.agents/skills/motion/SKILL.md`](../skills/motion/SKILL.md).
- Follow the skill instructions for easing curves, CSS springs, and performance audits.

---

## 2. Core Animation Rules

1. **Import Source**:
   - Import animations exclusively from `motion/react` (v13+).
   - Never import from `framer-motion`.

2. **Hardware Acceleration**:
   - Animate GPU-accelerated properties: `transform`, `opacity`, `scale`, `x`, and `y`.
   - Never animate layout properties like `height`, `width`, or `margin` directly.
   - Use `layout` or `layoutId` props for layout morphing.

3. **Exit Transitions**:
   - Wrap unmounting components in `<AnimatePresence>`.
   - Pass `keepMounted` to `<Dialog.Portal keepMounted>` when animating Base UI dialog exits.

4. **Accessibility**:
   - Honor user motion preferences with `useReducedMotion()`.
   - Provide instantaneous state changes when reduced motion is active.

---

## 3. Standard Springs & Animation Variants

All UI spring animations and transitions reuse standardized configurations:

- Reuse preset physics from the `SPRING` object in [`src/utils/springConfig.ts`](../../src/utils/springConfig.ts).
- Use `SPRING.modal` and `SPRING.exit` for modal, drawer, and toast transitions.
- Reuse centralized animation variants from [`src/utils/motionVariants.ts`](../../src/utils/motionVariants.ts).
- Avoid inline custom spring parameters (`stiffness`, `damping`, `mass`).

### Example
```typescript
import { SPRING } from "../utils/springConfig";
import {
  SECTION_ANIMATE,
  SECTION_VIEWPORT,
  SECTION_TRANSITION,
} from "../utils/motionVariants";

const drawerVariants = {
  hidden: { x: "100%", transition: SPRING.drawer },
  visible: { x: 0, transition: SPRING.drawer },
};
```
