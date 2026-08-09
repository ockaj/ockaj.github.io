import { Suspense, useCallback, useMemo, memo } from "react";
import { AnimatePresence } from "motion/react";

import LoadingScreen from "./components/LoadingScreen";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import BpmnNodeBadge from "./components/BpmnNodeBadge";
import LazySection from "./components/LazySection";
import Aurora from "./components/Aurora";
import ContactSection from "./components/ContactSection";

import { useIsMobile } from "./hooks/useMediaQuery";
import { useLazyMount } from "./hooks/useLazyMount";
import { usePreloadComponents } from "./hooks/usePreloadComponents";
import { useNavigation } from "./hooks/useAppNavigation";
import { useAppStore } from "./store/useAppStore";
import { getSkeletonHeight } from "./utils/skeletonHeight";
import {
  CaseStudies,
  Skills,
  ProcessLibrary,
  Journal,
  PdfViewerModal,
  BpmnOverlay,
} from "./lazyComponents";

import caseStudiesBones from "./bones/case-studies.bones.json";
import skillsBones from "./bones/skills.bones.json";
import processesBones from "./bones/processes.bones.json";
import journalBones from "./bones/journal.bones.json";

function App() {
  const isLoading = useAppStore((state) => state.isLoading);
  const isCvOpen = useAppStore((state) => state.isCvOpen);

  const { activeSection, handleNavClick } = useNavigation();

  const skeletonHeights = useMemo(
    () => ({
      caseStudies: getSkeletonHeight(caseStudiesBones),
      skills: getSkeletonHeight(skillsBones),
      processes: getSkeletonHeight(processesBones),
      journal: getSkeletonHeight(journalBones),
    }),
    [],
  );

  const isMobile = useIsMobile();
  const rootMargin = isMobile ? "500px" : "300px";

  const [caseStudiesRef, caseStudiesInView] = useLazyMount({ rootMargin });
  const [skillsRef, skillsInView] = useLazyMount({ rootMargin });
  const [processesRef, processesInView] = useLazyMount({ rootMargin });
  const [journalRef, journalInView] = useLazyMount({ rootMargin });

  // Preload lazy components concurrently with main-thread yielding to protect INP
  usePreloadComponents(isMobile);

  const handleViewWork = useCallback(() => {
    handleNavClick("Case Studies");
  }, [handleNavClick]);

  const handleViewCv = useCallback(() => {
    useAppStore.getState().setCvOpen(true);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    useAppStore.getState().completeLoading();
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen onComplete={handleLoadingComplete} />
        ) : null}
      </AnimatePresence>

      {!isLoading ? <Aurora /> : null}

      <main
        id="main-content"
        inert={isLoading}
        className="text-text-primary font-body relative z-10"
      >
        <Navbar activeSection={activeSection} onNavClick={handleNavClick} />

        <div id="home">
          <Hero onViewCv={handleViewCv} onViewWork={handleViewWork} />
        </div>

        <LazySection
          id="work"
          sectionRef={caseStudiesRef}
          bonesName="case-studies"
          skeletonHeight={skeletonHeights.caseStudies}
          isInView={caseStudiesInView}
          headerClassName="mb-12 md:mb-16 relative z-30 px-6 md:px-10 lg:px-16"
          header={
            <>
              <h2 className="font-display text-text-primary mb-3 flex items-center gap-3 text-3xl text-balance md:text-5xl">
                <BpmnNodeBadge type="task" className="translate-y-[2px]" />
                Process transformation projects
              </h2>
              <p className="text-muted max-w-sm text-sm text-pretty">
                Real-world analysis and digital solutions across supply chain,
                logistics, and HR domains.
              </p>
            </>
          }
        >
          <CaseStudies />
        </LazySection>

        <LazySection
          id="skills"
          sectionRef={skillsRef}
          bonesName="skills"
          skeletonHeight={skeletonHeights.skills}
          isInView={skillsInView}
          headerClassName="mb-8 md:mb-10 relative z-30 px-6 md:px-10 lg:px-16"
          header={
            <>
              <h2 className="font-display text-text-primary mb-3 flex items-center gap-3 text-3xl text-balance md:text-5xl">
                <BpmnNodeBadge
                  type="gateway-or"
                  className="translate-y-[2px]"
                />
                Skills & competencies
              </h2>
              <p className="text-muted max-w-sm text-sm text-pretty">
                Comprehensive toolkit for process analysis, business
                transformation, and digital solutions.
              </p>
            </>
          }
        >
          <Skills />
        </LazySection>

        <LazySection
          id="processes"
          sectionRef={processesRef}
          bonesName="processes"
          skeletonHeight={skeletonHeights.processes}
          isInView={processesInView}
          headerClassName="mb-10 md:mb-14 relative z-30 px-6 md:px-10 lg:px-16"
          header={
            <>
              <h2 className="font-display text-text-primary mb-3 flex items-center gap-3 text-3xl text-balance md:text-5xl">
                <BpmnNodeBadge
                  type="subprocess-collapsed"
                  className="translate-y-[2px]"
                />
                BPMN & Process models
              </h2>
              <p className="text-muted max-w-sm text-sm text-pretty">
                Real-world enterprise process diagrams, workflows, and
                transformation models.
              </p>
            </>
          }
        >
          <ProcessLibrary />
        </LazySection>

        <LazySection
          id="journal"
          sectionRef={journalRef}
          bonesName="journal"
          skeletonHeight={skeletonHeights.journal}
          isInView={journalInView}
          headerClassName="flex items-end justify-between mb-10 md:mb-14 px-6 md:px-10 lg:px-16"
          header={
            <div>
              <h2 className="font-display text-text-primary mb-3 flex items-center gap-3 text-3xl text-balance md:text-5xl">
                <BpmnNodeBadge
                  type="intermediate-event-catch-message"
                  className="translate-y-[2px]"
                />
                Recent thought pieces
              </h2>
              <p className="text-muted max-w-sm text-sm text-pretty">
                Analyzing process optimization, systems integrations, and
                enterprise digital transformation frameworks.
              </p>
            </div>
          }
        >
          <Journal />
        </LazySection>

        <ContactSection />

        <Suspense fallback={null}>
          <PdfViewerModal
            isOpen={isCvOpen}
            onClose={() => useAppStore.getState().setCvOpen(false)}
          />
        </Suspense>

        <Suspense fallback={null}>
          {!isLoading && !isMobile ? (
            <BpmnOverlay onNavigate={handleNavClick} />
          ) : null}
        </Suspense>
      </main>
    </>
  );
}

export default memo(App);
