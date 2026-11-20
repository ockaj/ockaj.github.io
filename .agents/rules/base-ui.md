---
trigger: model_decision
description: Base UI accessible primitives (@base-ui/react). Use when implementing or styling any interactive UI primitive (dialogs, drawers, tooltips, popovers, toasts, avatars, menus, selects, tabs, accordions, switches) or keepMounted/data-starting-style transitions.
---

# Base UI Guidelines

This document defines rules and reference documentation for the `@base-ui/react` package.
Source: https://base-ui.com/llms.txt

---

## 1. Core Rules

- **Use Built-in Primitives**: Use `@base-ui/react` components for accessible UI elements. Do not create custom accessible widgets.
- **Fetch Official Online Documentation First**: Before writing, planning, or modifying any Base UI component, look up its official markdown documentation (e.g., `https://base-ui.com/react/components/<component>.md`) with `search_web`. Treat fetched documentation as authoritative for component anatomy, props, and data attributes. Do not extrapolate API shapes from other component libraries.
- **Direct Subpath Imports**: Import Base UI primitives and utilities from their direct subpath specifiers:
  - `@base-ui/react/accordion` (`Accordion.Root`, `Accordion.Item`, `Accordion.Header`, `Accordion.Trigger`, `Accordion.Panel`)
  - `@base-ui/react/avatar` (`Avatar.Root`, `Avatar.Image`, `Avatar.Fallback`)
  - `@base-ui/react/dialog` (`Dialog.Root`, `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Popup`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`)
  - `@base-ui/react/toast` (`Toast.Provider`, `Toast.Portal`, `Toast.Viewport`, `Toast.Root`, `Toast.Content`, `Toast.Title`, `Toast.Description`, `Toast.Close`, `Toast.useToastManager`, `Toast.createToastManager`)
  - `@base-ui/react/tooltip` (`Tooltip.*`)
  - `@base-ui/react/merge-props` (`mergeProps`)
- **Tailwind CSS v4 Compatibility**: Style Base UI components with Tailwind CSS v4 classes and data attributes.
- **Data Attributes**: Target state data attributes such as `data-popup-open` or `data-starting-style` for state styling.
- **Overlay Exits**: Retain mounted portals with `keepMounted` when animating overlay exits.

---

## 2. Handbook Documentation

- [Quick Start](https://base-ui.com/react/overview/quick-start.md): Quick introduction to Base UI.
- [Accessibility](https://base-ui.com/react/overview/accessibility.md): Accessibility guidelines and features.
- [Styling](https://base-ui.com/react/handbook/styling.md): Component styling guide.
- [Animation](https://base-ui.com/react/handbook/animation.md): Component animation guide.
- [Composition](https://base-ui.com/react/handbook/composition.md): React component composition guide.
- [Customization](https://base-ui.com/react/handbook/customization.md): Component behavior customization guide.
- [Forms](https://base-ui.com/react/handbook/forms.md): Form integration guide.
- [TypeScript](https://base-ui.com/react/handbook/typescript.md): TypeScript usage guide.

---

## 3. Relevant Component Documentation

- [Accordion](https://base-ui.com/react/components/accordion.md): Collapsible panels with headings (used in FAQ).
- [Avatar](https://base-ui.com/react/components/avatar.md): User avatar image and fallback primitive (used in Navbar and Journal).
- [Dialog](https://base-ui.com/react/components/dialog.md): Accessible modal dialog primitive (used in modals, drawers, and lightboxes).
- [Popover](https://base-ui.com/react/components/popover.md): Anchored popup container primitive.
- [Toast](https://base-ui.com/react/components/toast.md): Managed toast notification primitive (used in BPMN hotkey toast).
- [Tooltip](https://base-ui.com/react/components/tooltip.md): Informational hover tooltip primitive.

---

## 4. Utilities

- [mergeProps](https://base-ui.com/react/utils/merge-props.md): Props merging utility.
- [useRender](https://base-ui.com/react/utils/use-render.md): Hook for custom component render props.

---

## 5. Repository Implementation Standards

- **Accordion**:
  - Configure `<Accordion.Root multiple>` with `<Accordion.Panel keepMounted hiddenUntilFound>`.
  - Do not create React state or JavaScript animations for item expansion.
  - Apply CSS height transitions with `h-(--accordion-panel-height) overflow-hidden accordion-panel-transition duration-350 ease-expo-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none`.
  - Rotate trigger icons with CSS selectors: `group-data-panel-open:rotate-180`.
- **Tooltips**:
  - Use CSS transitions (`data-starting-style`, `data-ending-style`).
  - Do not use `motion/react` or `<AnimatePresence>` for tooltips.
- **Dialogs & Overlays**:
  - Add `keepMounted` to `<Dialog.Portal keepMounted>` when wrapping children with `motion/react` `<AnimatePresence>`.
