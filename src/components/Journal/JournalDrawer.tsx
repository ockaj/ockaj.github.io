import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, MessageSquare } from "lucide-react";
import type { Article } from "../../data/articles";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import BaseDrawer from "../BaseDrawer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { COMMON_MARKDOWN_COMPONENTS } from "../../utils/markdownRenderers";
import { CONTACT_EMAIL } from "../../utils/contact";

interface DrawerProps {
  article: Article;
  onClose: () => void;
}

const drawerContentVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const drawerItemVariants = {
  hidden: (prefersReducedMotion: boolean) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 10,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, duration: 0.22, bounce: 0 },
  },
};

const JOURNAL_MARKDOWN_COMPONENTS = {
  ...COMMON_MARKDOWN_COMPONENTS,
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-body text-text-primary font-bold mt-8 mb-4 text-balance flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-text-primary/80 font-normal mb-4 text-pretty leading-relaxed">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-2 my-4 pl-5 list-disc text-muted">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-xs md:text-sm text-pretty leading-relaxed">
      {children}
    </li>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-6 rounded-xl border border-white/10 bg-white/5 overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[720px] md:min-w-0 text-left border-collapse text-[10px] sm:text-[11px] md:text-xs table-auto">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="border-b border-white/10 bg-white/5 font-display text-text-primary">
      {children}
    </thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-2 py-2.5 font-semibold uppercase tracking-wider text-[9px] sm:text-[10px] text-accent/90">
      {children}
    </th>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-white/5 text-text-primary/75">
      {children}
    </tbody>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="p-2 leading-relaxed align-top break-words">{children}</td>
  ),
};

const JournalDrawer = memo(function JournalDrawer({
  article,
  onClose,
}: DrawerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <BaseDrawer
      title="Journal Entry"
      icon={<BookOpen size={14} className="text-accent" />}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
    >
      <motion.div
        variants={drawerContentVariants}
        initial="hidden"
        animate="visible"
        custom={prefersReducedMotion}
        className="space-y-8 p-6 md:p-8 select-text touch-pan-y"
      >
        <motion.div
          variants={drawerItemVariants}
          custom={prefersReducedMotion}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <span>{article.date}</span>
            <span>•</span>
            <span className="text-accent">{article.subtitle}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold font-heading text-text-primary text-balance">
            {article.title}
          </h2>

          <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-xs text-muted">
            <span>By Ondrej Michal Očkaj</span>
            <span>•</span>
            <span className="font-mono text-accent/80">{article.readTime}</span>
          </div>
        </motion.div>

        <motion.div
          variants={drawerItemVariants}
          custom={prefersReducedMotion}
          className="text-text-primary/90 text-sm md:text-base leading-relaxed max-w-[70ch]"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={JOURNAL_MARKDOWN_COMPONENTS}
          >
            {article.body}
          </ReactMarkdown>
        </motion.div>

        <motion.div
          variants={drawerItemVariants}
          custom={prefersReducedMotion}
          className="pt-6 border-t border-white/5 flex justify-between items-center gap-4"
        >
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
        </motion.div>
      </motion.div>
    </BaseDrawer>
  );
});

export default JournalDrawer;
