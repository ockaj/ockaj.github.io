import { useState, memo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CASE_STUDIES, type CaseStudyDetail } from "../../data/caseStudies";
import CaseStudyCard from "./CaseStudyCard";
import CaseStudyDrawer from "./CaseStudyDrawer";

import { isBoneyardBuild } from "../../utils/boneyard";
import {
  containerStaggerVariants,
  cardStaggerVariants,
  SECTION_VIEWPORT,
} from "../../utils/motionVariants";

const isBuildMode = isBoneyardBuild();
const containerVariants = containerStaggerVariants();
const cardVariants = cardStaggerVariants;

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
          viewport={isBuildMode ? undefined : SECTION_VIEWPORT}
        >
          {CASE_STUDIES.map((study) => (
            <motion.div
              key={study.id}
              variants={cardVariants}
              custom={prefersReducedMotion}
            >
              <CaseStudyCard study={study} onOpen={setSelectedStudy} />
            </motion.div>
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
