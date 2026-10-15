---
name: exit-gate
description: Exit gate for logic, state, routing, overlay, or config edits. Enforces seam continuity, deep modules, React 19 invariants, and full verification.
---

# Exit Gate

Execute these five steps in sequence before finishing any logic, state, routing, overlay, or configuration edit.

## Step 1: Trace Callers and Seams (`grep`)

Search all callers and imports across `src/` with `grep` before and after editing:

- Keep each module **deep**: hide internal state, buffering, and recovery behind one public entry point.
- Route browser history mutations, media queries, resize observers, idle callbacks, and storage access through their canonical hooks and utilities.
- Synchronize `.agents/rules/`, `doctor.config.ts`, and `index.html` JSON-LD whenever module files or FAQ entries change.

**Completion criterion:** Every caller, import path, and rule table entry across `src/` and `.agents/rules/` matches the updated module interface.

## Step 2: Enforce Explicit Recovery and Lean React 19 Patterns

Audit every modified line in `src/` for state, error, and DOM discipline:

- Handle every `catch` and Promise `.catch()` with an explicit fallback return value, state rollback, or recovery action.
- Bind effect callbacks with React 19 `useEffectEvent`, read context with `use()`, and compute primitive values directly during render.
- Inline single-caller wrapper hooks, single-action reducers, and pass-through components into their parent caller.
- Match JavaScript viewport hooks (`useIsMobile`, `useIsDesktop`) with their exact Tailwind breakpoint prefix (`md:`, `lg:`).

**Completion criterion:** Every modified file contains explicit error recovery, zero pass-through wrappers, and one active DOM tree.

## Step 3: Verify Happy-Path and Boundary Tests (`vitest`)

Inspect and run the unit test suite for every modified domain module, hook, or store:

- Assert both normal execution paths and boundary or failure paths (`null`, `undefined`, malformed hashes, `SecurityError`, reduced motion, empty collections).
- Run `npx vitest run` and inspect the raw output.

**Completion criterion:** Every modified module has passing happy-path and boundary assertions with zero skipped or tautological tests.

## Step 4: Run the Deterministic Gate (`npm run gate`)

Execute `npm run gate` in the terminal and evaluate the result:
- When `npm run gate` exits `0` (**green**): proceed directly to Step 5.
- When `npm run gate` reports violations: repair each issue directly at the reported source file and line number shown in the terminal output, then rerun `npm run gate`.

**Completion criterion:** `npm run gate` exits `0` (**green**) with zero reported violations across all source files, test suites, and rule docs.

## Step 5: Run the Full Verification Pipeline (`npm run verify`)

Execute `$env:CI = "true"; npm run verify` and inspect the complete output across `gate`, `vitest`, `typecheck`, `eslint`, `react-doctor`, `knip`, and `vite build`.

**Completion criterion:** `npm run verify` exits `0` (**green**) with a 100/100 React Doctor score, zero warnings, zero Knip hints, and a clean production build.
