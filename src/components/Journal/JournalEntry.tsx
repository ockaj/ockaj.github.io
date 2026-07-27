import { memo, useMemo } from "react";
import { Clock, ArrowUpRight } from "lucide-react";
import type { Article } from "../../data/articles";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";

interface EntryProps {
  article: Article;
  onOpen: (article: Article) => void;
}

const JournalEntry = memo(function JournalEntry({
  article,
  onOpen,
}: EntryProps) {
  const excerpt = useMemo(() => {
    const words = article.body.split(/\s+/);
    return words.slice(0, 40).join(" ") + "...";
  }, [article.body]);

  return (
    <LiquidGlass
      as="article"
      onClick={() => onOpen(article)}
      roundedClass="rounded-[28px]"
      className="w-full"
      tilt
    >
      <div className="p-5 md:p-6 space-y-4">
        {/* Thumbnail + title */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 size-11 rounded-full overflow-hidden border border-white/10 group-hover:border-accent/30 transition-colors duration-300">
            <img
              src={article.image}
              alt=""
              width={44}
              height={44}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xl md:text-2xl font-display text-text-primary leading-tight text-balance">
              {article.title}
            </span>
          </div>
        </div>

        <p className="text-sm md:text-base text-text-primary/80 group-hover:text-text-primary leading-relaxed text-pretty line-clamp-3 transition-colors duration-200">
          {excerpt}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-xs text-muted group-hover:text-text-primary/70 tabular-nums transition-colors duration-200">
            <span className="flex items-center gap-1.5">
              <Clock size={11} />
              {article.readTime}
            </span>
            <span>{article.date}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:text-accent/80 transition-colors duration-200">
            <span>Read</span>
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </LiquidGlass>
  );
});

export default JournalEntry;
