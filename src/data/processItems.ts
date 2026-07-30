export interface ProcessModelVariant {
  title: string;
  type: string;
  description: string;
  image: string;
}

export interface ProcessTopic {
  id: number;
  title: string;
  category: string;
  accent: string;
  accentTwo: string;
  rotation?: number;
  asis: ProcessModelVariant;
  tobe: ProcessModelVariant;
}

export const PROCESS_TOPICS: ProcessTopic[] = [
  {
    id: 1,
    title: "Conflict Resolution",
    category: "BPMN 2.0 Process Model",
    accent: "#5F7A6B",
    accentTwo: "#101511",
    rotation: -2,
    asis: {
      title: "Conflict Resolution",
      type: "BPMN 2.0 Source Model",
      description:
        "BPMN process model constructed strictly and literally from the raw, unoptimized legacy source materials as provided.",
      image: "/BPMN_models/riesenie_situacii/situacie_v1.svg",
    },
    tobe: {
      title: "Conflict Resolution",
      type: "BPMN 2.0 Optimized Model",
      description:
        "Optimized BPMN process model by eliminating bottlenecks and structural inconsistencies for improved efficiency.",
      image: "/BPMN_models/riesenie_situacii/situacie_v2.svg",
    },
  },
  {
    id: 2,
    title: "Project Coordination",
    category: "BPMN 2.0 Process Model",
    accent: "#7A5F6D",
    accentTwo: "#151012",
    rotation: 2,
    asis: {
      title: "Project Coordination",
      type: "BPMN 2.0 Source Model",
      description:
        "BPMN process model constructed strictly and literally from the raw, unoptimized project coordination legacy source materials.",
      image: "/BPMN_models/koordinacia_projektu/projekt_v1.svg",
    },
    tobe: {
      title: "Project Coordination",
      type: "BPMN 2.0 Optimized Model",
      description:
        "Optimized BPMN process model for project coordination, corrected and logically validated using target business analyst methodology.",
      image: "/BPMN_models/koordinacia_projektu/projekt_v2.svg",
    },
  },
  {
    id: 3,
    title: "Class Timetable Creation",
    category: "BPMN 2.0 Process Model",
    accent: "#5D948E",
    accentTwo: "#101414",
    rotation: 1,
    asis: {
      title: "Class Timetable Creation",
      type: "BPMN 2.0 Source Model",
      description:
        "BPMN process model constructed strictly and literally from the raw, unoptimized timetable creation legacy source materials.",
      image: "/BPMN_models/rozvrh/rozvrh_v1.svg",
    },
    tobe: {
      title: "Class Timetable Creation",
      type: "BPMN 2.0 Optimized Model",
      description:
        "Optimized BPMN process model for timetable creation, corrected and logically validated using target business analyst methodology.",
      image: "/BPMN_models/rozvrh/rozvrh_v2.svg",
    },
  },
];

export const PROCESS_ITEMS = PROCESS_TOPICS.flatMap((t) => [
  {
    id: t.id * 2 - 1,
    title: t.asis.title,
    type: t.asis.type,
    description: t.asis.description,
    image: t.asis.image,
    accent: t.accent,
    accentTwo: t.accentTwo,
    rotation: t.rotation,
  },
  {
    id: t.id * 2,
    title: t.tobe.title,
    type: t.tobe.type,
    description: t.tobe.description,
    image: t.tobe.image,
    accent: t.accent,
    accentTwo: t.accentTwo,
    rotation: t.rotation,
  },
]);
