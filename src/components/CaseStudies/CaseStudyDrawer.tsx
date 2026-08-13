import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Activity, FileText } from "lucide-react";
import type { CaseStudyDetail } from "../../data/caseStudies";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import BaseDrawer from "../BaseDrawer";
import ReactMarkdown from "react-markdown";
import { COMMON_MARKDOWN_COMPONENTS } from "../../utils/markdownRenderers";
import {
  drawerContentVariants,
  drawerItemVariants,
} from "../../utils/motionVariants";
import { CONTACT_EMAIL } from "../../utils/contact";
import MetricCountUp from "./MetricCountUp";

interface DrawerProps {
  study: CaseStudyDetail;
  onClose: () => void;
}

const CLIENT_MARKDOWN_COMPONENTS = {
  ...COMMON_MARKDOWN_COMPONENTS,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-text-primary/95 text-sm leading-relaxed font-normal text-pretty">
      {children}
    </p>
  ),
};

const DESCRIPTION_MARKDOWN_COMPONENTS = {
  ...COMMON_MARKDOWN_COMPONENTS,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-muted text-sm leading-relaxed text-pretty">{children}</p>
  ),
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
        className="flex-1 touch-pan-y space-y-8 overflow-y-auto p-6 select-text md:p-8"
      >
        {/* Header */}
        <motion.div variants={drawerItemVariants}>
          <div className="mb-2 flex items-center gap-2">
            <span className="bg-accent size-1.5 rounded-full" />
            <span className="text-accent text-xs font-bold tracking-widest uppercase">
              {study.category}
            </span>
          </div>
          <h3 className="font-display text-text-primary text-2xl text-balance md:text-3xl">
            {study.title}
          </h3>
          <p className="text-muted mt-0.5 text-xs text-pretty">
            {study.subtitle}
          </p>
        </motion.div>

        {/* Core Info */}
        <motion.div variants={drawerItemVariants} className="space-y-4">
          <h3 className="text-muted border-b border-white/5 pb-1 text-xs text-balance uppercase">
            Client Profile
          </h3>
          <ReactMarkdown components={CLIENT_MARKDOWN_COMPONENTS}>
            {study.client}
          </ReactMarkdown>
          <ReactMarkdown components={DESCRIPTION_MARKDOWN_COMPONENTS}>
            {study.longDescription}
          </ReactMarkdown>
        </motion.div>

        {/* Results Grid */}
        <motion.div variants={drawerItemVariants} className="space-y-4">
          <h3 className="text-muted border-b border-white/5 pb-1 text-xs text-balance uppercase">
            Proven Operations Impact
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {study.results.map((res) => (
              <div
                key={res.metric}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
              >
                <p className="font-body text-accent text-lg font-semibold tracking-tight tabular-nums md:text-xl">
                  <MetricCountUp value={res.metric} />
                </p>
                <p className="text-muted mt-1 text-xs text-pretty uppercase">
                  {res.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AS-IS vs TO-BE comparison */}
        <motion.div variants={drawerItemVariants} className="space-y-4">
          <h3 className="text-muted border-b border-white/5 pb-1 text-xs text-balance uppercase">
            Process Modeling & Auditing
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {/* AS-IS */}
            <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-red-400 uppercase">
                <div className="size-1.5 rounded-full bg-red-400" />
                <span>Legacy Source Materials</span>
              </div>
              <ul className="space-y-3">
                {study.asIsFlow.map((step) => (
                  <li key={step} className="text-muted flex gap-2 text-xs">
                    <span className="flex-shrink-0 text-red-400/80">✕</span>
                    <span className="leading-relaxed text-pretty">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* TO-BE */}
            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                <div className="size-1.5 rounded-full bg-emerald-400" />
                <span>BPMN Process Modeling</span>
              </div>
              <ul className="space-y-3">
                {study.toBeFlow.map((step) => (
                  <li
                    key={step}
                    className="text-text-primary/95 flex gap-2 text-xs"
                  >
                    <span className="flex-shrink-0 text-emerald-400">✓</span>
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
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="space-y-3">
            <h4 className="text-muted border-b border-white/5 pb-1 text-xs text-balance uppercase">
              Methodology
            </h4>
            <ul className="space-y-2">
              {study.methodology.map((meth) => (
                <li
                  key={meth}
                  className="text-muted flex items-center gap-2 text-xs"
                >
                  <span className="bg-accent/60 size-1 rounded-full" />
                  <span className="text-pretty">{meth}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-muted border-b border-white/5 pb-1 text-xs text-balance uppercase">
              Key Deliverables
            </h4>
            <ul className="space-y-2">
              {study.deliverables.map((del) => (
                <li
                  key={del}
                  className="text-text-primary/80 flex items-center gap-2 text-xs"
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
          className="flex items-center justify-between gap-4 border-t border-white/5 pt-6"
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
