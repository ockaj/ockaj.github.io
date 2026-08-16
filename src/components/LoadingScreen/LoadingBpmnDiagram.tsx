import { motion, type MotionValue } from "motion/react";

const nodeOpacityAnimate = (active: boolean) => ({ opacity: active ? 1 : 0 });
const nodeOpacityTransition = { duration: 0.4 };

const nodePulseAnimate = (active: boolean) => ({
  scale: active ? [1, 1.08, 1] : 1,
  opacity: active ? 1 : 0,
});
const nodePulseTransition = (active: boolean) => ({
  scale: {
    duration: 1.8,
    repeat: active ? Infinity : 0,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
  },
  opacity: { duration: 0.4, ease: "easeOut" as const },
});

interface LoadingBpmnDiagramProps {
  nodes: {
    start: boolean;
    task1: boolean;
    gateway: boolean;
    task2: boolean;
    task3: boolean;
    mergeGateway: boolean;
    end: boolean;
  };
  path1: MotionValue<number>;
  path2: MotionValue<number>;
  path3a: MotionValue<number>;
  path3b: MotionValue<number>;
  path4a: MotionValue<number>;
  path4b: MotionValue<number>;
  path5: MotionValue<number>;
  path1Visible: MotionValue<number>;
  path2Visible: MotionValue<number>;
  path3Visible: MotionValue<number>;
  path4Visible: MotionValue<number>;
  path5Visible: MotionValue<number>;
}

export default function LoadingBpmnDiagram({
  nodes,
  path1,
  path2,
  path3a,
  path3b,
  path4a,
  path4b,
  path5,
  path1Visible,
  path2Visible,
  path3Visible,
  path4Visible,
  path5Visible,
}: Readonly<LoadingBpmnDiagramProps>) {
  const {
    start: nodeStart,
    task1: nodeTask1,
    gateway: nodeGateway,
    task2: nodeTask2,
    task3: nodeTask3,
    mergeGateway: nodeMergeGateway,
    end: nodeEnd,
  } = nodes;

  return (
    <div className="notranslate w-full max-w-4xl px-4" translate="no">
      <svg
        viewBox="0 0 800 240"
        className="h-auto w-full text-[hsl(var(--accent))]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
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

        {/* NODE 1: Start Event */}
        <circle
          cx="80"
          cy="120"
          r="18"
          stroke="hsl(var(--stroke))"
          strokeWidth="1.5"
          fill="hsl(var(--bg))"
        />
        <motion.circle
          initial={{ opacity: 0 }}
          cx="80"
          cy="120"
          r="18"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.05)"
          style={{
            filter: nodeStart
              ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
              : "none",
          }}
          animate={nodePulseAnimate(nodeStart)}
          transition={nodePulseTransition(nodeStart)}
        />

        {/* NODE 2: Task 1 */}
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
          style={{
            filter: nodeTask1
              ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
              : "none",
          }}
          animate={nodeOpacityAnimate(nodeTask1)}
          transition={nodeOpacityTransition}
        />

        {/* NODE 3: Gateway */}
        <path
          d="M 395 92 L 423 120 L 395 148 L 367 120 Z"
          stroke="hsl(var(--stroke))"
          strokeWidth="2"
          fill="hsl(var(--bg))"
        />
        <motion.path
          initial={{ opacity: 0 }}
          d="M 395 92 L 423 120 L 395 148 L 367 120 Z"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.03)"
          style={{
            filter: nodeGateway
              ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
              : "none",
          }}
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

        {/* NODE 4a: Task 2 */}
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
          style={{
            filter: nodeTask2
              ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
              : "none",
          }}
          animate={nodeOpacityAnimate(nodeTask2)}
          transition={nodeOpacityTransition}
        />

        {/* NODE 4b: Task 3 */}
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
          style={{
            filter: nodeTask3
              ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
              : "none",
          }}
          animate={nodeOpacityAnimate(nodeTask3)}
          transition={nodeOpacityTransition}
        />

        {/* NODE 4c: Merge Gateway */}
        <path
          d="M 650 92 L 678 120 L 650 148 L 622 120 Z"
          stroke="hsl(var(--stroke))"
          strokeWidth="2"
          fill="hsl(var(--bg))"
        />
        <motion.path
          initial={{ opacity: 0 }}
          d="M 650 92 L 678 120 L 650 148 L 622 120 Z"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          fill="hsl(var(--accent) / 0.03)"
          style={{
            filter: nodeMergeGateway
              ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
              : "none",
          }}
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

        {/* NODE 5: End Event */}
        <circle
          cx="710"
          cy="120"
          r="18"
          stroke="hsl(var(--stroke))"
          strokeWidth="4.5"
          fill="hsl(var(--bg))"
        />
        <motion.circle
          initial={{ opacity: 0 }}
          cx="710"
          cy="120"
          r="18"
          stroke="hsl(var(--accent))"
          strokeWidth="5"
          fill="hsl(var(--accent) / 0.05)"
          style={{
            filter: nodeEnd
              ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
              : "none",
          }}
          animate={nodePulseAnimate(nodeEnd)}
          transition={nodePulseTransition(nodeEnd)}
        />
      </svg>
    </div>
  );
}
