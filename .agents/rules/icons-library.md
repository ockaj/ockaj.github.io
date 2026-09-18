---
trigger: model_decision
description: Rules for UI icons (lucide-react) and brand logos (inline SVG paths).
---

# Icon Library

The project relies on `lucide-react` for UI elements and inlined SVG path strings for Brand logos. Do not introduce alternative icon packages or additional brand icon dependencies.

## Rules
- MUST use components from `lucide-react` for standard UI icons.
- MUST use inlined SVG path strings inside custom `<svg>` tags for brand logos (do NOT install additional icon packages like `simple-icons`).

## Examples
- **Correct**:
  ```typescript
  import { ArrowUpRight } from "lucide-react";

  const GITHUB_PATH = "M12 0C5.37 0...";

  <svg viewBox="0 0 24 24"><path d={GITHUB_PATH} /></svg>
  ```
