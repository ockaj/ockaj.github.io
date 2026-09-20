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
      <div className="relative z-10 grid size-full grid-cols-1 gap-6 p-6 md:grid-cols-12 md:gap-8 md:p-8">
        {/* Left column: Title, subtitle, solution narrative, tools */}
        <div className="flex flex-col justify-between gap-4 md:col-span-7 md:gap-6">
          <div className="space-y-4">
            {/* Category kicker */}
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-accent" />
              <span className="text-sm font-bold tracking-wider text-accent uppercase">
                {study.category}
              </span>
            </div>

            {/* Title */}
            <div>
              <span className="mb-1 line-clamp-2 block font-display text-xl text-balance text-text-primary md:text-2xl">
                {study.title}
              </span>
              <p className="text-base leading-relaxed text-pretty text-muted">
                {study.subtitle}
              </p>
            </div>

            {/* Solution overview narrative */}
            <p className="line-clamp-2 hidden text-base leading-relaxed text-pretty text-text-primary/80 md:block">
              {study.solution}
            </p>
          </div>

          {/* Tools */}
          <div className="hidden flex-wrap gap-2 pt-1 md:flex md:pt-2">
            {study.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-muted"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Right column: Results, timeline, CTA */}
        <div className="flex flex-col justify-between gap-4 md:col-span-5 md:gap-6">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-wider text-muted uppercase">
              Key Results
            </p>
            <div className="space-y-3">
              {study.results.map((result) => (
                <div
                  key={result.metric}
                  className="case-study-metric-hover flex items-baseline gap-3"
                >
                  <span className="case-study-metric-hover-val font-display text-xl tracking-tight text-accent tabular-nums md:text-3xl">
                    <MetricCountUp value={result.metric} />
                  </span>
                  <span className="case-study-metric-hover-desc text-sm leading-relaxed text-pretty text-muted md:text-base">
                    {result.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold tracking-wider text-muted uppercase">
              Timeline
            </p>
            <p className="text-base leading-relaxed text-pretty text-text-primary/85 tabular-nums">
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
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-accent transition-colors duration-200 group-hover:text-accent/80 focus-visible:underline focus-visible:outline-none"
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
