import { memo, useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  CASE_STUDIES,
  CASE_STUDIES_BY_ID,
  type CaseStudyDetail,
} from "../../data/caseStudies";
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

  const selectedStudy = activeStudyId
    ? (CASE_STUDIES_BY_ID.get(activeStudyId) ?? null)
    : null;

  const [prevStudy, setPrevStudy] = useState(selectedStudy);
  const [displayedStudy, setDisplayedStudy] = useState(selectedStudy);

  if (selectedStudy !== prevStudy) {
    setPrevStudy(selectedStudy);
    if (selectedStudy !== null) {
      setDisplayedStudy(selectedStudy);
    }
  }

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

  const handleExitComplete = useCallback(() => {
    setDisplayedStudy(null);
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
      <CaseStudyDrawer
        open={Boolean(selectedStudy)}
        study={displayedStudy}
        onClose={handleCloseStudy}
        onExitComplete={handleExitComplete}
      />
    </>
  );
}

export default memo(CaseStudies);
