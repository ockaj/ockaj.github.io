import { useEffect, useCallback, useMemo, memo, useReducer } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Dialog } from "@base-ui/react/dialog";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages,
} from "lucide-react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import { SPRING } from "../utils/springConfig";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useOverlay } from "../hooks/useAppNavigation";
import { prefetchAsset } from "../utils/quicklink";
import { cn } from "../utils/cn";
import { createModalVariants } from "../utils/motionVariants";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}
import { CV_DATA, type CvDataLanguageSection } from "../data/cvData";

const modalVariants = createModalVariants(-10);

const WHITESPACE_REGEX = /\s+/g;
const PHONE_PREFIX_REGEX = /^[+\d]/;

interface PdfState {
  activeTab: "pdf" | "interactive";
  lang: "en" | "sk";
  pdfLoading: boolean;
  isHovered: boolean;
  isTransitioning: boolean;
}

type PdfAction =
  | { type: "CHANGE_TAB"; tab: "pdf" | "interactive" }
  | { type: "SET_LANG"; lang: "en" | "sk" }
  | { type: "SET_PDF_LOADING"; loading: boolean }
  | { type: "SET_IS_HOVERED"; hovered: boolean }
  | { type: "SET_IS_TRANSITIONING"; transitioning: boolean };

function pdfReducer(state: PdfState, action: PdfAction): PdfState {
  switch (action.type) {
    case "CHANGE_TAB":
      return { ...state, activeTab: action.tab, isTransitioning: true };
    case "SET_LANG":
      return { ...state, lang: action.lang };
    case "SET_PDF_LOADING":
      return { ...state, pdfLoading: action.loading };
    case "SET_IS_HOVERED":
      return { ...state, isHovered: action.hovered };
    case "SET_IS_TRANSITIONING":
      return { ...state, isTransitioning: action.transitioning };
    default:
      return state;
  }
}

interface InteractiveCvViewProps {
  activeCv: CvDataLanguageSection;
  lang: "en" | "sk";
  isMobile: boolean;
  dispatch: React.Dispatch<PdfAction>;
}

const InteractiveCvView = memo(function InteractiveCvView({
  activeCv,
  lang,
  isMobile,
  dispatch,
}: InteractiveCvViewProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      {/* CV Heading Card */}
      <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-md md:flex-row md:items-center md:p-8">
        <div className="from-accent/5 pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr to-transparent" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-accent bg-accent/10 rounded-xl px-2 py-0.5 text-xs font-semibold uppercase">
              {lang === "en" ? "Active Resume" : "Aktívny Životopis"}
            </span>
          </div>
          <h1 className="font-display text-text-primary mb-1 text-3xl text-balance md:text-4xl">
            {activeCv.title}
          </h1>
          <p className="text-text-primary/95 font-body text-sm font-normal text-pretty">
            {activeCv.role}
          </p>

          {/* Contacts */}
          <div className="text-muted mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs tabular-nums">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-accent/65" />
              {activeCv.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="text-accent/65" />
              <a
                href={`mailto:${activeCv.email}`}
                className="hover:text-text-primary transition-colors"
              >
                {activeCv.email}
              </a>
            </span>
            {activeCv.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone size={12} className="text-accent/65" />
                {PHONE_PREFIX_REGEX.test(activeCv.phone) ? (
                  <a
                    href={`tel:${activeCv.phone.replace(WHITESPACE_REGEX, "")}`}
                    className="hover:text-text-primary transition-colors"
                  >
                    {activeCv.phone}
                  </a>
                ) : (
                  <span>{activeCv.phone}</span>
                )}
              </span>
            ) : null}
          </div>
        </div>

        {/* Language Toggler */}
        <div className="relative z-10 flex items-center gap-1.5 self-start md:self-auto">
          <LiquidGlassButton
            onClick={() => dispatch({ type: "SET_LANG", lang: "en" })}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold",
              lang === "en" ? "text-accent" : "text-muted",
            )}
          >
            <Languages size={11} />
            EN
          </LiquidGlassButton>
          <LiquidGlassButton
            onClick={() => dispatch({ type: "SET_LANG", lang: "sk" })}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold",
              lang === "sk" ? "text-accent" : "text-muted",
            )}
          >
            <Languages size={11} />
            SK
          </LiquidGlassButton>
        </div>
      </div>

      {/* Main Content Grid (Columns) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Summary, Experience, Education */}
        <div className="space-y-10 lg:col-span-2">
          {/* Profile Section */}
          <section className="space-y-3">
            <h2 className="text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-extrabold text-balance">
              <Sparkles size={16} className="text-accent" />
              {activeCv.profile.title}
            </h2>
            <p className="text-muted font-body text-sm leading-relaxed text-pretty">
              {activeCv.profile.text}
            </p>
          </section>

          {/* Experience Section */}
          <section className="space-y-4">
            <h2 className="text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-extrabold text-balance">
              <Briefcase size={16} className="text-accent" />
              {activeCv.experience.title}
            </h2>
            <div className="space-y-6">
              {activeCv.experience.items.map((job) => (
                <div
                  key={`${job.company}-${job.role}`}
                  className="before:bg-stroke/60 relative pl-6 before:absolute before:top-1.5 before:bottom-0 before:left-1.5 before:w-px"
                >
                  {/* Timeline Bullet */}
                  <div className="border-accent bg-bg absolute top-1 left-0 z-10 size-3.5 rounded-full border-2 shadow-sm" />

                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-text-primary text-sm leading-tight font-semibold text-balance">
                        {job.role}
                      </h3>
                      <p className="text-muted text-xs text-pretty">
                        {job.company}
                      </p>
                    </div>
                    <span className="text-accent bg-accent/5 border-accent/15 rounded-xl border px-2 py-0.5 text-xs uppercase tabular-nums">
                      {job.period}
                    </span>
                  </div>
                  <ul className="mt-3 list-none space-y-2">
                    {job.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="text-muted/90 flex items-start gap-2 text-xs leading-relaxed text-pretty"
                      >
                        <span className="bg-accent/60 mt-1.5 size-1.5 flex-shrink-0 rounded-full" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Education Section */}
          <section className="space-y-4">
            <h2 className="text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-lg font-extrabold text-balance">
              <GraduationCap size={16} className="text-accent" />
              {activeCv.education.title}
            </h2>
            <div className="space-y-6">
              {activeCv.education.items.map((edu) => (
                <div
                  key={`${edu.school}-${edu.degree}`}
                  className="before:bg-stroke/60 relative pl-6 before:absolute before:top-1.5 before:bottom-0 before:left-1.5 before:w-px last:before:hidden"
                >
                  {/* Timeline Bullet */}
                  <div className="border-accent bg-bg absolute top-1 left-0 z-10 size-3.5 rounded-full border-2" />

                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-text-primary text-sm leading-tight font-semibold text-balance">
                        {edu.degree}
                      </h3>
                      <p className="text-muted text-xs text-pretty">
                        {edu.school}
                      </p>
                    </div>
                    <span className="text-muted rounded-xl bg-white/5 px-2 py-0.5 font-mono text-xs tabular-nums">
                      {edu.period}
                    </span>
                  </div>

                  {/* Bachelor's Thesis Detail Block */}
                  {edu.details ? (
                    <div className="mt-3 rounded-lg border border-white/5 bg-white/5 p-3.5">
                      <p className="text-text-primary mb-2 flex items-center gap-1.5 text-xs font-semibold text-balance">
                        <span className="bg-accent h-3 w-1 rounded" />
                        {edu.details.thesisTitle}
                      </p>
                      <ul className="list-none space-y-1.5">
                        {edu.details.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="text-muted flex items-start gap-1.5 text-xs text-pretty"
                          >
                            <span className="text-accent mt-0.5 flex-shrink-0">
                              •
                            </span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Skills & Languages */}
        <div className="space-y-8">
          {/* Skills Block */}
          <div className="space-y-6 rounded-2xl border border-white/5 bg-white/5 p-5">
            <h2 className="text-text-primary/90 flex items-center gap-2 border-b border-white/5 pb-2 text-sm font-extrabold text-balance uppercase">
              <Globe size={14} className="text-accent" />
              {activeCv.skills.title}
            </h2>

            <div className="space-y-4">
              {activeCv.skills.categories.map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <h3 className="text-accent text-xs font-semibold text-balance uppercase">
                    {cat.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((skill) => (
                      <span
                        key={skill}
                        className="text-muted/95 hover:text-text-primary rounded-xl border border-white/5 bg-white/5 px-2 py-1 text-xs transition-[background-color,color] select-none hover:bg-white/[0.08]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Languages Block */}
          <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-5">
            <h2 className="text-text-primary/90 flex items-center gap-2 border-b border-white/5 pb-2 text-sm font-extrabold text-balance uppercase">
              <Languages size={14} className="text-accent" />
              {activeCv.languages.title}
            </h2>

            <div className="space-y-2.5">
              {activeCv.languages.items.map((langItem) => (
                <div
                  key={langItem.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-text-primary font-normal">
                    {langItem.name}
                  </span>
                  <span className="text-accent bg-accent/10 border-accent/10 rounded-xl border px-2 py-0.5 font-mono text-xs font-semibold">
                    {langItem.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Warning Notice */}
          {isMobile ? (
            <div className="border-accent/20 bg-accent/5 space-y-2 rounded-lg border p-4 text-center">
              <p className="text-muted text-xs text-pretty">
                PDF view is optimized for desktop viewports. To read the
                official document, you can open or download the PDF below.
              </p>
              <a
                href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-text-primary inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
              >
                <ExternalLink size={12} />
                Open PDF Document
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

function PdfViewerModal({ isOpen, onClose }: PdfViewerModalProps) {
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

  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(
      () => dispatch({ type: "SET_IS_TRANSITIONING", transitioning: false }),
      500,
    );
    return () => clearTimeout(timer);
  }, [isTransitioning]);

  const prefersReducedMotion = useReducedMotion();

  const activeCv = useMemo(() => CV_DATA[lang], [lang]);

  if (typeof document === "undefined") return null;

  return (
    <Dialog.Root
      open={isOpen}
      modal
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal keepMounted>
        <AnimatePresence>
          {isOpen ? (
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
                    {/* Title, Avatar & Mobile Action Buttons (Visible only on mobile next to title) */}
                    <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
                      {/* Title & Avatar */}
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

                      {/* Mobile Action Buttons (Right side on mobile) */}
                      <div className="flex items-center gap-2.5 sm:hidden">
                        {/* Download Direct */}
                        <LiquidGlassButton
                          href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                          download="Ondrej_Michal_Ockaj_CV.pdf"
                          className="size-11 p-3"
                          ariaLabel="Download PDF CV"
                        >
                          <Download size={15} className="text-text-primary" />
                        </LiquidGlassButton>

                        {/* Close Button */}
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

                    {/* Tab Selector — Navbar-style sliding highlight blob (Desktop only) */}
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

                    {/* Desktop Action Buttons (Hidden on mobile) */}
                    <div className="hidden items-center gap-2 sm:flex">
                      {/* Download Direct */}
                      <LiquidGlassButton
                        href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                        download="Ondrej_Michal_Ockaj_CV.pdf"
                        className="size-11 p-3"
                        ariaLabel="Download PDF CV"
                      >
                        <Download size={14} className="text-text-primary" />
                      </LiquidGlassButton>

                      {/* Open in New Tab */}
                      <LiquidGlassButton
                        href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-11 p-3"
                        ariaLabel="Open CV PDF in new tab"
                      >
                        <ExternalLink size={14} className="text-text-primary" />
                      </LiquidGlassButton>

                      {/* Close Button */}
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
                      {activeTab === "pdf" && (
                        <>
                          {pdfLoading ? (
                            <div className="bg-bg/80 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
                              <Loader2
                                className="text-accent animate-spin"
                                size={32}
                              />
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
                                Your browser does not support PDF viewing
                                in-page.
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
                      )}
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
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default memo(PdfViewerModal);
