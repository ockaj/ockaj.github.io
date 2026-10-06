---
trigger: model_decision
description: Critical build invariants for motion/react imports, Tailwind CSS v4 @theme tokens, and React Compiler build-time memoization. Use when editing styles, importing motion, or optimizing React components.
---

# Critical Build Invariants

This document defines build-time invariants and critical dependency patterns.

## 1. Animation Imports
- Import animations exclusively from `motion/react` (v13+). See [Motion Guidelines](./motion.md).

## 2. Tailwind CSS v4 Configuration
- Theme tokens reside in the `@theme` directive in [`src/index.css`](../../src/index.css).
- Tailwind CSS v4 does not use `tailwind.config.js` or `postcss.config.js`.
- Use theme tokens or native Tailwind scales instead of arbitrary values.
- Prettier with `prettier-plugin-tailwindcss` sorts class names automatically.

## 3. React Compiler
- The React Compiler operates at build time via Babel plugin.
- Avoid manual memoization hooks (`useMemo`, `useCallback`) unless profiling indicates a need.
