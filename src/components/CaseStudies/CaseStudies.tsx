import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CASE_STUDIES, CASE_STUDIES_BY_ID } from "../../data/caseStudies";
import { useEntityModal } from "../../hooks/useEntityModal";
import CaseStudyCard from "./CaseStudyCard";
import CaseStudyDrawer from "./CaseStudyDrawer";
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

function CaseStudies() {
  const prefersReducedMotion = useReducedMotion();
  const modal = useEntityModal("case-study", CASE_STUDIES_BY_ID);

  return (
    <>
      <div className="px-6 md:px-10 lg:px-16">
        {CASE_STUDIES.length === 0 ? (
          <InteractiveGlass
            as="div"
            roundedClass="rounded-2xl"
            className="flex min-h-60 w-full flex-col items-center justify-center p-8 text-center text-muted sm:min-h-72"
            tilt
          >
            <p className="text-base">No case studies currently available.</p>
          </InteractiveGlass>
        ) : (
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
                <CaseStudyCard study={study} onOpen={modal.open} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Drawer */}
      <CaseStudyDrawer study={modal.displayed} {...modal.drawerProps} />
    </>
  );
}

export default memo(CaseStudies);
