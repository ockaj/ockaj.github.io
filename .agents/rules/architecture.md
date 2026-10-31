---
trigger: model_decision
description: Architecture, SPA routing, Zustand store state, canonical seams, and React 19 invariants. Use when modifying route sections, navigation, global state, overlays, browser API calls, or architecture tiers.
---

# Codebase Architecture

Single-page React portfolio (no router) built with React 19, Vite 8, TypeScript 6, Tailwind CSS v4, Zustand, `motion/react`, and `@base-ui/react`.

---

## 1. Navigation & SPA Routing

- **No Router**: Navigation is managed via custom hooks in [`src/hooks/useAppNavigation.ts`](../../src/hooks/useAppNavigation.ts).
- **Section IDs**: `home`, `work`, `skills`, `processes`, `journal`, `faq`, and `contact`. They are mapped in `LABEL_MAP` and set on section containers.
- **Scroll Spy**: `useScrollSpy` uses an `IntersectionObserver` to track the visible section and sync address bar hash via `safeReplaceState("#<sectionId>")` (wrapped in React 19 `startTransition`).
- **Programmatic Navigation**: `handleNavClick` scrolls via `scrollIntoView({ behavior: isReduced ? "auto" : "smooth" })` and syncs URL hash using `safePushState`. Initial hash alignment and modal parent section alignments use `behavior: "instant"`.
- **Synchronous Scroll Restoration & Anchor Alignment**: [main.tsx](../../src/main.tsx) sets `window.history.scrollRestoration = "manual"` at module scope before `createRoot`. [index.css](../../src/index.css) sets `html { scroll-behavior: auto; }` to eliminate browser reload scroll races. [useNavigation](../../src/hooks/useAppNavigation.ts) applies `requestAnimationFrame` alignment confirmation on initial load for deep links (`#contact`, `#faq`, etc.) to lock anchor positioning after layout calculations settle.
- **Modal & Overlay Hash Sync**: [`useModal`](../../src/hooks/useAppNavigation.ts), [`useOverlay`](../../src/hooks/useAppNavigation.ts), and [`useEntityModal`](../../src/hooks/useEntityModal.ts) synchronize modal and drawer visibility with URL hash fragments (`#cv`, `#bpmn`, `#case-study-<id>`, `#article-<id>`, `#lightbox-<id>`). Centralized hash parsing in [`src/utils/sectionResolution.ts`](../../src/utils/sectionResolution.ts) maps modal hashes to their parent sections. On browser reload with an active overlay hash, the parent section hydrates on Frame 1, aligning scroll non-destructively. Invalid deep links and transient menus (`#nav`, `#menu`) dismiss cleanly.
- **Browser Translation Safety**: [applyDomTranslatePatch](../../src/utils/domTranslatePatch.ts) runs in [main.tsx](../../src/main.tsx) to prevent React reconciliation crashes from Chrome Translate DOM mutations. Complex interactive diagrams and badges must use `className="notranslate"` and `translate="no"`.

---

## 2. State Management

- **App Store**: [`src/store/useAppStore.ts`](../../src/store/useAppStore.ts) is a Zustand store managing `{ isLoading, hasCvMounted, activeSection, activeModal, cvLang }`. `activeModal: string | null` acts as the single source of truth for all modal and drawer overlays. `getInitialActiveModal()` initializes state directly from `window.location.hash` using `normalizeHash()` and `isValidModalHash()`.
- **Selector Isolation**: Landmark sections subscribe only to narrow, derived selectors (e.g. `state.activeModal?.startsWith("case-study-")` or `selectIsAnyModalOpen`) to prevent cascade re-renders across landmark sections when overlays open or close.
- **Zero-Flash Initial Load**: `getInitialLoading()` checks `localStorage.getItem("portfolio_loaded")` to bypass the loading screen on repeat visits.
- **Boneyard Suspense Integration**: Skips loading screen during Boneyard CLI capture (`isBoneyardBuild()`).

---

## 3. Code Splitting & Performance

- **Layout-Stable Skeleton Shells**: Section containers, headers, and card shells render in the main DOM on Frame 1 with fixed bounds, ensuring zero layout shift (CLS = 0) and immediate deep linking to all section anchors (`#home`, `#work`, `#skills`, `#processes`, `#journal`, `#faq`, `#contact`).
- **Four-Tier Boneyard Content Skeletons**: `boneyard.config.json` captures four responsive breakpoint tiers (`[375, 768, 1024, 1280]`). `LazySection` wraps content boundaries in `<BoneSuspense>` with responsive skeleton coordinates resolved from `.bones.json`. Minimum heights (`--skeleton-min-h-mob`, `--skeleton-min-h-tab`, `--skeleton-min-h-desk`, `--skeleton-min-h-wide`) are computed via `getSkeletonStyle()` in [`src/utils/bonesHelper.ts`](../../src/utils/bonesHelper.ts), applying `xl:min-h-(--skeleton-min-h-wide)` to match full $1200\text{ px}$ container desktop sizes and eliminate layout shifts (CLS = 0).
- **Standards-Compliant Viewport Intersection Gating**: `LazySection` gates component loading using an `IntersectionObserver` with a connection-aware three-tier `rootMargin` matrix from [`src/utils/connection.ts`](../../src/utils/connection.ts) (`400px 0px` on constrained networks such as `Save-Data` and 2G, `800px 0px` on 3G, and `1200px 0px` on 4G/unconstrained/SSR), dispatching module activation via `requestIdle` with a 1000 ms timeout (`{ timeout: 1000 }`). Pre-renders fixed-height Boneyard `<Skeleton loading={true}>` placeholders to guarantee CLS = 0 and immediately loads any deep-linked hash (`window.location.hash`) or navbar click target (`activeSection`).
- **Intentional Speculative Idle Preload of CV Modal**: [`Hero.tsx`](../../src/components/Hero.tsx) schedules an intentional idle prefetch of `PdfViewerModal` using `requestIdle` with a 2000 ms timeout (`{ timeout: 2000 }`), triggering `loadPdfViewerModal()`. This ensures 0 ms instant modal opening on both touch devices and desktop without loading the chunk during Frame 1 critical rendering path.
- **Strategic Dynamic Imports at Root**: Root-level overlays (`PdfViewerModal`, `BpmnOverlay`) and landmark sections (`CaseStudies`, `Skills`, `ProcessLibrary`, `Journal`, `Faq`) load on demand via standard `React.lazy()` dynamic imports in `src/lazyComponents.ts` to keep the initial page bundle under 50 kB brotli.
- **Static Frame 1 Landmark Invariants**: [`Hero.tsx`](../../src/components/Hero.tsx), [`ContactSection.tsx`](../../src/components/ContactSection.tsx), and [`Aurora.tsx`](../../src/components/Aurora/Aurora.tsx) remain statically imported in [`src/App.tsx`](../../src/App.tsx). This guarantees instantaneous Frame 1 render, zero layout shift (CLS = 0), and Boneyard skeleton stability. Never lazy-load `ContactSection`, `Hero`, or `Aurora`.
- **No Micro-Splitting Inside Lazy Sections (Anti Over-Splitting)**: Feature drawers and dialogs (`CaseStudyDrawer`, `JournalDrawer`, `ProcessLightbox`) are bundled inside their parent section chunks. Because each section chunk is small (< 26 kB brotli), co-locating drawers eliminates extra network round-trips. This prevents interaction delay and guarantees instant drawer opening on slow mobile connections.
- **Media Query Registry Reuse**: Components and hooks checking viewport dimensions must use `useMediaQuery` or `useIsMobile` from [`src/hooks/useMediaQuery.ts`](../../src/hooks/useMediaQuery.ts) which uses the shared `stores` map. Never invoke `window.matchMedia` inline with ad-hoc queries.
- **No `content-visibility: auto`**: Do not use `content-visibility: auto` on section containers or layout elements. Skipping offscreen layouts breaks programmatic `scrollIntoView()` coordinates, causes scrollbar jumps, and creates incorrect trigger events in `useScrollSpy` (`IntersectionObserver`).

---

## 4. Overlays, Dialogs & Modals

- **Base UI Primitives**: Built using unstyled `@base-ui/react` primitives imported from direct subpaths:
  - Dialogs: `@base-ui/react/dialog` (`Dialog.Root`, `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Popup`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`)
  - Tooltips: `@base-ui/react/tooltip`
  - Accordions: `@base-ui/react/accordion` (`Accordion.Root`, `Accordion.Item`, `Accordion.Header`, `Accordion.Trigger`, `Accordion.Panel`)
- **Exit Transitions**: Always pass `keepMounted` to `<Dialog.Portal keepMounted>` when wrapping with `motion/react` `<AnimatePresence>` to allow exit animations to complete.
- **Tooltip Animations**: Tooltips use exclusively CSS transitions (`[&[data-starting-style]]`, `[&[data-ending-style]]`, `[&[data-instant]]`). Tooltips do not use `motion/react` or `<AnimatePresence>`. Base UI detects native `transitionend` events to manage entrance and unmount timing with zero JavaScript animation overhead.
- **Universal Modal Hooks**:
  - `useModal(id)`: Combines `activeModal` in Zustand and `useOverlay` to provide `{ isOpen, open, close }` while synchronizing URL hash history for standalone overlays (`#cv`, `#bpmn`, `#nav`).
  - `useEntityModal(prefix, lookup, options)`: Dedicated hook in [`src/hooks/useEntityModal.ts`](../../src/hooks/useEntityModal.ts) for entity-backed drawers and modals (`#case-study-<id>`, `#article-<id>`, `#lightbox-<id>`). Handles content buffering during exit animations, derived store subscriptions, and URL hash repair.
- **Implementations**:
  - `BaseDrawer`: Slide-over drawer with swipe-to-dismiss (`drag="x"`).
  - `PdfViewerModal`: CV viewer modal in [`src/components/PdfViewerModal/PdfViewerModal.tsx`](../../src/components/PdfViewerModal/PdfViewerModal.tsx) with native `<object>` and interactive fallback view. It preloads during Hero idle time, deferring native mount by 350 ms to preserve frame rate.
  - `BpmnOverlay`: Desktop-only blueprint overlay in [`src/components/Bpmn/BpmnOverlay.tsx`](../../src/components/Bpmn/BpmnOverlay.tsx) (`!isLoading && !isMobile`). `DesktopBpmnOverlay` and `useNavigation` check `useIsMobile()` from [`src/hooks/useMediaQuery.ts`](../../src/hooks/useMediaQuery.ts) (which uses the shared `MediaQueryStore` registry) to dismiss `#bpmn` and redirect to `#home` on mobile.
  - `ProcessLightbox`: Modal image lightbox with `react-zoom-pan-pinch` pan/zoom controls.
  - `Tooltip`: Informational node badges with pure CSS transitions.
  - `Faq`: Accordion disclosure list using `@base-ui/react/accordion`.

---

## 5. Content Parsing & Data Loading

- **Build-Time MDX Transformation**: Markdown articles and case studies compile at build time via the official `@mdx-js/rollup` plugin in [`vite/mdxPlugin.ts`](../../vite/mdxPlugin.ts). Frontmatter parses into metadata exports via `remark-frontmatter` and `remark-mdx-frontmatter`. `remark-gfm` adds GitHub Flavored Markdown support. Text excerpts and read-time metrics generate during compilation via [`vite/remarkMdxMetadata.ts`](../../vite/remarkMdxMetadata.ts).
- **Eager Module Imports**: Modules load eagerly as typed ES modules (`import.meta.glob("./articles/*.md", { eager: true })` in `src/data/articles.ts` and `import.meta.glob("./caseStudies/*.md", { eager: true })` in `src/data/caseStudies.ts`).
- **Zero Client Runtime Markdown & Zero innerHTML**: Client parser libraries and `dangerouslySetInnerHTML` are prohibited. Content renders directly as native React components (`<article.Content />`, `<study.Content />`) inside `.markdown-prose` containers styled in [`src/index.css`](../../src/index.css).

---

## 6. Visualizations & WebGL

- **BPMN Meta-Diagram**: [`BpmnDiagram.tsx`](../../src/components/Bpmn/BpmnDiagram.tsx) pure SVG process flow with full keyboard navigation (`Enter`/`Space`), clickable task nodes, and hotkey buffer activation (`'B-P-M-N'`).
- **BPMN Process Stage Canvas**: `ProcessVariantStage.tsx` uses a natural panoramic `aspect-[16/9]` canvas without forced pixel height clamps, eliminating empty letterboxing bars. `ProcessDesktopCard.tsx` uses `justify-start` to maintain a compact, cohesive editorial card without empty black voids.
- **WebGL Aurora**: [`Aurora.tsx`](../../src/components/Aurora/Aurora.tsx) renders organic GLSL noise shaders using native WebGL2 with OKLab color science. Automatically validated via W3C hardware GPU capability check (`failIfMajorPerformanceCaveat: true`), throttled (~30fps on mobile), capped in DPR (1.5 on desktop, 1.0 on mobile), paused on hidden tabs, and gracefully falls back to [`AuroraFallback.tsx`](../../src/components/Aurora/AuroraFallback.tsx) on context loss or unsupported devices.

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
Tier 1: Foundation (types/*, styles/*, constants/*, data/*)
```

### Architectural Rules
1. **Unidirectional Flow**: Tiers can only import from lower tiers.
2. **Layer Inversion Guards**:
   - `utils/` cannot import from `hooks/`, `store/`, or `components/`.
   - `store/` and `hooks/` cannot import from `components/`.
3. **Deep Encapsulation & Zero Barrels**: Feature directories encapsulate private child components, and runtime `index.ts` barrels are prohibited. See [Component Imports](./component-imports.md).
4. **Grey Box Testing Contracts**: Pure domain logic and store state mutations are locked down with fast unit tests (`npm test` via Vitest). AI agents can safely modify internal mechanics as long as the test contract passes.
5. **Tooling Enforcement**: [`eslint/boundaries.js`](../../eslint/boundaries.js) configures `no-restricted-imports`. ESLint fails the build on any layer or boundary violation.

---

## 8. Canonical Browser API Seams & React 19 Invariants

Enforce unified seams and modern React patterns across all modules:

### Browser API Seams
- **History Mutations**: Use `safeReplaceState` or `safePushState` from [`src/hooks/useAppNavigation.ts`](../../src/hooks/useAppNavigation.ts). Direct `window.history` calls are prohibited.
- **Media Queries**: Use `useMediaQuery`, `useIsMobile`, or `isReducedMotionPreferred` from [`src/hooks/useMediaQuery.ts`](../../src/hooks/useMediaQuery.ts). Direct `window.matchMedia` calls are prohibited.
- **Resize Observers**: Use `useResizeObserver` or `subscribeResizeObserver` from [`src/hooks/useResizeObserver.ts`](../../src/hooks/useResizeObserver.ts). Instantiating `new ResizeObserver` directly is prohibited.
- **Idle Callbacks**: Use `requestIdle` and `cancelIdle` from [`src/utils/idleCallback.ts`](../../src/utils/idleCallback.ts). Direct `window.requestIdleCallback` calls are prohibited.
- **Session Storage**: Use `getSessionStorageItem` and `setSessionStorageItem` from [`src/components/Bpmn/bpmnStorage.ts`](../../src/components/Bpmn/bpmnStorage.ts). Direct `window.sessionStorage` access is prohibited.
- **Asset Prefetching**: Import `prefetchAsset` from [`src/utils/quicklink.ts`](../../src/utils/quicklink.ts). Direct `quicklink` package imports are prohibited.
- **Animation Source**: Import animations exclusively from `motion/react`. The legacy `framer-motion` package is prohibited.

### React 19 & Anti-Bloat Invariants
- **Ref as Prop**: Pass `ref` directly as a component prop. The `forwardRef` wrapper is prohibited.
- **Context Consumption**: Read context with the `use(Context)` hook. The legacy `useContext` hook is prohibited.
- **Event Callbacks**: Bind event callbacks using `useEffectEvent`. Never sync callbacks into refs inside effects.
- **Render Derivation**: Compute derived state during render. Never call synchronous `setState` at the top of `useEffect`.
- **Primitive Values**: Compute simple expressions directly during render. Avoid wrapping primitives in `useMemo`.
- **Direct Handlers**: Pass underlying handlers directly. Avoid single-call pass-through `useCallback` wrappers.
- **Security**: The `dangerouslySetInnerHTML` prop is prohibited across all components.
- **Data Immutability**: Use `.toSorted()` instead of mutating `.sort()` within `src/data/`.
- **HTML Nesting**: Never nest interactive elements like `<button>` inside `<Tab>` or another `<button>`.

---

## 9. Build Integration & Security Invariants

- **Boneyard Suspense**: `src/bones/registry.ts` is imported in `src/main.tsx` (do not delete). Components check `isBoneyardBuild()` from `src/utils/boneyard.ts` (`window.__BONEYARD_BUILD`) to skip dynamic animations during skeleton capture.
- **Bundler & Tooling**: Vite 8 uses the Rolldown bundler engine (`rolldownOptions`), LightningCSS transformer (`css.transformer: "lightningcss"`), and React Compiler via `@rolldown/plugin-babel`.
- **Security Invariants**: Static site hosted on GitHub Pages. BPMN SVGs must not contain inline event handlers. Markdown sources must contain no raw executable HTML.
