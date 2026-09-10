import { memo, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CASE_STUDIES, type CaseStudyDetail } from "../../data/caseStudies";
import { useAppStore } from "../../store/useAppStore";
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
  const activeStudyId = useAppStore((state) =>
    state.activeModal?.startsWith("case-study-")
      ? state.activeModal.slice("case-study-".length)
      : null,
  );

  const selectedStudy = useMemo(() => {
    if (!activeStudyId) return null;
    return (
      CASE_STUDIES.find((study) => String(study.id) === activeStudyId) ?? null
    );
  }, [activeStudyId]);

  // Dismiss non-existent case study deep links (e.g. #case-study-999)
  useEffect(() => {
    if (activeStudyId && !selectedStudy) {
      useAppStore.getState().closeModal();
      window.history.replaceState(window.history.state, "", "#work");
    }
  }, [activeStudyId, selectedStudy]);

  const handleOpenStudy = useCallback((study: CaseStudyDetail) => {
    useAppStore.getState().openModal(`case-study-${study.id}`);
  }, []);

  const handleCloseStudy = useCallback(() => {
    useAppStore.getState().closeModal();
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
              <CaseStudyCard study={study} onOpen={handleOpenStudy} />
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
