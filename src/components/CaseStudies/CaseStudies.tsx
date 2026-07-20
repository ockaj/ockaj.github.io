import { useState, memo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CASE_STUDIES, type CaseStudyDetail } from "../../data/caseStudies";
import CaseStudyCard from "./CaseStudyCard";
import CaseStudyDrawer from "./CaseStudyDrawer";

const isBuildMode =
  typeof window !== "undefined" &&
  (window as unknown as { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
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
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function CaseStudies() {
  const prefersReducedMotion = useReducedMotion();
  const [selectedStudy, setSelectedStudy] = useState<CaseStudyDetail | null>(
    null,
  );

  const handleCloseStudy = useCallback(() => {
    setSelectedStudy(null);
  }, []);

  return (
    <>
      <div className="px-6 md:px-10 lg:px-16">
        <motion.div
          custom={prefersReducedMotion}
          className="space-y-6 md:space-y-8"
          variants={containerVariants}
          initial={isBuildMode ? "visible" : "hidden"}
          whileInView={isBuildMode ? undefined : "visible"}
          viewport={isBuildMode ? undefined : { once: true, margin: "-80px" }}
        >
          {CASE_STUDIES.map((study) => (
            <motion.article
              key={study.id}
              variants={cardVariants}
              custom={prefersReducedMotion}
            >
              <CaseStudyCard study={study} onOpen={setSelectedStudy} />
            </motion.article>
          ))}
        </motion.div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedStudy ? (
          <CaseStudyDrawer study={selectedStudy} onClose={handleCloseStudy} />
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default memo(CaseStudies);
