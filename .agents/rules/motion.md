---
trigger: model_decision
description: Proper Motion implementation guidelines, Base UI overlay exits, compositor performance, and modern Motion 12 APIs.
---

# Motion Implementation

This document defines performance, exit transition, and API rules for Motion animations.

## 1. Package Imports

- Always import Motion features from `motion/react`.
- Never import from `framer-motion`.

## 2. Base UI Overlay Exit Transitions

Base UI overlays require controlled open state and keepMounted portals for exit transitions.

1. Hoist the open state to `Dialog.Root`.
2. Wrap `Dialog.Portal` with `keepMounted` inside `AnimatePresence`.
3. Render motion components directly inside `Dialog.Backdrop` and `Dialog.Popup`.
4. Define `initial`, `animate`, and `exit` props on each motion component.
5. Retain modal content state during the exit transition. Clear the state on `onExitComplete`.
6. If an exit animation only translates position, animate `opacity` to `0.9999` so Base UI detects the running animation via `element.getAnimations()`.

Example:

```tsx
<Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
  <AnimatePresence onExitComplete={handleExitComplete}>
    {isOpen ? (
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop
          render={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          }
        />
        <Dialog.Popup
          render={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            />
          }
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    ) : null}
  </AnimatePresence>
</Dialog.Root>
```

## 3. Compositor Acceleration and Layout Thrashing

- Animate transform properties (`transform`, `scale`, `x`, `y`) and `opacity`.
- Do not animate layout properties (`width`, `height`, `top`, `left`).
- Do not animate continuous GPU filters (`backdropFilter`, `filter`, `boxShadow`) on every frame. Use static CSS classes instead.
- For ripple effects, animate `scale` on fixed dimension elements instead of animating `width` and `height`.

## 4. Modern Transform Syntax

- Always use the getter function syntax for derived values: `useTransform(() => ...)`.
- Do not use the deprecated syntax `useTransform(source, mappingFunction)`.

Example:

```tsx
// Correct
const display = useTransform(() => String(Math.floor(count.get())));

// Incorrect
const display = useTransform(count, (v) => String(Math.floor(v)));
```

## 5. Viewport and Offscreen Optimization

- Halt infinite loops when elements move outside the viewport.
- Use `useMotionValueEvent` with scroll listeners to stop stroke animations when scrolled past view boundaries.
- Gate heavy hover layers on desktop glass components with hover state checks.
- Maintain hover overlays until exit transitions complete.

## 6. Non-Reconciling Pointer & Sheen Motion

- High-frequency pointer tracking must update `MotionValue` signals directly via `.set()`.
- Never store continuous pointer coordinates in React component state.
- Use `useMotionTemplate` to bind dynamic CSS gradient strings directly to the DOM style property.
- When pointer enters an element, snap spring coordinates immediately using `spring.jump(value)` on frame 0.
- Declare `isolation: isolate` on the parent container when rendering `mix-blend-mode` overlays. This prevents ancestor layer invalidation.
