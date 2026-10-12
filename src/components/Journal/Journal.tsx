import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ARTICLES, ARTICLES_BY_ID } from "../../data/articles";
import { useEntityModal } from "../../hooks/useEntityModal";
import JournalEntry from "./JournalEntry";
import JournalDrawer from "./JournalDrawer";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";

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
  const modal = useEntityModal("article", ARTICLES_BY_ID);

  return (
    <>
      <div className="px-6 md:px-10 lg:px-16">
        {ARTICLES.length === 0 ? (
          <InteractiveGlass
            as="div"
            roundedClass="rounded-2xl"
            className="flex min-h-60 w-full flex-col items-center justify-center p-8 text-center text-muted sm:min-h-72"
            tilt
          >
            <p className="text-base">
              No journal articles currently available.
            </p>
          </InteractiveGlass>
        ) : (
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
                <JournalEntry article={article} onOpen={modal.open} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Drawer */}
      <JournalDrawer article={modal.displayed} {...modal.drawerProps} />
    </>
  );
}

export default memo(Journal);
