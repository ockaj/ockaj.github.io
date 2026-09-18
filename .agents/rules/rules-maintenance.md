---
trigger: model_decision
description: Protocol defining when agents must propose updates to repository rules and instructions.
---

# Rules Maintenance Protocol

This document defines when agents must propose updates to repository rules and instructions.

## 1. Trigger Conditions
Prompt the user with specific proposed edits to `AGENTS.md` or `.agents/rules/` when a task:
- Modifies `npm` scripts or dependencies in `package.json`.
- Adds or relocates a public feature entry point.
- Alters tier hierarchy or architectural boundaries.

## 2. Review Format
- Specify the exact file paths and line numbers that require updates.
