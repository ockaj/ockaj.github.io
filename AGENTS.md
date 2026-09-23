# Portfolio — Ondrej Michal Očkaj

Single-page React portfolio showcasing business analysis and process optimization for Ondrej Michal Očkaj.

---

## Verification Pipeline

Complete all changes before verification. Run this complete command sequence once at the end:

1. `npm test`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run doctor`
5. `npm run knip`
6. `npm run build`

Do not execute verification commands between individual file edits.
Omit this verification pipeline for pure design, styling, and copy changes unless requested.

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

- [Product Vision & Requirements](./PRODUCT.md)
- [Design System & UI Guidelines](./DESIGN.md)
- [Critical Build Invariants](./.agents/rules/build-invariants.md)
- [Architecture Guide](./.agents/rules/architecture.md)
- [Component Imports & Entry Points](./.agents/rules/component-imports.md)
- [LiquidGlass Primitives](./.agents/rules/liquid-glass.md)
- [Motion Implementation](./.agents/rules/motion.md)
- [Third-Party Library Usage](./.agents/rules/library-usage.md)
- [All Specialized Rules](./.agents/rules/)