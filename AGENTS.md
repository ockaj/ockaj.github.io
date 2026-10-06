# Portfolio — Ondrej Michal Očkaj

Single-page React portfolio showcasing business analysis and process optimization for Ondrej Michal Očkaj.

---

## Verification Pipeline

Verify only when required:

- **Skip verification**: For cosmetic changes (CSS, Tailwind classes, colors, spacing, text, copy, markdown). Finish the turn without running commands.
- **Run verification**: For logic and code changes (TypeScript, state, dependencies, component structure). Run `npm run verify` once at the end of the task.

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
- Specialized rule files in [`.agents/rules/`](./.agents/rules/) (indexed automatically by agent harnesses)