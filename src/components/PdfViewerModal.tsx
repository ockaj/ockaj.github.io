import { useEffect, useCallback, useMemo, memo, useReducer } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Dialog } from "@base-ui/react/dialog";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import { SPRING } from "../utils/springConfig";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useOverlay } from "../hooks/useAppNavigation";
import { prefetchAsset } from "../utils/quicklink";
import { cn } from "../utils/cn";
import { createModalVariants } from "../utils/motionVariants";
import { CV_DATA } from "../data/cvData";
import { InteractiveCvView } from "./PdfViewerModal/InteractiveCvView";
import { pdfReducer } from "./PdfViewerModal/pdfState";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modalVariants = createModalVariants(-10);

function usePdfViewerModalController(isOpen: boolean, onClose: () => void) {
  const isMobile = useIsMobile();

  useOverlay(isOpen, onClose, "cv");

  useEffect(() => {
    if (isOpen) {
      prefetchAsset("/cv/Ondrej_Michal_Ockaj_CV.pdf");
    }
  }, [isOpen]);

  const [state, dispatch] = useReducer(pdfReducer, {
    activeTab: "interactive",
    lang: "en",
    pdfLoading: true,
    isHovered: false,
    isTransitioning: false,
  });

  const { activeTab, lang, pdfLoading, isHovered, isTransitioning } = state;

  const handleTabChange = useCallback(
    (tab: "pdf" | "interactive") => {
      if (isMobile && tab === "pdf") {
        window.open(
          "/cv/Ondrej_Michal_Ockaj_CV.pdf",
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      dispatch({ type: "CHANGE_TAB", tab });
    },
    [isMobile],
  );

  const handleTabsMouseEnter = useCallback(
    () => dispatch({ type: "SET_IS_HOVERED", hovered: true }),
    [],
  );

  const handleTabsMouseLeave = useCallback(
    () => dispatch({ type: "SET_IS_HOVERED", hovered: false }),
    [],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(
      () => dispatch({ type: "SET_IS_TRANSITIONING", transitioning: false }),
      500,
    );
    return () => clearTimeout(timer);
  }, [isTransitioning]);

  const activeCv = useMemo(() => CV_DATA[lang], [lang]);

  return {
    isMobile,
    dispatch,
    activeTab,
    lang,
    pdfLoading,
    isHovered,
    isTransitioning,
    handleTabChange,
    handleTabsMouseEnter,
    handleTabsMouseLeave,
    handleOpenChange,
    activeCv,
  };
}

const PdfModalPopupContent = memo(function PdfModalPopupContent({
  controller,
  onClose,
  prefersReducedMotion,
}: Readonly<{
  controller: ReturnType<typeof usePdfViewerModalController>;
  onClose: () => void;
  prefersReducedMotion: boolean;
}>) {
  const {
    isMobile,
    dispatch,
    activeTab,
    lang,
    pdfLoading,
    isHovered,
    isTransitioning,
    handleTabChange,
    handleTabsMouseEnter,
    handleTabsMouseLeave,
    activeCv,
  } = controller;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-8">
      {/* Backdrop Blur overlay */}
      <Dialog.Backdrop
        onClick={onClose}
        render={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: SPRING.exit }}
            className="bg-bg/80 pointer-events-auto fixed inset-0 backdrop-blur-md"
          />
        }
      />

      {/* Modal Container */}
      <Dialog.Popup
        render={
          <motion.div
            custom={{ prefersReducedMotion, isMobile }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={modalVariants}
            className="bg-surface/85 pointer-events-auto relative z-10 flex h-full w-full flex-col overflow-hidden rounded-none border-0 backdrop-blur-2xl md:h-[85vh] md:max-w-5xl md:rounded-3xl md:border md:border-white/10"
            style={{
              transformOrigin: "center top",
              boxShadow:
                "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.6)",
            }}
          />
        }
      >
        <div className="flex h-full w-full flex-col">
          {/* Specular sheen header overlay */}
          <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 h-1/2 bg-gradient-to-b from-white/5 to-transparent" />

          {/* Header */}
          <div className="relative z-30 flex flex-col items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:flex-row md:px-6 md:py-4">
            {/* Title, Avatar & Mobile Action Buttons */}
            <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="bg-bg size-8 flex-shrink-0 overflow-hidden rounded-full border border-white/10">
                  <img
                    src="https://avatars.githubusercontent.com/u/36997301?v=4&s=32"
                    alt="Ondrej Michal Očkaj"
                    width="32"
                    height="32"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <Dialog.Title
                    id="modal-title"
                    className="text-text-primary text-sm leading-tight font-semibold text-balance"
                  >
                    Ondrej Michal Očkaj
                  </Dialog.Title>
                  <p className="text-muted flex items-center gap-1 text-xs text-pretty">
                    <FileText size={10} className="text-accent" />
                    Curriculum Vitae
                  </p>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex items-center gap-2.5 sm:hidden">
                <LiquidGlassButton
                  href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                  download="Ondrej_Michal_Ockaj_CV.pdf"
                  className="size-11 p-3"
                  ariaLabel="Download PDF CV"
                >
                  <Download size={15} className="text-text-primary" />
                </LiquidGlassButton>

                <Dialog.Close
                  render={
                    <LiquidGlassButton
                      onClick={onClose}
                      ariaLabel="Close CV Viewer"
                      className="size-11 p-0"
                    >
                      <X size={16} />
                    </LiquidGlassButton>
                  }
                />
              </div>
            </div>

            {/* Tab Selector */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              layoutId="active-viewer-tab"
              onMouseEnter={handleTabsMouseEnter}
              onMouseLeave={handleTabsMouseLeave}
              highlightClassName={
                isHovered || isTransitioning
                  ? "navbar-highlight-active"
                  : "navbar-highlight-flat"
              }
              className="isolate flex [transform:translateZ(0)] items-center gap-0.5 overflow-hidden rounded-full border border-white/5 bg-white/[0.03] p-2"
            >
              <Tab
                value="pdf"
                aria-controls="tabpanel-pdf"
                className={cn(
                  "focus-visible:ring-accent/60 relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                  activeTab === "pdf"
                    ? "text-text-primary"
                    : "text-muted hover:text-text-primary",
                )}
              >
                {isMobile ? "PDF File ↗" : "PDF Document"}
              </Tab>
              <Tab
                value="interactive"
                aria-controls="tabpanel-interactive"
                className={cn(
                  "focus-visible:ring-accent/60 relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                  activeTab === "interactive"
                    ? "text-text-primary"
                    : "text-muted hover:text-text-primary",
                )}
              >
                <span className="flex items-center gap-1">
                  <Sparkles size={11} className="text-accent" />
                  {isMobile ? "Interactive" : "Interactive CV"}
                </span>
              </Tab>
            </Tabs>

            {/* Desktop Action Buttons */}
            <div className="hidden items-center gap-2 sm:flex">
              <LiquidGlassButton
                href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                download="Ondrej_Michal_Ockaj_CV.pdf"
                className="size-11 p-3"
                ariaLabel="Download PDF CV"
              >
                <Download size={14} className="text-text-primary" />
              </LiquidGlassButton>

              <LiquidGlassButton
                href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="size-11 p-3"
                ariaLabel="Open CV PDF in new tab"
              >
                <ExternalLink size={14} className="text-text-primary" />
              </LiquidGlassButton>

              <Dialog.Close
                render={
                  <LiquidGlassButton
                    onClick={onClose}
                    ariaLabel="Close CV Viewer"
                    className="size-11 p-0"
                  >
                    <X size={16} />
                  </LiquidGlassButton>
                }
              />
            </div>
          </div>

          {/* Viewer Body Content */}
          <div className="bg-bg/40 relative flex-1 overflow-hidden">
            {/* Tab 1: PDF Document */}
            <div
              role="tabpanel"
              id="tabpanel-pdf"
              aria-labelledby="tab-pdf"
              className={
                activeTab === "pdf"
                  ? "absolute inset-0 flex flex-col"
                  : "hidden"
              }
            >
              {activeTab === "pdf" ? (
                <>
                  {pdfLoading ? (
                    <div className="bg-bg/80 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="text-accent animate-spin" size={32} />
                      <p className="text-muted text-xs">
                        Loading PDF Document…
                      </p>
                    </div>
                  ) : null}
                  <object
                    data="/cv/Ondrej_Michal_Ockaj_CV.pdf#toolbar=0&navpanes=0&scrollbar=1"
                    type="application/pdf"
                    className="relative z-10 h-full w-full border-0"
                    title="Ondrej Michal Ockaj CV"
                    onLoad={() =>
                      dispatch({
                        type: "SET_PDF_LOADING",
                        loading: false,
                      })
                    }
                  >
                    <div className="bg-bg/85 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <p className="text-muted text-sm">
                        Your browser does not support PDF viewing in-page.
                      </p>
                      <a
                        href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                        download
                        className="bg-accent text-bg hover:bg-accent-hover rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200"
                      >
                        Download CV PDF
                      </a>
                    </div>
                  </object>
                </>
              ) : null}
            </div>

            {/* Tab 2: Interactive Resume HTML */}
            <div
              role="tabpanel"
              id="tabpanel-interactive"
              aria-labelledby="tab-interactive"
              className={
                activeTab === "interactive"
                  ? "custom-cv-scrollbar absolute inset-0 overflow-y-auto p-6 md:p-8 lg:p-12"
                  : "hidden"
              }
            >
              {activeTab === "interactive" ? (
                <InteractiveCvView
                  activeCv={activeCv}
                  lang={lang}
                  isMobile={isMobile}
                  dispatch={dispatch}
                />
              ) : null}
            </div>
          </div>
        </div>
      </Dialog.Popup>
    </div>
  );
});

function PdfViewerModal({ isOpen, onClose }: Readonly<PdfViewerModalProps>) {
  const controller = usePdfViewerModalController(isOpen, onClose);
  const prefersReducedMotion = useReducedMotion();

  if (typeof document === "undefined") return null;

  return (
    <Dialog.Root
      open={isOpen}
      modal
      disablePointerDismissal
      onOpenChange={controller.handleOpenChange}
    >
      <Dialog.Portal keepMounted>
        <AnimatePresence>
          {isOpen ? (
            <PdfModalPopupContent
              controller={controller}
              onClose={onClose}
              prefersReducedMotion={!!prefersReducedMotion}
            />
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default memo(PdfViewerModal);
