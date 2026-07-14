import { useState, memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowUpRight, Clock, MessageSquare, BookOpen } from "lucide-react";
import { ARTICLES, type Article } from "../data/articles";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import BaseDrawer from "./BaseDrawer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CONTACT_EMAIL } from "../utils/contact";

const isBuildMode =
  typeof window !== "undefined" &&
  (window as unknown as { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: (prefersReducedMotion: boolean) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 30,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function Journal() {
  const prefersReducedMotion = useReducedMotion();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const handleCloseArticle = useCallback(() => {
    setSelectedArticle(null);
  }, []);

  return (
    <>
      <div className="px-6 md:px-10 lg:px-16">
        <motion.div
          custom={prefersReducedMotion}
          className="flex flex-col gap-8 md:gap-10"
          variants={containerVariants}
          initial={isBuildMode ? "visible" : "hidden"}
          whileInView={isBuildMode ? undefined : "visible"}
          viewport={isBuildMode ? undefined : { once: true, margin: "-60px" }}
        >
          {ARTICLES.map((article) => (
            <motion.div
              key={article.id}
              variants={cardVariants}
              custom={prefersReducedMotion}
            >
              <JournalEntry article={article} onOpen={setSelectedArticle} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedArticle ? (
          <JournalDrawer
            article={selectedArticle}
            onClose={handleCloseArticle}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

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
      springScale={false}
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

interface DrawerProps {
  article: Article;
  onClose: () => void;
}

const JournalDrawer = memo(function JournalDrawer({
  article,
  onClose,
}: DrawerProps) {
  return (
    <BaseDrawer
      title="Journal"
      icon={<BookOpen size={14} className="text-accent" />}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 select-text touch-pan-y">
        <div className="space-y-3 pb-4 border-b border-white/5">
          <span className="inline-block text-[10px] text-accent uppercase font-bold bg-accent/20 border border-accent/30 rounded-xl px-2.5 py-0.5">
            {article.subtitle}
          </span>
          <h2 className="text-2xl md:text-3xl font-display text-text-primary leading-tight text-balance">
            {article.title}
          </h2>
          <div className="flex gap-4 items-center text-xs text-muted tabular-nums">
            <span>{article.date}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {article.readTime}
            </span>
          </div>
        </div>

        <div className="text-text-primary/90 text-sm md:text-base leading-relaxed max-w-[70ch]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h3: ({ children }) => (
                <h3 className="text-lg font-body text-text-primary font-bold mt-8 mb-4 text-balance flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-text-primary/80 font-normal mb-4 text-pretty leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="space-y-2 my-4 pl-5 list-disc text-muted">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="text-xs md:text-sm text-pretty leading-relaxed">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-text-primary">
                  {children}
                </strong>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
                  {children}
                </code>
              ),
              table: ({ children }) => (
                <div className="my-6 rounded-xl border border-white/10 bg-white/5 overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[720px] md:min-w-0 text-left border-collapse text-[10px] sm:text-[11px] md:text-xs table-auto">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b border-white/10 bg-white/5 font-display text-text-primary">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="px-2 py-2.5 font-semibold uppercase tracking-wider text-[9px] sm:text-[10px] text-accent/90">
                  {children}
                </th>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-white/5 text-text-primary/75">
                  {children}
                </tbody>
              ),
              td: ({ children }) => (
                <td className="p-2 leading-relaxed align-top break-words">
                  {children}
                </td>
              ),
            }}
          >
            {article.body}
          </ReactMarkdown>
        </div>

        <div className="pt-6 border-t border-white/5 flex justify-between items-center gap-4">
          <LiquidGlassButton
            href={`mailto:${CONTACT_EMAIL}?subject=Regarding Article: ${encodeURIComponent(article.title)}`}
            className="px-5 py-2.5 text-xs"
            magnetic
            tilt
            magneticStrength={0.02}
          >
            Discuss this thought piece
            <MessageSquare size={13} />
          </LiquidGlassButton>
        </div>
      </div>
    </BaseDrawer>
  );
});

export default memo(Journal);
