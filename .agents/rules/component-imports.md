---
trigger: model_decision
description: Component import paths, lazy exports, and barrel rules. Use when creating components, splitting code, or modifying feature exports.
---

# Component Import & Export Conventions

Defines component file locations, export signatures, and directory structures across the codebase.

---

## 1. Export Patterns for `React.lazy()`

Components code-split through [`src/lazyComponents.ts`](../../src/lazyComponents.ts) must provide an explicit default export.

### Rules

1. **Explicit Default Export**:
   - Every file registered in `src/lazyComponents.ts` exports its primary component as `default`.
   - `React.lazy(() => import(...))` expects `{ default: ComponentType }`.
   - Named exports alone cause runtime chunk loading failures.
2. **Co-located Chunks**:
   - Feature drawers and dialogs stay bundled inside their parent section chunk to prevent over-splitting. See [Architecture Guide](./architecture.md).

---

## 2. Prohibition of Runtime Barrels (Vercel Best Practice)

Direct module imports prevent circular dependencies, reduce bundle parse overhead, and avoid eager module evaluation:
- Do not create runtime barrel files (`index.ts` or `public.ts` aggregating runtime component exports).
- Import components directly from their designated public module entry points.
- Pure TypeScript type files (`types.ts`) are permitted because types are erased during compilation with zero bundle cost.

---

## 3. Designated Public Entry Points vs. Private Internals

Feature modules encapsulate internal implementation. ESLint (`no-restricted-imports`) blocks imports from private files:

| Feature Module | Allowed Public Entry Points | Private Internals (Linter Blocks External Imports) |
|---|---|---|
| `CaseStudies` | `CaseStudies/CaseStudies` | `CaseStudyCard`, `CaseStudyDrawer`, `MetricCountUp` |
| `Journal` | `Journal/Journal` | `JournalDrawer`, `JournalEntry` |
| `ProcessLibrary` | `ProcessLibrary/ProcessLibrary` | `ProcessCardHeader`, `ProcessDesktopCard`, `ProcessDesktopControls`, `ProcessMobileCarousel`, `ProcessMobileControls`, `ProcessVariantStage`, `ProcessLibraryContext` |
| `ProcessLightbox` | `ProcessLightbox/ProcessLightbox` | `LightboxControls`, `ZoomableImage` |
| `Faq` | `Faq/Faq` | `FaqItem` |
| `Aurora` | `Aurora/Aurora` | `AuroraFallback` |
| `LoadingScreen` | `LoadingScreen/LoadingScreen` | `LoadingBpmnDiagram`, `loadingData`, `LoadingMethodologyChecklist` |
| `Navigation` | `Navigation/Navbar` | `MobileMenu` |
| `PdfViewerModal` | `PdfViewerModal/PdfViewerModal` | `InteractiveCvView`, `pdfState` |
| `Bpmn` | `Bpmn/BpmnOverlay`, `Bpmn/BpmnNodeBadge` | `BpmnDiagram`, `BpmnHotkeyToast`, `pauseableTimer` |
| `LiquidGlass` | `LiquidGlass/LiquidGlass`, `LiquidGlass/LiquidGlassTabs`, `LiquidGlass/types` | `config`, `liquidGlassUtils`, `Ripple`, `useRipple`, `useLiquidGlassPhysics`, `LiquidGlassDesktop`, `LiquidGlassMobile`, `LiquidGlassOverlays`, `LiquidGlassStatic` |

Cross-cutting UI primitives live directly in `src/components/` (e.g. `BaseDrawer.tsx`, `Tooltip.tsx`, `LazySection.tsx`).

---

## 4. LiquidGlass Import Locations

Import LiquidGlass primitives via named exports from their specific public modules:

- **Surface Primitives**: Import `InteractiveGlass`, `StaticGlass`, and `LiquidGlassButton` from [`src/components/LiquidGlass/LiquidGlass`](../../src/components/LiquidGlass/LiquidGlass.tsx).
- **Tab Primitives**: Import `Tabs` and `Tab` from [`src/components/LiquidGlass/LiquidGlassTabs`](../../src/components/LiquidGlass/LiquidGlassTabs.tsx).
- **Type Definitions**: Import prop types from [`src/components/LiquidGlass/types`](../../src/components/LiquidGlass/types.ts).
- **Encapsulation**: Avoid namespace access (`LiquidGlass.Button`). Import internal physics hooks, ripples, or overlay files only within `src/components/LiquidGlass/`.

For component selection criteria, physics, and props allocation, see [LiquidGlass Rules](./liquid-glass.md).

---

## 5. Base UI Subpath Imports

Import Base UI components directly from their specific subpath specifiers:
- Dialogs: `@base-ui/react/dialog` (`Dialog.Root`, `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Popup`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`).
- Tooltips: `@base-ui/react/tooltip`.
- Accordions: `@base-ui/react/accordion` (`Accordion.Root`, `Accordion.Item`, `Accordion.Header`, `Accordion.Trigger`, `Accordion.Panel`).

Pass `keepMounted` to `<Dialog.Portal keepMounted>` when wrapping with `motion/react` `<AnimatePresence>` for exit transitions. See [Base UI Guidelines](./base-ui.md).

---

## 6. Shared Utilities (`cn` and `quicklink`)

- **Class Composition**: Use `cn(...)` from [`src/utils/cn.ts`](../../src/utils/cn.ts) (`clsx` + `tailwind-merge`) for conditional class composition.
- **Prefetching**: Import `prefetchAsset` from [`src/utils/quicklink.ts`](../../src/utils/quicklink.ts). Never import `prefetch` from `"quicklink"` directly because the wrapper deduplicates requests via an in-memory `Set`.
