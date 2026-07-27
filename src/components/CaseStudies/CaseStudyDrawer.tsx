import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Activity, FileText } from "lucide-react";
import type { CaseStudyDetail } from "../../data/caseStudies";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import BaseDrawer from "../BaseDrawer";
import ReactMarkdown from "react-markdown";
import { COMMON_MARKDOWN_COMPONENTS } from "../../utils/markdownRenderers";
import { CONTACT_EMAIL } from "../../utils/contact";
import MetricCountUp from "./MetricCountUp";

interface DrawerProps {
  study: CaseStudyDetail;
  onClose: () => void;
}

const drawerContentVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const drawerItemVariants = {
  hidden: (prefersReducedMotion: boolean) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 10,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, duration: 0.22, bounce: 0 },
  },
};

const CaseStudyDrawer = memo(function CaseStudyDrawer({
  study,
  onClose,
}: DrawerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <BaseDrawer
      title="Process Audit Case File"
      icon={<Activity size={14} className="text-accent" />}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      hashId={`case-study-${study.id}`}
    >
      {/* Scrollable Content Container */}
      <motion.div
        custom={prefersReducedMotion}
        variants={drawerContentVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 select-text touch-pan-y"
      >
        {/* Header */}
        <motion.div variants={drawerItemVariants}>
          <span className="text-[10px] text-accent uppercase font-bold bg-accent/20 border border-accent/30 rounded-xl px-2.5 py-0.5">
            {study.category}
          </span>
          <h3 className="text-2xl md:text-3xl font-display text-text-primary mt-2 text-balance">
            {study.title}
          </h3>
          <p className="text-xs text-muted mt-0.5 text-pretty">
            {study.subtitle}
          </p>
        </motion.div>

        {/* Core Info */}
        <motion.div variants={drawerItemVariants} className="space-y-4">
          <h3 className="text-xs text-muted uppercase border-b border-white/5 pb-1 text-balance">
            Client Profile
          </h3>
          <ReactMarkdown
            components={{
              ...COMMON_MARKDOWN_COMPONENTS,
              p: ({ children }) => (
                <p className="text-sm text-text-primary/95 font-normal leading-relaxed text-pretty">
                  {children}
                </p>
              ),
            }}
          >
            {study.client}
          </ReactMarkdown>
          <ReactMarkdown
            components={{
              ...COMMON_MARKDOWN_COMPONENTS,
              p: ({ children }) => (
                <p className="text-sm text-muted leading-relaxed text-pretty">
                  {children}
                </p>
              ),
            }}
          >
            {study.longDescription}
          </ReactMarkdown>
        </motion.div>

        {/* Results Grid */}
        <motion.div variants={drawerItemVariants} className="space-y-4">
          <h3 className="text-xs text-muted uppercase border-b border-white/5 pb-1 text-balance">
            Proven Operations Impact
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {study.results.map((res) => (
              <div
                key={res.metric}
                className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center"
              >
                <p className="text-lg md:text-xl font-body font-semibold tracking-tight text-accent tabular-nums">
                  <MetricCountUp value={res.metric} />
                </p>
                <p className="text-[10px] text-muted uppercase mt-1 text-pretty">
                  {res.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AS-IS vs TO-BE comparison */}
        <motion.div variants={drawerItemVariants} className="space-y-4">
          <h3 className="text-xs text-muted uppercase border-b border-white/5 pb-1 text-balance">
            Process Modeling & Auditing
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* AS-IS */}
            <div className="bg-red-500/[0.02] border border-red-500/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase mb-3">
                <div className="size-1.5 rounded-full bg-red-400" />
                <span>Legacy Source Materials</span>
              </div>
              <ul className="space-y-3">
                {study.asIsFlow.map((step) => (
                  <li key={step} className="text-xs text-muted flex gap-2">
                    <span className="text-red-400/80 flex-shrink-0">✕</span>
                    <span className="leading-relaxed text-pretty">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* TO-BE */}
            <div className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase mb-3">
                <div className="size-1.5 rounded-full bg-emerald-400" />
                <span>BPMN Process Modeling</span>
              </div>
              <ul className="space-y-3">
                {study.toBeFlow.map((step) => (
                  <li
                    key={step}
                    className="text-xs text-text-primary/95 flex gap-2"
                  >
                    <span className="text-emerald-400 flex-shrink-0">✓</span>
                    <span className="leading-relaxed text-pretty">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Methodology & Timeline */}
        <motion.div
          variants={drawerItemVariants}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="space-y-3">
            <h4 className="text-xs text-muted uppercase border-b border-white/5 pb-1 text-balance">
              Methodology
            </h4>
            <ul className="space-y-2">
              {study.methodology.map((meth) => (
                <li
                  key={meth}
                  className="text-xs text-muted flex items-center gap-2"
                >
                  <span className="size-1 rounded-full bg-accent/60" />
                  <span className="text-pretty">{meth}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs text-muted uppercase border-b border-white/5 pb-1 text-balance">
              Key Deliverables
            </h4>
            <ul className="space-y-2">
              {study.deliverables.map((del) => (
                <li
                  key={del}
                  className="text-xs text-text-primary/80 flex items-center gap-2"
                >
                  <FileText size={11} className="text-accent flex-shrink-0" />
                  <span className="text-pretty">{del}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* CTA / Close */}
        <motion.div
          variants={drawerItemVariants}
          className="pt-6 border-t border-white/5 flex justify-between items-center gap-4"
        >
          <LiquidGlassButton
            href={`mailto:${CONTACT_EMAIL}`}
            className="px-5 py-3.5 text-xs"
            magnetic
            tilt
            magneticStrength={0.02}
          >
            Request project details ↗
          </LiquidGlassButton>
        </motion.div>
      </motion.div>
    </BaseDrawer>
  );
});

export default CaseStudyDrawer;
