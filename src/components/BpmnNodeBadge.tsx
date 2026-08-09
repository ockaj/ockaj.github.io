import { memo } from "react";
import Tooltip from "./Tooltip";
import { cn } from "../utils/cn";

type BpmnType =
  | "trash"
  | "gateway-parallel"
  | "intermediate-event-catch-cancel"
  | "intermediate-event-catch-non-interrupting-message"
  | "start-event-compensation"
  | "start-event-non-interrupting-parallel-multiple"
  | "loop-marker"
  | "parallel-mi-marker"
  | "start-event-non-interrupting-signal"
  | "intermediate-event-catch-non-interrupting-timer"
  | "intermediate-event-catch-parallel-multiple"
  | "intermediate-event-catch-compensation"
  | "gateway-xor"
  | "end-event-cancel"
  | "intermediate-event-catch-condition"
  | "intermediate-event-catch-non-interrupting-parallel-multiple"
  | "start-event-condition"
  | "start-event-non-interrupting-timer"
  | "sequential-mi-marker"
  | "user-task"
  | "business-rule"
  | "sub-process-marker"
  | "start-event-parallel-multiple"
  | "start-event-error"
  | "intermediate-event-catch-signal"
  | "intermediate-event-catch-error"
  | "end-event-compensation"
  | "subprocess-collapsed"
  | "subprocess-expanded"
  | "task"
  | "end-event-error"
  | "intermediate-event-catch-escalation"
  | "intermediate-event-catch-timer"
  | "start-event-escalation"
  | "start-event-signal"
  | "business-rule-task"
  | "manual"
  | "receive"
  | "call-activity"
  | "start-event-timer"
  | "start-event-message"
  | "intermediate-event-none"
  | "intermediate-event-catch-link"
  | "end-event-escalation"
  | "bpmn-io"
  | "gateway-complex"
  | "gateway-eventbased"
  | "gateway-none"
  | "gateway-or"
  | "end-event-terminate"
  | "end-event-signal"
  | "end-event-none"
  | "end-event-multiple"
  | "end-event-message"
  | "end-event-link"
  | "intermediate-event-catch-message"
  | "intermediate-event-throw-compensation"
  | "start-event-multiple"
  | "script"
  | "manual-task"
  | "send"
  | "service"
  | "receive-task"
  | "user"
  | "start-event-none"
  | "intermediate-event-throw-escalation"
  | "intermediate-event-catch-multiple"
  | "intermediate-event-catch-non-interrupting-escalation"
  | "intermediate-event-throw-link"
  | "start-event-non-interrupting-condition"
  | "data-object"
  | "script-task"
  | "send-task"
  | "data-store"
  | "start-event-non-interrupting-escalation"
  | "intermediate-event-throw-message"
  | "intermediate-event-catch-non-interrupting-multiple"
  | "intermediate-event-catch-non-interrupting-signal"
  | "intermediate-event-throw-multiple"
  | "start-event-non-interrupting-message"
  | "ad-hoc-marker"
  | "service-task"
  | "task-none"
  | "compensation-marker"
  | "start-event-non-interrupting-multiple"
  | "intermediate-event-throw-signal"
  | "intermediate-event-catch-non-interrupting-condition"
  | "participant"
  | "event-subprocess-expanded"
  | "lane-insert-below"
  | "space-tool"
  | "connection-multi"
  | "lane"
  | "lasso-tool"
  | "lane-insert-above"
  | "lane-divide-three"
  | "lane-divide-two"
  | "data-input"
  | "data-output"
  | "hand-tool"
  | "group"
  | "text-annotation"
  | "transaction"
  | "screw-wrench"
  | "connection"
  | "conditional-flow"
  | "default-flow";

const SPECIFIC_BPMN_DESCRIPTIONS: Record<string, string> = {
  "start-event-none": "BPMN None Start Event: Shows where the workflow begins.",
  "end-event-none": "BPMN None End Event: Shows where the workflow finishes.",
  task: "BPMN Task: A single action or step that needs to be done.",
  "gateway-or":
    "BPMN Inclusive (OR) Gateway: A step where the path splits into one or more options depending on choices.",
  "gateway-parallel":
    "BPMN Parallel Gateway: A point where multiple actions happen at the same time.",
  "gateway-eventbased":
    "BPMN Event-Based Gateway: A split where the next step is determined by whatever happens first.",
  "subprocess-collapsed":
    "BPMN Collapsed Sub-Process: A group of nested steps bundled together to keep the main diagram clean.",
  "intermediate-event-catch-message":
    "BPMN Message Intermediate Catch Event: A pause in the flow until a message or notification is received.",
  "script-task":
    "BPMN Script Task: A step that runs automatically using computer code.",
  "user-task": "BPMN User Task: A task that must be done manually by a person.",
  "service-task":
    "BPMN Service Task: An action handled entirely by software, with no human needed.",
  "manual-task":
    "BPMN Manual Task: A real-world task done by hand without any software.",
  "send-task":
    "BPMN Send Task: An action that automatically sends a message or email.",
};

function getBpmnDescription(type: BpmnType): string {
  if (SPECIFIC_BPMN_DESCRIPTIONS[type]) {
    return SPECIFIC_BPMN_DESCRIPTIONS[type];
  }
  const formatted = type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `BPMN ${formatted} symbol.`;
}

interface BpmnNodeBadgeProps {
  type: BpmnType;
  className?: string;
}

const BpmnNodeBadge = memo(function BpmnNodeBadge({
  type,
  className = "",
}: BpmnNodeBadgeProps) {
  // Map the kebab-case type name to its bpmn-icon class
  const iconClass = `bpmn-icon-${type}`;

  return (
    <Tooltip content={getBpmnDescription(type)}>
      <span
        className={cn(
          "text-accent inline-flex -translate-y-[0.5px] items-center justify-center text-[20px] leading-none",
          iconClass,
          className,
        )}
        style={{ WebkitTextStroke: "0.2px currentColor" }}
        aria-hidden="true"
      />
    </Tooltip>
  );
});

export default BpmnNodeBadge;
