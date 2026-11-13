# Portfolio — Ondrej Michal Očkaj

Single-page React portfolio showcasing business analysis and process optimization for Ondrej Michal Očkaj.

---

## Verification Pipeline

Verify with atomic, canonical commands only:

- **Cosmetic changes**: Finish the turn immediately without running commands (CSS, Tailwind classes, colors, spacing, copy, markdown).
- **Inner loop (development)**: Run `npm run check` (gate + typecheck in <2s) during logic, routing, or state edits. Once green, stop immediately.
- **Outer loop (task exit)**: Run `npm run verify` once at task completion for logic, structural, or dependency edits. A zero exit code satisfies completion.
- **Browser & End-to-End**: Run `npm run test:e2e` or `npm run test:a11y` exclusively when explicitly requested or verifying responsive layout morphs.

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
