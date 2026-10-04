# Portfolio — Ondrej Michal Očkaj

Single-page React portfolio showcasing business analysis and process optimization for Ondrej Michal Očkaj.

---

## Verification Pipeline

Verify only when required:

- **Skip verification**: For cosmetic changes (CSS, Tailwind classes, colors, spacing, text, copy, markdown). Finish the turn without running commands.
- **Run verification**: For logic and code changes (TypeScript, state, dependencies, component structure). Run `npm run verify` once at the end of the task.

Do not run verification between individual file edits.

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
- [Base UI Components](./.agents/rules/base-ui.md)
- [Token Efficiency & Harness Architecture](./.agents/rules/token-efficiency.md)
- [All Specialized Rules](./.agents/rules/)