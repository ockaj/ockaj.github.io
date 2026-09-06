import { motion, useTransform, type MotionValue } from "motion/react";

const nodeOpacityAnimate = (active: boolean) => ({ opacity: active ? 1 : 0 });
const nodeOpacityTransition = { duration: 0.4 };

const nodePulseAnimate = (active: boolean) => ({
  opacity: active ? [0.7, 1, 0.7] : 0,
});
const nodePulseTransition = (active: boolean) => ({
  opacity: {
    duration: 1.8,
    repeat: active ? Infinity : 0,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
  },
});

function StaticFilterDefs() {
  return (
    <defs>
      <filter
        id="loading-node-glow"
        x="-30%"
        y="-30%"
        width="160%"
        height="160%"
      >
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="3"
          floodColor="#9b9bf8"
          floodOpacity="0.45"
        />
      </filter>
    </defs>
  );
}

function StaticBpmnConnections() {
  return (
    <>
      {/* Inactive Base Connections (Dim solid paths) */}
      <path
        d="M 98 120 L 170 120"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
      />
      <path
        d="M 290 120 L 367 120"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
      />
      <path
        d="M 423 120 L 440 120 L 440 65 L 480 65"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 423 120 L 440 120 L 440 175 L 480 175"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 600 65 L 650 65 L 650 92"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 600 175 L 650 175 L 650 148"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 678 120 L 692 120"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="none"
      />
    </>
  );
}

function StaticBpmnNodeBases() {
  return (
    <>
      {/* NODE 1: Start Event Base */}
      <circle
        cx="80"
        cy="120"
        r="18"
        stroke="hsl(var(--stroke))"
        strokeWidth="1.5"
        fill="hsl(var(--bg))"
      />

      {/* NODE 2: Task 1 Base */}
      <rect
        x="170"
        y="90"
        width="120"
        height="60"
        rx="6"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="hsl(var(--bg))"
      />

      {/* NODE 3: Gateway Base */}
      <path
        d="M 395 92 L 423 120 L 395 148 L 367 120 Z"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="hsl(var(--bg))"
      />

      {/* NODE 4a: Task 2 Base */}
      <rect
        x="480"
        y="35"
        width="120"
        height="60"
        rx="6"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="hsl(var(--bg))"
      />

      {/* NODE 4b: Task 3 Base */}
      <rect
        x="480"
        y="145"
        width="120"
        height="60"
        rx="6"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="hsl(var(--bg))"
      />

      {/* NODE 4c: Merge Gateway Base */}
      <path
        d="M 650 92 L 678 120 L 650 148 L 622 120 Z"
        stroke="hsl(var(--stroke))"
        strokeWidth="2"
        fill="hsl(var(--bg))"
      />

      {/* NODE 5: End Event Base */}
      <circle
        cx="710"
        cy="120"
        r="18"
        stroke="hsl(var(--stroke))"
        strokeWidth="4.5"
        fill="hsl(var(--bg))"
      />
    </>
  );
}

interface LoadingBpmnDiagramProps {
  nodes: {
    start?: boolean;
    task1?: boolean;
    gateway?: boolean;
    task2?: boolean;
    task3?: boolean;
    mergeGateway?: boolean;
    end?: boolean;
  };
  count: MotionValue<number>;
}

export default function LoadingBpmnDiagram({
  nodes,
  count,
}: Readonly<LoadingBpmnDiagramProps>) {
  const {
    start: nodeStart = false,
    task1: nodeTask1 = false,
    gateway: nodeGateway = false,
    task2: nodeTask2 = false,
    task3: nodeTask3 = false,
    mergeGateway: nodeMergeGateway = false,
    end: nodeEnd = false,
  } = nodes;

  const path1 = useTransform(count, [10, 25], [0, 1]);
  const path2 = useTransform(count, [35, 50], [0, 1]);
  const path3a = useTransform(count, [60, 75], [0, 1]);
  const path3b = useTransform(count, [60, 75], [0, 1]);
  const path4a = useTransform(count, [80, 90], [0, 1]);
  const path4b = useTransform(count, [80, 90], [0, 1]);
  const path5 = useTransform(count, [90, 95], [0, 1]);

  const path1Visible = useTransform<number, number>(count, (v) =>
    v >= 10 ? 1 : 0,
  );
  const path2Visible = useTransform<number, number>(count, (v) =>
    v >= 35 ? 1 : 0,
  );
  const path3Visible = useTransform<number, number>(count, (v) =>
    v >= 60 ? 1 : 0,
  );
  const path4Visible = useTransform<number, number>(count, (v) =>
    v >= 80 ? 1 : 0,
  );
  const path5Visible = useTransform<number, number>(count, (v) =>
    v >= 90 ? 1 : 0,
  );

  return (
    <div className="notranslate w-full max-w-4xl px-4" translate="no">
      <svg
        viewBox="0 0 800 240"
        className="h-auto w-full text-[hsl(var(--accent))]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <StaticFilterDefs />
        <StaticBpmnConnections />

        {/* Active Drawing Connections */}
        <motion.path
          initial={{ opacity: 0 }}
          d="M 98 120 L 170 120"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            pathLength: path1,
            opacity: path1Visible,
          }}
        />
        <motion.path
          initial={{ opacity: 0 }}
          d="M 290 120 L 367 120"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            pathLength: path2,
            opacity: path2Visible,
          }}
        />
        <motion.path
          initial={{ opacity: 0 }}
          d="M 423 120 L 440 120 L 440 65 L 480 65"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength: path3a,
            opacity: path3Visible,
          }}
        />
        <motion.path
          initial={{ opacity: 0 }}
          d="M 423 120 L 440 120 L 440 175 L 480 175"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength: path3b,
            opacity: path3Visible,
          }}
        />
        <motion.path
          initial={{ opacity: 0 }}
          d="M 600 65 L 650 65 L 650 92"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength: path4a,
            opacity: path4Visible,
          }}
        />
        <motion.path
          initial={{ opacity: 0 }}
          d="M 600 175 L 650 175 L 650 148"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength: path4b,
            opacity: path4Visible,
          }}
        />
        <motion.path
          initial={{ opacity: 0 }}
          d="M 678 120 L 692 120"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength: path5,
            opacity: path5Visible,
          }}
        />

        {/* Static Node Solid Base Shapes (Cover connector line ends) */}
        <StaticBpmnNodeBases />

        {/* NODE 1: Start Event Glow */}
        <motion.circle
          initial={{ opacity: 0 }}
          cx="80"
          cy="120"
          r="18"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.05)"
          filter={nodeStart ? "url(#loading-node-glow)" : undefined}
          animate={nodePulseAnimate(nodeStart)}
          transition={nodePulseTransition(nodeStart)}
        />

        {/* NODE 2: Task 1 Glow */}
        <motion.rect
          initial={{ opacity: 0 }}
          x="170"
          y="90"
          width="120"
          height="60"
          rx="6"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.03)"
          filter={nodeTask1 ? "url(#loading-node-glow)" : undefined}
          animate={nodeOpacityAnimate(nodeTask1)}
          transition={nodeOpacityTransition}
        />

        {/* NODE 3: Gateway Glow */}
        <motion.path
          initial={{ opacity: 0 }}
          d="M 395 92 L 423 120 L 395 148 L 367 120 Z"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.03)"
          filter={nodeGateway ? "url(#loading-node-glow)" : undefined}
          animate={nodeOpacityAnimate(nodeGateway)}
          transition={nodeOpacityTransition}
        />
        <g
          stroke={nodeGateway ? "hsl(var(--accent))" : "hsl(var(--stroke))"}
          strokeWidth="2.5"
          className="transition-colors duration-300"
        >
          <line x1="395" y1="112" x2="395" y2="128" />
          <line x1="387" y1="120" x2="403" y2="120" />
        </g>

        {/* NODE 4a: Task 2 Glow */}
        <motion.rect
          initial={{ opacity: 0 }}
          x="480"
          y="35"
          width="120"
          height="60"
          rx="6"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.03)"
          filter={nodeTask2 ? "url(#loading-node-glow)" : undefined}
          animate={nodeOpacityAnimate(nodeTask2)}
          transition={nodeOpacityTransition}
        />

        {/* NODE 4b: Task 3 Glow */}
        <motion.rect
          initial={{ opacity: 0 }}
          x="480"
          y="145"
          width="120"
          height="60"
          rx="6"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.03)"
          filter={nodeTask3 ? "url(#loading-node-glow)" : undefined}
          animate={nodeOpacityAnimate(nodeTask3)}
          transition={nodeOpacityTransition}
        />

        {/* NODE 4c: Merge Gateway Glow */}
        <motion.path
          initial={{ opacity: 0 }}
          d="M 650 92 L 678 120 L 650 148 L 622 120 Z"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.03)"
          filter={nodeMergeGateway ? "url(#loading-node-glow)" : undefined}
          animate={nodeOpacityAnimate(nodeMergeGateway)}
          transition={nodeOpacityTransition}
        />
        <g
          stroke={
            nodeMergeGateway ? "hsl(var(--accent))" : "hsl(var(--stroke))"
          }
          strokeWidth="2.5"
          className="transition-colors duration-300"
        >
          <line x1="650" y1="112" x2="650" y2="128" />
          <line x1="642" y1="120" x2="658" y2="120" />
        </g>

        {/* NODE 5: End Event Glow */}
        <motion.circle
          initial={{ opacity: 0 }}
          cx="710"
          cy="120"
          r="18"
          stroke="hsl(var(--accent))"
          strokeWidth="5"
          fill="hsl(var(--accent) / 0.05)"
          filter={nodeEnd ? "url(#loading-node-glow)" : undefined}
          animate={nodePulseAnimate(nodeEnd)}
          transition={nodePulseTransition(nodeEnd)}
        />
      </svg>
    </div>
  );
}
