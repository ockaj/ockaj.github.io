import { memo } from "react";
import { AlertCircle, CheckCircle, ArrowUpRight } from "lucide-react";
import type { CaseStudyDetail } from "../../data/caseStudies";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";

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
      className="w-full text-left justify-start items-stretch cursor-pointer"
      onClick={() => onOpen(study)}
      tilt
    >
      {/* Content grid */}
      <div className="relative z-10 grid md:grid-cols-12 gap-4 md:gap-8 p-6 md:p-8 w-full h-full">
        {/* Left column: Title, challenge, solution */}
        <div className="md:col-span-7 flex flex-col gap-4 md:gap-6">
          {/* Category badge */}
          <div>
            <span className="inline-block text-[10px] text-accent uppercase font-bold bg-accent/20 border border-accent/30 rounded-xl px-2.5 py-0.5">
              {study.category}
            </span>
          </div>

          {/* Title */}
          <div>
            <span className="block text-2xl md:text-3xl font-display text-text-primary mb-1 text-balance line-clamp-2">
              {study.title}
            </span>
            <p className="text-sm text-muted text-pretty">{study.subtitle}</p>
          </div>

          {/* Challenge */}
          <div className="hidden md:block">
            <div className="flex items-start gap-3 mb-2">
              <AlertCircle
                size={16}
                className="text-muted flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs text-muted uppercase font-semibold mb-1">
                  Challenge
                </p>
                <p className="text-sm text-text-primary/80 text-pretty">
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
                className="text-accent flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs text-muted uppercase font-semibold mb-1">
                  Solution
                </p>
                <p className="text-sm text-text-primary/80 text-pretty">
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
                className="text-xs bg-white/5 text-muted rounded-full px-3 py-1 border border-white/10"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Right column: Results, timeline, CTA */}
        <div className="md:col-span-5 flex flex-col justify-between gap-4 md:gap-6">
          <div>
            <p className="text-xs text-muted uppercase font-semibold mb-3">
              Key Results
            </p>
            <div className="space-y-2 md:space-y-3">
              {study.results.map((result) => (
                <div
                  key={result.metric}
                  className="flex items-baseline gap-3 case-study-metric-hover"
                >
                  <span className="text-base md:text-lg font-body font-semibold tracking-tight text-accent tabular-nums case-study-metric-hover-val">
                    {result.metric}
                  </span>
                  <span className="text-xs md:text-sm text-muted text-pretty case-study-metric-hover-desc">
                    {result.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted uppercase font-semibold mb-2">
              Timeline
            </p>
            <p className="text-sm text-text-primary/80 tabular-nums text-pretty">
              {study.timeline}
            </p>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:text-accent/80 transition-colors duration-200">
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
