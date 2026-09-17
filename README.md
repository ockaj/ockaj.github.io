# Ondrej Michal Očkaj — Business & Process Analyst Portfolio

A high-end, premium interactive portfolio showcasing Ondrej Michal Očkaj's skills, accomplishments, and custom process models as a Junior Business Analyst and Process Analyst. This site blends analytical rigor with an editorial-grade digital experience.

---

## Key Features

- **Domain-Specific Visuals**: Real-world BPMN process flows integrated directly into the layout, acting as structuring anchors instead of generic decorations.
- **Tactile Materials**: LiquidGlass components that simulate polished glass overlays, responding dynamically to cursor movements with magnetic pulls, 3D tilt, and spring-based ripples.
- **Ambient Graphics**: Custom WebGL Aurora gradient backgrounds running on the GPU thread for organic, performant ambient illumination.
- **Skeleton-First Rendering**: Built-in `boneyard-js` integration that captures layout dimensions at build time to provide flawless skeleton screen placeholders on slow connections.
- **Deep-linking & Smooth Navigation**: Sentinel-based scroll highlighting paired with URL hash synchronization for intuitive multi-device navigation.

---

## Technology Stack

- **Framework & Core**: React 19, TypeScript, Vite 8
- **UI Components & Materials**: Base UI (`@base-ui/react`), LiquidGlass tactile primitives
- **Styling**: Tailwind CSS v4, custom theme tokens
- **Graphics & Motion**: WebGL Aurora (`ogl`), `motion/react` (v13+), NumberFlow (`@number-flow/react`)
- **State Management**: Zustand 5 with URL hash synchronization
- **Asset Processing**: `lightningcss` (CSS transformer), SVGO (SVG optimizer), `boneyard-js` (build-time skeleton generation)
- **Content**: `react-markdown` + `remark-gfm` for fast, lightweight article rendering
- **Quality & Testing**: Vitest, React Doctor, Knip, ESLint flat config (React Compiler, SonarJS)

---

## Commands Cheat Sheet

| Command | Action |
|---|---|
| `npm run dev` | Launch local Vite development server |
| `npm run build` | Compile production bundle (targets ES2023, splits manual vendor chunks) |
| `npm run preview` | Run local web server serving production build in `/dist` |
| `npm test` | Run Vitest test suite once |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run typecheck` | Perform TypeScript compilability checks |
| `npm run lint` | Run ESLint flat configuration (enforces React Compiler & SonarJS rules) |
| `npm run doctor` | Run React Doctor diagnostics for anti-patterns and performance risks |
| `npm run knip` | Scan codebase for unused files, exports, and dependencies |
| `npm run optimize-svgs` | Run SVGO on all BPMN diagrams in `public/BPMN_models/` |
| `npm run analyze` | Build production bundle and open Rollup visualizer map |

---

## Verification Pipeline

Before committing changes or cutting a release, run the complete verification sequence:

```bash
npm test && npm run typecheck && npm run lint && npm run doctor && npm run knip && npm run build
```

Or execute them step by step:

1. `npm test` — Run unit and store tests.
2. `npm run typecheck` — Verify TypeScript types without emitting code.
3. `npm run lint` — Lint code against architectural boundaries and React rules.
4. `npm run doctor` — Check React component health and diagnostics.
5. `npm run knip` — Identify unused files, exports, and dependencies.
6. `npm run build` — Build production bundle to verify compilation.

---

## Getting Started

### Prerequisites

This repository requires **Node.js 22** and **npm** to be installed on your system.

### Installation

Clone the repository and install dependencies using `npm`:

```bash
git clone https://github.com/ockaj/ockaj.github.io.git
cd ockaj.github.io
npm ci
```

### Running Locally

Start the Vite development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser to view the application.

---

## Deployment

The portfolio is set up for automated continuous deployment using GitHub Actions:

1. **Continuous Integration**: Pushing commits to `main`/`master` triggers the deployment workflow.
2. **Build and Assets**: The environment runs `npm ci` followed by `npm run build` to generate static files under `./dist/`.
3. **Pages Deployment**: Static artifacts are uploaded and deployed directly to GitHub Pages via official GitHub Actions (`actions/deploy-pages`).
