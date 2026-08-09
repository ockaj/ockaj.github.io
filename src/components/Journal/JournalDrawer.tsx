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
import { CONTACT_EMAIL } from "../../utils/contact";

interface DrawerProps {
  article: Article;
  onClose: () => void;
}

const JOURNAL_MARKDOWN_COMPONENTS = {
  ...COMMON_MARKDOWN_COMPONENTS,
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-body text-text-primary mt-8 mb-4 flex items-center gap-2 text-lg font-bold text-balance">
      <span className="bg-accent h-1.5 w-1.5 flex-shrink-0 rounded-full" />
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-text-primary/80 mb-4 leading-relaxed font-normal text-pretty">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="text-muted my-4 list-disc space-y-2 pl-5">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-xs leading-relaxed text-pretty md:text-sm">
      {children}
    </li>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-6 scrollbar-thin overflow-x-auto rounded-xl border border-white/10 bg-white/5">
      <table className="w-full min-w-[720px] table-auto border-collapse text-left text-xs md:min-w-0">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="font-display text-text-primary border-b border-white/10 bg-white/5">
      {children}
    </thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="text-accent/90 px-2 py-2.5 text-xs font-semibold tracking-wider uppercase">
      {children}
    </th>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="text-text-primary/75 divide-y divide-white/5">
      {children}
    </tbody>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="p-2 align-top leading-relaxed break-words">{children}</td>
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
        className="flex-1 touch-pan-y space-y-8 overflow-y-auto p-6 select-text md:p-8"
      >
        <motion.div
          variants={drawerItemVariants}
          custom={prefersReducedMotion}
          className="space-y-3"
        >
          <div className="text-muted flex items-center gap-2 font-mono text-xs">
            <span>{article.date}</span>
            <span>•</span>
            <span className="text-accent">{article.subtitle}</span>
          </div>

          <h2 className="font-heading text-text-primary text-xl font-bold text-balance md:text-2xl">
            {article.title}
          </h2>

          <div className="text-muted flex items-center gap-2 border-t border-white/5 pt-1 text-xs">
            <span>By Ondrej Michal Očkaj</span>
            <span>•</span>
            <span className="text-accent/80 font-mono">{article.readTime}</span>
          </div>
        </motion.div>

        <motion.div
          variants={drawerItemVariants}
          custom={prefersReducedMotion}
          className="text-text-primary/90 max-w-[70ch] text-sm leading-relaxed md:text-base"
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
          className="flex items-center justify-between gap-4 border-t border-white/5 pt-6"
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
