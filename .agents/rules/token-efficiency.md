---
trigger: model_decision
description: Token efficiency, prompt engineering, and agent harness design rules. Use when creating or editing agent rules, skills, prompts, or tool configurations.
---

# Token Efficiency and Agent Harness Guidelines

This document defines principles to reduce token costs without task quality degradation.

## 1. Core Principles

- Optimize what the harness transmits. Do not command the model to conserve tokens.
- Capable models require plain descriptions. Replace negative commands with positive capability definitions.
- Reserve static context for information that most turns require.
- Expose all other context on demand through progressive disclosure.
- Prefer prompt removals over prompt additions.

## 2. Rule and Prompt Design

Apply these rules when writing system instructions or repository rules:

- **Definitions Over Commands**:
  Describe what tools and systems do.
  Avoid repetitive words such as `MUST`, `ALWAYS`, and `DO NOT`.
  Avoid capitalized emphasis. Literal models degrade when prompts contain heavy emphasis.

- **Instruction Audit**:
  Categorize each instruction:
  - **Keep**: Product knowledge, environment constraints, or transcripts bug fixes.
  - **Rewrite**: Convert commands into descriptions. Convert vague quantities into numeric ranges.
  - **Delete**: Remove default model behaviors. Remove guards against obsolete model bugs.
  - **Move**: Move request-specific data after the cache boundary.

- **Instruction Budget**:
  Models attend to 150 to 200 instructions with high consistency.
  Keep system prompts compact.

## 3. Context Architecture and Cache Layout

- Order requests to maximize prefix reuse:
  `tools -> system instructions -> [cache boundary] -> volatile context -> conversation history`
- Maintain identical byte sequences across turns for cached prefixes.
- Place timestamps, IDs, and dynamic environment state after the cache boundary.
- Do not alter previous messages except during compaction.

## 4. Tool Definitions and Output Hygiene

- Keep high-frequency tools in static context.
- Move low-frequency and integration tools to on-demand references.
- Write large tool outputs to a file. Return the file path, byte size, and a short tail.
- Avoid repetitive per-line numbering in high-volume tool outputs.
- Strip ANSI escape sequences and progress indicators from tool responses.

## 5. Subagents and Long Conversations

- Keep delegation prompts concise. State the task, required outputs, and constraints.
- Require subagents to return concise handoffs: actions completed, findings, concerns, and deviations.
- Overwrite scratchpads and running notes instead of appending content.
- Summarize long conversations compactly. Store full transcripts in searchable files.

## 6. Prohibited Practices

- Do not instruct the model to use fewer tokens.
- Do not truncate tool outputs silently.
- Do not inject volatile dynamic state into the cached prefix.
- Do not switch models mid-session when that action invalidates the prompt cache.
