import { memo, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ARTICLES, type Article } from "../../data/articles";
import { useAppStore } from "../../store/useAppStore";
import JournalEntry from "./JournalEntry";
import JournalDrawer from "./JournalDrawer";

import { isBoneyardBuild } from "../../utils/boneyard";
import {
  containerStaggerVariants,
  cardStaggerVariants,
  SECTION_VIEWPORT,
} from "../../utils/motionVariants";

const isBuildMode = isBoneyardBuild();
const containerVariants = containerStaggerVariants();
const cardVariants = cardStaggerVariants;

function Journal() {
  const prefersReducedMotion = useReducedMotion();
  const activeArticleId = useAppStore((state) =>
    state.activeModal?.startsWith("article-")
      ? state.activeModal.slice("article-".length)
      : null,
  );

  const selectedArticle = useMemo(() => {
    if (!activeArticleId) return null;
    return ARTICLES.find((article) => article.id === activeArticleId) ?? null;
  }, [activeArticleId]);

  // Dismiss non-existent journal article deep links (e.g. #article-invalid)
  useEffect(() => {
    if (activeArticleId && !selectedArticle) {
      useAppStore.getState().closeModal();
      window.history.replaceState(window.history.state, "", "#journal");
    }
  }, [activeArticleId, selectedArticle]);

  const handleOpenArticle = useCallback((article: Article) => {
    useAppStore.getState().openModal(`article-${article.id}`);
  }, []);

  const handleCloseArticle = useCallback(() => {
    useAppStore.getState().closeModal();
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
          viewport={isBuildMode ? undefined : SECTION_VIEWPORT}
        >
          {ARTICLES.map((article) => (
            <motion.div
              key={article.id}
              variants={cardVariants}
              custom={prefersReducedMotion}
            >
              <JournalEntry article={article} onOpen={handleOpenArticle} />
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

export default memo(Journal);
