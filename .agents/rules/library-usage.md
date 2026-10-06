---
trigger: model_decision
description: Third-party package reuse standards. Use when adding UI controls, gestures, or third-party components instead of custom logic.
---

# Third-Party Library Usage

This document defines rules for using installed third-party dependencies. Check existing library features before implementing custom solutions.

---

## 1. Core Principle: Inspect Library Capabilities First

Before writing custom logic for any interaction, animation, or component behavior:

1. **Inspect Package Types**:
   Check TypeScript definitions (`.d.ts`) in `node_modules/<package>/`.
   Identify built-in props, hooks, and configuration options.

2. **Leverage Built-in Features**:
   Use native library timers, math, gestures, and event handlers instead of reimplementing them.

3. **Configure Before Coding**:
   Pass configuration props to existing components instead of wrapping them in custom event listeners.

---

## 2. Key Repository Dependencies

### `react-zoom-pan-pinch`
- **Purpose**: Pan, zoom, pinch, and gesture controls for image viewers and lightboxes.
- **Built-in Capabilities**:
  - Double-tap zoom: Configure via `doubleClick={{ disabled: false, mode: "toggle", ... }}` on `<TransformWrapper>`.
  - Wheel and pinch zoom: Configure via `wheel` and `pinch` props.
  - Programmatic controls: Use `useControls()` and `useTransformContext()` inside child components.
- **Guideline**: Use built-in gesture props rather than custom `onTouchStart` timestamp calculations.

### `@base-ui/react`
- **Purpose**: Unstyled accessible UI primitives (dialogs, tooltips, accordions).
- **Built-in Capabilities**:
  - Focus trapping, keyboard navigation (`Escape`), and outside-click dismissal.
  - Portal mounting with exit animation support (`keepMounted`).
  - CSS transition state management via data attributes (`[&[data-starting-style]]`).
- **Guideline**: Use Base UI primitives instead of custom focus traps or portal wrappers. See [Base UI Guidelines](./base-ui.md).

### `motion/react`
- **Purpose**: Spring physics, layout animations, and gesture transitions.
- **Built-in Capabilities**:
  - Physics springs, drag gestures, exit animations, and layout morphing.
  - Accessibility awareness via `useReducedMotion()`.
- **Guideline**: Use Motion components and hooks instead of manual `requestAnimationFrame` loops. See [Motion Guidelines](./motion.md).

### `lucide-react`
- **Purpose**: Standard UI icons.
- **Built-in Capabilities**: Scalable SVG icon library.
- **Guideline**: Use `lucide-react` icons for standard UI elements. See [Icon Library](./icons-library.md).

---

## 3. Pre-Implementation Checklist

Complete these three checks before writing interaction code:

1. Check `package.json` to identify installed libraries.
2. Search library `.d.ts` definitions in `node_modules/` for relevant props.
3. Configure available features directly through component props.
