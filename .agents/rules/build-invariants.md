---
trigger: model_decision
description: Critical build invariants, animation imports from motion/react, Tailwind CSS v4 setup, and React Compiler rules.
---

# Critical Build Invariants

This document defines build-time invariants and critical dependency patterns.

## 1. Animation Imports
- Import animations strictly from `motion/react` (v13+).
- Never import from `framer-motion`.

## 2. Tailwind CSS v4 Configuration
- Theme tokens reside in the `@theme` directive in [`src/index.css`](../../src/index.css).
- Never create `tailwind.config.js` or `postcss.config.js`.
- Forbid arbitrary values (such as `w-[320px]`). Use theme tokens or native Tailwind scales.
- Prettier with `prettier-plugin-tailwindcss` sorts class names automatically.

## 3. React Compiler
- The React Compiler operates at build time via Babel plugin.
- Do not add manual memoization hooks (`useMemo`, `useCallback`) unless profiling indicates a need.
