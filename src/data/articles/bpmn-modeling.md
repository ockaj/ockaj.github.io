---
id: bpmn-traps
title: BPMN 2.0 process modeling in ADONIS
subtitle: BPMN & ADONIS
date: June 15, 2026
image: https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&h=600&q=80
---

Process mapping creates an informal view of current operations. Process modeling requires standardized, logical syntax ready for operational analysis and execution.

This guide presents a seven-step pipeline for building BPMN 2.0 models in ADONIS, followed by a school scheduling case study.

### The ADONIS modeling environment

ADONIS links processes across several business models:

- **Process map (Procesná mapa)**: Groups activities into management, core, and supporting categories.
- **BPMN model**: Specifies sequence flows, gateways, and tasks with standard BPMN 2.0 notation.
- **Working environment (Organizačná štruktúra)**: Maps organizational units and roles directly to swimlanes.
- **Document model (Model dokumentov)**: Tracks input and output files, records, and databases.

### The seven-step modeling pipeline

Transforming raw operational data into a verified model follows seven steps:

1. **Identify the process and gather data**: Define boundary events (start and end states) and collect existing spreadsheets, guidelines, and interview notes.
2. **Decompose activities**: Break procedures into atomic tasks using active verb-noun pairs (such as "Review invoice").
3. **Map sequence and assign roles**: Sequence tasks chronologically. Assign each task to a role from the working environment model rather than an individual person.
4. **Map inputs and outputs**: Connect document objects to tasks to show data flow.
5. **Define gateways**: Choose decision logic (exclusive XOR, parallel AND, or inclusive OR) and label outgoing branches with conditions.
6. **Build the BPMN diagram**: Draw pools, swimlanes, tasks, and connectors in ADONIS to match the BPMN 2.0 standard.
7. **Verify syntax and logic**: Inspect the model for deadlocks, orphans, and infinite loops. Review the draft with process owners.

### Modeling rules and common pitfalls

Process models require strict validation before operational handoff:

- **Pool boundaries**: Solid sequence flow lines cannot cross pools. Use dashed message flows between separate participant pools.
- **Loop routing**: Route return loops through an explicit decision gateway (XOR) rather than directly back to a task.
- **Gateway joins**: Merge paths split by an inclusive OR with a matching inclusive OR join to prevent execution deadlocks.
- **Task responsibilities**: Record role governance on each task with a RACI matrix.

### Case study: class schedule generation

This case study models academic schedule generation in ADONIS:

- **Trigger and roles**: Work starts before the academic year. Four roles participate: the Vice-Principal for Education (process owner), administrative staff, the Finance Vice-Principal, and teachers.
- **Database entry**: The Vice-Principal enters student cohorts, teacher availability requests, curricula, and workloads into the scheduling system.
- **Schedule draft generation**: The scheduling engine computes the first draft from database entries and operational constraints.
- **Parallel printing and inspection**: Two activities run simultaneously. The Finance Vice-Principal prints teacher schedules to verify contracted workloads. The Vice-Principal prints class schedules.
- **Feedback loop**: Teachers inspect the printed timetables. If changes are necessary, administrative staff adjust the software schedule and regenerate prints. If no changes remain, the process continues.
- **Publication**: The Vice-Principal sets room allocations, calculates overtime hours, and publishes the final schedule.
