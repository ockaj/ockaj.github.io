import { useState, memo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ARTICLES, type Article } from "../../data/articles";
import JournalEntry from "./JournalEntry";
import JournalDrawer from "./JournalDrawer";

import { isBoneyardBuild } from "../../utils/boneyard";
import {
  containerStaggerVariants,
  cardStaggerVariants,
} from "../../utils/motionVariants";

const isBuildMode = isBoneyardBuild();
const containerVariants = containerStaggerVariants(0.08);
const cardVariants = cardStaggerVariants;

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

export default memo(Journal);
