---
trigger: model_decision
description: Motion/react transitions, spring physics presets, and reduced-motion states. Use when animating components, gestures, or layout morphs.
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

2. **Hardware Acceleration**:
   - Animate compositor-accelerated properties: `opacity` and independent transforms (`x`, `y`, `scale`, `scaleX`, `scaleY`, `rotate`). Motion 14.2+ runs independent transforms directly on the GPU compositor.
   - Never animate layout geometry properties like `height`, `width`, `top`, `left`, or `margin` directly.
   - Use `layout` or `layoutId` props for layout morphing.

3. **Exit Transitions**:
   - Wrap unmounting components in `<AnimatePresence>`.
   - Pass `keepMounted` to `<Dialog.Portal keepMounted>` when animating Base UI dialog exits.

4. **Accessibility & Reduced Motion**:
   - Honor user motion preferences with `useReducedMotion()`.
   - Provide non-vestibular 150ms opacity cross-fades via `REDUCED_MOTION_TRANSITION`.
   - Suppress child item stagger delays and spring bounce when reduced motion is active.

---

## 3. Standard Springs & Animation Variants

All UI spring animations and transitions reuse standardized configurations:

- Reuse preset physics from the `SPRING` object in [`src/utils/springConfig.ts`](../../src/utils/springConfig.ts).
- Use `SPRING.modal` and `SPRING.exit` for modal, drawer, and toast transitions.
- Reuse centralized animation variants from [`src/utils/motionVariants.ts`](../../src/utils/motionVariants.ts).
- Center modals (`PdfViewerModal`, `BpmnOverlay`, `ProcessLightbox`) must reuse `modalVariants` with `y: 0` and `transformOrigin: "center center"`.
- Drawer child containers using `drawerItemVariants` must pass `custom={prefersReducedMotion}`.
- Avoid inline custom spring parameters (`stiffness`, `damping`, `mass`).

### Example
```typescript
import { SPRING } from "../utils/springConfig";
import {
  modalVariants,
  REDUCED_MOTION_TRANSITION,
  getBackdropTransition,
} from "../utils/motionVariants";
```
