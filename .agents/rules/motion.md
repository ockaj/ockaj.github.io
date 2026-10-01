---
trigger: model_decision
description: Rules for animations, spring physics, and transitions. Mandates using the /motion skill for all motion implementation.
---

# Motion Guidelines

This document defines motion rules for animations, transitions, and physics in this portfolio.

---

## 1. Mandatory Motion Skill Activation

Whenever creating, modifying, or reviewing animations:
- You MUST consult the `motion` skill in [`.agents/skills/motion/SKILL.md`](../skills/motion/SKILL.md).
- Follow the skill instructions for best practices, documentation, easing generation, and performance audits.
- Use the skill documentation to choose optimal animation approaches before writing custom motion code.

---

## 2. Core Animation Rules

1. **Import Source**:
   - Import exclusively from `motion/react` (v13+).
   - Never import from `framer-motion`.

2. **Standard Springs**:
   - Reuse standardized spring presets from [`src/utils/springConfig.ts`](../../src/utils/springConfig.ts).
   - Reuse centralized motion variants from [`src/utils/motionVariants.ts`](../../src/utils/motionVariants.ts).
   - Avoid inline custom spring parameters (stiffness, damping, mass).

3. **Hardware Acceleration**:
   - Animate only GPU-accelerated properties: `transform`, `opacity`, `scale`, `x`, and `y`.
   - Never animate layout properties like `height`, `width`, or `margin` directly.
   - Use `layout` or `layoutId` props for layout transitions.

4. **Exit Transitions**:
   - Wrap unmounting components in `<AnimatePresence>`.
   - Pass `keepMounted` to `<Dialog.Portal keepMounted>` when animating Base UI dialog exits.

5. **Accessibility**:
   - Always honor user motion preferences with `useReducedMotion()`.
   - Provide instantaneous state changes when reduced motion is active.
