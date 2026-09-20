import { memo } from "react";
import { Clock, ArrowUpRight } from "lucide-react";
import type { Article } from "../../data/articles";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";

interface EntryProps {
  article: Article;
  onOpen: (article: Article) => void;
}

const JournalEntry = memo(function JournalEntry({
  article,
  onOpen,
}: EntryProps) {
  return (
    <InteractiveGlass
      as="article"
      onClick={() => onOpen(article)}
      roundedClass="rounded-[28px]"
      className="w-full"
      tilt
    >
      <div className="space-y-4 p-5 md:p-6">
        {/* Thumbnail + title */}
        <div className="flex items-center gap-4">
          <div className="size-11 shrink-0 overflow-hidden rounded-full border border-white/10 transition-colors duration-300 group-hover:border-accent/30">
            <img
              src={article.image}
              alt=""
              width={44}
              height={44}
              className="size-full object-cover outline-1 -outline-offset-1 outline-white/8"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-display text-xl leading-tight text-balance text-text-primary md:text-2xl">
              {article.title}
            </span>
          </div>
        </div>

        <p className="line-clamp-3 text-base leading-relaxed text-pretty text-text-primary/80 transition-colors duration-200 group-hover:text-text-primary">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-sm text-muted tabular-nums transition-colors duration-200 group-hover:text-text-primary/70">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {article.readTime}
            </span>
            <span>{article.date}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(article);
            }}
            aria-label={`Read article: ${article.title}`}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-accent transition-colors duration-200 group-hover:text-accent/80 focus-visible:underline focus-visible:outline-none"
          >
            <span>Read</span>
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </div>
    </InteractiveGlass>
  );
});

export default JournalEntry;
