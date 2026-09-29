import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, MessageSquare } from "lucide-react";
import type { Article } from "../../data/articles";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import BaseDrawer from "../BaseDrawer";
import {
  drawerContentVariants,
  drawerItemVariants,
} from "../../utils/motionVariants";
import { CONTACT_EMAIL } from "../../constants/contact";
import { mdxComponents } from "../../utils/mdxComponents";

interface DrawerProps {
  open: boolean;
  article: Article | null;
  onClose: () => void;
  onExitComplete?: () => void;
}

const JournalDrawer = memo(function JournalDrawer({
  open,
  article,
  onClose,
  onExitComplete,
}: DrawerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!article) return null;

  return (
    <BaseDrawer
      open={open}
      title="Journal Entry"
      icon={<BookOpen size={14} className="text-accent" />}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      hashId={`article-${article.id}`}
      onExitComplete={onExitComplete}
    >
      <motion.div
        variants={drawerContentVariants}
        initial="hidden"
        animate="visible"
        custom={prefersReducedMotion}
        className="flex-1 touch-pan-y overscroll-contain space-y-8 overflow-y-auto p-6 pb-safe-6 select-text md:p-8 md:pb-8"
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
          className="markdown-prose text-base leading-relaxed text-text-primary/90"
        >
          <article.Content components={mdxComponents} />
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
