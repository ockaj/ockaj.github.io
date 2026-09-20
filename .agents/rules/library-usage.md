---
trigger: model_decision
description: Rules for using installed third-party libraries (react-zoom-pan-pinch, @base-ui/react, motion/react, etc.). Forbids reinventing library features and mandates checking package types before writing custom code.
---

# Third-Party Library Usage

This document defines rules for using installed third-party dependencies. It prevents reimplementing existing library features with custom code.

---

## 1. Core Principle: Check Library Capabilities First

Before writing custom logic for any interaction, animation, or component behavior:

1. **Inspect Package Types**:
   Inspect TypeScript definitions (`.d.ts`) in `node_modules/<package>/`.
   Identify built-in props, hooks, and configuration options.

2. **Prohibit Redundant Implementations**:
   Never write custom timers, math, or event handlers for features that an installed dependency supports natively.

3. **Configure Before Coding**:
   Always prefer passing configuration props to existing components over wrapping them in custom event listeners.

---

## 2. Key Repository Dependencies

### `react-zoom-pan-pinch`
- **Purpose**: Pan, zoom, pinch, and gesture controls for image viewers and lightboxes.
- **Built-in Capabilities**:
  - Double-tap zoom: Configure via `doubleClick={{ disabled: false, mode: "toggle", ... }}` on `<TransformWrapper>`.
  - Wheel and pinch zoom: Configure via `wheel` and `pinch` props.
  - Programmatic controls: Use `useControls()` and `useTransformContext()` inside child components.
- **Prohibited**: Never write custom `onTouchStart` timestamp calculations or custom double-tap listeners.

### `@base-ui/react`
- **Purpose**: Unstyled accessible UI primitives (dialogs, tooltips).
- **Built-in Capabilities**:
  - Focus trapping, keyboard navigation (`Escape`), and outside-click dismissal.
  - Portal mounting with exit animation support (`keepMounted`).
  - CSS transition state management via data attributes (`[&[data-starting-style]]`).
- **Prohibited**: Never write custom focus traps, portal wrappers, or manual escape-key event listeners.

### `motion/react`
- **Purpose**: Spring physics, layout animations, and gesture transitions.
- **Built-in Capabilities**:
  - Physics springs, drag gestures, exit animations, and layout morphing.
  - Accessibility awareness via `useReducedMotion()`.
- **Prohibited**: Never write manual `requestAnimationFrame` loops or custom CSS keyframes for spring motion.

### `lucide-react`
- **Purpose**: Standard UI icons.
- **Built-in Capabilities**: Extensive library of scalable SVG icons.
- **Prohibited**: Never draw manual SVG icon shapes if `lucide-react` provides an equivalent icon.

---

## 3. Pre-Implementation Checklist

Complete these three checks before writing interaction code:

1. Check `package.json` to identify installed libraries.
2. Search the library `.d.ts` files in `node_modules/` for relevant props.
3. If the library provides the feature, configure it directly.
