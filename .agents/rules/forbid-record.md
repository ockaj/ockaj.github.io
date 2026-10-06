---
trigger: model_decision
description: Strongly-typed domain interfaces replacing loose Record objects. Use when typing external I/O payloads, storage data, or structured models.
---

# Strongly-Typed Domain Data

Parse external data and dynamic objects into explicit domain types at the earliest I/O boundary.

## Rules
- Define explicit interfaces or types for incoming data instead of using `Record<string, unknown>`.
- Parse data as close to the originating I/O boundary as possible.
- Place shared domain types in `types.ts` (or component-specific `types.ts`).

## Examples

- **Anti-pattern**:
  ```typescript
  // Parsing to untyped dictionary away from I/O boundary
  const fm = parse(parts[1]) as Record<string, unknown>;
  const props: Record<string, unknown> = { className, style };
  ```

- **Target Pattern**:
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