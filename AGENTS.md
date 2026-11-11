# Portfolio — Ondrej Michal Očkaj

Single-page React portfolio showcasing business analysis and process optimization for Ondrej Michal Očkaj.

---

## Verification Pipeline

Verify only when required:

- **Skip verification**: For cosmetic changes (CSS, Tailwind classes, colors, spacing, text, copy, markdown). Finish the turn without running commands.
- **Inner loop (development)**: Run `npm run check` (runs gate + TypeScript typecheck in <2s) in the terminal for instant validation of types, seams, boundaries, and React 19 invariants during logic, routing, or state edits. Fix reported violations directly at the printed file and line number.
- **Outer loop (task exit)**: Run `npm run verify` once at task exit for code, state, dependency, or structure changes. Require a zero exit code across all `package.json` pipeline stages.
- **End-to-End suite**: Run `npm run test:e2e` (requires built `dist/` via `npm run build`) for targeted visual layout, CLS, or navigation checks, and `npm run test:a11y` for `axe-core` WCAG 2.1 AA and WAI-ARIA checks.

---

## Rules Maintenance

Propose updates to `AGENTS.md` or `.agents/rules/` when changing:
- Dependencies or scripts in `package.json`
- Feature entry points
- Architecture boundaries

Include exact target file paths and line numbers.

---

## Detailed Guidelines & References

Refer to specialized documentation for deep task context:

- [Product Vision & Requirements](./PRODUCT.md): Career narrative, target audience, positioning, and value proposition. Consult when modifying editorial copy, case studies, journal articles, or value statements.
- [Design System & UI Guidelines](./DESIGN.md): Design tokens, visual hierarchy, typography, spatial scales, and color palettes. Consult when styling layout components, tuning contrast, or adjusting theme variables.
- Specialized rule files in [`.agents/rules/`](./.agents/rules/): Technical architectural constraints and invariants (indexed automatically by agent harnesses).
