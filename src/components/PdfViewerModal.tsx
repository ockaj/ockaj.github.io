import {
  useState,
  useEffect,
  useCallback,
  memo,
  useReducer,
  useMemo,
  type ReactNode,
} from "react";
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
import { useAppStore } from "../store/useAppStore";

const modalVariants = createModalVariants(-10);
const MODAL_CONTAINER_STYLE: React.CSSProperties = {
  transformOrigin: "center top",
  boxShadow:
    "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.6)",
};

const BACKDROP_ANIMATION = (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: SPRING.exit }}
    className="bg-bg/80 pointer-events-auto fixed inset-0 backdrop-blur-md"
  />
);

const MODAL_SHEEN_OVERLAY = (
  <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 h-1/2 bg-gradient-to-b from-white/5 to-transparent" />
);

function usePdfModalDialog() {
  const isOpen = useAppStore((state) => state.isCvOpen);

  const handleClose = useCallback(() => {
    useAppStore.getState().setCvOpen(false);
  }, []);

  useOverlay(isOpen, handleClose, "cv");

  useEffect(() => {
    if (isOpen) {
      prefetchAsset("/cv/Ondrej_Michal_Ockaj_CV.pdf");
    }
  }, [isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose],
  );

  return {
    isOpen,
    handleClose,
    handleOpenChange,
  };
}

function usePdfViewerState(isMobile: boolean) {
  const [state, dispatch] = useReducer(pdfReducer, {
    activeTab: "interactive",
    isTransitioning: false,
  });

  const { activeTab, isTransitioning } = state;

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

  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(
      () => dispatch({ type: "SET_IS_TRANSITIONING", transitioning: false }),
      500,
    );
    return () => clearTimeout(timer);
  }, [isTransitioning]);

  return {
    dispatch,
    activeTab,
    isTransitioning,
    handleTabChange,
  };
}

function usePdfViewerModalController() {
  const isMobile = useIsMobile();
  const dialog = usePdfModalDialog();
  const viewer = usePdfViewerState(isMobile);

  return {
    isMobile,
    ...dialog,
    ...viewer,
  };
}

const PdfModalTitle = memo(function PdfModalTitle() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-bg size-8 flex-shrink-0 overflow-hidden rounded-full border border-white/10">
        <img
          src="https://avatars.githubusercontent.com/u/36997301?v=4&s=32"
          alt="Ondrej Michal Očkaj"
          width="32"
          height="32"
          className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-white/[0.08]"
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
  );
});

interface PdfModalActionsProps {
  onClose: () => void;
}

const PdfModalMobileActions = memo(function PdfModalMobileActions({
  onClose,
}: PdfModalActionsProps) {
  return (
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
  );
});

const PdfModalDesktopActions = memo(function PdfModalDesktopActions({
  onClose,
}: PdfModalActionsProps) {
  return (
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
  );
});

interface PdfModalTabsProps {
  activeTab: "pdf" | "interactive";
  onTabChange: (tab: "pdf" | "interactive") => void;
  isMobile: boolean;
  isTransitioning: boolean;
}

const PdfModalTabs = memo(function PdfModalTabs({
  activeTab,
  onTabChange,
  isMobile,
  isTransitioning,
}: PdfModalTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onChange={onTabChange}
      layoutId="active-viewer-tab"
      highlightClassName={
        isTransitioning ? "navbar-highlight-active" : "navbar-highlight-flat"
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
        <span>{isMobile ? "PDF File ↗" : "PDF Document"}</span>
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
          <span>{isMobile ? "Interactive" : "Interactive CV"}</span>
        </span>
      </Tab>
    </Tabs>
  );
});

interface PdfDocumentPanelProps {
  isActive: boolean;
}

const PdfDocumentPanel = memo(function PdfDocumentPanel({
  isActive,
}: PdfDocumentPanelProps) {
  const [pdfLoading, setPdfLoading] = useState(true);
  const handlePdfLoaded = useCallback(() => {
    setPdfLoading(false);
  }, []);

  return (
    <div
      role="tabpanel"
      id="tabpanel-pdf"
      aria-labelledby="tab-pdf"
      className={isActive ? "absolute inset-0 flex flex-col" : "hidden"}
    >
      {pdfLoading ? (
        <div className="bg-bg/80 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin">
            <Loader2 className="text-accent" size={32} />
          </div>
          <p className="text-muted text-xs">Loading PDF Document…</p>
        </div>
      ) : null}
      <object
        data="/cv/Ondrej_Michal_Ockaj_CV.pdf#toolbar=0&navpanes=0&scrollbar=1"
        type="application/pdf"
        className="relative z-10 h-full w-full border-0"
        title="Ondrej Michal Ockaj CV"
        onLoad={handlePdfLoaded}
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
    </div>
  );
});

const CV_EN_VIEW = <InteractiveCvView activeCv={CV_DATA.en} lang="en" />;
const CV_SK_VIEW = <InteractiveCvView activeCv={CV_DATA.sk} lang="sk" />;

const InteractiveCvContent = memo(function InteractiveCvContent() {
  const cvLang = useAppStore((state) => state.cvLang);
  return (
    <>
      <div className={cvLang === "en" ? "block" : "hidden"}>{CV_EN_VIEW}</div>
      <div className={cvLang === "sk" ? "block" : "hidden"}>{CV_SK_VIEW}</div>
    </>
  );
});

interface PdfModalPopupContentProps {
  activeTab: "pdf" | "interactive";
  isTransitioning: boolean;
  onTabChange: (tab: "pdf" | "interactive") => void;
  onClose: () => void;
  isMobile: boolean;
  prefersReducedMotion: boolean;
  children: ReactNode;
}

const PdfModalPopupContent = memo(function PdfModalPopupContent({
  activeTab,
  isTransitioning,
  onTabChange,
  onClose,
  isMobile,
  prefersReducedMotion,
  children,
}: PdfModalPopupContentProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-8">
      {/* Backdrop Blur overlay */}
      <Dialog.Backdrop onClick={onClose} render={BACKDROP_ANIMATION} />

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
            style={MODAL_CONTAINER_STYLE}
          />
        }
      >
        <div className="flex h-full w-full flex-col">
          {/* Specular sheen header overlay */}
          {MODAL_SHEEN_OVERLAY}

          {/* Header */}
          <div className="relative z-30 flex flex-col items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:flex-row md:px-6 md:py-4">
            {/* Title, Avatar & Mobile Action Buttons */}
            <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
              <PdfModalTitle />
              <PdfModalMobileActions onClose={onClose} />
            </div>

            {/* Tab Selector */}
            <PdfModalTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
              isMobile={isMobile}
              isTransitioning={isTransitioning}
            />

            {/* Desktop Action Buttons */}
            <PdfModalDesktopActions onClose={onClose} />
          </div>

          {/* Viewer Body Content */}
          <div className="bg-bg/40 relative flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </Dialog.Popup>
    </div>
  );
});

function PdfViewerModal() {
  const {
    isOpen,
    handleClose,
    isMobile,
    activeTab,
    isTransitioning,
    handleTabChange,
    handleOpenChange,
  } = usePdfViewerModalController();
  const prefersReducedMotion = useReducedMotion();

  const modalBody = useMemo(
    () => (
      <>
        <PdfDocumentPanel isActive={activeTab === "pdf"} />
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
          <InteractiveCvContent />
        </div>
      </>
    ),
    [activeTab],
  );

  return (
    <Dialog.Root
      open={isOpen}
      modal
      disablePointerDismissal
      onOpenChange={handleOpenChange}
    >
      <Dialog.Portal keepMounted>
        <AnimatePresence>
          {isOpen ? (
            <PdfModalPopupContent
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onClose={handleClose}
              isMobile={isMobile}
              isTransitioning={isTransitioning}
              prefersReducedMotion={!!prefersReducedMotion}
            >
              {modalBody}
            </PdfModalPopupContent>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default memo(PdfViewerModal);
