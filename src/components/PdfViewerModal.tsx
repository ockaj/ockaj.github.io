import { useEffect, useCallback, useMemo, memo, useReducer } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  Variants,
} from "motion/react";
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
import { useOverlay } from "../hooks/useOverlay";
import { prefetchAsset } from "../utils/quicklink";
import { cn } from "../utils/cn";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}
import { CV_DATA, type CvDataLanguageSection } from "../data/cvData";

const modalVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    opacity: 0,
    scale: custom.prefersReducedMotion ? 1 : custom.isMobile ? 0.96 : 0.95,
    y: custom.prefersReducedMotion ? 0 : 15,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : custom.isMobile
        ? SPRING.modalMobile
        : {
            type: "tween" as const,
            duration: 0.18,
            ease: [0.25, 0.1, 0.25, 1] as const,
          },
  }),
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : custom.isMobile
        ? SPRING.modalMobile
        : SPRING.modal,
  }),
};

const WHITESPACE_REGEX = /\s+/g;

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
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      {/* CV Heading Card */}
      <div className="relative p-6 md:p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-accent/5 to-transparent z-0" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-accent uppercase font-semibold bg-accent/10 px-2 py-0.5 rounded-xl">
              {lang === "en" ? "Active Resume" : "Aktívny Životopis"}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display text-text-primary mb-1 text-balance">
            {activeCv.title}
          </h1>
          <p className="text-sm font-normal text-text-primary/95 font-body text-pretty">
            {activeCv.role}
          </p>

          {/* Contacts */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-muted tabular-nums">
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
            {activeCv.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={12} className="text-accent/65" />
                {/^[+\d]/.test(activeCv.phone) ? (
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
            )}
          </div>
        </div>

        {/* Language Toggler */}
        <div className="relative z-10 self-start md:self-auto flex items-center gap-1.5">
          <LiquidGlassButton
            onClick={() => dispatch({ type: "SET_LANG", lang: "en" })}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold flex items-center gap-1",
              lang === "en" ? "text-accent" : "text-muted",
            )}
          >
            <Languages size={11} />
            EN
          </LiquidGlassButton>
          <LiquidGlassButton
            onClick={() => dispatch({ type: "SET_LANG", lang: "sk" })}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold flex items-center gap-1",
              lang === "sk" ? "text-accent" : "text-muted",
            )}
          >
            <Languages size={11} />
            SK
          </LiquidGlassButton>
        </div>
      </div>

      {/* Main Content Grid (Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Summary, Experience, Education */}
        <div className="lg:col-span-2 space-y-10">
          {/* Profile Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-balance">
              <Sparkles size={16} className="text-accent" />
              {activeCv.profile.title}
            </h2>
            <p className="text-sm text-muted leading-relaxed font-body text-pretty">
              {activeCv.profile.text}
            </p>
          </section>

          {/* Experience Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-balance">
              <Briefcase size={16} className="text-accent" />
              {activeCv.experience.title}
            </h2>
            <div className="space-y-6">
              {activeCv.experience.items.map((job) => (
                <div
                  key={`${job.company}-${job.role}`}
                  className="relative pl-6 before:absolute before:left-1.5 before:top-1.5 before:bottom-0 before:w-px before:bg-stroke/60"
                >
                  {/* Timeline Bullet */}
                  <div className="absolute left-0 top-1 size-3.5 rounded-full border-2 border-accent bg-bg z-10 shadow-sm" />

                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary leading-tight text-balance">
                        {job.role}
                      </h3>
                      <p className="text-xs text-muted text-pretty">
                        {job.company}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase text-accent bg-accent/5 px-2 py-0.5 rounded-xl border border-accent/15 tabular-nums">
                      {job.period}
                    </span>
                  </div>
                  <ul className="space-y-2 mt-3 list-none">
                    {job.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="text-xs text-muted/90 flex items-start gap-2 leading-relaxed text-pretty"
                      >
                        <span className="size-1.5 rounded-full bg-accent/60 flex-shrink-0 mt-1.5" />
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
            <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2 border-b border-white/5 pb-2 text-balance">
              <GraduationCap size={16} className="text-accent" />
              {activeCv.education.title}
            </h2>
            <div className="space-y-6">
              {activeCv.education.items.map((edu) => (
                <div
                  key={`${edu.school}-${edu.degree}`}
                  className="relative pl-6 before:absolute before:left-1.5 before:top-1.5 before:bottom-0 before:w-px before:bg-stroke/60 last:before:hidden"
                >
                  {/* Timeline Bullet */}
                  <div className="absolute left-0 top-1 size-3.5 rounded-full border-2 border-accent bg-bg z-10" />

                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary leading-tight text-balance">
                        {edu.degree}
                      </h3>
                      <p className="text-xs text-muted text-pretty">
                        {edu.school}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted font-mono bg-white/5 px-2 py-0.5 rounded-xl tabular-nums">
                      {edu.period}
                    </span>
                  </div>

                  {/* Bachelor's Thesis Detail Block */}
                  {edu.details ? (
                    <div className="mt-3 p-3.5 rounded-lg border border-white/5 bg-white/5">
                      <p className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5 text-balance">
                        <span className="w-1 h-3 rounded bg-accent" />
                        {edu.details.thesisTitle}
                      </p>
                      <ul className="space-y-1.5 list-none">
                        {edu.details.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="text-[11px] text-muted flex items-start gap-1.5 text-pretty"
                          >
                            <span className="text-accent flex-shrink-0 mt-0.5">
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
          <div className="p-5 rounded-2xl border border-white/5 bg-white/5 space-y-6">
            <h2 className="text-sm font-extrabold uppercase text-text-primary/90 flex items-center gap-2 pb-2 border-b border-white/5 text-balance">
              <Globe size={14} className="text-accent" />
              {activeCv.skills.title}
            </h2>

            <div className="space-y-4">
              {activeCv.skills.categories.map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase text-accent text-balance">
                    {cat.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] text-muted/95 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-xl px-2 py-1 transition-[background-color,color] select-none hover:text-text-primary"
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
          <div className="p-5 rounded-2xl border border-white/5 bg-white/5 space-y-4">
            <h2 className="text-sm font-extrabold uppercase text-text-primary/90 flex items-center gap-2 pb-2 border-b border-white/5 text-balance">
              <Languages size={14} className="text-accent" />
              {activeCv.languages.title}
            </h2>

            <div className="space-y-2.5">
              {activeCv.languages.items.map((langItem) => (
                <div
                  key={langItem.name}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="font-normal text-text-primary">
                    {langItem.name}
                  </span>
                  <span className="text-accent bg-accent/10 px-2 py-0.5 rounded-xl font-mono text-[10px] font-semibold border border-accent/10">
                    {langItem.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Warning Notice */}
          {isMobile ? (
            <div className="p-4 rounded-lg border border-accent/20 bg-accent/5 text-center space-y-2">
              <p className="text-[11px] text-muted text-pretty">
                PDF view is optimized for desktop viewports. To read the
                official document, you can open or download the PDF below.
              </p>
              <a
                href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-text-primary transition-colors font-semibold"
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
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal keepMounted>
        <AnimatePresence>
          {isOpen ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-8">
              {/* Backdrop Blur overlay */}
              <Dialog.Backdrop
                render={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-bg/80 backdrop-blur-md pointer-events-auto"
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
                    className="relative w-full h-full md:h-[85vh] md:max-w-5xl bg-surface/85 border-0 md:border md:border-white/10 rounded-none md:rounded-3xl backdrop-blur-2xl flex flex-col overflow-hidden z-10 pointer-events-auto"
                    style={{
                      boxShadow:
                        "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.6)",
                    }}
                  />
                }
              >
                <div className="w-full h-full flex flex-col">
                  {/* Specular sheen header overlay */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none bg-gradient-to-b from-white/5 to-transparent z-20" />

                  {/* Header */}
                  <div className="relative z-30 px-4 py-3 md:px-6 md:py-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Title, Avatar & Mobile Action Buttons (Visible only on mobile next to title) */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      {/* Title & Avatar */}
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-bg">
                          <img
                            src="https://avatars.githubusercontent.com/u/36997301?v=4&s=32"
                            alt="Ondrej Michal Očkaj"
                            width="32"
                            height="32"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <Dialog.Title
                            id="modal-title"
                            className="text-sm font-semibold text-text-primary leading-tight text-balance"
                          >
                            Ondrej Michal Očkaj
                          </Dialog.Title>
                          <p className="text-xs text-muted flex items-center gap-1 text-pretty">
                            <FileText size={10} className="text-accent" />
                            Curriculum Vitae
                          </p>
                        </div>
                      </div>

                      {/* Mobile Action Buttons (Right side on mobile) */}
                      <div className="flex sm:hidden items-center gap-2">
                        {/* Download Direct */}
                        <LiquidGlassButton
                          href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                          download="Ondrej_Michal_Ockaj_CV.pdf"
                          className="p-3 size-11"
                          ariaLabel="Download PDF CV"
                        >
                          <Download size={14} className="text-text-primary" />
                        </LiquidGlassButton>

                        {/* Open in New Tab */}
                        <LiquidGlassButton
                          href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 size-11"
                          ariaLabel="Open CV PDF in new tab"
                        >
                          <ExternalLink
                            size={14}
                            className="text-text-primary"
                          />
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
                      onMouseEnter={() =>
                        dispatch({ type: "SET_IS_HOVERED", hovered: true })
                      }
                      onMouseLeave={() =>
                        dispatch({ type: "SET_IS_HOVERED", hovered: false })
                      }
                      highlightClassName={
                        isHovered || isTransitioning
                          ? "navbar-highlight-active"
                          : "navbar-highlight-flat"
                      }
                      className="flex items-center gap-0.5 bg-white/[0.03] p-2 rounded-full border border-white/5 overflow-hidden isolate [transform:translateZ(0)]"
                    >
                      <Tab
                        value="pdf"
                        aria-controls="tabpanel-pdf"
                        className={cn(
                          "relative text-xs font-semibold rounded-full px-4 py-2 select-none z-10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
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
                          "relative text-xs font-semibold rounded-full px-4 py-2 select-none z-10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
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
                    <div className="hidden sm:flex items-center gap-2">
                      {/* Download Direct */}
                      <LiquidGlassButton
                        href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                        download="Ondrej_Michal_Ockaj_CV.pdf"
                        className="p-3 size-11"
                        ariaLabel="Download PDF CV"
                      >
                        <Download size={14} className="text-text-primary" />
                      </LiquidGlassButton>

                      {/* Open in New Tab */}
                      <LiquidGlassButton
                        href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 size-11"
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
                  <div className="flex-1 overflow-hidden relative bg-bg/40">
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/80 z-20">
                              <Loader2
                                className="animate-spin text-accent"
                                size={32}
                              />
                              <p className="text-xs text-muted">
                                Loading PDF Document…
                              </p>
                            </div>
                          ) : null}
                          <object
                            data="/cv/Ondrej_Michal_Ockaj_CV.pdf#toolbar=0&navpanes=0&scrollbar=1"
                            type="application/pdf"
                            className="w-full h-full border-0 relative z-10"
                            title="Ondrej Michal Ockaj CV"
                            onLoad={() =>
                              dispatch({
                                type: "SET_PDF_LOADING",
                                loading: false,
                              })
                            }
                          >
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/85 z-20 p-4 text-center">
                              <p className="text-sm text-muted">
                                Your browser does not support PDF viewing
                                in-page.
                              </p>
                              <a
                                href="/cv/Ondrej_Michal_Ockaj_CV.pdf"
                                download
                                className="px-4 py-2 rounded-full bg-accent text-bg hover:bg-accent-hover text-xs font-semibold transition-colors duration-200"
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
                          ? "absolute inset-0 overflow-y-auto custom-cv-scrollbar p-6 md:p-8 lg:p-12"
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
