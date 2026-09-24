---
trigger: model_decision
description: Architectural guidelines, navigation flow, Zustand state management, lazy loading, Base UI overlays, BPMN diagrams, WebGL aurora, and performance patterns.
---

# Codebase Architecture

Single-page React portfolio (no router) built with React 19, Vite 8, TypeScript 6, Tailwind CSS v4, Zustand, `motion/react`, and `@base-ui/react`.

---

## 1. Navigation & SPA Routing

- **No Router**: Navigation is managed via custom hooks in [`src/hooks/useAppNavigation.ts`](file:///d:/github/ockaj.github.io/src/hooks/useAppNavigation.ts).
- **Section IDs**: `home`, `work`, `skills`, `processes`, `journal`, `faq`, `contact` — mapped in `LABEL_MAP` and set as `id` attributes on `<div id="home">`, semantic `<section id="...">` shells via `LazySection`, and `<section id="contact">` in `ContactSection.tsx`.
- **Scroll Spy**: `useScrollSpy` uses an `IntersectionObserver` to track the visible section and sync address bar hash via `history.replaceState(state, "", "#<sectionId>")` (wrapped in React 19 `startTransition`).
- **Programmatic Navigation**: `handleNavClick` scrolls via `scrollIntoView({ behavior: isReduced ? "auto" : "smooth" })` and syncs URL hash using `history.pushState`. Initial hash alignment and modal parent section alignments use `behavior: "instant"`.
- **Synchronous Scroll Restoration & Anchor Alignment**: [main.tsx](./src/main.tsx) sets `window.history.scrollRestoration = "manual"` at module scope before `createRoot`, and [index.css](./src/index.css) sets `html { scroll-behavior: auto; }` to eliminate browser reload scroll races. [useNavigation](./src/hooks/useAppNavigation.ts) applies `requestAnimationFrame` alignment confirmation on initial load for deep links (`#contact`, `#faq`, etc.) to lock anchor positioning after layout calculations settle.
- **Modal & Overlay Hash Sync**: [`useModal`](file:///d:/github/ockaj.github.io/src/hooks/useAppNavigation.ts) and [`useOverlay`](file:///d:/github/ockaj.github.io/src/hooks/useAppNavigation.ts) synchronize modal/drawer visibility with URL hash fragments (`#cv`, `#bpmn`, `#case-study-<id>`, `#article-<id>`, `#lightbox-<id>`). Centralized hash parsing in [`src/utils/sectionResolution.ts`](file:///d:/github/ockaj.github.io/src/utils/sectionResolution.ts) maps modal hashes to their parent sections. On browser reload with an active overlay hash, the parent section hydrates on Frame 1, aligning scroll non-destructively. Invalid deep links and transient menus (`#nav`, `#menu`) dismiss cleanly.
- **Browser Translation Safety**: [applyDomTranslatePatch](./src/utils/domTranslatePatch.ts) runs in [main.tsx](./src/main.tsx) to prevent React reconciliation crashes from Chrome Translate DOM mutations. Complex interactive diagrams and badges must use `className="notranslate"` and `translate="no"`.

---

## 2. State Management

- **App Store**: [`src/store/useAppStore.ts`](file:///d:/github/ockaj.github.io/src/store/useAppStore.ts) is a Zustand store managing `{ isLoading, hasCvMounted, activeSection, activeModal, cvLang }`. `activeModal: string | null` acts as the single source of truth for all modal and drawer overlays. `getInitialActiveModal()` initializes state directly from `window.location.hash` using `normalizeHash()` and `isValidModalHash()`.
- **Selector Isolation**: Landmark sections subscribe only to narrow, derived selectors (e.g. `state.activeModal?.startsWith("case-study-")` or `selectIsAnyModalOpen`) to prevent cascade re-renders across landmark sections when overlays open or close.
- **Zero-Flash Initial Load**: `getInitialLoading()` checks `sessionStorage.getItem("portfolio_loaded")` to bypass the loading screen on repeat visits within the same session.
- **Boneyard Suspense Integration**: Skips loading screen during Boneyard CLI capture (`isBoneyardBuild()`).

---

## 3. Code Splitting & Performance

- **Layout-Stable Skeleton Shells**: Section containers, headers, and card shells render in the main DOM on Frame 1 with fixed bounds, ensuring zero layout shift (CLS = 0) and immediate deep linking to all section anchors (`#home`, `#work`, `#skills`, `#processes`, `#journal`, `#faq`, `#contact`).
- **Four-Tier Boneyard Content Skeletons**: `boneyard.config.json` captures four responsive breakpoint tiers (`[375, 768, 1024, 1280]`). `LazySection` wraps content boundaries in `<BoneSuspense>` with responsive skeleton coordinates resolved from `.bones.json`. Minimum heights (`--skeleton-min-h-mob`, `--skeleton-min-h-tab`, `--skeleton-min-h-desk`, `--skeleton-min-h-wide`) are computed via `getSkeletonStyle()` in [`src/utils/bonesHelper.ts`](file:///d:/github/ockaj.github.io/src/utils/bonesHelper.ts), applying `xl:min-h-[var(--skeleton-min-h-wide)]` to match full $1200\text{ px}$ container desktop sizes and eliminate layout shifts (CLS = 0).
- **Standards-Compliant Viewport Intersection Gating**: `LazySection` gates component loading using an `IntersectionObserver` with a connection-aware three-tier `rootMargin` matrix from [`src/utils/connection.ts`](file:///d:/github/ockaj.github.io/src/utils/connection.ts) (`400px 0px` on constrained networks such as `Save-Data` and 2G, `800px 0px` on 3G, and `1200px 0px` on 4G/unconstrained/SSR), dispatching module activation via `requestIdle` with a 1000 ms timeout (`{ timeout: 1000 }`). Pre-renders fixed-height Boneyard `<Skeleton loading={true}>` placeholders to guarantee CLS = 0 and immediately loads any deep-linked hash (`window.location.hash`) or navbar click target (`activeSection`).
- **Intentional Speculative Idle Preload of CV Modal**: [`Hero.tsx`](file:///d:/github/ockaj.github.io/src/components/Hero.tsx) schedules an intentional idle prefetch of `PdfViewerModal` using `requestIdle` with a 2000 ms timeout (`{ timeout: 2000 }`), triggering `loadPdfViewerModal()`. This ensures 0 ms instant modal opening on both touch devices and desktop without loading the chunk during Frame 1 critical rendering path.
- **Strategic Dynamic Imports at Root**: Root-level overlays (`PdfViewerModal`, `BpmnOverlay`) and landmark sections (`CaseStudies`, `Skills`, `ProcessLibrary`, `Journal`, `Faq`) load on demand via standard `React.lazy()` dynamic imports in `src/lazyComponents.ts` to keep the initial page bundle under 50 kB brotli.
- **Instant Aurora Loading**: [`Aurora.tsx`](file:///d:/github/ockaj.github.io/src/components/Aurora/Aurora.tsx) remains statically imported in [`src/App.tsx`](file:///d:/github/ockaj.github.io/src/App.tsx) to load instantaneously on Frame 1.
- **No Micro-Splitting Inside Lazy Sections (Anti Over-Splitting)**: Feature drawers and dialogs (`CaseStudyDrawer`, `JournalDrawer`, `ProcessLightbox`) are bundled inside their parent section chunks. Because each section chunk is small (< 26 kB brotli), co-locating drawers eliminates extra network round-trips. This prevents interaction delay and guarantees instant drawer opening on slow mobile connections.
- **Media Query Registry Reuse**: Components and hooks checking viewport dimensions must use `useMediaQuery` or `useIsMobile` from [`src/hooks/useMediaQuery.ts`](file:///d:/github/ockaj.github.io/src/hooks/useMediaQuery.ts) which uses the shared `stores` map. Never invoke `window.matchMedia` inline with ad-hoc queries.
- **No `content-visibility: auto`**: Do not use `content-visibility: auto` on section containers or layout elements. Skipping offscreen layouts breaks programmatic `scrollIntoView()` coordinates, causes scrollbar jumps, and creates incorrect trigger events in `useScrollSpy` (`IntersectionObserver`).

---

## 4. Overlays, Dialogs & Modals

- **Base UI Primitives**: Built using unstyled `@base-ui/react` primitives imported from direct subpaths:
  - Dialogs: `@base-ui/react/dialog` (`Dialog.Root`, `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Popup`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`)
  - Tooltips: `@base-ui/react/tooltip`
  - Accordions: `@base-ui/react/accordion` (`Accordion.Root`, `Accordion.Item`, `Accordion.Header`, `Accordion.Trigger`, `Accordion.Panel`)
- **Exit Transitions**: Always pass `keepMounted` to `<Dialog.Portal keepMounted>` when wrapping with `motion/react` `<AnimatePresence>` to allow exit animations to complete.
- **Tooltip Animations**: Tooltips use exclusively CSS transitions (`[&[data-starting-style]]`, `[&[data-ending-style]]`, `[&[data-instant]]`). Tooltips do not use `motion/react` or `<AnimatePresence>`. Base UI detects native `transitionend` events to manage entrance and unmount timing with zero JavaScript animation overhead.
- **Universal Modal Hook**: [`useModal(id)`](file:///d:/github/ockaj.github.io/src/hooks/useAppNavigation.ts) combines `activeModal` in Zustand and `useOverlay` to provide `{ isOpen, open, close }` while synchronizing URL hash history.
- **Implementations**:
  - `BaseDrawer`: Slide-over drawer with swipe-to-dismiss (`drag="x"`).
  - `PdfViewerModal`: CV viewer modal in [`src/components/PdfViewerModal/PdfViewerModal.tsx`](file:///d:/github/ockaj.github.io/src/components/PdfViewerModal/PdfViewerModal.tsx) with native `<object>` and interactive fallback view. Intentionally preloaded during Hero idle time; defers native PDF `<object>` mount by 350 ms + idle time to protect entry animation frame rate.
  - `BpmnOverlay`: Desktop-only blueprint overlay in [`src/components/Bpmn/BpmnOverlay.tsx`](file:///d:/github/ockaj.github.io/src/components/Bpmn/BpmnOverlay.tsx) (`!isLoading && !isMobile`). `DesktopBpmnOverlay` and `useNavigation` check `useIsMobile()` from [`src/hooks/useMediaQuery.ts`](file:///d:/github/ockaj.github.io/src/hooks/useMediaQuery.ts) (which uses the shared `MediaQueryStore` registry) to dismiss `#bpmn` and redirect to `#home` on mobile.
  - `ProcessLightbox`: Modal image lightbox with `react-zoom-pan-pinch` pan/zoom controls.
  - `Tooltip`: Informational node badges with pure CSS transitions.
  - `Faq`: Accordion disclosure list using `@base-ui/react/accordion`.

---

## 5. Content Parsing & Data Loading

- **Eager Raw Glob Imports**: Articles and case studies loaded at build time via `import.meta.glob("./articles/*.md", { query: "?raw", eager: true })` in `src/data/articles.ts` and `import.meta.glob("./caseStudies/*.md", { query: "?raw", eager: true })` in `src/data/caseStudies.ts`.
- **Frontmatter Parsing**: Parsed using `yaml` (`import { parse } from "yaml"`), **NOT** `gray-matter`.
- **Markdown Rendering**: Rendered with `react-markdown` + `remark-gfm` using custom component maps in [`src/utils/markdownRenderers.tsx`](file:///d:/github/ockaj.github.io/src/utils/markdownRenderers.tsx).

---

## 6. Visualizations & WebGL

- **BPMN Meta-Diagram**: [`BpmnDiagram.tsx`](file:///d:/github/ockaj.github.io/src/components/Bpmn/BpmnDiagram.tsx) pure SVG process flow with full keyboard navigation (`Enter`/`Space`), clickable task nodes, and hotkey buffer activation (`'B-P-M-N'`).
- **BPMN Process Stage Canvas**: `ProcessVariantStage.tsx` uses a natural panoramic `aspect-[16/9]` canvas without forced pixel height clamps, eliminating empty letterboxing bars. `ProcessDesktopCard.tsx` uses `justify-start` to maintain a compact, cohesive editorial card without empty black voids.
- **WebGL Aurora**: [`Aurora.tsx`](file:///d:/github/ockaj.github.io/src/components/Aurora/Aurora.tsx) renders organic GLSL noise shaders using `ogl`. Automatically validated via W3C hardware GPU capability check (`failIfMajorPerformanceCaveat: true`), throttled (~30fps on mobile), capped in DPR (1.5 on desktop, 1.0 on mobile), paused on hidden tabs, and gracefully falls back to [`AuroraFallback.tsx`](file:///d:/github/ockaj.github.io/src/components/Aurora/AuroraFallback.tsx) on context loss or unsupported devices.

---

## 7. Layer Architecture & Boundary Enforcement

The codebase enforces a unidirectional 6-tier architectural hierarchy:

```
Tier 6: Composition Root (App.tsx, main.tsx, lazyComponents.ts)
  ↓
Tier 5: Feature Modules (components/CaseStudies, ProcessLibrary, LiquidGlass, etc.)
  ↓
Tier 4: Shared UI Primitives (BaseDrawer.tsx, Tooltip.tsx, LazySection.tsx)
  ↓
Tier 3: State & Hooks (store/*, hooks/*)
  ↓
Tier 2: Shared Utilities (utils/*)
  ↓
Tier 1: Foundation (types/*, styles/*, data/*)
```

### Architectural Rules
1. **Unidirectional Flow**: Tiers can only import from lower tiers.
2. **Layer Inversion Guards**:
   - `utils/` cannot import from `hooks/`, `store/`, or `components/`.
   - `store/` and `hooks/` cannot import from `components/`.
3. **Deep Encapsulation & Zero Barrels**: Feature directories encapsulate private child components, and runtime `index.ts` barrels are prohibited. See [Component Imports](file:///d:/github/ockaj.github.io/.agents/rules/component-imports.md).
4. **Grey Box Testing Contracts**: Pure domain logic and store state mutations are locked down with fast unit tests (`npm test` via Vitest). AI agents can safely modify internal mechanics as long as the test contract passes.
5. **Tooling Enforcement**: [`eslint/boundaries.js`](file:///d:/github/ockaj.github.io/eslint/boundaries.js) configures `no-restricted-imports`. ESLint fails the build on any layer or boundary violation.

---

## 8. Build Integration & Security Invariants

- **Boneyard Suspense**: `src/bones/registry.ts` is imported in `src/main.tsx` (do not delete). Components check `isBoneyardBuild()` from `src/utils/boneyard.ts` (`window.__BONEYARD_BUILD`) to skip dynamic animations during skeleton capture.
- **Security Invariants**: Static site hosted on GitHub Pages. BPMN SVGs must not contain inline event handlers. Markdown sources must contain no raw executable HTML.


