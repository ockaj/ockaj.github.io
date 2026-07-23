import { memo } from "react";
import { BookOpen, Clock, MessageSquare } from "lucide-react";
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
      hashId={`journal-${article.id}`}
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
              ...COMMON_MARKDOWN_COMPONENTS,
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

export default JournalDrawer;
