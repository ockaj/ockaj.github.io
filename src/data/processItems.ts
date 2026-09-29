interface ProcessModelVariant {
  title: string;
  type: string;
  description: string;
  image: string;
  specTags?: string[];
}

export interface ProcessTopic {
  id: number;
  title: string;
  category: string;
  metrics?: string;
  accent: string;
  accentTwo: string;
  rotation?: number;
  source: ProcessModelVariant;
  optimized: ProcessModelVariant;
}

export const PROCESS_TOPICS: ProcessTopic[] = [
  {
    id: 1,
    title: "Conflict Resolution",
    category: "BPMN 2.0 Process Model",
    metrics: "Cycle Time · Escalation Rate",
    accent: "#5F7A6B",
    accentTwo: "#101511",
    rotation: -2,
    source: {
      title: "Conflict Resolution",
      type: "BPMN 2.0 Source Model",
      description:
        "Original process captured directly from legacy staff notes, showing missing decision gateways and unhandled escalation loops.",
      image: "/BPMN_models/riesenie_situacii/situacie_v1.svg",
      specTags: [
        "Raw Legacy Blueprint",
        "Unoptimized Gateways",
        "Implicit Deadlocks",
      ],
    },
    optimized: {
      title: "Conflict Resolution",
      type: "BPMN 2.0 Optimized Model",
      description:
        "Refactored process flow with explicit XOR decision gateways, defined SLA escalation limits, and clear role swimlanes.",
      image: "/BPMN_models/riesenie_situacii/situacie_v2.svg",
      specTags: [
        "Syntax Validation",
        "Gateway Logic Corrected",
        "Swimlane Alignment",
      ],
    },
  },
  {
    id: 2,
    title: "Project Coordination",
    category: "BPMN 2.0 Process Model",
    metrics: "Lead Time · Handoff Efficiency",
    accent: "#7A5F6D",
    accentTwo: "#151012",
    rotation: 2,
    source: {
      title: "Project Coordination",
      type: "BPMN 2.0 Source Model",
      description:
        "Legacy coordination flow with redundant handoffs between managers, untracked review delays, and missing error boundary events.",
      image: "/BPMN_models/koordinacia_projektu/projekt_v1.svg",
      specTags: ["Unbounded Loops", "Redundant Handoffs", "Legacy Sequence"],
    },
    optimized: {
      title: "Project Coordination",
      type: "BPMN 2.0 Optimized Model",
      description:
        "Streamlined workflow using parallel gateways (AND) for concurrent reviews and intermediate timer events to prevent project stalls.",
      image: "/BPMN_models/koordinacia_projektu/projekt_v2.svg",
      specTags: ["Handoff Streamlining", "Parallel Gateways", "Error Boundary"],
    },
  },
  {
    id: 3,
    title: "Class Timetable Creation",
    category: "BPMN 2.0 Process Model",
    metrics: "Scheduling Time · Constraints",
    accent: "#5D948E",
    accentTwo: "#101414",
    rotation: 1,
    source: {
      title: "Class Timetable Creation",
      type: "BPMN 2.0 Source Model",
      description:
        "Initial scheduling procedure based on unstructured spreadsheets, causing room allocation conflicts and unverified contract workloads.",
      image: "/BPMN_models/rozvrh/rozvrh_v1.svg",
      specTags: [
        "Manual Scheduling Overlaps",
        "Implicit Constraints",
        "Legacy Draft",
      ],
    },
    optimized: {
      title: "Class Timetable Creation",
      type: "BPMN 2.0 Optimized Model",
      description:
        "Validated timetable pipeline in ADONIS with automated generation constraints, dual review lanes, and contractor workload checks.",
      image: "/BPMN_models/rozvrh/rozvrh_v2.svg",
      specTags: [
        "Resource Allocation",
        "Validation Loop",
        "Swimlane Realignment",
      ],
    },
  },
];

export const PROCESS_ITEMS = PROCESS_TOPICS.flatMap((t) => [
  {
    id: t.id * 2 - 1,
    title: t.source.title,
    type: t.source.type,
    description: t.source.description,
    image: t.source.image,
    specTags: t.source.specTags,
    accent: t.accent,
    accentTwo: t.accentTwo,
    rotation: t.rotation,
  },
  {
    id: t.id * 2,
    title: t.optimized.title,
    type: t.optimized.type,
    description: t.optimized.description,
    image: t.optimized.image,
    specTags: t.optimized.specTags,
    accent: t.accent,
    accentTwo: t.accentTwo,
    rotation: t.rotation,
  },
]);

export const PROCESS_ITEMS_BY_ID = new Map<
  number,
  (typeof PROCESS_ITEMS)[number]
>(PROCESS_ITEMS.map((item) => [item.id, item]));
