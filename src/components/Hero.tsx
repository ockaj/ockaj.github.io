import { useEffect, useState, memo, MouseEvent } from "react";
import { FileText } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  Variants,
} from "motion/react";
import "slot-text/style.css";
import { SlotText } from "slot-text/react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import BpmnNodeBadge from "./BpmnNodeBadge";
import { useIsMobile } from "../hooks/useMediaQuery";

import { prefetchAsset } from "../utils/quicklink";
import { loadPdfViewerModal } from "../lazyComponents";
import { SPRING } from "../utils/springConfig";

const SPECIALIZATIONS = [
  "Process Analyst",
  "Digital Transformer",
  "Solution Designer",
  "Enterprise Consultant",
];
const preloadPdfModal = () => {
  prefetchAsset("/cv/Ondrej_Michal_Ockaj_CV.pdf");
  return loadPdfViewerModal.load();
};

interface HeroProps {
  onViewCv: () => void;
  onViewWork: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const nameVariants = {
  hidden: (prefersReducedMotion: boolean) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 50,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING.hero,
  },
};

const itemVariants = {
  hidden: (prefersReducedMotion: boolean) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 20,
    filter: prefersReducedMotion ? "blur(0px)" : "blur(10px)",
  }),
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: SPRING.hero,
  },
};

const scrollIndicatorVariants: Variants = {
  initial: { y: 0 },
  hover: { y: 5 },
};

const circleVariants: Variants = {
  initial: { stroke: "rgba(255, 255, 255, 0.12)", scale: 1 },
  animate: {
    stroke: [
      "rgba(255, 255, 255, 0.12)",
      "hsl(244, 75%, 76%)",
      "rgba(255, 255, 255, 0.12)",
    ],
    scale: 1,
    transition: {
      stroke: {
        duration: 1.8,
        repeat: Infinity,
        repeatDelay: 0.6,
        delay: 0,
        ease: "easeInOut" as const,
      },
    },
  },
  hover: {
    stroke: "hsl(244, 75%, 76%)",
    scale: 1.15,
    transition: SPRING.hero,
  },
};

const lineVariants: Variants = {
  initial: { stroke: "rgba(255, 255, 255, 0.12)", strokeDashoffset: 0 },
  animate: {
    stroke: [
      "rgba(255, 255, 255, 0.12)",
      "hsl(244, 75%, 76%)",
      "rgba(255, 255, 255, 0.12)",
    ],
    strokeDashoffset: 0,
    transition: {
      stroke: {
        duration: 1.8,
        repeat: Infinity,
        repeatDelay: 0.6,
        delay: 0.3,
        ease: "easeInOut" as const,
      },
    },
  },
  hover: {
    stroke: "hsl(244, 75%, 76%)",
    strokeDashoffset: [0, -6],
    transition: {
      strokeDashoffset: {
        ease: "linear" as const,
        duration: 0.5,
        repeat: Infinity,
      },
    },
  },
};

const arrowVariants: Variants = {
  initial: { stroke: "rgba(255, 255, 255, 0.12)", y: 0 },
  animate: {
    stroke: [
      "rgba(255, 255, 255, 0.12)",
      "hsl(244, 75%, 76%)",
      "rgba(255, 255, 255, 0.12)",
    ],
    y: 0,
    transition: {
      stroke: {
        duration: 1.8,
        repeat: Infinity,
        repeatDelay: 0.6,
        delay: 0.6,
        ease: "easeInOut" as const,
      },
    },
  },
  hover: {
    stroke: "hsl(244, 75%, 76%)",
    y: 1.5,
    transition: {
      stroke: SPRING.hero,
      y: SPRING.hero,
    },
  },
};

function Hero({ onViewCv, onViewWork }: Readonly<HeroProps>) {
  const [roleIndex, setRoleIndex] = useState(0);
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const scrollOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  const scrollYOffset = useTransform(scrollY, [0, 150], [0, 15]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((i) => (i + 1) % SPECIALIZATIONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden pt-24 pb-28 md:py-0">
      <motion.div
        custom={prefersReducedMotion}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center px-6 text-center md:items-start md:px-16 md:text-left lg:px-24"
      >
        {/* Eyebrow */}
        <motion.p
          variants={itemVariants}
          className="text-muted mb-8 flex items-center gap-1.5 text-xs font-semibold text-pretty uppercase"
        >
          <BpmnNodeBadge type="start-event-none" />
          Business Analyst Portfolio
        </motion.p>

        {/* Name */}
        <motion.h1
          variants={nameVariants}
          className="font-display text-text-primary mb-6 pb-2 text-[clamp(3.5rem,8vw,6.0rem)] leading-[1.1] text-balance italic"
        >
          Ondrej Michal Očkaj
        </motion.h1>

        {/* Role line */}
        <motion.p
          variants={itemVariants}
          className="text-muted mb-4 max-w-xl text-sm text-pretty md:text-base"
        >
          <span className="block sm:inline">
            Based in Slovakia, working as a{" "}
          </span>
          <span className="text-text-primary inline-block font-semibold whitespace-nowrap">
            Business Analyst
          </span>
          <span className="text-text-primary ml-1 inline-block font-semibold whitespace-nowrap">
            &amp;{" "}
            <SlotText
              text={SPECIALIZATIONS[roleIndex] + "."}
              options={{
                direction: "down",
                skipUnchanged: false,
                duration: prefersReducedMotion ? 0 : 350,
                stagger: 50,
                bounce: 0.2,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </span>
        </motion.p>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-muted mb-12 max-w-md text-sm text-pretty md:text-base"
        >
          Specializing in process analysis, BPMN modeling, and digital
          transformation solutions for enterprises.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="inline-flex flex-wrap justify-center gap-4 md:justify-start"
        >
          <span
            onMouseEnter={preloadPdfModal}
            onFocusCapture={preloadPdfModal}
            className="inline-flex"
          >
            <LiquidGlassButton
              onClick={onViewCv}
              className="px-8 py-4"
              ariaLabel="View CV"
              magnetic
              tilt
              magneticStrength={0.02}
              specularGlow
            >
              View CV
              <FileText
                size={16}
                className="transition-transform duration-200 group-hover:scale-105"
              />
            </LiquidGlassButton>
          </span>
          <LiquidGlassButton
            href="#work"
            className="px-8 py-4"
            ariaLabel="View Case Studies"
            magnetic
            tilt
            magneticStrength={0.02}
            specularGlow
            onClick={(e: MouseEvent<HTMLElement>) => {
              e.preventDefault();
              onViewWork();
            }}
          >
            View Case Studies
          </LiquidGlassButton>
        </motion.div>
      </motion.div>

      {/* Scroll indicator - Styled as a BPMN Message Flow */}
      <motion.a
        href="#work"
        aria-label="Scroll process flow"
        className="group focus-visible:ring-accent/60 absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2.5 rounded-xl select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none md:bottom-8"
        style={{ opacity: scrollOpacity, y: scrollYOffset }}
        variants={scrollIndicatorVariants}
        initial="initial"
        animate={prefersReducedMotion ? undefined : "animate"}
        whileHover={prefersReducedMotion || isMobile ? undefined : "hover"}
        transition={SPRING.hero}
        onClick={(e) => {
          e.preventDefault();
          onViewWork();
        }}
      >
        <span className="text-muted/90 group-hover:text-accent text-xs font-semibold tracking-[0.25em] uppercase transition-colors duration-300">
          Flow
        </span>
        <svg
          width="24"
          height="50"
          viewBox="0 0 24 50"
          fill="none"
          className="text-muted/70 group-hover:text-accent/60 transition-colors duration-300"
          aria-hidden="true"
        >
          {/* Top Open Circle (BPMN Message Flow Start) */}
          <motion.circle
            cx="12"
            cy="6"
            r="3"
            strokeWidth="1.5"
            fill="none"
            variants={circleVariants}
            style={{ transformOrigin: "12px 6px" }}
          />

          {/* Dashed Line */}
          <motion.line
            x1="12"
            y1="10"
            x2="12"
            y2="34"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            variants={lineVariants}
          />

          {/* Bottom Open Arrowhead (BPMN Message Flow Target) */}
          <motion.polygon
            points="8,36 12,44 16,36"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
            variants={arrowVariants}
            style={{ transformOrigin: "12px 40px" }}
          />
        </svg>
      </motion.a>
    </section>
  );
}

export default memo(Hero);
