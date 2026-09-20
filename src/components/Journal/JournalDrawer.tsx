import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, MessageSquare } from "lucide-react";
import type { Article } from "../../data/articles";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import BaseDrawer from "../BaseDrawer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { COMMON_MARKDOWN_COMPONENTS } from "../../utils/markdownRenderers";
import {
  drawerContentVariants,
  drawerItemVariants,
} from "../../utils/motionVariants";
import { CONTACT_EMAIL } from "../../data/cvData";

interface DrawerProps {
  article: Article;
  onClose: () => void;
}

const REMARK_PLUGINS = [remarkGfm];

const JOURNAL_MARKDOWN_COMPONENTS = {
  ...COMMON_MARKDOWN_COMPONENTS,
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-8 mb-4 flex items-center gap-2 font-body text-lg font-bold text-balance text-text-primary">
      <span className="size-1.5 shrink-0 rounded-full bg-accent" />
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 leading-relaxed font-normal text-pretty text-text-primary/80">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-4 list-disc space-y-2 pl-5 text-muted">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm leading-relaxed text-pretty md:text-base">
      {children}
    </li>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-6 scrollbar-thin overflow-x-auto rounded-xl border border-white/10 bg-white/5">
      <table className="w-full min-w-180 table-auto border-collapse text-left text-sm md:min-w-0">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="border-b border-white/10 bg-white/5 font-body text-text-primary">
      {children}
    </thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2.5 text-sm font-semibold tracking-wider text-accent/90 uppercase">
      {children}
    </th>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-white/5 text-text-primary/75">
      {children}
    </tbody>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="p-2 align-top leading-relaxed wrap-break-word">
      {children}
    </td>
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
      hashId={`article-${article.id}`}
    >
      <motion.div
        variants={drawerContentVariants}
        initial="hidden"
        animate="visible"
        custom={prefersReducedMotion}
        className="flex-1 touch-pan-y overscroll-contain space-y-8 overflow-y-auto p-6 select-text md:p-8"
      >
        <motion.div
          variants={drawerItemVariants}
          custom={prefersReducedMotion}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 font-mono text-sm text-muted">
            <span>{article.date}</span>
            <span>•</span>
            <span className="text-accent">{article.subtitle}</span>
          </div>

          <h2 className="font-display text-2xl text-balance text-text-primary md:text-3xl">
            {article.title}
          </h2>

          <div className="flex items-center gap-2 border-t border-white/5 pt-1 text-sm text-muted">
            <span>By Ondrej Michal Očkaj</span>
            <span>•</span>
            <span className="font-mono text-accent/80">{article.readTime}</span>
          </div>
        </motion.div>

        <motion.div
          variants={drawerItemVariants}
          custom={prefersReducedMotion}
          className="max-w-prose text-base leading-relaxed text-text-primary/90"
        >
          <ReactMarkdown
            remarkPlugins={REMARK_PLUGINS}
            components={JOURNAL_MARKDOWN_COMPONENTS}
          >
            {article.body}
          </ReactMarkdown>
        </motion.div>

        <motion.div
          variants={drawerItemVariants}
          custom={prefersReducedMotion}
          className="flex items-center justify-between gap-4 border-t border-white/5 pt-6"
        >
          <LiquidGlassButton
            href={`mailto:${CONTACT_EMAIL}?subject=Regarding Article: ${encodeURIComponent(article.title)}`}
            className="px-6 py-3.5 text-sm"
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
