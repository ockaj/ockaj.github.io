import { memo } from "react";
import { AlertCircle, CheckCircle, ArrowUpRight } from "lucide-react";
import type { CaseStudyDetail } from "../../data/caseStudies";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";
import MetricCountUp from "./MetricCountUp";

interface CardProps {
  study: CaseStudyDetail;
  onOpen: (study: CaseStudyDetail) => void;
}

const CaseStudyCard = memo(function CaseStudyCard({
  study,
  onOpen,
}: CardProps) {
  return (
    <LiquidGlass
      as="article"
      roundedClass="rounded-2xl"
      className="w-full cursor-pointer items-stretch justify-start text-left"
      onClick={() => onOpen(study)}
      tilt
    >
      {/* Content grid */}
      <div className="relative z-10 grid h-full w-full gap-4 p-6 md:grid-cols-12 md:gap-8 md:p-8">
        {/* Left column: Title, challenge, solution */}
        <div className="flex flex-col gap-4 md:col-span-7 md:gap-6">
          {/* Category kicker */}
          <div className="flex items-center gap-2">
            <span className="bg-accent size-1.5 rounded-full" />
            <span className="text-accent text-xs font-bold tracking-widest uppercase">
              {study.category}
            </span>
          </div>

          {/* Title */}
          <div>
            <span className="font-display text-text-primary mb-1 line-clamp-2 block text-2xl text-balance md:text-3xl">
              {study.title}
            </span>
            <p className="text-muted text-sm text-pretty">{study.subtitle}</p>
          </div>

          {/* Challenge */}
          <div className="hidden md:block">
            <div className="mb-2 flex items-start gap-3">
              <AlertCircle
                size={16}
                className="text-muted mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-muted mb-1 text-xs font-semibold uppercase">
                  Challenge
                </p>
                <p className="text-text-primary/80 text-sm text-pretty">
                  {study.challenge}
                </p>
              </div>
            </div>
          </div>

          {/* Solution */}
          <div className="hidden md:block">
            <div className="flex items-start gap-3">
              <CheckCircle
                size={16}
                className="text-accent mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-muted mb-1 text-xs font-semibold uppercase">
                  Solution
                </p>
                <p className="text-text-primary/80 text-sm text-pretty">
                  {study.solution}
                </p>
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="flex flex-wrap gap-2 pt-1 md:pt-2">
            {study.tools.map((tool) => (
              <span
                key={tool}
                className="text-muted rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Right column: Results, timeline, CTA */}
        <div className="flex flex-col justify-between gap-4 md:col-span-5 md:gap-6">
          <div>
            <p className="text-muted mb-3 text-xs font-semibold uppercase">
              Key Results
            </p>
            <div className="space-y-3">
              {study.results.map((result) => (
                <div
                  key={result.metric}
                  className="case-study-metric-hover flex items-baseline gap-3"
                >
                  <span className="font-display text-accent case-study-metric-hover-val text-xl tracking-tight tabular-nums md:text-2xl">
                    <MetricCountUp value={result.metric} />
                  </span>
                  <span className="text-muted case-study-metric-hover-desc text-xs text-pretty md:text-sm">
                    {result.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-muted mb-2 text-xs font-semibold uppercase">
              Timeline
            </p>
            <p className="text-text-primary/80 text-sm text-pretty tabular-nums">
              {study.timeline}
            </p>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <span className="text-accent group-hover:text-accent/80 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200">
              <span>View project</span>
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </div>
        </div>
      </div>
    </LiquidGlass>
  );
});

export default CaseStudyCard;
