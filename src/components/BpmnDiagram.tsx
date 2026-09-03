import { memo } from "react";
import { cn } from "../utils/cn";

interface BpmnDiagramProps {
  onTaskClick: (sectionId: string) => void;
}

function BpmnDefs() {
  return (
    <defs>
      {/* Arrow markers (Black) */}
      <marker
        id="bpmn-arrow"
        viewBox="0 0 10 10"
        refX="7"
        refY="5"
        markerWidth="9"
        markerHeight="9"
        orient="auto-start-reverse"
      >
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000" />
      </marker>
      {/* User Task Icon */}
      <g id="user-task-icon">
        <g transform="matrix(1,0,0,1,-630,-327.5469)">
          <g transform="matrix(1,0,0,1,625,322)">
            <path
              d="M14.281,14.766C14.281,15.297 14.13,15.75 13.828,16.125C13.526,16.5 13.167,16.688 12.75,16.688L6.547,16.688C6.13,16.688 5.766,16.5 5.453,16.125C5.151,15.75 5,15.297 5,14.766C5,14.286 5.036,13.807 5.109,13.328C5.172,12.839 5.292,12.396 5.469,12C5.646,11.604 5.891,11.281 6.203,11.031C6.505,10.781 6.896,10.656 7.375,10.656C7.667,10.937 8.005,11.161 8.391,11.328C8.776,11.495 9.193,11.578 9.641,11.578C10.089,11.578 10.505,11.495 10.891,11.328C11.276,11.161 11.62,10.937 11.922,10.656C12.391,10.656 12.781,10.781 13.094,11.031C13.396,11.281 13.635,11.604 13.812,12C13.99,12.396 14.109,12.839 14.172,13.328C14.245,13.807 14.281,14.286 14.281,14.766ZM12.422,8.328C12.422,8.713 12.354,9.073 12.219,9.406C12.073,9.75 11.87,10.052 11.609,10.312C11.359,10.562 11.063,10.755 10.719,10.891C10.385,11.036 10.026,11.109 9.641,11.109C9.255,11.109 8.896,11.036 8.562,10.891C8.219,10.755 7.922,10.562 7.672,10.312C7.422,10.052 7.224,9.75 7.078,9.406C6.932,9.073 6.859,8.713 6.859,8.328C6.859,7.943 6.932,7.578 7.078,7.234C7.224,6.901 7.422,6.609 7.672,6.359C7.922,6.109 8.219,5.911 8.562,5.766C8.896,5.62 9.255,5.547 9.641,5.547C10.026,5.547 10.385,5.62 10.719,5.766C11.063,5.911 11.359,6.109 11.609,6.359C11.87,6.609 12.073,6.901 12.219,7.234C12.354,7.578 12.422,7.943 12.422,8.328Z"
              fill="#0A0E1A"
              fillRule="nonzero"
            />
          </g>
        </g>
      </g>
    </defs>
  );
}

function BpmnPoolFrame() {
  return (
    <>
      <rect width="1420" height="600" fill="#FFFFFF" rx="8" />
      <rect
        x="30"
        y="20"
        width="1360"
        height="560"
        rx="6"
        stroke="#000000"
        strokeWidth="1.5"
        strokeOpacity="1"
        fill="#FFFFFF"
        fillOpacity="1"
      />
      <line
        x1="65"
        y1="20"
        x2="65"
        y2="580"
        stroke="#000000"
        strokeWidth="1.5"
        strokeOpacity="1"
      />
      <text
        x="47.5"
        y="300"
        fill="#000000"
        fillOpacity="1"
        fontSize="15"
        fontWeight="bold"
        transform="rotate(-90,47.5,300)"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-body"
      >
        Portfolio
      </text>
    </>
  );
}

interface BpmnTaskNodeProps {
  x: number;
  y: number;
  iconX: number;
  iconY: number;
  textX: number;
  textY: number;
  label: string;
  sectionId: string;
  ariaLabel: string;
  onTaskClick: (sectionId: string) => void;
  hoverFillClass?: string;
  hoverStrokeClass?: string;
  rx?: number;
}

function BpmnTaskNode({
  x,
  y,
  iconX,
  iconY,
  textX,
  textY,
  label,
  sectionId,
  ariaLabel,
  onTaskClick,
  hoverFillClass = "group-hover/node:fill-[#C0E6FF]",
  hoverStrokeClass = "group-hover/node:stroke-[#0D4A7A]",
  rx = 6,
}: Readonly<BpmnTaskNodeProps>) {
  return (
    <g
      className="group/node focus-visible:outline-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => onTaskClick(sectionId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTaskClick(sectionId);
        }
      }}
    >
      <rect
        x={x}
        y={y}
        width="151"
        height="76.5"
        rx={rx}
        stroke="#1D70B8"
        strokeWidth="1.2"
        fill="#90D3FF"
        aria-hidden="true"
        className={cn(
          "transition-[stroke,fill] duration-200 ease-out group-focus-visible/node:stroke-[#000000] group-focus-visible/node:stroke-2",
          hoverFillClass,
          hoverStrokeClass,
        )}
      />
      <use
        href="#user-task-icon"
        x={iconX}
        y={iconY}
        width="11"
        height="13.2"
        aria-hidden="true"
        className="pointer-events-none"
      />
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#0A0E1A"
        fontSize="14"
        aria-hidden="true"
        className="font-body pointer-events-none"
      >
        {label}
      </text>
    </g>
  );
}

function BpmnDiagram({ onTaskClick }: Readonly<BpmnDiagramProps>) {
  return (
    <svg
      viewBox="0 0 1420 600"
      className="text-accent notranslate h-auto w-full min-w-[950px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BPMN 2.0 Interactive Portfolio Navigation Diagram"
    >
      <BpmnDefs />
      <BpmnPoolFrame />

      {/* Start Event */}
      <circle
        cx="110"
        cy="300"
        r="27"
        stroke="#000000"
        strokeWidth="1.5"
        fill="#FDD061"
      />
      <text
        x="110"
        y="345"
        textAnchor="middle"
        fill="#000000"
        fillOpacity="1"
        fontSize="14"
        className="font-body"
      >
        <tspan x="110" dy="0">
          Session
        </tspan>
        <tspan x="110" dy="16">
          started
        </tspan>
      </text>

      {/* Flow: Start -> Hero */}
      <path
        d="M 137,300 L 164.5,300"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      <BpmnTaskNode
        x={164.5}
        y={261.75}
        iconX={168.5}
        iconY={267.75}
        textX={240}
        textY={300}
        label="View Hero"
        sectionId="home"
        ariaLabel="Navigate to Home section"
        onTaskClick={onTaskClick}
      />

      {/* Flow: Hero -> Gateway */}
      <path
        d="M 315.5,300 L 358,300"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      {/* Split Parallel Gateway */}
      <path
        d="M 385,273 L 412,300 L 385,327 L 358,300 Z"
        stroke="#000000"
        strokeWidth="1.5"
        fill="#FDD061"
      />
      <path
        d="M 385,285 L 385,315 M 370,300 L 400,300"
        stroke="#000000"
        strokeWidth="5"
      />

      {/* Parallel Gateway branches */}
      <path
        d="M 412,300 L 457,300 L 457,80 L 502,80"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 412,300 L 457,300 L 457,190 L 502,190"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 412,300 L 502,300"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 412,300 L 457,300 L 457,410 L 502,410"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 412,300 L 457,300 L 457,520 L 502,520"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      <BpmnTaskNode
        x={502}
        y={41.75}
        iconX={506}
        iconY={47.75}
        textX={577.5}
        textY={80}
        label="Browse Case Studies"
        sectionId="work"
        ariaLabel="Navigate to Case Studies section"
        onTaskClick={onTaskClick}
        rx={5}
      />

      <BpmnTaskNode
        x={502}
        y={151.75}
        iconX={506}
        iconY={157.75}
        textX={577.5}
        textY={190}
        label="Scan Competencies"
        sectionId="skills"
        ariaLabel="Navigate to Skills section"
        onTaskClick={onTaskClick}
        rx={5}
      />

      <BpmnTaskNode
        x={502}
        y={261.75}
        iconX={506}
        iconY={267.75}
        textX={577.5}
        textY={300}
        label="Inspect Process Library"
        sectionId="processes"
        ariaLabel="Navigate to Process Models section"
        onTaskClick={onTaskClick}
        rx={5}
      />

      <BpmnTaskNode
        x={502}
        y={371.75}
        iconX={506}
        iconY={377.75}
        textX={577.5}
        textY={410}
        label="Read Journal"
        sectionId="journal"
        ariaLabel="Navigate to Journal section"
        onTaskClick={onTaskClick}
        hoverFillClass="group-hover/node:fill-[#A3DBFF]"
        hoverStrokeClass="group-hover/node:stroke-[#1060A0]"
        rx={5}
      />

      <BpmnTaskNode
        x={502}
        y={481.75}
        iconX={506}
        iconY={487.75}
        textX={577.5}
        textY={520}
        label="Review FAQ"
        sectionId="faq"
        ariaLabel="Navigate to FAQ section"
        onTaskClick={onTaskClick}
        rx={5}
      />

      {/* Branch merges to Join Parallel Gateway */}
      <path
        d="M 653,80 L 698,80 L 698,300 L 743,300"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 653,190 L 698,190 L 698,300 L 743,300"
        stroke="#000000"
        strokeWidth="1.2"
      />
      <path d="M 653,300 L 743,300" stroke="#000000" strokeWidth="1.2" />
      <path
        d="M 653,410 L 698,410 L 698,300 L 743,300"
        stroke="#000000"
        strokeWidth="1.2"
      />
      <path
        d="M 653,520 L 698,520 L 698,300 L 743,300"
        stroke="#000000"
        strokeWidth="1.2"
      />

      {/* Join Parallel Gateway */}
      <path
        d="M 770,273 L 797,300 L 770,327 L 743,300 Z"
        stroke="#000000"
        strokeWidth="1.5"
        fill="#FDD061"
      />
      <path
        d="M 770,285 L 770,315 M 755,300 L 785,300"
        stroke="#000000"
        strokeWidth="5"
      />

      <path
        d="M 797,300 L 852,300"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      {/* Exclusive Gateway: Contact wanted? */}
      <path
        d="M 879,273 L 906,300 L 879,327 L 852,300 Z"
        stroke="#000000"
        strokeWidth="1.5"
        fill="#FDD061"
      />
      <text
        x="879"
        y="345"
        textAnchor="middle"
        fill="#000000"
        fillOpacity="1"
        fontSize="14"
        className="font-body"
      >
        <tspan x="879" dy="0">
          Initiate
        </tspan>
        <tspan x="879" dy="16">
          Contact?
        </tspan>
      </text>

      {/* Flow Yes -> Contact Task */}
      <path
        d="M 906,300 L 1026,300"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <text
        x="996"
        y="322"
        textAnchor="middle"
        fill="#000000"
        fillOpacity="1"
        fontSize="14"
        className="font-body"
      >
        Yes
      </text>

      <BpmnTaskNode
        x={1026}
        y={261.75}
        iconX={1030}
        iconY={267.75}
        textX={1101.5}
        textY={300}
        label="Get In Touch"
        sectionId="contact"
        ariaLabel="Navigate to Contact section"
        onTaskClick={onTaskClick}
      />

      {/* Flow No -> End Event */}
      <path
        d="M 906,300 L 966,300 L 966,390 L 1237,390 L 1237,300 L 1297,300"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <text
        x="1101.5"
        y="412"
        textAnchor="middle"
        fill="#000000"
        fillOpacity="1"
        fontSize="14"
        className="font-body"
      >
        No
      </text>

      {/* Merge Contact flow to End */}
      <path
        d="M 1177,300 L 1297,300"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      {/* End Event */}
      <circle
        cx="1324"
        cy="300"
        r="27"
        stroke="#000000"
        strokeWidth="3"
        fill="#FDD061"
      />
      <text
        x="1324"
        y="345"
        textAnchor="middle"
        fill="#000000"
        fillOpacity="1"
        fontSize="14"
        className="font-body"
      >
        <tspan x="1324" dy="0">
          Session
        </tspan>
        <tspan x="1324" dy="16">
          Ended
        </tspan>
      </text>
    </svg>
  );
}

export default memo(BpmnDiagram);
