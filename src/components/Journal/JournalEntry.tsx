import { memo, useMemo } from "react";
import { Clock, ArrowUpRight } from "lucide-react";
import type { Article } from "../../data/articles";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";

interface EntryProps {
  article: Article;
  onOpen: (article: Article) => void;
}

const WORDS_REGEX = /\s+/;

const JournalEntry = memo(function JournalEntry({
  article,
  onOpen,
}: EntryProps) {
  const excerpt = useMemo(() => {
    const words = article.body.split(WORDS_REGEX);
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
      <div className="space-y-4 p-5 md:p-6">
        {/* Thumbnail + title */}
        <div className="flex items-center gap-4">
          <div className="group-hover:border-accent/30 size-11 flex-shrink-0 overflow-hidden rounded-full border border-white/10 transition-colors duration-300">
            <img
              src={article.image}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-display text-text-primary block text-xl leading-tight text-balance md:text-2xl">
              {article.title}
            </span>
          </div>
        </div>

        <p className="text-text-primary/80 group-hover:text-text-primary line-clamp-3 text-sm leading-relaxed text-pretty transition-colors duration-200 md:text-base">
          {excerpt}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="text-muted group-hover:text-text-primary/70 flex items-center gap-4 text-xs tabular-nums transition-colors duration-200">
            <span className="flex items-center gap-1.5">
              <Clock size={11} />
              {article.readTime}
            </span>
            <span>{article.date}</span>
          </div>
          <span className="text-accent group-hover:text-accent/80 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200">
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
