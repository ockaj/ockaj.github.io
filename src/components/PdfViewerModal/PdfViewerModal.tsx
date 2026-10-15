import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog } from "@base-ui/react/dialog";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import {
  useIsMobile,
  usePrefersReducedMotion,
} from "../../hooks/useMediaQuery";
import { useModal } from "../../hooks/useAppNavigation";
import { prefetchAsset } from "../../utils/quicklink";
import { requestIdle, cancelIdle } from "../../utils/idleCallback";
import { cn } from "../../utils/cn";
import {
  modalVariants,
  getBackdropTransition,
} from "../../utils/motionVariants";
import { EASE } from "../../utils/springConfig";
import { CV_DATA } from "../../data/cvData";
import { InteractiveCvView } from "./InteractiveCvView";
import { useAppStore } from "../../store/useAppStore";

const MODAL_CONTAINER_STYLE: React.CSSProperties = {
  transformOrigin: "center center",
  boxShadow:
    "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.6)",
};

const MODAL_SHEEN_OVERLAY = (
  <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1/2 bg-linear-to-b from-white/5 to-transparent" />
);

const PdfModalTitle = memo(function PdfModalTitle() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-bg">
        <img
          src="https://avatars.githubusercontent.com/u/36997301?v=4&s=32"
          alt="Ondrej Michal Očkaj"
          width="32"
          height="32"
          className="size-full object-cover outline-1 -outline-offset-1 outline-white/8"
        />
      </div>
      <div>
        <Dialog.Title
          id="modal-title"
          className="text-sm leading-tight font-semibold text-balance text-text-primary"
        >
          Ondrej Michal Očkaj
        </Dialog.Title>
        <p className="flex items-center gap-1 text-sm text-pretty text-muted">
          <FileText size={10} className="text-accent" />
          Curriculum Vitae
        </p>
      </div>
    </div>
  );
});

const PdfModalCloseButton = memo(function PdfModalCloseButton() {
  return (
    <Dialog.Close
      render={
        <LiquidGlassButton ariaLabel="Close CV Viewer" className="size-11 p-0">
          <X size={16} />
        </LiquidGlassButton>
      }
    />
  );
});

function PdfModalDownloadButton({ size }: Readonly<{ size: number }>) {
  return (
    <LiquidGlassButton
      href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
      download="Ondrej_Michal_Ockaj_CV.pdf"
      className="size-11 p-3"
      ariaLabel="Download PDF CV"
    >
      <Download size={size} className="text-text-primary" />
    </LiquidGlassButton>
  );
}

const PdfModalMobileActions = memo(function PdfModalMobileActions() {
  return (
    <div className="flex items-center gap-2.5 md:hidden">
      <PdfModalDownloadButton size={15} />
      <PdfModalCloseButton />
    </div>
  );
});

interface PdfModalDesktopActionsProps {
  activeTab: "pdf" | "interactive";
}

const PdfModalDesktopActions = memo(function PdfModalDesktopActions({
  activeTab,
}: PdfModalDesktopActionsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="hidden items-center gap-2 md:flex">
      <AnimatePresence mode="popLayout">
        {activeTab === "pdf" ? (
          <motion.div
            key="pdf-actions"
            initial={{
              opacity: 0,
              scale: prefersReducedMotion ? 1 : 0.92,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: prefersReducedMotion
                ? { duration: 0.15 }
                : { duration: 0.2, ease: EASE.out },
            }}
            exit={{
              opacity: 0,
              scale: prefersReducedMotion ? 1 : 0.92,
              transition: prefersReducedMotion
                ? { duration: 0.15 }
                : { duration: 0.14, ease: EASE.exit },
            }}
            className="flex items-center gap-2"
          >
            <PdfModalDownloadButton size={14} />

            <LiquidGlassButton
              href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="size-11 p-3"
              ariaLabel="Open CV PDF in new tab"
            >
              <ExternalLink size={14} className="text-text-primary" />
            </LiquidGlassButton>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <PdfModalCloseButton />
    </div>
  );
});

interface PdfModalTabsProps {
  activeTab: "pdf" | "interactive";
  onTabChange: (tab: "pdf" | "interactive") => void;
}

const PdfModalTabs = memo(function PdfModalTabs({
  activeTab,
  onTabChange,
}: PdfModalTabsProps) {
  return (
    <div className="hidden md:flex">
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        layoutId="active-viewer-tab"
        highlightClassName="navbar-highlight-flat"
        className="isolate flex transform-gpu items-center gap-0.5 overflow-hidden rounded-full border border-white/5 bg-white/3 p-2"
      >
        <Tab
          id="tab-pdf"
          value="pdf"
          aria-controls="tabpanel-pdf"
          className={cn(
            "relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none focus-visible:ring-inset",
            activeTab === "pdf"
              ? "text-text-primary"
              : "text-muted hover:text-text-primary",
          )}
        >
          <span>PDF Document</span>
        </Tab>
        <Tab
          id="tab-interactive"
          value="interactive"
          aria-controls="tabpanel-interactive"
          className={cn(
            "relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none focus-visible:ring-inset",
            activeTab === "interactive"
              ? "text-text-primary"
              : "text-muted hover:text-text-primary",
          )}
        >
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-accent" />
            <span>Interactive CV</span>
          </span>
        </Tab>
      </Tabs>
    </div>
  );
});

interface PdfDocumentPanelProps {
  isActive: boolean;
}

const PdfDocumentPanel = memo(function PdfDocumentPanel({
  isActive,
}: PdfDocumentPanelProps) {
  const [pdfLoading, setPdfLoading] = useState(true);
  const [hasDeferredMount, setHasDeferredMount] = useState(false);
  const shouldMountPdf = hasDeferredMount || isActive;

  const handlePdfLoaded = useCallback(() => {
    setPdfLoading(false);
  }, []);

  useEffect(() => {
    if (shouldMountPdf) return;

    let idleId: number | null = null;
    const timerId = window.setTimeout(() => {
      idleId = requestIdle(() => {
        setHasDeferredMount(true);
      });
    }, 350);

    return () => {
      window.clearTimeout(timerId);
      if (idleId !== null) {
        cancelIdle(idleId);
      }
    };
  }, [shouldMountPdf]);

  return (
    <div
      role="tabpanel"
      id="tabpanel-pdf"
      aria-labelledby="tab-pdf"
      className={isActive ? "absolute inset-0 flex flex-col" : "hidden"}
    >
      {pdfLoading ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg/80">
          <div className="animate-spin">
            <Loader2 className="text-accent" size={32} />
          </div>
          <p className="text-sm text-muted">Loading PDF Document…</p>
        </div>
      ) : null}
      {shouldMountPdf ? (
        <object
          data="/cv/Ondrej_Michal_Ockaj_CV.pdf#toolbar=0&navpanes=0&scrollbar=1"
          type="application/pdf"
          className="relative z-10 size-full border-0"
          title="Ondrej Michal Ockaj CV"
          onLoad={handlePdfLoaded}
          onError={handlePdfLoaded}
        >
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg/85 p-4 text-center">
            <p className="text-sm text-muted">
              Your browser does not support PDF viewing in-page.
            </p>
            <a
              href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
              download
              className="hover:bg-accent-hover rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors duration-200"
            >
              Download CV PDF
            </a>
          </div>
        </object>
      ) : null}
    </div>
  );
});

const CV_EN_VIEW = <InteractiveCvView activeCv={CV_DATA.en} lang="en" />;
const CV_SK_VIEW = <InteractiveCvView activeCv={CV_DATA.sk} lang="sk" />;

const InteractiveCvContent = memo(function InteractiveCvContent() {
  const cvLang = useAppStore((state) => state.cvLang);
  return cvLang === "en" ? CV_EN_VIEW : CV_SK_VIEW;
});

interface PdfModalBodyProps {
  activeTab: "pdf" | "interactive";
}

const PdfModalBody = memo(function PdfModalBody({
  activeTab,
}: PdfModalBodyProps) {
  return (
    <>
      <PdfDocumentPanel isActive={activeTab === "pdf"} />
      <div
        role="tabpanel"
        id="tabpanel-interactive"
        aria-labelledby="tab-interactive"
        className={
          activeTab === "interactive"
            ? "custom-cv-scrollbar absolute inset-0 overflow-y-auto overscroll-contain p-4 pb-safe-6 sm:p-6 md:p-8 md:pb-8 lg:p-12"
            : "hidden"
        }
      >
        <InteractiveCvContent />
      </div>
    </>
  );
});

function PdfViewerModal() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isOpen, close } = useModal("cv");
  const [activeTab, setActiveTab] = useState<"pdf" | "interactive">(
    "interactive",
  );

  useEffect(() => {
    if (isOpen) {
      prefetchAsset("/cv/Ondrej_Michal_Ockaj_CV.pdf");
    }
  }, [isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        close();
      }
    },
    [close],
  );

  return (
    <Dialog.Root
      open={isOpen}
      modal
      disablePointerDismissal
      onOpenChange={handleOpenChange}
    >
      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal keepMounted>
            {/* Backdrop */}
            <Dialog.Backdrop
              onClick={close}
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: getBackdropTransition(prefersReducedMotion),
                  }}
                  exit={{
                    opacity: 0,
                    transition: getBackdropTransition(prefersReducedMotion),
                  }}
                  className="fixed inset-0 z-90 overscroll-contain bg-black/70 backdrop-blur-none md:backdrop-blur-sm"
                />
              }
            />

            {/* Modal Viewport Container */}
            <Dialog.Viewport className="pointer-events-none fixed inset-0 z-100 flex items-center justify-center p-0 md:p-6 lg:p-8">
              <Dialog.Popup
                render={
                  <motion.div
                    custom={{ prefersReducedMotion, isMobile }}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={modalVariants}
                    className="pointer-events-auto relative z-10 flex size-full flex-col overflow-hidden rounded-none border-0 bg-surface md:h-85vh md:max-w-5xl md:rounded-3xl md:border md:border-white/10 md:bg-surface/90 md:backdrop-blur-2xl"
                    style={MODAL_CONTAINER_STYLE}
                  />
                }
              >
                <div className="flex size-full flex-col">
                  {/* Specular sheen header overlay */}
                  {MODAL_SHEEN_OVERLAY}

                  {/* Header */}
                  <div className="relative z-30 flex flex-col items-center justify-between gap-3 border-b border-white/10 px-4 pt-safe-4 pb-3 md:flex-row md:px-6 md:py-4">
                    {/* Title, Avatar & Mobile Action Buttons */}
                    <div className="flex w-full items-center justify-between gap-4 md:w-auto">
                      <PdfModalTitle />
                      <PdfModalMobileActions />
                    </div>

                    {/* Tab Selector */}
                    <PdfModalTabs
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />

                    {/* Desktop Action Buttons */}
                    <PdfModalDesktopActions activeTab={activeTab} />
                  </div>

                  {/* Viewer Body Content */}
                  <div className="relative flex-1 overflow-hidden bg-bg/40">
                    <PdfModalBody activeTab={activeTab} />
                  </div>
                </div>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export default memo(PdfViewerModal);
