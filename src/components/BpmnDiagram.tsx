import { memo } from "react";

interface BpmnDiagramProps {
  onTaskClick: (sectionId: string) => void;
}

function BpmnDiagram({ onTaskClick }: Readonly<BpmnDiagramProps>) {
  return (
    <svg
      viewBox="0 0 1420 500"
      className="text-accent h-auto w-full min-w-[950px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BPMN 2.0 Interactive Portfolio Navigation Diagram"
    >
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

      {/* Solid White Canvas Background */}
      <rect width="1420" height="500" fill="#FFFFFF" rx="8" />

      {/* Pool Frame (Black Stroke, White Fill) */}
      <rect
        x="30"
        y="20"
        width="1360"
        height="460"
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
        y2="480"
        stroke="#000000"
        strokeWidth="1.5"
        strokeOpacity="1"
      />
      <text
        x="47.5"
        y="250"
        fill="#000000"
        fillOpacity="1"
        fontSize="15"
        fontWeight="bold"
        transform="rotate(-90,47.5,250)"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-body"
      >
        Portfolio
      </text>

      {/* ================== VISITOR LANE NODES ================== */}

      {/* Start Event */}
      <circle
        cx="110"
        cy="250"
        r="27"
        stroke="#000000"
        strokeWidth="1.5"
        fill="#FDD061"
      />
      <text
        x="110"
        y="295"
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
        d="M 137,250 L 164.5,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      {/* Task: View Hero */}
      <g
        className="group/node focus-visible:outline-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid"
        tabIndex={0}
        aria-label="Navigate to Home section"
        onClick={() => onTaskClick("home")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTaskClick("home");
          }
        }}
      >
        {/* Task Box Outline */}
        <rect
          x="164.5"
          y="211.75"
          width="151"
          height="76.5"
          rx="6"
          stroke="#1D70B8"
          strokeWidth="1.2"
          fill="#90D3FF"
          aria-hidden="true"
          className="transition-[stroke,fill] duration-200 ease-out group-hover/node:fill-[#C0E6FF] group-hover/node:stroke-[#0D4A7A] group-focus-visible/node:stroke-[#000000] group-focus-visible/node:stroke-2"
        />
        <use
          href="#user-task-icon"
          x="168.5"
          y="217.75"
          width="11"
          height="13.2"
          aria-hidden="true"
          className="pointer-events-none"
        />
        {/* Task label */}
        <text
          x="240"
          y="250"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0A0E1A"
          fontSize="14"
          aria-hidden="true"
          className="font-body pointer-events-none"
        >
          View Hero
        </text>
      </g>

      {/* Flow: Hero -> Gateway */}
      <path
        d="M 315.5,250 L 358,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      {/* Split Parallel Gateway */}
      <path
        d="M 385,223 L 412,250 L 385,277 L 358,250 Z"
        stroke="#000000"
        strokeWidth="1.5"
        fill="#FDD061"
      />
      <path
        d="M 385,235 L 385,265 M 370,250 L 400,250"
        stroke="#000000"
        strokeWidth="5"
      />

      {/* Parallel Gateway branches */}
      <path
        d="M 412,250 L 457,250 L 457,80 L 502,80"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 412,250 L 457,250 L 457,193 L 502,193"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 412,250 L 457,250 L 457,307 L 502,307"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 412,250 L 457,250 L 457,420 L 502,420"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      {/* Task: Browse Case Studies */}
      <g
        className="group/node focus-visible:outline-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid"
        tabIndex={0}
        aria-label="Navigate to Case Studies section"
        onClick={() => onTaskClick("work")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTaskClick("work");
          }
        }}
      >
        {/* Task Box Outline */}
        <rect
          x="502"
          y="41.75"
          width="151"
          height="76.5"
          rx="5"
          stroke="#1D70B8"
          strokeWidth="1.2"
          fill="#90D3FF"
          aria-hidden="true"
          className="transition-[stroke,fill] duration-200 ease-out group-hover/node:fill-[#C0E6FF] group-hover/node:stroke-[#0D4A7A] group-focus-visible/node:stroke-[#000000] group-focus-visible/node:stroke-2"
        />
        <use
          href="#user-task-icon"
          x="506"
          y="47.75"
          width="11"
          height="13.2"
          aria-hidden="true"
          className="pointer-events-none"
        />
        <text
          x="577.5"
          y="80"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0A0E1A"
          fontSize="14"
          aria-hidden="true"
          className="font-body pointer-events-none"
        >
          Browse Case Studies
        </text>
      </g>

      {/* Task: Scan Competencies */}
      <g
        className="group/node focus-visible:outline-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid"
        tabIndex={0}
        aria-label="Navigate to Skills section"
        onClick={() => onTaskClick("skills")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTaskClick("skills");
          }
        }}
      >
        {/* Task Box Outline */}
        <rect
          x="502"
          y="154.75"
          width="151"
          height="76.5"
          rx="5"
          stroke="#1D70B8"
          strokeWidth="1.2"
          fill="#90D3FF"
          aria-hidden="true"
          className="transition-[stroke,fill] duration-200 ease-out group-hover/node:fill-[#C0E6FF] group-hover/node:stroke-[#0D4A7A] group-focus-visible/node:stroke-[#000000] group-focus-visible/node:stroke-2"
        />
        <use
          href="#user-task-icon"
          x="506"
          y="160.75"
          width="11"
          height="13.2"
          aria-hidden="true"
          className="pointer-events-none"
        />
        <text
          x="577.5"
          y="193"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0A0E1A"
          fontSize="14"
          aria-hidden="true"
          className="font-body pointer-events-none"
        >
          Scan Competencies
        </text>
      </g>

      {/* Task: Inspect Process Library */}
      <g
        className="group/node focus-visible:outline-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid"
        tabIndex={0}
        aria-label="Navigate to Process Models section"
        onClick={() => onTaskClick("processes")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTaskClick("processes");
          }
        }}
      >
        {/* Task Box Outline */}
        <rect
          x="502"
          y="268.75"
          width="151"
          height="76.5"
          rx="5"
          stroke="#1D70B8"
          strokeWidth="1.2"
          fill="#90D3FF"
          aria-hidden="true"
          className="transition-[stroke,fill] duration-200 ease-out group-hover/node:fill-[#C0E6FF] group-hover/node:stroke-[#0D4A7A] group-focus-visible/node:stroke-[#000000] group-focus-visible/node:stroke-2"
        />
        <use
          href="#user-task-icon"
          x="506"
          y="274.75"
          width="11"
          height="13.2"
          aria-hidden="true"
          className="pointer-events-none"
        />
        <text
          x="577.5"
          y="307"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0A0E1A"
          fontSize="14"
          aria-hidden="true"
          className="font-body pointer-events-none"
        >
          Inspect Process Library
        </text>
      </g>

      {/* Task: Read Journal */}
      <g
        className="group/node focus-visible:outline-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid"
        tabIndex={0}
        aria-label="Navigate to Journal section"
        onClick={() => onTaskClick("journal")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTaskClick("journal");
          }
        }}
      >
        {/* Task Box Outline */}
        <rect
          x="502"
          y="381.75"
          width="151"
          height="76.5"
          rx="5"
          stroke="#1D70B8"
          strokeWidth="1.2"
          fill="#90D3FF"
          aria-hidden="true"
          className="transition-[stroke,fill] duration-200 ease-out group-hover/node:fill-[#A3DBFF] group-hover/node:stroke-[#1060A0] group-focus-visible/node:stroke-[#000000] group-focus-visible/node:stroke-2"
        />
        <use
          href="#user-task-icon"
          x="506"
          y="387.75"
          width="11"
          height="13.2"
          aria-hidden="true"
          className="pointer-events-none"
        />
        <text
          x="577.5"
          y="420"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0A0E1A"
          fontSize="14"
          aria-hidden="true"
          className="font-body pointer-events-none"
        >
          Read Journal
        </text>
      </g>

      {/* Branch merges to Join Parallel Gateway */}
      <path
        d="M 653,80 L 698,80 L 698,250 L 743,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 653,193 L 698,193 L 698,250 L 743,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 653,307 L 698,307 L 698,250 L 743,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <path
        d="M 653,420 L 698,420 L 698,250 L 743,250"
        stroke="#000000"
        strokeWidth="1.2"
      />

      {/* Join Parallel Gateway */}
      <path
        d="M 770,223 L 797,250 L 770,277 L 743,250 Z"
        stroke="#000000"
        strokeWidth="1.5"
        fill="#FDD061"
      />
      <path
        d="M 770,235 L 770,265 M 755,250 L 785,250"
        stroke="#000000"
        strokeWidth="5"
      />

      <path
        d="M 797,250 L 852,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      {/* Exclusive Gateway: Contact wanted? */}
      <path
        d="M 879,223 L 906,250 L 879,277 L 852,250 Z"
        stroke="#000000"
        strokeWidth="1.5"
        fill="#FDD061"
      />
      <text
        x="879"
        y="295"
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
        d="M 906,250 L 1026,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <text
        x="996"
        y="272"
        textAnchor="middle"
        fill="#000000"
        fillOpacity="1"
        fontSize="14"
        className="font-body"
      >
        Yes
      </text>

      {/* Task: Get In Touch */}
      <g
        className="group/node focus-visible:outline-accent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid"
        tabIndex={0}
        aria-label="Navigate to Contact section"
        onClick={() => onTaskClick("contact")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTaskClick("contact");
          }
        }}
      >
        {/* Task Box Outline */}
        <rect
          x="1026"
          y="211.75"
          width="151"
          height="76.5"
          rx="6"
          stroke="#1D70B8"
          strokeWidth="1.2"
          fill="#90D3FF"
          aria-hidden="true"
          className="transition-[stroke,fill] duration-200 ease-out group-hover/node:fill-[#C0E6FF] group-hover/node:stroke-[#0D4A7A] group-focus-visible/node:stroke-[#000000] group-focus-visible/node:stroke-2"
        />
        <use
          href="#user-task-icon"
          x="1030"
          y="217.75"
          width="11"
          height="13.2"
          aria-hidden="true"
          className="pointer-events-none"
        />
        <text
          x="1101.5"
          y="250"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0A0E1A"
          fontSize="14"
          aria-hidden="true"
          className="font-body pointer-events-none"
        >
          Get In Touch
        </text>
      </g>

      {/* Flow No -> End Event */}
      <path
        d="M 906,250 L 966,250 L 966,340 L 1237,340 L 1237,250 L 1297,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />
      <text
        x="1101.5"
        y="362"
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
        d="M 1177,250 L 1297,250"
        stroke="#000000"
        strokeWidth="1.2"
        markerEnd="url(#bpmn-arrow)"
      />

      {/* End Event */}
      <circle
        cx="1324"
        cy="250"
        r="27"
        stroke="#000000"
        strokeWidth="3"
        fill="#FDD061"
      />
      <text
        x="1324"
        y="295"
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
