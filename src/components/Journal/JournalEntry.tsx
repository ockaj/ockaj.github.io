import { memo, useState } from "react";
import { Clock, ArrowUpRight, FileText } from "lucide-react";
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
  const [imgError, setImgError] = useState(false);

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
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition-colors duration-300 group-hover:border-accent/30">
            {imgError || !article.image ? (
              <FileText size={18} className="text-accent/80" />
            ) : (
              <img
                src={article.image}
                onError={() => setImgError(true)}
                alt=""
                width={44}
                height={44}
                className="size-full object-cover outline-1 -outline-offset-1 outline-white/8"
                loading="lazy"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-display text-xl leading-tight text-balance wrap-anywhere text-text-primary md:text-2xl">
              {article.title}
            </span>
          </div>
        </div>

        <p className="line-clamp-3 text-base leading-relaxed text-pretty wrap-anywhere text-text-primary/80 transition-colors duration-200 group-hover:text-text-primary">
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
