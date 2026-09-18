---
trigger: model_decision
description: Forbid Record<string, unknown> in favor of strongly-typed domain types parsed at the earliest I/O boundary.
---

# Forbid Record<string, unknown>

Do not use `Record<string, unknown>` anywhere in the codebase.

## Rules
- FORBID all usage of `Record<string, unknown>`.
- MUST convert incoming data to strongly-typed domain types parsed at the earliest time possible, as close to the I/O boundary where the data originated.
- MUST place or reuse shared domain types in `types.ts` (or component-specific `types.ts`).

## Examples

- **Incorrect**:
  ```typescript
  // Parsing to untyped dictionary away from I/O boundary
  const fm = parse(parts[1]) as Record<string, unknown>;
  const props: Record<string, unknown> = { className, style };
  ```

- **Correct**:
  ```typescript
  // Parsed into strongly-typed domain type at the earliest I/O boundary
  export interface CaseStudyFrontmatter {
    id?: string | number;
    title?: string;
    category?: string;
  }

  const fm = (parse(parts[1]) || {}) as CaseStudyFrontmatter;
  const props: LiquidGlassTagProps = { className, style };
  ```