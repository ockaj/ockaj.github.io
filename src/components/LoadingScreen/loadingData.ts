export interface BpmnStep {
  label: string;
  threshold: number;
  completedThreshold: number;
}

export const BPMN_STEPS: readonly BpmnStep[] = [
  {
    label: "Process Identification and Information Gathering",
    threshold: 0,
    completedThreshold: 15,
  },
  {
    label: "Process Decomposition into Activities",
    threshold: 15,
    completedThreshold: 30,
  },
  {
    label: "Determination of Activity Sequence and Responsibilities",
    threshold: 30,
    completedThreshold: 45,
  },
  {
    label: "Identification of Inputs and Outputs",
    threshold: 45,
    completedThreshold: 60,
  },
  {
    label: "Identification of Decision and Branching Points in the Process",
    threshold: 60,
    completedThreshold: 75,
  },
  {
    label: "Creation of the BPMN Model",
    threshold: 75,
    completedThreshold: 90,
  },
  {
    label: "Verification of Model Logic and Quality",
    threshold: 90,
    completedThreshold: 98,
  },
];
