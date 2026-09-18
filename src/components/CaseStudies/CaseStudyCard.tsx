import { memo } from "react";
import { ArrowUpRight } from "lucide-react";
import type { CaseStudyDetail } from "../../data/caseStudies";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";
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
    <InteractiveGlass
      as="article"
      roundedClass="rounded-2xl"
      className="w-full cursor-pointer items-stretch justify-start text-left"
      onClick={() => onOpen(study)}
      tilt
    >
      {/* Content grid */}
      <div className="relative z-10 grid h-full w-full grid-cols-1 gap-6 p-6 md:grid-cols-12 md:gap-8 md:p-8">
        {/* Left column: Title, subtitle, solution narrative, tools */}
        <div className="flex flex-col justify-between gap-4 md:col-span-7 md:gap-6">
          <div className="space-y-4">
            {/* Category kicker */}
            <div className="flex items-center gap-2">
              <span className="bg-accent size-1.5 rounded-full" />
              <span className="text-accent text-sm font-bold tracking-wider uppercase">
                {study.category}
              </span>
            </div>

            {/* Title */}
            <div>
              <span className="font-display text-text-primary mb-1 line-clamp-2 block text-xl text-balance md:text-2xl">
                {study.title}
              </span>
              <p className="text-muted text-base leading-relaxed text-pretty">
                {study.subtitle}
              </p>
            </div>

            {/* Solution overview narrative */}
            <p className="text-text-primary/80 line-clamp-2 hidden text-base leading-relaxed text-pretty md:block">
              {study.solution}
            </p>
          </div>

          {/* Tools */}
          <div className="hidden flex-wrap gap-2 pt-1 md:flex md:pt-2">
            {study.tools.map((tool) => (
              <span
                key={tool}
                className="text-muted rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Right column: Results, timeline, CTA */}
        <div className="flex flex-col justify-between gap-4 md:col-span-5 md:gap-6">
          <div>
            <p className="text-muted mb-3 text-sm font-semibold tracking-wider uppercase">
              Key Results
            </p>
            <div className="space-y-3">
              {study.results.map((result) => (
                <div
                  key={result.metric}
                  className="case-study-metric-hover flex items-baseline gap-3"
                >
                  <span className="font-display text-accent case-study-metric-hover-val text-xl tracking-tight tabular-nums md:text-3xl">
                    <MetricCountUp value={result.metric} />
                  </span>
                  <span className="text-muted case-study-metric-hover-desc text-sm leading-relaxed text-pretty md:text-base">
                    {result.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-muted mb-2 text-sm font-semibold tracking-wider uppercase">
              Timeline
            </p>
            <p className="text-text-primary/85 text-base leading-relaxed text-pretty tabular-nums">
              {study.timeline}
            </p>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(study);
              }}
              aria-label={`View ${study.title} case study`}
              className="text-accent group-hover:text-accent/80 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold transition-colors duration-200 focus-visible:underline focus-visible:outline-none"
            >
              <span>View project</span>
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>
      </div>
    </InteractiveGlass>
  );
});

export default CaseStudyCard;
