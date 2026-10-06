---
trigger: model_decision
description: UI icons via lucide-react and brand logos via inline SVG paths. Use when adding or modifying icons, SVGs, lucide-react imports, or brand logos in UI components.
---

# Icon Library

The project relies on `lucide-react` for UI elements and inlined SVG path strings for Brand logos. Do not introduce alternative icon packages or additional brand icon dependencies.

## Rules
- Use components from `lucide-react` for standard UI icons.
- Use inlined SVG path strings inside `<svg>` elements for brand logos. Avoid installing additional icon packages.

## Examples
- Standard icon and brand logo usage:
  ```typescript
  import { ArrowUpRight } from "lucide-react";

  const GITHUB_PATH = "M12 0C5.37 0...";

  <svg viewBox="0 0 24 24"><path d={GITHUB_PATH} /></svg>
  ```
