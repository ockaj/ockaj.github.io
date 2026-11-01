---
trigger: model_decision
description: Tailwind CSS v4 @theme tokens, concentric radii, Vite 8 Rolldown build, and React Compiler. Use when modifying index.css @theme, vite.config.ts, nested radii, or build options.
---

# Critical Build Invariants

This document defines build-time invariants and configuration patterns.

## 1. Tailwind CSS v4 Configuration
- Theme tokens reside in the `@theme` directive in [`src/index.css`](../../src/index.css).
- Tailwind CSS v4 does not use `tailwind.config.js` or `postcss.config.js`.
- Nested corner radius: Follow concentric corner geometry manually ($R_{\text{inner}} = R_{\text{outer}} - \text{padding}$, e.g. outer `rounded-xl` with `p-1.25` padding and inner `rounded-lg`).
- Use theme tokens or native Tailwind scales instead of arbitrary values.
- Prettier with `prettier-plugin-tailwindcss` sorts class names automatically.

## 2. Bundler & React Compiler
- Vite 8 uses the Rolldown bundler engine with chunk splitting rules configured in `rolldownOptions`.
- LightningCSS handles CSS transformation and minification via `css.transformer: "lightningcss"`.
- The React Compiler operates at build time via `@rolldown/plugin-babel` with `@vitejs/plugin-react` `reactCompilerPreset()`.
- Avoid manual memoization hooks (`useMemo`, `useCallback`) unless profiling indicates a need.
