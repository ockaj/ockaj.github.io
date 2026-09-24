---
trigger: model_decision
description: Rules and official documentation index for Base UI components (@base-ui/react).
---

# Base UI Guidelines

This document defines rules and reference documentation for the `@base-ui/react` package.
Source: https://base-ui.com/llms.txt

---

## 1. Core Rules

- **Use Built-in Primitives**: Use `@base-ui/react` components for accessible UI elements. Do not create custom accessible widgets.
- **Tailwind CSS v4 Compatibility**: Style Base UI components with Tailwind CSS v4 classes and data attributes.
- **Data Attributes**: Target state data attributes such as `data-popup-open` or `data-starting-style` for state styling.
- **Overlay Exits**: Retain mounted portals with `keepMounted` when animating overlay exits.
- **Check Documentation First**: Read the official markdown file before writing custom component logic.

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

## 3. Component Documentation

- [Accordion](https://base-ui.com/react/components/accordion.md): Collapsible panels with headings.
- [Alert Dialog](https://base-ui.com/react/components/alert-dialog.md): Modal dialog for critical alerts.
- [Autocomplete](https://base-ui.com/react/components/autocomplete.md): Input with filtered options list.
- [Avatar](https://base-ui.com/react/components/avatar.md): Image avatar with fallback support.
- [Button](https://base-ui.com/react/components/button.md): Accessible button primitive.
- [Checkbox](https://base-ui.com/react/components/checkbox.md): Accessible checkbox control.
- [Checkbox Group](https://base-ui.com/react/components/checkbox-group.md): Group container for checkboxes.
- [Collapsible](https://base-ui.com/react/components/collapsible.md): Expandable panel element.
- [Combobox](https://base-ui.com/react/components/combobox.md): Accessible combobox with selection list.
- [Context Menu](https://base-ui.com/react/components/context-menu.md): Right-click menu primitive.
- [Dialog](https://base-ui.com/react/components/dialog.md): Modal dialog component.
- [Drawer](https://base-ui.com/react/components/drawer.md): Drawer component with swipe gestures.
- [Field](https://base-ui.com/react/components/field.md): Form field with validation.
- [Fieldset](https://base-ui.com/react/components/fieldset.md): Fieldset with stylable legend.
- [Form](https://base-ui.com/react/components/form.md): Form with consolidated error handling.
- [Input](https://base-ui.com/react/components/input.md): Text input primitive.
- [Menu](https://base-ui.com/react/components/menu.md): Dropdown action menu with keyboard navigation.
- [Menubar](https://base-ui.com/react/components/menubar.md): Horizontal menu bar system.
- [Meter](https://base-ui.com/react/components/meter.md): Numeric display meter.
- [Navigation Menu](https://base-ui.com/react/components/navigation-menu.md): Site navigation menu.
- [Number Field](https://base-ui.com/react/components/number-field.md): Number input with stepper controls.
- [OTP Field](https://base-ui.com/react/components/otp-field.md): One-time password verification input.
- [Popover](https://base-ui.com/react/components/popover.md): Anchored popup container.
- [Preview Card](https://base-ui.com/react/components/preview-card.md): Hover link preview card.
- [Progress](https://base-ui.com/react/components/progress.md): Progress status bar.
- [Radio Group](https://base-ui.com/react/components/radio-group.md): Radio button group.
- [Scroll Area](https://base-ui.com/react/components/scroll-area.md): Scrollable container with custom scrollbars.
- [Select](https://base-ui.com/react/components/select.md): Select menu dropdown.
- [Separator](https://base-ui.com/react/components/separator.md): Accessible divider line.
- [Slider](https://base-ui.com/react/components/slider.md): Range slider control.
- [Switch](https://base-ui.com/react/components/switch.md): Binary toggle switch.
- [Tabs](https://base-ui.com/react/components/tabs.md): Tabbed panel interface.
- [Toast](https://base-ui.com/react/components/toast.md): Notification message system.
- [Toggle](https://base-ui.com/react/components/toggle.md): Two-state pressable button.
- [Toggle Group](https://base-ui.com/react/components/toggle-group.md): Group of toggle buttons.
- [Toolbar](https://base-ui.com/react/components/toolbar.md): Group container for controls.
- [Tooltip](https://base-ui.com/react/components/tooltip.md): Informational hover tooltip.

---

## 4. Utilities

- [CSP Provider](https://base-ui.com/react/utils/csp-provider.md): Content Security Policy nonce management.
- [Direction Provider](https://base-ui.com/react/utils/direction-provider.md): Right-to-left layout direction support.
- [mergeProps](https://base-ui.com/react/utils/merge-props.md): Props merging utility.
- [useRender](https://base-ui.com/react/utils/use-render.md): Hook for custom component render props.
