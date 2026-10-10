---
trigger: model_decision
description: Tailwind CSS v4 @theme tokens and React Compiler memoization. Use when modifying index.css @theme or debugging compiler output.
---

# Critical Build Invariants

This document defines build-time invariants and configuration patterns.

## 1. Tailwind CSS v4 Configuration
- Theme tokens reside in the `@theme` directive in [`src/index.css`](../../src/index.css).
- Tailwind CSS v4 does not use `tailwind.config.js` or `postcss.config.js`.
- Use theme tokens or native Tailwind scales instead of arbitrary values.
- Prettier with `prettier-plugin-tailwindcss` sorts class names automatically.

## 2. React Compiler
- The React Compiler operates at build time via Babel plugin.
- Avoid manual memoization hooks (`useMemo`, `useCallback`) unless profiling indicates a need.
