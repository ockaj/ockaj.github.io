import { lazy } from "react";
import { makePreloadable } from "./utils/preloadable";

export const loadCaseStudies = makePreloadable(
  () => import("./components/CaseStudies/CaseStudies.tsx"),
);
export const loadSkills = makePreloadable(
  () => import("./components/Skills.tsx"),
);
export const loadProcessLibrary = makePreloadable(
  () => import("./components/ProcessLibrary.tsx"),
);
export const loadJournal = makePreloadable(
  () => import("./components/Journal/Journal.tsx"),
);
export const loadFaq = makePreloadable(
  () => import("./components/Faq/Faq.tsx"),
);
export const loadPdfViewerModal = makePreloadable(
  () => import("./components/PdfViewerModal.tsx"),
);
export const loadBpmnOverlay = makePreloadable(
  () => import("./components/BpmnOverlay.tsx"),
);

export const CaseStudies = lazy(loadCaseStudies.load);
export const Skills = lazy(loadSkills.load);
export const ProcessLibrary = lazy(loadProcessLibrary.load);
export const Journal = lazy(loadJournal.load);
export const Faq = lazy(loadFaq.load);
export const PdfViewerModal = lazy(loadPdfViewerModal.load);
export const BpmnOverlay = lazy(loadBpmnOverlay.load);
