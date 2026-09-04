import { Suspense, useCallback, memo, type ComponentProps } from "react";
import { AnimatePresence } from "motion/react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";

import LoadingScreen from "./components/LoadingScreen";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import BpmnNodeBadge from "./components/BpmnNodeBadge";
import LazySection from "./components/LazySection";
import Aurora from "./components/Aurora";
import ContactSection from "./components/ContactSection";

import { useIsMobile } from "./hooks/useMediaQuery";
import { usePreloadComponents } from "./hooks/usePreloadComponents";
import { useNavigation } from "./hooks/useAppNavigation";
import { useAppStore } from "./store/useAppStore";
import {
  CaseStudies,
  Skills,
  ProcessLibrary,
  Journal,
  Faq,
  PdfViewerModal,
  BpmnOverlay,
} from "./lazyComponents";

interface AppSectionHeaderProps {
  badgeType: ComponentProps<typeof BpmnNodeBadge>["type"];
  title: string;
  subtitle: string;
}

function AppSectionHeader({
  badgeType,
  title,
  subtitle,
}: Readonly<AppSectionHeaderProps>) {
  return (
    <>
      <h2 className="font-display text-text-primary mb-3 flex items-center gap-3 text-3xl text-balance md:text-5xl">
        <BpmnNodeBadge type={badgeType} className="translate-y-[2px]" />
        {title}
      </h2>
      <p className="text-muted max-w-sm text-sm text-pretty">{subtitle}</p>
    </>
  );
}

function DesktopBpmnOverlay() {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return (
    <Suspense fallback={null}>
      <BpmnOverlay />
    </Suspense>
  );
}

function App() {
  const isLoading = useAppStore((state) => state.isLoading);

  useNavigation();

  // Preload lazy components concurrently with main-thread yielding to protect INP
  usePreloadComponents(isLoading);

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

      <Aurora paused={isLoading} />

      <BaseTooltip.Provider delay={0} timeout={300}>
        <main
          id="main-content"
          inert={isLoading}
          className="text-text-primary font-body relative z-10"
        >
          <Navbar />

          <div id="home">
            <Hero />
          </div>

          <LazySection
            id="work"
            bonesName="case-studies"
            headerClassName="mb-12 md:mb-16 relative z-30 px-6 md:px-10 lg:px-16"
            header={
              <AppSectionHeader
                badgeType="task"
                title="Process transformation projects"
                subtitle="Real-world analysis and digital solutions across supply chain, logistics, and HR domains."
              />
            }
          >
            <CaseStudies />
          </LazySection>

          <LazySection
            id="skills"
            bonesName="skills"
            headerClassName="mb-8 md:mb-10 relative z-30 px-6 md:px-10 lg:px-16"
            header={
              <AppSectionHeader
                badgeType="gateway-or"
                title="Skills & competencies"
                subtitle="Comprehensive toolkit for process analysis, business transformation, and digital solutions."
              />
            }
          >
            <Skills />
          </LazySection>

          <LazySection
            id="processes"
            bonesName="processes"
            headerClassName="mb-10 md:mb-14 relative z-30 px-6 md:px-10 lg:px-16"
            header={
              <AppSectionHeader
                badgeType="subprocess-collapsed"
                title="BPMN & Process models"
                subtitle="Real-world enterprise process diagrams, workflows, and transformation models."
              />
            }
          >
            <ProcessLibrary />
          </LazySection>

          <LazySection
            id="journal"
            bonesName="journal"
            headerClassName="flex items-end justify-between mb-10 md:mb-14 px-6 md:px-10 lg:px-16"
            header={
              <div>
                <AppSectionHeader
                  badgeType="intermediate-event-catch-message"
                  title="Recent thought pieces"
                  subtitle="Analyzing process optimization, systems integrations, and enterprise digital transformation frameworks."
                />
              </div>
            }
          >
            <Journal />
          </LazySection>

          <LazySection
            id="faq"
            bonesName="faq"
            headerClassName="mb-10 md:mb-14 relative z-30 px-6 md:px-10 lg:px-16"
            header={
              <AppSectionHeader
                badgeType="user-task"
                title="Frequently asked questions"
                subtitle="Key screening information on process projects, analysis methods, and roles."
              />
            }
          >
            <Faq />
          </LazySection>

          <ContactSection />

          <Suspense fallback={null}>
            <PdfViewerModal />
          </Suspense>

          {!isLoading ? <DesktopBpmnOverlay /> : null}
        </main>
      </BaseTooltip.Provider>
    </>
  );
}

export default memo(App);
